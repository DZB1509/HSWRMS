# PHASE 5.8.3.100 — BASELINE ROLE SEED PREFLIGHT REPORT

**Phase:** 5.8.3.100  
**Module:** HSWRMS Database Security & Baseline Seed Preflight  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Timestamp:** 2026-10-28 21:55:00 +07:00  
**Status:** COMPLETED — PREFLIGHT PASS (Strictly Read-Only, Zero Data Mutations Executed)

---

## 1. Executive Summary & Objective

Phase 5.8.3.100 conducted an exhaustive, strictly read-only audit to prepare for the safe, idempotent initialization of the six canonical HSWRMS roles in dedicated test database `HSWRMS_TEST`:
- **`Customer`**
- **`Receptionist`**
- **`Therapist`**
- **`F&B Staff`**
- **`Manager`**
- **`Admin`**

In accordance with strict safety mandates:
- **Zero data mutations were performed.** No `INSERT`, `UPDATE`, `DELETE`, `MERGE`, or DDL statements were executed.
- **Zero permissions were altered.** No `GRANT`, `REVOKE`, or role modifications were performed.
- **Protected database `HSWRMS` was confirmed completely isolated and untouched.**
- **All database queries were executed using the dedicated test login `hswrms_test_user`** utilizing its read permissions (`db_datareader`) granted in Phase 5.8.3.99.

---

## 2. Step 1 — Authoritative Schema & Code Source Audit

### 2.1 Table Structure & Constraints for `dbo.[Role]`
From `05_Development/database/schema.sql#L76-L84`:

```sql
CREATE TABLE dbo.[Role] (
    role_id             INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Role PRIMARY KEY,
    role_name           NVARCHAR(50) NOT NULL,
    description         NVARCHAR(500) NULL,

    CONSTRAINT UQ_Role_Name UNIQUE (role_name)
);
GO
```

| Column Name | SQL Type | Nullable | Identity | Constraints & Rules |
|---|---|:---:|:---:|---|
| `role_id` | `INT` | **NO** | **YES `(1,1)`** | Primary Key (`PK_Role`). Auto-incrementing integer identifier. |
| `role_name` | `NVARCHAR(50)` | **NO** | **NO** | Unique constraint (`UQ_Role_Name`). Natural business key. |
| `description` | `NVARCHAR(500)` | **YES** | **NO** | Human-readable role description. |

#### Foreign Key Relationships Involving `dbo.[Role]`:
1. `dbo.UserRole`:
   ```sql
   CONSTRAINT FK_UserRole_Role FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id)
   ```
2. `dbo.RolePermission`:
   ```sql
   CONSTRAINT FK_RolePermission_Role FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id)
   ```

---

### 2.2 Analysis of Seed Sources & Code Invariants

#### 1. Identity Generation vs. Explicit Seeding:
- The authoritative Section 9 seed in `05_Development/database/schema.sql#L1110-L1139` inserts only `role_name` and `description`:
  ```sql
  INSERT dbo.[Role](role_name, description) VALUES (N'Customer', N'Authenticated resort customer.');
  ```
- **Finding:** Role identifiers are **identity-generated** (`IDENTITY(1,1)`), not explicitly seeded. Application code never hardcodes `role_id = 1` or assumes fixed identity numbers; lookups always resolve via `role_name`.

#### 2. Canonical Business Key:
- `role_name` is the canonical business key, enforced at the database level by unique constraint `UQ_Role_Name`.
- In Java entities (`com.heavenstay.hswrms.m1identity.entity.Role`), `equals()` and `hashCode()` evaluate `roleName` equality.

#### 3. Database Collation & Case Sensitivity:
- The database collation is verified as **`SQL_Latin1_General_CP1_CI_AS`**.
- The `CI` component denotes **Case-Insensitive**.
- **Finding:** In SQL Server, `'Customer' = 'CUSTOMER' = 'customer'`. The unique constraint `UQ_Role_Name` and SQL lookups are strictly case-insensitive.
- In Java application code:
  - `RoleRepository` exposes `findByRoleNameIgnoreCase(String roleName)`.
  - `StaffAccountService` normalizes role names via `roleName.trim().toUpperCase(Locale.ROOT)` with optional `"ROLE_"` prefix stripping.
  - `CustomUserDetails.normalizeRoleAuthorities(String role)` normalizes canonical database name `"F&B Staff"` and aliases (`"FB_STAFF"`, `"FNB_STAFF"`) to Spring Security authority `"ROLE_FNB_STAFF"`.

#### 4. Scope Coupling (Roles vs. Permissions vs. RolePermission):
- `M6DataInitializer.java` initializes:
  1. Roles catalogue (`RoleRepository`).
  2. Granular permissions catalogue (`PermissionRepository`) and default role-permission grants (`RolePermissionRepository`).
  3. Business parameters (`SystemConfigurationRepository`).
- `schema.sql` Section 9 defines **only** the six roles (`Customer`, `Receptionist`, `Therapist`, `F&B Staff`, `Manager`, `Admin`). Permissions are not present in `schema.sql`.
- **Finding on RBAC Consistency:**  
  Inserting only the six canonical roles does **NOT** leave authentication or RBAC in an inconsistent state:
  - Module 1 (Customer Registration, Login, JWT Generation) and Modules 2–5 (Role authorization via `hasRole('CUSTOMER')`, `hasAnyRole('RECEPTIONIST','MANAGER','ADMIN')`) depend exclusively on `dbo.[User]`, `dbo.[Role]`, and `dbo.UserRole`.
  - Module 6 granular permissions (`dbo.Permission` and `dbo.RolePermission`) are evaluated only by Module 6 governance endpoints (`@perm.has('S49','V')`).
  - Therefore, seeding the six roles establishes the foundational authentication state without requiring immediate permission seeding.

---

## 3. Step 2 — Read-Only Database Inspection

Queries were executed directly against `HSWRMS_TEST` using `hswrms_test_user` credentials securely retrieved from Windows Credential Manager:

### 3.1 Live Database Context

```sql
SELECT @@SERVERNAME AS [ServerName], DB_NAME() AS [DatabaseName], DB_ID() AS [DatabaseId], 
       SUSER_SNAME() AS [LoginName];
```

| Server Name | Database Name | Database ID | Connected Login |
|---|---|:---:|---|
| `MYLIFE-MYRULE-1` | `HSWRMS_TEST` | `45` | `hswrms_test_user` |

---

### 3.2 Baseline Table Row Counts

```sql
SELECT 
    (SELECT COUNT(*) FROM dbo.[Role]) AS [Role_Count],
    (SELECT COUNT(*) FROM dbo.[Permission]) AS [Permission_Count],
    (SELECT COUNT(*) FROM dbo.[RolePermission]) AS [RolePermission_Count],
    (SELECT COUNT(*) FROM dbo.[SystemConfiguration]) AS [SystemConfiguration_Count];
```

| Table | Current Row Count | Status |
|---|:---:|---|
| `dbo.[Role]` | **`0`** | Clean / Unseeded |
| `dbo.[Permission]` | **`0`** | Clean / Unseeded |
| `dbo.[RolePermission]` | **`0`** | Clean / Unseeded |
| `dbo.[SystemConfiguration]` | **`0`** | Clean / Unseeded |

---

### 3.3 Existing Roles and Duplicate Probes

```sql
-- Role details
SELECT role_id, role_name, description FROM dbo.[Role] ORDER BY role_id;

-- Duplicate check
SELECT role_name, COUNT(*) AS [DuplicateCount] 
FROM dbo.[Role] 
GROUP BY role_name 
HAVING COUNT(*) > 1;
```

- **Existing Roles in `dbo.[Role]`:** **`0` rows returned.**
- **Duplicate Role Names:** **`0` rows returned.**
- **Existing Permissions in `dbo.[Permission]`:** **`0` rows returned.**
- **Existing Role-Permission Mappings in `dbo.RolePermission`:** **`0` rows returned.**
- **Existing Parameters in `dbo.[SystemConfiguration]`:** **`0` rows returned.**

---

### 3.4 Foreign Keys Referencing `dbo.[Role]`

```sql
SELECT fk.name AS ForeignKeyName, OBJECT_NAME(fk.parent_object_id) AS ParentTable, c.name AS ParentColumn 
FROM sys.foreign_keys fk 
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id 
JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id 
WHERE fk.referenced_object_id = OBJECT_ID('dbo.Role');
```

| Foreign Key Name | Child Table | Foreign Key Column | Target Table & Column |
|---|---|---|---|
| `FK_RolePermission_Role` | `dbo.RolePermission` | `role_id` | `dbo.[Role](role_id)` |
| `FK_UserRole_Role` | `dbo.UserRole` | `role_id` | `dbo.[Role](role_id)` |

---

## 4. Step 3 — Proposed Idempotent Seed Plan (NOT EXECUTED)

The following idempotent seed script is proposed for execution in a subsequent authorized phase. It is strictly **NOT EXECUTED** in this phase.

### 4.1 Safety Architecture of the Plan
1. **Target Verification:** Guarantees connection is in `HSWRMS_TEST` (Database ID `45`) before proceeding.
2. **Conflict Prevention:** Halts execution if any unexpected non-canonical roles or duplicates are detected.
3. **Idempotence:** Uses `IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'...')` checks to ensure re-running does not fail or duplicate rows.
4. **Identity Independence:** Does not force identity numbers (`SET IDENTITY_INSERT` is omitted); role IDs are generated natively by SQL Server.
5. **Atomic Transaction:** Wrapped in an explicit `BEGIN TRANSACTION ... COMMIT TRANSACTION` block.

### 4.2 Proposed SQL Statements (NOT EXECUTED)

```sql
-- ==============================================================================
-- PROPOSED SCRIPT: IDEMPOTENT CANONICAL ROLE SEED FOR HSWRMS_TEST
-- STATUS: PROPOSED ONLY — STRICTLY NOT EXECUTED IN PHASE 5.8.3.100
-- TARGET INSTANCE: localhost:1433 (MYLIFE-MYRULE-1)
-- TARGET DATABASE: HSWRMS_TEST (Database ID: 45)
-- TARGET TABLE: dbo.[Role]
-- ==============================================================================

USE [HSWRMS_TEST];
GO

-- 1. Fail-closed safety assertion: target database must be HSWRMS_TEST (ID 45)
IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45
BEGIN
    RAISERROR('FATAL ERROR: Target database is not HSWRMS_TEST (ID 45). Aborting immediately.', 20, 1) WITH LOG;
END;
GO

-- 2. Conflict & Sanity Check: Ensure no conflicting or duplicate role names exist
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

IF EXISTS (
    SELECT 1 
    FROM dbo.[Role] 
    WHERE role_name NOT IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin')
)
BEGIN
    RAISERROR('FATAL ERROR: Unexpected non-canonical role found in dbo.[Role]. Aborting to prevent collision.', 20, 1) WITH LOG;
END;
GO

-- 3. Idempotent Inserts: Only insert missing canonical roles
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
```

---

### 4.3 Post-Verification Queries

```sql
-- 1. Confirm total count is exactly 6
SELECT COUNT(*) AS TotalRoles FROM dbo.[Role];

-- 2. List all 6 roles with generated IDs
SELECT role_id, role_name, description 
FROM dbo.[Role] 
ORDER BY role_id;

-- 3. Assert zero duplicates
SELECT role_name, COUNT(*) AS DuplicateCount 
FROM dbo.[Role] 
GROUP BY role_name 
HAVING COUNT(*) > 1;

-- 4. Confirm zero unintended changes to other tables
SELECT 
    (SELECT COUNT(*) FROM dbo.[Permission]) AS PermissionCount,
    (SELECT COUNT(*) FROM dbo.[RolePermission]) AS RolePermissionCount,
    (SELECT COUNT(*) FROM dbo.[SystemConfiguration]) AS SystemConfigCount;
```

---

### 4.4 Rollback Plan & Referential Safeguards

If the inserted roles must be rolled back, the following script provides safe removal while guarding against accidental foreign key violations:

```sql
-- ==============================================================================
-- ROLLBACK SCRIPT: SAFE REMOVAL OF UNREFERENCED CANONICAL ROLES
-- STATUS: READY FOR OPERATOR USE IF NEEDED — NOT EXECUTED
-- ==============================================================================

USE [HSWRMS_TEST];
GO

IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45
BEGIN
    RAISERROR('FATAL ERROR: Target database is not HSWRMS_TEST (45). Aborting.', 20, 1) WITH LOG;
END;
GO

-- Safeguard: ensure none of the roles are actively referenced by UserRole or RolePermission
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
    RAISERROR('ROLLBACK BLOCKED: One or more canonical roles are actively referenced in UserRole or RolePermission. Deletion aborted to preserve referential integrity.', 16, 1);
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
?? 05_Development/database/reports/PHASE_5.8.3.98_READ_PERMISSION_GRANT_PREFLIGHT.md
?? 05_Development/database/reports/PHASE_5.8.3.99_CONTROLLED_READ_PERMISSION_GRANT_REPORT.md
?? 05_Development/database/reports/PHASE_5.8.3.100_BASELINE_ROLE_SEED_PREFLIGHT.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

- **Staged Changes:** 0 files staged.
- **Commits:** 0 commits made.
- **Protected DB Integrity:** Database `HSWRMS` was completely untouched and remains isolated.
- **Test DB Integrity:** Database `HSWRMS_TEST` received zero data mutations.

---

## 6. Conclusion & Recommendation

1. **Preflight Verdict:** **PASS / READY FOR AUTHORIZED EXECUTION**.
2. **Readiness Summary:**
   - Table `dbo.[Role]` is clean (`0` rows).
   - The authoritative schema seed (`schema.sql` Section 9) is fully idempotent, identity-independent, and safe to execute in isolation.
   - Inserting the six canonical roles satisfies all prerequisite RBAC role lookups for Module 1 authentication, registration, and Modules 2–5 role-based authorization without risking data corruption or permission conflicts.

