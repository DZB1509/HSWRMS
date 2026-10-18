/*
================================================================================
HSWRMS - Module 1 (Health & Dietary Profile, contract §5.3)
Reviewed migration script: _reviewed_m1_health_profile_structured.sql
Target: Microsoft SQL Server (HSWRMS)

Scope:
- Extends dbo.HealthProfile with structured contract §5.3 columns.
- Adds child tables dbo.FoodAllergy, dbo.DietaryRequirement,
  dbo.HealthProfileTherapyPreference with FK + display-order indexes.
- IDEMPOTENT: safe to run multiple times without failure.
- DRAFT ONLY: do NOT execute without DBA/team approval and a backup.
  No migration has been executed as part of this task.
================================================================================
*/

USE [HSWRMS];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting M1 Health Profile structured upgrade (contract 5.3)...';
GO

/* HealthProfile structured columns */
IF COL_LENGTH('dbo.HealthProfile', 'current_health_condition') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile ADD current_health_condition NVARCHAR(MAX) NULL;
    PRINT 'Added dbo.HealthProfile.current_health_condition';
END
GO

IF COL_LENGTH('dbo.HealthProfile', 'injury_surgery_history') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile ADD injury_surgery_history NVARCHAR(MAX) NULL;
    PRINT 'Added dbo.HealthProfile.injury_surgery_history';
END
GO

IF COL_LENGTH('dbo.HealthProfile', 'mobility_joint_notes') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile ADD mobility_joint_notes NVARCHAR(MAX) NULL;
    PRINT 'Added dbo.HealthProfile.mobility_joint_notes';
END
GO

IF COL_LENGTH('dbo.HealthProfile', 'current_medications') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile ADD current_medications NVARCHAR(500) NULL;
    PRINT 'Added dbo.HealthProfile.current_medications';
END
GO

IF COL_LENGTH('dbo.HealthProfile', 'stress_fatigue_level') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile
        ADD stress_fatigue_level VARCHAR(20) NULL
            CONSTRAINT CK_HealthProfile_StressLevel
            CHECK (stress_fatigue_level IN ('mild','moderate','high'));
    PRINT 'Added dbo.HealthProfile.stress_fatigue_level';
END
GO

IF COL_LENGTH('dbo.HealthProfile', 'food_intolerance_notes') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile ADD food_intolerance_notes NVARCHAR(MAX) NULL;
    PRINT 'Added dbo.HealthProfile.food_intolerance_notes';
END
GO

IF COL_LENGTH('dbo.HealthProfile', 'disliked_ingredients') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile ADD disliked_ingredients NVARCHAR(MAX) NULL;
    PRINT 'Added dbo.HealthProfile.disliked_ingredients';
END
GO

IF COL_LENGTH('dbo.HealthProfile', 'kitchen_notes') IS NULL
BEGIN
    ALTER TABLE dbo.HealthProfile ADD kitchen_notes NVARCHAR(MAX) NULL;
    PRINT 'Added dbo.HealthProfile.kitchen_notes';
END
GO

/* Child table: FoodAllergy */
IF OBJECT_ID('dbo.FoodAllergy', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FoodAllergy (
        food_allergy_id  INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_FoodAllergy PRIMARY KEY,
        health_profile_id INT NOT NULL,
        allergen_name     NVARCHAR(120) NOT NULL,
        display_order     INT NOT NULL
            CONSTRAINT DF_FoodAllergy_Order DEFAULT (0),
        CONSTRAINT FK_FoodAllergy_HealthProfile
            FOREIGN KEY (health_profile_id)
            REFERENCES dbo.HealthProfile(health_profile_id) ON DELETE CASCADE
    );
    PRINT 'Created dbo.FoodAllergy';
END
GO

/* Child table: DietaryRequirement */
IF OBJECT_ID('dbo.DietaryRequirement', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DietaryRequirement (
        dietary_requirement_id INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_DietaryRequirement PRIMARY KEY,
        health_profile_id      INT NOT NULL,
        requirement_name       NVARCHAR(120) NOT NULL,
        display_order          INT NOT NULL
            CONSTRAINT DF_DietaryRequirement_Order DEFAULT (0),
        CONSTRAINT FK_DietaryRequirement_HealthProfile
            FOREIGN KEY (health_profile_id)
            REFERENCES dbo.HealthProfile(health_profile_id) ON DELETE CASCADE
    );
    PRINT 'Created dbo.DietaryRequirement';
END
GO

/* Child table: HealthProfileTherapyPreference */
IF OBJECT_ID('dbo.HealthProfileTherapyPreference', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HealthProfileTherapyPreference (
        therapy_preference_id INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_HealthProfileTherapyPreference PRIMARY KEY,
        health_profile_id     INT NOT NULL,
        preference_label      NVARCHAR(120) NOT NULL,
        therapy_code          VARCHAR(40) NULL,
        display_order         INT NOT NULL
            CONSTRAINT DF_TherapyPreference_Order DEFAULT (0),
        CONSTRAINT FK_TherapyPreference_HealthProfile
            FOREIGN KEY (health_profile_id)
            REFERENCES dbo.HealthProfile(health_profile_id) ON DELETE CASCADE
    );
    PRINT 'Created dbo.HealthProfileTherapyPreference';
END
GO

/* Indexes */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FoodAllergy_Profile' AND object_id = OBJECT_ID('dbo.FoodAllergy'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FoodAllergy_Profile ON dbo.FoodAllergy (health_profile_id, display_order);
    PRINT 'Created IX_FoodAllergy_Profile';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DietaryRequirement_Profile' AND object_id = OBJECT_ID('dbo.DietaryRequirement'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_DietaryRequirement_Profile ON dbo.DietaryRequirement (health_profile_id, display_order);
    PRINT 'Created IX_DietaryRequirement_Profile';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TherapyPreference_Profile' AND object_id = OBJECT_ID('dbo.HealthProfileTherapyPreference'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TherapyPreference_Profile ON dbo.HealthProfileTherapyPreference (health_profile_id, display_order);
    PRINT 'Created IX_TherapyPreference_Profile';
END
GO

PRINT 'M1 Health Profile structured upgrade script complete (NOT executed).';
GO
