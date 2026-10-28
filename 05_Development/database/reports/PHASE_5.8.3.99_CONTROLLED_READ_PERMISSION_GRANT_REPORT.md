# PHASE 5.8.3.99 — CONTROLLED HSWRMS_TEST READ PERMISSION GRANT REPORT

**Phase:** 5.8.3.99  
**Module:** HSWRMS Database Security & Controlled Permission Execution  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Timestamp:** 2026-10-28 21:34:20 +07:00  
**Status:** COMPLETED — 100% PASS (db_datareader Granted & Verified; Zero Write/DDL Capabilities)

---

## 1. Executive Summary

In Phase 5.8.3.99, an authorized, strictly controlled permission modification was executed against the dedicated test database `HSWRMS_TEST` to grant read-only access to the test login `hswrms_test_user`.

Key Execution Highlights:
1. **Mandatory Administrative Preflight:**  
   Immediately prior to execution, all 7 preflight conditions were verified via an authorized administrative session (`MYLIFE-MYRULE-1\ADMIN`). Host, database name (`HSWRMS_TEST`), database ID (`45`), status (`ONLINE`), and principal SID mapping were confirmed. The protected database `HSWRMS` was confirmed absent from the target scope.
2. **Authorized Statement Executed:**  
   The single authorized statement:
   ```sql
   USE [HSWRMS_TEST];
   ALTER ROLE [db_datareader] ADD MEMBER [hswrms_test_user];
   ```
   was executed with fail-closed assertions. Zero other statements (DDL, DML, `GRANT`, `DENY`, `REVOKE`, seed inserts) were executed.
3. **Post-Execution Verification via Test Login:**  
   Connecting strictly as `hswrms_test_user` using credentials from Windows Credential Manager:
   - Target database is `HSWRMS_TEST` (Database ID 45).
   - Role membership `db_datareader` is active.
   - `SELECT COUNT(*)` succeeded on all required catalog tables without permission errors.
   - Metadata visibility is completely restored: `sys.tables` reports all **42 user tables**, 42 PKs, 56 FKs, 21 UQs, 49 check constraints, 67 default constraints, 3 triggers, and 77 indexes, matching the Phase 5.8.3.85 authoritative deployment baseline with 100% accuracy.
   - Anti-permissions verified: `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `db_datawriter`, `db_owner`, `db_ddladmin`, and `sysadmin` all returned **`0`**.
   - Primary database `HSWRMS` remains completely inaccessible (`HAS_DBACCESS('HSWRMS') = 0`).

---

## 2. Mandatory Preflight Evidence (Administrative Session)

The preflight check was executed via `sqlcmd -S localhost -d HSWRMS_TEST -E -b -W`:

```sql
SET NOCOUNT ON;
SELECT @@SERVERNAME AS [ServerName], DB_NAME() AS [DatabaseName], DB_ID() AS [DatabaseId], 
       CAST(DATABASEPROPERTYEX(DB_NAME(), 'Status') AS VARCHAR(20)) AS [Status], 
       SUSER_SNAME() AS [CurrentAdminLogin];

SELECT dp.name AS PrincipalName, dp.principal_id, dp.type_desc, dp.default_schema_name, 
       sl.name AS LoginName, sl.principal_id AS LoginPrincipalId, 
       CASE WHEN dp.sid = sl.sid THEN 'SID_MATCH' ELSE 'SID_MISMATCH' END AS SidValidation
FROM sys.database_principals dp
JOIN sys.sql_logins sl ON dp.sid = sl.sid
WHERE dp.name = 'hswrms_test_user';

SELECT ISNULL(r.name, 'NOT_A_MEMBER') AS DataReaderMembership
FROM sys.database_principals dp
LEFT JOIN sys.database_role_members drm ON dp.principal_id = drm.member_principal_id
LEFT JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id AND r.name = 'db_datareader'
WHERE dp.name = 'hswrms_test_user';
```

### Preflight Output

```text
ServerName       DatabaseName DatabaseId Status CurrentAdminLogin
----------       ------------ ---------- ------ -----------------
MYLIFE-MYRULE-1  HSWRMS_TEST  45         ONLINE MYLIFE-MYRULE-1\ADMIN

PrincipalName    principal_id type_desc default_schema_name LoginName        LoginPrincipalId SidValidation
-------------    ------------ --------- ------------------- ---------        ---------------- -------------
hswrms_test_user 5            SQL_USER  dbo                 hswrms_test_user 276              SID_MATCH

DataReaderMembership
--------------------
NOT_A_MEMBER
```

### Mapping Verification in Protected Database `HSWRMS`

```sql
SELECT dp.name AS PrincipalInHSWRMS
FROM sys.database_principals dp
WHERE dp.name = 'hswrms_test_user';
```
*Result:* **`0` rows returned.** `hswrms_test_user` has zero mapping in `HSWRMS`.

### Precondition Evaluation Checklist

| Precondition # | Requirement | Verified State | Status |
|:---:|---|---|:---:|
| **1** | SQL Server instance is `MYLIFE-MYRULE-1` | `MYLIFE-MYRULE-1` | **PASS** |
| **2** | `HSWRMS_TEST` is `ONLINE` and has database ID `45` | Status: `ONLINE`, ID: `45` | **PASS** |
| **3** | `hswrms_test_user` maps to intended login SID | `SID_MATCH`, Principal ID 5, Login ID 276 | **PASS** |
| **4** | Target principal is not already a member of `db_datareader` | `NOT_A_MEMBER` | **PASS** |
| **5** | Protected database `HSWRMS` is not the execution database | Execution strictly in `HSWRMS_TEST` | **PASS** |
| **6** | Exact SQL statement targets only `HSWRMS_TEST` and `hswrms_test_user` | Scoped via explicit `USE [HSWRMS_TEST]` | **PASS** |
| **7** | No unexpected pending changes in permission script | Single atomic role membership modification | **PASS** |

---

## 3. Exact Executed SQL Statement

Executed via authorized administrative session against `localhost:1433`:

```sql
USE [HSWRMS_TEST];
GO

IF DB_NAME() <> 'HSWRMS_TEST' OR DB_ID() <> 45
BEGIN
    RAISERROR('Safety violation: Not in HSWRMS_TEST (45). Aborting.', 20, 1) WITH LOG;
END;
GO

ALTER ROLE [db_datareader] ADD MEMBER [hswrms_test_user];
GO

SELECT 
    dp.name AS PrincipalName, 
    r.name AS RoleName, 
    'SUCCESS_GRANTED' AS GrantStatus
FROM sys.database_role_members drm
JOIN sys.database_principals dp ON drm.member_principal_id = dp.principal_id
JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
WHERE dp.name = 'hswrms_test_user' AND r.name = 'db_datareader';
GO
```

### Direct Execution Result

```text
PrincipalName     RoleName       GrantStatus
-------------     --------       -----------
hswrms_test_user  db_datareader  SUCCESS_GRANTED
```

---

## 4. Post-Execution Verification (via Test Login `hswrms_test_user`)

All verification queries were executed using `hswrms_test_user` credentials securely retrieved from Windows Credential Manager target `HSWRMS_TEST_SQLSERVER` without secret leakage.

### 4.1 Connection Target and Identity Check

```sql
SELECT @@SERVERNAME AS [ServerName], DB_NAME() AS [DatabaseName], DB_ID() AS [DatabaseId], 
       SUSER_SNAME() AS [LoginName], CURRENT_USER AS [DatabaseUser];
```

| Output Column | Actual Value | Verification |
|---|---|---|
| `ServerName` | `MYLIFE-MYRULE-1` | Matches expected instance |
| `DatabaseName` | `HSWRMS_TEST` | Matches dedicated test database |
| `DatabaseId` | `45` | Confirms ID 45 |
| `LoginName` | `hswrms_test_user` | Confirms test login |
| `DatabaseUser` | `hswrms_test_user` | Confirms test database user |

---

### 4.2 Role Membership Verification

```sql
SELECT dp.name AS PrincipalName, r.name AS RoleName 
FROM sys.database_role_members drm 
JOIN sys.database_principals dp ON drm.member_principal_id = dp.principal_id 
JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id 
WHERE dp.name = 'hswrms_test_user';
```

| Principal Name | Role Name | Status |
|---|---|---|
| `hswrms_test_user` | `db_datareader` | **ACTIVE / VERIFIED** |

---

### 4.3 Catalog Table `SELECT COUNT(*)` Verification

Queries were executed on all required catalog tables across Modules 1 through 6:

```sql
SELECT 
    (SELECT COUNT(*) FROM dbo.[SpaTreatment]) AS [SpaTreatment_Rows],
    (SELECT COUNT(*) FROM dbo.[RetreatPackage]) AS [RetreatPackage_Rows],
    (SELECT COUNT(*) FROM dbo.[VillaCategory]) AS [VillaCategory_Rows],
    (SELECT COUNT(*) FROM dbo.[PhysicalVilla]) AS [PhysicalVilla_Rows],
    (SELECT COUNT(*) FROM dbo.[RetreatPackageVillaCategory]) AS [RetreatPackageVillaCategory_Rows],
    (SELECT COUNT(*) FROM dbo.[RetreatPackageSpaTreatment]) AS [RetreatPackageSpaTreatment_Rows],
    (SELECT COUNT(*) FROM dbo.[MenuItem]) AS [MenuItem_Rows],
    (SELECT COUNT(*) FROM dbo.[MenuItemIngredient]) AS [MenuItemIngredient_Rows],
    (SELECT COUNT(*) FROM dbo.[Ingredient]) AS [Ingredient_Rows],
    (SELECT COUNT(*) FROM dbo.[Role]) AS [Role_Rows],
    (SELECT COUNT(*) FROM dbo.[Permission]) AS [Permission_Rows],
    (SELECT COUNT(*) FROM dbo.[RolePermission]) AS [RolePermission_Rows],
    (SELECT COUNT(*) FROM dbo.[SystemConfiguration]) AS [SystemConfiguration_Rows];
```

| Table Tested | Operation | Prior Result (Phase 5.8.3.97) | Post-Grant Result | Status |
|---|:---:|:---:|:---:|:---:|
| `dbo.[SpaTreatment]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[RetreatPackage]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[VillaCategory]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[PhysicalVilla]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[RetreatPackageVillaCategory]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[RetreatPackageSpaTreatment]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[MenuItem]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[MenuItemIngredient]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[Ingredient]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[Role]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[Permission]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[RolePermission]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |
| `dbo.[SystemConfiguration]` | `SELECT COUNT(*)` | SqlException 229 (Denied) | `0` rows | **PASS** |

---

### 4.4 Catalog Metadata Visibility Verification

```sql
SELECT 
    (SELECT COUNT(*) FROM sys.tables) AS [UserTables],
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') AS [InfoSchemaTables],
    (SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'PK') AS [PK_Count],
    (SELECT COUNT(*) FROM sys.foreign_keys) AS [FK_Count],
    (SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'UQ') AS [UQ_Count],
    (SELECT COUNT(*) FROM sys.check_constraints) AS [CK_Count],
    (SELECT COUNT(*) FROM sys.default_constraints) AS [DF_Count],
    (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1) AS [Trigger_Count],
    (SELECT COUNT(*) FROM sys.indexes WHERE object_id IN (SELECT object_id FROM sys.tables)) AS [Total_Indexes];
```

| Catalog Metric | Phase 5.8.3.85 Authoritative Baseline | Phase 5.8.3.97 (CONNECT Only) | Phase 5.8.3.99 (`db_datareader`) | Baseline Match? |
|---|:---:|:---:|:---:|:---:|
| **User Tables** (`sys.tables`) | **42** | 0 | **42** | **EXACT MATCH** |
| **Info Schema Tables** | **42** | 0 | **42** | **EXACT MATCH** |
| **Primary Keys** (`PK`) | **42** | 0 | **42** | **EXACT MATCH** |
| **Foreign Keys** (`FK`) | **56** | 0 | **56** | **EXACT MATCH** |
| **Unique Constraints** (`UQ`) | **21** | 0 | **21** | **EXACT MATCH** |
| **Check Constraints** (`CK`) | **49** | 0 | **49** | **EXACT MATCH** |
| **Default Constraints** (`DF`) | **67** | 0 | **67** | **EXACT MATCH** |
| **DML Triggers** | **3** | 0 | **3** | **EXACT MATCH** |
| **Total `sys.indexes`** | **77** | 0 | **77** | **EXACT MATCH** |

---

### 4.5 Anti-Permissions Verification (Zero Writes / Zero DDL / Zero Ownership)

```sql
SELECT 
    HAS_PERMS_BY_NAME('dbo.Role', 'OBJECT', 'SELECT') AS [CanSelectRole],
    HAS_PERMS_BY_NAME('dbo.Role', 'OBJECT', 'INSERT') AS [CanInsertRole],
    HAS_PERMS_BY_NAME('dbo.Role', 'OBJECT', 'UPDATE') AS [CanUpdateRole],
    HAS_PERMS_BY_NAME('dbo.Role', 'OBJECT', 'DELETE') AS [CanDeleteRole],
    HAS_PERMS_BY_NAME('HSWRMS_TEST', 'DATABASE', 'ALTER') AS [CanAlterDatabase],
    IS_ROLEMEMBER('db_datawriter', 'hswrms_test_user') AS [IsDataWriter],
    IS_ROLEMEMBER('db_owner', 'hswrms_test_user') AS [IsDbOwner],
    IS_ROLEMEMBER('db_ddladmin', 'hswrms_test_user') AS [IsDdlAdmin],
    IS_SRVROLEMEMBER('sysadmin', 'hswrms_test_user') AS [IsSysAdmin];
```

| Security Check | Expected Value | Actual Value | Invariant Status |
|---|:---:|:---:|:---:|
| `CanSelectRole` | `1` | `1` | **PASS (Read Allowed)** |
| `CanInsertRole` | `0` | `0` | **PASS (Write Prohibited)** |
| `CanUpdateRole` | `0` | `0` | **PASS (Write Prohibited)** |
| `CanDeleteRole` | `0` | `0` | **PASS (Write Prohibited)** |
| `CanAlterDatabase` | `0` | `0` | **PASS (DDL Prohibited)** |
| `IsDataWriter` | `0` | `0` | **PASS (Zero db_datawriter)** |
| `IsDbOwner` | `0` | `0` | **PASS (Zero db_owner)** |
| `IsDdlAdmin` | `0` | `0` | **PASS (Zero db_ddladmin)** |
| `IsSysAdmin` | `0` | `0` | **PASS (Zero server admin)** |

---

### 4.6 Protected Database Access Check

```sql
SELECT 
    HAS_DBACCESS('HSWRMS_TEST') AS [Access_HSWRMS_TEST],
    HAS_DBACCESS('HSWRMS') AS [Access_HSWRMS_Protected];
```

| Database | Expected | Actual | Invariant Status |
|---|:---:|:---:|:---:|
| `HSWRMS_TEST` | `1` | `1` | Operational |
| `HSWRMS` | `0` | `0` | **STRICTLY PROTECTED / ZERO ACCESS** |

---

## 5. Rollback Statement

If read permissions must be revoked at any point, the exact rollback script is:

```sql
-- ==============================================================================
-- ROLLBACK SCRIPT: REMOVE READ ACCESS FROM TEST LOGIN
-- DO NOT EXECUTE UNLESS SEPARATELY AUTHORIZED
-- ==============================================================================
USE [HSWRMS_TEST];
GO

IF DB_NAME() = 'HSWRMS_TEST'
BEGIN
    ALTER ROLE [db_datareader] DROP MEMBER [hswrms_test_user];
    PRINT 'Rollback successful: hswrms_test_user removed from db_datareader.';
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
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
```

- **Staged Changes:** 0 files staged.
- **Commits:** 0 commits made.
- **Protected DB Integrity:** Database `HSWRMS` was completely untouched and remains isolated.
- **Test DB Integrity:** Database `HSWRMS_TEST` received strictly the `ALTER ROLE` modification; zero schema alterations or table row mutations occurred.

---

## 7. Conclusion & Next Phase Readiness

The read permission grant on `HSWRMS_TEST` is complete, verified, and secure:
1. `hswrms_test_user` can now perform read-only queries (`SELECT`) across all 42 tables in `HSWRMS_TEST`.
2. All catalog metadata visibility is 100% restored.
3. Write access, DDL access, and ownership remain strictly blocked.
4. The test environment is now fully prepared for **read-only endpoint integration tests** (e.g. public package catalog, spa treatment catalog, F&B menu catalog) against `HSWRMS_TEST`.

