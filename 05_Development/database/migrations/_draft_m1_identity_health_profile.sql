/*
================================================================================
HSWRMS - Module 1 (Identity & Sensitive Health Profile)
Draft Database Migration Script: _draft_m1_identity_health_profile.sql
Target: Microsoft SQL Server (HSWRMS)

Scope:
- Adds structured CustomerProfile fields (date_of_birth, residential_address,
  preferred_language, structured emergency contact) while preserving legacy
  emergency_contact and notification_preference.
- Adds dbo.EmailOtp table for registration verification and password reset.
- Adds performance indexes on foreign keys and search paths.
- IDEMPOTENT: Safe to run multiple times without failure.
================================================================================
*/

USE [HSWRMS];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting M1 Identity & Health Profile Schema Upgrade...';
GO

/* ============================================================================
   1. UPGRADE dbo.CustomerProfile
   Add missing structured fields required by Screen 7 & Law on Residence 2020
   ============================================================================ */

IF COL_LENGTH('dbo.CustomerProfile', 'date_of_birth') IS NULL
BEGIN
    ALTER TABLE dbo.CustomerProfile
        ADD date_of_birth DATE NULL;
    PRINT 'Added column dbo.CustomerProfile.date_of_birth';
END
GO

IF COL_LENGTH('dbo.CustomerProfile', 'residential_address') IS NULL
BEGIN
    ALTER TABLE dbo.CustomerProfile
        ADD residential_address NVARCHAR(500) NULL;
    PRINT 'Added column dbo.CustomerProfile.residential_address';
END
GO

IF COL_LENGTH('dbo.CustomerProfile', 'preferred_language') IS NULL
BEGIN
    ALTER TABLE dbo.CustomerProfile
        ADD preferred_language VARCHAR(10) NULL
            CONSTRAINT DF_CustomerProfile_PrefLang DEFAULT ('en');
    PRINT 'Added column dbo.CustomerProfile.preferred_language';
END
GO

IF COL_LENGTH('dbo.CustomerProfile', 'emergency_contact_name') IS NULL
BEGIN
    ALTER TABLE dbo.CustomerProfile
        ADD emergency_contact_name NVARCHAR(255) NULL;
    PRINT 'Added column dbo.CustomerProfile.emergency_contact_name';
END
GO

IF COL_LENGTH('dbo.CustomerProfile', 'emergency_contact_phone') IS NULL
BEGIN
    ALTER TABLE dbo.CustomerProfile
        ADD emergency_contact_phone NVARCHAR(50) NULL;
    PRINT 'Added column dbo.CustomerProfile.emergency_contact_phone';
END
GO

IF COL_LENGTH('dbo.CustomerProfile', 'emergency_contact_relationship') IS NULL
BEGIN
    ALTER TABLE dbo.CustomerProfile
        ADD emergency_contact_relationship NVARCHAR(100) NULL;
    PRINT 'Added column dbo.CustomerProfile.emergency_contact_relationship';
END
GO


/* ============================================================================
   2. CREATE dbo.EmailOtp
   Supports registration email verification and secure password reset.
   ============================================================================ */

IF OBJECT_ID('dbo.EmailOtp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailOtp (
        otp_id          INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_EmailOtp PRIMARY KEY,
        user_id         INT NOT NULL,
        otp_hash        VARCHAR(255) NOT NULL,
        purpose         VARCHAR(30) NOT NULL,
        expires_at      DATETIME2(0) NOT NULL,
        consumed        BIT NOT NULL
            CONSTRAINT DF_EmailOtp_Consumed DEFAULT (0),
        consumed_at     DATETIME2(0) NULL,
        attempt_count   INT NOT NULL
            CONSTRAINT DF_EmailOtp_AttemptCount DEFAULT (0),
        created_at      DATETIME2(0) NOT NULL
            CONSTRAINT DF_EmailOtp_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT FK_EmailOtp_User
            FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT CK_EmailOtp_Purpose
            CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
    );
    PRINT 'Created table dbo.EmailOtp';
END
ELSE IF COL_LENGTH('dbo.EmailOtp', 'otp_code') IS NOT NULL AND COL_LENGTH('dbo.EmailOtp', 'otp_hash') IS NULL
BEGIN
    EXEC sp_rename 'dbo.EmailOtp.otp_code', 'otp_hash', 'COLUMN';
    ALTER TABLE dbo.EmailOtp ALTER COLUMN otp_hash VARCHAR(255) NOT NULL;
    PRINT 'Renamed column dbo.EmailOtp.otp_code to otp_hash and resized to VARCHAR(255)';
END
GO


/* ============================================================================
   3. INDEXES FOR M1 PERFORMANCE & INTEGRITY
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CustomerProfile_User' AND object_id = OBJECT_ID('dbo.CustomerProfile'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CustomerProfile_User
        ON dbo.CustomerProfile (user_id);
    PRINT 'Created index IX_CustomerProfile_User';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HealthProfile_Customer' AND object_id = OBJECT_ID('dbo.HealthProfile'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HealthProfile_Customer
        ON dbo.HealthProfile (customer_profile_id);
    PRINT 'Created index IX_HealthProfile_Customer';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsentRecord_User_Type' AND object_id = OBJECT_ID('dbo.ConsentRecord'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ConsentRecord_User_Type
        ON dbo.ConsentRecord (user_id, consent_type);
    PRINT 'Created index IX_ConsentRecord_User_Type';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EmailOtp_User_Purpose_Consumed' AND object_id = OBJECT_ID('dbo.EmailOtp'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_EmailOtp_User_Purpose_Consumed
        ON dbo.EmailOtp (user_id, purpose, consumed, expires_at);
    PRINT 'Created index IX_EmailOtp_User_Purpose_Consumed';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HealthDeletion_RequestedBy' AND object_id = OBJECT_ID('dbo.HealthDataDeletionRequest'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_HealthDeletion_RequestedBy
        ON dbo.HealthDataDeletionRequest (requested_by_user_id, request_status);
    PRINT 'Created index IX_HealthDeletion_RequestedBy';
END
GO

PRINT 'M1 Identity & Health Profile Schema Upgrade completed successfully.';
GO
