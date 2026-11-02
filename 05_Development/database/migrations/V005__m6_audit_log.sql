/* ============================================================================
   V005 - Create AuditLog Table (Module 6 Admin / Cross-Cutting Audit)
   Idempotent migration script for existing databases upgraded incrementally.
   Prerequisite: dbo.[User] table must exist.
   ============================================================================ */

IF OBJECT_ID('dbo.AuditLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog (
        audit_log_id        BIGINT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_AuditLog PRIMARY KEY,
        actor_user_id       INT NULL,
        action              NVARCHAR(150) NOT NULL,
        target_data_type    NVARCHAR(100) NULL,
        access_status       NVARCHAR(50) NULL,
        created_at          DATETIME2(0) NOT NULL
            CONSTRAINT DF_AuditLog_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT FK_AuditLog_User
            FOREIGN KEY (actor_user_id)
            REFERENCES dbo.[User](user_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLog_ActorCreatedAt' AND object_id = OBJECT_ID('dbo.AuditLog'))
BEGIN
    CREATE INDEX IX_AuditLog_ActorCreatedAt
        ON dbo.AuditLog(actor_user_id, created_at DESC);
END
GO
