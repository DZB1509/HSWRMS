/*
================================================================================
HSWRMS Migration V1.2 - Villa Inventory & Resort Physical Layout Schema
Source: 02_Requirement/Screen_Inventory/HSWRMS_Villa_Inventory (1).xlsx
Target Database: SQL Server / Azure SQL
Author: HSWRMS Development Team
Applicable Screens: Screen 20 (Receptionist Dashboard), 
                    Screen 23 (Villa Assignment), 
                    Screen 24 (Villa Status Management),
                    Screen 12 (Master Data Management),
                    Screen 13, 14, 15 (Retreat Packages & Villa Selection)
================================================================================
*/

USE [HSWRMS];
GO

-- 1. Resort Zones Catalog Table
IF OBJECT_ID(N'dbo.ResortZone', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResortZone (
        zone_id                 INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_ResortZone PRIMARY KEY,
        zone_name               NVARCHAR(100) NOT NULL,
        landscape_description   NVARCHAR(500) NULL,
        villa_count             INT NOT NULL CONSTRAINT DF_ResortZone_VillaCount DEFAULT (0),
        villa_category_name     NVARCHAR(120) NULL,
        relative_price_tier     NVARCHAR(50) NULL,
        operational_advantages  NVARCHAR(500) NULL,
        created_at              DATETIME2(0) NOT NULL CONSTRAINT DF_ResortZone_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT UQ_ResortZone_Name UNIQUE (zone_name)
    );
END
GO

-- 2. Villa Category Schema Enhancements (Matching Excel Sheet 2)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'inventory_count')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD inventory_count INT NOT NULL CONSTRAINT DF_VillaCategory_InventoryCount DEFAULT (0);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'bedroom_count')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD bedroom_count INT NOT NULL CONSTRAINT DF_VillaCategory_BedroomCount DEFAULT (1);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'bedroom_description')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD bedroom_description NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'area_description')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD area_description NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'has_private_pool')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD has_private_pool BIT NOT NULL CONSTRAINT DF_VillaCategory_HasPrivatePool DEFAULT (0);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'pool_description')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD pool_description NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'features_and_amenities')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD features_and_amenities NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'eligible_packages')
BEGIN
    ALTER TABLE dbo.VillaCategory ADD eligible_packages NVARCHAR(250) NULL;
END
GO

-- 3. Physical Villa Schema Enhancements (Matching Excel Sheet 1 & Sheet 4)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'zone_name')
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD zone_name NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'bedroom_info')
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD bedroom_info NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'max_occupancy')
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD max_occupancy INT NOT NULL CONSTRAINT DF_PhysicalVilla_MaxOccupancy DEFAULT (3);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'area_sqm')
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD area_sqm DECIMAL(10,2) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'has_private_pool')
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD has_private_pool BIT NOT NULL CONSTRAINT DF_PhysicalVilla_HasPrivatePool DEFAULT (0);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'pool_info')
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD pool_info NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'view_and_operational_notes')
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD view_and_operational_notes NVARCHAR(500) NULL;
END
GO

-- 4. Functional Areas & Room Specifications Catalog (Matching Excel Sheet 3)
IF OBJECT_ID(N'dbo.VillaFunctionalArea', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VillaFunctionalArea (
        functional_area_id          INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_VillaFunctionalArea PRIMARY KEY,
        space_group                 NVARCHAR(100) NOT NULL,
        room_name                   NVARCHAR(150) NOT NULL,
        area_range_sqm              NVARCHAR(50) NULL,
        quantity_in_1br             NVARCHAR(50) NULL,
        quantity_in_2_3br           NVARCHAR(50) NULL,
        quantity_in_estate_4_6br    NVARCHAR(50) NULL,
        key_furnishing              NVARCHAR(500) NULL,
        operational_purpose         NVARCHAR(500) NULL,
        created_at                  DATETIME2(0) NOT NULL CONSTRAINT DF_VillaFunctionalArea_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT UQ_VillaFunctionalArea_Room UNIQUE (room_name)
    );
END
GO

-- 5. Performance Indices for Receptionist Dashboard, Villa Assignment, and Status Management
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'IX_PhysicalVilla_Status_Category')
BEGIN
    CREATE NONCLUSTERED INDEX IX_PhysicalVilla_Status_Category
        ON dbo.PhysicalVilla(villa_status, villa_category_id)
        INCLUDE (villa_number, zone_name, floor, max_occupancy, has_private_pool);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'IX_PhysicalVilla_Zone')
BEGIN
    CREATE NONCLUSTERED INDEX IX_PhysicalVilla_Zone
        ON dbo.PhysicalVilla(zone_name)
        INCLUDE (villa_number, villa_status);
END
GO

PRINT 'HSWRMS V1.2 Villa Inventory & Resort Physical Layout Schema Migration applied successfully.';
GO
