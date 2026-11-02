# HSWRMS Dedicated Test Database Provisioning Guide (Least-Privilege & Credential-Hardened)

## Status and Safety Notice

> [!CAUTION]
> **REVIEW DRAFT ONLY — NOT AUTHORIZED FOR AUTOMATIC OR UNAPPROVED EXECUTION**
> This document details the hardened, two-stage provisioning and verification procedure for the dedicated test environment (`HSWRMS_TEST`).
> **No database, login, user, or permission creation may be executed without explicit user approval.**
> Automated integration tests MUST NEVER target the primary development/production database (`HSWRMS`).

---

## 1. Security Architecture & Least-Privilege Invariants

### A. Principle of Least Privilege: Why `db_datareader` is NOT Granted
In earlier design drafts, the database role `db_datareader` was preliminarily proposed. During the DevSecOps security review, this was identified as an unnecessary privilege:
- The JDBC smoke test executes exclusively:
  ```sql
  SELECT @@VERSION AS [version], DB_NAME() AS [db_name];
  ```
- Both `@@VERSION` and `DB_NAME()` are SQL Server built-in scalar system functions accessible to the `public` role.
- The smoke test does **NOT** read from, write to, or query any user tables, views, or stored procedures.
- Role `db_datareader` grants database-wide `SELECT` permission across all user tables. Granting it provides unnecessary broad data access.
- **Hardened Decision:** The principal `[hswrms_test_user]` receives **ONLY** database `CONNECT` permission on `[HSWRMS_TEST]`.
- No membership in `db_datareader`, `db_datawriter`, `db_owner`, or any administrative server roles (`sysadmin`, `securityadmin`, etc.) is granted.

### B. Strict Isolation from Primary Database `HSWRMS`
The test login must have zero access to primary database `HSWRMS`:
- `[hswrms_test_user]` has zero user mappings in `HSWRMS`.
- In `HSWRMS`, guest access is verified disabled (`hasdbaccess = 0`, zero `CONNECT` grants).
- In `HSWRMS`, the `public` role holds zero permissions on user tables.
- Cross-database ownership chaining (`is_db_chaining_on`) and `is_trustworthy_on` are disabled (0) on `HSWRMS`.
- Any connection attempt from `hswrms_test_user` to `HSWRMS` fails closed with SQL Server Error 916.

---

## 2. Credential Safety & Non-Persistence Requirements

To ensure test credentials are never compromised or leaked into source control, the following rules are strictly enforced:

### A. Prohibited Credential Practices
1. **NO Hardcoded Passwords in `.sql` Files:** Real passwords must NEVER be written into or saved to [`draft_provision_hswrms_test.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/scripts/draft_provision_hswrms_test.sql) or any tracked repository file.
2. **NO Passwords via Command-Line Arguments:** Real passwords must NEVER be passed as CLI arguments (e.g. `sqlcmd -v TEST_PASSWORD="..."`). Arguments passed on the command line are visible in plain text to all local users via process listings (`Get-Process`, Task Manager, `wmic process`, and Windows Process Creation Audit Event 4688), as well as shell history files (`ConsoleHost_history.txt`).
3. **NO Misleading `SecureString` Assumptions:** PowerShell's `Read-Host -AsSecureString` returns an encrypted `System.Security.SecureString` object. Passing it directly into native CLI executables sends the literal .NET type name `"System.Security.SecureString"` rather than the plaintext password.

### B. Recommended Execution Approach: Parameterized PowerShell ADO.NET Script (Primary)
The official, hardened method for Stage A provisioning is the dedicated parameterized PowerShell script:
[`05_Development/database/scripts/provision_hswrms_test.ps1`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/scripts/provision_hswrms_test.ps1)

#### Operational Advantages:
1. **Typed RPC TDS Parameterization:** Transmits the password directly as a typed RPC parameter (`SqlDbType.NVarChar(128)`) over the TDS protocol. It completely avoids SQLCMD lexical macro substitution, eliminating delimiter collision risks (such as single quotes or double quotes breaking statement structure).
2. **Server-Side Quoting Defense:** Uses server-side `QUOTENAME(@password, '''')` within dynamic SQL executed by `sys.sp_executesql`. Any single quotes in the password are automatically doubled by the database engine, guaranteeing the credential is treated purely as string data and never parsed as executable code.
3. **Interactive Masked Input:** Prompts securely via `Read-Host -AsSecureString`, ensuring the password is never echoed on the console or recorded in PowerShell's `ConsoleHost_history.txt`.
4. **Safe Verification Modes (`-WhatIf` & `-DryRun`):** Supports both standard PowerShell `-WhatIf` / `$WhatIfPreference` and an explicit `-DryRun` switch. These validate all client-side inputs, parameter bounds, and quoting formulas without opening a database connection or modifying server state. Every state-altering DDL operation is guarded by explicit calls to `$PSCmdlet.ShouldProcess()`.
5. **Strict Parameter Whitelisting:** Enforces compile-time and runtime whitelisting: `DatabaseName` must strictly equal `HSWRMS_TEST`; `LoginName` must strictly equal `hswrms_test_user`; `ServerInstance` is validated against a strict alphanumeric/instance name regex; password length is strictly bounded between 12 and 128 characters; default placeholders and unresolved macro tokens (`$(`) are rejected immediately.
6. **Deterministic Memory Cleanup:** Unmanaged BSTR pointers are zeroed immediately via `[Marshal]::ZeroFreeBSTR()` in a guaranteed `finally` block, and garbage collection is triggered upon exit.

#### Execution Commands:
```powershell
# 1. Non-mutating validation run (validates inputs, bounds, and quoting without connecting to SQL Server):
.\05_Development\database\scripts\provision_hswrms_test.ps1 -ServerInstance "localhost" -DryRun

# 2. Standard PowerShell What-If simulation:
.\05_Development\database\scripts\provision_hswrms_test.ps1 -ServerInstance "localhost" -WhatIf

# 3. Authorized Live Execution (prompts interactively and securely for the password; requires explicit approval):
.\05_Development\database\scripts\provision_hswrms_test.ps1 -ServerInstance "localhost"
```

### C. Audited Fallback Approach: Interactive SSMS in an Unsaved Query Tab
For operators who cannot execute PowerShell scripts or prefer an SSMS graphical workflow, the audited fallback method is an **interactive SSMS query window that is never saved to disk**:
1. Open SQL Server Management Studio (SSMS) and connect via Windows Authentication (`-E`).
2. Press `Ctrl+N` to open a **New Query** tab (an unsaved in-memory buffer, e.g., `SQLQuery1.sql`).
3. In SSMS menu, select **Query** $\rightarrow$ Click **SQLCMD Mode**.
4. On line 1 of the new tab, define the transient session password variable:
   ```sql
   :setvar TEST_PASSWORD "YourStrongTestPasswordHere!#"
   ```
5. Copy the entire contents of [`draft_provision_hswrms_test.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/scripts/draft_provision_hswrms_test.sql) and paste them below the `:setvar` line.
6. Execute the query (`F5`).
7. Once execution completes, **close the query tab without saving** (click `Don't Save`).

> [!NOTE]
> **Risk Reduction Assessment (Substantial Risk Reduction, NOT an Absolute Zero-Disk Guarantee):**
> Closing an unsaved query tab without saving prevents the password from being written to a committed repository file, eliminates git diff contamination, and avoids command-line argument exposure in process listings (`Get-Process`, Task Manager, Event 4688) or shell history files (`ConsoleHost_history.txt`).
> 
> However, operators should understand that this constitutes **risk reduction**, not an absolute physical guarantee of zero disk footprint:
> - **SSMS AutoRecover:** SSMS includes an AutoRecover feature (Tools $\rightarrow$ Options $\rightarrow$ Environment $\rightarrow$ AutoRecover) that periodically writes temporary recovery backup snapshots of unsaved editor buffers to disk (typically `%USERPROFILE%\Documents\SQL Server Management Studio\Backup Files\` or `%LOCALAPPDATA%`). While closing the tab with "Don't Save" purges this recovery snapshot, the data may briefly exist on storage and persist in unallocated clusters or volume shadow copies.
> - **OS Virtual Memory Paging:** The Windows virtual memory manager can page process working sets containing SSMS memory to disk (`pagefile.sys` or `hiberfil.sys`) during memory contention or system hibernation.
> - **Clipboard History:** If the password was copied via clipboard, Windows Clipboard History (`Win+V`) may retain the plaintext string unless cleared.
> - **Memory/Crash Dumps:** Any unexpected crash or diagnostic dump of the SSMS process would capture buffer contents.
> 
> *Best Practice:* Keep the query tab open only for the moments necessary to execute, close without saving immediately, and clear the clipboard buffer.

### D. CLI Alternative: Ephemeral Process-Scoped Environment Variable
If executing via CLI rather than SSMS, the password must be handled transiently in memory and passed via environment variable (which `sqlcmd` inherits automatically without command-line exposure):
```powershell
# 1. Prompt interactively with console masking (does not log plaintext to PSReadLine history)
$secPass = Read-Host "Enter HSWRMS test password" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
$plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

# 2. Assign to process-scoped environment variable (transient to this PowerShell process only)
$env:TEST_PASSWORD = $plainPass

# 3. Execute sqlcmd WITHOUT -v argument (sqlcmd automatically inherits $env:TEST_PASSWORD)
sqlcmd -S localhost -E -i 05_Development/database/scripts/draft_provision_hswrms_test.sql

# 4. Immediately clear memory and environment variable
$env:TEST_PASSWORD = $null
$plainPass = $null
Remove-Variable secPass, bstr, plainPass -ErrorAction SilentlyContinue
```

> [!WARNING]
> **Realistic Limitations of SecureString & Process Environment Variables:**
> - **CLR Managed Heap Persistence:** While `SecureString` stores encrypted data in DPAPI-protected unmanaged memory, calling `PtrToStringBSTR` allocates an immutable managed `System.String` in the .NET garbage-collected heap. Unlike unmanaged memory, managed strings cannot be deterministically zeroed out in .NET; they persist until garbage collection reclaims and overwrites the memory page.
> - **Process Environment Block Inheritance:** Storing the secret in `$env:TEST_PASSWORD` places plaintext into the process's environment block. Any child process spawned from this shell session inherits that environment block unless explicitly scrubbed. Furthermore, processes running under the same user token or with local administrator privileges can inspect process environment blocks (e.g. via Process Explorer or `ReadProcessMemory`).
> - **Virtual Memory Paging:** Process memory containing the environment block may be swapped to `pagefile.sys`.
> 
> *Conclusion on Local Secret Handling:* Neither method eliminates all memory or OS-level exposure. The goal is pragmatic risk mitigation: **never expose secrets on command lines (`-v`) where any local user/logging system can capture them, and never save secrets into repository files.** Interactive SSMS in an unsaved tab (Method 1) remains the preferred and simplest operational workflow.

### D. Password Character Constraints & SQLCMD Substitution Limitations
SQLCMD variable substitution (`$(TEST_PASSWORD)`) performs direct lexical text substitution into T-SQL string literals (`N'$(TEST_PASSWORD)'`) and command preprocessor directives (`:setvar TEST_PASSWORD "..."`).

To prevent lexical delimiter collisions, syntax errors, or accidental token echoing:
1. **Accepted Password Format:**
   - Minimum length: 12+ characters (meeting Windows/SQL Server password complexity policy: upper, lower, digits, symbols).
   - **Allowed Characters:**
     - Alphanumeric: `A-Z`, `a-z`, `0-9`.
     - Safe Special Symbols: `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `(`, `)`, `-`, `_`, `=`, `+`, `[`, `]`, `{`, `}`, `|`, `:`, `;`, `,`, `.`, `<`, `>`, `?`, `/`, `~`.
2. **Strictly Prohibited Characters:**
   - **Single Quote (`'`)**: A single quote immediately terminates the T-SQL string literal `N'$(TEST_PASSWORD)'`. While `:on error exit` halts execution, SQL Server syntax error messages (`near '...'`) risk echoing trailing password characters to the console.
   - **Double Quote (`"`)**: A double quote breaks `:setvar` command syntax in SQLCMD.
   - **Macro Sequence (`$(`)**: The sequence `$(` is interpreted by SQLCMD as an internal macro reference, triggering variable resolution errors.
3. **Behavior of Other SQL-Special Characters:**
   Empirical testing confirms that semicolons (`;`), comment markers (`--`, `/* */`), parentheses, and symbols (`< > & | ~`) inside the string literal `N'$(TEST_PASSWORD)'` are safely parsed as literal characters and do NOT break statements or alter query semantics.

### E. Comparative Security & Character Policy: Parameterized ADO.NET vs SQLCMD

| Dimension | Primary Path: Parameterized ADO.NET (`provision_hswrms_test.ps1`) | Fallback Path: Interactive SSMS (`draft_provision_hswrms_test.sql`) |
|---|---|---|
| **Credential Transport** | Strongly-typed RPC parameter (`NVarChar(128)`) over TDS protocol | Textual macro expansion (`$(TEST_PASSWORD)`) in SQLCMD preprocessor |
| **SQL Injection Risk** | **Zero / Eliminated:** Server engine escapes string via `QUOTENAME(@password, '''')` | Requires strict character prohibition; single quote terminates literal |
| **Single Quote (`'`) Handling** | **Supported & Immune:** Automatically doubled to `''` by SQL Server engine | **Prohibited:** Breaks string literal `N'$(TEST_PASSWORD)'` syntax |
| **Double Quote (`"`) Handling** | **Supported & Immune:** Treated purely as data inside TDS RPC parameter | **Prohibited:** Breaks `:setvar TEST_PASSWORD "..."` directive syntax |
| **Macro Sequence (`$(`) Handling**| **Client-Rejected:** Validated and rejected before network transmission | **Prohibited:** Triggers SQLCMD variable expansion error |
| **Length Bounds** | Client-enforced: 12 to 128 characters | Script-enforced: `LEN(N'$(TEST_PASSWORD)') >= 12` |
| **Dry Run & Simulation** | Full support via `-WhatIf` and `-DryRun` without opening DB connection | Manual inspection or `SET NOEXEC ON` in SSMS |
| **Verification Harness** | Isolated 28-test automated suite (`scratch/test_safer_provisioning_harness.ps1`) | Synthetic static review and manual query execution |

---

## 3. Workflow Overview & Strict Gating

The lifecycle of the test environment is strictly partitioned into three independent stages:

```
[Phase 0: Pre-Flight] ──────► [Stage A: Provisioning] ──────► [Stage B: Verification & Smoke Test]
(Read-Only Health Check)     (DB, Login, User Creation)     (Permission Audit & Live JDBC Test)
         │                               │                                   │
         ▼                               ▼                                   ▼
Requires Zero Approval          Requires Explicit User             Requires Second Explicit
(Safe Read-Only)                Authorization A                    Authorization B
```

---

## 4. Phase 0 — Pre-Flight & Health Inspection (Read-Only)

Executed prior to requesting Stage A authorization. Validates that the environment is pristine:

```sql
USE [master];
GO

-- 1. Verify Mixed Authentication Mode (0 = Mixed Mode, 1 = Windows Auth Only)
SELECT CAST(SERVERPROPERTY('IsIntegratedSecurityOnly') AS INT) AS [IsWindowsAuthOnly];

-- 2. Verify target database is absent
SELECT name, state_desc FROM sys.databases WHERE name IN ('HSWRMS', 'HSWRMS_TEST');

-- 3. Verify target login is absent
SELECT name, type_desc FROM sys.server_principals WHERE name = 'hswrms_test_user';

-- 4. Verify primary database isolation invariants
USE [HSWRMS];
SELECT name, hasdbaccess FROM sys.sysusers WHERE name = 'guest';
SELECT is_trustworthy_on, is_db_chaining_on FROM sys.databases WHERE name = 'HSWRMS';
GO
```

---

## 5. Stage A — Controlled Provisioning Procedure

> **REQUIRES SEPARATE EXPLICIT OPERATOR APPROVAL BEFORE EXECUTION**

When approved, execute Stage A using one of the two audited execution paths:

### Primary Execution Path: Parameterized PowerShell Script
Execute the dedicated script from an elevated PowerShell session:
```powershell
# 1. Pre-execution dry-run validation (safe check, zero mutations):
.\05_Development\database\scripts\provision_hswrms_test.ps1 -ServerInstance "localhost" -DryRun

# 2. Stage A Execution (prompts interactively for password; requires explicit approval):
.\05_Development\database\scripts\provision_hswrms_test.ps1 -ServerInstance "localhost"
```

### Audited Fallback Path: Interactive SSMS Query Window
For operators without PowerShell execution permissions, execute [`draft_provision_hswrms_test.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/scripts/draft_provision_hswrms_test.sql) in an unsaved SSMS tab (SQLCMD Mode enabled) with `:setvar TEST_PASSWORD "..."` on line 1, and close without saving.

### Fail-Closed Pre-Conditions Enforced in Both Paths:
1. **Target Database Check:** If `HSWRMS_TEST` already exists, fails closed unless `-AllowExistingDb` / `:setvar ALLOW_EXISTING_DB "TRUE"` is explicitly passed. If authorized, requires `state_desc == 'ONLINE'`.
2. **Target Login Check:** If `hswrms_test_user` already exists, fails closed unless `-AllowExistingLogin` / `:setvar ALLOW_EXISTING_LOGIN "TRUE"` is explicitly passed. If authorized, validates `type == 'S'`, `is_disabled == 0`, safe default DB (`HSWRMS_TEST` or `master`), zero server roles, and zero elevated server permissions.
3. **Primary Database Isolation:** Verifies zero user mappings for `hswrms_test_user` inside primary database `HSWRMS`.
4. **Password Invariants:** Password must be at least 12 characters, not equal to placeholders, and not begin with unresolved macro prefixes (`$(`).

### Exact Mutations Performed:
- **Operation 1:** `CREATE DATABASE [HSWRMS_TEST] COLLATE SQL_Latin1_General_CP1_CI_AS;`
- **Operation 2:** `CREATE LOGIN [hswrms_test_user] WITH PASSWORD = ... , CHECK_EXPIRATION = OFF, CHECK_POLICY = ON, DEFAULT_DATABASE = [HSWRMS_TEST];`
  *(In PowerShell: parameterized via RPC TDS and server-side `QUOTENAME(@password, '''')`; in SSMS: literal `N'$(TEST_PASSWORD)'`)*
- **Operation 3:** `USE [HSWRMS_TEST]; CREATE USER [hswrms_test_user] FOR LOGIN [hswrms_test_user]; GRANT CONNECT TO [hswrms_test_user];`

---

## 6. Stage B — Post-Provisioning Verification & Live JDBC Smoke Test

> **REQUIRES SEPARATE EXPLICIT OPERATOR APPROVAL AFTER STAGE A REPORT IS REVIEWED**

### Step 1: Read-Only Effective-Permission & Isolation Audit
Run the following audit query under administrative credentials:
```sql
USE [HSWRMS_TEST];
GO

-- 1. Verify Login Configuration
SELECT 
    p.name AS [LoginName],
    p.is_disabled AS [IsDisabled],
    p.default_database_name AS [DefaultDb],
    IS_SRVROLEMEMBER('sysadmin', p.name) AS [IsSysadmin],
    IS_SRVROLEMEMBER('securityadmin', p.name) AS [IsSecurityadmin]
FROM sys.server_principals p
WHERE p.name = 'hswrms_test_user';

-- 2. Verify Zero Elevated Server Roles
SELECT r.name AS [ServerRole]
FROM sys.server_role_members srm
JOIN sys.server_principals r ON r.principal_id = srm.role_principal_id
JOIN sys.server_principals m ON m.principal_id = srm.member_principal_id
WHERE m.name = 'hswrms_test_user';

-- 3. Verify Database User & Permissions in HSWRMS_TEST
SELECT 
    dp.name AS [UserName],
    p.permission_name,
    p.state_desc
FROM sys.database_permissions p
JOIN sys.database_principals dp ON dp.principal_id = p.grantee_principal_id
WHERE dp.name = 'hswrms_test_user';

-- 4. Dynamic Access Check: Test impersonation into HSWRMS (Must fail with Error 916)
EXECUTE AS LOGIN = 'hswrms_test_user';
BEGIN TRY
    EXEC('USE [HSWRMS]; SELECT DB_NAME();');
    PRINT 'CRITICAL ISOLATION FAILURE: Accessed HSWRMS!';
END TRY
BEGIN CATCH
    PRINT '[PASS] Access to HSWRMS denied as expected: ' + ERROR_MESSAGE();
END CATCH;
REVERT;
GO
```

### Step 2: Live JDBC Smoke Test Execution

#### Option 1: Automated Persistent Runner via Windows Credential Manager (Recommended)
Once the test login credential is saved to Windows Credential Manager (see Section 8), execute the smoke test runner script directly without prompting or exposing passwords:
```powershell
.\05_Development\database\scripts\run_hswrms_jdbc_smoke_test.ps1
```

#### Option 2: Manual Ephemeral Process-Scoped Environment Variables
Alternatively, configure process-scoped environment variables in a single session and execute the opt-in smoke test:
```powershell
# In PowerShell:
$env:SQLSERVER_TEST_USERNAME = "hswrms_test_user"
$env:SQLSERVER_TEST_PASSWORD = "<YourStrongTestPassword>"
$env:SQLSERVER_TEST_DB = "HSWRMS_TEST"

./mvnw.cmd test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"

# Immediately clear credentials after test run:
$env:SQLSERVER_TEST_USERNAME = $null
$env:SQLSERVER_TEST_PASSWORD = $null
$env:SQLSERVER_TEST_DB = $null
```

---

## 7. Recovery Procedures for Partial Provisioning

If an operation encounters an unexpected failure mid-stage:
1. **Database created, login creation failed:**
   - Cause: Password does not meet Windows Server password complexity policy.
   - Action: Do NOT drop `HSWRMS_TEST`. Stage 2 checks `IF NOT EXISTS` and skips database creation when re-run. Correct password complexity and re-run Stage 3.
2. **Login created, user mapping failed:**
   - Action: Do NOT drop login or database. Run Stage 4 independently in SSMS.
3. **Pre-condition violation triggered (`SET NOEXEC ON`):**
   - Action: Review error message. If in SSMS, execute `SET NOEXEC OFF;` to reset session state.
4. **Existing Login Reuse & Password Mismatch Risk:**
   - Cause / Behavior: If `hswrms_test_user` already exists, Stage 1.3 fails closed unless `:setvar ALLOW_EXISTING_LOGIN "TRUE"` is explicitly set.
   - **Password Mismatch Warning:** SQL Server stores passwords as one-way salted hashes (`sys.sql_logins.password_hash`). If an existing login is reused, the script skips `CREATE LOGIN` and does NOT alter its password. SQL Server provides zero capability to inspect or infer whether the supplied `$(TEST_PASSWORD)` matches the stored hash.
   - If the passwords differ, the Stage B live JDBC smoke test will fail with SQL Server Error 18456 (Login failed for user).
   - **Recommended Procedure:** Initial Stage A provisioning should always run in a clean environment where `hswrms_test_user` does not pre-exist. If reusing an existing login, the operator must independently verify credentials or administratively synchronize the password beforehand via `ALTER LOGIN [hswrms_test_user] WITH PASSWORD = N'...'`.

---

## 8. Persistent Local Credential Storage & Automated Smoke Test Runner (Windows Credential Manager)

To allow repeatable and automated execution of the isolated JDBC smoke test without prompting for credentials each time and without persisting secrets to repository files, a native Windows Credential Manager integration is provided.

### A. Security Architecture
1. **Target Name:** `HSWRMS_TEST_SQLSERVER`
2. **Credential Type:** `CRED_TYPE_GENERIC` (1), `CRED_PERSIST_LOCAL_MACHINE` (2).
3. **Current-Windows-User Scoping:**
   - Generic credentials written via Win32 `CredWriteW` are encrypted with Windows DPAPI (Data Protection API) and tied directly to the current Windows user profile (`%USERPROFILE%`).
   - Other local Windows accounts, unprivileged services, or remote users cannot read or decrypt these credentials.
4. **Zero-Disk / Zero-Git Invariant:**
   - Credentials exist strictly inside Windows Credential Manager (DPAPI vault).
   - No plaintext passwords, hashes, tokens, or connection strings are stored in files, `.env` configs, scripts, reports, or Git repository history.
   - Child processes inherit the password strictly in their transient process environment block (`$env:SQLSERVER_TEST_PASSWORD`), which is scrubbed in a guaranteed `finally` block upon test termination.
5. **No Third-Party Dependencies:**
   - Built directly using native Win32 P/Invoke declarations (`advapi32.dll`: `CredWriteW`, `CredReadW`, `CredDeleteW`, `CredFree`) compiled via PowerShell's built-in `Add-Type`.

### B. One-Time Setup: Storing the Test Credential
Run the setup script interactively. The password prompt masks input (`Read-Host -AsSecureString`) and never echoes the secret to the console or PowerShell command history (`ConsoleHost_history.txt`):

```powershell
# Interactive one-time configuration:
.\05_Development\database\scripts\set_hswrms_test_credential.ps1
```

The script performs client-side validation:
- Login name is verified to be `hswrms_test_user`.
- Password must be 12-128 characters long and cannot match default placeholder patterns.
- Credential is saved under target `HSWRMS_TEST_SQLSERVER`.
- Memory buffers are cleared immediately via `Marshal.ZeroFreeBSTR` and garbage collection.

### C. Checking Credential Status
Verify that the credential exists without displaying the secret:
```powershell
.\05_Development\database\scripts\set_hswrms_test_credential.ps1 -VerifyOnly
```
Output displays the target name, username, and last-modified timestamp, while keeping the password redacted.

You can also run readiness checking with the runner script:
```powershell
.\05_Development\database\scripts\run_hswrms_jdbc_smoke_test.ps1 -CheckOnly
```

### D. Executing the Smoke Test Runner
Once stored, run the smoke test repeatedly:
```powershell
.\05_Development\database\scripts\run_hswrms_jdbc_smoke_test.ps1
```
Operational workflow executed by the runner:
1. Retrieves `hswrms_test_user` credentials from Windows Credential Manager.
2. Fails closed (exit code 1) if the credential does not exist or username is not `hswrms_test_user`.
3. Injects credentials exclusively into the current script process's environment variables (`SQLSERVER_TEST_USERNAME`, `SQLSERVER_TEST_PASSWORD`).
4. Executes the isolated Maven test:
   `mvnw.cmd test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"`
5. Captures and propagates the Maven exit code.
6. Enforces cleanup in a `finally` block: zeroes out process environment variables and unsets memory references.

### E. Credential Deletion / Replacement
To delete or reset the stored credential:
```powershell
# Remove credential from Windows Credential Manager:
.\05_Development\database\scripts\set_hswrms_test_credential.ps1 -DeleteCredential

# Re-run setup to replace:
.\05_Development\database\scripts\set_hswrms_test_credential.ps1
```

### F. Security Limitations
- **Local Elevation Bounds:** Any process running under the same Windows user token or an elevated Administrator process on the same machine has access to DPAPI-protected credentials for that user profile.
- **Process Memory Lifetime:** During Maven test execution, the child JVM process holds the password in memory until JVM termination.
- **No Remote Roaming:** Generic credentials with `CRED_PERSIST_LOCAL_MACHINE` do not roam across different machines or domain accounts. Each workstation used for testing must perform the one-time interactive setup.

