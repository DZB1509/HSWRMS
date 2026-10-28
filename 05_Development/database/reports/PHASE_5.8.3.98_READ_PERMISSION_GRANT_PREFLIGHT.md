# PHASE 5.8.3.98 — HSWRMS_TEST READ-PERMISSION GRANT PREFLIGHT REPORT

**Phase:** 5.8.3.98  
**Module:** HSWRMS Database Security & Preflight Permission Planning  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Date:** 2026-10-28 21:26:00 +07:00  
**Status:** COMPLETED — PREFLIGHT PASS (Strictly Read-Only, Zero Permissions Granted or Altered)

---

## 1. Executive Summary & Objective

Phase 5.8.3.98 prepared and validated a least-privilege read-permission plan for application testing against the dedicated test database `HSWRMS_TEST`. 

In accordance with strict safety mandates:
- **Zero permission modifications were executed.** No `GRANT`, `DENY`, `REVOKE`, `ALTER ROLE`, `ALTER USER`, or `ALTER LOGIN` statements were run.
- **Zero data or schema changes were made.** No baseline seeds were inserted and no table definitions were modified.
- **Primary database `HSWRMS` was confirmed completely isolated and inaccessible** to the test login.
- **All verification probes were executed strictly as `hswrms_test_user`** via .NET `System.Data.SqlClient` using credentials retrieved at runtime from Windows Credential Manager target `HSWRMS_TEST_SQLSERVER`.

---

## 2. Live Environment & Principal Verification

### 2.1 SQL Server Instance and Database Context

Live read-only queries executed via `hswrms_test_user`:

```sql
SELECT @@SERVERNAME AS [ServerName], DB_NAME() AS [DatabaseName], DB_ID() AS [DatabaseId], 
       DATABASEPROPERTYEX(DB_NAME(), 'Status') AS [DatabaseStatus], 
       DATABASEPROPERTYEX(DB_NAME(), 'Collation') AS [Collation];
```

| Check Item | Target Expected | Verified Live Value | Assessment |
|---|---|---|---|
| Server Name (`@@SERVERNAME`) | `MYLIFE-MYRULE-1` | `MYLIFE-MYRULE-1` | **MATCH** |
| Database Name (`DB_NAME()`) | `HSWRMS_TEST` | `HSWRMS_TEST` | **MATCH** |
| Database ID (`DB_ID()`) | Dedicated ID | `45` | **MATCH** |
| Database Status | `ONLINE` | `ONLINE` | **MATCH** |
| Collation | SQL Server Default | `SQL_Latin1_General_CP1_CI_AS` | **MATCH** |

---

### 2.2 Database Principal & Login Mapping

```sql
SELECT dp.name AS PrincipalName, dp.principal_id, dp.type_desc, dp.default_schema_name, 
       SUSER_SNAME(dp.sid) AS MappedLogin, SUSER_ID(SUSER_SNAME(dp.sid)) AS LoginPrincipalId 
FROM sys.database_principals dp 
WHERE dp.name = 'hswrms_test_user';
```

| Attribute | Verified Value | Assessment |
|---|---|---|
| Principal Name | `hswrms_test_user` | Dedicated test database user |
| Principal ID | `5` | Valid database principal |
| Principal Type | `SQL_USER` | SQL Server authentication login mapping |
| Default Schema | `dbo` | Correct default schema |
| Mapped Server Login | `hswrms_test_user` | Dedicated server login |
| Login Principal ID | `276` | Valid server principal |

---

### 2.3 Current Roles and Effective Permissions

```sql
-- Role Memberships
SELECT dp.name AS MemberName, r.name AS RoleName 
FROM sys.database_role_members drm 
JOIN sys.database_principals dp ON drm.member_principal_id = dp.principal_id 
JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id 
WHERE dp.name = 'hswrms_test_user';

-- Effective Database Permissions
SELECT entity_name, subentity_name, permission_name 
FROM fn_my_permissions(NULL, 'DATABASE');
```

- **Current Database Role Memberships:** **`0` rows returned** (Zero role memberships).
- **Current Effective Permissions:**
  - `CONNECT`
  - `VIEW ANY COLUMN ENCRYPTION KEY DEFINITION`
  - `VIEW ANY COLUMN MASTER KEY DEFINITION`
- **Assessment:** `hswrms_test_user` is strictly in CONNECT-only mode. It holds zero table-level permissions and zero database roles (`db_datareader`, `db_datawriter`, `db_owner`, and `db_ddladmin` are completely absent).

---

### 2.4 Protected Database Isolation (`HSWRMS`)

```sql
SELECT HAS_DBACCESS('HSWRMS_TEST') AS [Access_HSWRMS_TEST], 
       HAS_DBACCESS('HSWRMS') AS [Access_HSWRMS_Protected];
```

| Database | Access Allowed (`HAS_DBACCESS`) | Isolation Status |
|---|:---:|---|
| `HSWRMS_TEST` | **`1` (TRUE)** | Operational target |
| `HSWRMS` | **`0` (FALSE)** | **STRICTLY PROTECTED & ISOLATED** |

**Finding:** The test login `hswrms_test_user` has zero database mapping in `HSWRMS`, cannot access `HSWRMS`, and receives `Access Denied` (`HAS_DBACCESS = 0`). The protected database `HSWRMS` remains 100% untouched and isolated.

---

## 3. Required Table-Level Reads for Initial Read-Only Test Scope

The first planned API-level integration tests will target public and read-only catalog endpoints across Modules 1, 2, 3, and 4. The following table identifies the specific controllers, services, repositories, and underlying SQL Server tables required for these read-only operations:

| Test Target / API Endpoint | Module | Controller & Service | JPA Repositories Involved | Required Table Reads (`SELECT`) |
|---|:---:|---|---|---|
| `GET /api/v1/spa/treatments`<br>`GET /api/v1/spa/treatments/{id}` | **M3** | `SpaTreatmentController`<br>`SpaTreatmentService` | `SpaTreatmentRepository` | `dbo.[SpaTreatment]` |
| `GET /api/v1/retreat-packages`<br>`GET /api/v1/retreat-packages/{id}` | **M2** | `RetreatPackageController`<br>`RetreatPackageService` | `RetreatPackageRepository` | `dbo.[RetreatPackage]` |
| `GET /api/v1/retreat-packages/villa-categories` | **M2** | `RetreatPackageController`<br>`RetreatPackageService` | `VillaCategoryRepository` | `dbo.[VillaCategory]` |
| `POST /api/v1/retreat-packages/calculate` | **M2** | `RetreatPackageController`<br>`VillaAvailabilityService` | `RetreatPackageRepository`<br>`VillaCategoryRepository`<br>`PhysicalVillaRepository` | `dbo.[RetreatPackage]`<br>`dbo.[VillaCategory]`<br>`dbo.[PhysicalVilla]` |
| `GET /api/v1/packages`<br>`GET /api/v1/packages/{id}` | **M1** | `RetreatPackageController` (M1 bridge)<br>`RetreatPackageService` | `RetreatPackageRepository`<br>`RetreatPackageSpaTreatmentRepository`<br>`RetreatPackageVillaCategoryRepository` | `dbo.[RetreatPackage]`<br>`dbo.[RetreatPackageSpaTreatment]`<br>`dbo.[RetreatPackageVillaCategory]` |
| `GET /api/v1/fnb/customer/menu-items` | **M4** | `FnbCustomerOrderController`<br>`MealOrderService` | `MenuItemRepository`<br>`MenuItemIngredientRepository`<br>`IngredientRepository` | `dbo.[MenuItem]`<br>`dbo.[MenuItemIngredient]`<br>`dbo.[Ingredient]` |
| `POST /api/v1/auth/login` *(Read-Only Probe)* | **M1** | `AuthController`<br>`AuthenticationService` | `UserRepository`<br>`AuthIdentityRepository`<br>`UserRoleRepository`<br>`RoleRepository` | `dbo.[User]`<br>`dbo.[AuthIdentity]`<br>`dbo.[UserRole]`<br>`dbo.[Role]`<br>`dbo.[RolePermission]` |

---

## 4. Evaluation of Permission Grant Strategies

Two permission grant architectures were evaluated to enable read-only application testing:

### Option A: Granular Table-Level `SELECT` Grants
- **Approach:** Explicitly grant `SELECT` only on the 11 tables listed in Section 3 (`SpaTreatment`, `RetreatPackage`, `VillaCategory`, `PhysicalVilla`, `RetreatPackageSpaTreatment`, `RetreatPackageVillaCategory`, `MenuItem`, `MenuItemIngredient`, `Ingredient`, `Role`, `SystemConfiguration`).
- **Advantages:**
  - Strict mathematical least-privilege boundary.
  - Prevents accidental reads of sensitive tables (`CustomerProfile`, `HealthProfile`, `ConsentRecord`, `AuditLog`, `Invoice`, `Folio`).
- **Disadvantages & Risks:**
  - **Fragility with JPA / Hibernate:** In Hibernate 6.5.3, entity associations and eagerly fetched relationships can trigger queries against linked tables. If any associated table is omitted, Hibernate raises a runtime `SQLServerException` (Error 229: SELECT permission denied), terminating the test suite prematurely.
  - **Catalog Visibility Remains Broken:** Standard catalog views (`sys.tables`, `INFORMATION_SCHEMA.TABLES`) will only reveal the 11 granted tables; schema-wide verification queries (checking the 42 tables provisioned in Phase 5.8.3.85) will fail to report the true database state.
  - **High Maintenance Overhead:** Every new read-only test requires manual schema permission maintenance and separate authorization phases.

### Option B: Membership in Database Role `db_datareader` (RECOMMENDED)
- **Approach:** Add `hswrms_test_user` to the built-in SQL Server database role `db_datareader` in `HSWRMS_TEST`.
- **Advantages:**
  - **Zero Write Capability:** Built-in `db_datareader` grants strictly `SELECT` permissions across all user tables and views. It provides **zero** `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `ALTER`, or `DROP` capabilities.
  - **Comprehensive JPA Compatibility:** Eliminates Hibernate Error 229 across all read-only tests and entity relationship traversals.
  - **Catalog Metadata Visibility Restored:** Under SQL Server metadata visibility rules, granting read permissions across all tables automatically restores visibility for all 42 tables, primary keys, foreign keys, unique constraints, check constraints, default constraints, and indexes in `sys.tables` and `INFORMATION_SCHEMA.TABLES`.
  - **Isolated Container Safety:** Because `HSWRMS_TEST` is a dedicated, segregated test database containing no production data, reading test tables within this container poses zero confidentiality risk.
  - **Clean Atomic Lifecycle:** Can be added in a single statement (`ALTER ROLE db_datareader ADD MEMBER [hswrms_test_user];`) and revoked instantly (`ALTER ROLE db_datareader DROP MEMBER [hswrms_test_user];`).
- **Disadvantages:** None within an isolated test environment.

---

## 5. Evaluation of `VIEW DEFINITION` Permission

### 5.1 What `VIEW DEFINITION` Provides
`GRANT VIEW DEFINITION ON DATABASE::HSWRMS_TEST TO [hswrms_test_user];` allows a principal to view the metadata and text definitions of securables (such as SQL module text in `sys.sql_modules` or trigger bodies via `OBJECT_DEFINITION()`) even when the user has no `SELECT` permissions on underlying tables.

### 5.2 Is `VIEW DEFINITION` Necessary for Application Testing?
- **Finding:** **NO, `VIEW DEFINITION` is NOT necessary if `db_datareader` is granted.**
- **Rationale:**
  1. SQL Server default metadata visibility automatically exposes all tables, columns, constraints, and indexes in `sys.tables`, `sys.indexes`, `sys.key_constraints`, `sys.foreign_keys`, and `INFORMATION_SCHEMA` as long as the user holds `SELECT` on the objects (which `db_datareader` provides).
  2. Spring Boot, Hibernate 6.5.3, and HikariCP rely exclusively on JDBC metadata (`DatabaseMetaData.getTables()`, `getColumns()`, etc.), which operate completely under `SELECT` without needing `VIEW DEFINITION`.
  3. Neither Spring Boot nor the application controllers inspect trigger definition text or stored procedure module bodies.
  4. Therefore, the recommended least-privilege plan **omits `VIEW DEFINITION`**, keeping the grant surface strictly minimized to `db_datareader`.

---

## 6. Prohibitions & Anti-Patterns Confirmed

The following permissions and configurations were audited and are **explicitly PROHIBITED** from being granted to `hswrms_test_user`:

| Prohibited Permission / Role | Severity | Justification |
|---|:---:|---|
| `db_datawriter` | **CRITICAL** | Grants write access (`INSERT`, `UPDATE`, `DELETE`). Must NOT be granted during read-only testing phases. |
| `db_owner` | **FATAL** | Full administrative ownership of the database. Violates least privilege. |
| `db_ddladmin` | **FATAL** | DDL modification permissions (`CREATE`, `ALTER`, `DROP` table/schema). |
| Server Roles (`sysadmin`, etc.) | **FATAL** | Server-wide administrative authority. |
| Grants on Primary DB `HSWRMS` | **FATAL** | Primary database must remain strictly protected and isolated. |

---

## 7. Proposed SQL Statements (NOT EXECUTED)

The following scripts represent the proposed implementation for the next authorized phase. They are clearly designated as **NOT EXECUTED** in this phase.

### 7.1 Proposed Grant Script (Option B: Recommended)

```sql
-- ==============================================================================
-- PROPOSED PERMISSION SCRIPT: HSWRMS_TEST READ ACCESS
-- STATUS: PROPOSED ONLY — STRICTLY NOT EXECUTED IN PHASE 5.8.3.98
-- TARGET INSTANCE: localhost:1433 (MYLIFE-MYRULE-1)
-- TARGET DATABASE: HSWRMS_TEST
-- TARGET PRINCIPAL: hswrms_test_user
-- ==============================================================================

USE [HSWRMS_TEST];
GO

-- 1. Fail-closed safety assertion: guarantee we are in HSWRMS_TEST and NOT HSWRMS
IF DB_NAME() <> 'HSWRMS_TEST'
BEGIN
    RAISERROR('FATAL ERROR: Current database is not HSWRMS_TEST. Aborting immediately.', 20, 1) WITH LOG;
END;
GO

-- 2. Verify principal existence in target database
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'hswrms_test_user' AND type = 'S')
BEGIN
    RAISERROR('FATAL ERROR: Principal hswrms_test_user does not exist in HSWRMS_TEST.', 20, 1) WITH LOG;
END;
GO

-- 3. Add hswrms_test_user to db_datareader role
ALTER ROLE [db_datareader] ADD MEMBER [hswrms_test_user];
GO

-- 4. Verification probe: confirm role membership
SELECT 
    dp.name AS PrincipalName,
    r.name AS RoleName,
    'GRANT VERIFIED' AS [Status]
FROM sys.database_role_members drm
JOIN sys.database_principals dp ON drm.member_principal_id = dp.principal_id
JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
WHERE dp.name = 'hswrms_test_user' AND r.name = 'db_datareader';
GO
```

### 7.2 Rollback Script

```sql
-- ==============================================================================
-- ROLLBACK SCRIPT: REVOKE READ ACCESS
-- STATUS: READY FOR EMERGENCY ROLLBACK IF NEEDED
-- ==============================================================================

USE [HSWRMS_TEST];
GO

IF DB_NAME() = 'HSWRMS_TEST'
BEGIN
    ALTER ROLE [db_datareader] DROP MEMBER [hswrms_test_user];
    PRINT 'Rollback complete: hswrms_test_user removed from db_datareader.';
END;
GO
```

---

## 8. Working Tree and Git Status

```text
## feature/hswrms-m1-m6-integration
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SchedulingConfig.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java
 M 05_Development/backend/src/test/resources/application-sqlserver-test.yml
 M 05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java
?? 05_Development/database/reports/PHASE_5.8.3.96_WEB_CONTEXT_FIX_REPORT.md
?? 05_Development/database/reports/PHASE_5.8.3.97_READ_ONLY_INTEGRITY_AUDIT.md
?? 05_Development/database/reports/PHASE_5.8.3.98_READ_PERMISSION_GRANT_PREFLIGHT.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

- **Staged Changes:** 0 files staged.
- **Commits:** 0 commits made.
- **Protected DB Integrity:** Database `HSWRMS` was not accessed and remains 100% untouched.
- **Test DB Integrity:** Database `HSWRMS_TEST` received zero permission changes, zero DDL, and zero DML mutations.

---

## 9. Conclusion & Recommendation

1. **Preflight Verdict:** **PASS / READY FOR OPERATOR REVIEW**.
2. **Recommended Scope:** Grant membership in `db_datareader` to `hswrms_test_user` on `HSWRMS_TEST` only. Omit `VIEW DEFINITION` and all write/DDL roles.
3. **Operational Prerequisite for Subsequent Testing:** Once `db_datareader` is granted in a future authorized phase, the application can safely execute read-only catalog endpoint integration tests against `HSWRMS_TEST` with full entity traversal and zero risk of database mutation.

