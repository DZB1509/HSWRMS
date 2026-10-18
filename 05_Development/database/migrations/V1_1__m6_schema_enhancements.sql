/*
================================================================================
HSWRMS Migration V1.1 - Module 6 Administration & RBAC Schema Enhancements
Target Database: SQL Server / Azure SQL
Author: HSWRMS Development Team
Strict Compliance: HSWRMS_ISP392_G1_SRS_11.10 (Feature Flags Removed)
================================================================================
*/

USE [HSWRMS];
GO

-- 1. User Account Security Enhancements (Lockout after consecutive failed attempts)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.[User]') AND name = 'failed_login_count'
)
BEGIN
    ALTER TABLE dbo.[User]
    ADD failed_login_count INT NOT NULL CONSTRAINT DF_User_FailedLoginCount DEFAULT (0);
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
GO

-- 2. Granular Permissions (Screen/Action Code with Admin-only and Delegation flags)
IF OBJECT_ID(N'dbo.Permission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Permission (
        permission_id       INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Permission PRIMARY KEY,
        module_or_screen    VARCHAR(100) NOT NULL,
        action_type         VARCHAR(50) NOT NULL,
        is_delegable        BIT NOT NULL CONSTRAINT DF_Permission_IsDelegable DEFAULT (0),
        is_admin_only       BIT NOT NULL CONSTRAINT DF_Permission_IsAdminOnly DEFAULT (0),
        created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_Permission_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT UQ_Permission_Screen_Action UNIQUE (module_or_screen, action_type)
    );
END
GO

-- 3. Role-Permission Bridge
IF OBJECT_ID(N'dbo.RolePermission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermission (
        role_permission_id  INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RolePermission PRIMARY KEY,
        role_id             INT NOT NULL,
        permission_id       INT NOT NULL,
        granted_at          DATETIME2(0) NOT NULL CONSTRAINT DF_RolePermission_GrantedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT UQ_RolePermission UNIQUE (role_id, permission_id),
        CONSTRAINT FK_RolePermission_Role FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id) ON DELETE CASCADE,
        CONSTRAINT FK_RolePermission_Permission FOREIGN KEY (permission_id) REFERENCES dbo.Permission(permission_id) ON DELETE CASCADE
    );
END
GO

-- 4. Dynamic Business Parameters & Configurations
IF OBJECT_ID(N'dbo.SystemConfiguration', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SystemConfiguration (
        config_id           INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_SystemConfiguration PRIMARY KEY,
        param_key           VARCHAR(100) NOT NULL,
        param_value         NVARCHAR(MAX) NOT NULL,
        description         NVARCHAR(500) NULL,
        category            VARCHAR(50) NOT NULL,
        data_type           VARCHAR(20) NOT NULL CONSTRAINT DF_SystemConfig_DataType DEFAULT ('STRING'),
        min_value           VARCHAR(100) NULL,
        max_value           VARCHAR(100) NULL,
        allowed_values      VARCHAR(500) NULL,
        is_manager_editable BIT NOT NULL CONSTRAINT DF_SystemConfig_IsManagerEditable DEFAULT (0),
        updated_at          DATETIME2(0) NOT NULL CONSTRAINT DF_SystemConfig_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        updated_by          INT NULL,

        CONSTRAINT UQ_SystemConfiguration_Key UNIQUE (param_key),
        CONSTRAINT FK_SystemConfig_User FOREIGN KEY (updated_by) REFERENCES dbo.[User](user_id)
    );
END
GO

-- 5. Manager Rights Delegation
IF OBJECT_ID(N'dbo.RightDelegation', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RightDelegation (
        delegation_id       INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_RightDelegation PRIMARY KEY,
        manager_user_id     INT NOT NULL,
        delegatee_user_id   INT NOT NULL,
        status              VARCHAR(20) NOT NULL CONSTRAINT DF_Delegation_Status DEFAULT ('PENDING'),
        starts_at           DATETIME2(0) NOT NULL,
        expires_at          DATETIME2(0) NOT NULL,
        created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_Delegation_CreatedAt DEFAULT (SYSUTCDATETIME()),
        revoked_at          DATETIME2(0) NULL,
        revoke_reason       NVARCHAR(500) NULL,

        CONSTRAINT FK_Delegation_Manager FOREIGN KEY (manager_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT FK_Delegation_Delegatee FOREIGN KEY (delegatee_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT CK_Delegation_Status CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED')),
        CONSTRAINT CK_Delegation_TimeRange CHECK (expires_at > starts_at)
    );
END
GO

IF OBJECT_ID(N'dbo.RightDelegationPermission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RightDelegationPermission (
        delegation_id       INT NOT NULL,
        permission_id       INT NOT NULL,

        CONSTRAINT PK_RightDelegationPermission PRIMARY KEY (delegation_id, permission_id),
        CONSTRAINT FK_RDP_Delegation FOREIGN KEY (delegation_id) REFERENCES dbo.RightDelegation(delegation_id) ON DELETE CASCADE,
        CONSTRAINT FK_RDP_Permission FOREIGN KEY (permission_id) REFERENCES dbo.Permission(permission_id) ON DELETE CASCADE
    );
END
GO

-- 6. Sensitive Audit Log (Immutable - Append Only)
IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NOT NULL
BEGIN
    -- Enhance existing AuditLog table if columns are missing
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'actor_role')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD actor_role VARCHAR(50) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'screen_or_module')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD screen_or_module VARCHAR(100) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'target_resource_type')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD target_resource_type VARCHAR(100) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'target_resource_id')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD target_resource_id VARCHAR(100) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'client_ip_address')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD client_ip_address VARCHAR(45) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'request_payload_masked')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD request_payload_masked NVARCHAR(MAX) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'target_ref_id')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD target_ref_id VARCHAR(100) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'old_value')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD old_value NVARCHAR(500) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'new_value')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD new_value NVARCHAR(500) NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'delegation_id')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD delegation_id INT NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'response_status')
    BEGIN
        ALTER TABLE dbo.AuditLog ADD response_status INT NULL;
    END
END
GO

-- Performance Indices
CREATE NONCLUSTERED INDEX IX_User_AccountStatus_LockedAt
    ON dbo.[User](account_status, locked_at)
    WHERE locked_at IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_RightDelegation_Status_Expiry
    ON dbo.RightDelegation(status, starts_at, expires_at);
GO

CREATE NONCLUSTERED INDEX IX_AuditLog_ScreenModule_CreatedAt
    ON dbo.AuditLog(screen_or_module, created_at DESC);
GO

PRINT 'HSWRMS V1.1 Module 6 Schema Enhancements applied successfully.';
GO
