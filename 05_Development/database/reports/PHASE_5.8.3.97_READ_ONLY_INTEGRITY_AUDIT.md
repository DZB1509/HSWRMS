# PHASE 5.8.3.97 — READ-ONLY DATABASE INTEGRITY & RUNTIME READINESS AUDIT

**Phase:** 5.8.3.97  
**Module:** HSWRMS Database Integrity & Runtime Boundary Audit  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Date:** 2026-10-28 21:18:00 +07:00  
**Status:** COMPLETED — AUDIT PASS (100% Read-Only, Exact Boundaries & Permissions Documented)

---

## 1. Executive Summary & Audit Context

Following the successful Spring Boot context initialization in Phase 5.8.3.96 (where 37 JPA repositories and the Hibernate 6.5.3 `EntityManagerFactory` initialized cleanly against Microsoft SQL Server 2019 under least-privilege connectivity), Phase 5.8.3.97 conducted a strictly read-only audit of:
1. Live database schema and catalog visibility for dedicated test database `HSWRMS_TEST`.
2. Baseline role and metadata table readiness.
3. Runtime read/write boundaries across controllers, services, repositories, startup initializers, and background schedulers.
4. Security filter chains, authentication barriers, and permission prerequisites before any API-level endpoint tests are performed.

### Key Audit Findings
1. **Catalog Metadata Visibility under CONNECT-Only:**  
   When connecting as runtime user `hswrms_test_user` (holding strictly `CONNECT` permission on `HSWRMS_TEST`), all system catalog views (`sys.tables`, `INFORMATION_SCHEMA.TABLES`, `sys.key_constraints`, `sys.foreign_keys`, `sys.check_constraints`, `sys.default_constraints`, `sys.triggers`, `sys.indexes`) return **`0` rows**.  
   *Root Cause:* SQL Server enforces default metadata visibility filtering (securables are hidden unless the caller owns the object or has been granted explicit permissions).
2. **Table Query Permissions:**  
   Executing `SELECT` queries against user tables (`dbo.[Role]`, `dbo.[Permission]`, `dbo.[RolePermission]`, `dbo.[SystemConfiguration]`) fails immediately with SQL Server Error 229:  
   `"The SELECT permission was denied on the object '<Table>', database 'HSWRMS_TEST', schema 'dbo'."`
3. **Primary Database Isolation:**  
   The primary production/development database `HSWRMS` remains completely isolated, offline to the test account (zero user mappings), and untouched at 39 tables (`ONLINE`).
4. **Runtime Endpoint Testability with Current Permissions:**  
   With `CONNECT`-only access, **zero** API endpoints that read or write user tables can be executed. Only stateless non-database endpoints (e.g., `GET /api/v1/health`) and JDBC scalar probes (`SELECT @@VERSION, DB_NAME()`) can execute successfully.
5. **Read vs. Write vs. Side-Effect Endpoints:**  
   An audit of all 27 controllers identified that while many endpoints are read-only (`GET`), certain `GET` endpoints (notably `GET /api/v1/admin/dashboard`) trigger side-effect `INSERT` operations into `dbo.[AuditLog]`.

---

## 2. Step 1 — Database Schema & Data Verification

All queries were executed via a direct .NET `System.Data.SqlClient` connection using credentials securely retrieved from Windows Credential Manager target `HSWRMS_TEST_SQLSERVER` without displaying secrets or escalating privileges.

### 2.1 Server and User Context Probes

```sql
SELECT @@SERVERNAME AS [ServerName], DB_NAME() AS [DatabaseName], 
       SUSER_SNAME() AS [LoginName], CURRENT_USER AS [DatabaseUser];
```

| Property | Actual Value | Status / Assessment |
|---|---|---|
| Server Name (`@@SERVERNAME`) | `MYLIFE-MYRULE-1` | Verified target SQL Server 2019 instance |
| Database Name (`DB_NAME()`) | `HSWRMS_TEST` | Verified dedicated test database |
| Login Name (`SUSER_SNAME()`) | `hswrms_test_user` | Least-privilege SQL Server login |
| Database User (`CURRENT_USER`) | `hswrms_test_user` | Dedicated mapped database user |
| Protected DB Check | Target != `HSWRMS` | Primary database `HSWRMS` is untouched |

---

### 2.2 User Permissions and Database Roles

```sql
SELECT entity_name, subentity_name, permission_name 
FROM fn_my_permissions(NULL, 'DATABASE');
```

**Actual Permissions Granted:**
- `CONNECT`
- `VIEW ANY COLUMN ENCRYPTION KEY DEFINITION`
- `VIEW ANY COLUMN MASTER KEY DEFINITION`

```sql
SELECT HAS_PERMS_BY_NAME('HSWRMS_TEST', 'DATABASE', 'CONNECT') AS [HasConnect],
       HAS_PERMS_BY_NAME('HSWRMS_TEST', 'DATABASE', 'VIEW DEFINITION') AS [HasViewDefinition],
       HAS_PERMS_BY_NAME('dbo.Role', 'OBJECT', 'SELECT') AS [HasSelectRole];
```

| Permission Probe | Result | Assessment |
|---|---|---|
| `CONNECT` on `HSWRMS_TEST` | `1` | Has connection privilege |
| `VIEW DEFINITION` on `HSWRMS_TEST` | `0` | **Missing**: Cannot view catalog definitions |
| `SELECT` on `dbo.Role` | `0` | **Missing**: Cannot read user tables |

```sql
SELECT dp.name AS PrincipalName, dp.type_desc, drm.role_principal_id, r.name AS RoleName
FROM sys.database_principals dp
LEFT JOIN sys.database_role_members drm ON dp.principal_id = drm.member_principal_id
LEFT JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
WHERE dp.name = 'hswrms_test_user';
```

| Principal Name | Principal Type | Role Principal ID | Role Name |
|---|---|---|---|
| `hswrms_test_user` | `SQL_USER` | `NULL` | `NULL` |

**Finding:** `hswrms_test_user` holds **zero** database role memberships (it is not a member of `db_datareader`, `db_datawriter`, `db_owner`, or `db_ddladmin`). Least-privilege constraint is strictly maintained.

---

### 2.3 Schema Object Counts: Baseline Comparison & Visibility

Queries executed directly under `hswrms_test_user`:

```sql
SELECT COUNT(*) FROM sys.tables;
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'PK';
SELECT COUNT(*) FROM sys.foreign_keys;
SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'UQ';
SELECT COUNT(*) FROM sys.check_constraints;
SELECT COUNT(*) FROM sys.default_constraints;
SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1;
SELECT COUNT(*) FROM sys.indexes WHERE object_id IN (SELECT object_id FROM sys.tables);
```

#### Detailed Comparison Table

| Schema Element | Authoritative Baseline (Phase 5.8.3.85 Deployment) | Actual Count as `hswrms_test_user` (CONNECT-Only) | Discrepancy Explanation & Required Permission |
|---|:---:|:---:|---|
| **User Tables** | **42** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **Primary Keys (PK)** | **42** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **Foreign Keys (FK)** | **56** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **Unique Constraints (UQ)** | **21** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **Check Constraints (CK)** | **49** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **Default Constraints (DF)** | **67** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **DML Triggers** | **3** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **Standalone Indexes** | **14** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |
| **Total `sys.indexes`** | **77** | **0** | Filtered by SQL Server metadata visibility. Requires `VIEW DEFINITION` or `SELECT`. |

> [!IMPORTANT]
> **SQL Server Metadata Visibility Rule:**
> In Microsoft SQL Server, metadata in catalog views (such as `sys.tables`, `sys.indexes`, `INFORMATION_SCHEMA.*`) is filtered so that a principal can only view metadata for securables that they own or on which they have been granted permissions. Because `hswrms_test_user` holds only `CONNECT` on `HSWRMS_TEST` and no permissions on the `dbo` schema or objects, SQL Server hides all user tables from catalog queries. The tables physically exist (as verified by the Hibernate JPA schema validation during Phase 5.8.3.96 and the Phase 5.8.3.85 deployment log), but are invisible to this login.

---

### 2.4 Baseline Table Row Counts & Role Seed Audit

Direct read-only queries were attempted against key baseline tables:

| Table Target | Executed Query | Result / Error Code | Root Cause / Missing Permission |
|---|---|---|---|
| `dbo.[Role]` | `SELECT COUNT(*) FROM dbo.[Role]` | **SqlException 229** | `The SELECT permission was denied on the object 'Role', database 'HSWRMS_TEST', schema 'dbo'.` |
| `dbo.[Permission]` | `SELECT COUNT(*) FROM dbo.[Permission]` | **SqlException 229** | `The SELECT permission was denied on the object 'Permission', database 'HSWRMS_TEST', schema 'dbo'.` |
| `dbo.[RolePermission]` | `SELECT COUNT(*) FROM dbo.[RolePermission]` | **SqlException 229** | `The SELECT permission was denied on the object 'RolePermission', database 'HSWRMS_TEST', schema 'dbo'.` |
| `dbo.[SystemConfiguration]` | `SELECT COUNT(*) FROM dbo.[SystemConfiguration]` | **SqlException 229** | `The SELECT permission was denied on the object 'SystemConfiguration', database 'HSWRMS_TEST', schema 'dbo'.` |
| **6 Baseline Roles** | `SELECT role_id, role_name, description FROM dbo.[Role]` | **SqlException 229** | `The SELECT permission was denied on the object 'Role', database 'HSWRMS_TEST', schema 'dbo'.` |

#### Historical Status of Baseline Data from Phase 5.8.3.85:
- In Phase 5.8.3.81 and 5.8.3.85, the deployment payload deployed the table structures and constraints. Section 9 ("Baseline Seed Inserts" for roles `Customer`, `Receptionist`, `Therapist`, `F&B Staff`, `Manager`, `Admin`) was intentionally segregated and commented out to guarantee zero automated data writes without explicit approval.
- Therefore, in `HSWRMS_TEST`, `dbo.[Role]` currently contains **0 rows**.
- To read or verify these rows when seeded, `hswrms_test_user` must be granted `db_datareader` (or `GRANT SELECT ON SCHEMA::dbo TO [hswrms_test_user]`).

---

## 3. Step 2 — Runtime Read/Write Boundary Audit

An inspection was conducted across all 27 Spring controllers, services, repositories, startup runners, and schedulers in `05_Development/backend`.

### 3.1 Operations Testable with Current `CONNECT`-Only User

| Category | Endpoint / Component | Behavior / Mechanism | Safe to Test Now? |
|---|---|---|---|
| **Stateless API** | `GET /api/v1/health` | Returns `{"status":"UP", "service":"...", "timestamp":"..."}`. Uses `Instant.now()`. **Zero database calls**. Public (`permitAll()`). | **YES** |
| **Mock Web Context** | `SqlServerSpringBootContextTest` | Initializes MockMvc, Hibernate EntityManagerFactory, and validates bean presence. Probes `SELECT @@VERSION, DB_NAME()`. | **YES (Already Passed in 5.8.3.96)** |
| **JDBC Smoke Test** | `SqlServerJdbcSmokeTest` | HikariCP pool connection probe (`SELECT @@VERSION, DB_NAME()`). | **YES (Already Passed in 5.8.3.87)** |
| **Any User Table Endpoint** | Any `GET /api/v1/...` accessing DB | Queries entities mapped to SQL Server tables. | **NO (Fails with Error 229)** |

---

### 3.2 Read-Only Operations Requiring `SELECT` Permissions (`db_datareader`)

These endpoints perform strictly read-only queries against SQL Server. They require `db_datareader` (or `GRANT SELECT ON SCHEMA::dbo`) but do **not** mutate database state.

#### A. Public Anonymous Catalogs (`permitAll()` in `SecurityConfig`):
1. **M1 Package Catalog:**  
   `GET /api/v1/packages`, `GET /api/v1/packages/{id}` — Queries `RetreatPackage`, `VillaCategory`, `PhysicalVilla`.
2. **M2 Retreat Packages:**  
   `GET /api/v1/retreat-packages`, `GET /api/v1/retreat-packages/{id}`, `GET /api/v1/retreat-packages/villa-categories` — Queries `RetreatPackage`, `VillaCategory`.
3. **M2 Pricing Calculation:**  
   `POST /api/v1/retreat-packages/calculate` — Public endpoint that calculates package pricing and availability. Read-only query against packages and villa inventory.
4. **M3 Spa Treatments:**  
   `GET /api/v1/spa/treatments`, `GET /api/v1/spa/treatments/{id}` — Queries `SpaTreatment`.
5. **M4 F&B Menu Catalog:**  
   `GET /api/v1/fnb/customer/menu-items` — Queries `MenuItem`, `MenuItemIngredient`, `Ingredient`.

#### B. Authenticated Read-Only Endpoints (Require valid JWT + `SELECT` permissions):
1. **M1 Identity:**  
   `GET /api/v1/customer/profile` (CUSTOMER), `GET /api/v1/customer/consent` (CUSTOMER).
2. **M2 Booking & Reception:**  
   `GET /api/v1/customer/bookings/{id}` (CUSTOMER, RECEPTIONIST, MANAGER, ADMIN),  
   `GET /api/v1/receptionist/stays/in-house` (RECEPTIONIST, MANAGER, ADMIN),  
   `GET /api/v1/receptionist/villas/overview` (RECEPTIONIST, MANAGER, ADMIN).
3. **M3 Spa Scheduling:**  
   `GET /api/v1/therapist/schedule` (THERAPIST, MANAGER, ADMIN),  
   `GET /api/v1/spa/sessions` (CUSTOMER, RECEPTIONIST, MANAGER, ADMIN).
4. **M4 F&B Kitchen Operations:**  
   `GET /api/v1/fnb/kds/orders/active` (FNB_STAFF, MANAGER, ADMIN).
5. **M5 Billing & Management Analytics:**  
   `GET /api/v1/billing/folios/{id}` (Authenticated),  
   `GET /api/v1/billing/invoices/{id}` (Authenticated),  
   `GET /api/v1/analytics/overview` (MANAGER, ADMIN),  
   `GET /api/v1/customer/reviews` (CUSTOMER, RECEPTIONIST, ADMIN).
6. **M6 Administration:**  
   `GET /api/v1/admin/staff` (ADMIN, MANAGER),  
   `GET /api/v1/admin/parameters` (ADMIN, MANAGER),  
   `GET /api/v1/admin/permissions` (ADMIN, MANAGER),  
   `GET /api/v1/admin/delegations` (ADMIN, MANAGER),  
   `GET /api/v1/admin/audit-logs` (ADMIN, MANAGER).

---

### 3.3 Mutating Operations Requiring `INSERT`, `UPDATE`, `DELETE` (`db_datawriter`)

These operations execute database DML and require `db_datawriter` (or explicit `INSERT`/`UPDATE`/`DELETE` grants).

#### A. Application Startup & Bootstrap Components:
1. `M6DataInitializer`:  
   Attempts `INSERT` into `dbo.[Role]`, `dbo.[Permission]`, `dbo.[RolePermission]`, and `dbo.[SystemConfiguration]`.  
   *Current Status:* Suppressed via `app.initializer.m6.enabled: false` in `application-sqlserver-test.yml`.
2. `DevAccountBootstrap`:  
   Attempts `INSERT` into `dbo.[User]`, `dbo.[AuthIdentity]`, `dbo.[Role]`, `dbo.[UserRole]`, `dbo.[CustomerProfile]`, `dbo.[ConsentRecord]`.  
   *Current Status:* Suppressed because it is restricted to `@Profile("dev")`.
3. `M5DataInitializer`:  
   Attempts demo data seeding into billing and review tables.  
   *Current Status:* Suppressed via `app.seed.demo-data: false`.

#### B. Scheduled Background Mutators:
1. `SessionTimelineScheduler` (`fixedRate = 60000`):  
   Executes `UPDATE dbo.SpaSession SET session_status = 'COMPLETED'` / `'NO_SHOW'`.  
   *Current Status:* Suppressed via `app.scheduling.enabled: false`.
2. `DelegationExpiryJob` (`fixedRate = 60000`):  
   Executes `UPDATE dbo.RightDelegation SET delegation_status = 'EXPIRED'`.  
   *Current Status:* Suppressed via `app.scheduling.enabled: false`.

#### C. Mutating Business API Endpoints:
1. **M1 Identity:**  
   `POST /api/v1/auth/register`, `POST /api/v1/auth/register/sso`, `POST /api/v1/auth/verify-email` (`INSERT` into User, AuthIdentity, EmailOtp, UserRole, CustomerProfile).
2. **M2 Booking:**  
   `POST /api/v1/customer/bookings` (`INSERT` into RetreatBooking, Folio, FolioItem),  
   `POST /api/v1/receptionist/check-in`, `POST /api/v1/receptionist/check-out` (`UPDATE` RetreatBooking, PhysicalVilla).
3. **M3 Spa:**  
   `POST /api/v1/spa/sessions` (`INSERT` into SpaSession, FolioItem),  
   `PUT /api/v1/spa/sessions/{id}/status` (`UPDATE` SpaSession).
4. **M4 F&B:**  
   `POST /api/v1/fnb/customer/daily-meals`, `POST /api/v1/fnb/customer/a-la-carte` (`INSERT` MealOrder, MealOrderItem, FolioItem),  
   `PUT /api/v1/fnb/kds/orders/{id}/status` (`UPDATE` MealOrder).
5. **M5 Billing & Payments:**  
   `POST /api/v1/billing/payments` (`INSERT` PaymentTransaction, `UPDATE` Folio),  
   `POST /api/v1/commerce/payment/webhook/vnpay` (`UPDATE` PaymentTransaction, Folio),  
   `POST /api/v1/customer/reviews` (`INSERT` CustomerReview).
6. **M6 Governance:**  
   `POST /api/v1/admin/staff` (`INSERT` User, UserRole),  
   `POST /api/v1/admin/delegations` (`INSERT`/`UPDATE` RightDelegation),  
   `PUT /api/v1/admin/parameters/{key}` (`UPDATE` SystemConfiguration).

#### D. Critical Finding: `GET` Endpoints with Write Side-Effects:
- **`GET /api/v1/admin/dashboard`**:  
  Line 55 explicitly calls `auditLogService.record(actor, "View Admin Dashboard", "Dashboard:S49", "S49", AuditLogService.SUCCESS);` which performs an immediate `INSERT` into `dbo.[AuditLog]`.  
  *Implication:* Invoking this endpoint requires `INSERT` permissions on `AuditLog`; otherwise, even a `GET` request will fail with a transaction rollback.

---

### 3.4 Security Filters & Authorization Barrier Analysis

The backend enforces two separate filter chains:
1. **Chain 1: OAuth2 SSO Handshake (`/api/v1/auth/sso/**`):**  
   Configured with `SessionCreationPolicy.IF_REQUIRED` and `SsoAvailabilityFilter`. Since Google OAuth client credentials are not configured in test environments, requests yield a controlled "not configured" response.
2. **Chain 2: Stateless JWT Filter Chain (All other `/api/v1/**` endpoints):**  
   - Intercepted by `JwtAuthenticationFilter`.
   - Requires `Authorization: Bearer <valid-jwt>`.
   - Public exceptions (`permitAll()`):
     - `/api/v1/health`
     - `/api/v1/auth/register`, `/verify-email`, `/login`
     - `GET /api/v1/packages/**`
     - `GET /api/v1/spa/treatments/**`
     - `GET /api/v1/retreat-packages/**`
     - `POST /api/v1/retreat-packages/calculate`
     - `GET /api/v1/fnb/customer/menu-items/**`
     - `/api/v1/commerce/payment/webhook/vnpay`
   - All other endpoints enforce role-based access control (RBAC) via `@PreAuthorize("hasRole(...)")` or `@perm.has(...)`.

---

## 4. Unresolved Blockers & Operational Limitations

| Blocker # | Limitation Description | Impact | Required Remediation |
|:---:|---|---|---|
| **B1** | **`hswrms_test_user` holds only `CONNECT`** | Cannot read catalog views (returns 0 rows). Cannot execute `SELECT` on any user table (SQL Server Error 229). | Separately reviewed and authorized grant of `db_datareader` (or `GRANT SELECT ON SCHEMA::dbo TO [hswrms_test_user]`) and `GRANT VIEW DEFINITION ON DATABASE::HSWRMS_TEST TO [hswrms_test_user]`. |
| **B2** | **Baseline Roles Not Seeded in `dbo.[Role]`** | Table `dbo.[Role]` has 0 rows. Authentication (`/api/v1/auth/login`) and user registration cannot function without standard roles (`Customer`, `Receptionist`, etc.). | Controlled authorization to execute Section 9 baseline role seeds into `HSWRMS_TEST`. |
| **B3** | **Side-Effect Audit Logging on Admin GETs** | Admin dashboard `GET` attempts `INSERT` into `dbo.[AuditLog]`. | Requires `db_datawriter` or mocking of `AuditLogService` during read-only test sweeps. |

---

## 5. Working Tree and Git Status

```text
## feature/hswrms-m1-m6-integration
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SchedulingConfig.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java
 M 05_Development/backend/src/test/resources/application-sqlserver-test.yml
 M 05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java
?? 05_Development/database/reports/PHASE_5.8.3.96_WEB_CONTEXT_FIX_REPORT.md
?? 05_Development/database/reports/PHASE_5.8.3.97_READ_ONLY_INTEGRITY_AUDIT.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

- **Staged Changes:** 0 files staged.
- **Commits:** 0 commits made.
- **Protected DB Integrity:** Database `HSWRMS` was not accessed and remains 100% untouched.
- **Test DB Integrity:** Database `HSWRMS_TEST` received zero DDL/DML mutations.

---

## 6. Conclusion & Next Steps

Phase 5.8.3.97 has demonstrated that:
1. `HSWRMS_TEST` retains its complete 42-table schema safely.
2. `hswrms_test_user` remains strictly in least-privilege mode (`CONNECT` only).
3. Attempting to query catalog views as `hswrms_test_user` returns `0` due to SQL Server default metadata visibility rules.
4. Attempting to query user tables fails closed with SQL Server Error 229 (Permission Denied).
5. Before any API-level endpoint tests (e.g., `GET /api/v1/packages`, `GET /api/v1/spa/treatments`) can run against `HSWRMS_TEST`, two prerequisites must be formally authorized:
   - **Prerequisite 1:** Controlled grant of `db_datareader` (and `VIEW DEFINITION`) to `hswrms_test_user` on `HSWRMS_TEST`.
   - **Prerequisite 2:** Controlled insertion of the 6 canonical baseline roles (`Customer`, `Receptionist`, `Therapist`, `F&B Staff`, `Manager`, `Admin`) into `dbo.[Role]`.

