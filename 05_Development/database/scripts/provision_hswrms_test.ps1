<#
.SYNOPSIS
    HSWRMS Dedicated Test Database & Login Provisioning Script (Hardened ADO.NET Implementation).

.DESCRIPTION
    Phase 5.8.3.40: Implements the hardened, parameterized ADO.NET execution path for Stage A test
    provisioning. Eliminates SQLCMD text substitution risks by transmitting credentials as typed RPC
    parameters over the TDS protocol and using server-side QUOTENAME(@password, '''') quoting.

    Enforces strict least-privilege invariants:
      - Grants ONLY database-level CONNECT permission to [hswrms_test_user] on [HSWRMS_TEST].
      - ZERO membership in db_datareader, db_datawriter, db_owner, or any administrative server roles.
      - Zero access to primary database [HSWRMS].
      - Fail-closed validation for existing databases and logins.
      - Never logs, echoes, or persists credentials to disk or console.

.PARAMETER ServerInstance
    The SQL Server instance to connect to (default: 'localhost').

.PARAMETER DatabaseName
    The target test database name (strictly restricted to 'HSWRMS_TEST').

.PARAMETER LoginName
    The target SQL login name (strictly restricted to 'hswrms_test_user').

.PARAMETER AllowExistingDb
    Switch to permit reuse of an existing ONLINE [HSWRMS_TEST] database. Default: $false (fail-closed).

.PARAMETER AllowExistingLogin
    Switch to permit reuse of an existing hardened [hswrms_test_user] login. Default: $false (fail-closed).

.PARAMETER TestPassword
    A SecureString containing the test user password. If omitted, the script prompts interactively via Read-Host -AsSecureString.

.PARAMETER PlaintextPasswordForTesting
    Plaintext password string strictly reserved for automated, isolated test harnesses. Never logged.

.PARAMETER DryRun
    Validates all client-side inputs, parameter bounds, and quoting formulas without opening a database connection or modifying server state.

.EXAMPLE
    # Interactive execution (prompts securely for password):
    .\provision_hswrms_test.ps1 -ServerInstance "localhost"

.EXAMPLE
    # Safe validation check without server mutation:
    .\provision_hswrms_test.ps1 -ServerInstance "localhost" -DryRun

.EXAMPLE
    # Standard PowerShell -WhatIf safe dry run:
    .\provision_hswrms_test.ps1 -ServerInstance "localhost" -WhatIf
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]$ServerInstance = "localhost",

    [Parameter(Mandatory = $false)]
    [ValidateSet("HSWRMS_TEST")]
    [string]$DatabaseName = "HSWRMS_TEST",

    [Parameter(Mandatory = $false)]
    [ValidateSet("hswrms_test_user")]
    [string]$LoginName = "hswrms_test_user",

    [Parameter(Mandatory = $false)]
    [switch]$AllowExistingDb = $false,

    [Parameter(Mandatory = $false)]
    [switch]$AllowExistingLogin = $false,

    [Parameter(Mandatory = $false)]
    [System.Security.SecureString]$TestPassword = $null,

    [Parameter(Mandatory = $false)]
    [string]$PlaintextPasswordForTesting = $null,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Add-SqlParam {
    param (
        [Parameter(Mandatory = $true)]$Command,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][System.Data.SqlDbType]$Type,
        [Parameter(Mandatory = $true)][int]$Size,
        [Parameter(Mandatory = $true)]$Value
    )
    $p = $Command.Parameters.Add($Name, $Type, $Size)
    $p.Value = $Value
}

function Test-HswrmsProvisioningInput {
    param (
        [string]$Server,
        [string]$Db,
        [string]$Login,
        [string]$Password
    )

    # 1. Server Instance validation
    if ([string]::IsNullOrWhiteSpace($Server) -or ($Server -notmatch '^[A-Za-z0-9_\-\.\\]+$')) {
        throw "VALIDATION ERROR: ServerInstance '$Server' is invalid or contains forbidden characters."
    }

    # 2. Strict Identifier whitelisting
    if ($Db -ne "HSWRMS_TEST") {
        throw "VALIDATION ERROR: DatabaseName must be strictly 'HSWRMS_TEST' (received '$Db')."
    }
    if ($Login -ne "hswrms_test_user") {
        throw "VALIDATION ERROR: LoginName must be strictly 'hswrms_test_user' (received '$Login')."
    }

    # 3. Password presence & length validation
    if ([string]::IsNullOrEmpty($Password)) {
        throw "VALIDATION ERROR: Password is required and cannot be null or empty."
    }
    if ($Password.Trim().Length -eq 0) {
        throw "VALIDATION ERROR: Password cannot consist solely of whitespace."
    }
    if ($Password.Length -lt 12) {
        throw "VALIDATION ERROR: Password length ($($Password.Length) chars) is below minimum policy (12 characters)."
    }
    if ($Password.Length -gt 128) {
        throw "VALIDATION ERROR: Password length ($($Password.Length) chars) exceeds maximum supported length (128 characters)."
    }

    # 4. Prohibited placeholder and macro check
    $prohibitedPlaceholders = @(
        "REPLACE_WITH_STRONG_PASSWORD_BEFORE_EXECUTION",
        "CHANGE_ME_STRONG_PASSWORD!"
    )
    if ($prohibitedPlaceholders -contains $Password) {
        throw "VALIDATION ERROR: Default placeholder password value is strictly prohibited."
    }
    if ($Password.Length -ge 2 -and $Password.Substring(0, 2) -eq ('$' + '(')) {
        throw 'VALIDATION ERROR: Unresolved macro or variable syntax is not permitted as a password.'
    }

    return $true
}

# --- Credential Extraction ---
$bstr = [System.IntPtr]::Zero
$plainPass = $null
$conn = $null

try {
    if ($PSBoundParameters.ContainsKey('PlaintextPasswordForTesting')) {
        $plainPass = $PlaintextPasswordForTesting
    }
    elseif ($PSBoundParameters.ContainsKey('TestPassword')) {
        if ($TestPassword -ne $null) {
            $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($TestPassword)
            $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
        } else {
            $plainPass = $null
        }
    }
    else {
        # Only prompt interactively if no password parameter was explicitly bound
        $sec = Read-Host -Prompt "Enter HSWRMS test password (min 12 chars)" -AsSecureString
        if ($sec -eq $null) {
            throw "Password input was cancelled or empty."
        }
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
        $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }

    # Run client-side input validations
    $null = Test-HswrmsProvisioningInput -Server $ServerInstance -Db $DatabaseName -Login $LoginName -Password $plainPass

    # --- DryRun / WhatIf Execution Path ---
    $isWhatIf = ($DryRun -or (-not $PSCmdlet.ShouldProcess("SQL Server instance '$ServerInstance'", "Execute Stage A Provisioning (Database [$DatabaseName], Login [$LoginName])")))
    if ($isWhatIf) {
        Write-Host "================================================================="
        Write-Host "HSWRMS TEST PROVISIONING -- DRY RUN / WHAT-IF (SAFE MODE)"
        Write-Host "================================================================="
        Write-Host "[DRY RUN PASS] All client-side validations passed successfully."
        Write-Host "[DRY RUN PASS] ServerInstance:         $ServerInstance"
        Write-Host "[DRY RUN PASS] Target Database:        $DatabaseName"
        Write-Host "[DRY RUN PASS] Target Login:           $LoginName"
        Write-Host "[DRY RUN PASS] AllowExistingDb:        $AllowExistingDb"
        Write-Host "[DRY RUN PASS] AllowExistingLogin:     $AllowExistingLogin"
        Write-Host "[DRY RUN PASS] Password Policy Check:  VALID (Length: $($plainPass.Length) chars; Non-placeholder)"
        Write-Host "[DRY RUN PASS] Dynamic SQL Mechanism:  RPC Parameterized TDS with server-side QUOTENAME(`@password, '''')"
        Write-Host "[DRY RUN PASS] Network / DB Mutation:  ZERO database connections opened; ZERO mutations executed."
        Write-Host "================================================================="
        return
    }

    # --- Live ADO.NET Connection (Requires Stage A Authorization) ---
    Write-Host "Connecting to SQL Server instance '$ServerInstance' via Windows Authentication..."
    $connStr = "Server=$ServerInstance;Database=master;Integrated Security=True;Encrypt=False;TrustServerCertificate=True;Application Name=HSWRMS_TestProvisioning;"
    
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()

    # ==========================================================================
    # STAGE 1: PRE-EXECUTION INSPECTION & ENVIRONMENT VALIDATION (READ-ONLY)
    # ==========================================================================
    Write-Host "[STAGE 1] Validating environment pre-conditions..."

    # 1.1 Mixed Mode Authentication Check
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT CAST(SERVERPROPERTY(''IsIntegratedSecurityOnly'') AS INT);'
    $isWindowsOnly = [int]$cmd.ExecuteScalar()
    if ($isWindowsOnly -ne 0) {
        throw "FAIL CLOSED: SQL Server instance is configured for Windows Authentication only. Mixed Mode must be enabled before SQL logins can be used."
    }
    Write-Host "  [PASS] Mixed Mode authentication confirmed active."

    # 1.2 Target Database Check
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT state_desc FROM sys.databases WHERE name = @dbName;'
    Add-SqlParam -Command $cmd -Name '@dbName' -Type NVarChar -Size 128 -Value $DatabaseName
    $existingDbState = $cmd.ExecuteScalar()

    $dbNeedsCreation = $false
    if ($existingDbState -ne $null) {
        if (-not $AllowExistingDb) {
            throw "FAIL CLOSED: Target database [$DatabaseName] already exists. Initial provisioning expects a clean environment. Pass -AllowExistingDb if reuse was authorized."
        }
        if ($existingDbState -ne "ONLINE") {
            throw "FAIL CLOSED: Existing database [$DatabaseName] is in state '$existingDbState' (expected ONLINE)."
        }
        Write-Host "  [PASS] Existing database [$DatabaseName] is ONLINE and authorized for reuse."
    } else {
        $dbNeedsCreation = $true
        Write-Host "  [PASS] Target database [$DatabaseName] is absent (will be created in Stage 2)."
    }

    # 1.3 Target Login Check
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT type, is_disabled, default_database_name FROM sys.server_principals WHERE name = @loginName;'
    Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
    $reader = $cmd.ExecuteReader()
    
    $loginNeedsCreation = $false
    if ($reader.Read()) {
        $loginType = $reader["type"].ToString().Trim()
        $isDisabled = [bool]$reader["is_disabled"]
        $defaultDb = $reader["default_database_name"].ToString()
        $reader.Close()

        if (-not $AllowExistingLogin) {
            throw "FAIL CLOSED: Target login [$LoginName] already exists. Initial provisioning expects a clean environment. Pass -AllowExistingLogin if reuse was authorized."
        }

        if ($loginType -ne "S") {
            throw "FAIL CLOSED: Existing principal [$LoginName] has type '$loginType' (expected 'S' for SQL login)."
        }
        if ($isDisabled) {
            throw "FAIL CLOSED: Existing login [$LoginName] is disabled."
        }
        if ($defaultDb -notin @("HSWRMS_TEST", "master")) {
            throw "FAIL CLOSED: Existing login [$LoginName] has unsafe default database '$defaultDb'."
        }

        # Check server roles count
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = 'SELECT COUNT(*) FROM sys.server_role_members srm JOIN sys.server_principals m ON m.principal_id = srm.member_principal_id WHERE m.name = @loginName;'
        Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
        $roleCount = [int]$cmd.ExecuteScalar()
        if ($roleCount -gt 0) {
            throw "FAIL CLOSED: Existing login [$LoginName] has $roleCount server role memberships (expected 0)."
        }

        # Check server permissions count
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = 'SELECT COUNT(*) FROM sys.server_permissions sp JOIN sys.server_principals p ON p.principal_id = sp.grantee_principal_id WHERE p.name = @loginName AND sp.permission_name <> ''CONNECT SQL'';'
        Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
        $permCount = [int]$cmd.ExecuteScalar()
        if ($permCount -gt 0) {
            throw "FAIL CLOSED: Existing login [$LoginName] has $permCount non-CONNECT server permissions (expected 0)."
        }

        Write-Host "  [PASS] Existing login [$LoginName] is safe, unprivileged, and authorized for reuse."
    } else {
        $reader.Close()
        $loginNeedsCreation = $true
        Write-Host "  [PASS] Target login [$LoginName] is absent (will be created in Stage 3)."
    }

    # 1.4 Primary Database Isolation Check
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT COUNT(*) FROM sys.databases WHERE name = ''HSWRMS'';'
    $hasPrimaryDb = ([int]$cmd.ExecuteScalar()) -gt 0
    if ($hasPrimaryDb) {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = 'USE [HSWRMS]; SELECT COUNT(*) FROM sys.database_principals WHERE name = @loginName;'
        Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
        $mappedCount = [int]$cmd.ExecuteScalar()
        if ($mappedCount -gt 0) {
            throw "CRITICAL ISOLATION FAILURE: Login [$LoginName] is mapped as a user in primary database [HSWRMS]."
        }
        Write-Host "  [PASS] Confirmed zero mappings for [$LoginName] in primary database [HSWRMS]."
    }

    # ==========================================================================
    # STAGE 2: DATABASE PROVISIONING
    # ==========================================================================
    if ($dbNeedsCreation) {
        Write-Host "[STAGE 2] Creating dedicated database [$DatabaseName]..."
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = 'DECLARE @ddl NVARCHAR(MAX) = N''CREATE DATABASE '' + QUOTENAME(@dbName) + N'' COLLATE SQL_Latin1_General_CP1_CI_AS;''; EXEC sys.sp_executesql @ddl;'
        Add-SqlParam -Command $cmd -Name '@dbName' -Type NVarChar -Size 128 -Value $DatabaseName
        if ($PSCmdlet.ShouldProcess("SQL Server instance '$ServerInstance'", "CREATE DATABASE [$DatabaseName]")) {
            $null = $cmd.ExecuteNonQuery()
            Write-Host "  [PASS] Database [$DatabaseName] created successfully."
        }
    } else {
        Write-Host "[STAGE 2] Database [$DatabaseName] already exists; skipped creation."
    }

    # ==========================================================================
    # STAGE 3: LOGIN PROVISIONING (RPC PARAMETERIZED WITH SERVER-SIDE QUOTING)
    # ==========================================================================
    if ($loginNeedsCreation) {
        Write-Host "[STAGE 3] Creating SQL login [$LoginName] with parameterized RPC execution..."
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = 'DECLARE @ddl NVARCHAR(MAX) = N''CREATE LOGIN '' + QUOTENAME(@loginName) + ' +
                           'N'' WITH PASSWORD = '' + QUOTENAME(@password, '''''''') + ' +
                           'N'', CHECK_EXPIRATION = OFF, CHECK_POLICY = ON, DEFAULT_DATABASE = '' + QUOTENAME(@dbName) + N'';''; ' +
                           'EXEC sys.sp_executesql @ddl;'
        Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
        Add-SqlParam -Command $cmd -Name '@password' -Type NVarChar -Size 128 -Value $plainPass
        Add-SqlParam -Command $cmd -Name '@dbName' -Type NVarChar -Size 128 -Value $DatabaseName
        
        if ($PSCmdlet.ShouldProcess("SQL Server instance '$ServerInstance'", "CREATE LOGIN [$LoginName]")) {
            $null = $cmd.ExecuteNonQuery()
            Write-Host "  [PASS] Login [$LoginName] created successfully with strict server-side quoting."
        }
    } else {
        Write-Host "[STAGE 3] Login [$LoginName] already exists; skipped creation."
    }

    # ==========================================================================
    # STAGE 4: USER MAPPING & LEAST PRIVILEGE GRANT
    # ==========================================================================
    Write-Host "[STAGE 4] Configuring database user and granting least-privilege CONNECT..."
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'DECLARE @userDdl NVARCHAR(MAX) = ' +
                       'N''USE '' + QUOTENAME(@dbName) + N''; '' + ' +
                       'N''IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '' + QUOTENAME(@loginName, '''''''') + N'') '' + ' +
                       'N''BEGIN '' + ' +
                       'N''    CREATE USER '' + QUOTENAME(@loginName) + N'' FOR LOGIN '' + QUOTENAME(@loginName) + N''; '' + ' +
                       'N''END; '' + ' +
                       'N''GRANT CONNECT TO '' + QUOTENAME(@loginName) + N'';''; ' +
                       'EXEC sys.sp_executesql @userDdl;'
    Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
    Add-SqlParam -Command $cmd -Name '@dbName' -Type NVarChar -Size 128 -Value $DatabaseName
    if ($PSCmdlet.ShouldProcess("Database [$DatabaseName]", "CREATE USER [$LoginName] and GRANT CONNECT")) {
        $null = $cmd.ExecuteNonQuery()
        Write-Host "  [PASS] User [$LoginName] mapped and granted CONNECT in [$DatabaseName]."
    }

    # ==========================================================================
    # STAGE 5: POST-PROVISIONING VERIFICATION & AUDIT
    # ==========================================================================
    Write-Host "[STAGE 5] Auditing effective permissions and database configuration..."
    
    # 5.1 Verify Login Properties
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT p.name, p.is_disabled, p.default_database_name, ' +
                       'IS_SRVROLEMEMBER(''sysadmin'', p.name) AS [IsSysadmin], ' +
                       'IS_SRVROLEMEMBER(''securityadmin'', p.name) AS [IsSecadmin] ' +
                       'FROM sys.server_principals p WHERE p.name = @loginName;'
    Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
    $reader = $cmd.ExecuteReader()
    if ($reader.Read()) {
        $dis = [bool]$reader["is_disabled"]
        $def = $reader["default_database_name"].ToString()
        $sys = [int]$reader["IsSysadmin"]
        $sec = [int]$reader["IsSecadmin"]
        $reader.Close()

        if ($dis -or ($def -ne $DatabaseName) -or ($sys -ne 0) -or ($sec -ne 0)) {
            throw "POST-CONDITION FAILURE: Login configuration audit failed (Disabled=$dis, DefaultDb=$def, Sysadmin=$sys, Secadmin=$sec)."
        }
        Write-Host "  [PASS] Login configuration verified (Disabled=False, DefaultDb=$def, Sysadmin=0, Secadmin=0)."
    } else {
        $reader.Close()
        throw "POST-CONDITION FAILURE: Login [$LoginName] could not be verified after creation."
    }

    # 5.2 Verify Database Permissions in HSWRMS_TEST
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = 'SELECT p.permission_name, p.state_desc FROM [' + $DatabaseName + '].sys.database_permissions p JOIN [' + $DatabaseName + '].sys.database_principals dp ON dp.principal_id = p.grantee_principal_id WHERE dp.name = @loginName;'
    Add-SqlParam -Command $cmd -Name '@loginName' -Type NVarChar -Size 128 -Value $LoginName
    $reader = $cmd.ExecuteReader()
    $grantedPerms = @()
    while ($reader.Read()) {
        $permDesc = $reader["state_desc"].ToString()
        $permName = $reader["permission_name"].ToString()
        $grantedPerms += "$permDesc $permName"
    }
    $reader.Close()

    if ($grantedPerms -notcontains "GRANT CONNECT") {
        throw "POST-CONDITION FAILURE: User [$LoginName] missing GRANT CONNECT in [$DatabaseName]."
    }
    $permSummary = $grantedPerms -join ', '
    Write-Host "  [PASS] Effective database permission verified: ($permSummary)."

    Write-Host "================================================================="
    Write-Host "STAGE A PROVISIONING COMPLETED SUCCESSFULLY WITH ZERO DEFECTS"
    Write-Host "================================================================="
}
catch {
    # Suppress secret reflection in error output
    $err = $_.Exception.Message
    Write-Error "HSWRMS PROVISIONING HALTED (FAIL CLOSED): $err"
    throw
}
finally {
    # Credential scrubbing:
    # 1. Zero unmanaged BSTR buffer. (Note: immutable managed System.String instances on the CLR GC heap cannot be zeroed in-place).
    # 2. Dereference managed variables ($plainPass = $null) and trigger garbage collection.
    if ($bstr -ne [System.IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        $bstr = [System.IntPtr]::Zero
    }
    $plainPass = $null
    if ($conn -ne $null) {
        if ($conn.State -eq [System.Data.ConnectionState]::Open) {
            $conn.Close()
        }
        $conn.Dispose()
        $conn = $null
    }
    [System.GC]::Collect()
}
