-- ============================================================================
-- HSWRMS Migration V015: M3 Spa Session Reminder & Calendar Columns
-- Adds the SpaSession columns mapped by the SpaSession entity and used by
-- SessionTimelineScheduler, which no earlier migration created.
-- Idempotent: every column is added only if it does not already exist.
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'reminder_status')
BEGIN
    ALTER TABLE dbo.SpaSession ADD reminder_status VARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'reminder_claimed_at')
BEGIN
    ALTER TABLE dbo.SpaSession ADD reminder_claimed_at DATETIME2(0) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'reminder_claim_expires_at')
BEGIN
    ALTER TABLE dbo.SpaSession ADD reminder_claim_expires_at DATETIME2(0) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'reminder_claim_token')
BEGIN
    ALTER TABLE dbo.SpaSession ADD reminder_claim_token VARCHAR(64) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'reminder_sent_at')
BEGIN
    ALTER TABLE dbo.SpaSession ADD reminder_sent_at DATETIME2(0) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'external_calendar_event_id')
BEGIN
    ALTER TABLE dbo.SpaSession ADD external_calendar_event_id VARCHAR(255) NULL;
END
GO
