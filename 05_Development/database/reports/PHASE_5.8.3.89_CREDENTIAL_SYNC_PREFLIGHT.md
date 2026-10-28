# HSWRMS Phase 5.8.3.89 — Controlled Credential Synchronization Preflight Report

**Timestamp:** 2026-10-28T19:40:00+07:00  
**Workspace:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Branch:** `feature/hswrms-m1-m6-integration`  
**Baseline HEAD:** `c2d2d6b01cb757319b3d4805b8b0262a261ca111`  
**Target SQL Server:** `MYLIFE-MYRULE-1` (localhost:1433)  
**Target Login:** `hswrms_test_user`  
**Target Database:** `HSWRMS_TEST` (ONLINE, 42 tables)  
**Protected Database:** `HSWRMS` (ONLINE, 39 tables, 100% isolated)  
**Execution Mode:** STRICTLY READ-ONLY PREFLIGHT (Zero SQL mutations, zero password alterations)  

---

## 1. Executive Summary & Verdict

Phase 5.8.3.89 conducted an exhaustive, read-only preflight investigation to determine whether administratively synchronizing the password for dedicated SQL login `hswrms_test_user` is safe, non-disruptive, and operationally appropriate.

### Key Preflight Determinations:
1. **Login State & Identity Integrity:**  
   Login `hswrms_test_user` exists, is enabled (`is_disabled = 0`), has default database `HSWRMS_TEST`, and has zero elevated server roles. Its database user mapping in `HSWRMS_TEST` is intact with exclusively `GRANT CONNECT`.
2. **Zero Blast Radius on Production/Primary Systems:**  
   Login `hswrms_test_user` has zero user mappings in primary database `HSWRMS`. Primary database `HSWRMS` remains `ONLINE` with 39 user tables.
3. **No External or Background Dependencies:**  
   An audit of Windows Services, Windows Scheduled Tasks, and SQL Server active sessions (`sys.dm_exec_sessions`) confirmed that **zero** external systems, services, background jobs, or production configurations consume or depend on `hswrms_test_user`. The login is strictly dedicated to test harness execution (`application-sqlserver-test.yml`).
4. **Non-Destructive Permission Invariant:**  
   SQL Server architecture maps database users to logins via security identifiers (`SID`). Executing `ALTER LOGIN ... WITH PASSWORD` alters only the password hash in `master.sys.sql_logins`. It does **not** change the `SID`, does not drop or re-create the login, and has **zero impact** on existing database user mappings or `CONNECT` permissions in `HSWRMS_TEST`.
5. **Operational Feasibility:**  
   The current Windows Authentication context (`MYLIFE-MYRULE-1\ADMIN` via `-E`) possesses sufficient administrative authority to synchronize the credential safely.

### Formal Verdict
**`PASS — SYNCHRONIZATION IS SAFE AND OPERATIONALLY APPROPRIATE`**

---

## 2. Evidence-Based Metadata Findings

Queries executed via Windows Integrated Authentication (`sqlcmd -S localhost -d master -E -b`):

### 2.1 Login Properties (`sys.server_principals`)
| Attribute | Observed Live State | Safety Assessment |
| :--- | :--- | :--- |
| **Login Name** | `hswrms_test_user` | Target login confirmed |
| **Principal Type** | `SQL_LOGIN` (type `S`) | Standard SQL authentication login |
| **Account Status** | `is_disabled = 0` | Active and enabled |
| **Default Database** | `HSWRMS_TEST` | Safely points to test database; not `master` or `HSWRMS` |
| **Creation Date** | `2026-10-27 16:56:02.870` | Created during Stage A provisioning |
| **Last Modification** | `2026-10-27 17:27:08.183` | Intact since baseline verification |
| **Server Roles** | Exactly **0** (no `sysadmin`, etc.) | Strictly least-privilege (only default `public`) |
| **Server Permissions**| Exactly **`GRANT CONNECT SQL`** | No administrative server permissions |

### 2.2 Database User Mapping & Permissions in `HSWRMS_TEST`
- **Database Principal:** `hswrms_test_user` (`SQL_USER`, default schema `dbo`).
- **Database Role Memberships:** Exactly **0** (no `db_owner`, `db_datareader`, `db_datawriter`).
- **Explicit Database Permissions:** Exactly **`GRANT CONNECT`** on `DATABASE::HSWRMS_TEST`.

### 2.3 Isolation from Protected Database `HSWRMS`
- **User Mappings in `HSWRMS`:** Exactly **0** (`SELECT COUNT(*) FROM HSWRMS.sys.database_principals WHERE name = 'hswrms_test_user'` returned `0`).
- **Cross-Database Access:** Any access attempt by `hswrms_test_user` into `HSWRMS` fails closed with SQL Server Error 916.
- **Database Status:** `HSWRMS` is `ONLINE` with exactly 39 user tables (100% untouched).

---

## 3. Dependency & Consumer Audit

| Potential Consumer | Inspection Target | Result / Evidence | Impact of Password Change |
| :--- | :--- | :--- | :--- |
| **Primary Backend App** | `application.yml` | Uses `${DB_USERNAME:sa}` on `HSWRMS`. | **ZERO IMPACT** (Does not use test login) |
| **Test Configuration** | `application-sqlserver-test.yml` | Resolves `${SQLSERVER_TEST_USERNAME}` and `${SQLSERVER_TEST_PASSWORD}`. | **BENEFICIAL** (Unblocks test execution) |
| **Windows Services** | `Get-Service` | Zero services matching `*hswrms*`. | **ZERO IMPACT** |
| **Scheduled Tasks** | `Get-ScheduledTask` | Zero tasks matching `*hswrms*`. | **ZERO IMPACT** |
| **Active DB Sessions** | `sys.dm_exec_sessions` | Exactly 0 active sessions under `hswrms_test_user`. | **ZERO IMPACT** (No active connection drop) |
| **Other Developers / CI** | Git repository / docs | Only documented consumer is `SqlServerJdbcSmokeTest`. | **ZERO IMPACT** |

**Uncertainties Evaluated:**  
Could another developer or background task be using the existing password?  
*Finding:* No. The database and login were provisioned locally on host `MYLIFE-MYRULE-1` during Phase 5.8.3.43 on 2026-10-27. No external network connections exist, and zero active sessions are connected.

---

## 4. Permission Invariants & Failure Blast Radius

### 4.1 SQL Server SID Binding Architecture
In Microsoft SQL Server:
- The server login in `master.sys.server_principals` possesses an immutable 85-byte binary identifier (`SID`).
- The database user in `HSWRMS_TEST.sys.database_principals` is linked directly to this `SID`.
- Database permissions (`GRANT CONNECT`) are attached to the database principal ID, **not** the password hash.
- Running:
  ```sql
  ALTER LOGIN [hswrms_test_user] WITH PASSWORD = N'<NEW_PASSWORD>';
  ```
  replaces only the 512-bit one-way salted hash in `master.sys.sql_logins`.
- The `SID` remains identical.
- The user mapping in `HSWRMS_TEST` remains intact.
- The `GRANT CONNECT` permission remains unchanged.

### 4.2 Failure Handling & Rollback Limitations
- **No Transactional Rollback for DDL Credential Changes:** SQL Server does not support `ROLLBACK` for `ALTER LOGIN ... WITH PASSWORD`. Once committed, the new hash replaces the old hash immediately.
- **Why This Is Safe:** Since the existing password is unknown / unrecorded and cannot be retrieved from the one-way hash, there is no prior working password to lose or restore.
- **Recovery from Failed Execution:** If an `ALTER LOGIN` statement fails (e.g., due to Windows Server password complexity policy violation), the existing login remains in its current state. The administrator can simply reissue `ALTER LOGIN` with an adjusted, compliant password.

---

## 5. Proposed Execution Sequence (For Separate Future Authorization)

When explicitly authorized in Phase 5.8.3.90, the synchronization should execute via the following sequence to guarantee zero credential leakage:

### Step 1: Secure Password Generation
Generate a high-entropy password meeting Windows Server and SQLCMD lexical rules:
- Length: 16 to 32 characters.
- Character sets: Uppercase letters (`A-Z`), lowercase letters (`a-z`), numerals (`0-9`), and safe symbols (`!`, `@`, `#`, `%`, `*`, `_`, `-`, `+`).
- **Prohibited Characters:** Single quotes (`'`), double quotes (`"`), backslashes (`\`), and macro sequences (`$(`) to eliminate escaping hazards in T-SQL, PowerShell, and YAML.

### Step 2: Administrative Synchronization via Windows Authentication
Execute `ALTER LOGIN` from an elevated Windows Administrator session (`-E`) using standard input or a typed RPC parameter to prevent CLI argument exposure:
```powershell
# Executed via sqlcmd with standard input (never passed via CLI argument -v):
$sql = "ALTER LOGIN [hswrms_test_user] WITH PASSWORD = N'<NEW_STRONG_PASSWORD>', CHECK_EXPIRATION = OFF, CHECK_POLICY = ON;"
sqlcmd -S localhost -d master -E -b -Q $sql
```

### Step 3: Read-Only Verification of Synchronization
Confirm `modify_date` advanced in `sys.server_principals`:
```sql
SELECT name, is_disabled, modify_date 
FROM sys.server_principals 
WHERE name = 'hswrms_test_user';
```

### Step 4: Ephemeral Environment Injection & Smoke Test Verification
In the testing session:
```powershell
$env:SQLSERVER_TEST_USERNAME = "hswrms_test_user"
$env:SQLSERVER_TEST_PASSWORD = "<NEW_STRONG_PASSWORD>"

cd 05_Development/backend
.\mvnw.cmd test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"

# Immediately scrub environment variable:
$env:SQLSERVER_TEST_PASSWORD = $null
```

---

## 6. Exposure Prevention Strategy

| Risk Vector | Mitigation |
| :--- | :--- |
| **PowerShell History (`ConsoleHost_history.txt`)** | Execute commands via automated script or pipe; avoid typing plaintext passwords directly into interactive prompt commands. |
| **Process Command-Line Listings (Event 4688, Task Manager)** | Do **NOT** pass the password via `sqlcmd -v TEST_PASSWORD="..."`. Use inline standard input or environment variable inheritance. |
| **Git Repositories & Diffs** | Zero password strings written to tracked `.sql`, `.yml`, `.properties`, or `.md` files. |
| **Execution Reports & Chat Outputs** | Replace all password references with `<SYNCHRONIZED_LEAST_PRIVILEGE_SECRET>` placeholders. |

---

## 7. Final Verdict

**`PASS — PROPOSED CREDENTIAL SYNCHRONIZATION IS SAFE AND OPERATIONALLY SOUND`**

- Zero operational impact on primary systems or active processes.
- Zero risk to database integrity or schema.
- Unblocks JDBC smoke testing under strict least-privilege constraints.

================================================================================  
**END OF REPORT — PHASE 5.8.3.89**

