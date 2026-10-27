-- Migration: Add optional full_name and date_of_birth to ResidenceRecord for one-way front-desk residence declaration (Luật Cư trú 2020)
IF COL_LENGTH('dbo.ResidenceRecord', 'full_name') IS NULL
    ALTER TABLE dbo.ResidenceRecord ADD full_name NVARCHAR(200) NULL;

IF COL_LENGTH('dbo.ResidenceRecord', 'date_of_birth') IS NULL
    ALTER TABLE dbo.ResidenceRecord ADD date_of_birth DATE NULL;
