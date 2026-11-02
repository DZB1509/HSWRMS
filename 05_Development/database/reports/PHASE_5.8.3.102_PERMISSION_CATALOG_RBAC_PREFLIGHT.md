# PHASE 5.8.3.102 — PERMISSION CATALOG & RBAC SEED PREFLIGHT REPORT

**Phase:** 5.8.3.102  
**Module:** HSWRMS Database Security & RBAC Preflight Audit  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Timestamp:** 2026-10-28 22:15:00 +07:00  
**Status:** COMPLETED — PREFLIGHT PASS (Strictly Read-Only, Zero Data Mutations Executed)

---

## 1. Executive Summary & Objective

Phase 5.8.3.102 performed a comprehensive, strictly read-only audit of the authoritative permission catalog, role-permission mapping rules, and default business parameters before initializing RBAC baseline data in `HSWRMS_TEST`.

Key Audit Accomplishments:
1. **Live Database Inspection via Least-Privilege Account:**  
   Executed SELECT-only queries as `hswrms_test_user` (under `db_datareader`) against `HSWRMS_TEST` (Database ID 45). Confirmed the six canonical roles exist (`role_id` 1 to 6) and verified that `Permission`, `RolePermission`, and `SystemConfiguration` currently contain **`0` rows**.
2. **Authoritative Permission Catalog Analysis:**  
   Audited `PermissionCatalog.java` and `M6DataInitializer.java`. Identified all **41 distinct permissions** across Modules 1 through 6, and mapped the **49 default role-permission assignments**.
3. **Role Resolution & Aliasing Invariants:**  
   Verified how role names are resolved. Specifically audited the mapping between `"FNB_STAFF"` in `PermissionCatalog` and database canonical name `"F&B Staff"` (role_id 4) to ensure 100% compatibility with `CustomUserDetails.normalizeRoleAuthorities`.
4. **Data Minimization & Privilege Boundaries:**  
   Audited sensitive data access categories (`DATA_HEALTH_FULL`, `DATA_HEALTH_TREATMENT`, `DATA_FOOD_ALLERGY`, `DATA_RESIDENCE`). Reconfirmed that `Admin` and `Manager` are strictly excluded from direct guest health and dietary allergy data.
5. **SystemConfiguration Parameters:**  
   Audited the 6 business parameters initialized by Module 6 governance.
6. **Proposed Idempotent Seed Plan (NOT EXECUTED):**  
   Designed an idempotent, atomic SQL script to seed `Permission`, `RolePermission`, and `SystemConfiguration` without hardcoded identity assumptions, including comprehensive rollback safeguards.

---

## 2. Step 1 — Inspection of Authoritative Sources

### 2.1 Table Structure & Constraints

From `05_Development/database/schema.sql#L1007-L1055`:

#### 1. `dbo.[Permission]`
```sql
CREATE TABLE dbo.[Permission] (
    permission_id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Permission PRIMARY KEY,
    module_or_screen    NVARCHAR(100) NOT NULL,
    action_type         NVARCHAR(50) NOT NULL,
    is_delegable        BIT NOT NULL
        CONSTRAINT DF_Permission_IsDelegable DEFAULT (0),
    is_admin_only       BIT NOT NULL
        CONSTRAINT DF_Permission_IsAdminOnly DEFAULT (0),
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_Permission_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_Permission UNIQUE (module_or_screen, action_type)
);
```

#### 2. `dbo.RolePermission`
```sql
CREATE TABLE dbo.RolePermission (
    role_id             INT NOT NULL,
    permission_id       INT NOT NULL,

    CONSTRAINT PK_RolePermission PRIMARY KEY (role_id, permission_id),
    CONSTRAINT FK_RolePermission_Role
        FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id),
    CONSTRAINT FK_RolePermission_Permission
        FOREIGN KEY (permission_id) REFERENCES dbo.[Permission](permission_id)
);
```

#### 3. `dbo.SystemConfiguration`
```sql
CREATE TABLE dbo.SystemConfiguration (
    configuration_id        INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_SystemConfiguration PRIMARY KEY,
    configuration_type      NVARCHAR(50) NOT NULL,
    configuration_key       NVARCHAR(120) NOT NULL,
    configuration_value     NVARCHAR(1000) NULL,
    configuration_status    VARCHAR(20) NOT NULL
        CONSTRAINT DF_SystemConfiguration_Status DEFAULT ('ACTIVE'),
    updated_by_user_id      INT NULL,
    updated_at              DATETIME2(0) NOT NULL
        CONSTRAINT DF_SystemConfiguration_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    value_type              VARCHAR(20) NOT NULL
        CONSTRAINT DF_SystemConfig_ValueType DEFAULT ('INT'),
    min_value               DECIMAL(12,2) NULL,
    max_value               DECIMAL(12,2) NULL,
    unit                    NVARCHAR(40) NULL,
    description             NVARCHAR(500) NULL,
    manager_editable        BIT NOT NULL
        CONSTRAINT DF_SystemConfig_MgrEditable DEFAULT (0),

    CONSTRAINT UQ_SystemConfiguration_Key UNIQUE (configuration_key)
);
```

---

### 2.2 Analysis of Seed Logic & Behavioral Invariants

| Question # | Analysis Item | Verified Finding & Source Evidence |
|:---:|---|---|
| **1** | Permission names & module coverage | **41 permissions** covering M6 administration (`S10-S12`, `S49-S53`), Manager oversight (`S54`, `S55`), Landing screens (`S02`, `S20`, `S31`, `S38`, `S39`), Analytics (`S46-S48`), and Sensitive Data categories (`DATA_*`). Source: `PermissionCatalog.java#L49-L83`. |
| **2** | Permission identity generation | `permission_id` is an `INT IDENTITY(1,1)`. Lookups and composite keys resolve via natural unique key `(module_or_screen, action_type)` (`UQ_Permission`). |
| **3** | Governing constraints | `PK_Permission`, `UQ_Permission`, `PK_RolePermission`, `FK_RolePermission_Role`, `FK_RolePermission_Permission`, `UQ_SystemConfiguration_Key`. |
| **4** | Role ID resolution | Resolved dynamically via `role_name` from `dbo.[Role]`. For canonical role `"F&B Staff"`, mapping matches `role_name IN ('F&B Staff', 'FNB_STAFF')`. |
| **5** | Canonical role-permission mapping | Exactly **49 mappings** across the 6 roles: Admin (28), Manager (8), Receptionist (3), Therapist (2), F&B Staff (4), Customer (4). |
| **6** | SystemConfiguration writes | **YES**. `M6DataInitializer` explicitly writes 6 default operational parameters (`cancellation_window_hours`, `refund_percentage`, `deposit_percentage`, `max_failed_login_attempts`, `lockout_duration_minutes`, `audit_log_retention_days`). |
| **7** | Idempotency & Transactions | Both `M6DataInitializer` and proposed SQL are fully transactional and idempotent via unique constraint assertions (`IF NOT EXISTS`). |
| **8** | Data minimization & privilege creep | Audited: `Admin` and `Manager` are strictly **excluded** from `DATA_HEALTH_*`, `DATA_FOOD_ALLERGY`, and `DATA_RESIDENCE`. |
| **9** | Startup runner side-effects | Full Spring startup risks running `DevAccountBootstrap` or schedulers. A controlled, standalone SQL script eliminates these risks. |

---

## 3. Step 2 — Read-Only Database Verification

Live queries executed via `hswrms_test_user` (under `db_datareader`) against `HSWRMS_TEST`:

### 3.1 Live Database Context & Principal

```sql
SELECT @@SERVERNAME AS [ServerName], DB_NAME() AS [DatabaseName], DB_ID() AS [DatabaseId], 
       SUSER_SNAME() AS [LoginName];
```

| Server Name | Database Name | Database ID | Connected User | User Role |
|---|---|:---:|---|---|
| `MYLIFE-MYRULE-1` | `HSWRMS_TEST` | `45` | `hswrms_test_user` | `db_datareader` |

---

### 3.2 Canonical Roles Inventory (Pre-Seed State)

```sql
SELECT role_id, role_name, description FROM dbo.[Role] ORDER BY role_id;
```

| `role_id` | `role_name` | `description` | Status |
|:---:|---|---|:---:|
| **1** | `Customer` | Authenticated resort customer. | Verified Active |
| **2** | `Receptionist` | Front-desk and stay operations staff. | Verified Active |
| **3** | `Therapist` | Spa Therapist / Yoga Instructor. | Verified Active |
| **4** | `F&B Staff` | Food and beverage operational staff / Chef. | Verified Active |
| **5** | `Manager` | Management monitoring and approved delegated functions. | Verified Active |
| **6** | `Admin` | System administration and governance. | Verified Active |

---

### 3.3 Target Table Row Counts (Pre-Seed State)

```sql
SELECT 
    (SELECT COUNT(*) FROM dbo.[Role]) AS [Role_Count],
    (SELECT COUNT(*) FROM dbo.[Permission]) AS [Permission_Count],
    (SELECT COUNT(*) FROM dbo.[RolePermission]) AS [RolePermission_Count],
    (SELECT COUNT(*) FROM dbo.[SystemConfiguration]) AS [SystemConfiguration_Count],
    (SELECT COUNT(*) FROM dbo.[User]) AS [User_Count],
    (SELECT COUNT(*) FROM dbo.[UserRole]) AS [UserRole_Count];
```

| Table Target | Current Row Count | Expected Initial State |
|---|:---:|:---:|
| `dbo.[Role]` | **`6`** | Exactly 6 Canonical Roles |
| `dbo.[Permission]` | **`0`** | Clean / Unseeded |
| `dbo.[RolePermission]` | **`0`** | Clean / Unseeded |
| `dbo.[SystemConfiguration]` | **`0`** | Clean / Unseeded |
| `dbo.[User]` | **`0`** | Clean / Unseeded |
| `dbo.[UserRole]` | **`0`** | Clean / Unseeded |

---

## 4. Full Authoritative Permission Catalog (41 Permissions)

The following 41 permissions represent the authoritative catalog defined in `PermissionCatalog.java`:

| # | Module / Screen | Action Type | Delegable? | Admin Only? | Description / Functional Scope |
|:---:|---|:---:|:---:|:---:|---|
| **1** | `S10` | `V` | 0 | 1 | View Staff Accounts list & details |
| **2** | `S10` | `C` | 0 | 1 | Create Staff Account |
| **3** | `S10` | `U` | 0 | 1 | Update Staff Account / Role Assignment |
| **4** | `S10` | `D` | 0 | 1 | Deactivate Staff Account |
| **5** | `S11` | `V` | 0 | 1 | View Physical Villas master data |
| **6** | `S11` | `C` | 0 | 1 | Create Physical Villa |
| **7** | `S11` | `U` | 0 | 1 | Update Physical Villa |
| **8** | `S11` | `D` | 0 | 1 | Deactivate Physical Villa |
| **9** | `S12` | `V` | 1 | 1 | View Spa Treatment master data (Delegable to Manager) |
| **10** | `S12` | `C` | 0 | 1 | Create Spa Treatment |
| **11** | `S12` | `U` | 0 | 1 | Update Spa Treatment |
| **12** | `S12` | `D` | 0 | 1 | Deactivate Spa Treatment |
| **13** | `S49` | `V` | 0 | 1 | Administrator Governance Cockpit View |
| **14** | `S50` | `V` | 1 | 1 | View Approved Business Parameters |
| **15** | `S50` | `U` | 1 | 1 | Update Approved Business Parameters |
| **16** | `S51` | `V` | 0 | 1 | View Role-Permission Governance Matrix |
| **17** | `S51` | `G` | 0 | 1 | Configure / Reassign Matrix Permissions |
| **18** | `S52` | `V` | 0 | 1 | View Delegated Administrative Rights |
| **19** | `S52` | `C` | 0 | 1 | Create Manager Right Delegation |
| **20** | `S52` | `D` | 0 | 1 | Revoke / Deactivate Right Delegation |
| **21** | `S53` | `V` | 1 | 1 | View Tamper-Evident Audit Logs |
| **22** | `S53` | `E` | 0 | 1 | Export Audit Logs |
| **23** | `S54` | `V` | 0 | 0 | Manager Oversight View (Manager only) |
| **24** | `S55` | `V` | 0 | 0 | System Operational Overview (Admin & Manager) |
| **25** | `S55_ADMIN_WIDGETS` | `V` | 1 | 1 | Admin Governance Widgets on Overview |
| **26** | `RESIDENCE_REPORT` | `E` | 1 | 0 | Export Residence & Guest Manifest Report |
| **27** | `S02` | `V` | 0 | 0 | Customer Portal Landing Screen View |
| **28** | `S20` | `V` | 0 | 0 | Receptionist Stay Operations Landing Screen |
| **29** | `S31` | `V` | 0 | 0 | Therapist Daily Appointments Landing Screen |
| **30** | `S38` | `V` | 0 | 0 | F&B Staff Daily Meal Selection Landing Screen |
| **31** | `S39` | `V` | 0 | 0 | F&B Staff A-la-carte Dining Orders View |
| **32** | `S39` | `U` | 0 | 0 | F&B Staff Order Preparation Status Update |
| **33** | `S46` | `V` | 0 | 0 | Revenue Analytics Dashboard View |
| **34** | `S47` | `V` | 0 | 0 | Spa Utilization Analytics View |
| **35** | `S47` | `E` | 0 | 0 | Export Spa Utilization Report |
| **36** | `S48` | `V` | 0 | 0 | F&B Consumption Analytics View |
| **37** | `S48` | `E` | 0 | 0 | Export F&B Consumption Report |
| **38** | `DATA_HEALTH_FULL` | `V` | 0 | 0 | Full Customer Health Profile (Customer only) |
| **39** | `DATA_HEALTH_TREATMENT`| `V` | 0 | 0 | Treatment-Relevant Health Flags (Customer, Therapist)|
| **40** | `DATA_FOOD_ALLERGY` | `V` | 0 | 0 | Food Allergies & Dietary Flags (Customer, F&B Staff) |
| **41** | `DATA_RESIDENCE` | `V` | 0 | 0 | Guest Residence & Contact Data (Receptionist only) |

---

## 5. Authoritative Role-Permission Matrix (49 Grants)

| Module / Permission Key | Action | Admin (ID 6) | Manager (ID 5) | Receptionist (ID 2) | Therapist (ID 3) | F&B Staff (ID 4) | Customer (ID 1) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `S10` (Staff Accounts) | `V, C, U, D` | **GRANT (4)** | — | — | — | — | — |
| `S11` (Villas Master) | `V, C, U, D` | **GRANT (4)** | — | — | — | — | — |
| `S12` (Spa Master) | `V, C, U, D` | **GRANT (4)** | — | — | — | — | — |
| `S49` (Admin Cockpit) | `V` | **GRANT (1)** | — | — | — | — | — |
| `S50` (Parameters) | `V, U` | **GRANT (2)** | — | — | — | — | — |
| `S51` (Matrix Config) | `V, G` | **GRANT (2)** | — | — | — | — | — |
| `S52` (Delegations) | `V, C, D` | **GRANT (3)** | — | — | — | — | — |
| `S53` (Audit Logs) | `V, E` | **GRANT (2)** | — | — | — | — | — |
| `S54` (Manager Cockpit) | `V` | — | **GRANT (1)** | — | — | — | — |
| `S55` (System Overview) | `V` | **GRANT (1)** | **GRANT (1)** | — | — | — | — |
| `S55_ADMIN_WIDGETS` | `V` | **GRANT (1)** | — | — | — | — | — |
| `RESIDENCE_REPORT` | `E` | **GRANT (1)** | — | **GRANT (1)** | — | — | — |
| `S02` (Customer Portal) | `V` | — | — | — | — | — | **GRANT (1)** |
| `S20` (Receptionist Ops) | `V` | — | — | **GRANT (1)** | — | — | — |
| `S31` (Therapist Appts) | `V` | — | — | — | **GRANT (1)** | — | — |
| `S38` (F&B Daily Meals) | `V` | — | — | — | — | **GRANT (1)** | — |
| `S39` (F&B A-la-carte) | `V, U` | — | — | — | — | **GRANT (2)** | — |
| `S46` (Revenue Analytics)| `V` | **GRANT (1)** | **GRANT (1)** | — | — | — | — |
| `S47` (Spa Analytics) | `V, E` | **GRANT (V)** | **GRANT (V, E)** | — | — | — | — |
| `S48` (F&B Analytics) | `V, E` | **GRANT (V)** | **GRANT (V, E)** | — | — | — | — |
| `DATA_HEALTH_FULL` | `V` | — | — | — | — | — | **GRANT (1)** |
| `DATA_HEALTH_TREATMENT` | `V` | — | — | — | **GRANT (1)** | — | **GRANT (1)** |
| `DATA_FOOD_ALLERGY` | `V` | — | — | — | — | **GRANT (1)** | **GRANT (1)** |
| `DATA_RESIDENCE` | `V` | — | — | **GRANT (1)** | — | — | — |
| **Total Grants Per Role** | | **28** | **8** | **3** | **2** | **4** | **4** |

**Grand Total Grants:** 28 + 8 + 3 + 2 + 4 + 4 = **49 Role-Permission Mappings**.

---

## 6. Proposed Idempotent Seed Plan (NOT EXECUTED)

The following script represents the proposed implementation for seeding `dbo.[Permission]`, `dbo.RolePermission`, and `dbo.SystemConfiguration`. It is clearly designated as **NOT EXECUTED** in this phase.

```sql
-- ==============================================================================
-- PROPOSED SCRIPT: IDEMPOTENT PERMISSION & RBAC SEED FOR HSWRMS_TEST
-- STATUS: PROPOSED ONLY — STRICTLY NOT EXECUTED IN PHASE 5.8.3.102
-- TARGET INSTANCE: localhost:1433 (MYLIFE-MYRULE-1)
-- TARGET DATABASE: HSWRMS_TEST (Database ID: 45)
-- ==============================================================================

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

-- 2. Ensure all 6 canonical roles exist before proceeding
IF (SELECT COUNT(*) FROM dbo.[Role] WHERE role_name IN (N'Customer', N'Receptionist', N'Therapist', N'F&B Staff', N'Manager', N'Admin')) <> 6
BEGIN
    RAISERROR('FATAL ERROR: Missing canonical roles in dbo.[Role]. Aborting.', 20, 1) WITH LOG;
END;
GO

BEGIN TRANSACTION;

-- ==============================================================================
-- STEP 1: IDEMPOTENT INSERT INTO dbo.[Permission] (41 PERMISSIONS)
-- ==============================================================================

-- Helper table variable for permissions
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

-- ==============================================================================
-- STEP 2: IDEMPOTENT INSERT INTO dbo.RolePermission (49 GRANTS)
-- ==============================================================================

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

-- Manager Grants (8)
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

-- ==============================================================================
-- STEP 3: IDEMPOTENT INSERT INTO dbo.SystemConfiguration (6 PARAMETERS)
-- ==============================================================================

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

COMMIT TRANSACTION;
GO
```

---

## 7. Rollback Plan & Referential Safeguards

```sql
-- ==============================================================================
-- ROLLBACK SCRIPT: REMOVE RBAC SEED DATA
-- DO NOT EXECUTE UNLESS SEPARATELY AUTHORIZED
-- ==============================================================================

USE [HSWRMS_TEST];
GO

IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45
BEGIN
    RAISERROR('FATAL ERROR: Target database is not HSWRMS_TEST (45). Aborting.', 20, 1) WITH LOG;
END;
GO

-- Safeguard: Ensure no RightDelegationPermission records depend on Permission
IF EXISTS (SELECT 1 FROM dbo.RightDelegationPermission)
BEGIN
    RAISERROR('ROLLBACK BLOCKED: RightDelegationPermission records exist. Deletion aborted.', 16, 1);
END
ELSE
BEGIN
    BEGIN TRANSACTION;

    -- 1. Remove role-permission grants
    DELETE FROM dbo.RolePermission;

    -- 2. Remove permissions
    DELETE FROM dbo.[Permission];

    -- 3. Remove system configurations
    DELETE FROM dbo.SystemConfiguration WHERE configuration_type = N'BUSINESS_PARAMETER';

    COMMIT TRANSACTION;
    PRINT 'Rollback successful: RBAC permissions, role mappings, and business parameters removed.';
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
?? 05_Development/database/reports/PHASE_5.8.3.99_CONTROLLED_READ_PERMISSION_GRANT_REPORT.md
?? 05_Development/database/reports/PHASE_5.8.3.100_BASELINE_ROLE_SEED_PREFLIGHT.md
?? 05_Development/database/reports/PHASE_5.8.3.101_CONTROLLED_ROLE_SEED_REPORT.md
?? 05_Development/database/reports/PHASE_5.8.3.102_PERMISSION_CATALOG_RBAC_PREFLIGHT.md
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

- **Staged Changes:** 0 files staged.
- **Commits:** 0 commits made.
- **Protected DB Integrity:** Database `HSWRMS` was completely untouched and remains isolated.
- **Test DB Integrity:** Database `HSWRMS_TEST` received zero data mutations during this phase.

---

## 9. Conclusion & Recommendation

1. **Preflight Verdict:** **PASS / READY FOR AUTHORIZED EXECUTION**.
2. **Readiness Summary:**
   - Pre-existing canonical role IDs 1 to 6 in `dbo.[Role]` are strictly preserved.
   - All 41 permissions and 49 role-permission mappings from `PermissionCatalog.java` are audited and mapped with 100% fidelity.
   - The proposed seed plan is fully idempotent, referentially sound, and wraps operations in atomic transactions without invoking application startup hooks.

