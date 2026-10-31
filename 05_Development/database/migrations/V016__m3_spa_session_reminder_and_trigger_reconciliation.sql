/* ============================================================================
   Migration : V016__m3_spa_session_reminder_and_trigger_reconciliation.sql
   Module    : M3 - Spa & Wellness Scheduling
   Target    : SQL Server 2019+ (database-context-neutral: HSWRMS / HSWRMS_TEST)
   Purpose   :
     1. Idempotently add the four missing reminder lifecycle columns on
        dbo.SpaSession required by SpaSession.java and SessionTimelineScheduler:
          - reminder_status VARCHAR(20) NULL (DEFAULT 'PENDING')
          - reminder_claimed_at DATETIME2(0) NULL
          - reminder_claim_expires_at DATETIME2(0) NULL
          - reminder_sent_at DATETIME2(0) NULL
        plus defensive check for reminder_claim_token VARCHAR(64) NULL (V008).
     2. Enforce CK_SpaSession_ReminderStatus derived from SpaReminderStatus.java:
        ('PENDING', 'CLAIMED', 'SENT', 'RETRYABLE_FAILURE').
     3. Create supporting index IX_SpaSession_ReminderDue for T-1h reminder
        polling and atomic claim updates.
     4. Reconcile dbo.TR_SpaSession_ValidateScheduling so therapist qualification
        (51001) and treatment room compatibility (51002) checks only apply to
        active scheduling states ('SCHEDULED', 'RESCHEDULING'), preventing
        false-positive trigger failures when cancelling, completing, or marking
        NO_SHOW on historical sessions.
   ============================================================================ */

-- Database-context-neutral guard: never switch databases implicitly; validate active target context.
DECLARE @CurrentDb sysname = DB_NAME();
IF @CurrentDb IN (N'master', N'model', N'msdb', N'tempdb') OR @CurrentDb NOT LIKE N'HSWRMS%'
BEGIN
    DECLARE @ErrMsg NVARCHAR(400) = N'Refusing to execute migration in unexpected database context ['
        + ISNULL(@CurrentDb, N'NULL')
        + N']. Connect explicitly to the target HSWRMS database (e.g., HSWRMS or HSWRMS_TEST).';
    THROW 50000, @ErrMsg, 1;
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

-- 1. Ensure reminder_status column exists on dbo.SpaSession
IF COL_LENGTH('dbo.SpaSession', 'reminder_status') IS NULL
BEGIN
    ALTER TABLE [dbo].[SpaSession]
        ADD [reminder_status] VARCHAR(20) NULL
            CONSTRAINT [DF_SpaSession_ReminderStatus] DEFAULT ('PENDING');
END;

-- 2. Ensure reminder_claimed_at column exists on dbo.SpaSession
IF COL_LENGTH('dbo.SpaSession', 'reminder_claimed_at') IS NULL
BEGIN
    ALTER TABLE [dbo].[SpaSession]
        ADD [reminder_claimed_at] DATETIME2(0) NULL;
END;

-- 3. Ensure reminder_claim_expires_at column exists on dbo.SpaSession
IF COL_LENGTH('dbo.SpaSession', 'reminder_claim_expires_at') IS NULL
BEGIN
    ALTER TABLE [dbo].[SpaSession]
        ADD [reminder_claim_expires_at] DATETIME2(0) NULL;
END;

-- 4. Ensure reminder_sent_at column exists on dbo.SpaSession
IF COL_LENGTH('dbo.SpaSession', 'reminder_sent_at') IS NULL
BEGIN
    ALTER TABLE [dbo].[SpaSession]
        ADD [reminder_sent_at] DATETIME2(0) NULL;
END;

-- 5. Defensive check for reminder_claim_token (from V008) so index creation is self-contained
IF COL_LENGTH('dbo.SpaSession', 'reminder_claim_token') IS NULL
BEGIN
    ALTER TABLE [dbo].[SpaSession]
        ADD [reminder_claim_token] VARCHAR(64) NULL;
END;

COMMIT TRANSACTION;
GO

-- Separate batch after DDL column additions so SQL Server 2019 resolves new column metadata cleanly
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

-- 6. Backfill NULL reminder_status values consistently with SpaReminderStatus enum
UPDATE [dbo].[SpaSession]
SET [reminder_status] = CASE
    WHEN [reminder_sent_at] IS NOT NULL THEN 'SENT'
    ELSE 'PENDING'
END
WHERE [reminder_status] IS NULL;

-- 7. Enforce CK_SpaSession_ReminderStatus matching SpaReminderStatus.java enum constants
IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.SpaSession')
      AND name = N'CK_SpaSession_ReminderStatus'
)
BEGIN
    ALTER TABLE [dbo].[SpaSession] WITH CHECK
        ADD CONSTRAINT [CK_SpaSession_ReminderStatus]
        CHECK ([reminder_status] IS NULL OR [reminder_status] IN ('PENDING', 'CLAIMED', 'SENT', 'RETRYABLE_FAILURE'));
END;

-- 8. Create supporting nonclustered index for SessionTimelineScheduler T-1h reminder claim queries
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.SpaSession')
      AND name = N'IX_SpaSession_ReminderDue'
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_SpaSession_ReminderDue]
        ON [dbo].[SpaSession] ([session_status], [confirmation_status], [scheduled_start_at])
        INCLUDE ([reminder_status], [reminder_sent_at], [reminder_claim_expires_at], [reminder_claim_token]);
END;

COMMIT TRANSACTION;
GO

-- 9. Reconcile TR_SpaSession_ValidateScheduling so qualification (51001) and room compatibility (51002)
--    only enforce on active scheduling states ('SCHEDULED', 'RESCHEDULING'), matching overlap check (51003).
CREATE OR ALTER TRIGGER [dbo].[TR_SpaSession_ValidateScheduling]
ON [dbo].[SpaSession]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validate therapist qualification for active sessions only
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE i.session_status IN ('SCHEDULED', 'RESCHEDULING')
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.TherapistTreatmentQualification tq
              WHERE tq.therapist_id = i.therapist_id
                AND tq.treatment_id = i.treatment_id
          )
    )
    BEGIN
        THROW 51001, 'Selected therapist is not qualified for the spa treatment.', 1;
    END;

    -- 2. Validate treatment room compatibility for active sessions only
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE i.session_status IN ('SCHEDULED', 'RESCHEDULING')
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.TreatmentRoomCompatibility rc
              WHERE rc.room_id = i.room_id
                AND rc.treatment_id = i.treatment_id
          )
    )
    BEGIN
        THROW 51002, 'Selected treatment room is not compatible with the spa treatment.', 1;
    END;

    -- 3. Validate no overlapping active sessions for the same therapist or room
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.SpaSession s
            ON s.spa_session_id <> i.spa_session_id
           AND s.session_status IN ('SCHEDULED', 'RESCHEDULING')
           AND i.session_status IN ('SCHEDULED', 'RESCHEDULING')
           AND (s.therapist_id = i.therapist_id OR s.room_id = i.room_id)
           AND i.scheduled_start_at < s.scheduled_end_at
           AND s.scheduled_start_at < i.scheduled_end_at
    )
    BEGIN
        THROW 51003, 'Therapist or treatment room already has an overlapping spa session.', 1;
    END;
END;
GO
