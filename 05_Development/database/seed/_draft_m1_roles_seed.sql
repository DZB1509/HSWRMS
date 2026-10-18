/*
================================================================================
HSWRMS - Module 1 (Identity & Access)
Draft Role Seed Data Script: _draft_m1_roles_seed.sql
Target: Microsoft SQL Server (HSWRMS)

Scope:
- Seeds canonical system roles into dbo.[Role].
- IDEMPOTENT: Safe to rerun without creating duplicate role rows.
================================================================================
*/

USE [HSWRMS];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting M1 Role Seed Data Execution...';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = 'CUSTOMER')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES ('CUSTOMER', N'Resort customer: retreat booking, wellness profile, guest folio access');
    PRINT 'Inserted role: CUSTOMER';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = 'RECEPTIONIST')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES ('RECEPTIONIST', N'Front desk officer: arrivals, check-in, residence registration, villa allocation');
    PRINT 'Inserted role: RECEPTIONIST';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = 'THERAPIST')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES ('THERAPIST', N'Spa therapist / yoga instructor: treatment-safety health notes and session outcomes');
    PRINT 'Inserted role: THERAPIST';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = 'FB_STAFF')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES ('FB_STAFF', N'Food & beverage staff / chef: dietary menu filtering, allergy alerts, kitchen orders');
    PRINT 'Inserted role: FB_STAFF';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = 'MANAGER')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES ('MANAGER', N'Resort operations manager: restricted operational dashboards and business analytics');
    PRINT 'Inserted role: MANAGER';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = 'ADMIN')
BEGIN
    INSERT INTO dbo.[Role] (role_name, description)
    VALUES ('ADMIN', N'System administrator: staff management, master data, system parameters, audit governance');
    PRINT 'Inserted role: ADMIN';
END
GO

PRINT 'M1 Role Seed Data Execution completed successfully.';
GO
