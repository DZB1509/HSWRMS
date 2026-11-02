-- ============================================================================
-- HSWRMS Migration V001: M3 Spa & Therapy Scheduling Schema Adjustments
-- Idempotent schema evolution for existing database environments.
-- ============================================================================

-- 1. Ensure non-destructive columns on SpaTreatment for rich display
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'description'
)
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD description NVARCHAR(1000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'category'
)
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD category VARCHAR(50) NULL;
END
GO
