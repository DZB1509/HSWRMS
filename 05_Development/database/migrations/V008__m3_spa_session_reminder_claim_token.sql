-- ============================================================================
-- HSWRMS Migration V008: M3 Spa Session Reminder Claim Token Schema Evolution
-- Fences concurrent scheduler instances against stale-worker lease overwrites.
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SpaSession') AND name = 'reminder_claim_token'
)
BEGIN
    ALTER TABLE dbo.SpaSession ADD reminder_claim_token VARCHAR(64) NULL;
END
GO

