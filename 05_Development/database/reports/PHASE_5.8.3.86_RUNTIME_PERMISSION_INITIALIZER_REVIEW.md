# HSWRMS Phase 5.8.3.86 — Runtime Permission & Initializer Review Report

**Timestamp:** 2026-10-28T19:15:00+07:00  
**Workspace:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Branch:** `feature/hswrms-m1-m6-integration`  
**Baseline HEAD:** `c2d2d6b01cb757319b3d4805b8b0262a261ca111`  
**Target Database:** `HSWRMS_TEST` (SQL Server 2019 on `MYLIFE-MYRULE-1`)  
**Protected Database:** `HSWRMS` (Untouched, 39 tables, ONLINE)  
**Runtime Principal:** `hswrms_test_user` (Enabled, CONNECT only, 0 roles)  
**Execution Mode:** STRICTLY READ-ONLY AUDIT (Zero SQL DDL/DML, Zero Grants, Zero Startup)  

---

## 1. Executive Summary & Verdicts

This phase performed an exhaustive, strictly read-only audit of:
1. All application startup initializers (`ApplicationRunner`, `CommandLineRunner`, `@PostConstruct`, `@Scheduled` tasks).
2. Runtime database permission requirements across four distinct operational use cases.
3. Live SQL Server security posture for login and database user `hswrms_test_user`.
4. Integrity and isolation of the protected primary database `HSWRMS`.

### Summary of Key Findings
1. **Full Spring Boot Startup Safety:** **BLOCKED / NOT SAFE**.  
   `M6DataInitializer` is an **unconditional `@Component`** with `@Order(50)` and `@Transactional`. It runs on every full ApplicationContext startup regardless of active profile. Currently, `dbo.[Role]`, `dbo.[Permission]`, `dbo.RolePermission`, and `dbo.SystemConfiguration` contain 0 rows in `HSWRMS_TEST`. On startup, `M6DataInitializer` immediately attempts to `INSERT` baseline roles, permissions, role-permissions, and system configuration rows. If `hswrms_test_user` has only `CONNECT`, startup crashes with SQL Server Error 229 (Permission Denied). If granted write access, unreviewed data mutations occur automatically.
2. **Dev Bootstrap Safety:** **CONDITIONALLY UNSAFE**.  
   `DevAccountBootstrap` is annotated with `@Profile("dev")`. In `application.yml`, the default profile is `dev` (`spring.profiles.active: ${SPRING_PROFILES_ACTIVE:dev}`). If an operator launches the application without explicitly specifying `SPRING_PROFILES_ACTIVE=prod` or `sqlserver-test`, `DevAccountBootstrap` attempts to seed demo accounts and credentials into `dbo.[User]`, `dbo.[Role]`, `dbo.UserRole`, `dbo.CustomerProfile`, and `dbo.ConsentRecord`.
3. **M5 Demo Seeding Safety:** **SAFE BY DEFAULT (CONDITIONAL)**.  
   `M5DataInitializer` is gated by `@ConditionalOnProperty(name = "app.seed.demo-data", havingValue = "true")`. Both `application.yml` and `application-sqlserver-test.yml` default this to `false`. It will not run unless deliberately overridden.
4. **JDBC Smoke Test Safety:** **PASS / SAFE**.  
   `SqlServerJdbcSmokeTest` uses an isolated static inner configuration (`SimpleJdbcConfig.class`) with `webEnvironment = NONE`. It loads **only** a `HikariDataSource` and completely bypasses Hibernate, JPA, EntityManagers, Repositories, and all `ApplicationRunner` beans (including `M6DataInitializer`). It executes only `SELECT @@VERSION, DB_NAME()` and requires **only** `CONNECT` permission, which `hswrms_test_user` already holds.
5. **Live SQL Server State:** **PASS / LEAST-PRIVILEGE VERIFIED**.  
   `HSWRMS_TEST` has 42 tables and is `ONLINE`. `hswrms_test_user` is enabled with default database `HSWRMS_TEST`. It holds **only** `GRANT CONNECT` on `HSWRMS_TEST`, zero database roles, zero server roles, and zero mapping in `HSWRMS`. `HSWRMS` remains completely isolated with 39 tables and is `ONLINE`.

### Formal Verdicts
- **Audit Execution:** `PASS`
- **JDBC Smoke Test Readiness (`SqlServerJdbcSmokeTest`):** `PASS`
- **Full Application Startup Readiness:** `BLOCKED` (Requires initializer mitigation & separate seed/permission sequencing)

---

## 2. Files and Startup Hooks Inspected

| Category | File Path | Scope / Mechanism |
| :--- | :--- | :--- |
| **Startup Initializer** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java` | `@Component`, `@Order(50)`, `ApplicationRunner` |
| **Startup Initializer** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/DevAccountBootstrap.java` | `@Component`, `@Profile("dev")`, `ApplicationRunner` |
| **Startup Initializer** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/config/M5DataInitializer.java` | `@Component`, `@ConditionalOnProperty("app.seed.demo-data")`, `CommandLineRunner` |
| **Scheduled Job** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/scheduler/SessionTimelineScheduler.java` | `@Scheduled(fixedRate = 60000)` |
| **Scheduled Job** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/job/DelegationExpiryJob.java` | `@Scheduled(fixedRateString = "${app.jobs.delegation-expiry.rate:60000}")` |
| **Scheduled Job** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/job/AccountUnlockJob.java` | `@Scheduled(cron = "${app.jobs.account-unlock.cron:0 */15 * * * *}")` |
| **Scheduled Job** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/job/AuditLogCleanupJob.java` | `@Scheduled(cron = "${app.jobs.audit-cleanup.cron:0 0 2 * * *}")` |
| **Test Hook** | `05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerTestContextInitializer.java` | `ApplicationContextInitializer<ConfigurableApplicationContext>` |
| **Test Validator** | `05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerTestConfigValidator.java` | Security & Target Validator |
| **Test Probe** | `05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerJdbcSmokeTest.java` | `@SpringBootTest(classes = SimpleJdbcConfig.class)` |
| **Configuration** | `05_Development/backend/src/main/resources/application.yml` | Production & default application configuration |
| **Configuration** | `05_Development/backend/src/test/resources/application.yml` | Default test configuration (H2 in-memory) |
| **Configuration** | `05_Development/backend/src/test/resources/application-sqlserver-test.yml` | Opt-in dedicated SQL Server test configuration |
| **Metadata Catalog** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/PermissionCatalog.java` | Granular permission definitions & defaults |
| **Service Layer** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/BusinessParameterService.java` | System configuration parameters |

---

## 3. Initializer Execution-Condition Matrix

| Initializer Bean | Execution Mechanism | Profile / Condition | Runs on Full App Startup? | Runs under `sqlserver-test`? | Can Write to DB? | Assumes Prior Seeds? | Failure Behavior on Error |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `M6DataInitializer` | `ApplicationRunner.run()` (`@Order(50)`) | **Unconditional** (No `@Profile`, no property condition) | **YES** (Always) | **YES** (if full context loaded) | **YES** | No (attempts to insert missing) | **Throws `DataAccessException`**, rolls back, **crashes startup**. |
| `DevAccountBootstrap` | `ApplicationRunner.run()` | `@Profile("dev")` | **YES** (if default profile active) | **NO** (`sqlserver-test` != `dev`) | **YES** | No (inserts missing roles/users) | Catches `Exception`, logs warning, **continues**. |
| `M5DataInitializer` | `CommandLineRunner.run()` | `@ConditionalOnProperty("app.seed.demo-data=true")` | **NO** (Default is `false`) | **NO** (Default is `false`) | **YES** | Checks `RetreatBooking.count() == 0` | **Throws unhandled exception**, **crashes startup**. |
| `SqlServerTestContextInitializer` | `ApplicationContextInitializer` | `sqlserver-test` profile | **NO** (Test only) | **YES** (In test classes registering it) | **NO** | N/A | **Throws `IllegalStateException`** before DataSource initializes. |
| `SqlServerJdbcSmokeTest.SimpleJdbcConfig` | Dedicated `@Configuration` | `sqlserver-test` + explicit flag | **NO** (Smoke test only) | **YES** (Opt-in only) | **NO** | N/A (Scalar `SELECT @@VERSION`) | Assertions fail cleanly via JUnit 5. |

---

## 4. Read/Write Table and Permission Matrix

| Initializer / Component | Tables Read (SELECT) | Tables Written (INSERT/UPDATE) | Required Database Permissions |
| :--- | :--- | :--- | :--- |
| `M6DataInitializer` | `dbo.[Role]`<br>`dbo.[Permission]`<br>`dbo.RolePermission`<br>`dbo.SystemConfiguration` | `dbo.[Role]` (INSERT)<br>`dbo.[Permission]` (INSERT)<br>`dbo.RolePermission` (INSERT)<br>`dbo.SystemConfiguration` (INSERT) | `CONNECT`<br>`SELECT` on 4 tables<br>`INSERT` on 4 tables |
| `DevAccountBootstrap` | `dbo.[Role]`<br>`dbo.[User]`<br>`dbo.UserRole`<br>`dbo.CustomerProfile`<br>`dbo.ConsentRecord` | `dbo.[Role]` (INSERT)<br>`dbo.[User]` (INSERT)<br>`dbo.UserRole` (INSERT)<br>`dbo.CustomerProfile` (INSERT)<br>`dbo.ConsentRecord` (INSERT) | `CONNECT`<br>`SELECT` on 5 tables<br>`INSERT` on 5 tables |
| `M5DataInitializer` | `RetreatBooking`, `VillaCategory`, `RetreatPackage`, `User`, `CustomerProfile`, `PhysicalVilla`, `Therapist`, `SpaTreatment`, `TreatmentRoom`, `PaymentTransaction`, `SpaSession`, `MealOrder`, `Folio`, `FolioItem`, `Invoice` (15 tables) | Same 15 tables (INSERT, UPDATE) | `CONNECT`<br>`SELECT` on 15 tables<br>`INSERT` on 15 tables<br>`UPDATE` on 15 tables |
| `SessionTimelineScheduler` | `dbo.SpaSession` | `dbo.SpaSession` (UPDATE) | `CONNECT`<br>`SELECT`, `UPDATE` on `SpaSession` |
| `DelegationExpiryJob` | `dbo.RightDelegation` | `dbo.RightDelegation` (UPDATE) | `CONNECT`<br>`SELECT`, `UPDATE` on `RightDelegation` |
| `SqlServerJdbcSmokeTest` | **None** (System scalar query `SELECT @@VERSION, DB_NAME()`) | **None** | **`CONNECT` only** |

---

## 5. SQL Server Live State & Runtime User Access Summary

Data gathered via strictly read-only catalog queries:

1. **Target Database `HSWRMS_TEST`:**
   - Status: `ONLINE` (Database ID: 45)
   - User Tables: Exactly 42 user tables (100% deployed and verified in Phase 5.8.3.85).
   - Data Row Count in `dbo.[Role]`: Exactly 0 rows.
2. **Protected Primary Database `HSWRMS`:**
   - Status: `ONLINE` (Database ID: 44)
   - User Tables: Exactly 39 user tables (100% untouched baseline).
   - Test User Mappings: Exactly 0.
3. **Runtime Login `hswrms_test_user`:**
   - Status: Enabled (`is_disabled = 0`).
   - Default Database: `HSWRMS_TEST`.
   - Server Role Memberships: **0** (Only default `public`; no `sysadmin`, `securityadmin`, etc.).
   - Explicit Server Permissions: **0**.
4. **Database User `hswrms_test_user` in `HSWRMS_TEST`:**
   - Mapping: Present (`SQL_USER`, default schema `dbo`).
   - Database Role Memberships: **0** (Only default `public`; no `db_owner`, `db_datareader`, `db_datawriter`, `db_ddladmin`).
   - Explicit Database Permissions: Exactly **`GRANT CONNECT`** at `DATABASE` scope.

---

## 6. Risks and Code Evidence

### Risk 1: Unconditional Initialization Crash (`M6DataInitializer`)
- **Evidence:** `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java#L29-L31`:
  ```java
  @Component
  @Order(50)
  public class M6DataInitializer implements ApplicationRunner
  ```
- **Mechanism:** Lines 57-59 attempt `roleRepo.save(new Role(rName, entry.getValue()))`. Lines 66-67 attempt `permissionRepo.save(...)`. Lines 74-75 attempt `rolePermissionRepo.save(...)`. Lines 99-101 attempt `configRepo.save(...)`.
- **Impact:** Because `hswrms_test_user` currently lacks `INSERT` permissions, Spring's `@Transactional` boundary (line 51) fails with SQL Server Error 229, rolls back, and causes the Spring ApplicationContext startup to abort. If write permissions were granted prematurely, unreviewed data insertions would occur.

### Risk 2: Default Profile Fallback to `dev` (`DevAccountBootstrap`)
- **Evidence:** `05_Development/backend/src/main/resources/application.yml#L13-L14`:
  ```yaml
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
  ```
  and `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/DevAccountBootstrap.java#L41-L43`:
  ```java
  @Component
  @Profile("dev")
  public class DevAccountBootstrap implements ApplicationRunner
  ```
- **Impact:** If `SPRING_PROFILES_ACTIVE` is omitted during launch, Spring activates `dev`, causing `DevAccountBootstrap` to run. While lines 110-114 wrap the execution in a `try-catch` logging a warning, it produces noisy SQL permission errors.

### Risk 3: Background Scheduled Mutators
- **Evidence:** `SessionTimelineScheduler.java#L44` (`fixedRate = 60000`) and `DelegationExpiryJob.java#L35` (`fixedRateString = "60000"`).
- **Impact:** As soon as the ApplicationContext is up, background threads attempt periodic DML updates against `SpaSession` and `RightDelegation`.

---

## 7. Minimum-Permission Recommendation for Each Use Case

### Use Case 1: JDBC Connectivity-Only Smoke Test (`SqlServerJdbcSmokeTest`)
- **Demonstrated Code Scope:** `SqlServerJdbcSmokeTest.SimpleJdbcConfig` executes only `SELECT @@VERSION, DB_NAME()`.
- **Minimum Permissions Required:**
  - `GRANT CONNECT TO hswrms_test_user;` on database `HSWRMS_TEST`.
- **Current Live Status:** **ALREADY GRANTED AND VERIFIED**.
- **Action Required:** Zero SQL grants needed. Ready for execution under `sqlserver-test` profile.

### Use Case 2: Read-Only Application Context Validation (Schema & Dialect Probe)
- **Demonstrated Code Scope:** Hibernate dialect validation and entity mapping checks.
- **Minimum Permissions Required:**
  - `CONNECT` on `HSWRMS_TEST`.
  - Database role `db_datareader` (or `GRANT SELECT` on `INFORMATION_SCHEMA` and all user tables).
  - `VIEW DEFINITION` on `HSWRMS_TEST`.
- **Prerequisite:** Initializers (`M6DataInitializer`, `DevAccountBootstrap`) must be mocked or suppressed.

### Use Case 3: Full Spring Boot Startup with Initializers Disabled (Idle Runtime)
- **Demonstrated Code Scope:** ApplicationContext boots without startup DML.
- **Minimum Permissions Required:**
  - `CONNECT` on `HSWRMS_TEST`.
  - `db_datareader` (SELECT on all user tables).
  - Background schedulers disabled (`@EnableScheduling` conditional or overridden).

### Use Case 4: Full Spring Boot Startup with Approved Initializers & Business Transactions
- **Demonstrated Code Scope:** Normal resort management operation (M1 through M6).
- **Minimum Permissions Required:**
  - `CONNECT` on `HSWRMS_TEST`.
  - Database role `db_datareader` (SELECT on all tables).
  - Database role `db_datawriter` (INSERT, UPDATE, DELETE on all tables).
  - Strict Prohibitions: **NO** `db_owner`, **NO** `db_ddladmin`, **NO** server roles (`sysadmin`, etc.), **NO** permissions on `HSWRMS`.

---

## 8. Justification for a Separate Controlled Permission Phase

A dedicated, separate permission-setup phase is justified before attempting full application startup:
1. **Separation of Concerns:** Phase 5.8.3.85 established the clean 42-table schema. Phase 5.8.3.86 completed the read-only audit. Runtime permission grants should be executed and verified as an independent step.
2. **Immediate Path Forward:** Because `hswrms_test_user` already possesses `CONNECT` on `HSWRMS_TEST`, **Use Case 1 (`SqlServerJdbcSmokeTest`) can be executed immediately without any permission modifications**.
3. **Controlled Sequence for Full Startup:**
   - Step A: Execute `SqlServerJdbcSmokeTest` to verify JDBC connectivity under least privilege (`CONNECT` only).
   - Step B: Apply segregated Section 9 role seeds to `HSWRMS_TEST` via human authorization.
   - Step C: Make `M6DataInitializer` conditional or review its initial seeding behavior.
   - Step D: Grant `db_datareader` and `db_datawriter` to `hswrms_test_user` in `HSWRMS_TEST` only.

---

## 9. Explicit Compliance Statements

1. **No Mutations:** Zero INSERT, UPDATE, DELETE, MERGE, CREATE, ALTER, DROP, or TRUNCATE statements were executed during this phase.
2. **No Grants or Revokes:** Zero GRANT, REVOKE, or DENY statements were executed. Zero database roles or server roles were assigned.
3. **No Code or Git Changes:** Zero source, test, or configuration files were modified. Zero Git commits, staging, or pushes were performed.
4. **Primary Database Protection:** Database `HSWRMS` was accessed strictly for read-only catalog table counts and remains 100% untouched at 39 tables, `ONLINE`.
5. **No Application Launch:** Neither the full Spring Boot application nor any mutating integration test was executed.

---

## 10. Limitations & Unresolved Questions

1. **`M6DataInitializer` Design Intent:** `M6DataInitializer` was written as an unconditional startup runner. To run integration tests against a clean database without automatic writes, a configuration toggle (e.g., `app.m6.initialize-metadata: false` or `@ConditionalOnProperty`) is recommended for future phases.
2. **Credentials Handling:** Password values were not exposed in command lines or reports. Any future test activation must pass credentials via secure environment variables (`SQLSERVER_TEST_PASSWORD`).

================================================================================  
**END OF REPORT — PHASE 5.8.3.86**

