/*
================================================================================
HSWRMS - Module 3 (Spa & Wellness Scheduling) / Module 6 (Master Data)
Migration Script: V1_5__remove_duration_unit_from_spa_treatment.sql
Target: Microsoft SQL Server (HSWRMS)

Rationale:
- Algorithm for automated spa scheduling in M3 strictly requires duration to be
  normalized to minutes (duration_minutes) as the sole single unit of measurement
  for time arithmetic and therapist/room slot allocation.
- Drops the redundant column 'duration_unit' from dbo.SpaTreatment.
================================================================================
*/

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
GO

PRINT 'Starting V1.5 Migration: Remove duration_unit from dbo.SpaTreatment...';
GO

IF EXISTS (
    SELECT 1 
    FROM sys.default_constraints d 
    JOIN sys.columns c 
      ON d.parent_object_id = c.object_id 
     AND d.parent_column_id = c.column_id 
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.SpaTreatment') 
      AND c.name = 'duration_unit'
)
BEGIN
    ALTER TABLE dbo.SpaTreatment DROP CONSTRAINT DF_SpaTreatment_DurationUnit;
    PRINT 'Dropped default constraint DF_SpaTreatment_DurationUnit';
END
GO

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') 
      AND name = 'duration_unit'
)
BEGIN
    ALTER TABLE dbo.SpaTreatment DROP COLUMN duration_unit;
    PRINT 'Dropped column duration_unit from dbo.SpaTreatment';
END
GO

PRINT 'V1.5 Migration completed successfully.';
GO
