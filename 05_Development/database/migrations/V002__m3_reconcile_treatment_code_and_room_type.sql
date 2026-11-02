-- ============================================================================
-- HSWRMS Migration V002: Reconcile treatment_code and room_type fields
-- Idempotent schema evolution for existing database environments.
-- ============================================================================

-- 1. Add treatment_code to dbo.SpaTreatment if not present
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'treatment_code'
)
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD treatment_code VARCHAR(50) NULL;
END
GO

-- 2. Filtered unique index on treatment_code where treatment_code IS NOT NULL
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_SpaTreatment_TreatmentCode'
      AND object_id = OBJECT_ID(N'dbo.SpaTreatment')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_SpaTreatment_TreatmentCode
    ON dbo.SpaTreatment(treatment_code)
    WHERE treatment_code IS NOT NULL;
END
GO

-- 3. Add room_type to dbo.TreatmentRoom if not present
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.TreatmentRoom') AND name = 'room_type'
)
BEGIN
    ALTER TABLE dbo.TreatmentRoom ADD room_type VARCHAR(50) NULL;
END
GO
