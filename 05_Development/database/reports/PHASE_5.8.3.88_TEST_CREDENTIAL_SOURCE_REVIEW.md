# HSWRMS Phase 5.8.3.88 — Test Credential Source Review Report

**Timestamp:** 2026-10-28T19:30:00+07:00  
**Workspace:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Branch:** `feature/hswrms-m1-m6-integration`  
**Baseline HEAD:** `c2d2d6b01cb757319b3d4805b8b0262a261ca111`  
**Target Login:** `hswrms_test_user`  
**Target Catalog:** `HSWRMS_TEST`  
**Execution Mode:** STRICTLY READ-ONLY AUDIT (Zero credential changes, zero SQL, zero tests)  

---

## 1. Executive Summary & Verdict

Phase 5.8.3.88 investigated whether the existing password for SQL login `hswrms_test_user` is available through an approved local secret source or documented retrieval mechanism to permit running the isolated JDBC smoke test (`SqlServerJdbcSmokeTest`).

### Key Audit Findings:
1. **Provisioning Script Credential Mechanism:**
   [`provision_hswrms_test.ps1`](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/scripts/provision_hswrms_test.ps1#L55-L82) does **not** generate credentials and does **not** retrieve them from any local store or secret vault. It strictly accepts the password as an external parameter (`-TestPassword` as `SecureString`, `-PlaintextPasswordForTesting` for automated harnesses) or interactively prompts via `Read-Host -AsSecureString` (lines 168–174). In lines 423–438, it deterministically scrubs credentials from memory upon completion.
2. **Project Security Architecture Mandate:**
   [`HSWRMS_TEST_PROVISIONING_GUIDE.md`](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md#L37-L45) explicitly mandates that passwords must **never** be hardcoded in repository files, script files, or CLI arguments (`-v`). Credentials are deliberately **not persisted** anywhere on disk.
3. **Documented Loading Mechanism:**
   Per [`HSWRMS_TEST_PROVISIONING_GUIDE.md#L278-L292`](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md#L278-L292), the established test workflow requires the human operator to inject the credential into the execution session as an ephemeral process-scoped environment variable (`$env:SQLSERVER_TEST_PASSWORD = "..."`) prior to invoking Maven.
4. **Current Environment State:**
   Inspection of the active process environment variable names confirms that **neither `SQLSERVER_TEST_PASSWORD` nor `DB_PASSWORD` is present in the environment block**.
5. **Irrecoverability from Database Engine:**
   SQL Server stores login credentials as one-way salted hashes (`sys.sql_logins.password_hash`). Plaintext passwords cannot be extracted or reconstructed from the SQL Server engine.
6. **Password Availability:**
   Because the password was supplied interactively by the human operator during Stage A provisioning on 2026-10-27 and never persisted to disk, the password is **NOT AVAILABLE** in the automated workspace.

### Formal Verdict
**`NOT AVAILABLE`**

---

## 2. Artifact and Workflow Evidence

### 2.1 Provisioning Script: `provision_hswrms_test.ps1`
- **Parameter Definitions (lines 55–82):**
  Accepts `-TestPassword` (`System.Security.SecureString`) or `-PlaintextPasswordForTesting` (`string`). Does not default to or generate any credential.
- **Interactive Fallback (lines 167–174):**
  ```powershell
  # Only prompt interactively if no password parameter was explicitly bound
  $sec = Read-Host -Prompt "Enter HSWRMS test password (min 12 chars)" -AsSecureString
  ```
- **Password Invariants (lines 120–145):**
  Enforces minimum length of 12 characters and explicitly rejects default placeholders (`REPLACE_WITH_STRONG_PASSWORD_BEFORE_EXECUTION`, `CHANGE_ME_STRONG_PASSWORD!`) and macro syntax (`$(`).
- **Memory Scrubbing (lines 423–438):**
  Calls `[Marshal]::ZeroFreeBSTR($bstr)`, sets `$plainPass = $null`, and triggers `[GC]::Collect()`. The script leaves no residual credential on disk.

### 2.2 Provisioning Architecture: `HSWRMS_TEST_PROVISIONING_GUIDE.md`
- **Section 2.A — Prohibited Practices (lines 41–45):**
  - Prohibits hardcoding passwords in `.sql` files or any tracked repository file.
  - Prohibits passing passwords via command-line arguments (visible in Task Manager, `Get-Process`, Windows Event 4688, and `ConsoleHost_history.txt`).
- **Section 2.D — Ephemeral Process Environment Variables (lines 95–114):**
  Documents that credentials must be handled transiently in memory and assigned to process-scoped environment variables only for the duration of the command.
- **Section 6 — Stage B Live JDBC Smoke Test Execution (lines 278–292):**
  ```powershell
  $env:SQLSERVER_TEST_USERNAME = "hswrms_test_user"
  $env:SQLSERVER_TEST_PASSWORD = "<YourStrongTestPassword>"
  $env:SQLSERVER_TEST_DB = "HSWRMS_TEST"

  ./mvnw.cmd test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"

  $env:SQLSERVER_TEST_USERNAME = $null
  $env:SQLSERVER_TEST_PASSWORD = $null
  ```
- **Section 7.4 — Password Mismatch & One-Way Hash (lines 306–310):**
  Confirms that SQL Server stores passwords as one-way salted hashes (`sys.sql_logins.password_hash`). SQL Server provides zero capability to inspect or infer the plaintext password.

### 2.3 Configuration & Fail-Fast Validator Evidence
- **Datasource Configuration (`application-sqlserver-test.yml#L22-L23`):**
  ```yaml
  username: ${SQLSERVER_TEST_USERNAME:${DB_USERNAME:}}
  password: ${SQLSERVER_TEST_PASSWORD:${DB_PASSWORD:}}
  ```
- **Context Validator (`SqlServerTestConfigValidator.java#L52-L58`):**
  ```java
  if (password == null || password.trim().isEmpty() || isUnresolvedPlaceholder(password)) {
      throw new IllegalStateException(
          "SQL Server test configuration error: Test password is missing, blank, or an unresolved placeholder. " +
          "Please configure environment variable SQLSERVER_TEST_PASSWORD (or DB_PASSWORD) " +
          "before activating profile 'sqlserver-test'."
      );
  }
  ```

---

## 3. Environment Variable Name Audit

A complete scan of the process environment block was performed. The following table categorizes all environment variable names discovered:

| Category | Environment Variable Names Present |
| :--- | :--- |
| **Project Test Credentials** | **NONE** (`SQLSERVER_TEST_USERNAME`, `SQLSERVER_TEST_PASSWORD`, `DB_USERNAME`, `DB_PASSWORD`, `HSWRMS_ENABLE_SQLSERVER_TEST` are all **ABSENT**) |
| **System & Runtime Paths** | `ALLUSERSPROFILE`, `APPDATA`, `CommonProgramFiles`, `CommonProgramFiles(x86)`, `CommonProgramW6432`, `COMPUTERNAME`, `ComSpec`, `DriverData`, `HOMEDRIVE`, `HOMEPATH`, `JAVA_HOME`, `LOCALAPPDATA`, `LOGONSERVER`, `NUMBER_OF_PROCESSORS`, `OS`, `PATH`, `PATHEXT`, `ProgramData`, `ProgramFiles`, `ProgramFiles(x86)`, `ProgramW6432`, `PSModulePath`, `PUBLIC`, `SystemDrive`, `SystemRoot`, `TEMP`, `TMP`, `USERDOMAIN`, `USERDOMAIN_ROAMINGPROFILE`, `USERNAME`, `USERPROFILE`, `windir` |
| **Antigravity Tooling / Session** | `AGY_ENABLE_HUB`, `ANTIGRAVITY_AGENT`, `ANTIGRAVITY_AGENTAPI_EXE`, `ANTIGRAVITY_APP_DATA_DIR`, `ANTIGRAVITY_AUTH_SUCCESS_APP`, `ANTIGRAVITY_CONVERSATION_ID`, `ANTIGRAVITY_CSRF_TOKEN`, `ANTIGRAVITY_LS_ADDRESS`, `ANTIGRAVITY_LS_VERSION`, `ANTIGRAVITY_PROJECT_ID`, `ANTIGRAVITY_SOURCE_METADATA`, `ANTIGRAVITY_TRAJECTORY_ID`, `ANTIGRAVITY_VSCODE_HOST` |
| **VSCode / Electron Subsystem** | `CHROME_CRASHPAD_PIPE_NAME`, `ELECTRON_RUN_AS_NODE`, `VSCODE_CODE_CACHE_PATH`, `VSCODE_CRASH_REPORTER_PROCESS_TYPE`, `VSCODE_CWD`, `VSCODE_ESM_ENTRYPOINT`, `VSCODE_HANDLES_UNCAUGHT_ERRORS`, `VSCODE_IPC_HOOK`, `VSCODE_NLS_CONFIG`, `VSCODE_PID` |
| **Development Utilities** | `CURL_CA_BUNDLE`, `GDAL_DATA`, `GIT_EDITOR`, `HGEDITOR`, `HOME`, `JJ_EDITOR`, `NODE_USE_SYSTEM_CA`, `POSTGIS_ENABLE_OUTDB_RASTERS`, `POSTGIS_GDAL_ENABLED_DRIVERS`, `PROJ_LIB` |

*Zero sensitive values, passwords, or connection strings were logged, printed, or inspected.*

---

## 4. Evaluation of Specific Review Questions

1. **Does the provisioning script generate, accept, or retrieve the test login password?**  
   **Accepts only.** It does not generate passwords and does not retrieve them from a vault or local store. It accepts input via parameters or interactive prompt.
2. **Does an existing documented secure retrieval mechanism exist?**  
   **No automated retrieval mechanism exists.** The documented mechanism is manual injection by the operator into process-scoped environment variables (`$env:SQLSERVER_TEST_PASSWORD`).
3. **Can the current Maven execution environment inherit `SQLSERVER_TEST_USERNAME` and `SQLSERVER_TEST_PASSWORD`?**  
   **Mechanically yes, but currently no values exist.** Maven child processes inherit the parent PowerShell environment block; however, because the variables are currently unset in the process, Maven inherits empty strings and fails fast.
4. **Is the password actually available without revealing it?**  
   **No.** It does not exist in any file, variable, or extractable engine structure in this workspace.

---

## 5. Next Steps & Safe Resolution Pathways

Since the password is not stored locally, one of the following authorized actions is required by the operator to enable JDBC smoke testing:

1. **Option A (Operator Supplies Credential):**  
   If the operator remembers or securely manages the password chosen during Stage A provisioning (2026-10-27), the operator sets the environment variable in the execution shell:
   ```powershell
   $env:SQLSERVER_TEST_USERNAME = "hswrms_test_user"
   $env:SQLSERVER_TEST_PASSWORD = "<SecretPassword>"
   ```
2. **Option B (Controlled Password Synchronization via Windows Auth):**  
   If the chosen password is lost or forgotten, the administrator (`MYLIFE-MYRULE-1\ADMIN` via Windows Authentication `-E`) can synchronize the password using an explicit administrative statement in a separately authorized phase:
   ```sql
   ALTER LOGIN [hswrms_test_user] WITH PASSWORD = N'<NewStrongPassword>';
   ```
   *(Note: Resetting passwords is strictly prohibited in Phase 5.8.3.88 and requires separate explicit user authorization).*

================================================================================  
**END OF REPORT — PHASE 5.8.3.88**

