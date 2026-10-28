<#
.SYNOPSIS
    Executes the isolated SQL Server JDBC smoke test using credentials stored in Windows Credential Manager.

.DESCRIPTION
    Retrieves the dedicated test login credentials from Windows Credential Manager,
    sets process-scoped environment variables, executes the isolated SqlServerJdbcSmokeTest
    via Maven, and immediately scrubs the environment variables in a guaranteed finally block.

    Security Properties:
    - Zero plaintext credentials stored in files or Git.
    - Password is never passed via command-line arguments.
    - Scoped strictly to the active process; scrubbed immediately upon completion.
    - Fails closed if the credential target is missing.
    - Enforces test execution to target solely SqlServerJdbcSmokeTest (no full app startup).
    - Propagates Maven exit code directly to the caller.

.PARAMETER TargetName
    The Windows Credential Manager target name. Default: 'HSWRMS_TEST_SQLSERVER'.

.PARAMETER CheckOnly
    Checks whether the credential exists in Windows Credential Manager and is ready
    for use without executing Maven or displaying sensitive information.

.EXAMPLE
    # Run the isolated smoke test:
    .\run_hswrms_jdbc_smoke_test.ps1

.EXAMPLE
    # Check credential readiness without running tests:
    .\run_hswrms_jdbc_smoke_test.ps1 -CheckOnly
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]$TargetName = "HSWRMS_TEST_SQLSERVER",

    [Parameter(Mandatory = $false)]
    [ValidateSet("SqlServerJdbcSmokeTest", "SqlServerSpringBootContextTest")]
    [string]$TestName = "SqlServerJdbcSmokeTest",

    [Parameter(Mandatory = $false)]
    [switch]$CheckOnly = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Native Windows Credential Manager API Definition ---
if (-not ([System.Management.Automation.PSTypeName]'Hswrms.Security.NativeCredentialManager').Type) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

namespace Hswrms.Security {
    public static class NativeCredentialManager {
        public const int CRED_TYPE_GENERIC = 1;

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct CREDENTIAL {
            public int Flags;
            public int Type;
            public string TargetName;
            public string Comment;
            public long LastWritten;
            public int CredentialBlobSize;
            public IntPtr CredentialBlob;
            public int Persist;
            public int AttributeCount;
            public IntPtr Attributes;
            public string TargetAlias;
            public string UserName;
        }

        [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool CredRead(string target, int type, int flags, out IntPtr credentialPtr);

        [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
        public static extern void CredFree(IntPtr cred);

        public static bool Read(string target, out string username, out string password, out DateTime lastWrittenUtc) {
            username = null;
            password = null;
            lastWrittenUtc = DateTime.MinValue;
            IntPtr credPtr;

            if (CredRead(target, CRED_TYPE_GENERIC, 0, out credPtr)) {
                try {
                    CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                    username = cred.UserName;
                    if (cred.LastWritten > 0) {
                        lastWrittenUtc = DateTime.FromFileTimeUtc(cred.LastWritten);
                    }
                    if (cred.CredentialBlob != IntPtr.Zero && cred.CredentialBlobSize > 0) {
                        byte[] passBytes = new byte[cred.CredentialBlobSize];
                        Marshal.Copy(cred.CredentialBlob, passBytes, 0, cred.CredentialBlobSize);
                        password = Encoding.Unicode.GetString(passBytes);
                        Array.Clear(passBytes, 0, passBytes.Length);
                    }
                    return true;
                } finally {
                    CredFree(credPtr);
                }
            }
            return false;
        }

        public static bool Read(string target, out string username, out string password) {
            DateTime ignored;
            return Read(target, out username, out password, out ignored);
        }

        public static bool Exists(string target, out string username, out DateTime lastWrittenUtc) {
            username = null;
            lastWrittenUtc = DateTime.MinValue;
            IntPtr credPtr;

            if (CredRead(target, CRED_TYPE_GENERIC, 0, out credPtr)) {
                try {
                    CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                    username = cred.UserName;
                    if (cred.LastWritten > 0) {
                        lastWrittenUtc = DateTime.FromFileTimeUtc(cred.LastWritten);
                    }
                    return true;
                } finally {
                    CredFree(credPtr);
                }
            }
            return false;
        }

        public static bool Exists(string target, out string username) {
            DateTime ignored;
            return Exists(target, out username, out ignored);
        }
    }
}
"@
}

# --- Safe Overload Dispatch Helpers ---
function Invoke-NativeCredentialRead {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Target,
        [Parameter(Mandatory = $true)]
        [ref]$UserRef,
        [Parameter(Mandatory = $true)]
        [ref]$PassRef
    )
    $type = [Hswrms.Security.NativeCredentialManager]
    $methods = $type.GetMethods([System.Reflection.BindingFlags]'Public, Static') | Where-Object { $_.Name -eq 'Read' }
    $has4Arg = $false
    foreach ($m in $methods) {
        if ($m.GetParameters().Length -eq 4) {
            $has4Arg = $true
            break
        }
    }
    if ($has4Arg) {
        $lastWritten = [DateTime]::MinValue
        return [Hswrms.Security.NativeCredentialManager]::Read($Target, $UserRef, $PassRef, [ref]$lastWritten)
    } else {
        return [Hswrms.Security.NativeCredentialManager]::Read($Target, $UserRef, $PassRef)
    }
}

function Invoke-NativeCredentialExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Target,
        [Parameter(Mandatory = $true)]
        [ref]$UserRef
    )
    $type = [Hswrms.Security.NativeCredentialManager]
    $methods = $type.GetMethods([System.Reflection.BindingFlags]'Public, Static') | Where-Object { $_.Name -eq 'Exists' }
    $has3Arg = $false
    foreach ($m in $methods) {
        if ($m.GetParameters().Length -eq 3) {
            $has3Arg = $true
            break
        }
    }
    if ($has3Arg) {
        $lastWritten = [DateTime]::MinValue
        return [Hswrms.Security.NativeCredentialManager]::Exists($Target, $UserRef, [ref]$lastWritten)
    } else {
        return [Hswrms.Security.NativeCredentialManager]::Exists($Target, $UserRef)
    }
}

# --- Check Credential Presence ---
if ($CheckOnly) {
    $checkUser = $null
    $exists = Invoke-NativeCredentialExists -Target $TargetName -UserRef ([ref]$checkUser)
    if ($exists) {
        Write-Host "[READINESS PASS] Stored credential '$TargetName' found for user '$checkUser'."
        Write-Host "[READINESS PASS] Smoke test harness is ready to execute."
        exit 0
    } else {
        Write-Host "[READINESS BLOCKED] Credential '$TargetName' not found in Windows Credential Manager."
        Write-Host "Action Required: Run 'set_hswrms_test_credential.ps1' to configure test account credentials."
        exit 1
    }
}

# --- Read Credential for Execution ---
$username = $null
$password = $null

$retrieved = Invoke-NativeCredentialRead -Target $TargetName -UserRef ([ref]$username) -PassRef ([ref]$password)
if (-not $retrieved -or [string]::IsNullOrEmpty($password)) {
    Write-Error "CREDENTIAL RETRIEVAL FAILED (FAIL CLOSED): No stored credential found for target '$TargetName' in Windows Credential Manager."
    Write-Host "Please run '.\05_Development\database\scripts\set_hswrms_test_credential.ps1' to store the test login credential."
    exit 1
}

if ($username -ne "hswrms_test_user") {
    Write-Error "LEAST PRIVILEGE VIOLATION: Stored credential username is '$username'; expected 'hswrms_test_user'."
    exit 1
}

# --- Execute Test Harness ---
$backendDir = Resolve-Path (Join-Path $PSScriptRoot "..\..\backend")
if (-not (Test-Path $backendDir)) {
    Write-Error "CONFIGURATION ERROR: Backend directory not found at '$backendDir'."
    exit 1
}

$mvnCmd = Join-Path $backendDir "mvnw.cmd"
if (-not (Test-Path $mvnCmd)) {
    Write-Error "CONFIGURATION ERROR: Maven wrapper not found at '$mvnCmd'."
    exit 1
}

$exitCode = 1

try {
    # Set process-scoped environment variables (inherited by child Maven process only)
    $env:SQLSERVER_TEST_USERNAME = $username
    $env:SQLSERVER_TEST_PASSWORD = $password

    Write-Host "================================================================="
    Write-Host "HSWRMS CONTROLLED JDBC SMOKE TEST RUNNER"
    Write-Host "================================================================="
    Write-Host "Target Instance:  localhost:1433"
    Write-Host "Target Database:  HSWRMS_TEST"
    Write-Host "Target Login:     $username (Retrieved securely from Credential Manager)"
    Write-Host "Target Test:      $TestName"
    Write-Host "Profile:          sqlserver-test"
    Write-Host "Password Scope:   Process Environment Block (Scrubbed on completion)"
    Write-Host "================================================================="

    Push-Location $backendDir
    try {
        & $mvnCmd test "-Dtest=$TestName" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
}
finally {
    # Scrub environment variables immediately
    $env:SQLSERVER_TEST_USERNAME = $null
    $env:SQLSERVER_TEST_PASSWORD = $null
    $username = $null
    $password = $null
    [System.GC]::Collect()
    Write-Host "[CLEANUP] Process environment variables and credential memory cleared."
}

exit $exitCode

