# Phase 5.8.3.92 — Persistent Local Credential Automation Review

## Executive Summary

Phase 5.8.3.90 (reported under Phase 5.8.3.92 review deliverable) implements a secure, reusable, Windows-local credential workflow for the HSWRMS dedicated SQL Server test account (`hswrms_test_user`). This implementation enables repeated, unattended execution of the isolated JDBC smoke test (`SqlServerJdbcSmokeTest`) without prompting the operator for passwords on every run, while maintaining a strict zero-plaintext-disk and zero-Git footprint.

Storage is backed by the native Windows Credential Manager generic credentials API (`advapi32.dll`), encrypted at rest via the Windows Data Protection API (DPAPI) and bound strictly to the active Windows user profile. Zero third-party PowerShell modules are required. The smoke test runner injects the retrieved credential exclusively into the transient process environment of the child Maven process and zeroes all memory buffers in a guaranteed `finally` block.

---

## 1. Files Created and Modified

| File Path | Action | Description |
|---|---|---|
| `05_Development/database/scripts/set_hswrms_test_credential.ps1` | **Created** | Interactive one-time setup, verification, and deletion script using native Win32 `advapi32.dll` P/Invoke. Enforces masked input, complexity rules, and memory zeroing. |
| `05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1` | **Created** | Reusable smoke test runner. Retrieves credentials from Credential Manager, validates username and presence, sets process environment variables, executes isolated Maven test, captures exit code, and cleans up memory/environment. |
| `05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md` | **Modified** | Updated Section 6 Step 2 with Option 1 (runner script) and Option 2 (manual). Added comprehensive Section 8 documenting Credential Manager architecture, setup, verification, runner usage, deletion, and security bounds. |
| `05_Development/database/reports/PHASE_5.8.3.92_PERSISTENT_CREDENTIAL_AUTOMATION_REVIEW.md` | **Created** | Comprehensive review report and validation record. |

---

## 2. Windows Credential Manager Implementation Details

### A. Native Win32 API Integration (`advapi32.dll`)
To maintain zero external dependencies and avoid unapproved third-party PowerShell modules, the scripts compile a lightweight C# P/Invoke bridge (`Hswrms.Security.NativeCredentialManager`) via PowerShell's built-in `Add-Type`:

```csharp
namespace Hswrms.Security {
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

    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredWrite([In] ref CREDENTIAL userCredential, [In] uint flags);

    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int flags, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredDelete(string target, int type, int flags);

    [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
    public static extern void CredFree(IntPtr cred);
}
```

### B. Target Configuration and Storage Mechanics
- **Target Name:** `HSWRMS_TEST_SQLSERVER`
- **Credential Type:** `CRED_TYPE_GENERIC` (`1`)
- **Persistence:** `CRED_PERSIST_LOCAL_MACHINE` (`2`) — stored in the local Windows DPAPI vault for the current Windows user account across reboots.
- **Username Attribute:** Strictly validated to match `hswrms_test_user`.
- **Credential Blob:** Password string encoded in UTF-16LE, allocated via unmanaged `Marshal.AllocHGlobal`, copied, and immediately scrubbed via `Marshal.FreeHGlobal` and `Array.Clear` after `CredWriteW`.

### C. In-Memory Lifetime and Scrubbing
1. **Interactive Prompt:** `Read-Host -AsSecureString` avoids echoing plaintext to the terminal or recording characters in `ConsoleHost_history.txt`.
2. **Managed/Unmanaged Marshaling:** Extracted transiently using `Marshal.SecureStringToBSTR` into an unmanaged BSTR pointer.
3. **Deterministic Cleanup:** Unmanaged BSTR is wiped with `[Marshal]::ZeroFreeBSTR($bstr)` in a guaranteed `finally` block, followed by explicit garbage collection (`[GC]::Collect()`).
4. **Child Process Environment Block:** In `run_hswrms_jdbc_smoke_test.ps1`, `$env:SQLSERVER_TEST_USERNAME` and `$env:SQLSERVER_TEST_PASSWORD` exist only during the child Maven process invocation. The outer `finally` block explicitly resets both environment variables to `$null` and collects garbage upon script exit.

---

## 3. Security Review & Operational Limitations

### A. Security Advantages
1. **Zero Repository Footprint:** No secrets, hashes, tokens, or connection strings are stored in files, `.env` configs, scripts, reports, or Git repository history.
2. **Zero Command-Line Argument Exposure:** Neither the PowerShell scripts nor the child Maven execution pass passwords via CLI flags (`-v` or `-Dpassword=...`). This eliminates password leaks to `Get-Process`, Task Manager, `wmic`, or Windows Event Log 4688.
3. **Principle of Least Privilege:** Both scripts fail closed if the username is anything other than `hswrms_test_user`.
4. **Current User Profile Isolation:** DPAPI ensures that other standard user accounts on the machine cannot decrypt the credential.

### B. Known Boundaries & Limitations
1. **Same-User and Administrator Bounds:** Any executable or PowerShell script running under the same Windows user token (or an elevated local Administrator process) can read credentials stored in that user profile's Credential Manager vault via `CredReadW`.
2. **Process Working Set:** During child Maven execution, the child JVM process holds the password in JVM heap memory for connection pool initialization until JVM shutdown.
3. **Machine-Local Scope:** `CRED_PERSIST_LOCAL_MACHINE` generic credentials do not roam across different machines or domain profiles. Each workstation requires a one-time execution of `set_hswrms_test_credential.ps1`.

---

## 4. Static Validation and Fail-Closed Verification

### A. PowerShell AST Syntax Verification
Both scripts were validated using the PowerShell Abstract Syntax Tree (AST) parser (`[System.Management.Automation.Language.Parser]::ParseInput`):
- `set_hswrms_test_credential.ps1`: 0 parse errors, 0 warnings.
- `run_hswrms_jdbc_smoke_test.ps1`: 0 parse errors, 0 warnings.

### B. Fail-Closed Missing-Credential Handling

#### Test 1: `set_hswrms_test_credential.ps1 -VerifyOnly`
- **Command:** `.\set_hswrms_test_credential.ps1 -VerifyOnly`
- **Output:**
  ```text
  =================================================================
  HSWRMS TEST CREDENTIAL STATUS: NOT FOUND
  =================================================================
  Target Name:   HSWRMS_TEST_SQLSERVER
  Action Needed: Run set_hswrms_test_credential.ps1 to configure.
  =================================================================
  ```
- **Exit Code:** `1` (PASS: Safe fail-closed status returned).

#### Test 2: `run_hswrms_jdbc_smoke_test.ps1 -CheckOnly`
- **Command:** `.\run_hswrms_jdbc_smoke_test.ps1 -CheckOnly`
- **Output:**
  ```text
  [READINESS BLOCKED] Credential 'HSWRMS_TEST_SQLSERVER' not found in Windows Credential Manager.
  Action Required: Run 'set_hswrms_test_credential.ps1' to configure test account credentials.
  ```
- **Exit Code:** `1` (PASS: Readiness check blocked safely without attempting test run).

#### Test 3: `run_hswrms_jdbc_smoke_test.ps1` (Direct Execution)
- **Command:** `.\run_hswrms_jdbc_smoke_test.ps1`
- **Output:**
  ```text
  CREDENTIAL RETRIEVAL FAILED (FAIL CLOSED): No stored credential found for target 'HSWRMS_TEST_SQLSERVER' in Windows Credential Manager.
  Please run '.\05_Development\database\scripts\set_hswrms_test_credential.ps1' to store the test login credential.
  ```
- **Exit Code:** `1` (PASS: Maven wrapper was NOT invoked; SQL Server connection was NOT attempted).

### C. Parameter Validation and Password Complexity Checks
The setup script enforces the following pre-storage checks:
- Username validated against strict `ValidateSet("hswrms_test_user")`.
- Rejects null, empty, or whitespace passwords.
- Enforces length between 12 and 128 characters.
- Rejects default placeholder strings (`REPLACE_WITH_STRONG_PASSWORD_BEFORE_EXECUTION`, `CHANGE_ME_STRONG_PASSWORD!`).

---

## 5. Explicit Compliance Confirmations

1. **Zero Password Capture:**
   - Confirmed: No passwords were typed, stored, logged, printed, or recorded in console output, shell history, script files, or this report.
2. **Zero SQL Mutations:**
   - Confirmed: Zero SQL statements were executed in this phase. No `ALTER LOGIN`, `CREATE LOGIN`, `DROP LOGIN`, `GRANT`, `DENY`, or `REVOKE` statements were run.
3. **Zero Test Execution Prior to Setup:**
   - Confirmed: Neither Maven nor `SqlServerJdbcSmokeTest` was executed against SQL Server. The runner verified fail-closed behavior without contacting the database.
4. **Primary Database Isolation:**
   - Confirmed: Primary database `HSWRMS` remains completely untouched and isolated.

---

## 6. Git Diff and Repository Hygiene

### Git Status
```text
 M 05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md
?? 05_Development/database/reports/PHASE_5.8.3.92_PERSISTENT_CREDENTIAL_AUTOMATION_REVIEW.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

### Git Diff Summary
- `HSWRMS_TEST_PROVISIONING_GUIDE.md`: Clean addition of Section 6 Option 1 and Section 8 documenting persistent local credential storage and smoke test runner automation.
- Zero credential artifacts, temporary password files, or `.env` files are tracked or present in the working tree.
- Zero commits or git staging operations performed.

---

## 7. Next Operator Action Required

To configure the persistent local credential and enable repeated smoke test execution:

1. **Store Credential Once (Operator Action):**
   ```powershell
   .\05_Development\database\scripts\set_hswrms_test_credential.ps1
   ```
   *(When prompted, enter the strong password configured for SQL Server test login `hswrms_test_user`)*

2. **Verify Stored Credential:**
   ```powershell
   .\05_Development\database\scripts\set_hswrms_test_credential.ps1 -VerifyOnly
   ```

3. **Run Isolated Smoke Test:**
   ```powershell
   .\05_Development\database\scripts\run_hswrms_jdbc_smoke_test.ps1
   ```

