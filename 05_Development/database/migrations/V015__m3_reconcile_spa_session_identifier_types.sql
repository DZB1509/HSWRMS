-- ============================================================================
-- HSWRMS Migration V015: M3 Reconcile SpaSession Identifier Types & Outbox Claim Hardening
--
-- Purpose:
-- 1. Reconciles SQL Server data type mismatch (Msg 1778) between parent PK
--    dbo.SpaSession.spa_session_id (INT) and child FK columns
--    dbo.SpaScheduleHistory.session_id and dbo.SpaDispatchOutbox.session_id (BIGINT -> INT).
--    Follows Option A: Keep parent PK as INT (matching dbo.FolioItem.source_spa_session_id)
--    and align M3 audit/outbox child foreign key columns to INT NOT NULL.
-- 2. Adds multi-instance concurrency claim columns (claimed_at, claimed_by) and expands
--    CK_SpaDispatchOutbox_Status to include 'PROCESSING' for atomic worker claiming
--    and stale-claim recovery (BR-M3-14).
-- ============================================================================

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- PART 1: Reconcile dbo.SpaScheduleHistory.session_id (BIGINT -> INT)
-- ============================================================================

IF OBJECT_ID(N'dbo.SpaScheduleHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SpaScheduleHistory (
        history_id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpaScheduleHistory PRIMARY KEY,
        session_id              INT NOT NULL,
        actor_user_id           INT NULL,
        actor_role              VARCHAR(30) NULL,
        change_type             VARCHAR(50) NOT NULL,
        previous_status         VARCHAR(30) NULL,
        new_status              VARCHAR(30) NOT NULL,
        previous_start_at       DATETIME2(0) NULL,
        new_start_at            DATETIME2(0) NOT NULL,
        previous_therapist_id   INT NULL,
        new_therapist_id        INT NULL,
        previous_room_id        INT NULL,
        new_room_id             INT NULL,
        reason                  NVARCHAR(500) NULL,
        external_calendar_id    VARCHAR(255) NULL,
        created_at              DATETIME2(0) NOT NULL CONSTRAINT DF_SpaScheduleHistory_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_SpaScheduleHistory_SpaSession FOREIGN KEY (session_id)
            REFERENCES dbo.SpaSession (spa_session_id)
    );
END
ELSE
BEGIN
    -- Safety Range Check before narrowing BIGINT to INT
    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'dbo.SpaScheduleHistory')
          AND c.name = N'session_id'
          AND t.name = N'bigint'
    )
    BEGIN
        IF EXISTS (
            SELECT 1 FROM dbo.SpaScheduleHistory
            WHERE session_id > 2147483647 OR session_id < -2147483648
        )
        BEGIN
            RAISERROR('Cannot alter dbo.SpaScheduleHistory.session_id from BIGINT to INT: existing values exceed 32-bit INT range.', 16, 1);
            RETURN;
        END;

        -- Drop inbound/outbound FK on session_id if present
        IF EXISTS (
            SELECT 1 FROM sys.foreign_keys
            WHERE name = N'FK_SpaScheduleHistory_SpaSession'
              AND parent_object_id = OBJECT_ID(N'dbo.SpaScheduleHistory')
        )
        BEGIN
            ALTER TABLE dbo.SpaScheduleHistory DROP CONSTRAINT FK_SpaScheduleHistory_SpaSession;
        END;

        -- Drop dependent index on session_id before altering column type
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.SpaScheduleHistory')
              AND name = N'IX_SpaScheduleHistory_session_id'
        )
        BEGIN
            DROP INDEX IX_SpaScheduleHistory_session_id ON dbo.SpaScheduleHistory;
        END;

        ALTER TABLE dbo.SpaScheduleHistory ALTER COLUMN session_id INT NOT NULL;
    END;

    -- Ensure FK_SpaScheduleHistory_SpaSession exists
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = N'FK_SpaScheduleHistory_SpaSession'
          AND parent_object_id = OBJECT_ID(N'dbo.SpaScheduleHistory')
    )
    BEGIN
        ALTER TABLE dbo.SpaScheduleHistory WITH CHECK
        ADD CONSTRAINT FK_SpaScheduleHistory_SpaSession FOREIGN KEY (session_id)
            REFERENCES dbo.SpaSession (spa_session_id);
    END;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.SpaScheduleHistory')
      AND name = N'IX_SpaScheduleHistory_session_id'
)
BEGIN
    CREATE INDEX IX_SpaScheduleHistory_session_id ON dbo.SpaScheduleHistory (session_id);
END;
GO

-- ============================================================================
-- PART 2: Reconcile dbo.SpaDispatchOutbox.session_id (BIGINT -> INT)
--         & Add Concurrency Claim Columns (claimed_at, claimed_by, PROCESSING)
-- ============================================================================

IF OBJECT_ID(N'dbo.SpaDispatchOutbox', N'U') IS NULL
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
        claimed_at             DATETIME2(0) NULL,
        claimed_by             VARCHAR(100) NULL,
        created_at             DATETIME2(0) NOT NULL CONSTRAINT DF_SpaDispatchOutbox_created_at DEFAULT (SYSUTCDATETIME()),
        processed_at           DATETIME2(0) NULL,

        CONSTRAINT UQ_SpaDispatchOutbox_IdempotencyKey UNIQUE (idempotency_key),
        CONSTRAINT FK_SpaDispatchOutbox_SpaSession FOREIGN KEY (session_id)
            REFERENCES dbo.SpaSession (spa_session_id),
        CONSTRAINT CK_SpaDispatchOutbox_Status CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
        CONSTRAINT CK_SpaDispatchOutbox_Channel CHECK (channel IN ('CALENDAR', 'EMAIL'))
    );
END
ELSE
BEGIN
    -- Safety Range Check before narrowing BIGINT to INT
    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
          AND c.name = N'session_id'
          AND t.name = N'bigint'
    )
    BEGIN
        IF EXISTS (
            SELECT 1 FROM dbo.SpaDispatchOutbox
            WHERE session_id > 2147483647 OR session_id < -2147483648
        )
        BEGIN
            RAISERROR('Cannot alter dbo.SpaDispatchOutbox.session_id from BIGINT to INT: existing values exceed 32-bit INT range.', 16, 1);
            RETURN;
        END;

        -- Drop FK constraint if present
        IF EXISTS (
            SELECT 1 FROM sys.foreign_keys
            WHERE name = N'FK_SpaDispatchOutbox_SpaSession'
              AND parent_object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
        )
        BEGIN
            ALTER TABLE dbo.SpaDispatchOutbox DROP CONSTRAINT FK_SpaDispatchOutbox_SpaSession;
        END;

        -- Drop dependent index on session_id before altering column type
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
              AND name = N'IX_SpaDispatchOutbox_session_id'
        )
        BEGIN
            DROP INDEX IX_SpaDispatchOutbox_session_id ON dbo.SpaDispatchOutbox;
        END;

        ALTER TABLE dbo.SpaDispatchOutbox ALTER COLUMN session_id INT NOT NULL;
    END;

    -- Ensure FK_SpaDispatchOutbox_SpaSession exists
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = N'FK_SpaDispatchOutbox_SpaSession'
          AND parent_object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
    )
    BEGIN
        ALTER TABLE dbo.SpaDispatchOutbox WITH CHECK
        ADD CONSTRAINT FK_SpaDispatchOutbox_SpaSession FOREIGN KEY (session_id)
            REFERENCES dbo.SpaSession (spa_session_id);
    END;

    -- Add claimed_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
          AND name = N'claimed_at'
    )
    BEGIN
        ALTER TABLE dbo.SpaDispatchOutbox ADD claimed_at DATETIME2(0) NULL;
    END;

    -- Add claimed_by column if missing
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
          AND name = N'claimed_by'
    )
    BEGIN
        ALTER TABLE dbo.SpaDispatchOutbox ADD claimed_by VARCHAR(100) NULL;
    END;

    -- Reconcile CK_SpaDispatchOutbox_Status to allow 'PROCESSING'
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = N'CK_SpaDispatchOutbox_Status'
          AND parent_object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
    )
    BEGIN
        ALTER TABLE dbo.SpaDispatchOutbox DROP CONSTRAINT CK_SpaDispatchOutbox_Status;
    END;

    ALTER TABLE dbo.SpaDispatchOutbox WITH CHECK
    ADD CONSTRAINT CK_SpaDispatchOutbox_Status
        CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED'));
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
      AND name = N'IX_SpaDispatchOutbox_status_retries'
)
BEGIN
    CREATE INDEX IX_SpaDispatchOutbox_status_retries ON dbo.SpaDispatchOutbox (status, retry_count);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
      AND name = N'IX_SpaDispatchOutbox_session_id'
)
BEGIN
    CREATE INDEX IX_SpaDispatchOutbox_session_id ON dbo.SpaDispatchOutbox (session_id);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
      AND name = N'IX_SpaDispatchOutbox_claim'
)
BEGIN
    CREATE INDEX IX_SpaDispatchOutbox_claim ON dbo.SpaDispatchOutbox (status, retry_count, claimed_at);
END;
GO

