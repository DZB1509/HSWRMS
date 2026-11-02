-- ==============================================================================
-- HSWRMS Master Unified Migration (M1 -> M6 Complete Database Synchronization)
-- File: 05_Development/database/migrations/V999__team_unified_m1_to_m6_schema_sync.sql
-- Encoding: UTF-8
-- Idempotency: 100% Idempotent (Safe to run multiple times on any existing HSWRMS database)
-- ==============================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT N'>>> Starting HSWRMS Master Unified Migration (M1 to M6 Synchronization)...';
GO

-- =============================================================================
-- PHẦN 1: M1 — IDENTITY & HEALTH PROFILE
-- =============================================================================
PRINT N'>>> [1/7] Đồng bộ cấu trúc bảng Module 1 (Identity & Health Profile)...';
GO

IF OBJECT_ID('dbo.[User]', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.[User] (
        user_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_User PRIMARY KEY,
        full_name NVARCHAR(150) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone_number NVARCHAR(30) NULL,
        password_hash NVARCHAR(500) NULL,
        account_status VARCHAR(20) NOT NULL CONSTRAINT DF_User_AccountStatus DEFAULT ('PENDING'),
        failed_login_count INT NOT NULL CONSTRAINT DF_User_FailedLoginCount DEFAULT (0),
        locked_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_User_CreatedAt DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_User_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_User_Email UNIQUE (email)
    );
END
GO

IF COL_LENGTH('dbo.[User]', 'password_hash') IS NULL
    ALTER TABLE dbo.[User] ADD password_hash NVARCHAR(500) NULL;
GO
IF COL_LENGTH('dbo.[User]', 'failed_login_count') IS NULL
    ALTER TABLE dbo.[User] ADD failed_login_count INT NOT NULL CONSTRAINT DF_User_FailedLoginCount DEFAULT (0);
GO
IF COL_LENGTH('dbo.[User]', 'locked_at') IS NULL
    ALTER TABLE dbo.[User] ADD locked_at DATETIME2(0) NULL;
GO

IF OBJECT_ID('dbo.AuthIdentity', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthIdentity (
        auth_identity_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuthIdentity PRIMARY KEY,
        user_id INT NOT NULL,
        provider_name VARCHAR(50) NOT NULL,
        provider_user_id NVARCHAR(255) NOT NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_AuthIdentity_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_AuthIdentity_Provider UNIQUE (provider_name, provider_user_id),
        CONSTRAINT FK_AuthIdentity_User FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.[Role]', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.[Role] (
        role_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Role PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL CONSTRAINT UQ_Role_Name UNIQUE,
        description NVARCHAR(255) NULL
    );
END
GO

IF OBJECT_ID('dbo.UserRole', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserRole (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_at DATETIME2(0) NOT NULL CONSTRAINT DF_UserRole_AssignedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_UserRole PRIMARY KEY (user_id, role_id),
        CONSTRAINT FK_UserRole_User FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id) ON DELETE CASCADE,
        CONSTRAINT FK_UserRole_Role FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id)
    );
END
GO

IF OBJECT_ID('dbo.EmailOtp', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailOtp (
        otp_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_EmailOtp PRIMARY KEY,
        email NVARCHAR(255) NOT NULL,
        otp_hash NVARCHAR(500) NOT NULL,
        purpose VARCHAR(30) NOT NULL CONSTRAINT DF_EmailOtp_Purpose DEFAULT ('REGISTER'),
        expires_at DATETIME2(0) NOT NULL,
        consumed_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_EmailOtp_CreatedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID('dbo.CustomerProfile', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CustomerProfile (
        customer_profile_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CustomerProfile PRIMARY KEY,
        user_id INT NOT NULL,
        date_of_birth DATE NULL,
        residential_address NVARCHAR(500) NULL,
        preferred_language VARCHAR(10) NULL CONSTRAINT DF_CustomerProfile_PrefLang DEFAULT ('en'),
        emergency_contact NVARCHAR(300) NULL,
        emergency_contact_name NVARCHAR(255) NULL,
        emergency_contact_phone NVARCHAR(30) NULL,
        emergency_contact_relationship NVARCHAR(100) NULL,
        notification_preference VARCHAR(30) NULL CONSTRAINT DF_CustomerProfile_NotifPref DEFAULT ('ALL'),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_CustomerProfile_CreatedAt DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_CustomerProfile_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_CustomerProfile_User UNIQUE (user_id),
        CONSTRAINT FK_CustomerProfile_User FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id) ON DELETE CASCADE
    );
END
GO

IF COL_LENGTH('dbo.CustomerProfile', 'emergency_contact_name') IS NULL
    ALTER TABLE dbo.CustomerProfile ADD emergency_contact_name NVARCHAR(255) NULL;
GO
IF COL_LENGTH('dbo.CustomerProfile', 'emergency_contact_phone') IS NULL
    ALTER TABLE dbo.CustomerProfile ADD emergency_contact_phone NVARCHAR(30) NULL;
GO
IF COL_LENGTH('dbo.CustomerProfile', 'emergency_contact_relationship') IS NULL
    ALTER TABLE dbo.CustomerProfile ADD emergency_contact_relationship NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.CustomerProfile', 'notification_preference') IS NULL
    ALTER TABLE dbo.CustomerProfile ADD notification_preference VARCHAR(30) NULL CONSTRAINT DF_CustomerProfile_NotifPref DEFAULT ('ALL');
GO

IF OBJECT_ID('dbo.ConsentRecord', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConsentRecord (
        consent_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ConsentRecord PRIMARY KEY,
        user_id INT NOT NULL,
        consent_type VARCHAR(50) NOT NULL,
        is_granted BIT NOT NULL CONSTRAINT DF_ConsentRecord_IsGranted DEFAULT (1),
        granted_at DATETIME2(0) NOT NULL CONSTRAINT DF_ConsentRecord_GrantedAt DEFAULT (SYSUTCDATETIME()),
        withdrawn_at DATETIME2(0) NULL,
        ip_address VARCHAR(45) NULL,
        CONSTRAINT FK_ConsentRecord_User FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.HealthProfile', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HealthProfile (
        health_profile_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HealthProfile PRIMARY KEY,
        customer_profile_id INT NOT NULL,
        medical_notes NVARCHAR(MAX) NULL,
        contraindications NVARCHAR(MAX) NULL,
        mobility_restrictions NVARCHAR(MAX) NULL,
        blood_pressure_status VARCHAR(20) NULL,
        heart_condition BIT NOT NULL CONSTRAINT DF_HealthProfile_HeartCondition DEFAULT (0),
        is_pregnant BIT NOT NULL CONSTRAINT DF_HealthProfile_IsPregnant DEFAULT (0),
        skin_conditions NVARCHAR(MAX) NULL,
        notes NVARCHAR(MAX) NULL,
        last_updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_HealthProfile_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_HealthProfile_Customer UNIQUE (customer_profile_id),
        CONSTRAINT FK_HealthProfile_Customer FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.FoodAllergy', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FoodAllergy (
        allergy_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FoodAllergy PRIMARY KEY,
        health_profile_id INT NOT NULL,
        allergen_name NVARCHAR(100) NOT NULL,
        severity_level VARCHAR(20) NOT NULL CONSTRAINT DF_FoodAllergy_Severity DEFAULT ('MODERATE'),
        reaction_description NVARCHAR(500) NULL,
        CONSTRAINT FK_FoodAllergy_HealthProfile FOREIGN KEY (health_profile_id) REFERENCES dbo.HealthProfile(health_profile_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.DietaryRequirement', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DietaryRequirement (
        dietary_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DietaryRequirement PRIMARY KEY,
        health_profile_id INT NOT NULL,
        requirement_code VARCHAR(50) NOT NULL,
        requirement_name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        CONSTRAINT FK_DietaryRequirement_HealthProfile FOREIGN KEY (health_profile_id) REFERENCES dbo.HealthProfile(health_profile_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.HealthProfileTherapyPreference', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HealthProfileTherapyPreference (
        preference_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HealthProfileTherapyPreference PRIMARY KEY,
        health_profile_id INT NOT NULL,
        preference_type VARCHAR(50) NOT NULL,
        preference_value NVARCHAR(255) NOT NULL,
        CONSTRAINT FK_HPTherapyPref_HealthProfile FOREIGN KEY (health_profile_id) REFERENCES dbo.HealthProfile(health_profile_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.HealthDataDeletionRequest', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HealthDataDeletionRequest (
        deletion_request_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HealthDataDeletionRequest PRIMARY KEY,
        customer_profile_id INT NOT NULL,
        request_type VARCHAR(50) NOT NULL CONSTRAINT DF_HDDR_RequestType DEFAULT ('HEALTH_DATA'),
        status VARCHAR(30) NOT NULL CONSTRAINT DF_HDDR_Status DEFAULT ('PENDING'),
        requested_by_user_id INT NOT NULL,
        rejection_reason NVARCHAR(500) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_HDDR_CreatedAt DEFAULT (SYSUTCDATETIME()),
        processed_at DATETIME2(0) NULL,
        processed_by_user_id INT NULL,
        CONSTRAINT FK_HDDR_CustomerProfile FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id),
        CONSTRAINT FK_HDDR_RequestedUser FOREIGN KEY (requested_by_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT FK_HDDR_ProcessedUser FOREIGN KEY (processed_by_user_id) REFERENCES dbo.[User](user_id)
    );
END
GO

-- =============================================================================
-- PHẦN 2: M2 — RETREAT BOOKING & VILLA INVENTORY
-- =============================================================================
PRINT N'>>> [2/7] Đồng bộ cấu trúc bảng Module 2 (Retreat Booking & Villa Inventory)...';
GO

IF OBJECT_ID('dbo.ResortZone', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResortZone (
        zone_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ResortZone PRIMARY KEY,
        zone_name NVARCHAR(100) NOT NULL,
        landscape_description NVARCHAR(500) NULL,
        villa_count INT NOT NULL CONSTRAINT DF_ResortZone_VillaCount DEFAULT (0),
        villa_category_name NVARCHAR(120) NULL,
        relative_price_tier NVARCHAR(50) NULL,
        operational_advantages NVARCHAR(500) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ResortZone_Created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_ResortZone_Name UNIQUE (zone_name)
    );
END
GO

IF OBJECT_ID('dbo.VillaFunctionalArea', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.VillaFunctionalArea (
        area_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_VillaFunctionalArea PRIMARY KEY,
        category_group NVARCHAR(100) NOT NULL,
        room_name NVARCHAR(100) NOT NULL,
        standard_area_range NVARCHAR(50) NOT NULL,
        villa_1br_allocation NVARCHAR(100) NOT NULL,
        villa_2_3br_allocation NVARCHAR(100) NOT NULL,
        villa_4_7br_allocation NVARCHAR(100) NOT NULL,
        standard_fixtures NVARCHAR(500) NOT NULL,
        architectural_purpose NVARCHAR(500) NOT NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_VillaFunctionalArea_Created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_VillaFunctionalArea_Room UNIQUE (room_name)
    );
END
GO

IF OBJECT_ID('dbo.RetreatPackage', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RetreatPackage (
        retreat_package_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetreatPackage PRIMARY KEY,
        package_code VARCHAR(50) NULL,
        package_name NVARCHAR(150) NOT NULL,
        wellness_goal NVARCHAR(250) NULL,
        duration_nights INT NOT NULL,
        duration_unit NVARCHAR(50) NOT NULL CONSTRAINT DF_RetreatPackage_DurationUnit DEFAULT (N'Đêm (Nights)'),
        base_price DECIMAL(18,2) NOT NULL,
        base_price_unit NVARCHAR(50) NOT NULL CONSTRAINT DF_RetreatPackage_BasePriceUnit DEFAULT (N'VND/khách/gói'),
        included_treatments NVARCHAR(MAX) NULL,
        dietary_plan NVARCHAR(1000) NULL,
        extra_charge_policy NVARCHAR(1000) NULL,
        target_guest NVARCHAR(500) NULL,
        package_status VARCHAR(20) NOT NULL CONSTRAINT DF_RetreatPackage_Status DEFAULT ('ACTIVE'),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_RetreatPackage_CreatedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF COL_LENGTH('dbo.RetreatPackage', 'package_code') IS NULL
    ALTER TABLE dbo.RetreatPackage ADD package_code VARCHAR(50) NULL;
GO
IF COL_LENGTH('dbo.RetreatPackage', 'duration_unit') IS NULL
    ALTER TABLE dbo.RetreatPackage ADD duration_unit NVARCHAR(50) NOT NULL CONSTRAINT DF_RetreatPackage_DurationUnit DEFAULT (N'Đêm (Nights)');
GO
IF COL_LENGTH('dbo.RetreatPackage', 'base_price_unit') IS NULL
    ALTER TABLE dbo.RetreatPackage ADD base_price_unit NVARCHAR(50) NOT NULL CONSTRAINT DF_RetreatPackage_BasePriceUnit DEFAULT (N'VND/khách/gói');
GO
IF COL_LENGTH('dbo.RetreatPackage', 'included_treatments') IS NULL
    ALTER TABLE dbo.RetreatPackage ADD included_treatments NVARCHAR(MAX) NULL;
GO
IF COL_LENGTH('dbo.RetreatPackage', 'dietary_plan') IS NULL
    ALTER TABLE dbo.RetreatPackage ADD dietary_plan NVARCHAR(1000) NULL;
GO
IF COL_LENGTH('dbo.RetreatPackage', 'extra_charge_policy') IS NULL
    ALTER TABLE dbo.RetreatPackage ADD extra_charge_policy NVARCHAR(1000) NULL;
GO
IF COL_LENGTH('dbo.RetreatPackage', 'target_guest') IS NULL
    ALTER TABLE dbo.RetreatPackage ADD target_guest NVARCHAR(500) NULL;
GO

IF OBJECT_ID('dbo.PackageFnBEntitlement', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PackageFnBEntitlement (
        entitlement_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PackageFnBEntitlement PRIMARY KEY,
        retreat_package_id INT NOT NULL,
        breakfast_count INT NOT NULL CONSTRAINT DF_PFnB_Breakfast DEFAULT (0),
        lunch_count INT NOT NULL CONSTRAINT DF_PFnB_Lunch DEFAULT (0),
        dinner_count INT NOT NULL CONSTRAINT DF_PFnB_Dinner DEFAULT (0),
        special_dietary_tier NVARCHAR(100) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_PFnB_Created DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_PFnB_RetreatPackage FOREIGN KEY (retreat_package_id) REFERENCES dbo.RetreatPackage(retreat_package_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.VillaCategory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.VillaCategory (
        villa_category_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_VillaCategory PRIMARY KEY,
        category_name NVARCHAR(120) NOT NULL,
        max_occupancy INT NOT NULL,
        price_modifier DECIMAL(18,2) NOT NULL CONSTRAINT DF_VillaCategory_PriceModifier DEFAULT (0),
        base_price DECIMAL(18,2) NULL CONSTRAINT DF_VillaCategory_BasePrice DEFAULT (3500000),
        inventory_count INT NOT NULL CONSTRAINT DF_VillaCategory_InventoryCount DEFAULT (0),
        bedroom_count INT NOT NULL CONSTRAINT DF_VillaCategory_BedroomCount DEFAULT (1),
        bedroom_description NVARCHAR(100) NULL,
        area_description NVARCHAR(50) NULL,
        has_private_pool BIT NOT NULL CONSTRAINT DF_VillaCategory_HasPrivatePool DEFAULT (0),
        pool_description NVARCHAR(100) NULL,
        features_and_amenities NVARCHAR(500) NULL,
        eligible_packages NVARCHAR(250) NULL,
        category_status VARCHAR(20) NOT NULL CONSTRAINT DF_VillaCategory_Status DEFAULT ('ACTIVE'),
        CONSTRAINT UQ_VillaCategory_Name UNIQUE (category_name)
    );
END
GO

IF COL_LENGTH('dbo.VillaCategory', 'inventory_count') IS NULL
    ALTER TABLE dbo.VillaCategory ADD inventory_count INT NOT NULL CONSTRAINT DF_VillaCategory_InventoryCount DEFAULT (0);
GO
IF COL_LENGTH('dbo.VillaCategory', 'bedroom_count') IS NULL
    ALTER TABLE dbo.VillaCategory ADD bedroom_count INT NOT NULL CONSTRAINT DF_VillaCategory_BedroomCount DEFAULT (1);
GO
IF COL_LENGTH('dbo.VillaCategory', 'bedroom_description') IS NULL
    ALTER TABLE dbo.VillaCategory ADD bedroom_description NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.VillaCategory', 'area_description') IS NULL
    ALTER TABLE dbo.VillaCategory ADD area_description NVARCHAR(50) NULL;
GO
IF COL_LENGTH('dbo.VillaCategory', 'has_private_pool') IS NULL
    ALTER TABLE dbo.VillaCategory ADD has_private_pool BIT NOT NULL CONSTRAINT DF_VillaCategory_HasPrivatePool DEFAULT (0);
GO
IF COL_LENGTH('dbo.VillaCategory', 'pool_description') IS NULL
    ALTER TABLE dbo.VillaCategory ADD pool_description NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.VillaCategory', 'features_and_amenities') IS NULL
    ALTER TABLE dbo.VillaCategory ADD features_and_amenities NVARCHAR(500) NULL;
GO
IF COL_LENGTH('dbo.VillaCategory', 'eligible_packages') IS NULL
    ALTER TABLE dbo.VillaCategory ADD eligible_packages NVARCHAR(250) NULL;
GO

IF OBJECT_ID('dbo.RetreatPackageVillaCategory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RetreatPackageVillaCategory (
        retreat_package_id INT NOT NULL,
        villa_category_id INT NOT NULL,
        is_default BIT NOT NULL CONSTRAINT DF_RPVC_IsDefault DEFAULT (0),
        CONSTRAINT PK_RetreatPackageVillaCategory PRIMARY KEY (retreat_package_id, villa_category_id),
        CONSTRAINT FK_RPVC_Package FOREIGN KEY (retreat_package_id) REFERENCES dbo.RetreatPackage(retreat_package_id) ON DELETE CASCADE,
        CONSTRAINT FK_RPVC_Category FOREIGN KEY (villa_category_id) REFERENCES dbo.VillaCategory(villa_category_id)
    );
END
GO

IF OBJECT_ID('dbo.PhysicalVilla', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PhysicalVilla (
        villa_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PhysicalVilla PRIMARY KEY,
        villa_category_id INT NOT NULL,
        villa_number NVARCHAR(30) NOT NULL,
        floor NVARCHAR(30) NULL,
        zone_name NVARCHAR(100) NULL,
        bedroom_info NVARCHAR(100) NULL,
        max_occupancy INT NOT NULL CONSTRAINT DF_PhysicalVilla_MaxOccupancy DEFAULT (3),
        area_sqm DECIMAL(10,2) NULL,
        nightly_rate DECIMAL(18,2) NULL,
        has_private_pool BIT NOT NULL CONSTRAINT DF_PhysicalVilla_HasPrivatePool DEFAULT (0),
        pool_info NVARCHAR(100) NULL,
        view_and_operational_notes NVARCHAR(500) NULL,
        villa_status VARCHAR(30) NOT NULL CONSTRAINT DF_PhysicalVilla_Status DEFAULT ('AVAILABLE'),
        CONSTRAINT UQ_PhysicalVilla_Number UNIQUE (villa_number),
        CONSTRAINT FK_PhysicalVilla_Category FOREIGN KEY (villa_category_id) REFERENCES dbo.VillaCategory(villa_category_id)
    );
END
GO

IF COL_LENGTH('dbo.PhysicalVilla', 'zone_name') IS NULL
    ALTER TABLE dbo.PhysicalVilla ADD zone_name NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.PhysicalVilla', 'bedroom_info') IS NULL
    ALTER TABLE dbo.PhysicalVilla ADD bedroom_info NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.PhysicalVilla', 'max_occupancy') IS NULL
    ALTER TABLE dbo.PhysicalVilla ADD max_occupancy INT NOT NULL CONSTRAINT DF_PhysicalVilla_MaxOccupancy DEFAULT (3);
GO
IF COL_LENGTH('dbo.PhysicalVilla', 'area_sqm') IS NULL
    ALTER TABLE dbo.PhysicalVilla ADD area_sqm DECIMAL(10,2) NULL;
GO
IF COL_LENGTH('dbo.PhysicalVilla', 'has_private_pool') IS NULL
    ALTER TABLE dbo.PhysicalVilla ADD has_private_pool BIT NOT NULL CONSTRAINT DF_PhysicalVilla_HasPrivatePool DEFAULT (0);
GO
IF COL_LENGTH('dbo.PhysicalVilla', 'pool_info') IS NULL
    ALTER TABLE dbo.PhysicalVilla ADD pool_info NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.PhysicalVilla', 'view_and_operational_notes') IS NULL
    ALTER TABLE dbo.PhysicalVilla ADD view_and_operational_notes NVARCHAR(500) NULL;
GO

IF OBJECT_ID('dbo.RetreatBooking', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RetreatBooking (
        retreat_booking_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetreatBooking PRIMARY KEY,
        customer_profile_id INT NOT NULL,
        retreat_package_id INT NOT NULL,
        requested_villa_category_id INT NOT NULL,
        assigned_villa_id INT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        booking_status VARCHAR(20) NOT NULL CONSTRAINT DF_RetreatBooking_Status DEFAULT ('PENDING'),
        deposit_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_RetreatBooking_Deposit DEFAULT (0),
        total_estimated_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_RetreatBooking_Estimated DEFAULT (0),
        guest_count INT NOT NULL CONSTRAINT DF_RetreatBooking_GuestCount DEFAULT (1),
        special_request NVARCHAR(1000) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_RetreatBooking_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_RetreatBooking_Customer FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id),
        CONSTRAINT FK_RetreatBooking_Package FOREIGN KEY (retreat_package_id) REFERENCES dbo.RetreatPackage(retreat_package_id),
        CONSTRAINT FK_RetreatBooking_Category FOREIGN KEY (requested_villa_category_id) REFERENCES dbo.VillaCategory(villa_category_id),
        CONSTRAINT FK_RetreatBooking_Villa FOREIGN KEY (assigned_villa_id) REFERENCES dbo.PhysicalVilla(villa_id)
    );
END
GO

IF COL_LENGTH('dbo.RetreatBooking', 'guest_count') IS NULL
    ALTER TABLE dbo.RetreatBooking ADD guest_count INT NOT NULL CONSTRAINT DF_RetreatBooking_GuestCount DEFAULT (1);
GO

IF OBJECT_ID('dbo.ResidenceRecord', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ResidenceRecord (
        residence_record_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ResidenceRecord PRIMARY KEY,
        retreat_booking_id INT NOT NULL,
        full_name NVARCHAR(200) NULL,
        date_of_birth DATE NULL,
        identification_number NVARCHAR(100) NOT NULL,
        identification_type NVARCHAR(50) NOT NULL,
        nationality NVARCHAR(100) NULL,
        permanent_address NVARCHAR(500) NULL,
        collected_at DATETIME2(0) NOT NULL CONSTRAINT DF_ResidenceRecord_CollectedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_ResidenceRecord_Booking UNIQUE (retreat_booking_id),
        CONSTRAINT FK_ResidenceRecord_Booking FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id) ON DELETE CASCADE
    );
END
GO

IF COL_LENGTH('dbo.ResidenceRecord', 'full_name') IS NULL
    ALTER TABLE dbo.ResidenceRecord ADD full_name NVARCHAR(200) NULL;
GO
IF COL_LENGTH('dbo.ResidenceRecord', 'date_of_birth') IS NULL
    ALTER TABLE dbo.ResidenceRecord ADD date_of_birth DATE NULL;
GO

-- =============================================================================
-- PHẦN 3: M3 — SPA & THERAPY SCHEDULING
-- =============================================================================
PRINT N'>>> [3/7] Đồng bộ cấu trúc bảng Module 3 (Spa & Therapy Scheduling)...';
GO

IF OBJECT_ID('dbo.RoomTypeMaster', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RoomTypeMaster (
        room_type_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RoomTypeMaster PRIMARY KEY,
        room_type VARCHAR(50) NOT NULL CONSTRAINT UQ_RoomTypeMaster_Type UNIQUE,
        type_name NVARCHAR(100) NOT NULL,
        technical_specs NVARCHAR(500) NULL,
        design_status VARCHAR(20) NOT NULL CONSTRAINT DF_RoomTypeMaster_Status DEFAULT ('ACTIVE'),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_RoomTypeMaster_Created DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID('dbo.TreatmentTypeRoomCompatibility', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TreatmentTypeRoomCompatibility (
        compatibility_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TreatmentTypeRoomCompatibility PRIMARY KEY,
        treatment_id INT NULL,
        room_type VARCHAR(50) NOT NULL,
        required_features NVARCHAR(255) NULL,
        design_status VARCHAR(20) NOT NULL CONSTRAINT DF_TTRC_Status DEFAULT ('ACTIVE')
    );
END
GO

IF OBJECT_ID('dbo.QualificationMaster', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.QualificationMaster (
        qualification_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QualificationMaster PRIMARY KEY,
        qualification_code VARCHAR(50) NOT NULL CONSTRAINT UQ_QualificationMaster_Code UNIQUE,
        qualification_name NVARCHAR(100) NOT NULL,
        baseline_status VARCHAR(20) NOT NULL CONSTRAINT DF_QualificationMaster_Status DEFAULT ('ACTIVE'),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_QualificationMaster_Created DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID('dbo.SpaTreatment', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SpaTreatment (
        treatment_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpaTreatment PRIMARY KEY,
        treatment_code VARCHAR(50) NULL,
        treatment_name NVARCHAR(150) NOT NULL,
        category NVARCHAR(100) NOT NULL,
        duration_minutes INT NOT NULL,
        price DECIMAL(18,2) NOT NULL,
        description NVARCHAR(1000) NULL,
        treatment_status VARCHAR(20) NOT NULL CONSTRAINT DF_SpaTreatment_Status DEFAULT ('ACTIVE'),
        CONSTRAINT UQ_SpaTreatment_Code UNIQUE (treatment_code)
    );
END
GO

IF COL_LENGTH('dbo.SpaTreatment', 'treatment_code') IS NULL
    ALTER TABLE dbo.SpaTreatment ADD treatment_code VARCHAR(50) NULL;
GO

IF OBJECT_ID('dbo.TreatmentRoom', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TreatmentRoom (
        room_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TreatmentRoom PRIMARY KEY,
        room_number NVARCHAR(30) NOT NULL CONSTRAINT UQ_TreatmentRoom_Number UNIQUE,
        room_type VARCHAR(50) NOT NULL,
        floor NVARCHAR(30) NULL,
        room_status VARCHAR(20) NOT NULL CONSTRAINT DF_TreatmentRoom_Status DEFAULT ('AVAILABLE')
    );
END
GO

IF OBJECT_ID('dbo.Therapist', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Therapist (
        therapist_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Therapist PRIMARY KEY,
        user_id INT NOT NULL CONSTRAINT UQ_Therapist_User UNIQUE,
        specialization NVARCHAR(150) NULL,
        daily_max_sessions INT NOT NULL CONSTRAINT DF_Therapist_MaxSessions DEFAULT (4),
        therapist_status VARCHAR(20) NOT NULL CONSTRAINT DF_Therapist_Status DEFAULT ('ACTIVE'),
        CONSTRAINT FK_Therapist_User FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.RetreatPackageSpaTreatment', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RetreatPackageSpaTreatment (
        retreat_package_id INT NOT NULL,
        treatment_id INT NOT NULL,
        quantity INT NOT NULL CONSTRAINT DF_RPST_Quantity DEFAULT (1),
        CONSTRAINT PK_RetreatPackageSpaTreatment PRIMARY KEY (retreat_package_id, treatment_id),
        CONSTRAINT FK_RPST_Package FOREIGN KEY (retreat_package_id) REFERENCES dbo.RetreatPackage(retreat_package_id) ON DELETE CASCADE,
        CONSTRAINT FK_RPST_Treatment FOREIGN KEY (treatment_id) REFERENCES dbo.SpaTreatment(treatment_id)
    );
END
GO

IF OBJECT_ID('dbo.TherapistTreatmentQualification', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TherapistTreatmentQualification (
        therapist_id INT NOT NULL,
        treatment_id INT NOT NULL,
        CONSTRAINT PK_TherapistTreatmentQualification PRIMARY KEY (therapist_id, treatment_id),
        CONSTRAINT FK_TTQ_Therapist FOREIGN KEY (therapist_id) REFERENCES dbo.Therapist(therapist_id) ON DELETE CASCADE,
        CONSTRAINT FK_TTQ_Treatment FOREIGN KEY (treatment_id) REFERENCES dbo.SpaTreatment(treatment_id)
    );
END
GO

IF OBJECT_ID('dbo.TreatmentRoomCompatibility', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TreatmentRoomCompatibility (
        treatment_id INT NOT NULL,
        room_id INT NOT NULL,
        CONSTRAINT PK_TreatmentRoomCompatibility PRIMARY KEY (treatment_id, room_id),
        CONSTRAINT FK_TRC_Treatment FOREIGN KEY (treatment_id) REFERENCES dbo.SpaTreatment(treatment_id) ON DELETE CASCADE,
        CONSTRAINT FK_TRC_Room FOREIGN KEY (room_id) REFERENCES dbo.TreatmentRoom(room_id)
    );
END
GO

IF OBJECT_ID('dbo.SpaSession', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SpaSession (
        spa_session_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpaSession PRIMARY KEY,
        retreat_booking_id INT NOT NULL,
        customer_profile_id INT NOT NULL,
        treatment_id INT NOT NULL,
        therapist_id INT NOT NULL,
        room_id INT NOT NULL,
        session_date DATE NOT NULL,
        start_time TIME(0) NOT NULL,
        end_time TIME(0) NOT NULL,
        session_status VARCHAR(20) NOT NULL CONSTRAINT DF_SpaSession_Status DEFAULT ('CONFIRMED'),
        special_health_notes NVARCHAR(1000) NULL,
        reminder_claim_token NVARCHAR(100) NULL,
        reminder_claimed_at DATETIME2(0) NULL,
        reminder_sent_at DATETIME2(0) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_SpaSession_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_SpaSession_Booking FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id),
        CONSTRAINT FK_SpaSession_Customer FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id),
        CONSTRAINT FK_SpaSession_Treatment FOREIGN KEY (treatment_id) REFERENCES dbo.SpaTreatment(treatment_id),
        CONSTRAINT FK_SpaSession_Therapist FOREIGN KEY (therapist_id) REFERENCES dbo.Therapist(therapist_id),
        CONSTRAINT FK_SpaSession_Room FOREIGN KEY (room_id) REFERENCES dbo.TreatmentRoom(room_id)
    );
END
GO

IF COL_LENGTH('dbo.SpaSession', 'reminder_claim_token') IS NULL
    ALTER TABLE dbo.SpaSession ADD reminder_claim_token NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.SpaSession', 'reminder_claimed_at') IS NULL
    ALTER TABLE dbo.SpaSession ADD reminder_claimed_at DATETIME2(0) NULL;
GO
IF COL_LENGTH('dbo.SpaSession', 'reminder_sent_at') IS NULL
    ALTER TABLE dbo.SpaSession ADD reminder_sent_at DATETIME2(0) NULL;
GO

IF OBJECT_ID('dbo.SpaScheduleHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SpaScheduleHistory (
        history_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpaScheduleHistory PRIMARY KEY,
        spa_session_id INT NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        previous_status VARCHAR(30) NULL,
        new_status VARCHAR(30) NOT NULL,
        changed_by_user_id INT NULL,
        reason NVARCHAR(500) NULL,
        timestamp DATETIME2(0) NOT NULL CONSTRAINT DF_SpaScheduleHistory_Timestamp DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_SpaScheduleHistory_Session FOREIGN KEY (spa_session_id) REFERENCES dbo.SpaSession(spa_session_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.SpaDispatchOutbox', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SpaDispatchOutbox (
        outbox_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SpaDispatchOutbox PRIMARY KEY,
        aggregate_type VARCHAR(50) NOT NULL CONSTRAINT DF_SpaDispatchOutbox_AggType DEFAULT ('SPA_SESSION'),
        aggregate_id VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload NVARCHAR(MAX) NOT NULL,
        status VARCHAR(30) NOT NULL CONSTRAINT DF_SpaDispatchOutbox_Status DEFAULT ('PENDING'),
        retry_count INT NOT NULL CONSTRAINT DF_SpaDispatchOutbox_Retry DEFAULT (0),
        next_attempt_at DATETIME2(0) NOT NULL CONSTRAINT DF_SpaDispatchOutbox_NextAttempt DEFAULT (SYSUTCDATETIME()),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_SpaDispatchOutbox_CreatedAt DEFAULT (SYSUTCDATETIME()),
        processed_at DATETIME2(0) NULL
    );
END
GO

-- =============================================================================
-- PHẦN 4: M4 — DIETARY F&B
-- =============================================================================
PRINT N'>>> [4/7] Đồng bộ cấu trúc bảng Module 4 (Personalized Dietary Dining & F&B)...';
GO

IF OBJECT_ID('dbo.MenuItem', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MenuItem (
        menu_item_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MenuItem PRIMARY KEY,
        item_name NVARCHAR(150) NOT NULL,
        item_code VARCHAR(50) NULL,
        category NVARCHAR(50) NOT NULL,
        price DECIMAL(18,2) NOT NULL,
        dietary_tags NVARCHAR(255) NULL,
        is_available BIT NOT NULL CONSTRAINT DF_MenuItem_IsAvailable DEFAULT (1),
        prep_time_minutes INT NOT NULL CONSTRAINT DF_MenuItem_PrepTime DEFAULT (20),
        description NVARCHAR(500) NULL,
        CONSTRAINT UQ_MenuItem_Code UNIQUE (item_code)
    );
END
GO

IF OBJECT_ID('dbo.Ingredient', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Ingredient (
        ingredient_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Ingredient PRIMARY KEY,
        ingredient_name NVARCHAR(150) NOT NULL CONSTRAINT UQ_Ingredient_Name UNIQUE,
        unit_of_measure NVARCHAR(30) NOT NULL,
        current_stock DECIMAL(18,2) NOT NULL CONSTRAINT DF_Ingredient_CurrentStock DEFAULT (0),
        reorder_threshold DECIMAL(18,2) NOT NULL CONSTRAINT DF_Ingredient_ReorderThreshold DEFAULT (5)
    );
END
GO

IF OBJECT_ID('dbo.MenuItemIngredient', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MenuItemIngredient (
        menu_item_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity_required DECIMAL(18,4) NOT NULL,
        CONSTRAINT PK_MenuItemIngredient PRIMARY KEY (menu_item_id, ingredient_id),
        CONSTRAINT FK_MII_MenuItem FOREIGN KEY (menu_item_id) REFERENCES dbo.MenuItem(menu_item_id) ON DELETE CASCADE,
        CONSTRAINT FK_MII_Ingredient FOREIGN KEY (ingredient_id) REFERENCES dbo.Ingredient(ingredient_id)
    );
END
GO

IF OBJECT_ID('dbo.IngredientBatch', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.IngredientBatch (
        batch_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_IngredientBatch PRIMARY KEY,
        ingredient_id INT NOT NULL,
        batch_number NVARCHAR(100) NOT NULL,
        quantity_received DECIMAL(18,2) NOT NULL,
        quantity_remaining DECIMAL(18,2) NOT NULL,
        received_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        CONSTRAINT FK_IngredientBatch_Ingredient FOREIGN KEY (ingredient_id) REFERENCES dbo.Ingredient(ingredient_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.MealOrder', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MealOrder (
        meal_order_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MealOrder PRIMARY KEY,
        retreat_booking_id INT NOT NULL,
        customer_profile_id INT NOT NULL,
        order_date DATE NOT NULL,
        meal_period VARCHAR(20) NOT NULL,
        order_status VARCHAR(20) NOT NULL CONSTRAINT DF_MealOrder_Status DEFAULT ('SUBMITTED'),
        delivery_location NVARCHAR(100) NULL,
        delivery_villa_number NVARCHAR(30) NULL,
        special_instructions NVARCHAR(1000) NULL,
        allergy_alert NVARCHAR(500) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_MealOrder_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_MealOrder_Booking FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id),
        CONSTRAINT FK_MealOrder_Customer FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id)
    );
END
GO

IF COL_LENGTH('dbo.MealOrder', 'special_instructions') IS NULL
    ALTER TABLE dbo.MealOrder ADD special_instructions NVARCHAR(1000) NULL;
GO
IF COL_LENGTH('dbo.MealOrder', 'allergy_alert') IS NULL
    ALTER TABLE dbo.MealOrder ADD allergy_alert NVARCHAR(500) NULL;
GO

IF OBJECT_ID('dbo.MealOrderItem', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MealOrderItem (
        meal_order_item_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MealOrderItem PRIMARY KEY,
        meal_order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        quantity INT NOT NULL CONSTRAINT DF_MealOrderItem_Quantity DEFAULT (1),
        unit_price DECIMAL(18,2) NOT NULL,
        subtotal DECIMAL(18,2) NOT NULL,
        item_status VARCHAR(20) NOT NULL CONSTRAINT DF_MealOrderItem_Status DEFAULT ('QUEUED'),
        CONSTRAINT FK_MealOrderItem_Order FOREIGN KEY (meal_order_id) REFERENCES dbo.MealOrder(meal_order_id) ON DELETE CASCADE,
        CONSTRAINT FK_MealOrderItem_MenuItem FOREIGN KEY (menu_item_id) REFERENCES dbo.MenuItem(menu_item_id)
    );
END
GO

-- =============================================================================
-- PHẦN 5: M5 — BILLING, PAYMENT & REVIEW
-- =============================================================================
PRINT N'>>> [5/7] Đồng bộ cấu trúc bảng Module 5 (Billing, Folio, Invoices & Reviews)...';
GO

IF OBJECT_ID('dbo.Folio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Folio (
        folio_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Folio PRIMARY KEY,
        retreat_booking_id INT NOT NULL,
        customer_profile_id INT NOT NULL,
        folio_status VARCHAR(20) NOT NULL CONSTRAINT DF_Folio_Status DEFAULT ('OPEN'),
        total_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Folio_Total DEFAULT (0),
        paid_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Folio_Paid DEFAULT (0),
        balance_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Folio_Balance DEFAULT (0),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Folio_CreatedAt DEFAULT (SYSUTCDATETIME()),
        closed_at DATETIME2(0) NULL,
        CONSTRAINT UQ_Folio_Booking UNIQUE (retreat_booking_id),
        CONSTRAINT FK_Folio_Booking FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id),
        CONSTRAINT FK_Folio_Customer FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id)
    );
END
GO

IF OBJECT_ID('dbo.FolioItem', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FolioItem (
        folio_item_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FolioItem PRIMARY KEY,
        folio_id INT NOT NULL,
        service_type VARCHAR(30) NOT NULL,
        source_reference_id INT NULL,
        source_booking_id INT NULL,
        description NVARCHAR(255) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        item_status VARCHAR(20) NOT NULL CONSTRAINT DF_FolioItem_Status DEFAULT ('ACTIVE'),
        posted_at DATETIME2(0) NOT NULL CONSTRAINT DF_FolioItem_PostedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_FolioItem_Folio FOREIGN KEY (folio_id) REFERENCES dbo.Folio(folio_id) ON DELETE CASCADE,
        CONSTRAINT FK_FolioItem_Booking FOREIGN KEY (source_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id)
    );
END
GO

IF COL_LENGTH('dbo.FolioItem', 'source_booking_id') IS NULL
    ALTER TABLE dbo.FolioItem ADD source_booking_id INT NULL;
GO

IF OBJECT_ID('dbo.Invoice', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Invoice (
        invoice_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Invoice PRIMARY KEY,
        folio_id INT NOT NULL,
        invoice_number NVARCHAR(50) NOT NULL CONSTRAINT UQ_Invoice_Number UNIQUE,
        tax_id NVARCHAR(50) NULL,
        subtotal DECIMAL(18,2) NOT NULL,
        tax_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Invoice_Tax DEFAULT (0),
        total_amount DECIMAL(18,2) NOT NULL,
        issued_at DATETIME2(0) NOT NULL CONSTRAINT DF_Invoice_IssuedAt DEFAULT (SYSUTCDATETIME()),
        invoice_status VARCHAR(20) NOT NULL CONSTRAINT DF_Invoice_Status DEFAULT ('PAID'),
        CONSTRAINT FK_Invoice_Folio FOREIGN KEY (folio_id) REFERENCES dbo.Folio(folio_id)
    );
END
GO

IF OBJECT_ID('dbo.PaymentTransaction', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentTransaction (
        transaction_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PaymentTransaction PRIMARY KEY,
        retreat_booking_id INT NULL,
        invoice_id INT NULL,
        payment_type VARCHAR(20) NOT NULL CONSTRAINT DF_PaymentTransaction_Type DEFAULT ('DEPOSIT'),
        payment_method VARCHAR(30) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        payment_status VARCHAR(20) NOT NULL CONSTRAINT DF_PaymentTransaction_Status DEFAULT ('PENDING'),
        transaction_reference NVARCHAR(100) NOT NULL CONSTRAINT UQ_PaymentTransaction_Ref UNIQUE,
        gateway_response NVARCHAR(MAX) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_PaymentTransaction_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_Payment_Booking FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id),
        CONSTRAINT FK_Payment_Invoice FOREIGN KEY (invoice_id) REFERENCES dbo.Invoice(invoice_id)
    );
END
GO

IF OBJECT_ID('dbo.AdjustmentRequest', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdjustmentRequest (
        adjustment_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AdjustmentRequest PRIMARY KEY,
        folio_id INT NOT NULL,
        folio_item_id INT NULL,
        adjustment_type VARCHAR(30) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        reason NVARCHAR(500) NOT NULL,
        requested_by_user_id INT NOT NULL,
        approved_by_user_id INT NULL,
        adjustment_status VARCHAR(20) NOT NULL CONSTRAINT DF_AdjustmentRequest_Status DEFAULT ('PENDING'),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_AdjustmentRequest_CreatedAt DEFAULT (SYSUTCDATETIME()),
        resolved_at DATETIME2(0) NULL,
        CONSTRAINT FK_Adjustment_Folio FOREIGN KEY (folio_id) REFERENCES dbo.Folio(folio_id),
        CONSTRAINT FK_Adjustment_FolioItem FOREIGN KEY (folio_item_id) REFERENCES dbo.FolioItem(folio_item_id),
        CONSTRAINT FK_Adjustment_RequestedUser FOREIGN KEY (requested_by_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT FK_Adjustment_ApprovedUser FOREIGN KEY (approved_by_user_id) REFERENCES dbo.[User](user_id)
    );
END
GO

IF OBJECT_ID('dbo.CreditNote', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CreditNote (
        credit_note_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CreditNote PRIMARY KEY,
        invoice_id INT NOT NULL,
        credit_note_number NVARCHAR(50) NOT NULL CONSTRAINT UQ_CreditNote_Number UNIQUE,
        amount DECIMAL(18,2) NOT NULL,
        reason NVARCHAR(500) NOT NULL,
        issued_at DATETIME2(0) NOT NULL CONSTRAINT DF_CreditNote_IssuedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_CreditNote_Invoice FOREIGN KEY (invoice_id) REFERENCES dbo.Invoice(invoice_id)
    );
END
GO

IF OBJECT_ID('dbo.CustomerReview', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CustomerReview (
        review_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CustomerReview PRIMARY KEY,
        retreat_booking_id INT NOT NULL,
        customer_profile_id INT NOT NULL,
        rating_overall INT NOT NULL CONSTRAINT CK_Review_Overall CHECK (rating_overall BETWEEN 1 AND 5),
        rating_cleanliness INT NULL CONSTRAINT CK_Review_Cleanliness CHECK (rating_cleanliness BETWEEN 1 AND 5),
        rating_service INT NULL CONSTRAINT CK_Review_Service CHECK (rating_service BETWEEN 1 AND 5),
        rating_amenities INT NULL CONSTRAINT CK_Review_Amenities CHECK (rating_amenities BETWEEN 1 AND 5),
        rating_value INT NULL CONSTRAINT CK_Review_Value CHECK (rating_value BETWEEN 1 AND 5),
        review_text NVARCHAR(2000) NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_CustomerReview_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_CustomerReview_Booking UNIQUE (retreat_booking_id),
        CONSTRAINT FK_CustomerReview_Booking FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id),
        CONSTRAINT FK_CustomerReview_Customer FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id)
    );
END
GO

IF COL_LENGTH('dbo.CustomerReview', 'rating_overall') IS NULL
    ALTER TABLE dbo.CustomerReview ADD rating_overall INT NOT NULL CONSTRAINT CK_Review_Overall CHECK (rating_overall BETWEEN 1 AND 5);
GO
IF COL_LENGTH('dbo.CustomerReview', 'rating_cleanliness') IS NULL
    ALTER TABLE dbo.CustomerReview ADD rating_cleanliness INT NULL CONSTRAINT CK_Review_Cleanliness CHECK (rating_cleanliness BETWEEN 1 AND 5);
GO
IF COL_LENGTH('dbo.CustomerReview', 'rating_service') IS NULL
    ALTER TABLE dbo.CustomerReview ADD rating_service INT NULL CONSTRAINT CK_Review_Service CHECK (rating_service BETWEEN 1 AND 5);
GO
IF COL_LENGTH('dbo.CustomerReview', 'rating_amenities') IS NULL
    ALTER TABLE dbo.CustomerReview ADD rating_amenities INT NULL CONSTRAINT CK_Review_Amenities CHECK (rating_amenities BETWEEN 1 AND 5);
GO
IF COL_LENGTH('dbo.CustomerReview', 'rating_value') IS NULL
    ALTER TABLE dbo.CustomerReview ADD rating_value INT NULL CONSTRAINT CK_Review_Value CHECK (rating_value BETWEEN 1 AND 5);
GO

-- =============================================================================
-- PHẦN 6: M6 — ADMIN, GOVERNANCE & AUDIT
-- =============================================================================
PRINT N'>>> [6/7] Đồng bộ cấu trúc bảng Module 6 (Admin, Governance, Delegation & Audit)...';
GO

IF OBJECT_ID('dbo.[Permission]', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.[Permission] (
        permission_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Permission PRIMARY KEY,
        module_or_screen NVARCHAR(100) NOT NULL,
        action_type NVARCHAR(50) NOT NULL,
        is_delegable BIT NOT NULL CONSTRAINT DF_Permission_IsDelegable DEFAULT (0),
        is_admin_only BIT NOT NULL CONSTRAINT DF_Permission_IsAdminOnly DEFAULT (0),
        CONSTRAINT UQ_Permission UNIQUE (module_or_screen, action_type)
    );
END
GO

IF COL_LENGTH('dbo.[Permission]', 'is_delegable') IS NULL
    ALTER TABLE dbo.[Permission] ADD is_delegable BIT NOT NULL CONSTRAINT DF_Permission_IsDelegable DEFAULT (0);
GO
IF COL_LENGTH('dbo.[Permission]', 'is_admin_only') IS NULL
    ALTER TABLE dbo.[Permission] ADD is_admin_only BIT NOT NULL CONSTRAINT DF_Permission_IsAdminOnly DEFAULT (0);
GO

IF OBJECT_ID('dbo.RolePermission', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermission (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        CONSTRAINT PK_RolePermission PRIMARY KEY (role_id, permission_id),
        CONSTRAINT FK_RolePermission_Role FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id) ON DELETE CASCADE,
        CONSTRAINT FK_RolePermission_Permission FOREIGN KEY (permission_id) REFERENCES dbo.[Permission](permission_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.SystemConfiguration', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SystemConfiguration (
        configuration_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SystemConfiguration PRIMARY KEY,
        configuration_type NVARCHAR(50) NOT NULL CONSTRAINT DF_SysConfig_Type DEFAULT ('BUSINESS_PARAMETER'),
        configuration_key NVARCHAR(120) NOT NULL,
        configuration_value NVARCHAR(1000) NULL,
        configuration_status VARCHAR(20) NOT NULL CONSTRAINT DF_SysConfig_Status DEFAULT ('ACTIVE'),
        value_type VARCHAR(20) NOT NULL CONSTRAINT DF_SysConfig_ValueType DEFAULT ('INT'),
        min_value DECIMAL(18,4) NULL,
        max_value DECIMAL(18,4) NULL,
        unit NVARCHAR(40) NULL,
        description NVARCHAR(500) NULL,
        manager_editable BIT NOT NULL CONSTRAINT DF_SysConfig_ManagerEditable DEFAULT (0),
        updated_by_user_id INT NULL,
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_SysConfig_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_SystemConfiguration_Key UNIQUE (configuration_key),
        CONSTRAINT FK_SysConfig_User FOREIGN KEY (updated_by_user_id) REFERENCES dbo.[User](user_id)
    );
END
GO

IF COL_LENGTH('dbo.SystemConfiguration', 'configuration_type') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD configuration_type NVARCHAR(50) NOT NULL CONSTRAINT DF_SysConfig_Type DEFAULT ('BUSINESS_PARAMETER');
GO
IF COL_LENGTH('dbo.SystemConfiguration', 'configuration_status') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD configuration_status VARCHAR(20) NOT NULL CONSTRAINT DF_SysConfig_Status DEFAULT ('ACTIVE');
GO
IF COL_LENGTH('dbo.SystemConfiguration', 'value_type') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD value_type VARCHAR(20) NOT NULL CONSTRAINT DF_SysConfig_ValueType DEFAULT ('INT');
GO
IF COL_LENGTH('dbo.SystemConfiguration', 'min_value') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD min_value DECIMAL(18,4) NULL;
GO
IF COL_LENGTH('dbo.SystemConfiguration', 'max_value') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD max_value DECIMAL(18,4) NULL;
GO
IF COL_LENGTH('dbo.SystemConfiguration', 'unit') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD unit NVARCHAR(40) NULL;
GO
IF COL_LENGTH('dbo.SystemConfiguration', 'description') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD description NVARCHAR(500) NULL;
GO
IF COL_LENGTH('dbo.SystemConfiguration', 'manager_editable') IS NULL
    ALTER TABLE dbo.SystemConfiguration ADD manager_editable BIT NOT NULL CONSTRAINT DF_SysConfig_ManagerEditable DEFAULT (0);
GO

IF OBJECT_ID('dbo.RightDelegation', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RightDelegation (
        delegation_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RightDelegation PRIMARY KEY,
        granted_by_admin_user_id INT NOT NULL,
        received_by_manager_user_id INT NOT NULL,
        valid_from DATETIME2(0) NOT NULL,
        valid_until DATETIME2(0) NOT NULL,
        delegation_status VARCHAR(20) NOT NULL CONSTRAINT DF_RightDelegation_Status DEFAULT ('PENDING'),
        revoked_at DATETIME2(0) NULL,
        revoked_by_admin_user_id INT NULL,
        CONSTRAINT FK_RightDelegation_Admin FOREIGN KEY (granted_by_admin_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT FK_RightDelegation_Manager FOREIGN KEY (received_by_manager_user_id) REFERENCES dbo.[User](user_id)
    );
END
GO

IF COL_LENGTH('dbo.RightDelegation', 'revoked_at') IS NULL
    ALTER TABLE dbo.RightDelegation ADD revoked_at DATETIME2(0) NULL;
GO
IF COL_LENGTH('dbo.RightDelegation', 'revoked_by_admin_user_id') IS NULL
    ALTER TABLE dbo.RightDelegation ADD revoked_by_admin_user_id INT NULL;
GO

IF OBJECT_ID('dbo.RightDelegationPermission', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RightDelegationPermission (
        delegation_id INT NOT NULL,
        permission_id INT NOT NULL,
        CONSTRAINT PK_RightDelegationPermission PRIMARY KEY (delegation_id, permission_id),
        CONSTRAINT FK_RDP_Delegation FOREIGN KEY (delegation_id) REFERENCES dbo.RightDelegation(delegation_id) ON DELETE CASCADE,
        CONSTRAINT FK_RDP_Permission FOREIGN KEY (permission_id) REFERENCES dbo.[Permission](permission_id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID('dbo.AuditLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog (
        audit_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLog PRIMARY KEY,
        user_id INT NULL,
        action_type VARCHAR(50) NOT NULL,
        module_name VARCHAR(50) NOT NULL,
        resource_name VARCHAR(100) NULL,
        resource_id VARCHAR(100) NULL,
        details NVARCHAR(MAX) NULL,
        ip_address VARCHAR(45) NULL,
        timestamp DATETIME2(0) NOT NULL CONSTRAINT DF_AuditLog_Timestamp DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_AuditLog_User FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id)
    );
END
GO

-- =============================================================================
-- PHẦN 7: ESSENTIAL MASTER & CONFIG SEED (IDEMPOTENT)
-- =============================================================================
PRINT N'>>> [7/7] Nạp dữ liệu cấu hình chuẩn & Master Data cốt lõi...';
GO

-- 1. 6 Roles chuẩn
MERGE INTO dbo.[Role] AS target
USING (VALUES
    ('CUSTOMER', N'Khách hàng nghỉ dưỡng cao cấp'),
    ('RECEPTIONIST', N'Nhân viên lễ tân & điều phối lưu trú'),
    ('THERAPIST', N'Kỹ thuật viên & Huấn luyện viên trị liệu Spa'),
    ('FNB_STAFF', N'Nhân viên & Đầu bếp ẩm thực thực dưỡng'),
    ('MANAGER', N'Quản lý vận hành khu nghỉ dưỡng'),
    ('ADMIN', N'Quản trị viên hệ thống tối cao')
) AS source (role_name, description)
ON target.role_name = source.role_name
WHEN NOT MATCHED THEN
    INSERT (role_name, description) VALUES (source.role_name, source.description);
GO

-- 2. Cấu hình hệ thống chuẩn (SystemConfiguration)
MERGE INTO dbo.SystemConfiguration AS target
USING (VALUES
    ('BUSINESS_PARAMETER', 'booking_hold_minutes', '15', 'ACTIVE', 'INT', CAST(5 AS DECIMAL(18,4)), CAST(60 AS DECIMAL(18,4)), N'phút', N'Thời gian giữ chỗ trước khi thanh toán tiền cọc', 1),
    ('BUSINESS_PARAMETER', 'deposit_percentage', '30', 'ACTIVE', 'INT', CAST(10 AS DECIMAL(18,4)), CAST(100 AS DECIMAL(18,4)), N'%', N'Tỷ lệ tiền đặt cọc bắt buộc cho gói nghỉ dưỡng', 1),
    ('BUSINESS_PARAMETER', 'cancellation_window_hours', '48', 'ACTIVE', 'INT', CAST(12 AS DECIMAL(18,4)), CAST(168 AS DECIMAL(18,4)), N'giờ', N'Thời hạn hủy phòng tối thiểu trước check-in để được hoàn cọc', 1),
    ('BUSINESS_PARAMETER', 'refund_percentage', '100', 'ACTIVE', 'INT', CAST(0 AS DECIMAL(18,4)), CAST(100 AS DECIMAL(18,4)), N'%', N'Tỷ lệ hoàn tiền khi hủy hợp lệ', 1),
    ('BUSINESS_PARAMETER', 'vat_rate', '0.08', 'ACTIVE', 'DECIMAL', CAST(0 AS DECIMAL(18,4)), CAST(0.2 AS DECIMAL(18,4)), N'tỷ lệ', N'Thuế suất GTGT áp dụng cho hóa đơn dịch vụ', 0),
    ('BUSINESS_PARAMETER', 'spa_open_time', '08:00', 'ACTIVE', 'STRING', NULL, NULL, N'giờ', N'Giờ mở cửa phục vụ Spa & Trị liệu', 1),
    ('BUSINESS_PARAMETER', 'spa_close_time', '20:00', 'ACTIVE', 'STRING', NULL, NULL, N'giờ', N'Giờ đóng cửa phục vụ Spa & Trị liệu', 1),
    ('BUSINESS_PARAMETER', 'spa_alternative_search_days', '3', 'ACTIVE', 'INT', CAST(1 AS DECIMAL(18,4)), CAST(7 AS DECIMAL(18,4)), N'ngày', N'Số ngày tìm kiếm khung giờ trị liệu thay thế', 1)
) AS source (configuration_type, configuration_key, configuration_value, configuration_status, value_type, min_value, max_value, unit, description, manager_editable)
ON target.configuration_key = source.configuration_key
WHEN MATCHED THEN
    UPDATE SET
        target.configuration_type = source.configuration_type,
        target.configuration_status = source.configuration_status,
        target.description = COALESCE(target.description, source.description),
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (configuration_type, configuration_key, configuration_value, configuration_status, value_type, min_value, max_value, unit, description, manager_editable, updated_at)
    VALUES (source.configuration_type, source.configuration_key, source.configuration_value, source.configuration_status, source.value_type, source.min_value, source.max_value, source.unit, source.description, source.manager_editable, SYSUTCDATETIME());
GO

-- 3. Room Type Master & Compatibility (M3)
IF COL_LENGTH('dbo.RoomTypeMaster', 'room_type') IS NOT NULL
BEGIN
    MERGE INTO dbo.RoomTypeMaster AS target
    USING (VALUES
        ('MASSAGE_STANDARD', N'Phòng Massage Tiêu Chuẩn', N'Phòng trị liệu đơn chuyên sâu', 'ACTIVE'),
        ('HYDROTHERAPY', N'Phòng Thủy Trị Liệu', N'Phòng ngâm khoáng và tắm thảo dược', 'ACTIVE'),
        ('YOGA_STUDIO', N'Phòng Thiền & Yoga', N'Không gian yên tĩnh thanh lọc tâm trí', 'ACTIVE'),
        ('FACIAL_SPECIALIZED', N'Phòng Chăm Sóc Da Mặt', N'Phòng chăm sóc thẩm mỹ tự nhiên', 'ACTIVE')
    ) AS source (room_type, type_name, technical_specs, design_status)
    ON target.room_type = source.room_type
    WHEN NOT MATCHED THEN
        INSERT (room_type, type_name, technical_specs, design_status)
        VALUES (source.room_type, source.type_name, source.technical_specs, source.design_status);
END
GO

-- 4. Resort Zones (M2)
IF COL_LENGTH('dbo.ResortZone', 'zone_name') IS NOT NULL
BEGIN
    MERGE INTO dbo.ResortZone AS target
    USING (VALUES
        (N'Oceanfront Sanctuary', N'Khu vực sát biển với tầm nhìn trọn đại dương', 6, N'Beachfront Pool Villa', N'Diamond VIP', N'Tầm nhìn trực diện biển, lối đi riêng ra bãi cát'),
        (N'Forest & Hillside Enclave', N'Khu biệt thự ẩn mình giữa rừng nguyên sinh', 6, N'Hillside Pool Villa', N'Platinum', N'Yên tĩnh tuyệt đối, bao quanh bởi cây cổ thụ'),
        (N'Botanical Zen Garden', N'Khu vườn thảo dược và cảnh quan thiền tịnh', 6, N'Garden Pool Villa', N'Gold', N'Gần trung tâm Spa & Nhà hàng thực dưỡng')
    ) AS source (zone_name, landscape_description, villa_count, villa_category_name, relative_price_tier, operational_advantages)
    ON target.zone_name = source.zone_name
    WHEN NOT MATCHED THEN
        INSERT (zone_name, landscape_description, villa_count, villa_category_name, relative_price_tier, operational_advantages)
        VALUES (source.zone_name, source.landscape_description, source.villa_count, source.villa_category_name, source.relative_price_tier, source.operational_advantages);
END
GO

PRINT N'>>> Master Unified Migration V999 hoàn tất thành công 100%!';
GO
