# PHASE 5.8.3.103 — CONTROLLED RBAC BASELINE SEED REPORT

**Phase:** 5.8.3.103  
**Module:** HSWRMS Database Security & Baseline RBAC Seed Execution  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Timestamp:** 2026-10-28 22:37:25 +07:00  
**Status:** COMPLETED — 100% PASS (Baseline Seed Committed; Authoritative Invariants Verified; Discrepancy Reconciled; Zero Unintended Mutations)

---

## 1. Executive Summary

In Phase 5.8.3.103, an authorized, idempotent data seed was executed against the dedicated test database `HSWRMS_TEST` to initialize the authoritative `dbo.[Permission]`, `dbo.RolePermission`, and `dbo.SystemConfiguration` baseline data.

### Key Highlights
1. **Pre-Execution Review & Preflight Verification:**  
   Immediately prior to execution, preflight queries executed as least-privilege `hswrms_test_user` confirmed SQL Server instance `MYLIFE-MYRULE-1`, database `HSWRMS_TEST` (Database ID: `45`, Status: `ONLINE`), exactly 6 canonical roles (`role_id` 1 to 6) in `dbo.[Role]`, and exactly `0` rows in `dbo.[Permission]`, `dbo.RolePermission`, `dbo.SystemConfiguration`, `dbo.[User]`, and `dbo.UserRole`.
2. **Single Atomic Administrative Transaction:**  
   Executed via an administrative session (`sqlcmd -S localhost -d HSWRMS_TEST -E -b`) strictly targeting `HSWRMS_TEST`. Zero write permissions were granted to `hswrms_test_user`. No application initializers, migrations, schema scripts, or demo accounts were invoked.
3. **Database Population:**  
   - `dbo.[Permission]`: Inserted exactly **41 canonical permissions** matching [`PermissionCatalog.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/PermissionCatalog.java).
   - `dbo.RolePermission`: Inserted exactly **48 authoritative mappings** resolving `role_id` dynamically by canonical role name and `permission_id` by composite key `(module_or_screen, action_type)`.
   - `dbo.SystemConfiguration`: Inserted exactly **6 canonical business parameters** matching [`M6DataInitializer.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java).
4. **48 vs 49 Mapping Discrepancy Reconciliation:**  
   The nominal prompt expectation of 49 mappings was reconciled against authoritative source code. In `PermissionCatalog.java`, Manager holds exactly 7 default permissions (`S54:V`, `S55:V`, `S46:V`, `S47:V`, `S47:E`, `S48:V`, `S48:E`). The number 49 originated from a table footer addition typo in Phase 5.8.3.102 report (`1+1+1+2+2 = 7`, mislabeled as `8`). The executed SQL script and authoritative code yield exactly 48 mappings.
5. **Post-Execution Invariants & Isolation:**  
   Verified via `hswrms_test_user` (holding `db_datareader`):
   - All 48 mappings reference valid roles and permissions (0 orphaned foreign keys).
   - Zero duplicate permissions or mappings.
   - `dbo.[Role]` remains strictly at 6 rows (IDs 1 to 6 intact).
   - `dbo.[User]` and `dbo.UserRole` remain strictly at `0` rows.
   - Schema integrity remains 100% preserved (42 user tables, 42 PKs, 56 FKs, 21 UQs, 49 CKs, 67 DFs, 3 Triggers, 77 Indexes).
   - Primary database `HSWRMS` remains completely isolated, untouched, and inaccessible (`HAS_DBACCESS('HSWRMS') = 0`).

---

## 2. Pre-Execution Review Checklist

Prior to execution, the proposed seed payload and environment were evaluated against the 11 safety criteria defined in Step 1:

| # | Safety Requirement | Verified Operational State | Evaluation |
|:---:|---|---|:---:|
| **1** | Target instance is `MYLIFE-MYRULE-1` | Enforced in SQL script via `IF @@SERVERNAME <> 'MYLIFE-MYRULE-1' ...` and verified via preflight query. | **PASS** |
| **2** | Target database is `HSWRMS_TEST`, DB ID 45, ONLINE | Enforced via `IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45 ...` and verified via preflight query. | **PASS** |
| **3** | Every statement targets only authorized tables | Script contains INSERT statements targeting strictly `dbo.[Permission]`, `dbo.RolePermission`, and `dbo.SystemConfiguration`. | **PASS** |
| **4** | 41 permissions and mappings match `PermissionCatalog.java` | 41 permissions match 100%. Mappings match authoritative `PermissionCatalog.java` (48 mappings). Nominal 49 count in prompt footer reconciled to 48. | **PASS (Reconciled)** |
| **5** | Six business parameters match `M6DataInitializer.java` | Keys, values, min/max bounds, units, descriptions, and manager-editable flags match `M6DataInitializer.java` lines 83–94 with 100% fidelity. | **PASS** |
| **6** | Dynamic key resolution | `role_id` resolved via `JOIN dbo.[Role] r ON r.role_name = g.role_name`; `permission_id` resolved via `JOIN dbo.[Permission] p ON p.module_or_screen = g.module_or_screen AND p.action_type = g.action_type`. | **PASS** |
| **7** | Existing 6 Role rows unchanged | Pre- and post-assertions verify `dbo.[Role]` contains exactly 6 rows (IDs 1–6) before and after transaction. | **PASS** |
| **8** | Conflicting/duplicate keys stop transaction | Preflight assertions verify target tables are clean. Unique constraints (`UQ_Permission`, `PK_RolePermission`, `UQ_SystemConfiguration_Key`) and `WHERE NOT EXISTS` prevent duplicates. | **PASS** |
| **9** | Transaction handling | Uses `SET XACT_ABORT ON` and atomic `BEGIN TRANSACTION ... COMMIT TRANSACTION` with explicit error rollbacks. | **PASS** |
| **10** | Execution boundary isolation | Hard assertions on server name and database ID prevent execution against `HSWRMS` or remote instances. | **PASS** |
| **11** | Zero unrelated execution | Standalone script executed via `sqlcmd`. Zero application context initializers, migrations, or demo user seeds invoked. | **PASS** |

---

## 3. Pre-Execution Baseline State Evidence

Executed via `hswrms_test_user` immediately prior to mutation:

```text
ServerName      DatabaseName DatabaseId LoginName       
----------      ------------ ---------- ---------       
MYLIFE-MYRULE-1 HSWRMS_TEST          45 hswrms_test_user

Role_Count Permission_Count RolePermission_Count SystemConfiguration_Count User_Count UserRole_Count
---------- ---------------- -------------------- ------------------------- ---------- --------------
         6                0                    0                         0          0              0

role_id role_name    description                                            
------- ---------    -----------                                            
      1 Customer     Authenticated resort customer.                         
      2 Receptionist Front-desk and stay operations staff.                  
      3 Therapist    Spa Therapist / Yoga Instructor.                       
      4 F&B Staff    Food and beverage operational staff / Chef.            
      5 Manager      Management monitoring and approved delegated functions.
      6 Admin        System administration and governance.                  

Access_TEST Access_Protected
----------- ----------------
          1                0
```

---

## 4. Exact Executed SQL Statement & Script Reference

The execution was performed via administrative session (`MYLIFE-MYRULE-1\ADMIN`) using `sqlcmd`:

```powershell
sqlcmd -S localhost -d HSWRMS_TEST -E -b -W -i "C:\Users\ADMIN\.gemini\antigravity\brain\7621dbd9-3a9c-4d73-9c7d-f680205eaf8f\scratch\seed_rbac_baseline.sql"
```

### Full Executed SQL Content

```sql
-- ==============================================================================
-- PHASE 5.8.3.103: CONTROLLED RBAC BASELINE SEED FOR HSWRMS_TEST
-- TARGET SERVER:   MYLIFE-MYRULE-1 (localhost:1433)
-- TARGET DATABASE: HSWRMS_TEST (DB_ID: 45)
-- TARGET TABLES:   dbo.[Permission], dbo.RolePermission, dbo.SystemConfiguration
-- ==============================================================================

USE [HSWRMS_TEST];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- 1. Instance and Database Safety Verification
IF @@SERVERNAME <> 'MYLIFE-MYRULE-1'
BEGIN
    RAISERROR('FATAL ERROR: Target instance is not MYLIFE-MYRULE-1. Aborting immediately.', 20, 1) WITH LOG;
END;

IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45
BEGIN
    RAISERROR('FATAL ERROR: Target database is not HSWRMS_TEST (ID 45). Aborting immediately.', 20, 1) WITH LOG;
END;

-- 2. Preflight State Assertions: Canonical roles must exist
IF (SELECT COUNT(*) FROM dbo.[Role] WHERE role_name IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin')) <> 6
BEGIN
    RAISERROR('FATAL ERROR: Missing canonical roles in dbo.[Role]. Aborting immediately.', 20, 1) WITH LOG;
END;

-- 3. Preflight State Assertions: Target tables must be empty before seed
IF (SELECT COUNT(*) FROM dbo.[Permission]) <> 0
BEGIN
    RAISERROR('FATAL ERROR: dbo.[Permission] already contains data. Aborting immediately.', 20, 1) WITH LOG;
END;

IF (SELECT COUNT(*) FROM dbo.RolePermission) <> 0
BEGIN
    RAISERROR('FATAL ERROR: dbo.RolePermission already contains data. Aborting immediately.', 20, 1) WITH LOG;
END;

IF (SELECT COUNT(*) FROM dbo.SystemConfiguration WHERE configuration_type = N'BUSINESS_PARAMETER') <> 0
BEGIN
    RAISERROR('FATAL ERROR: dbo.SystemConfiguration already contains BUSINESS_PARAMETER data. Aborting immediately.', 20, 1) WITH LOG;
END;

-- 4. Preflight State Assertions: User tables must be empty (Zero demo users)
IF (SELECT COUNT(*) FROM dbo.[User]) <> 0 OR (SELECT COUNT(*) FROM dbo.UserRole) <> 0
BEGIN
    RAISERROR('FATAL ERROR: User or UserRole table is not empty. Aborting immediately.', 20, 1) WITH LOG;
END;

-- ==============================================================================
-- EXECUTE SEED TRANSACTION
-- ==============================================================================
BEGIN TRANSACTION;

-- STEP 1: Insert 41 Permissions into dbo.[Permission]
DECLARE @PermCatalog TABLE (
    module_or_screen NVARCHAR(100),
    action_type      NVARCHAR(50),
    is_delegable     BIT,
    is_admin_only    BIT
);

INSERT INTO @PermCatalog (module_or_screen, action_type, is_delegable, is_admin_only) VALUES
-- M6 Staff & Master Data
(N'S10', N'V', 0, 1), (N'S10', N'C', 0, 1), (N'S10', N'U', 0, 1), (N'S10', N'D', 0, 1),
(N'S11', N'V', 0, 1), (N'S11', N'C', 0, 1), (N'S11', N'U', 0, 1), (N'S11', N'D', 0, 1),
(N'S12', N'V', 1, 1), (N'S12', N'C', 0, 1), (N'S12', N'U', 0, 1), (N'S12', N'D', 0, 1),
-- M6 Admin Governance
(N'S49', N'V', 0, 1),
(N'S50', N'V', 1, 1), (N'S50', N'U', 1, 1),
(N'S51', N'V', 0, 1), (N'S51', N'G', 0, 1),
(N'S52', N'V', 0, 1), (N'S52', N'C', 0, 1), (N'S52', N'D', 0, 1),
(N'S53', N'V', 1, 1), (N'S53', N'E', 0, 1),
(N'S54', N'V', 0, 0),
(N'S55', N'V', 0, 0),
(N'S55_ADMIN_WIDGETS', N'V', 1, 1),
(N'RESIDENCE_REPORT', N'E', 1, 0),
-- Landing Screens & Analytics
(N'S02', N'V', 0, 0),
(N'S20', N'V', 0, 0),
(N'S31', N'V', 0, 0),
(N'S38', N'V', 0, 0),
(N'S39', N'V', 0, 0), (N'S39', N'U', 0, 0),
(N'S46', N'V', 0, 0),
(N'S47', N'V', 0, 0), (N'S47', N'E', 0, 0),
(N'S48', N'V', 0, 0), (N'S48', N'E', 0, 0),
-- Sensitive Data Categories
(N'DATA_HEALTH_FULL', N'V', 0, 0),
(N'DATA_HEALTH_TREATMENT', N'V', 0, 0),
(N'DATA_FOOD_ALLERGY', N'V', 0, 0),
(N'DATA_RESIDENCE', N'V', 0, 0);

INSERT INTO dbo.[Permission] (module_or_screen, action_type, is_delegable, is_admin_only)
SELECT c.module_or_screen, c.action_type, c.is_delegable, c.is_admin_only
FROM @PermCatalog c
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.[Permission] p
    WHERE p.module_or_screen = c.module_or_screen AND p.action_type = c.action_type
);

-- STEP 2: Insert 48 RolePermissions into dbo.RolePermission
DECLARE @Grants TABLE (
    role_name        NVARCHAR(50),
    module_or_screen NVARCHAR(100),
    action_type      NVARCHAR(50)
);

-- Admin Grants (28)
INSERT INTO @Grants VALUES
(N'Admin', N'S10', N'V'), (N'Admin', N'S10', N'C'), (N'Admin', N'S10', N'U'), (N'Admin', N'S10', N'D'),
(N'Admin', N'S11', N'V'), (N'Admin', N'S11', N'C'), (N'Admin', N'S11', N'U'), (N'Admin', N'S11', N'D'),
(N'Admin', N'S12', N'V'), (N'Admin', N'S12', N'C'), (N'Admin', N'S12', N'U'), (N'Admin', N'S12', N'D'),
(N'Admin', N'S49', N'V'),
(N'Admin', N'S50', N'V'), (N'Admin', N'S50', N'U'),
(N'Admin', N'S51', N'V'), (N'Admin', N'S51', N'G'),
(N'Admin', N'S52', N'V'), (N'Admin', N'S52', N'C'), (N'Admin', N'S52', N'D'),
(N'Admin', N'S53', N'V'), (N'Admin', N'S53', N'E'),
(N'Admin', N'S55', N'V'), (N'Admin', N'S55_ADMIN_WIDGETS', N'V'),
(N'Admin', N'RESIDENCE_REPORT', N'E'),
(N'Admin', N'S46', N'V'), (N'Admin', N'S47', N'V'), (N'Admin', N'S48', N'V');

-- Manager Grants (7)
INSERT INTO @Grants VALUES
(N'Manager', N'S54', N'V'),
(N'Manager', N'S55', N'V'),
(N'Manager', N'S46', N'V'),
(N'Manager', N'S47', N'V'), (N'Manager', N'S47', N'E'),
(N'Manager', N'S48', N'V'), (N'Manager', N'S48', N'E');

-- Receptionist Grants (3)
INSERT INTO @Grants VALUES
(N'Receptionist', N'S20', N'V'),
(N'Receptionist', N'RESIDENCE_REPORT', N'E'),
(N'Receptionist', N'DATA_RESIDENCE', N'V');

-- Therapist Grants (2)
INSERT INTO @Grants VALUES
(N'Therapist', N'S31', N'V'),
(N'Therapist', N'DATA_HEALTH_TREATMENT', N'V');

-- F&B Staff Grants (4)
INSERT INTO @Grants VALUES
(N'F&B Staff', N'S38', N'V'),
(N'F&B Staff', N'S39', N'V'), (N'F&B Staff', N'S39', N'U'),
(N'F&B Staff', N'DATA_FOOD_ALLERGY', N'V');

-- Customer Grants (4)
INSERT INTO @Grants VALUES
(N'Customer', N'S02', N'V'),
(N'Customer', N'DATA_HEALTH_FULL', N'V'),
(N'Customer', N'DATA_HEALTH_TREATMENT', N'V'),
(N'Customer', N'DATA_FOOD_ALLERGY', N'V');

INSERT INTO dbo.RolePermission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM @Grants g
JOIN dbo.[Role] r ON r.role_name = g.role_name
JOIN dbo.[Permission] p ON p.module_or_screen = g.module_or_screen AND p.action_type = g.action_type
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.RolePermission rp
    WHERE rp.role_id = r.role_id AND rp.permission_id = p.permission_id
);

-- STEP 3: Insert 6 SystemConfiguration Parameters
IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfiguration WHERE configuration_key = N'cancellation_window_hours')
    INSERT INTO dbo.SystemConfiguration (configuration_type, configuration_key, configuration_value, value_type, min_value, max_value, unit, description, manager_editable)
    VALUES (N'BUSINESS_PARAMETER', N'cancellation_window_hours', N'48', 'INT', 0, 720, N'Hours', N'Booking cancellation deadline window', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfiguration WHERE configuration_key = N'refund_percentage')
    INSERT INTO dbo.SystemConfiguration (configuration_type, configuration_key, configuration_value, value_type, min_value, max_value, unit, description, manager_editable)
    VALUES (N'BUSINESS_PARAMETER', N'refund_percentage', N'80', 'INT', 0, 100, N'Percent', N'Default refund percentage on timely cancellation', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfiguration WHERE configuration_key = N'deposit_percentage')
    INSERT INTO dbo.SystemConfiguration (configuration_type, configuration_key, configuration_value, value_type, min_value, max_value, unit, description, manager_editable)
    VALUES (N'BUSINESS_PARAMETER', N'deposit_percentage', N'30', 'INT', 10, 100, N'Percent', N'Required deposit percentage for retreat packages', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfiguration WHERE configuration_key = N'max_failed_login_attempts')
    INSERT INTO dbo.SystemConfiguration (configuration_type, configuration_key, configuration_value, value_type, min_value, max_value, unit, description, manager_editable)
    VALUES (N'BUSINESS_PARAMETER', N'max_failed_login_attempts', N'5', 'INT', 3, 10, N'Attempts', N'Consecutive failed sign-ins before locking account', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfiguration WHERE configuration_key = N'lockout_duration_minutes')
    INSERT INTO dbo.SystemConfiguration (configuration_type, configuration_key, configuration_value, value_type, min_value, max_value, unit, description, manager_editable)
    VALUES (N'BUSINESS_PARAMETER', N'lockout_duration_minutes', N'10', 'INT', 5, 60, N'Minutes', N'Account lockout duration before JOB-01 unlock', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.SystemConfiguration WHERE configuration_key = N'audit_log_retention_days')
    INSERT INTO dbo.SystemConfiguration (configuration_type, configuration_key, configuration_value, value_type, min_value, max_value, unit, description, manager_editable)
    VALUES (N'BUSINESS_PARAMETER', N'audit_log_retention_days', N'90', 'INT', 30, 365, N'Days', N'Audit log retention duration before JOB-02 purge', 0);

-- STEP 4: Post-Execution Safety Verification inside Transaction
IF (SELECT COUNT(*) FROM dbo.[Permission]) <> 41
BEGIN
    RAISERROR('FATAL ERROR: Unexpected count in dbo.[Permission]. Expected 41. Rolling back.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF (SELECT COUNT(*) FROM dbo.RolePermission) <> 48
BEGIN
    RAISERROR('FATAL ERROR: Unexpected count in dbo.RolePermission. Expected 48. Rolling back.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF (SELECT COUNT(*) FROM dbo.SystemConfiguration WHERE configuration_type = N'BUSINESS_PARAMETER') <> 6
BEGIN
    RAISERROR('FATAL ERROR: Unexpected count in dbo.SystemConfiguration. Expected 6. Rolling back.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF (SELECT COUNT(*) FROM dbo.[Role]) <> 6 OR (SELECT COUNT(*) FROM dbo.[User]) <> 0 OR (SELECT COUNT(*) FROM dbo.UserRole) <> 0
BEGIN
    RAISERROR('FATAL ERROR: Unintended modification detected in Role or User tables. Rolling back.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

COMMIT TRANSACTION;
PRINT 'PHASE 5.8.3.103: SUCCESS - Seed transaction committed successfully.';
GO
```

### Transaction Execution Output
```text
Changed database context to 'HSWRMS_TEST'.
PHASE 5.8.3.103: SUCCESS - Seed transaction committed successfully.
```

---

## 5. Post-Execution State Evidence (via `hswrms_test_user`)

Executed via `hswrms_test_user` immediately after transaction commit:

### 5.1 Before / After Table Row Counts

| Table Name | Before Phase 103 | After Phase 103 | Net Delta | Expected State | Compliance |
|---|:---:|:---:|:---:|:---:|:---:|
| `dbo.[Role]` | **`6`** | **`6`** | 0 | 6 Canonical Roles | **PASS** |
| `dbo.[Permission]` | **`0`** | **`41`** | +41 | 41 Canonical Permissions | **PASS** |
| `dbo.RolePermission` | **`0`** | **`48`** | +48 | 48 Distinct Mappings | **PASS (Reconciled)** |
| `dbo.SystemConfiguration` | **`0`** | **`6`** | +6 | 6 Business Parameters | **PASS** |
| `dbo.[User]` | **`0`** | **`0`** | 0 | 0 Demo Users | **PASS** |
| `dbo.UserRole` | **`0`** | **`0`** | 0 | 0 Demo User Roles | **PASS** |

---

### 5.2 Permission Table Integrity

```sql
SELECT 
    COUNT(*) AS [TotalPermissions],
    COUNT(DISTINCT module_or_screen + ':' + action_type) AS [DistinctPermKeys],
    SUM(CASE WHEN is_delegable = 1 THEN 1 ELSE 0 END) AS [DelegableCount],
    SUM(CASE WHEN is_admin_only = 1 THEN 1 ELSE 0 END) AS [AdminOnlyCount]
FROM dbo.[Permission];
```

```text
TotalPermissions DistinctPermKeys DelegableCount AdminOnlyCount
---------------- ---------------- -------------- --------------
              41               41              6             23
```

- **Uniqueness:** All 41 permissions possess distinct `(module_or_screen, action_type)` composite keys.
- **Delegable Permissions:** Exactly 6 (`S12:V`, `S50:V`, `S50:U`, `S53:V`, `S55_ADMIN_WIDGETS:V`, `RESIDENCE_REPORT:E`).
- **Admin-Only Permissions:** Exactly 23.

---

### 5.3 RolePermission Verification & Discrepancy Reconciliation

```sql
SELECT 
    COUNT(*) AS [TotalRolePermissions],
    COUNT(DISTINCT CAST(role_id AS VARCHAR(10)) + ':' + CAST(permission_id AS VARCHAR(10))) AS [DistinctMappings]
FROM dbo.RolePermission;
```

```text
TotalRolePermissions DistinctMappings
-------------------- ----------------
                  48               48
```

- **Duplicates:** Zero duplicate mappings found (`DuplicateCount` query returned 0 rows).

#### Breakdown of Grants per Canonical Role:

```sql
SELECT 
    r.role_id,
    r.role_name,
    COUNT(rp.permission_id) AS [GrantedPermissionsCount]
FROM dbo.[Role] r
LEFT JOIN dbo.RolePermission rp ON r.role_id = rp.role_id
GROUP BY r.role_id, r.role_name
ORDER BY r.role_id;
```

```text
role_id role_name    GrantedPermissionsCount
------- ---------    -----------------------
      1 Customer                           4
      2 Receptionist                       3
      3 Therapist                          2
      4 F&B Staff                          4
      5 Manager                            7
      6 Admin                             28
```

#### Detailed Reconciled Mapping Matrix (48 Grants):
1. **`Admin` (Role ID 6, 28 Grants):**  
   - Master Data: `S10:V`, `S10:C`, `S10:U`, `S10:D`, `S11:V`, `S11:C`, `S11:U`, `S11:D`, `S12:V`, `S12:C`, `S12:U`, `S12:D` (12)
   - Governance: `S49:V`, `S50:V`, `S50:U`, `S51:V`, `S51:G`, `S52:V`, `S52:C`, `S52:D`, `S53:V`, `S53:E`, `S55:V`, `S55_ADMIN_WIDGETS:V`, `RESIDENCE_REPORT:E` (13)
   - Analytics Monitoring: `S46:V`, `S47:V`, `S48:V` (3)
   - Total: 12 + 13 + 3 = **28**.
2. **`Manager` (Role ID 5, 7 Grants):**  
   - Operational Monitoring: `S54:V`, `S55:V`, `S46:V` (3)
   - Spa & F&B Analytics + Export: `S47:V`, `S47:E`, `S48:V`, `S48:E` (4)
   - Total: 3 + 4 = **7**.
3. **`Receptionist` (Role ID 2, 3 Grants):**  
   - Stay Operations: `S20:V` (1)
   - Residence Reporting: `RESIDENCE_REPORT:E` (1)
   - Data Minimization: `DATA_RESIDENCE:V` (1)
   - Total = **3**.
4. **`Therapist` (Role ID 3, 2 Grants):**  
   - Spa Schedule: `S31:V` (1)
   - Health Flags: `DATA_HEALTH_TREATMENT:V` (1)
   - Total = **2**.
5. **`F&B Staff` (Role ID 4, 4 Grants):**  
   - Kitchen Operations: `S38:V`, `S39:V`, `S39:U` (3)
   - Dietary Flags: `DATA_FOOD_ALLERGY:V` (1)
   - Total = **4**.
6. **`Customer` (Role ID 1, 4 Grants):**  
   - Customer Portal: `S02:V` (1)
   - Sensitive Profile Flags: `DATA_HEALTH_FULL:V`, `DATA_HEALTH_TREATMENT:V`, `DATA_FOOD_ALLERGY:V` (3)
   - Total = **4**.

**Grand Total:** 28 + 7 + 3 + 2 + 4 + 4 = **48 Grants**.

> [!NOTE]
> **Discrepancy Reconciliation (48 vs 49):**  
> The prompt specified a nominal expectation of 49 mappings based on the Section 5 summary footer in `PHASE_5.8.3.102_PERMISSION_CATALOG_RBAC_PREFLIGHT.md`. In that report, Manager grants (`1+1+1+2+2 = 7`) were summed as `8` in the table footer, yielding `28+8+3+2+4+4 = 49`. However, the authoritative Java code in [`PermissionCatalog.java#L65-L77`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/PermissionCatalog.java#L65-L77) and the actual SQL block in Section 6 contain exactly 7 grants for Manager and 48 grants in total. In accordance with Step 3 instructions ("*If expected counts differ, report the exact discrepancy; do not attempt additional writes*"), the exact delta is documented here, and zero additional writes were attempted.

---

### 5.4 Foreign Key & Referential Integrity

```sql
SELECT 
    (SELECT COUNT(*) FROM dbo.RolePermission rp WHERE NOT EXISTS (SELECT 1 FROM dbo.[Role] r WHERE r.role_id = rp.role_id)) AS [OrphanRoleFK],
    (SELECT COUNT(*) FROM dbo.RolePermission rp WHERE NOT EXISTS (SELECT 1 FROM dbo.[Permission] p WHERE p.permission_id = rp.permission_id)) AS [OrphanPermissionFK];
```

```text
OrphanRoleFK OrphanPermissionFK
------------ ------------------
           0                  0
```

All 48 mappings reference existing roles and permissions. Referential integrity is 100% sound.

---

### 5.5 SystemConfiguration Business Parameters

```sql
SELECT 
    configuration_id, configuration_key, configuration_value, 
    value_type, min_value, max_value, unit, manager_editable, description
FROM dbo.SystemConfiguration
WHERE configuration_type = N'BUSINESS_PARAMETER'
ORDER BY configuration_key;
```

```text
configuration_id configuration_key         configuration_value value_type min_value max_value unit     manager_editable
---------------- -----------------         ------------------- ---------- --------- --------- ----     ----------------
               6 audit_log_retention_days  90                  INT          30.0000  365.0000 Days                False
               1 cancellation_window_hours 48                  INT           0.0000  720.0000 Hours                True
               3 deposit_percentage        30                  INT          10.0000  100.0000 Percent              True
               5 lockout_duration_minutes  10                  INT           5.0000   60.0000 Minutes             False
               4 max_failed_login_attempts 5                   INT           3.0000   10.0000 Attempts            False
               2 refund_percentage         80                  INT           0.0000  100.0000 Percent              True
```

All 6 parameters match `M6DataInitializer.java` lines 83–94 with exact precision.

---

### 5.6 Canonical Roles Inventory & Identity Invariants

```sql
SELECT role_id, role_name, description FROM dbo.[Role] ORDER BY role_id;
```

```text
role_id role_name    description                                            
------- ---------    -----------                                            
      1 Customer     Authenticated resort customer.                         
      2 Receptionist Front-desk and stay operations staff.                  
      3 Therapist    Spa Therapist / Yoga Instructor.                       
      4 F&B Staff    Food and beverage operational staff / Chef.            
      5 Manager      Management monitoring and approved delegated functions.
      6 Admin        System administration and governance.                  
```

Roles remain unchanged with identical IDs (1 to 6).

---

### 5.7 Schema Integrity Verification

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

```text
UserTables PK_Count FK_Count UQ_Count CK_Count DF_Count Trigger_Count Total_Indexes
---------- -------- -------- -------- -------- -------- ------------- -------------
        42       42       56       21       49       67             3            77
```

Database schema integrity is completely preserved.

---

### 5.8 Database Role Membership & Isolation Verification

```sql
-- Role Membership
SELECT dp.name AS PrincipalName, r.name AS RoleName
FROM sys.database_role_members drm
JOIN sys.database_principals dp ON drm.member_principal_id = dp.principal_id
JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
WHERE dp.name = 'hswrms_test_user';

-- Database Isolation
SELECT 
    HAS_DBACCESS('HSWRMS_TEST') AS [Access_HSWRMS_TEST],
    HAS_DBACCESS('HSWRMS') AS [Access_HSWRMS_Protected];
```

```text
PrincipalName    RoleName     
-------------    --------     
hswrms_test_user db_datareader

Access_HSWRMS_TEST Access_HSWRMS_Protected
------------------ -----------------------
                 1                       0
```

- `hswrms_test_user` holds strictly `db_datareader`; zero write roles granted.
- Primary protected database `HSWRMS` access evaluates to `0` (strictly isolated and untouched).

---

## 6. Changed Files & Git Status

### Repository Working Tree
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`

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
?? 05_Development/database/reports/PHASE_5.8.3.102_PERMISSION_CATALOG_RBAC_PREFLIGHT.md
?? 05_Development/database/reports/PHASE_5.8.3.103_CONTROLLED_RBAC_BASELINE_SEED_REPORT.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

- **Staged Changes:** 0 files staged.
- **Commits:** 0 commits made.
- **Application Code:** 0 source code files modified during this phase.

---

## 7. Conclusion & Next Steps

1. **Phase 5.8.3.103 Execution Verdict:** **SUCCESS — 100% PASS**.
2. **Database Status:**  
   - `HSWRMS_TEST` now contains the complete canonical RBAC catalog (6 Roles, 41 Permissions, 48 RolePermissions, 6 Business Parameters).
   - Zero demo users or demo user roles have been seeded.
   - Primary database `HSWRMS` remains completely isolated, offline to test credentials, and untouched.
3. **Operational Readiness:**  
   The test environment `HSWRMS_TEST` is now fully prepared for public catalog endpoint tests (`GET /api/v1/packages`, `GET /api/v1/spa/treatments`, `GET /api/v1/fnb/customer/menu-items`) and subsequent authentication integration tests.

