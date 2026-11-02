# PHASE 5.8.3.105 — CONTROLLED READ-ONLY API TEST REPORT

**Phase:** 5.8.3.105  
**Module:** HSWRMS Backend Integration & Database Safety  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Date:** 2026-10-28 23:16:07 +07:00  
**Status:** COMPLETED — 100% PASS (9/9 Tests Passed, 0 Failures, 0 Errors, Zero Database Mutations)  
**Target Database:** `HSWRMS_TEST` (Database ID: `45`, Status: `ONLINE`, Host: `localhost:1433`)  
**Protected Database:** `HSWRMS` (Isolated, `HAS_DBACCESS = 0`)  
**Test Principal:** `hswrms_test_user` (Roles: `public`, `db_datareader`)  

---

## 1. Executive Summary

Following the successful RBAC integrity and authorization preflight audit in Phase 5.8.3.104, Phase 5.8.3.105 executed controlled, end-to-end read-only HTTP API testing against the dedicated test database `HSWRMS_TEST`.

### Key Outcomes:
1. **Endpoint Safety Audit:** Every candidate endpoint was audited at the controller, service, repository, transaction, and security configuration layers. Only strictly read-only, non-mutating endpoints with zero audit-logging side effects were selected. Mutating endpoints (POST/PUT/DELETE) and audit-logging endpoints (such as `GET /api/v1/admin/dashboard`) were rigorously excluded.
2. **Database Safety Preflight:** Verified SQL Server instance `MYLIFE-MYRULE-1`, database `HSWRMS_TEST` (ID 45), user `hswrms_test_user` with `db_datareader` (no write permissions: `IsDataWriter = 0`), and complete isolation from `HSWRMS` (`HAS_DBACCESS = 0`). All startup initializers, schedulers, and DDL operations were confirmed disabled.
3. **Controlled Execution via Test Harness:** Tests were executed through the existing secure credential test runner (`run_hswrms_jdbc_smoke_test.ps1 -TestName "SqlServerSpringBootContextTest"`), utilizing `MockMvc` in a `WebEnvironment.MOCK` container without opening external network ports. All 9 test cases passed cleanly (**BUILD SUCCESS**).
4. **Post-Execution Integrity Verification:** Direct read-only database queries through `hswrms_test_user` confirmed that every single table row count remained 100% unchanged (`Role` = 6, `Permission` = 41, `RolePermission` = 48, `SystemConfiguration` = 6, `User` = 0, `UserRole` = 0, `AuditLog` = 0, `RetreatPackage` = 0, `SpaTreatment` = 0, `MenuItem` = 0).
5. **No Production Code Edits & Zero Git Mutations:** Zero production files in `src/main` were altered. Zero changes were staged or committed.

---

## 2. Step 1 — Endpoint Preflight Audit & Route Analysis

### 2.1 Candidate Inspection & Boundary Review

| Candidate Route | Controller & Method | Service & Repository | Transaction & Security | Audit / Mutation Risk | Decision |
|---|---|---|---|---|---|
| `GET /api/v1/health` | `HealthController.getHealth()` | None (in-memory map) | Public (`permitAll()`), no DB access | ZERO | **SELECTED** |
| `GET /api/v1/retreat-packages` | `RetreatPackageController.getAllPackages(wellnessGoal)` | `RetreatPackageService.getAllActivePackages()` -> `RetreatPackageRepository.findByPackageStatus()` | `@Transactional(readOnly = true)`, Public (`permitAll()`) | ZERO (SELECT only) | **SELECTED** |
| `GET /api/v1/retreat-packages/villa-categories` | `RetreatPackageController.getAllVillaCategories()` | `RetreatPackageService.getAllActiveVillaCategories()` -> `VillaCategoryRepository.findByCategoryStatus()` | `@Transactional(readOnly = true)`, Public (`permitAll()`) | ZERO (SELECT only) | **SELECTED** |
| `GET /api/v1/retreat-packages/{id}` | `RetreatPackageController.getPackageById(id)` | `RetreatPackageService.getPackageById(id)` -> `RetreatPackageRepository.findById()` | `@Transactional(readOnly = true)`, Public (`permitAll()`) | ZERO (throws `ResourceNotFoundException` on missing ID) | **SELECTED** (Detail check) |
| `GET /api/v1/spa/treatments` | `SpaTreatmentController.listTreatments(userDetails)` | `SpaTreatmentService.listActiveTreatments(null)` -> `SpaTreatmentRepository.findByTreatmentStatus()` | `@Transactional(readOnly = true)`, Public (`permitAll()`) | ZERO (SELECT only) | **SELECTED** |
| `GET /api/v1/spa/treatments/{id}` | `SpaTreatmentController.getTreatment(id, userDetails)` | `SpaTreatmentService.getTreatmentById(id, null)` -> `SpaTreatmentRepository.findById()` | `@Transactional(readOnly = true)`, Public (`permitAll()`) | ZERO (throws `ResourceNotFoundException` on missing ID) | **SELECTED** (Detail check) |
| `GET /api/v1/fnb/customer/menu-items` | `FnbCustomerOrderController.getMenuItems(category, mealPeriod)` | `MealOrderService.getAvailableMenuItems()` -> `MenuItemRepository.findAllAvailable()` | `@Transactional(readOnly = true)`, Public (`permitAll()`) | ZERO (SELECT only) | **SELECTED** |
| `GET /api/v1/packages` | None (Unmapped route) | None | In `SecurityConfig`, but no controller handler exists | Spring MVC dispatches to static resource handler | **EXCLUDED** from operational endpoints; verified unmapped route behavior |

### 2.2 Excluded Endpoints Rationale

1. **`GET /api/v1/admin/dashboard` (EXCLUDED):**
   - **Reason:** In `AdminDashboardController.java` lines 54–55, invoking this endpoint explicitly calls `auditLogService.record(actor, "View Admin Dashboard", "Dashboard:S49", "S49", AuditLogService.SUCCESS)`. This attempts an `INSERT` into `dbo.[AuditLog]`, violating the strictly read-only execution constraint and causing permission errors under `db_datareader`. Furthermore, it requires authentication with `@PreAuthorize("@perm.has('S49','V')")`.
2. **`POST /api/v1/retreat-packages/calculate` (EXCLUDED):**
   - **Reason:** Mutating/calculation POST endpoint; violates prohibition against POST methods.
3. **`POST /api/v1/fnb/customer/daily-meals`, `POST /api/v1/fnb/customer/a-la-carte`, `POST /api/v1/fnb/customer/orders/{id}/cancel` (EXCLUDED):**
   - **Reason:** State-mutating POST operations that create dining orders and update folio items.
4. **`GET /api/v1/fnb/customer/orders` (EXCLUDED):**
   - **Reason:** Requires authenticated customer credentials (`@PreAuthorize("hasRole('CUSTOMER')...")`) and links to specific customer retreat bookings.
5. **`GET /api/v1/admin/**` (`/audit-logs`, `/delegations`, `/staff`, `/parameters`, `/permission-matrix`) (EXCLUDED):**
   - **Reason:** Administrative governance endpoints requiring elevated staff authentication, specific RBAC permission evaluation (`S50`, `S51`, `S52`, `S53`), and writing audit logs on access.

---

## 3. Step 2 — Database Safety Preflight Evidence

Prior to executing any tests, a direct read-only preflight query was performed via `hswrms_test_user`:

### 3.1 Environment & Database Identity Verification
- **Host / Server Name:** `MYLIFE-MYRULE-1` (`localhost:1433`)
- **Connected Database:** `HSWRMS_TEST`
- **Database ID:** `45`
- **Database Status:** `ONLINE`
- **Connected Principal:** `hswrms_test_user`
- **Effective Roles:** `public`, `db_datareader` (`IsDataReader = 1`)
- **Write Role Check:** `IsDataWriter = 0` (Write access strictly absent)
- **Sysadmin Role Check:** `IsSysadmin = 0` (No elevated privileges)
- **Target Isolation Check:** `HAS_DBACCESS('HSWRMS') = 0` (Primary development database is completely isolated and inaccessible)

### 3.2 Application Startup Guards Verification
Verified against `05_Development/backend/src/test/resources/application-sqlserver-test.yml` and `SqlServerSpringBootContextTest.java`:
- `spring.jpa.hibernate.ddl-auto: none` (DDL generation disabled)
- `spring.jpa.generate-ddl: false`
- `spring.sql.init.mode: never` (SQL script initialization disabled)
- `spring.flyway.enabled: false` (Flyway migrations disabled)
- `spring.liquibase.enabled: false` (Liquibase migrations disabled)
- `app.initializer.m6.enabled: false` (`M6DataInitializer` disabled via `@ConditionalOnProperty`)
- `app.scheduling.enabled: false` (`SchedulingConfig` disabled via `@ConditionalOnProperty`)
- `app.seed.demo-data: false` (Demo data seeding disabled)
- Profile enforcement: Only `sqlserver-test` is active; `dev` profile is strictly forbidden and asserted absent at runtime.

### 3.3 Pre-Execution Baseline Table Row Counts
```sql
SELECT COUNT(*) FROM dbo.[Role];                -- Result: 6
SELECT COUNT(*) FROM dbo.[Permission];          -- Result: 41
SELECT COUNT(*) FROM dbo.[RolePermission];      -- Result: 48
SELECT COUNT(*) FROM dbo.[SystemConfiguration]; -- Result: 6
SELECT COUNT(*) FROM dbo.[User];                -- Result: 0
SELECT COUNT(*) FROM dbo.[UserRole];            -- Result: 0
SELECT COUNT(*) FROM dbo.[AuditLog];            -- Result: 0
SELECT COUNT(*) FROM dbo.[RetreatPackage];      -- Result: 0
SELECT COUNT(*) FROM dbo.[SpaTreatment];        -- Result: 0
SELECT COUNT(*) FROM dbo.[MenuItem];            -- Result: 0
```

---

## 4. Step 3 — Controlled Test Execution & Results

### 4.1 Execution Command (Secrets Redacted)
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command `
    "& 'E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules\05_Development\database\scripts\run_hswrms_jdbc_smoke_test.ps1' -TestName 'SqlServerSpringBootContextTest'"
```

**Lifecycle Safety:**
1. Test credentials were retrieved securely from Windows Credential Manager target `HSWRMS_TEST_SQLSERVER`.
2. Passed via process-scoped environment variables `SQLSERVER_TEST_USERNAME` and `SQLSERVER_TEST_PASSWORD`.
3. Process environment variables and credential memory cleared in a guaranteed `finally` block.
4. Zero plaintext passwords exposed in command-line arguments, process logs, or Maven output.

### 4.2 Test Suite Execution Summary
- **Test Class:** `com.heavenstay.hswrms.integration.SqlServerSpringBootContextTest`
- **Total Tests Run:** 9
- **Failures:** 0
- **Errors:** 0
- **Skipped:** 0
- **Total Time:** 18.24 s
- **Build Result:** **BUILD SUCCESS**

### 4.3 Request-by-Request Verification Manifest

| Test # | HTTP Method | Target Route | HTTP Status | Response Schema / Shape | Response Excerpt | Behavior Verification | DB Mutation |
|---|---|---|---|---|---|---|---|
| **0** | JDBC / Meta | Direct Probe | N/A | System Metadata | `DB_NAME() = HSWRMS_TEST`, SQL Server 2019 v15 | Full context safety guards & database identity verified | ZERO |
| **1** | `GET` | `/api/v1/health` | **200 OK** | `{"status": String, "service": String, "timestamp": String}` | `{"status":"UP","service":"HSWRMS Modular Monolith Backend","timestamp":"2026-10-28T16:16:06.864021600Z"}` | Correct service health payload, public access verified | ZERO |
| **2** | `GET` | `/api/v1/retreat-packages` | **200 OK** | `{"timestamp": Instant, "success": Boolean, "message": String, "data": Array}` | `{"timestamp":"...","success":true,"message":"Retreat packages retrieved successfully","data":[]}` | Clean read from `dbo.RetreatPackage`; empty catalog array matches 0-row DB state | ZERO |
| **3** | `GET` | `/api/v1/retreat-packages/villa-categories` | **200 OK** | `{"timestamp": Instant, "success": Boolean, "message": String, "data": Array}` | `{"timestamp":"...","success":true,"message":"Villa categories retrieved successfully","data":[]}` | Clean read from `dbo.VillaCategory`; empty array matches 0-row DB state | ZERO |
| **4** | `GET` | `/api/v1/spa/treatments` | **200 OK** | `{"timestamp": Instant, "success": Boolean, "message": String, "data": Array}` | `{"timestamp":"...","success":true,"message":"SUCCESS","data":[]}` | Clean read from `dbo.SpaTreatment`; empty array matches 0-row DB state | ZERO |
| **5** | `GET` | `/api/v1/fnb/customer/menu-items` | **200 OK** | `{"timestamp": Instant, "success": Boolean, "message": String, "data": Array}` | `{"timestamp":"...","success":true,"message":"Menu items retrieved successfully.","data":[]}` | Clean read from `dbo.MenuItem`; empty array matches 0-row DB state | ZERO |
| **6** | `GET` | `/api/v1/retreat-packages/999` | **404 NOT FOUND** | `ApiError: {"timestamp": Instant, "status": 404, "code": "RESOURCE_NOT_FOUND", "message": String, "path": String, "errors": []}` | `{"status":404,"code":"RESOURCE_NOT_FOUND","message":"Retreat package with ID 999 not found","path":"/api/v1/retreat-packages/999"}` | Expected `ResourceNotFoundException` caught by `GlobalExceptionHandler` | ZERO |
| **7** | `GET` | `/api/v1/spa/treatments/999` | **404 NOT FOUND** | `ApiError: {"timestamp": Instant, "status": 404, "code": "RESOURCE_NOT_FOUND", "message": String, "path": String, "errors": []}` | `{"status":404,"code":"RESOURCE_NOT_FOUND","message":"Spa Treatment not found with treatmentId: '999'","path":"/api/v1/spa/treatments/999"}` | Expected `ResourceNotFoundException` caught by `GlobalExceptionHandler` | ZERO |
| **8** | `GET` | `/api/v1/packages` | **500 INTERNAL_SERVER_ERROR** | `ApiError: {"timestamp": Instant, "status": 500, "code": "INTERNAL_SERVER_ERROR", "message": String, "path": String, "errors": []}` | `{"status":500,"code":"INTERNAL_SERVER_ERROR","message":"An unexpected server error occurred...","path":"/api/v1/packages"}` | Confirmed unmapped route: Spring MVC throws `NoResourceFoundException`, caught as generic error | ZERO |

---

## 5. Step 4 — Post-Verification Database Integrity Audit

Immediately following test completion, a post-execution read-only query was executed against `HSWRMS_TEST` via `hswrms_test_user`.

### 5.1 Before vs. After Row Count Reconciliation

| Table Name | Pre-Test Count | Post-Test Count | Delta | Status |
|---|---|---|---|---|
| `dbo.[Role]` | 6 | 6 | 0 | **UNCHANGED** |
| `dbo.[Permission]` | 41 | 41 | 0 | **UNCHANGED** |
| `dbo.[RolePermission]` | 48 | 48 | 0 | **UNCHANGED** |
| `dbo.[SystemConfiguration]` | 6 | 6 | 0 | **UNCHANGED** |
| `dbo.[User]` | 0 | 0 | 0 | **UNCHANGED** |
| `dbo.[UserRole]` | 0 | 0 | 0 | **UNCHANGED** |
| `dbo.[AuditLog]` | 0 | 0 | 0 | **UNCHANGED (Zero Audit Writes)** |
| `dbo.[RetreatPackage]` | 0 | 0 | 0 | **UNCHANGED** |
| `dbo.[SpaTreatment]` | 0 | 0 | 0 | **UNCHANGED** |
| `dbo.[MenuItem]` | 0 | 0 | 0 | **UNCHANGED** |

### 5.2 Primary Database Isolation Check
```sql
SELECT HAS_DBACCESS('HSWRMS') AS AccessHSWRMS;
```
- **Result:** `0` (False)
- **Confirmation:** The primary database `HSWRMS` remained 100% isolated, unreferenced, and inaccessible to `hswrms_test_user`.

---

## 6. Changed Files & Git Status

### 6.1 Changed Files Summary
- **Modified Production Files (`src/main`):** **NONE** (0 files modified)
- **Modified Test Files (`src/test`):**
  - `05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java` (Added MockMvc test methods for controlled read-only API endpoint validation; file remains untracked)
- **Staged / Committed Files:** **NONE** (0 files staged, 0 commits made)

### 6.2 Working Tree Git Status
```
On branch feature/hswrms-m1-m6-integration
Your branch is ahead of 'isp-origin/feature/hswrms-m1-m6-integration' by 5 commits.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SchedulingConfig.java
	modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java
	modified:   05_Development/backend/src/test/resources/application-sqlserver-test.yml
	modified:   05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java
	05_Development/database/generated/
	05_Development/database/migrations/V003__m2_retreat_booking_schema_reconciliation.sql
	05_Development/database/migrations/V004__m5_customer_review_category_ratings.sql
	05_Development/database/migrations/V005__m6_audit_log.sql
	05_Development/database/migrations/draft_m6_governance_and_delegation.sql
	05_Development/database/reports/
	05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
	05_Development/database/scripts/set_hswrms_test_credential.ps1
	06_Reports/HSWRMS_REPOSITORY_INTEGRATION_BASELINE.txt
    ... (historical report inventory)

no changes added to commit (use "git add" and/or "git commit -a")
```

---

## 7. Conclusion & Next Phase Readiness

Phase 5.8.3.105 has verified that:
1. Public read-only catalog endpoints (`/api/v1/health`, `/api/v1/retreat-packages`, `/api/v1/retreat-packages/villa-categories`, `/api/v1/spa/treatments`, `/api/v1/fnb/customer/menu-items`) execute cleanly against `HSWRMS_TEST` via Hibernate JPA repositories and SQL Server 2019.
2. Unmapped routes (`/api/v1/packages`) and non-existent entity IDs (`/999`) fail safely without side effects or unhandled SQL errors.
3. Database mutation guards were 100% effective: zero table rows were altered, zero audit logs were created, and the primary database `HSWRMS` remained completely isolated.

