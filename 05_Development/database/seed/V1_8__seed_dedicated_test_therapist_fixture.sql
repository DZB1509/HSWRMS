/*
================================================================================
HSWRMS SEED FIXTURE: V1_8__seed_dedicated_test_therapist_fixture.sql
Target: Explicit allowlist of dedicated test databases (HSWRMS_TEST, HSWRMS_DEV_TEST,
        HSWRMS_DISPOSABLE_TEST) on authorized development/test SQL Server instance
        (MYLIFE-MYRULE-1).
Purpose: Dedicated, isolated test therapist fixture decoupling operational
         recovery testing from ROLE_ADMIN (Therapist #2).
Status: HARDENED FIXTURE - Awaiting explicit authorization before execution.
Safety Invariants:
  - Exact dual-identity environment guard: requires BOTH exact database name AND exact instance name.
  - Rejects unknown databases, unknown instances, and production-like configurations.
  - Local [HSWRMS] requires explicit opt-in flag (@AllowLocalDevDbOptIn = 1, default 0).
  - No predictable, known, or login-enabled password (password_hash = NULL).
  - Strict role isolation: rejects assignment to any user with incompatible roles.
  - Full single-transaction wrapping with BEGIN TRY / BEGIN TRANSACTION / COMMIT / ROLLBACK.
  - Uses THROW for all precondition failures; zero silent repair.
  - Zero modification to existing Therapist #1 or Therapist #2.
  - Zero alteration to customer bookings or folios.
================================================================================
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;

-- -----------------------------------------------------------------------------
-- 1. Dual-Identity Environment Guard (Exact Database + Exact SQL Server Instance)
-- -----------------------------------------------------------------------------
-- Default behavior: reject all unknown databases and unknown SQL Server instances.
-- Wildcard matching is strictly prohibited.
-- Execution on the shared local database [HSWRMS] requires an explicit opt-in.
DECLARE @AllowLocalDevDbOptIn BIT = 0; -- REQUIRED OPT-IN: Must remain 0 by default. Never pre-enable.

DECLARE @CurrentDb sysname = DB_NAME();
DECLARE @CurrentServer sysname = CAST(SERVERPROPERTY('ServerName') AS sysname);
DECLARE @CurrentEdition NVARCHAR(128) = CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128));
DECLARE @IsClustered INT = CAST(SERVERPROPERTY('IsClustered') AS INT);
DECLARE @IsHadr INT = CAST(SERVERPROPERTY('IsHadrEnabled') AS INT);

-- Guard Check 1: Refuse SQL Server system databases unconditionally
IF @CurrentDb IN (N'master', N'model', N'msdb', N'tempdb')
BEGIN
    THROW 50000, N'Execution rejected: Cannot execute fixture seed in SQL Server system database context.', 1;
END;

-- Guard Check 2: Exact SQL Server Instance Allowlist Validation
-- Authorized test instances for development: exact machine/instance name.
IF @CurrentServer NOT IN (N'MYLIFE-MYRULE-1')
BEGIN
    DECLARE @InstanceErrMsg NVARCHAR(400) = N'Execution rejected: SQL Server instance ['
        + ISNULL(@CurrentServer, N'NULL')
        + N'] is not in the authorized development/test instance allowlist (MYLIFE-MYRULE-1).';
    THROW 50002, @InstanceErrMsg, 1;
END;

-- Guard Check 3: Reject Production-like or High-Availability Instance Properties
IF @IsClustered = 1 OR @IsHadr = 1 OR (@CurrentEdition NOT LIKE N'%Express%' AND @CurrentEdition NOT LIKE N'%Developer%')
BEGIN
    DECLARE @ProdErrMsg NVARCHAR(400) = N'Execution rejected: Server instance ['
        + ISNULL(@CurrentServer, N'NULL')
        + N'] exhibits production-like characteristics (Clustered, AlwaysOn HADR, or Non-Dev Edition ['
        + ISNULL(@CurrentEdition, N'NULL') + N']). Fixture seed is forbidden.';
    THROW 50004, @ProdErrMsg, 1;
END;

-- Guard Check 4: Exact Database Name Allowlist Validation
IF @CurrentDb IN (N'HSWRMS_TEST', N'HSWRMS_DEV_TEST', N'HSWRMS_DISPOSABLE_TEST')
BEGIN
    -- Authorized dedicated test database target
    PRINT N'[ENVIRONMENT CHECK] Verified authorized dedicated test database [' + @CurrentDb + N'] on authorized instance [' + @CurrentServer + N'].';
END
ELSE IF @CurrentDb = N'HSWRMS'
BEGIN
    -- Controlled opt-in for existing local development database [HSWRMS]
    -- Requirement: explicit opt-in flag must be enabled. Default is 0.
    -- Hardened NULL-safe evaluation: handles 3-valued logic, unset SESSION_CONTEXT, malformed values, and NULLs safely.
    DECLARE @EffectiveOptIn BIT = 0;
    IF ISNULL(@AllowLocalDevDbOptIn, 0) = 1
       OR COALESCE(TRY_CONVERT(INT, SESSION_CONTEXT(N'HSWRMS_ALLOW_V1_8_EXECUTION')), 0) = 1
    BEGIN
        SET @EffectiveOptIn = 1;
    END;

    IF @EffectiveOptIn <> 1
    BEGIN
        DECLARE @OptInMsg NVARCHAR(400) = N'Execution rejected: Target database [HSWRMS] is protected. Seeding V1_8 requires an explicit opt-in flag (@AllowLocalDevDbOptIn = 1 or SESSION_CONTEXT(N''HSWRMS_ALLOW_V1_8_EXECUTION'') = 1) to prevent accidental execution.';
        THROW 50001, @OptInMsg, 1;
    END;

    PRINT N'[ENVIRONMENT CHECK] Verified local development database [HSWRMS] on authorized instance [' + @CurrentServer + N'] with explicit opt-in.';
END
ELSE
BEGIN
    -- Unknown or disallowed database
    DECLARE @DisallowedMsg NVARCHAR(400) = N'Execution rejected: Database ['
        + ISNULL(@CurrentDb, N'NULL')
        + N'] is not in the explicit allowlist (HSWRMS_TEST, HSWRMS_DEV_TEST, HSWRMS_DISPOSABLE_TEST) and cannot be validated as a safe test fixture target.';
    THROW 50003, @DisallowedMsg, 1;
END;

-- -----------------------------------------------------------------------------
-- 2. Transactional Execution Block (Atomic single transaction, no GO boundaries)
-- -----------------------------------------------------------------------------
BEGIN TRY
    BEGIN TRANSACTION;

    -- Constants for expected fixture identity
    DECLARE @ExpectedEmail NVARCHAR(255) = N'therapist.test@heavenstay.dev';
    DECLARE @ExpectedFullName NVARCHAR(150) = N'Dev Test Specialist Chloe';
    DECLARE @ExpectedPhone NVARCHAR(30) = N'+84909999003';
    DECLARE @ExpectedRoleName NVARCHAR(50) = N'THERAPIST';

    -- -------------------------------------------------------------------------
    -- PRECONDITION CHECK 1: Required Schema Tables and Structure Validation
    -- -------------------------------------------------------------------------
    IF OBJECT_ID(N'dbo.[User]', N'U') IS NULL
        THROW 50011, N'Precondition failed: dbo.[User] table does not exist.', 1;

    IF OBJECT_ID(N'dbo.[Role]', N'U') IS NULL
        THROW 50012, N'Precondition failed: dbo.[Role] table does not exist.', 1;

    IF OBJECT_ID(N'dbo.UserRole', N'U') IS NULL
        THROW 50013, N'Precondition failed: dbo.UserRole table does not exist.', 1;

    IF OBJECT_ID(N'dbo.Therapist', N'U') IS NULL
        THROW 50014, N'Precondition failed: dbo.Therapist table does not exist.', 1;

    IF OBJECT_ID(N'dbo.SpaTreatment', N'U') IS NULL
        THROW 50015, N'Precondition failed: dbo.SpaTreatment table does not exist.', 1;

    IF OBJECT_ID(N'dbo.TherapistTreatmentQualification', N'U') IS NULL
        THROW 50016, N'Precondition failed: dbo.TherapistTreatmentQualification table does not exist.', 1;

    -- -------------------------------------------------------------------------
    -- PRECONDITION CHECK 2: Role Existence and Uniqueness
    -- -------------------------------------------------------------------------
    DECLARE @TherapistRoleCount INT;
    DECLARE @TherapistRoleId INT;

    SELECT @TherapistRoleCount = COUNT(*), @TherapistRoleId = MAX(role_id)
    FROM dbo.[Role]
    WHERE role_name = @ExpectedRoleName;

    IF @TherapistRoleCount = 0
        THROW 50020, N'Precondition failed: Role THERAPIST does not exist in dbo.[Role].', 1;

    IF @TherapistRoleCount > 1
        THROW 50021, N'Precondition failed: Role THERAPIST is ambiguous (multiple matching role rows).', 1;

    -- -------------------------------------------------------------------------
    -- PRECONDITION CHECK 3: Baseline Operational Treatments Validation (IDs 1, 2, 3)
    -- -------------------------------------------------------------------------
    DECLARE @ActiveTreatmentCount INT;
    SELECT @ActiveTreatmentCount = COUNT(*)
    FROM dbo.SpaTreatment
    WHERE treatment_id IN (1, 2, 3)
      AND treatment_status = 'ACTIVE';

    IF @ActiveTreatmentCount <> 3
        THROW 50030, N'Precondition failed: Treatments 1, 2, and 3 must exist and be in ACTIVE status.', 1;

    -- -------------------------------------------------------------------------
    -- PRECONDITION CHECK 4: Safety Invariant on Existing Baseline Therapists (#1 and #2)
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Therapist WHERE therapist_id = 1)
        THROW 50040, N'Precondition failed: Existing Therapist #1 is missing from dbo.Therapist.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.Therapist WHERE therapist_id = 2)
        THROW 50041, N'Precondition failed: Existing Therapist #2 is missing from dbo.Therapist.', 1;

    -- -------------------------------------------------------------------------
    -- PRECONDITION CHECK 5: Dedicated Test Phone Number Collision Check
    -- -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM dbo.[User]
        WHERE phone_number = @ExpectedPhone
          AND email <> @ExpectedEmail
    )
        THROW 50050, N'Precondition failed: Phone number +84909999003 is already assigned to a different user account.', 1;

    -- -------------------------------------------------------------------------
    -- IDENTITY CHECK & INSERT: Dedicated Test Fixture User Account
    -- -------------------------------------------------------------------------
    DECLARE @TargetUserId INT = NULL;

    IF EXISTS (SELECT 1 FROM dbo.[User] WHERE email = @ExpectedEmail)
    BEGIN
        -- Verify that existing user matches exact expected fixture identity
        SELECT @TargetUserId = user_id
        FROM dbo.[User]
        WHERE email = @ExpectedEmail;

        DECLARE @ExistingFullName NVARCHAR(150);
        DECLARE @ExistingPhone NVARCHAR(30);

        SELECT @ExistingFullName = full_name, @ExistingPhone = phone_number
        FROM dbo.[User]
        WHERE user_id = @TargetUserId;

        IF @ExistingFullName <> @ExpectedFullName
            THROW 50060, N'Precondition failed: Existing user with email therapist.test@heavenstay.dev has unexpected full_name. Will not overwrite.', 1;

        IF @ExistingPhone <> @ExpectedPhone
            THROW 50061, N'Precondition failed: Existing user with email therapist.test@heavenstay.dev has unexpected phone_number. Will not overwrite.', 1;

        -- Check that existing user does not have any incompatible roles
        IF EXISTS (
            SELECT 1
            FROM dbo.UserRole ur
            INNER JOIN dbo.[Role] r ON ur.role_id = r.role_id
            WHERE ur.user_id = @TargetUserId
              AND r.role_name <> @ExpectedRoleName
        )
            THROW 50062, N'Precondition failed: Existing user possesses incompatible non-THERAPIST roles. Refusing to assign THERAPIST role.', 1;
    END
    ELSE
    BEGIN
        -- Insert new user record:
        -- Protections:
        -- 1. password_hash is NULL (SSO/service-only; no password login allowed; no predictable hash).
        -- 2. account_status is 'ACTIVE' for operational availability in spa roster queries.
        -- 3. email_verified is 1.
        INSERT INTO dbo.[User] (
            full_name,
            email,
            phone_number,
            password_hash,
            account_status,
            email_verified,
            failed_login_count,
            created_at,
            updated_at
        )
        VALUES (
            @ExpectedFullName,
            @ExpectedEmail,
            @ExpectedPhone,
            NULL, -- Password login disabled; no predictable credentials
            'ACTIVE',
            1,
            0,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
        );

        SET @TargetUserId = SCOPE_IDENTITY();
        PRINT N'[FIXTURE SEED] Created dedicated test fixture user ID: ' + CAST(@TargetUserId AS NVARCHAR(10));
    END;

    -- -------------------------------------------------------------------------
    -- ROLE BINDING: Exclusively assign ROLE_THERAPIST
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM dbo.UserRole
        WHERE user_id = @TargetUserId AND role_id = @TherapistRoleId
    )
    BEGIN
        INSERT INTO dbo.UserRole (user_id, role_id, assigned_at)
        VALUES (@TargetUserId, @TherapistRoleId, SYSUTCDATETIME());
        PRINT N'[FIXTURE SEED] Assigned role THERAPIST to user ID: ' + CAST(@TargetUserId AS NVARCHAR(10));
    END;

    -- -------------------------------------------------------------------------
    -- THERAPIST PROFILE: Register in dbo.Therapist
    -- -------------------------------------------------------------------------
    DECLARE @TargetTherapistId INT = NULL;

    SELECT @TargetTherapistId = therapist_id
    FROM dbo.Therapist
    WHERE user_id = @TargetUserId;

    IF @TargetTherapistId IS NULL
    BEGIN
        INSERT INTO dbo.Therapist (user_id, therapist_status)
        VALUES (@TargetUserId, 'ACTIVE');

        SET @TargetTherapistId = SCOPE_IDENTITY();
        PRINT N'[FIXTURE SEED] Created therapist profile ID: ' + CAST(@TargetTherapistId AS NVARCHAR(10));
    END
    ELSE
    BEGIN
        -- Safety check: ensure existing therapist profile is not Therapist 1 or 2
        IF @TargetTherapistId IN (1, 2)
            THROW 50070, N'Safety violation: Fixture user resolved to existing operational Therapist #1 or #2.', 1;

        PRINT N'[FIXTURE SEED] Reusing existing therapist profile ID: ' + CAST(@TargetTherapistId AS NVARCHAR(10));
    END;

    -- -------------------------------------------------------------------------
    -- TREATMENT QUALIFICATIONS: Seed qualifications for Treatments 1, 2, 3
    -- Dynamic column schema verification (do not assume status column exists)
    -- -------------------------------------------------------------------------
    DECLARE @HasQualificationStatusCol BIT = 0;
    IF COL_LENGTH(N'dbo.TherapistTreatmentQualification', N'status') IS NOT NULL
        SET @HasQualificationStatusCol = 1;

    -- Qualification for Treatment 1
    IF NOT EXISTS (
        SELECT 1 FROM dbo.TherapistTreatmentQualification
        WHERE therapist_id = @TargetTherapistId AND treatment_id = 1
    )
    BEGIN
        IF @HasQualificationStatusCol = 1
        BEGIN
            DECLARE @SqlQ1 NVARCHAR(500) = N'INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id, status) VALUES (@tId, 1, ''ACTIVE'')';
            EXEC sp_executesql @SqlQ1, N'@tId INT', @tId = @TargetTherapistId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id)
            VALUES (@TargetTherapistId, 1);
        END;
        PRINT N'[FIXTURE SEED] Qualified Therapist #' + CAST(@TargetTherapistId AS NVARCHAR(10)) + N' for Treatment #1';
    END;

    -- Qualification for Treatment 2
    IF NOT EXISTS (
        SELECT 1 FROM dbo.TherapistTreatmentQualification
        WHERE therapist_id = @TargetTherapistId AND treatment_id = 2
    )
    BEGIN
        IF @HasQualificationStatusCol = 1
        BEGIN
            DECLARE @SqlQ2 NVARCHAR(500) = N'INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id, status) VALUES (@tId, 2, ''ACTIVE'')';
            EXEC sp_executesql @SqlQ2, N'@tId INT', @tId = @TargetTherapistId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id)
            VALUES (@TargetTherapistId, 2);
        END;
        PRINT N'[FIXTURE SEED] Qualified Therapist #' + CAST(@TargetTherapistId AS NVARCHAR(10)) + N' for Treatment #2';
    END;

    -- Qualification for Treatment 3
    IF NOT EXISTS (
        SELECT 1 FROM dbo.TherapistTreatmentQualification
        WHERE therapist_id = @TargetTherapistId AND treatment_id = 3
    )
    BEGIN
        IF @HasQualificationStatusCol = 1
        BEGIN
            DECLARE @SqlQ3 NVARCHAR(500) = N'INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id, status) VALUES (@tId, 3, ''ACTIVE'')';
            EXEC sp_executesql @SqlQ3, N'@tId INT', @tId = @TargetTherapistId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id)
            VALUES (@TargetTherapistId, 3);
        END;
        PRINT N'[FIXTURE SEED] Qualified Therapist #' + CAST(@TargetTherapistId AS NVARCHAR(10)) + N' for Treatment #3';
    END;

    -- -------------------------------------------------------------------------
    -- POST-CONDITION VERIFICATION: Assert fixture integrity before committing
    -- -------------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Therapist WHERE therapist_id = @TargetTherapistId AND therapist_status = 'ACTIVE'
    )
        THROW 50080, N'Post-condition failure: Dedicated therapist is not in ACTIVE operational status.', 1;

    DECLARE @QualifiedCount INT;
    SELECT @QualifiedCount = COUNT(*)
    FROM dbo.TherapistTreatmentQualification
    WHERE therapist_id = @TargetTherapistId AND treatment_id IN (1, 2, 3);

    IF @QualifiedCount <> 3
        THROW 50081, N'Post-condition failure: Dedicated therapist does not possess all 3 required treatment qualifications.', 1;

    COMMIT TRANSACTION;
    PRINT N'[FIXTURE SEED] Successfully committed dedicated test therapist fixture.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
