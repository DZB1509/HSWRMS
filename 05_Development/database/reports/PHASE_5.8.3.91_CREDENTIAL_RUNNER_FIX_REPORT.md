# Phase 5.8.3.91 — Fix Credential Runner Read Overload Report

## Executive Summary

Phase 5.8.3.91 investigated and resolved the PowerShell method overload mismatch encountered when executing `run_hswrms_jdbc_smoke_test.ps1`. The error:

`Cannot find an overload for "Read" and the argument count: "3".`

occurred due to a signature difference between the .NET `NativeCredentialManager` type compiled into the active PowerShell session by `set_hswrms_test_credential.ps1` (which defined `Read` with 4 parameters) and the call in `run_hswrms_jdbc_smoke_test.ps1` (which called `Read` with 3 parameters).

The runner script has been corrected to dynamically adapt to both overload signatures via reflective invocation helpers and to provide matching overloads in its local C# definition. All security invariants, memory scrubbing procedures, fail-closed gates, and zero-plaintext guarantees remain strictly preserved.

---

## 1. Root Cause Analysis

### Exact File and Lines
- **File:** `05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1`
- **Failing Call:** Line 142 (`[Hswrms.Security.NativeCredentialManager]::Read($TargetName, [ref]$username, [ref]$password)`)
- **Latent Mismatch:** Line 126 (`[Hswrms.Security.NativeCredentialManager]::Exists($TargetName, [ref]$checkUser)`)

### Mechanism of Failure
1. **AppDomain Type Immutability in PowerShell:**
   When the operator executed `set_hswrms_test_credential.ps1` to configure the test login password, PowerShell executed `Add-Type`, which compiled `Hswrms.Security.NativeCredentialManager` into the PowerShell process's .NET AppDomain.
   In `set_hswrms_test_credential.ps1`, the methods were declared with timestamps for auditing:
   ```csharp
   public static bool Read(string target, out string username, out string password, out DateTime lastWrittenUtc)
   public static bool Exists(string target, out string username, out DateTime lastWrittenUtc)
   ```
2. **Subsequent Execution in the Same Session:**
   When the operator subsequently invoked `run_hswrms_jdbc_smoke_test.ps1` in the same interactive PowerShell session, the guard:
   ```powershell
   if (-not ([System.Management.Automation.PSTypeName]'Hswrms.Security.NativeCredentialManager').Type)
   ```
   evaluated to `$false` because `[Hswrms.Security.NativeCredentialManager]` was already loaded. Therefore, `Add-Type` in `run_hswrms_jdbc_smoke_test.ps1` was skipped (and .NET does not allow redefining or modifying existing types in an active AppDomain).
3. **Overload Mismatch:**
   On line 142, `run_hswrms_jdbc_smoke_test.ps1` called:
   ```powershell
   $retrieved = [Hswrms.Security.NativeCredentialManager]::Read($TargetName, [ref]$username, [ref]$password)
   ```
   This call passed **3 arguments**. However, the type loaded in the AppDomain only exposed the **4-argument** signature (`target`, `username`, `password`, `lastWrittenUtc`).
   PowerShell's method resolution failed to find a matching 3-parameter overload and threw:
   `Cannot find an overload for "Read" and the argument count: "3".`

---

## 2. Fix Applied

The fix was applied exclusively to `05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1`. No modifications were made to `set_hswrms_test_credential.ps1`, and no changes were made to the stored Windows Credential Manager entry.

### A. Dual Overload Declarations in C# P/Invoke Definition
The C# type definition inside `run_hswrms_jdbc_smoke_test.ps1` was updated so that if loaded in a fresh PowerShell session, it defines both overloads for both `Read` and `Exists`:

```csharp
public static bool Read(string target, out string username, out string password, out DateTime lastWrittenUtc) { ... }

public static bool Read(string target, out string username, out string password) {
    DateTime ignored;
    return Read(target, out username, out password, out ignored);
}

public static bool Exists(string target, out string username, out DateTime lastWrittenUtc) { ... }

public static bool Exists(string target, out string username) {
    DateTime ignored;
    return Exists(target, out username, out ignored);
}
```

### B. Resilient Overload Dispatch Helpers
To guarantee seamless execution in existing PowerShell sessions where `set_hswrms_test_credential.ps1` was already loaded, reflective dispatch helpers were added:

```powershell
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
```

### C. Updated Caller Invocations
- Line 126 was updated to call `Invoke-NativeCredentialExists -Target $TargetName -UserRef ([ref]$checkUser)`.
- Line 142 was updated to call `Invoke-NativeCredentialRead -Target $TargetName -UserRef ([ref]$username) -PassRef ([ref]$password)`.

---

## 3. Validation Results

### A. PowerShell AST Syntax Verification
Validated `run_hswrms_jdbc_smoke_test.ps1` using `[System.Management.Automation.Language.Parser]::ParseFile`:
- **Parse Errors:** `0`
- **Syntax Status:** `VALID`

### B. Same-Process Lifecycle Verification
Tested sequential execution within a single PowerShell process simulating the operator's workflow (`set_hswrms_test_credential.ps1 -VerifyOnly` followed immediately by `run_hswrms_jdbc_smoke_test.ps1 -CheckOnly`):

```text
=================================================================
HSWRMS TEST CREDENTIAL STATUS: PRESENT
=================================================================
Target Name:   HSWRMS_TEST_SQLSERVER
Username:      hswrms_test_user
Last Written:  2026-10-28T13:06:12.2631270Z
Security:      Stored in Windows Credential Manager (Encrypted)
Password:      [REDACTED / SECURE]
=================================================================
[READINESS PASS] Stored credential 'HSWRMS_TEST_SQLSERVER' found for user 'hswrms_test_user'.
[READINESS PASS] Smoke test harness is ready to execute.
Exit Code: 0
```

### C. Fail-Closed Verification on Non-Existent Target
Tested runner against target `NONEXISTENT_TARGET_TEST`:
- **Output:** `[READINESS BLOCKED] Credential 'NONEXISTENT_TARGET_TEST' not found in Windows Credential Manager.`
- **Exit Code:** `1` (PASS: Safe fail-closed handling verified).

---

## 4. Security & Compliance Confirmations

1. **Zero Password Exposure:**
   - No password, secret string, credential blob, or decrypted character was printed, logged, or recorded in console output, files, transcripts, or reports.
2. **Zero Credential Modification:**
   - The stored Windows Credential Manager entry `HSWRMS_TEST_SQLSERVER` was neither modified, rewritten, nor deleted.
   - `set_hswrms_test_credential.ps1` was NOT modified.
3. **Zero Database Actions & Zero Maven Execution:**
   - Zero SQL statements were executed against any database.
   - No SQL logins or database permissions were created, altered, granted, or revoked.
   - Primary database `HSWRMS` was completely untouched.
   - Maven wrapper (`mvnw.cmd`) and `SqlServerJdbcSmokeTest` were NOT executed.
   - Spring Boot was NOT launched.

---

## 5. Git Status & Changed Files

### Git Status
```text
 M 05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md
?? 05_Development/database/reports/PHASE_5.8.3.91_CREDENTIAL_RUNNER_FIX_REPORT.md
?? 05_Development/database/reports/PHASE_5.8.3.92_PERSISTENT_CREDENTIAL_AUTOMATION_REVIEW.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

### Files Changed in Phase 5.8.3.91
- `05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1` (overload fix applied)
- `05_Development/database/reports/PHASE_5.8.3.91_CREDENTIAL_RUNNER_FIX_REPORT.md` (new report)

Zero staging, commits, or pushes were performed.

