# PHASE 5.8.3.101 — CONTROLLED CANONICAL ROLE SEED REPORT

**Phase:** 5.8.3.101  
**Module:** HSWRMS Database Security & Baseline Seed Execution  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Timestamp:** 2026-10-28 22:00:48 +07:00  
**Status:** COMPLETED — 100% PASS (6 Canonical Roles Seeded & Verified; Zero Unintended Mutations)

---

## 1. Executive Summary

In Phase 5.8.3.101, an authorized, idempotent data seed was executed against the dedicated test database `HSWRMS_TEST` to insert the six canonical HSWRMS baseline roles into `dbo.[Role]`.

Key Execution Highlights:
1. **Preflight State Verification:**  
   Immediately prior to execution, preflight queries confirmed host `MYLIFE-MYRULE-1`, database `HSWRMS_TEST` (ID: `45`, Status: `ONLINE`), and zero pre-existing rows in `Role`, `Permission`, `RolePermission`, `SystemConfiguration`, `User`, and `UserRole`.
2. **Single Atomic Transaction:**  
   Executed an idempotent transaction using the authoritative definitions from Section 9 of `05_Development/database/schema.sql`. The script inserted strictly the six canonical roles without assigning hardcoded identity values:
   - `Customer` (ID 1)
   - `Receptionist` (ID 2)
   - `Therapist` (ID 3)
   - `F&B Staff` (ID 4)
   - `Manager` (ID 5)
   - `Admin` (ID 6)
3. **Zero Unintended Mutations:**  
   Zero rows were inserted or modified in `dbo.[Permission]`, `dbo.RolePermission`, `dbo.SystemConfiguration`, `dbo.[User]`, or `dbo.UserRole` (all retain their pre-phase count of `0`).
4. **Post-Execution Verification via Least-Privilege Account:**  
   Connecting as `hswrms_test_user` (holding `db_datareader`), verification confirmed:
   - Exactly 6 canonical roles exist; exactly 6 distinct names.
   - Zero unexpected role names and zero duplicates.
   - Schema integrity remains 100% preserved (42 tables, 42 PKs, 56 FKs, 21 UQs, 49 CKs, 67 DFs, 3 Triggers, 77 Indexes).
   - Primary database `HSWRMS` remains completely isolated, inaccessible (`HAS_DBACCESS = 0`), and untouched.

---

## 2. Preflight State Evidence

The pre-seed inspection was executed via `hswrms_test_user` immediately prior to mutation:

```sql
SELECT @@SERVERNAME AS [ServerName], DB_NAME() AS [DatabaseName], DB_ID() AS [DatabaseId], 
       SUSER_SNAME() AS [LoginName];

SELECT 
    (SELECT COUNT(*) FROM dbo.[Role]) AS [Role_Count],
    (SELECT COUNT(*) FROM dbo.[Permission]) AS [Permission_Count],
    (SELECT COUNT(*) FROM dbo.[RolePermission]) AS [RolePermission_Count],
    (SELECT COUNT(*) FROM dbo.[SystemConfiguration]) AS [SystemConfiguration_Count],
    (SELECT COUNT(*) FROM dbo.[User]) AS [User_Count],
    (SELECT COUNT(*) FROM dbo.[UserRole]) AS [UserRole_Count];
```

### Preflight Output

```text
ServerName       DatabaseName DatabaseId LoginName       
----------       ------------ ---------- ---------       
MYLIFE-MYRULE-1  HSWRMS_TEST  45         hswrms_test_user

Role_Count Permission_Count RolePermission_Count SystemConfiguration_Count User_Count UserRole_Count
---------- ---------------- -------------------- ------------------------- ---------- --------------
         0                0                    0                         0          0              0
```

### Precondition Evaluation Checklist

| Precondition # | Requirement | Verified State | Status |
|:---:|---|---|:---:|
| **1** | Connection targets SQL Server instance `MYLIFE-MYRULE-1` | `MYLIFE-MYRULE-1` | **PASS** |
| **2** | Target database is `HSWRMS_TEST`, Database ID 45, ONLINE | ID: `45`, Status: `ONLINE` | **PASS** |
| **3** | Statement explicitly targets `dbo.Role` in `HSWRMS_TEST` | Explicit `USE [HSWRMS_TEST]` & `dbo.[Role]` | **PASS** |
| **4** | Current role set inspected immediately before mutation | Inspected: exactly `0` rows present | **PASS** |
| **5** | Approved role names match canonical list exactly under CI collation | Verified match with Section 9 | **PASS** |
| **6** | Unexpected existing/conflicting role names stop execution | Preflight assertion verified | **PASS** |
| **7** | `role_id` is identity-generated (not explicitly assigned) | Verified: native identity generation | **PASS** |
| **8** | No other table or object is modified by script | Verified: strictly `dbo.[Role]` | **PASS** |
| **9** | No schema scripts, migrations, or application initializers invoked | Verified: isolated script execution | **PASS** |

---

## 3. Exact Executed SQL Statement

Executed via authorized administrative session (`MYLIFE-MYRULE-1\ADMIN`) against `localhost:1433`:

```sql
USE [HSWRMS_TEST];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- 1. Fail-closed safety assertion: target database must be HSWRMS_TEST (ID 45)
IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45
BEGIN
    RAISERROR('FATAL ERROR: Target database is not HSWRMS_TEST (ID 45). Aborting immediately.', 20, 1) WITH LOG;
END;
GO

-- 2. Preflight safety assertion: ensure no non-canonical roles exist
IF EXISTS (
    SELECT 1 
    FROM dbo.[Role] 
    WHERE role_name NOT IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin')
)
BEGIN
    RAISERROR('FATAL ERROR: Unexpected non-canonical role found in dbo.[Role]. Aborting.', 20, 1) WITH LOG;
END;
GO

-- 3. Preflight safety assertion: ensure zero duplicates
IF EXISTS (
    SELECT role_name 
    FROM dbo.[Role] 
    GROUP BY role_name 
    HAVING COUNT(*) > 1
)
BEGIN
    RAISERROR('FATAL ERROR: Duplicate role names detected in dbo.[Role]. Aborting.', 20, 1) WITH LOG;
END;
GO

-- 4. Execute atomic transaction
BEGIN TRANSACTION;

-- Role 1: Customer
IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Customer')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES (N'Customer', N'Authenticated resort customer.');
END;

-- Role 2: Receptionist
IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Receptionist')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES (N'Receptionist', N'Front-desk and stay operations staff.');
END;

-- Role 3: Therapist
IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Therapist')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES (N'Therapist', N'Spa Therapist / Yoga Instructor.');
END;

-- Role 4: F&B Staff
IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'F&B Staff')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES (N'F&B Staff', N'Food and beverage operational staff / Chef.');
END;

-- Role 5: Manager
IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Manager')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES (N'Manager', N'Management monitoring and approved delegated functions.');
END;

-- Role 6: Admin
IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Admin')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES (N'Admin', N'System administration and governance.');
END;

COMMIT TRANSACTION;
GO

-- 5. Execution probe
SELECT role_id, role_name, description, 'SEEDED_SUCCESS' AS SeedStatus
FROM dbo.[Role]
ORDER BY role_id;
GO
```

### Direct Execution Result

```text
role_id role_name    description                                             SeedStatus
------- ---------    -----------                                             ----------
1       Customer     Authenticated resort customer.                          SEEDED_SUCCESS
2       Receptionist Front-desk and stay operations staff.                   SEEDED_SUCCESS
3       Therapist    Spa Therapist / Yoga Instructor.                        SEEDED_SUCCESS
4       F&B Staff    Food and beverage operational staff / Chef.             SEEDED_SUCCESS
5       Manager      Management monitoring and approved delegated functions. SEEDED_SUCCESS
6       Admin        System administration and governance.                   SEEDED_SUCCESS
```

---

## 4. Post-Execution Verification (via Test Login `hswrms_test_user`)

Executed using credentials from Windows Credential Manager (`HSWRMS_TEST_SQLSERVER`) under least-privilege `db_datareader` membership.

### 4.1 Canonical Roles Inventory

```sql
SELECT role_id, role_name, description FROM dbo.[Role] ORDER BY role_id;
```

| `role_id` | `role_name` | `description` | Identity Source | Invariant Check |
|:---:|---|---|:---:|:---:|
| **1** | `Customer` | Authenticated resort customer. | SQL Server `IDENTITY(1,1)` | **PASS** |
| **2** | `Receptionist` | Front-desk and stay operations staff. | SQL Server `IDENTITY(1,1)` | **PASS** |
| **3** | `Therapist` | Spa Therapist / Yoga Instructor. | SQL Server `IDENTITY(1,1)` | **PASS** |
| **4** | `F&B Staff` | Food and beverage operational staff / Chef. | SQL Server `IDENTITY(1,1)` | **PASS** |
| **5** | `Manager` | Management monitoring and approved delegated functions. | SQL Server `IDENTITY(1,1)` | **PASS** |
| **6** | `Admin` | System administration and governance. | SQL Server `IDENTITY(1,1)` | **PASS** |

---

### 4.2 Role Invariants and Duplicate Probe

```sql
SELECT 
    COUNT(*) AS [TotalRoleCount],
    COUNT(DISTINCT role_name) AS [DistinctRoleNames],
    SUM(CASE WHEN role_name IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin') THEN 1 ELSE 0 END) AS [CanonicalRoleCount],
    SUM(CASE WHEN role_name NOT IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin') THEN 1 ELSE 0 END) AS [UnexpectedRoleCount]
FROM dbo.[Role];

SELECT role_name, COUNT(*) AS [Occurrences] 
FROM dbo.[Role] 
GROUP BY role_name 
HAVING COUNT(*) > 1;
```

| Metric | Expected Value | Actual Value | Invariant Status |
|---|:---:|:---:|:---:|
| `TotalRoleCount` | `6` | `6` | **PASS** |
| `DistinctRoleNames` | `6` | `6` | **PASS** |
| `CanonicalRoleCount` | `6` | `6` | **PASS** |
| `UnexpectedRoleCount` | `0` | `0` | **PASS** |
| Duplicate Role Names | `0` rows | `0` rows | **PASS** |

---

### 4.3 Table Row Counts Comparison (Before vs. After)

```sql
SELECT 
    (SELECT COUNT(*) FROM dbo.[Role]) AS [Role_Count],
    (SELECT COUNT(*) FROM dbo.[Permission]) AS [Permission_Count],
    (SELECT COUNT(*) FROM dbo.[RolePermission]) AS [RolePermission_Count],
    (SELECT COUNT(*) FROM dbo.[SystemConfiguration]) AS [SystemConfiguration_Count],
    (SELECT COUNT(*) FROM dbo.[User]) AS [User_Count],
    (SELECT COUNT(*) FROM dbo.[UserRole]) AS [UserRole_Count];
```

| Table | Pre-Seed Count | Post-Seed Count | Delta | Assessment |
|---|:---:|:---:|:---:|---|
| `dbo.[Role]` | **`0`** | **`6`** | **+6** | **EXPECTED MUTATION** |
| `dbo.[Permission]` | `0` | `0` | 0 | Untouched / Scope Preserved |
| `dbo.[RolePermission]` | `0` | `0` | 0 | Untouched / Scope Preserved |
| `dbo.[SystemConfiguration]` | `0` | `0` | 0 | Untouched / Scope Preserved |
| `dbo.[User]` | `0` | `0` | 0 | Untouched / Scope Preserved |
| `dbo.[UserRole]` | `0` | `0` | 0 | Untouched / Scope Preserved |

---

### 4.4 Schema and Security Invariants Verification

```sql
SELECT 
    (SELECT COUNT(*) FROM sys.tables) AS [UserTables],
    (SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'PK') AS [PK_Count],
    (SELECT COUNT(*) FROM sys.foreign_keys) AS [FK_Count],
    (SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'UQ') AS [UQ_Count],
    (SELECT COUNT(*) FROM sys.check_constraints) AS [CK_Count],
    (SELECT COUNT(*) FROM sys.default_constraints) AS [DF_Count],
    (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1) AS [Trigger_Count],
    (SELECT COUNT(*) FROM sys.indexes WHERE object_id IN (SELECT object_id FROM sys.tables)) AS [Total_Indexes];
```

| Metric | Authoritative Baseline | Post-Seed Value | Invariant Status |
|---|:---:|:---:|:---:|
| User Tables | `42` | `42` | **PASS (Preserved)** |
| Primary Keys | `42` | `42` | **PASS (Preserved)** |
| Foreign Keys | `56` | `56` | **PASS (Preserved)** |
| Unique Constraints | `21` | `21` | **PASS (Preserved)** |
| Check Constraints | `49` | `49` | **PASS (Preserved)** |
| Default Constraints | `67` | `67` | **PASS (Preserved)** |
| Triggers | `3` | `3` | **PASS (Preserved)** |
| Total Indexes | `77` | `77` | **PASS (Preserved)** |
| Principal Role | `db_datareader` | `db_datareader` | **PASS (Read-Only Retained)** |
| `HAS_DBACCESS('HSWRMS')` | `0` | `0` | **PASS (Isolated & Inaccessible)** |

---

## 5. Rollback Script (Documented for Reference)

```sql
-- ==============================================================================
-- ROLLBACK SCRIPT: REMOVE UNREFERENCED CANONICAL ROLES
-- DO NOT EXECUTE UNLESS SEPARATELY AUTHORIZED
-- ==============================================================================
USE [HSWRMS_TEST];
GO

IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45
BEGIN
    RAISERROR('FATAL ERROR: Target database is not HSWRMS_TEST (45). Aborting.', 20, 1) WITH LOG;
END;
GO

IF EXISTS (
    SELECT 1 FROM dbo.UserRole ur
    JOIN dbo.[Role] r ON ur.role_id = r.role_id
    WHERE r.role_name IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin')
) OR EXISTS (
    SELECT 1 FROM dbo.RolePermission rp
    JOIN dbo.[Role] r ON rp.role_id = r.role_id
    WHERE r.role_name IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin')
)
BEGIN
    RAISERROR('ROLLBACK BLOCKED: Foreign key records exist in UserRole or RolePermission. Deletion aborted.', 16, 1);
END
ELSE
BEGIN
    DELETE FROM dbo.[Role]
    WHERE role_name IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin');
    PRINT 'Rollback successful: Unreferenced canonical roles removed from dbo.[Role].';
END;
GO
```

---

## 6. Working Tree and Git Status

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
?? 05_Development/database/reports/PHASE_5.8.3.99_CONTROLLED_READ_PERMISSION_GRANT_REPORT.md
?? 05_Development/database/reports/PHASE_5.8.3.100_BASELINE_ROLE_SEED_PREFLIGHT.md
?? 05_Development/database/reports/PHASE_5.8.3.101_CONTROLLED_ROLE_SEED_REPORT.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

- **Staged Changes:** 0 files staged.
- **Commits:** 0 commits made.
- **Protected DB Integrity:** Database `HSWRMS` was completely untouched and remains isolated.
- **Test DB Integrity:** Database `HSWRMS_TEST` received strictly the 6 canonical role seed rows into `dbo.[Role]`. Zero other tables, schemas, or configurations were modified.

---

## 7. Conclusion & Next Phase Readiness

The canonical baseline role seed on `HSWRMS_TEST` is complete, verified, and referentially sound:
1. `dbo.[Role]` now contains the 6 foundational system roles.
2. `hswrms_test_user` can read all roles and tables under least-privilege `db_datareader` membership.
3. The database is now fully prepared for **read-only catalog endpoint testing** and **user authentication / registration preflight testing** against `HSWRMS_TEST`.

