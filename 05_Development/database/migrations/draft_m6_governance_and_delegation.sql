/* ============================================================================
   HSWRMS DRAFT UNNUMBERED MIGRATION
   File: draft_m6_governance_and_delegation.sql
   Target DBMS: Microsoft SQL Server 2019+ / Azure SQL
   Database: [HSWRMS]

   STATUS: DRAFT (UNNUMBERED)
   Reason for unnumbered status:
     Module 4 (F&B / Kitchen Management) has not yet been integrated into
     the mainline schema sequence. To prevent migration numbering conflicts
     and reordering issues, this script is maintained as a draft unnumbered
     migration. It will receive a permanent sequential number (e.g. V006)
     only after M4 schema impact and ordering have been formally reconciled.

   PRECONDITIONS:
     1. Database [HSWRMS] exists.
     2. Core identity table dbo.[User] exists (from schema baseline).
     3. Administration tables exist:
        - dbo.[Permission]
        - dbo.RolePermission
        - dbo.SystemConfiguration
        - dbo.RightDelegation
        - dbo.RightDelegationPermission
        - dbo.AuditLog (created by V005__m6_audit_log.sql or schema.sql).

   SUPPORTED EXECUTION CONTRACT & FAIL-FAST ARCHITECTURE:
     1. Supported Command-Line Contract (Automated / CI / Deployment):
        sqlcmd -S "<server_instance>" -d "HSWRMS" -i "05_Development/database/migrations/draft_m6_governance_and_delegation.sql" -b -E

        Notes on execution arguments:
        - The -b switch ensures sqlcmd terminates immediately on any batch error (severity >= 11)
          and returns a non-zero exit code (ERRORLEVEL 1) to the calling shell.
        - IMPORTANT: The -b flag halts execution of subsequent batches, but DOES NOT automatically
          roll back changes from previously successful batches. Because SQL Server DDL statements
          separated by GO execute in distinct transactions unless explicitly wrapped in a single
          connection transaction, an error in batch N leaves batches 1..(N-1) committed.
        - The -E flag enables Windows Integrated Authentication. For SQL Server authentication,
          substitute: -U "<username>" -P "<password>".
        - The database name -d "HSWRMS" is quoted without square brackets for shell safety.
        - File path -i is quoted to prevent whitespace issues in deployment paths.

     2. Server-Side Session Safeguard (SSMS / Interactive):
        In SQL Server, client tools separate scripts into batches delimited by GO.
        A RAISERROR terminates execution of only the current batch. To prevent
        subsequent batches from executing against an unverified or corrupted state,
        every fatal error handler in this script executes SET NOEXEC ON before RETURN.
        In NOEXEC mode, SQL Server compiles subsequent batches without executing them.
        NOTE FOR SSMS USERS: If an error triggers NOEXEC ON, the connection session
        remains in NOEXEC mode until the query tab is closed or SET NOEXEC OFF is run.
        This safeguard does NOT guarantee client process termination for clients
        other than sqlcmd -b.

   SUMMARY OF CHANGES:
     1. dbo.[User]:
        - failed_login_count INT NOT NULL DEFAULT (0) (account lockout tracking)
        - locked_at DATETIME2(0) NULL (timestamp when account was locked)
        - last_login_at DATETIME2(0) NULL (last successful authentication)
        - Index IX_User_AccountStatus_LockedAt
     2. dbo.[Permission]:
        - is_delegable BIT NOT NULL DEFAULT (0) (may be delegated to Manager)
        - is_admin_only BIT NOT NULL DEFAULT (0) (retained strictly by Admin)
        - created_at DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME())
     3. dbo.SystemConfiguration:
        - value_type VARCHAR(20) NOT NULL DEFAULT ('INT') (INT, DECIMAL, STRING)
        - min_value DECIMAL(18,4) NULL (validation lower bound)
        - max_value DECIMAL(18,4) NULL (validation upper bound)
        - unit NVARCHAR(40) NULL (display unit, e.g. Hours, Percent)
        - description NVARCHAR(500) NULL (explanation for administrators)
        - manager_editable BIT NOT NULL DEFAULT (0) (editable under delegation)
     4. dbo.RightDelegation:
        - revoked_at DATETIME2(0) NULL (timestamp of early revocation)
        - revoked_by_admin_user_id INT NULL (foreign key to dbo.[User])
        - Index IX_RightDelegation_Status_Expiry
     5. dbo.AuditLog:
        - actor_role VARCHAR(50) NULL (role name at time of action)
        - target_ref_id VARCHAR(100) NULL (business key or entity identifier)
        - old_value NVARCHAR(500) NULL (prior configuration state)
        - new_value NVARCHAR(500) NULL (new configuration state)
        - delegation_id INT NULL (foreign key to dbo.RightDelegation)
        - Index IX_AuditLog_TargetRefId

   FORWARD-ONLY POLICY & ROLLBACK ARCHITECTURE:
     HSWRMS strictly adheres to FORWARD-ONLY migrations.
     No automated or executable rollback path is provided.
     See documentation at the end of this script for emergency recovery guidance.
   ============================================================================ */

USE [HSWRMS];
GO

-- ----------------------------------------------------------------------------
-- 0. Precondition Check & Session-Level Batch Execution Safeguard
-- ----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.[User]', N'U') IS NULL
   OR OBJECT_ID(N'dbo.[Permission]', N'U') IS NULL
   OR OBJECT_ID(N'dbo.SystemConfiguration', N'U') IS NULL
   OR OBJECT_ID(N'dbo.RightDelegation', N'U') IS NULL
   OR OBJECT_ID(N'dbo.AuditLog', N'U') IS NULL
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Precondition Failed: One or more prerequisite tables (dbo.[User], dbo.[Permission], dbo.SystemConfiguration, dbo.RightDelegation, dbo.AuditLog) do not exist. Please initialize the database with baseline schema.sql and V001-V005 first. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

-- ----------------------------------------------------------------------------
-- 1. dbo.[User] Lockout & Security Columns
-- ----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'failed_login_count'
)
BEGIN
    ALTER TABLE dbo.[User]
    ADD failed_login_count INT NOT NULL
        CONSTRAINT DF_User_FailedLoginCount DEFAULT (0);
END
ELSE
BEGIN
    -- Verify exact existing column definition compatibility
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.[User]') 
          AND name = 'failed_login_count'
          AND TYPE_NAME(user_type_id) = 'int'
          AND is_nullable = 0
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.[User].failed_login_count has an incompatible definition. Expected INT NOT NULL. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    -- Verify or add default constraint with exact normalized definition check
    IF EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE name = 'DF_User_FailedLoginCount'
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE name = 'DF_User_FailedLoginCount'
              AND parent_object_id = OBJECT_ID(N'dbo.[User]')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[User]'), 'failed_login_count', 'ColumnId')
              AND REPLACE(REPLACE(REPLACE(definition, '(', ''), ')', ''), ' ', '') = '0'
        )
        BEGIN
            RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing default constraint DF_User_FailedLoginCount has an incompatible definition. Expected DEFAULT (0) on dbo.[User].failed_login_count. Halting execution.', 16, 1);
            SET NOEXEC ON;
            RETURN;
        END
    END
    ELSE IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.[User]')
          AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[User]'), 'failed_login_count', 'ColumnId')
    )
    BEGIN
        ALTER TABLE dbo.[User]
        ADD CONSTRAINT DF_User_FailedLoginCount DEFAULT (0) FOR failed_login_count;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'locked_at'
)
BEGIN
    ALTER TABLE dbo.[User]
    ADD locked_at DATETIME2(0) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[User]') 
      AND name = 'locked_at'
      AND TYPE_NAME(user_type_id) = 'datetime2'
      AND scale = 0
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.[User].locked_at has an incompatible definition. Expected DATETIME2(0) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'last_login_at'
)
BEGIN
    ALTER TABLE dbo.[User]
    ADD last_login_at DATETIME2(0) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[User]') 
      AND name = 'last_login_at'
      AND TYPE_NAME(user_type_id) = 'datetime2'
      AND scale = 0
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.[User].last_login_at has an incompatible definition. Expected DATETIME2(0) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_User_AccountStatus_LockedAt'
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes i
        WHERE i.name = 'IX_User_AccountStatus_LockedAt'
          AND i.object_id = OBJECT_ID(N'dbo.[User]')
          AND i.type = 2
          AND i.is_disabled = 0
          AND i.is_unique = 0
          AND i.has_filter = 1
          AND UPPER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.filter_definition, '[', ''), ']', ''), '(', ''), ')', ''), ' ', '')) = 'LOCKED_ATISNOTNULL'
          AND (
              SELECT COUNT(*) FROM sys.index_columns ic
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
          ) = 2
          AND NOT EXISTS (
              SELECT 1 FROM sys.index_columns ic
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1
          )
          AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                AND ic.key_ordinal = 1 AND c.name = 'account_status' AND ic.is_descending_key = 0
          )
          AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                AND ic.key_ordinal = 2 AND c.name = 'locked_at' AND ic.is_descending_key = 0
          )
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing index IX_User_AccountStatus_LockedAt has an incompatible definition, unexpected included columns, or is disabled. Expected enabled, non-unique, non-clustered filtered index on dbo.[User](account_status ASC, locked_at ASC) WHERE locked_at IS NOT NULL with no included columns. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END
END
ELSE
BEGIN
    CREATE NONCLUSTERED INDEX IX_User_AccountStatus_LockedAt
        ON dbo.[User](account_status, locked_at)
        WHERE locked_at IS NOT NULL;
END
GO

-- ----------------------------------------------------------------------------
-- 2. dbo.[Permission] Granular Governance Flags
-- ----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[Permission]') AND name = 'is_delegable'
)
BEGIN
    ALTER TABLE dbo.[Permission]
    ADD is_delegable BIT NOT NULL
        CONSTRAINT DF_Permission_IsDelegable DEFAULT (0);
END
ELSE
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.[Permission]') 
          AND name = 'is_delegable'
          AND TYPE_NAME(user_type_id) = 'bit'
          AND is_nullable = 0
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.[Permission].is_delegable has an incompatible definition. Expected BIT NOT NULL. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE name = 'DF_Permission_IsDelegable'
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE name = 'DF_Permission_IsDelegable'
              AND parent_object_id = OBJECT_ID(N'dbo.[Permission]')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[Permission]'), 'is_delegable', 'ColumnId')
              AND REPLACE(REPLACE(REPLACE(definition, '(', ''), ')', ''), ' ', '') = '0'
        )
        BEGIN
            RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing default constraint DF_Permission_IsDelegable has an incompatible definition. Expected DEFAULT (0) on dbo.[Permission].is_delegable. Halting execution.', 16, 1);
            SET NOEXEC ON;
            RETURN;
        END
    END
    ELSE IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.[Permission]')
          AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[Permission]'), 'is_delegable', 'ColumnId')
    )
    BEGIN
        ALTER TABLE dbo.[Permission]
        ADD CONSTRAINT DF_Permission_IsDelegable DEFAULT (0) FOR is_delegable;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[Permission]') AND name = 'is_admin_only'
)
BEGIN
    ALTER TABLE dbo.[Permission]
    ADD is_admin_only BIT NOT NULL
        CONSTRAINT DF_Permission_IsAdminOnly DEFAULT (0);
END
ELSE
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.[Permission]') 
          AND name = 'is_admin_only'
          AND TYPE_NAME(user_type_id) = 'bit'
          AND is_nullable = 0
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.[Permission].is_admin_only has an incompatible definition. Expected BIT NOT NULL. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE name = 'DF_Permission_IsAdminOnly'
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE name = 'DF_Permission_IsAdminOnly'
              AND parent_object_id = OBJECT_ID(N'dbo.[Permission]')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[Permission]'), 'is_admin_only', 'ColumnId')
              AND REPLACE(REPLACE(REPLACE(definition, '(', ''), ')', ''), ' ', '') = '0'
        )
        BEGIN
            RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing default constraint DF_Permission_IsAdminOnly has an incompatible definition. Expected DEFAULT (0) on dbo.[Permission].is_admin_only. Halting execution.', 16, 1);
            SET NOEXEC ON;
            RETURN;
        END
    END
    ELSE IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.[Permission]')
          AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[Permission]'), 'is_admin_only', 'ColumnId')
    )
    BEGIN
        ALTER TABLE dbo.[Permission]
        ADD CONSTRAINT DF_Permission_IsAdminOnly DEFAULT (0) FOR is_admin_only;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[Permission]') AND name = 'created_at'
)
BEGIN
    ALTER TABLE dbo.[Permission]
    ADD created_at DATETIME2(0) NOT NULL
        CONSTRAINT DF_Permission_CreatedAt DEFAULT (SYSUTCDATETIME());
END
ELSE
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.[Permission]') 
          AND name = 'created_at'
          AND TYPE_NAME(user_type_id) = 'datetime2'
          AND scale = 0
          AND is_nullable = 0
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.[Permission].created_at has an incompatible definition. Expected DATETIME2(0) NOT NULL. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE name = 'DF_Permission_CreatedAt'
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE name = 'DF_Permission_CreatedAt'
              AND parent_object_id = OBJECT_ID(N'dbo.[Permission]')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[Permission]'), 'created_at', 'ColumnId')
              AND UPPER(REPLACE(REPLACE(REPLACE(REPLACE(definition, '(', ''), ')', ''), ' ', ''), '[', '')) = 'SYSUTCDATETIME'
        )
        BEGIN
            RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing default constraint DF_Permission_CreatedAt has an incompatible definition. Expected DEFAULT (SYSUTCDATETIME()) on dbo.[Permission].created_at. Halting execution.', 16, 1);
            SET NOEXEC ON;
            RETURN;
        END
    END
    ELSE IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.[Permission]')
          AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[Permission]'), 'created_at', 'ColumnId')
    )
    BEGIN
        ALTER TABLE dbo.[Permission]
        ADD CONSTRAINT DF_Permission_CreatedAt DEFAULT (SYSUTCDATETIME()) FOR created_at;
    END
END
GO

-- ----------------------------------------------------------------------------
-- 3. dbo.SystemConfiguration Business Parameter Metadata
-- ----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') AND name = 'value_type'
)
BEGIN
    ALTER TABLE dbo.SystemConfiguration
    ADD value_type VARCHAR(20) NOT NULL
        CONSTRAINT DF_SystemConfig_ValueType DEFAULT ('INT');
END
ELSE
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') 
          AND name = 'value_type'
          AND TYPE_NAME(user_type_id) = 'varchar'
          AND max_length = 20
          AND is_nullable = 0
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.SystemConfiguration.value_type has an incompatible definition. Expected VARCHAR(20) NOT NULL. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE name = 'DF_SystemConfig_ValueType'
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE name = 'DF_SystemConfig_ValueType'
              AND parent_object_id = OBJECT_ID(N'dbo.SystemConfiguration')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.SystemConfiguration'), 'value_type', 'ColumnId')
              AND REPLACE(REPLACE(REPLACE(definition, '(', ''), ')', ''), ' ', '') IN ('''INT''', 'INT')
        )
        BEGIN
            RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing default constraint DF_SystemConfig_ValueType has an incompatible definition. Expected DEFAULT (''INT'') on dbo.SystemConfiguration.value_type. Halting execution.', 16, 1);
            SET NOEXEC ON;
            RETURN;
        END
    END
    ELSE IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.SystemConfiguration')
          AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.SystemConfiguration'), 'value_type', 'ColumnId')
    )
    BEGIN
        ALTER TABLE dbo.SystemConfiguration
        ADD CONSTRAINT DF_SystemConfig_ValueType DEFAULT ('INT') FOR value_type;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') AND name = 'min_value'
)
BEGIN
    ALTER TABLE dbo.SystemConfiguration
    ADD min_value DECIMAL(18,4) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') 
      AND name = 'min_value'
      AND TYPE_NAME(user_type_id) = 'decimal'
      AND precision = 18
      AND scale = 4
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.SystemConfiguration.min_value has an incompatible definition. Expected DECIMAL(18,4) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') AND name = 'max_value'
)
BEGIN
    ALTER TABLE dbo.SystemConfiguration
    ADD max_value DECIMAL(18,4) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') 
      AND name = 'max_value'
      AND TYPE_NAME(user_type_id) = 'decimal'
      AND precision = 18
      AND scale = 4
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.SystemConfiguration.max_value has an incompatible definition. Expected DECIMAL(18,4) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') AND name = 'unit'
)
BEGIN
    ALTER TABLE dbo.SystemConfiguration
    ADD unit NVARCHAR(40) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') 
      AND name = 'unit'
      AND TYPE_NAME(user_type_id) = 'nvarchar'
      AND max_length = 80
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.SystemConfiguration.unit has an incompatible definition. Expected NVARCHAR(40) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') AND name = 'description'
)
BEGIN
    ALTER TABLE dbo.SystemConfiguration
    ADD description NVARCHAR(500) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') 
      AND name = 'description'
      AND TYPE_NAME(user_type_id) = 'nvarchar'
      AND max_length = 1000
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.SystemConfiguration.description has an incompatible definition. Expected NVARCHAR(500) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') AND name = 'manager_editable'
)
BEGIN
    ALTER TABLE dbo.SystemConfiguration
    ADD manager_editable BIT NOT NULL
        CONSTRAINT DF_SystemConfig_ManagerEditable DEFAULT (0);
END
ELSE
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.SystemConfiguration') 
          AND name = 'manager_editable'
          AND TYPE_NAME(user_type_id) = 'bit'
          AND is_nullable = 0
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.SystemConfiguration.manager_editable has an incompatible definition. Expected BIT NOT NULL. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE name = 'DF_SystemConfig_ManagerEditable'
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE name = 'DF_SystemConfig_ManagerEditable'
              AND parent_object_id = OBJECT_ID(N'dbo.SystemConfiguration')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.SystemConfiguration'), 'manager_editable', 'ColumnId')
              AND REPLACE(REPLACE(REPLACE(definition, '(', ''), ')', ''), ' ', '') = '0'
        )
        BEGIN
            RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing default constraint DF_SystemConfig_ManagerEditable has an incompatible definition. Expected DEFAULT (0) on dbo.SystemConfiguration.manager_editable. Halting execution.', 16, 1);
            SET NOEXEC ON;
            RETURN;
        END
    END
    ELSE IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.SystemConfiguration')
          AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.SystemConfiguration'), 'manager_editable', 'ColumnId')
    )
    BEGIN
        ALTER TABLE dbo.SystemConfiguration
        ADD CONSTRAINT DF_SystemConfig_ManagerEditable DEFAULT (0) FOR manager_editable;
    END
END
GO

-- ----------------------------------------------------------------------------
-- 4. dbo.RightDelegation Revocation Tracking
-- ----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RightDelegation') AND name = 'revoked_at'
)
BEGIN
    ALTER TABLE dbo.RightDelegation
    ADD revoked_at DATETIME2(0) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RightDelegation') 
      AND name = 'revoked_at'
      AND TYPE_NAME(user_type_id) = 'datetime2'
      AND scale = 0
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.RightDelegation.revoked_at has an incompatible definition. Expected DATETIME2(0) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RightDelegation') AND name = 'revoked_by_admin_user_id'
)
BEGIN
    ALTER TABLE dbo.RightDelegation
    ADD revoked_by_admin_user_id INT NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RightDelegation') 
      AND name = 'revoked_by_admin_user_id'
      AND TYPE_NAME(user_type_id) = 'int'
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.RightDelegation.revoked_by_admin_user_id has an incompatible definition. Expected INT NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

-- Decoupled Foreign Key creation: verifies definitions, enabled status, trusted status, and referential actions
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'FK_RightDelegation_RevokedBy'
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        WHERE fk.name = 'FK_RightDelegation_RevokedBy'
          AND fk.parent_object_id = OBJECT_ID(N'dbo.RightDelegation')
          AND fk.referenced_object_id = OBJECT_ID(N'dbo.[User]')
          AND fk.is_disabled = 0
          AND fk.is_not_trusted = 0
          AND fk.delete_referential_action = 0
          AND fk.update_referential_action = 0
          AND fkc.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.RightDelegation'), 'revoked_by_admin_user_id', 'ColumnId')
          AND fkc.referenced_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.[User]'), 'user_id', 'ColumnId')
          AND (
              SELECT COUNT(*) FROM sys.foreign_key_columns fkc2 
              WHERE fkc2.constraint_object_id = fk.object_id
          ) = 1
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing foreign key FK_RightDelegation_RevokedBy has an incompatible definition, is untrusted (is_not_trusted = 1), or has unexpected columns. Expected single-column trusted NO ACTION FK from dbo.RightDelegation(revoked_by_admin_user_id) to dbo.[User](user_id). If untrusted, validate data via ALTER TABLE dbo.RightDelegation WITH CHECK CHECK CONSTRAINT FK_RightDelegation_RevokedBy. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END
END
ELSE
BEGIN
    IF OBJECT_ID(N'dbo.[User]', N'U') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Precondition Failed: Prerequisite table dbo.[User] does not exist. Cannot create FK_RightDelegation_RevokedBy. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF COL_LENGTH('dbo.[User]', 'user_id') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Referenced column dbo.[User].user_id does not exist. Cannot create FK_RightDelegation_RevokedBy. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF COL_LENGTH('dbo.RightDelegation', 'revoked_by_admin_user_id') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Parent column dbo.RightDelegation.revoked_by_admin_user_id does not exist. Cannot create FK_RightDelegation_RevokedBy. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    ALTER TABLE dbo.RightDelegation
    ADD CONSTRAINT FK_RightDelegation_RevokedBy
        FOREIGN KEY (revoked_by_admin_user_id) REFERENCES dbo.[User](user_id);
END
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_RightDelegation_Status_Expiry'
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes i
        WHERE i.name = 'IX_RightDelegation_Status_Expiry'
          AND i.object_id = OBJECT_ID(N'dbo.RightDelegation')
          AND i.type = 2
          AND i.is_disabled = 0
          AND i.is_unique = 0
          AND i.has_filter = 0
          AND (
              SELECT COUNT(*) FROM sys.index_columns ic
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
          ) = 3
          AND NOT EXISTS (
              SELECT 1 FROM sys.index_columns ic
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1
          )
          AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                AND ic.key_ordinal = 1 AND c.name = 'delegation_status' AND ic.is_descending_key = 0
          )
          AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                AND ic.key_ordinal = 2 AND c.name = 'valid_from' AND ic.is_descending_key = 0
          )
          AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                AND ic.key_ordinal = 3 AND c.name = 'valid_until' AND ic.is_descending_key = 0
          )
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing index IX_RightDelegation_Status_Expiry has an incompatible definition, unexpected included columns, or is disabled. Expected enabled, non-unique, non-clustered composite index on dbo.RightDelegation(delegation_status ASC, valid_from ASC, valid_until ASC) with no included columns. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END
END
ELSE
BEGIN
    CREATE NONCLUSTERED INDEX IX_RightDelegation_Status_Expiry
        ON dbo.RightDelegation(delegation_status, valid_from, valid_until);
END
GO

-- ----------------------------------------------------------------------------
-- 5. dbo.AuditLog M6 Sensitive Governance Columns
-- ----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'actor_role'
)
BEGIN
    ALTER TABLE dbo.AuditLog
    ADD actor_role VARCHAR(50) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') 
      AND name = 'actor_role'
      AND TYPE_NAME(user_type_id) = 'varchar'
      AND max_length = 50
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.AuditLog.actor_role has an incompatible definition. Expected VARCHAR(50) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'target_ref_id'
)
BEGIN
    ALTER TABLE dbo.AuditLog
    ADD target_ref_id VARCHAR(100) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') 
      AND name = 'target_ref_id'
      AND TYPE_NAME(user_type_id) = 'varchar'
      AND max_length = 100
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.AuditLog.target_ref_id has an incompatible definition. Expected VARCHAR(100) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'old_value'
)
BEGIN
    ALTER TABLE dbo.AuditLog
    ADD old_value NVARCHAR(500) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') 
      AND name = 'old_value'
      AND TYPE_NAME(user_type_id) = 'nvarchar'
      AND max_length = 1000
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.AuditLog.old_value has an incompatible definition. Expected NVARCHAR(500) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'new_value'
)
BEGIN
    ALTER TABLE dbo.AuditLog
    ADD new_value NVARCHAR(500) NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') 
      AND name = 'new_value'
      AND TYPE_NAME(user_type_id) = 'nvarchar'
      AND max_length = 1000
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.AuditLog.new_value has an incompatible definition. Expected NVARCHAR(500) NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

-- Decoupled column addition: delegation_id added without inline FK constraint
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'delegation_id'
)
BEGIN
    ALTER TABLE dbo.AuditLog
    ADD delegation_id INT NULL;
END
ELSE IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.AuditLog') 
      AND name = 'delegation_id'
      AND TYPE_NAME(user_type_id) = 'int'
      AND is_nullable = 1
)
BEGIN
    RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing column dbo.AuditLog.delegation_id has an incompatible definition. Expected INT NULL. Halting execution.', 16, 1);
    SET NOEXEC ON;
    RETURN;
END
GO

-- Decoupled Foreign Key creation: ensures existing delegation_id column receives FK if missing
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'FK_AuditLog_RightDelegation'
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        WHERE fk.name = 'FK_AuditLog_RightDelegation'
          AND fk.parent_object_id = OBJECT_ID(N'dbo.AuditLog')
          AND fk.referenced_object_id = OBJECT_ID(N'dbo.RightDelegation')
          AND fk.is_disabled = 0
          AND fk.is_not_trusted = 0
          AND fk.delete_referential_action = 0
          AND fk.update_referential_action = 0
          AND fkc.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.AuditLog'), 'delegation_id', 'ColumnId')
          AND fkc.referenced_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.RightDelegation'), 'delegation_id', 'ColumnId')
          AND (
              SELECT COUNT(*) FROM sys.foreign_key_columns fkc2 
              WHERE fkc2.constraint_object_id = fk.object_id
          ) = 1
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing foreign key FK_AuditLog_RightDelegation has an incompatible definition, is untrusted (is_not_trusted = 1), or has unexpected columns. Expected single-column trusted NO ACTION FK from dbo.AuditLog(delegation_id) to dbo.RightDelegation(delegation_id). If untrusted, validate data via ALTER TABLE dbo.AuditLog WITH CHECK CHECK CONSTRAINT FK_AuditLog_RightDelegation. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END
END
ELSE
BEGIN
    IF OBJECT_ID(N'dbo.RightDelegation', N'U') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Precondition Failed: Prerequisite table dbo.RightDelegation does not exist. Cannot create FK_AuditLog_RightDelegation. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF COL_LENGTH('dbo.RightDelegation', 'delegation_id') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Referenced column dbo.RightDelegation.delegation_id does not exist. Cannot create FK_AuditLog_RightDelegation. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    IF COL_LENGTH('dbo.AuditLog', 'delegation_id') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Parent column dbo.AuditLog.delegation_id does not exist. Cannot create FK_AuditLog_RightDelegation. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END

    ALTER TABLE dbo.AuditLog
    ADD CONSTRAINT FK_AuditLog_RightDelegation
        FOREIGN KEY (delegation_id) REFERENCES dbo.RightDelegation(delegation_id);
END
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_AuditLog_TargetRefId'
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes i
        WHERE i.name = 'IX_AuditLog_TargetRefId'
          AND i.object_id = OBJECT_ID(N'dbo.AuditLog')
          AND i.type = 2
          AND i.is_disabled = 0
          AND i.is_unique = 0
          AND i.has_filter = 1
          AND UPPER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.filter_definition, '[', ''), ']', ''), '(', ''), ')', ''), ' ', '')) = 'TARGET_REF_IDISNOTNULL'
          AND (
              SELECT COUNT(*) FROM sys.index_columns ic
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
          ) = 2
          AND NOT EXISTS (
              SELECT 1 FROM sys.index_columns ic
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1
          )
          AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                AND ic.key_ordinal = 1 AND c.name = 'target_ref_id' AND ic.is_descending_key = 0
          )
          AND EXISTS (
              SELECT 1 FROM sys.index_columns ic
              JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
              WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
                AND ic.key_ordinal = 2 AND c.name = 'created_at' AND ic.is_descending_key = 1
          )
    )
    BEGIN
        RAISERROR(N'HSWRMS Migration draft_m6 Error: Existing index IX_AuditLog_TargetRefId has an incompatible definition, unexpected included columns, or is disabled. Expected enabled, non-unique, non-clustered filtered index on dbo.AuditLog(target_ref_id ASC, created_at DESC) WHERE target_ref_id IS NOT NULL with no included columns. Halting execution.', 16, 1);
        SET NOEXEC ON;
        RETURN;
    END
END
ELSE
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditLog_TargetRefId
        ON dbo.AuditLog(target_ref_id, created_at DESC)
        WHERE target_ref_id IS NOT NULL;
END
GO

PRINT 'HSWRMS Draft Module 6 Governance & Delegation migration applied successfully.';
GO

/* ============================================================================
   EMERGENCY RECOVERY & FORWARD-ONLY ARCHITECTURE GUIDANCE
   ----------------------------------------------------------------------------
   In production and integrated multi-module database environments:
   1. MIGRATIONS MUST FOLLOW FORWARD-ONLY PROGRESSION:
      If a defect or discrepancy is detected post-deployment, author and apply
      a new sequential, forward-only compensatory migration rather than rolling
      back existing schema changes.

   2. OPERATIONAL RISKS OF METADATA & CONSTRAINT REMOVAL:
      Even non-destructive changes (dropping default constraints or foreign keys)
      introduce severe operational risks:
      - Dropping default constraints (e.g. DF_User_FailedLoginCount, DF_Permission_IsDelegable)
        causes backend application INSERT statements to immediately FAIL with
        NOT NULL constraint violations whenever those columns are not explicitly supplied.
      - Dropping foreign keys (FK_AuditLog_RightDelegation, FK_RightDelegation_RevokedBy)
        compromises referential integrity and allows orphaned audit records.
      - Dropping indexes degrades query performance for authentication lockout and
        delegation expiration background jobs.

   3. DATA-DESTRUCTIVE COLUMN REMOVAL (PERMANENT LOSS):
      Dropping columns permanently destroys all audit trails, lockout counts,
      and configuration metadata.

   4. EMERGENCY DISASTER RECOVERY PROCEDURE:
      If an emergency rollback is mandated by executive incident management:
      - Step 1: Immediately initiate an application maintenance downtime window.
      - Step 2: Confirm a full verified database backup and transaction log backup exist.
      - Step 3: Obtain formal written authorization from the System Architect and Lead DBA.
      - Step 4: Execute compensatory DDL under strict supervision.
   ============================================================================ */
