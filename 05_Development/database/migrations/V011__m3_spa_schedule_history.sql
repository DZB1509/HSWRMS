-- ============================================================================
-- HSWRMS Migration V011: M3 Spa Schedule History & Calendar Sync Schema
-- Supports BR-M3-14 immutable persistent audit trail of accepted schedule changes.
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID(N'dbo.SpaScheduleHistory')
)
BEGIN
    CREATE TABLE dbo.SpaScheduleHistory (
        history_id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpaScheduleHistory PRIMARY KEY,
        session_id              BIGINT NOT NULL,
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
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'dbo.SpaScheduleHistory') AND name = N'IX_SpaScheduleHistory_session_id'
)
BEGIN
    CREATE INDEX IX_SpaScheduleHistory_session_id ON dbo.SpaScheduleHistory (session_id);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'external_calendar_event_id'
)
BEGIN
    ALTER TABLE dbo.SpaSession ADD external_calendar_event_id VARCHAR(255) NULL;
END;
GO

