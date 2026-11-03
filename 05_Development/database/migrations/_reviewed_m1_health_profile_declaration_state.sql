/*
================================================================================
HSWRMS - Module 1 (Health & Dietary Profile, contract 5.3)
Reviewed migration script: _reviewed_m1_health_profile_declaration_state.sql
Target: Microsoft SQL Server (HSWRMS / HSWRMS_TEST)

Scope (ADDITIVE ONLY):
- Extends dbo.HealthProfile with declaration-state + completion columns used by
  M1 declaration/completion business rules:
    * allergies_declaration_state             VARCHAR(20) NOT NULL DEFAULT 'NOT_DECLARED'
    * dietary_requirements_declaration_state  VARCHAR(20) NOT NULL DEFAULT 'NOT_DECLARED'
    * is_complete                             BIT         NOT NULL DEFAULT 0
- Adds CHECK constraints restricting declaration states to
  ('NOT_DECLARED','EXPLICITLY_NONE','DECLARED').

Properties:
- IDEMPOTENT: guarded by COL_LENGTH / OBJECT_ID / sys.check_constraints checks;
  safe to run multiple times.
- ADDITIVE + SAFE: existing rows are backfilled with the declared defaults
  (NOT_DECLARED / 0); no data is deleted or rewritten.
- MANUAL, DBA-APPROVED ONLY: this is NOT an automatically executed migration.
  The backend does not run Flyway/Liquibase, so a DBA must review and execute
  this script manually (after a backup) against an existing HSWRMS database.
  No migration is executed as part of authoring this file.
================================================================================
*/

-- Database-context-neutral guard: never switch databases implicitly; validate target.
DECLARE @CurrentDb sysname = DB_NAME();
IF @CurrentDb IN (N'master', N'model', N'msdb', N'tempdb') OR @CurrentDb NOT LIKE N'HSWRMS%'
BEGIN
    DECLARE @ErrMsg NVARCHAR(400) = N'Refusing to execute migration in unexpected database context ['
        + ISNULL(@CurrentDb, N'NULL')
        + N']. Connect explicitly to the target HSWRMS database (e.g., HSWRMS or HSWRMS_TEST).';
    THROW 50000, @ErrMsg, 1;
END
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.HealthProfile', N'U') IS NULL
BEGIN
    ;THROW 51030, 'HSWRMS M1 declaration-state upgrade requires dbo.HealthProfile. Provision the baseline schema.sql first.', 1;
END
GO

PRINT 'Starting M1 Health Profile declaration-state upgrade (contract 5.3)...';
GO

/* allergies_declaration_state */
IF COL_LENGTH(N'dbo.HealthProfile', N'allergies_declaration_state') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile
        ADD allergies_declaration_state VARCHAR(20) NOT NULL
            CONSTRAINT DF_HealthProfile_AllergiesDeclState DEFAULT ('NOT_DECLARED');
    PRINT 'Added dbo.HealthProfile.allergies_declaration_state';
END
GO

/* dietary_requirements_declaration_state */
IF COL_LENGTH(N'dbo.HealthProfile', N'dietary_requirements_declaration_state') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile
        ADD dietary_requirements_declaration_state VARCHAR(20) NOT NULL
            CONSTRAINT DF_HealthProfile_DietaryDeclState DEFAULT ('NOT_DECLARED');
    PRINT 'Added dbo.HealthProfile.dietary_requirements_declaration_state';
END
GO

/* is_complete */
IF COL_LENGTH(N'dbo.HealthProfile', N'is_complete') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile
        ADD is_complete BIT NOT NULL
            CONSTRAINT DF_HealthProfile_IsComplete DEFAULT (0);
    PRINT 'Added dbo.HealthProfile.is_complete';
END
GO

/* CHECK constraint: allergies_declaration_state */
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_HealthProfile_AllergiesDeclState'
      AND parent_object_id = OBJECT_ID(N'dbo.HealthProfile')
)
BEGIN
    ALTER TABLE dbo.HealthProfile
        ADD CONSTRAINT CK_HealthProfile_AllergiesDeclState
            CHECK (allergies_declaration_state IN ('NOT_DECLARED','EXPLICITLY_NONE','DECLARED'));
    PRINT 'Added CK_HealthProfile_AllergiesDeclState';
END
GO

/* CHECK constraint: dietary_requirements_declaration_state */
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_HealthProfile_DietaryDeclState'
      AND parent_object_id = OBJECT_ID(N'dbo.HealthProfile')
)
BEGIN
    ALTER TABLE dbo.HealthProfile
        ADD CONSTRAINT CK_HealthProfile_DietaryDeclState
            CHECK (dietary_requirements_declaration_state IN ('NOT_DECLARED','EXPLICITLY_NONE','DECLARED'));
    PRINT 'Added CK_HealthProfile_DietaryDeclState';
END
GO

PRINT 'M1 Health Profile declaration-state upgrade script complete (NOT executed).';
GO
