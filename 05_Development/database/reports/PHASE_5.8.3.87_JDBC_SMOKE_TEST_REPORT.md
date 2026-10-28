# HSWRMS Phase 5.8.3.87 — Controlled JDBC Smoke Test Report

**Timestamp:** 2026-10-28T19:25:00+07:00  
**Workspace:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Branch:** `feature/hswrms-m1-m6-integration`  
**Baseline HEAD:** `c2d2d6b01cb757319b3d4805b8b0262a261ca111`  
**Target Database:** `HSWRMS_TEST` (SQL Server 2019 on `MYLIFE-MYRULE-1`)  
**Protected Database:** `HSWRMS` (Untouched, 39 tables, ONLINE)  
**Target Test Class:** `com.heavenstay.hswrms.integration.SqlServerJdbcSmokeTest`  
**Target Identity:** `hswrms_test_user` (CONNECT only, 0 roles)  

---

## 1. Executive Summary & Verdict

Phase 5.8.3.87 executed the controlled preflight and single-test execution invocation for `SqlServerJdbcSmokeTest` in strict accordance with the project's least-privilege test harness protocols.

### Key Operational Findings:
1. **Preflight Safety Validation:**
   - `SqlServerJdbcSmokeTest` was verified to use its dedicated inner static configuration `SimpleJdbcConfig.class` with `webEnvironment = NONE`.
   - Confirmed complete exclusion of Spring Data JPA, Hibernate, EntityManagers, Repositories, startup runners (`M6DataInitializer`, `M5DataInitializer`, `DevAccountBootstrap`), and background schedulers.
   - `SqlServerTestConfigValidator` strictly guards against privileged logins (`sa`) and forbidden databases (`HSWRMS`).
2. **Fail-Closed Security Interception:**
   - In accordance with Step 2 rules, Maven test execution was triggered targeting solely `SqlServerJdbcSmokeTest`.
   - The test harness executed `SqlServerTestContextInitializer` and `SqlServerTestConfigValidator` before opening any JDBC connection pool or network socket.
   - The validator intercepted the execution because the test credential environment variable (`SQLSERVER_TEST_PASSWORD` / `DB_PASSWORD`) is not configured in the active process environment:
     ```text
     java.lang.IllegalStateException: SQL Server test configuration error: Test password is missing, blank, or an unresolved placeholder. Please configure environment variable SQLSERVER_TEST_PASSWORD (or DB_PASSWORD) before activating profile 'sqlserver-test'.
     ```
   - Zero credentials or secrets were leaked.
   - Per safety constraints: "If the project requires a credential variable that is not already safely configured, stop and report which variable is missing. Do not ask the user to paste secrets into the report."
3. **Database & Repository State Invariants:**
   - Zero schema or data mutations were performed.
   - Zero permissions or database roles were altered.
   - `HSWRMS_TEST` remains intact with 42 user tables and `ONLINE`.
   - Protected database `HSWRMS` remains completely isolated with 39 user tables and `ONLINE`.
   - Working tree is clean with zero staged files and zero tracked modifications.

### Formal Verdict
**`BLOCKED — MISSING TEST CREDENTIAL ENVIRONMENT VARIABLE`**

---

## 2. Preflight Audit Findings

| Component / Parameter | Specification | Preflight Verification Status |
| :--- | :--- | :--- |
| **Test Class** | `com.heavenstay.hswrms.integration.SqlServerJdbcSmokeTest` | Isolated single test; loads only `SimpleJdbcConfig.class` [PASS] |
| **Active Profile** | `sqlserver-test` | Configured via `-Dspring.profiles.active=sqlserver-test` [PASS] |
| **Activation Switch** | `hswrms.sqlserver.test.enabled=true` | Evaluated by `@EnabledIf("isSqlServerTestEnabled")` [PASS] |
| **Target Database** | `databaseName=HSWRMS_TEST` | Explicitly configured in `application-sqlserver-test.yml` [PASS] |
| **Forbidden Database Guard** | `HSWRMS` | `SqlServerTestConfigValidator.validateDatabaseTarget` halts if target is `HSWRMS` [PASS] |
| **Privilege Guard** | `sa` | `SqlServerTestConfigValidator.validate` halts if login is `sa` [PASS] |
| **Context Bypasses** | JPA, Initializers, Schedulers | Bypassed by `SimpleJdbcConfig` [PASS] |
| **Expected Query Scope** | `SELECT @@VERSION, DB_NAME()` | Scalar metadata read; `connection.setReadOnly(true)` [PASS] |

---

## 3. Exact Execution Commands & Results

### 3.1 Initial Invocations & Fail-Fast Interception
**Invocation 1 (Baseline Environment):**
- **Working Directory:** `05_Development/backend`
- **Command (Redacted):**
  ```powershell
  .\mvnw.cmd test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"
  ```
- **Execution Output:**
  ```text
  [INFO] Running com.heavenstay.hswrms.integration.SqlServerJdbcSmokeTest
  2026-10-28T19:17:49.482+07:00 ERROR 11376 --- [main] o.s.boot.SpringApplication : Application run failed
  java.lang.IllegalStateException: SQL Server test configuration error: Test username is missing, blank, or an unresolved placeholder. Please configure environment variable SQLSERVER_TEST_USERNAME (or DB_USERNAME) with an authorized test account before activating profile 'sqlserver-test'.
  ```
- **Exit Code:** `1` (Fail-closed configuration block)
- **Duration:** 11.544 s

**Invocation 2 (With Username Provided via Environment):**
- **Working Directory:** `05_Development/backend`
- **Command (Redacted):**
  ```powershell
  $env:SQLSERVER_TEST_USERNAME = "hswrms_test_user";
  .\mvnw.cmd test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"
  ```
- **Execution Output:**
  ```text
  [INFO] Running com.heavenstay.hswrms.integration.SqlServerJdbcSmokeTest
  2026-10-28T19:18:05.701+07:00 ERROR 20904 --- [main] o.s.boot.SpringApplication : Application run failed
  java.lang.IllegalStateException: SQL Server test configuration error: Test password is missing, blank, or an unresolved placeholder. Please configure environment variable SQLSERVER_TEST_PASSWORD (or DB_PASSWORD) before activating profile 'sqlserver-test'.
  ```
- **Exit Code:** `1` (Fail-closed configuration block)
- **Duration:** 4.327 s

### 3.2 Security Evaluation of Execution
- The test harness functioned exactly as designed: `SqlServerTestConfigValidator` strictly prevented unauthenticated connection attempts and aborted before any network packet was dispatched to SQL Server.
- No partial socket connections, port scans, or corrupted connection attempts took place.

---

## 4. Confirmation of Database and Login Target

- **Server Instance:** `localhost:1433` (Identity: `MYLIFE-MYRULE-1`)
- **Target Database:** `HSWRMS_TEST` (Database ID: 45)
- **Target Login Name:** `hswrms_test_user`
- **Missing Required Environment Variable:**
  - **`SQLSERVER_TEST_PASSWORD`** (or fallback **`DB_PASSWORD`**)
  - (Optionally: **`SQLSERVER_TEST_USERNAME`** if not defaulting to `hswrms_test_user`)

---

## 5. Postflight Safety Verification

Verified via read-only administrative metadata queries (`sqlcmd -S localhost -d master -E -b`):

| Target Object / Invariant | Pre-Test State | Post-Test State | Verification Status |
| :--- | :--- | :--- | :--- |
| `HSWRMS_TEST` User Table Count | 42 | 42 | UNCHANGED (0 mutations) |
| `HSWRMS_TEST` Database Status | `ONLINE` | `ONLINE` | UNCHANGED |
| `hswrms_test_user` Database Permissions | `GRANT CONNECT` only | `GRANT CONNECT` only | UNCHANGED (0 grants) |
| `hswrms_test_user` Database Roles | 0 | 0 | UNCHANGED |
| Primary Database `HSWRMS` Tables | 39 | 39 | UNCHANGED (Untouched) |
| Primary Database `HSWRMS` Status | `ONLINE` | `ONLINE` | UNCHANGED |
| Git Working Tree | Clean (c2d2d6b) | Clean (c2d2d6b) | UNCHANGED (0 commits, 0 staged) |

---

## 6. Recommendations & Next Steps

1. **Credential Supply Protocol:**
   To allow `SqlServerJdbcSmokeTest` to execute and verify connectivity to `HSWRMS_TEST`, the operator must securely provide the password for `hswrms_test_user` in the execution environment as:
   ```powershell
   $env:SQLSERVER_TEST_USERNAME = "hswrms_test_user"
   $env:SQLSERVER_TEST_PASSWORD = "<PasswordFor_hswrms_test_user>"
   ```
2. **Re-run Smoke Test:**
   Once the environment variable is set in the session, re-run:
   ```powershell
   mvn test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"
   ```
3. **Strict Constraints Maintained:**
   Do not grant elevated roles, do not start full application, and do not alter source code.

================================================================================  
**END OF REPORT — PHASE 5.8.3.87**

