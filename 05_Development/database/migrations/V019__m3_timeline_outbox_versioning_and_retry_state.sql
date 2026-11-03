/* M3 timeline reminder idempotency and bounded outbox retry scheduling. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.SpaSession', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SpaSession', N'schedule_version') IS NULL
BEGIN
    ALTER TABLE dbo.SpaSession
        ADD schedule_version INT NOT NULL
            CONSTRAINT DF_SpaSession_ScheduleVersion DEFAULT (1) WITH VALUES;
END;

IF OBJECT_ID(N'dbo.SpaSession', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.SpaSession', N'recovery_attempted_version') IS NULL
    ALTER TABLE dbo.SpaSession ADD recovery_attempted_version INT NULL;

IF OBJECT_ID(N'dbo.SpaDispatchOutbox', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.SpaDispatchOutbox', N'next_attempt_at') IS NULL
        ALTER TABLE dbo.SpaDispatchOutbox ADD next_attempt_at DATETIME2(0) NULL;

    IF COL_LENGTH(N'dbo.SpaDispatchOutbox', N'schedule_version') IS NULL
        ALTER TABLE dbo.SpaDispatchOutbox ADD schedule_version INT NOT NULL
            CONSTRAINT DF_SpaDispatchOutbox_schedule_version DEFAULT (1) WITH VALUES;

    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
          AND name = N'CK_SpaDispatchOutbox_Status'
    )
        ALTER TABLE dbo.SpaDispatchOutbox DROP CONSTRAINT CK_SpaDispatchOutbox_Status;

    ALTER TABLE dbo.SpaDispatchOutbox WITH CHECK
        ADD CONSTRAINT CK_SpaDispatchOutbox_Status
        CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'FINAL_FAILURE', 'AMBIGUOUS', 'SKIPPED', 'SUPERSEDED'));

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.SpaDispatchOutbox')
          AND name = N'IX_SpaDispatchOutbox_RetryDue'
    )
        CREATE INDEX IX_SpaDispatchOutbox_RetryDue
            ON dbo.SpaDispatchOutbox (status, retry_count, next_attempt_at, claimed_at);
END;

COMMIT TRANSACTION;
