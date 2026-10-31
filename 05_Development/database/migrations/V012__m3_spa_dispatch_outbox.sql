-- ============================================================================
-- HSWRMS Migration V012: M3 Spa Dispatch Outbox Schema
-- Supports BR-M3-14 durable, fault-tolerant asynchronous external dispatches
-- (Google Calendar and SMTP notifications) with automated retries and idempotency.
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
)
BEGIN
    CREATE TABLE dbo.SpaDispatchOutbox (
        outbox_id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpaDispatchOutbox PRIMARY KEY,
        history_id             BIGINT NULL,
        session_id             INT NOT NULL,
        channel                VARCHAR(30) NOT NULL,
        status                 VARCHAR(30) NOT NULL CONSTRAINT DF_SpaDispatchOutbox_status DEFAULT ('PENDING'),
        retry_count            INT NOT NULL CONSTRAINT DF_SpaDispatchOutbox_retry_count DEFAULT (0),
        max_retries            INT NOT NULL CONSTRAINT DF_SpaDispatchOutbox_max_retries DEFAULT (5),
        customer_email         VARCHAR(255) NULL,
        customer_name          NVARCHAR(255) NULL,
        change_type            VARCHAR(50) NULL,
        change_details         NVARCHAR(1000) NULL,
        external_calendar_id   VARCHAR(255) NULL,
        last_error             NVARCHAR(1000) NULL,
        idempotency_key        VARCHAR(150) NOT NULL,
        created_at             DATETIME2(0) NOT NULL CONSTRAINT DF_SpaDispatchOutbox_created_at DEFAULT (SYSUTCDATETIME()),
        processed_at           DATETIME2(0) NULL,

        CONSTRAINT UQ_SpaDispatchOutbox_IdempotencyKey UNIQUE (idempotency_key),
        CONSTRAINT FK_SpaDispatchOutbox_SpaSession FOREIGN KEY (session_id)
            REFERENCES dbo.SpaSession (spa_session_id),
        CONSTRAINT CK_SpaDispatchOutbox_Status CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
        CONSTRAINT CK_SpaDispatchOutbox_Channel CHECK (channel IN ('CALENDAR', 'EMAIL'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox') AND name = N'IX_SpaDispatchOutbox_status_retries'
)
BEGIN
    CREATE INDEX IX_SpaDispatchOutbox_status_retries ON dbo.SpaDispatchOutbox (status, retry_count);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox') AND name = N'IX_SpaDispatchOutbox_session_id'
)
BEGIN
    CREATE INDEX IX_SpaDispatchOutbox_session_id ON dbo.SpaDispatchOutbox (session_id);
END;
GO

