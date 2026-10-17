/*
================================================================================
HSWRMS Migration V1.4 - Spa Treatments & Retreat Packages V3 Standardization
Source: 02_Requirement/Screen_Inventory/HSWRMS_Goi_Spa_Tri_Lieu_Chuan_Hoa_v3.xlsx
Target Database: Microsoft SQL Server (HSWRMS)
================================================================================
*/

USE [HSWRMS];
GO

SET NOCOUNT ON;
GO

PRINT '>>> Starting Migration V1.4 (Spa & Retreat Packages V3 Standardization)...';
GO

-- 1. Enhance RetreatPackage Table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'duration_unit')
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD duration_unit NVARCHAR(50) NOT NULL CONSTRAINT DF_RetreatPackage_DurationUnit DEFAULT (N'Đêm (Nights)');
    PRINT 'Added duration_unit to RetreatPackage';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'base_price_unit')
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD base_price_unit NVARCHAR(50) NOT NULL CONSTRAINT DF_RetreatPackage_BasePriceUnit DEFAULT (N'VND/khách/gói');
    PRINT 'Added base_price_unit to RetreatPackage';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'extra_charge_policy')
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD extra_charge_policy NVARCHAR(1000) NULL;
    PRINT 'Added extra_charge_policy to RetreatPackage';
END
GO

-- 2. Enhance SpaTreatment Table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'pricing_rule')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD pricing_rule NVARCHAR(500) NULL;
    PRINT 'Added pricing_rule to SpaTreatment';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'precautions')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD precautions NVARCHAR(500) NULL;
    PRINT 'Added precautions to SpaTreatment';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'duration_unit')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD duration_unit NVARCHAR(50) NOT NULL CONSTRAINT DF_SpaTreatment_DurationUnit DEFAULT (N'Phút (Minutes)');
    PRINT 'Added duration_unit to SpaTreatment';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.SpaTreatment') AND name = 'required_qualification_code')
BEGIN
    ALTER TABLE dbo.SpaTreatment ADD required_qualification_code VARCHAR(100) NULL;
    PRINT 'Added required_qualification_code to SpaTreatment';
END
GO

-- 3. Enhance RetreatPackageSpaTreatment Table (Add included_sessions, entitlement_status, notes)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment') AND name = 'included_sessions')
BEGIN
    ALTER TABLE dbo.RetreatPackageSpaTreatment ADD included_sessions INT NOT NULL CONSTRAINT DF_RPST_IncludedSessions DEFAULT (1);
    PRINT 'Added included_sessions to RetreatPackageSpaTreatment';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment') AND name = 'entitlement_status')
BEGIN
    ALTER TABLE dbo.RetreatPackageSpaTreatment ADD entitlement_status VARCHAR(50) NOT NULL CONSTRAINT DF_RPST_EntitlementStatus DEFAULT ('INCLUDED');
    PRINT 'Added entitlement_status to RetreatPackageSpaTreatment';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment') AND name = 'notes')
BEGIN
    ALTER TABLE dbo.RetreatPackageSpaTreatment ADD notes NVARCHAR(500) NULL;
    PRINT 'Added notes to RetreatPackageSpaTreatment';
END
GO

-- 4. Create PackageFnBEntitlement Table (Sheet 5)
IF OBJECT_ID(N'dbo.PackageFnBEntitlement', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PackageFnBEntitlement (
        entitlement_id      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PackageFnBEntitlement PRIMARY KEY,
        retreat_package_id  INT NOT NULL,
        breakfast_count     INT NOT NULL CONSTRAINT DF_PFnB_Breakfast DEFAULT (0),
        lunch_count         INT NOT NULL CONSTRAINT DF_PFnB_Lunch DEFAULT (0),
        dinner_count        INT NOT NULL CONSTRAINT DF_PFnB_Dinner DEFAULT (0),
        total_meals         INT NOT NULL CONSTRAINT DF_PFnB_TotalMeals DEFAULT (0),
        menu_plan           NVARCHAR(250) NULL,
        dietary_notes       NVARCHAR(500) NULL,
        entitlement_status  VARCHAR(50) NOT NULL CONSTRAINT DF_PFnB_Status DEFAULT ('APPROVED'),
        created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_PFnB_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT FK_PFnB_RetreatPackage FOREIGN KEY (retreat_package_id) REFERENCES dbo.RetreatPackage(retreat_package_id) ON DELETE CASCADE,
        CONSTRAINT UQ_PFnB_Package UNIQUE (retreat_package_id)
    );
    PRINT 'Created table PackageFnBEntitlement';
END
GO

-- 5. Create RoomTypeMaster Table (Sheet 6 - Table A)
IF OBJECT_ID(N'dbo.RoomTypeMaster', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RoomTypeMaster (
        room_type_id        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RoomTypeMaster PRIMARY KEY,
        room_type           VARCHAR(50) NOT NULL,
        type_name           NVARCHAR(150) NOT NULL,
        technical_specs     NVARCHAR(500) NULL,
        design_status       VARCHAR(50) NOT NULL CONSTRAINT DF_RTM_Status DEFAULT ('DESIGN_APPROVED'),
        created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_RTM_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT UQ_RoomTypeMaster_Code UNIQUE (room_type)
    );
    PRINT 'Created table RoomTypeMaster';
END
GO

-- 6. Create TreatmentTypeRoomCompatibility Table (Sheet 6 - Table C)
IF OBJECT_ID(N'dbo.TreatmentTypeRoomCompatibility', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TreatmentTypeRoomCompatibility (
        compatibility_id    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TreatmentTypeRoomCompat PRIMARY KEY,
        treatment_id        INT NOT NULL,
        room_type           VARCHAR(50) NOT NULL,
        required_features   NVARCHAR(250) NULL,
        design_status       VARCHAR(50) NOT NULL CONSTRAINT DF_TTRC_Status DEFAULT ('DESIGN_APPROVED'),

        CONSTRAINT FK_TTRC_Treatment FOREIGN KEY (treatment_id) REFERENCES dbo.SpaTreatment(treatment_id) ON DELETE CASCADE,
        CONSTRAINT UQ_TTRC_Treatment_RoomType UNIQUE (treatment_id, room_type)
    );
    PRINT 'Created table TreatmentTypeRoomCompatibility';
END
GO

-- 7. Create QualificationMaster Table (Sheet 7 - Table A)
IF OBJECT_ID(N'dbo.QualificationMaster', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.QualificationMaster (
        qualification_id    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QualificationMaster PRIMARY KEY,
        qualification_code  VARCHAR(100) NOT NULL,
        qualification_name  NVARCHAR(200) NOT NULL,
        baseline_status     VARCHAR(50) NOT NULL CONSTRAINT DF_QM_Status DEFAULT ('DESIGN_APPROVED'),
        created_at          DATETIME2(0) NOT NULL CONSTRAINT DF_QM_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT UQ_QualificationMaster_Code UNIQUE (qualification_code)
    );
    PRINT 'Created table QualificationMaster';
END
GO

PRINT '>>> Migration V1.4 completed successfully!';
GO
