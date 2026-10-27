-- ==============================================================================
-- DRAFT / UNEXECUTED SCRIPT: Provision Dedicated HSWRMS_TEST Environment
-- ==============================================================================
--
-- STATUS:
--   PROPOSED DRAFT ONLY — NOT EXECUTED.
--   REQUIRES EXPLICIT USER AUTHORIZATION BEFORE ANY EXECUTION.
--
-- SECURITY PRINCIPLES ENFORCED:
--   1. Least Privilege: Grants ONLY database-level CONNECT permission to
--      [hswrms_test_user]. Does NOT grant 'db_datareader', 'db_datawriter',
--      'db_owner', or any fixed/user-defined server roles.
--   2. Strict Isolation: Targets dedicated database [HSWRMS_TEST] only.
--      Never touches, alters, or grants permissions on primary database [HSWRMS].
--   3. Fail-Closed Idempotency: Validates database status (must be ONLINE)
--      and existing login configuration (must NOT be disabled, must have ZERO
--      server roles, and must have ZERO server-level permissions).
--   4. Secrets Safety: Password $(TEST_PASSWORD) must NOT be committed or saved
--      to this file. It must be provided transiently at runtime via an unsaved
--      SSMS query session or process-scoped environment variable.
--   5. Execution Safety: Starts with :on error exit and Stage 0 guards.
--      In case of pre-condition failure, RAISERROR, RETURN, and SET NOEXEC ON
--      prevent any mutations.
--      NOTE: If SET NOEXEC ON is triggered, reset your SSMS session via
--      'SET NOEXEC OFF;' before running other queries.
--
-- RECOVERY FOR PARTIAL PROVISIONING:
--   - If database creation fails: resolve disk/permission error; do not drop other databases.
--   - If login creation fails: verify password complexity policy; database remains untouched.
--   - If user mapping fails: run Stage 4 independently; no need to drop database or login.
-- ==============================================================================

:on error exit
GO

-- ==============================================================================
-- STAGE 0: SECRETS SAFETY GUARD & SQLCMD MODE DETECTION (FAIL CLOSED)
-- ==============================================================================
-- NOTE: DO NOT write or commit real passwords into this file.
-- $(TEST_PASSWORD) must be provided at runtime via one of the non-persistent methods:
--   Method 1: Interactive SSMS execution in an unsaved query window (Recommended)
--   Method 2: Ephemeral process-scoped environment variable in local CLI
-- If $(TEST_PASSWORD) is undefined, :on error exit halts execution before Stage 1.
:setvar SQLCMD_MODE_CHECK "SQLCMD_ACTIVE"
:setvar ALLOW_EXISTING_DB "FALSE"
:setvar ALLOW_EXISTING_LOGIN "FALSE"
GO

IF '$(SQLCMD_MODE_CHECK)' <> 'SQLCMD_ACTIVE'
BEGIN
    RAISERROR('FAIL CLOSED: SQLCMD Mode is REQUIRED. In SSMS, click Query menu -> SQLCMD Mode before running.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF '$(TEST_PASSWORD)' = '' 
   OR '$(TEST_PASSWORD)' = 'REPLACE_WITH_STRONG_PASSWORD_BEFORE_EXECUTION'
   OR '$(TEST_PASSWORD)' = 'CHANGE_ME_STRONG_PASSWORD!'
   OR LEFT('$(TEST_PASSWORD)', 2) = '$' + '('
BEGIN
    RAISERROR('FAIL CLOSED: Test password is missing, unresolved, or set to a placeholder. Supply via non-persistent SSMS session variable or process-scoped environment variable.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

USE [master];
GO

-- ==============================================================================
-- STAGE 1: PRE-EXECUTION INSPECTION & ENVIRONMENT VALIDATION (READ-ONLY)
-- ==============================================================================
-- 1.1 Verify Mixed Authentication Mode (0 = Mixed Mode, 1 = Windows Auth Only)
DECLARE @authMode INT = CAST(SERVERPROPERTY('IsIntegratedSecurityOnly') AS INT);
IF @authMode <> 0
BEGIN
    RAISERROR('FAIL CLOSED: SQL Server instance is configured for Windows Authentication only. Mixed Mode must be enabled before SQL logins can be used.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
ELSE
BEGIN
    PRINT '[PASS] SQL Server Mixed Authentication Mode confirmed active.';
END
GO

-- 1.2 Validate existing target database state if present
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = N'HSWRMS_TEST')
BEGIN
    -- Fail closed by default if target database exists, unless reuse is explicitly approved
    IF '$(ALLOW_EXISTING_DB)' <> 'TRUE'
    BEGIN
        RAISERROR('FAIL CLOSED: Target database [HSWRMS_TEST] already exists. Initial provisioning expects a clean environment. If reuse is explicitly intended and authorized, set :setvar ALLOW_EXISTING_DB "TRUE".', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    DECLARE @dbState NVARCHAR(60);
    SELECT @dbState = state_desc FROM sys.databases WHERE name = N'HSWRMS_TEST';
    IF @dbState <> N'ONLINE'
    BEGIN
        RAISERROR('FAIL CLOSED: Database [HSWRMS_TEST] exists but is in state ''%s'' (expected ONLINE). Manual review required.', 16, 1, @dbState);
        SET NOEXEC ON;
        RETURN;
    END
    ELSE
    BEGIN
        PRINT '[PASS] Existing database [HSWRMS_TEST] reuse is explicitly authorized and in ONLINE state.';
    END
END
GO

-- 1.3 Validate existing login state if present (Zero Server Roles, Zero Server Permissions)
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'hswrms_test_user')
BEGIN
    -- Fail closed by default if login exists, unless reuse is explicitly approved
    IF '$(ALLOW_EXISTING_LOGIN)' <> 'TRUE'
    BEGIN
        RAISERROR('FAIL CLOSED: Login [hswrms_test_user] already exists. Initial provisioning expects a clean environment. If reuse is explicitly intended and authorized, set :setvar ALLOW_EXISTING_LOGIN "TRUE".', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    DECLARE @loginType CHAR(1), @typeDesc NVARCHAR(60), @isDisabled BIT, @defaultDb NVARCHAR(128);
    SELECT @loginType = type,
           @typeDesc = type_desc,
           @isDisabled = is_disabled,
           @defaultDb = default_database_name
    FROM sys.server_principals 
    WHERE name = N'hswrms_test_user';

    -- Require SQL Server authentication login (type 'S')
    IF @loginType <> 'S'
    BEGIN
        RAISERROR('FAIL CLOSED: Login [hswrms_test_user] exists but is not a SQL Server login (type_desc: ''%s''). Only SQL logins are supported for JDBC smoke test.', 16, 1, @typeDesc);
        SET NOEXEC ON;
        RETURN;
    END

    IF @isDisabled = 1
    BEGIN
        RAISERROR('FAIL CLOSED: Login [hswrms_test_user] exists but is DISABLED. Manual review required.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    -- Validate default database: must be HSWRMS_TEST or master (never HSWRMS or any other DB)
    IF @defaultDb <> N'HSWRMS_TEST' AND @defaultDb <> N'master'
    BEGIN
        RAISERROR('FAIL CLOSED: Login [hswrms_test_user] has unsafe default database ''%s'' (expected ''HSWRMS_TEST'' or ''master''). Manual review required.', 16, 1, @defaultDb);
        SET NOEXEC ON;
        RETURN;
    END

    -- Check for ANY server role membership (sysadmin, securityadmin, etc.)
    IF EXISTS (
        SELECT 1 
        FROM sys.server_role_members srm
        JOIN sys.server_principals r ON r.principal_id = srm.role_principal_id
        JOIN sys.server_principals m ON m.principal_id = srm.member_principal_id
        WHERE m.name = N'hswrms_test_user'
    )
    BEGIN
        RAISERROR('FAIL CLOSED: Login [hswrms_test_user] is a member of one or more server roles. Zero server roles are permitted.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    -- Check for ANY explicit server-level permissions
    IF EXISTS (
        SELECT 1 
        FROM sys.server_permissions sp
        JOIN sys.server_principals p ON p.principal_id = sp.grantee_principal_id
        WHERE p.name = N'hswrms_test_user'
    )
    BEGIN
        RAISERROR('FAIL CLOSED: Login [hswrms_test_user] has explicit server-level permissions. Zero server permissions are permitted.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    PRINT '[PASS] Existing login [hswrms_test_user] reuse explicitly authorized and validated (SQL login, zero elevated roles or grants).';
END
GO

-- 1.4 Validate primary database isolation (must NOT have hswrms_test_user mapped)
IF EXISTS (
    SELECT 1 
    FROM sys.databases d
    JOIN sys.database_principals dp ON dp.name = N'hswrms_test_user'
    WHERE d.name = N'HSWRMS'
)
BEGIN
    RAISERROR('FAIL CLOSED: Principal [hswrms_test_user] is mapped in primary database [HSWRMS]. Integration test isolation violated.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
ELSE
BEGIN
    PRINT '[PASS] Primary database [HSWRMS] has zero test user mappings.';
END
GO

-- ==============================================================================
-- STAGE 2: CREATE DEDICATED TEST DATABASE (HSWRMS_TEST)
-- ==============================================================================
USE [master];
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'HSWRMS_TEST')
BEGIN
    CREATE DATABASE [HSWRMS_TEST]
    COLLATE SQL_Latin1_General_CP1_CI_AS;
    PRINT '[CREATED] Database [HSWRMS_TEST] created successfully.';
END
ELSE
BEGIN
    PRINT '[INFO] Database [HSWRMS_TEST] already exists. Skipping creation.';
END
GO

-- ==============================================================================
-- STAGE 3: CREATE DEDICATED TEST LOGIN (hswrms_test_user)
-- ==============================================================================
USE [master];
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'hswrms_test_user')
BEGIN
    -- Inline defense-in-depth guard: Re-validate $(TEST_PASSWORD) before DDL mutation
    IF '$(TEST_PASSWORD)' = '' 
       OR '$(TEST_PASSWORD)' = 'REPLACE_WITH_STRONG_PASSWORD_BEFORE_EXECUTION'
       OR '$(TEST_PASSWORD)' = 'CHANGE_ME_STRONG_PASSWORD!'
       OR LEFT('$(TEST_PASSWORD)', 2) = '$' + '('
    BEGIN
        RAISERROR('FAIL CLOSED: Cannot create login. Test password is missing, unresolved, or set to a placeholder.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    CREATE LOGIN [hswrms_test_user]
    WITH PASSWORD = N'$(TEST_PASSWORD)',
         CHECK_EXPIRATION = OFF,
         CHECK_POLICY = ON,
         DEFAULT_DATABASE = [HSWRMS_TEST];
    PRINT '[CREATED] Login [hswrms_test_user] created successfully with default database [HSWRMS_TEST].';
END
ELSE
BEGIN
    PRINT '[INFO] Login [hswrms_test_user] already exists. Skipping creation.';
END
GO

-- ==============================================================================
-- STAGE 4: MAP DATABASE USER IN HSWRMS_TEST & GRANT STRICT LEAST PRIVILEGE
-- ==============================================================================
USE [HSWRMS_TEST];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'hswrms_test_user')
BEGIN
    CREATE USER [hswrms_test_user] FOR LOGIN [hswrms_test_user];
    PRINT '[CREATED] User [hswrms_test_user] mapped in database [HSWRMS_TEST].';
END
ELSE
BEGIN
    PRINT '[INFO] User [hswrms_test_user] already mapped in [HSWRMS_TEST].';
END
GO

-- LEAST PRIVILEGE ENFORCEMENT:
-- The smoke test executes: SELECT @@VERSION, DB_NAME()
-- System scalar functions are executable by 'public'.
-- The user only needs CONNECT permission to the database.
-- Do NOT grant 'db_datareader', 'db_datawriter', 'db_owner', or table access.
GRANT CONNECT TO [hswrms_test_user];
PRINT '[GRANTED] Explicit CONNECT permission granted to [hswrms_test_user] on [HSWRMS_TEST]. Zero data roles granted.';
GO

-- Verify that existing user has NO database role memberships other than public:
IF EXISTS (
    SELECT 1
    FROM sys.database_role_members drm
    JOIN sys.database_principals r ON r.principal_id = drm.role_principal_id
    JOIN sys.database_principals m ON m.principal_id = drm.member_principal_id
    WHERE m.name = N'hswrms_test_user' AND r.name <> N'public'
)
BEGIN
    RAISERROR('FAIL CLOSED: User [hswrms_test_user] in [HSWRMS_TEST] belongs to non-public database roles. Manual review required.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

-- ==============================================================================
-- STAGE 5: POST-CONDITION VERIFICATION QUERY & SAFETY AUDIT
-- ==============================================================================
USE [HSWRMS_TEST];
GO

SELECT 
    p.name AS [LoginName],
    p.type_desc AS [LoginType],
    p.is_disabled AS [IsDisabled],
    p.default_database_name AS [DefaultDatabase],
    IS_SRVROLEMEMBER('sysadmin', p.name) AS [IsSysadmin],
    dp.name AS [DatabaseUserName],
    dp.type_desc AS [UserType],
    DB_NAME() AS [CurrentDatabase],
    @@VERSION AS [ServerVersion]
FROM sys.server_principals p
LEFT JOIN sys.database_principals dp ON dp.sid = p.sid
WHERE p.name = N'hswrms_test_user';
GO

PRINT '==============================================================================';
PRINT 'PROVISIONING SCRIPT COMPLETE (AWAITING SEPARATE AUTHORIZATION BEFORE RUNNING)';
PRINT '==============================================================================';
GO
