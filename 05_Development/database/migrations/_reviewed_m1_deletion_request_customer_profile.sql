/*
================================================================================
HSWRMS - Module 1 (Health Data Deletion Request, contract §5.4)
Reviewed migration script: _reviewed_m1_deletion_request_customer_profile.sql
Target: Microsoft SQL Server (HSWRMS)

Scope:
- Adds dbo.HealthDataDeletionRequest.customer_profile_id (FK to CustomerProfile)
  per M1 ERD + API_CONTRACT.md §5.4 (replaces the old health_profile_id FK
  to HealthProfile; the old column is retained until a future cleanup).
- Adds dbo.HealthDataDeletionRequest.request_type (contract §5.4, e.g. 'HEALTH_DATA').
- Adds dbo.HealthDataDeletionRequest.updated_at (contract §5.4 response field).
- Backfills customer_profile_id from health_profile_id → HealthProfile → CustomerProfile.
- IDEMPOTENT: safe to run multiple times without failure.
- DRAFT ONLY: do NOT execute without DBA/team approval and a backup.
================================================================================
*/

USE [HSWRMS];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting M1 Health Data Deletion Request customer_profile_id upgrade (contract 5.4)...';
GO

/* --- Add customer_profile_id column (nullable initially for backfill) --- */
IF COL_LENGTH('dbo.HealthDataDeletionRequest', 'customer_profile_id') IS NULL
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest ADD customer_profile_id INT NULL;
    PRINT 'Added dbo.HealthDataDeletionRequest.customer_profile_id';
END
GO

/* --- Add request_type column --- */
IF COL_LENGTH('dbo.HealthDataDeletionRequest', 'request_type') IS NULL
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest ADD request_type VARCHAR(50) NOT NULL
        CONSTRAINT DF_HealthDataDeletionRequest_RequestType DEFAULT ('HEALTH_DATA');
    PRINT 'Added dbo.HealthDataDeletionRequest.request_type';
END
GO

/* --- Add updated_at column --- */
IF COL_LENGTH('dbo.HealthDataDeletionRequest', 'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest ADD updated_at DATETIME2(0) NOT NULL
        CONSTRAINT DF_HealthDataDeletionRequest_UpdatedAt DEFAULT (SYSUTCDATETIME());
    PRINT 'Added dbo.HealthDataDeletionRequest.updated_at';
END
GO

/* --- Backfill customer_profile_id from health_profile_id -> HealthProfile -> CustomerProfile --- */
IF COL_LENGTH('dbo.HealthDataDeletionRequest', 'customer_profile_id') IS NOT NULL
BEGIN
    UPDATE hdr
    SET hdr.customer_profile_id = cp.customer_profile_id
    FROM dbo.HealthDataDeletionRequest hdr
    JOIN dbo.HealthProfile hp ON hdr.health_profile_id = hp.health_profile_id
    JOIN dbo.CustomerProfile cp ON hp.customer_profile_id = cp.customer_profile_id
    WHERE hdr.customer_profile_id IS NULL;
    PRINT 'Backfilled dbo.HealthDataDeletionRequest.customer_profile_id';
END
GO

/* --- Make customer_profile_id NOT NULL after backfill --- */
IF COL_LENGTH('dbo.HealthDataDeletionRequest', 'customer_profile_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest
        ALTER COLUMN customer_profile_id INT NOT NULL;
    PRINT 'Made dbo.HealthDataDeletionRequest.customer_profile_id NOT NULL';
END
GO

/* --- Add FK customer_profile_id -> CustomerProfile --- */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HealthDataDeletionRequest_CustomerProfile'
               AND parent_object_id = OBJECT_ID('dbo.HealthDataDeletionRequest'))
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest
        ADD CONSTRAINT FK_HealthDataDeletionRequest_CustomerProfile
        FOREIGN KEY (customer_profile_id)
        REFERENCES dbo.CustomerProfile(customer_profile_id);
    PRINT 'Added FK_HealthDataDeletionRequest_CustomerProfile';
END
GO

/* --- CHECK constraint on request_type --- */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_HealthDataDeletionRequest_RequestType'
               AND parent_object_id = OBJECT_ID('dbo.HealthDataDeletionRequest'))
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest
        ADD CONSTRAINT CK_HealthDataDeletionRequest_RequestType
        CHECK (request_type IN ('HEALTH_DATA'));
    PRINT 'Added CK_HealthDataDeletionRequest_RequestType';
END
GO

/* --- CHECK constraint on request_status --- */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_HealthDeletion_Status'
               AND parent_object_id = OBJECT_ID('dbo.HealthDataDeletionRequest'))
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest
        ADD CONSTRAINT CK_HealthDeletion_Status
        CHECK (request_status IN ('PENDING', 'DEFERRED', 'COMPLETED', 'CANCELLED'));
    PRINT 'Added CK_HealthDeletion_Status';
END
GO

/* --- Make legacy health_profile_id nullable (entity no longer sets it) --- */
IF COL_LENGTH('dbo.HealthDataDeletionRequest', 'health_profile_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.HealthDataDeletionRequest
        ALTER COLUMN health_profile_id INT NULL;
    PRINT 'Made dbo.HealthDataDeletionRequest.health_profile_id nullable';
END
GO

PRINT 'M1 Health Data Deletion Request customer_profile_id upgrade script complete (NOT executed).';
GO