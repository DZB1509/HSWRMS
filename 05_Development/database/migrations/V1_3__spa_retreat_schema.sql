/*
================================================================================
HSWRMS Migration V1.3 - Spa Treatments & Retreat Packages Schema Enhancements
Source: 02_Requirement/Screen_Inventory/Goi_Dich_Vu_Spa_Tri_Lieu_HSWRMS.xlsx
Target Database: SQL Server / Azure SQL
================================================================================
*/

USE [HSWRMS];
GO

-- 1. Enhance SpaTreatment Table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'treatment_code')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD treatment_code VARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'category')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD category NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'room_compatibility')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD room_compatibility NVARCHAR(250) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'therapist_qualification')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD therapist_qualification NVARCHAR(250) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'contraindications')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD contraindications NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'description')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD description NVARCHAR(1000) NULL;
END
GO

-- 2. Enhance RetreatPackage Table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'package_code')
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD package_code VARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'included_treatments')
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD included_treatments NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'dietary_plan')
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD dietary_plan NVARCHAR(1000) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'target_guest')
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD target_guest NVARCHAR(500) NULL;
END
GO

-- 3. Enhance TreatmentRoom Table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.TreatmentRoom') AND name = 'room_type')
BEGIN
    ALTER TABLE dbo.TreatmentRoom ADD room_type NVARCHAR(100) NULL;
END
GO

PRINT '>>> Migration V1.3 completed successfully.';
GO
