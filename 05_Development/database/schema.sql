/*
================================================================================
HSWRMS - HeavenStay Wellness Resort Management System
SQL Server Database Schema
Derived from the current Master Conceptual ERD and SRS business rules.

IMPORTANT:
- The conceptual ERD intentionally omits FK attributes and junction entities.
- A real relational database requires foreign keys and bridge tables, so this
  script introduces them at the logical/physical level.
- Core M3 rule enforced here:
  + Spa session must use a qualified Therapist and compatible Treatment Room.
  + Overlapping Therapist/Room reservations are rejected.
  + session_status and confirmation_status are separate.
================================================================================
*/

USE [master];
GO

IF DB_ID(N'HSWRMS') IS NULL
BEGIN
    CREATE DATABASE [HSWRMS];
END
GO

USE [HSWRMS];
GO

/* ============================================================================
   1. IDENTITY / ACCESS
   ============================================================================ */

CREATE TABLE dbo.[User] (
    user_id             INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_User PRIMARY KEY,
    full_name           NVARCHAR(150) NOT NULL,
    email               NVARCHAR(255) NOT NULL,
    phone_number        NVARCHAR(30) NULL,
    password_hash       NVARCHAR(500) NULL, -- required for email/password login; NULL allowed for SSO-only account
    account_status      VARCHAR(20) NOT NULL
        CONSTRAINT DF_User_AccountStatus DEFAULT ('PENDING'),
    email_verified      BIT NOT NULL
        CONSTRAINT DF_User_EmailVerified DEFAULT (0),
    failed_login_count  INT NOT NULL
        CONSTRAINT DF_User_FailedLoginCount DEFAULT (0),
    locked_at           DATETIME2(0) NULL,
    last_login_at       DATETIME2(0) NULL,
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_User_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updated_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_User_UpdatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_User_Email UNIQUE (email),
    CONSTRAINT CK_User_AccountStatus
        CHECK (account_status IN ('PENDING','ACTIVE','INACTIVE','LOCKED'))
);
GO

CREATE TABLE dbo.AuthIdentity (
    auth_identity_id    INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_AuthIdentity PRIMARY KEY,
    user_id             INT NOT NULL,
    provider            VARCHAR(30) NOT NULL,
    provider_subject    NVARCHAR(255) NOT NULL,
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_AuthIdentity_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_AuthIdentity_User
        FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id),
    CONSTRAINT UQ_AuthIdentity_ProviderSubject
        UNIQUE (provider, provider_subject)
);
GO

CREATE TABLE dbo.[Role] (
    role_id             INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Role PRIMARY KEY,
    role_name           NVARCHAR(50) NOT NULL,
    description         NVARCHAR(500) NULL,

    CONSTRAINT UQ_Role_Name UNIQUE (role_name)
);
GO

/* Logical bridge required by relational implementation. */
CREATE TABLE dbo.UserRole (
    user_id             INT NOT NULL,
    role_id             INT NOT NULL,
    assigned_at         DATETIME2(0) NOT NULL
        CONSTRAINT DF_UserRole_AssignedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_UserRole PRIMARY KEY (user_id, role_id),
    CONSTRAINT FK_UserRole_User
        FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id),
    CONSTRAINT FK_UserRole_Role
        FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id)
);
GO

CREATE TABLE dbo.EmailOtp (
    otp_id              INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_EmailOtp PRIMARY KEY,
    user_id             INT NOT NULL,
    otp_hash            VARCHAR(255) NOT NULL,
    purpose             VARCHAR(30) NOT NULL,
    expires_at          DATETIME2(0) NOT NULL,
    consumed            BIT NOT NULL
        CONSTRAINT DF_EmailOtp_Consumed DEFAULT (0),
    consumed_at         DATETIME2(0) NULL,
    attempt_count       INT NOT NULL
        CONSTRAINT DF_EmailOtp_AttemptCount DEFAULT (0),
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_EmailOtp_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_EmailOtp_User
        FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id),
    CONSTRAINT CK_EmailOtp_Purpose
        CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);
GO


/* ============================================================================
   2. CUSTOMER / HEALTH / CONSENT
   ============================================================================ */

CREATE TABLE dbo.CustomerProfile (
    customer_profile_id     INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_CustomerProfile PRIMARY KEY,
    user_id                 INT NOT NULL,
    date_of_birth           DATE NULL,
    residential_address     NVARCHAR(500) NULL,
    preferred_language      VARCHAR(10) NULL
        CONSTRAINT DF_CustomerProfile_PrefLang DEFAULT ('en'),
    emergency_contact       NVARCHAR(300) NULL, -- legacy unstructured contact
    emergency_contact_name  NVARCHAR(255) NULL,
    emergency_contact_phone NVARCHAR(50) NULL,
    emergency_contact_relationship NVARCHAR(100) NULL,
    notification_preference NVARCHAR(100) NULL,
    created_at              DATETIME2(0) NOT NULL
        CONSTRAINT DF_CustomerProfile_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0) NOT NULL
        CONSTRAINT DF_CustomerProfile_UpdatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_CustomerProfile_User UNIQUE (user_id),
    CONSTRAINT FK_CustomerProfile_User
        FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id)
);
GO

CREATE TABLE dbo.ConsentRecord (
    consent_id          INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_ConsentRecord PRIMARY KEY,
    user_id             INT NOT NULL,
    consent_type        NVARCHAR(80) NOT NULL,
    consent_status      VARCHAR(20) NOT NULL,
    policy_version      NVARCHAR(50) NOT NULL,
    granted_at          DATETIME2(0) NULL,
    revoked_at          DATETIME2(0) NULL,

    CONSTRAINT FK_ConsentRecord_User
        FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id),
    CONSTRAINT CK_ConsentRecord_Status
        CHECK (consent_status IN ('GRANTED','REVOKED','PENDING'))
);
GO

CREATE TABLE dbo.HealthProfile (
    health_profile_id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_HealthProfile PRIMARY KEY,
    customer_profile_id     INT NOT NULL,
    allergies               NVARCHAR(MAX) NULL,
    dietary_requirements    NVARCHAR(MAX) NULL,
    treatment_safety_notes  NVARCHAR(MAX) NULL,
    current_health_condition NVARCHAR(MAX) NULL,
    injury_surgery_history  NVARCHAR(MAX) NULL,
    mobility_joint_notes    NVARCHAR(MAX) NULL,
    current_medications     NVARCHAR(500) NULL,
    stress_fatigue_level    VARCHAR(20) NULL,
    food_intolerance_notes  NVARCHAR(MAX) NULL,
    disliked_ingredients    NVARCHAR(MAX) NULL,
    kitchen_notes           NVARCHAR(MAX) NULL,
    anonymization_status    VARCHAR(20) NOT NULL
        CONSTRAINT DF_HealthProfile_AnonStatus DEFAULT ('IDENTIFIABLE'),
    created_at              DATETIME2(0) NOT NULL
        CONSTRAINT DF_HealthProfile_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updated_at              DATETIME2(0) NOT NULL
        CONSTRAINT DF_HealthProfile_UpdatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_HealthProfile_Customer UNIQUE (customer_profile_id),
    CONSTRAINT FK_HealthProfile_Customer
        FOREIGN KEY (customer_profile_id)
        REFERENCES dbo.CustomerProfile(customer_profile_id),
    CONSTRAINT CK_HealthProfile_AnonStatus
        CHECK (anonymization_status IN ('IDENTIFIABLE','ANONYMIZED')),
    CONSTRAINT CK_HealthProfile_StressLevel
        CHECK (stress_fatigue_level IS NULL OR stress_fatigue_level IN ('mild','moderate','high'))
);
GO

CREATE TABLE dbo.FoodAllergy (
    food_allergy_id   INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_FoodAllergy PRIMARY KEY,
    health_profile_id INT NOT NULL,
    allergen_name     NVARCHAR(120) NOT NULL,
    display_order     INT NOT NULL
        CONSTRAINT DF_FoodAllergy_Order DEFAULT (0),

    CONSTRAINT FK_FoodAllergy_HealthProfile
        FOREIGN KEY (health_profile_id)
        REFERENCES dbo.HealthProfile(health_profile_id) ON DELETE CASCADE
);
GO

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
GO

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
GO

CREATE TABLE dbo.HealthDataDeletionRequest (
    deletion_request_id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_HealthDataDeletionRequest PRIMARY KEY,
    customer_profile_id INT NOT NULL,
    health_profile_id   INT NULL,
    requested_by_user_id INT NOT NULL,
    request_type        VARCHAR(50) NOT NULL
        CONSTRAINT DF_HealthDataDeletionRequest_RequestType DEFAULT ('HEALTH_DATA'),
    request_status      VARCHAR(20) NOT NULL
        CONSTRAINT DF_HealthDeletion_Status DEFAULT ('PENDING'),
    requested_at        DATETIME2(0) NOT NULL
        CONSTRAINT DF_HealthDeletion_RequestedAt DEFAULT (SYSUTCDATETIME()),
    processed_at        DATETIME2(0) NULL,
    updated_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_HealthDataDeletionRequest_UpdatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_HealthDataDeletionRequest_CustomerProfile
        FOREIGN KEY (customer_profile_id)
        REFERENCES dbo.CustomerProfile(customer_profile_id),
    CONSTRAINT FK_HealthDeletion_HealthProfile
        FOREIGN KEY (health_profile_id)
        REFERENCES dbo.HealthProfile(health_profile_id),
    CONSTRAINT FK_HealthDeletion_User
        FOREIGN KEY (requested_by_user_id)
        REFERENCES dbo.[User](user_id),
    CONSTRAINT CK_HealthDataDeletionRequest_RequestType
        CHECK (request_type IN ('HEALTH_DATA')),
    CONSTRAINT CK_HealthDeletion_Status
        CHECK (request_status IN ('PENDING','DEFERRED','COMPLETED','CANCELLED'))
);
GO


/* ============================================================================
   3. RETREAT / ACCOMMODATION
   ============================================================================ */

CREATE TABLE dbo.RetreatPackage (
    retreat_package_id  INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_RetreatPackage PRIMARY KEY,
    package_code        VARCHAR(50) NULL,
    package_name        NVARCHAR(150) NOT NULL,
    wellness_goal       NVARCHAR(250) NULL,
    duration_nights     INT NOT NULL,
    duration_unit       NVARCHAR(50) NOT NULL
        CONSTRAINT DF_RetreatPackage_DurationUnit DEFAULT (N'Đêm (Nights)'),
    base_price          DECIMAL(18,2) NOT NULL,
    base_price_unit     NVARCHAR(50) NOT NULL
        CONSTRAINT DF_RetreatPackage_BasePriceUnit DEFAULT (N'VND/khách/gói'),
    included_treatments NVARCHAR(MAX) NULL,
    dietary_plan        NVARCHAR(1000) NULL,
    extra_charge_policy NVARCHAR(1000) NULL,
    target_guest        NVARCHAR(500) NULL,
    package_status      VARCHAR(20) NOT NULL
        CONSTRAINT DF_RetreatPackage_Status DEFAULT ('ACTIVE'),

    CONSTRAINT UQ_RetreatPackage_Name UNIQUE (package_name),
    CONSTRAINT CK_RetreatPackage_Duration CHECK (duration_nights > 0),
    CONSTRAINT CK_RetreatPackage_Price CHECK (base_price >= 0),
    CONSTRAINT CK_RetreatPackage_Status
        CHECK (package_status IN ('ACTIVE','INACTIVE'))
);
GO

CREATE TABLE dbo.VillaCategory (
    villa_category_id   INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_VillaCategory PRIMARY KEY,
    category_name       NVARCHAR(120) NOT NULL,
    max_occupancy       INT NOT NULL,
    price_modifier      DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_VillaCategory_PriceModifier DEFAULT (0),
    inventory_count     INT NOT NULL
        CONSTRAINT DF_VillaCategory_InventoryCount DEFAULT (0),
    bedroom_count       INT NOT NULL
        CONSTRAINT DF_VillaCategory_BedroomCount DEFAULT (1),
    bedroom_description NVARCHAR(100) NULL,
    area_description    NVARCHAR(50) NULL,
    has_private_pool    BIT NOT NULL
        CONSTRAINT DF_VillaCategory_HasPrivatePool DEFAULT (0),
    pool_description    NVARCHAR(100) NULL,
    features_and_amenities NVARCHAR(500) NULL,
    eligible_packages   NVARCHAR(250) NULL,
    category_status     VARCHAR(20) NOT NULL
        CONSTRAINT DF_VillaCategory_Status DEFAULT ('ACTIVE'),

    CONSTRAINT UQ_VillaCategory_Name UNIQUE (category_name),
    CONSTRAINT CK_VillaCategory_Occupancy CHECK (max_occupancy > 0),
    CONSTRAINT CK_VillaCategory_Status
        CHECK (category_status IN ('ACTIVE','INACTIVE'))
);
GO

/* Conceptual relation: Retreat Package offers Villa Categories. */
CREATE TABLE dbo.RetreatPackageVillaCategory (
    retreat_package_id  INT NOT NULL,
    villa_category_id   INT NOT NULL,

    CONSTRAINT PK_RetreatPackageVillaCategory
        PRIMARY KEY (retreat_package_id, villa_category_id),
    CONSTRAINT FK_RPVC_RetreatPackage
        FOREIGN KEY (retreat_package_id)
        REFERENCES dbo.RetreatPackage(retreat_package_id),
    CONSTRAINT FK_RPVC_VillaCategory
        FOREIGN KEY (villa_category_id)
        REFERENCES dbo.VillaCategory(villa_category_id)
);
GO

CREATE TABLE dbo.PhysicalVilla (
    villa_id            INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_PhysicalVilla PRIMARY KEY,
    villa_category_id   INT NOT NULL,
    villa_number        NVARCHAR(30) NOT NULL,
    floor               NVARCHAR(30) NULL,
    zone_name           NVARCHAR(100) NULL,
    bedroom_info        NVARCHAR(100) NULL,
    max_occupancy       INT NOT NULL
        CONSTRAINT DF_PhysicalVilla_MaxOccupancy DEFAULT (3),
    area_sqm            DECIMAL(10,2) NULL,
    has_private_pool    BIT NOT NULL
        CONSTRAINT DF_PhysicalVilla_HasPrivatePool DEFAULT (0),
    pool_info           NVARCHAR(100) NULL,
    view_and_operational_notes NVARCHAR(500) NULL,
    villa_status        VARCHAR(30) NOT NULL
        CONSTRAINT DF_PhysicalVilla_Status DEFAULT ('AVAILABLE'),

    CONSTRAINT UQ_PhysicalVilla_Number UNIQUE (villa_number),
    CONSTRAINT FK_PhysicalVilla_Category
        FOREIGN KEY (villa_category_id)
        REFERENCES dbo.VillaCategory(villa_category_id),
    CONSTRAINT CK_PhysicalVilla_Status
        CHECK (villa_status IN
            ('AVAILABLE','OCCUPIED','MAINTENANCE','NEEDS_CLEANING','INACTIVE'))
);
GO

CREATE NONCLUSTERED INDEX IX_PhysicalVilla_Status_Category
    ON dbo.PhysicalVilla(villa_status, villa_category_id);
GO

CREATE TABLE dbo.RetreatBooking (
    retreat_booking_id      INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_RetreatBooking PRIMARY KEY,
    customer_profile_id     INT NOT NULL,
    retreat_package_id      INT NOT NULL,
    requested_villa_category_id INT NOT NULL,
    assigned_villa_id       INT NULL,
    check_in_date           DATE NOT NULL,
    check_out_date          DATE NOT NULL,
    booking_status          VARCHAR(20) NOT NULL
        CONSTRAINT DF_RetreatBooking_Status DEFAULT ('PENDING'),
    deposit_amount          DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_RetreatBooking_Deposit DEFAULT (0),
    total_estimated_amount  DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_RetreatBooking_Estimated DEFAULT (0),
    special_request         NVARCHAR(1000) NULL,
    created_at              DATETIME2(0) NOT NULL
        CONSTRAINT DF_RetreatBooking_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_RetreatBooking_Customer
        FOREIGN KEY (customer_profile_id)
        REFERENCES dbo.CustomerProfile(customer_profile_id),
    CONSTRAINT FK_RetreatBooking_Package
        FOREIGN KEY (retreat_package_id)
        REFERENCES dbo.RetreatPackage(retreat_package_id),
    CONSTRAINT FK_RetreatBooking_RequestedCategory
        FOREIGN KEY (requested_villa_category_id)
        REFERENCES dbo.VillaCategory(villa_category_id),
    CONSTRAINT FK_RetreatBooking_AssignedVilla
        FOREIGN KEY (assigned_villa_id)
        REFERENCES dbo.PhysicalVilla(villa_id),
    CONSTRAINT CK_RetreatBooking_Dates
        CHECK (check_out_date > check_in_date),
    CONSTRAINT CK_RetreatBooking_Amounts
        CHECK (deposit_amount >= 0 AND total_estimated_amount >= 0),
    CONSTRAINT CK_RetreatBooking_Status
        CHECK (booking_status IN
            ('PENDING','CONFIRMED','CHECKED_IN','CANCELLED','COMPLETED'))
);
GO

CREATE TABLE dbo.ResidenceRecord (
    residence_record_id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_ResidenceRecord PRIMARY KEY,
    retreat_booking_id  INT NOT NULL,
    identification_number NVARCHAR(100) NOT NULL,
    identification_type NVARCHAR(50) NOT NULL,
    nationality         NVARCHAR(100) NULL,
    permanent_address   NVARCHAR(500) NULL,
    collected_at        DATETIME2(0) NOT NULL
        CONSTRAINT DF_ResidenceRecord_CollectedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_ResidenceRecord_Booking UNIQUE (retreat_booking_id),
    CONSTRAINT FK_ResidenceRecord_Booking
        FOREIGN KEY (retreat_booking_id)
        REFERENCES dbo.RetreatBooking(retreat_booking_id)
);
GO


/* ============================================================================
   4. SPA / THERAPY SCHEDULING
   ============================================================================ */

CREATE TABLE dbo.Therapist (
    therapist_id        INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Therapist PRIMARY KEY,
    user_id             INT NOT NULL,
    therapist_status    VARCHAR(20) NOT NULL
        CONSTRAINT DF_Therapist_Status DEFAULT ('ACTIVE'),

    CONSTRAINT UQ_Therapist_User UNIQUE (user_id),
    CONSTRAINT FK_Therapist_User
        FOREIGN KEY (user_id) REFERENCES dbo.[User](user_id),
    CONSTRAINT CK_Therapist_Status
        CHECK (therapist_status IN ('ACTIVE','INACTIVE','SUSPENDED'))
);
GO

CREATE TABLE dbo.SpaTreatment (
    treatment_id        INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_SpaTreatment PRIMARY KEY,
    treatment_code      VARCHAR(50) NULL,
    treatment_name      NVARCHAR(150) NOT NULL,
    duration_minutes    INT NOT NULL,
    base_price          DECIMAL(18,2) NOT NULL,
    category            VARCHAR(50) NULL,
    description         NVARCHAR(1000) NULL,
    treatment_status    VARCHAR(20) NOT NULL
        CONSTRAINT DF_SpaTreatment_Status DEFAULT ('ACTIVE'),

    CONSTRAINT UQ_SpaTreatment_Name UNIQUE (treatment_name),
    CONSTRAINT CK_SpaTreatment_Duration CHECK (duration_minutes > 0),
    CONSTRAINT CK_SpaTreatment_Price CHECK (base_price >= 0),
    CONSTRAINT CK_SpaTreatment_Status
        CHECK (treatment_status IN ('ACTIVE','INACTIVE'))
);
GO

CREATE UNIQUE NONCLUSTERED INDEX UQ_SpaTreatment_TreatmentCode
    ON dbo.SpaTreatment (treatment_code)
    WHERE treatment_code IS NOT NULL;
GO

/* Conceptual relation: Retreat Package includes Spa Treatments. */
CREATE TABLE dbo.RetreatPackageSpaTreatment (
    retreat_package_id  INT NOT NULL,
    treatment_id        INT NOT NULL,
    included_sessions   INT NOT NULL
        CONSTRAINT DF_RPST_included_sessions DEFAULT (1),
    entitlement_status  VARCHAR(50) NOT NULL
        CONSTRAINT DF_RPST_entitlement_status DEFAULT ('INCLUDED'),
    notes               NVARCHAR(500) NULL,

    CONSTRAINT PK_RetreatPackageSpaTreatment
        PRIMARY KEY (retreat_package_id, treatment_id),
    CONSTRAINT FK_RPST_RetreatPackage
        FOREIGN KEY (retreat_package_id)
        REFERENCES dbo.RetreatPackage(retreat_package_id),
    CONSTRAINT FK_RPST_SpaTreatment
        FOREIGN KEY (treatment_id)
        REFERENCES dbo.SpaTreatment(treatment_id)
);
GO

CREATE TABLE dbo.TreatmentRoom (
    room_id             INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_TreatmentRoom PRIMARY KEY,
    room_name           NVARCHAR(100) NOT NULL,
    room_type           VARCHAR(50) NULL,
    room_status         VARCHAR(20) NOT NULL
        CONSTRAINT DF_TreatmentRoom_Status DEFAULT ('AVAILABLE'),

    CONSTRAINT UQ_TreatmentRoom_Name UNIQUE (room_name),
    CONSTRAINT CK_TreatmentRoom_Status
        CHECK (room_status IN ('AVAILABLE','OCCUPIED','MAINTENANCE','INACTIVE'))
);
GO

/* Conceptual relation: Therapist qualified for Spa Treatment. */
CREATE TABLE dbo.TherapistTreatmentQualification (
    therapist_id        INT NOT NULL,
    treatment_id        INT NOT NULL,

    CONSTRAINT PK_TherapistTreatmentQualification
        PRIMARY KEY (therapist_id, treatment_id),
    CONSTRAINT FK_TTQ_Therapist
        FOREIGN KEY (therapist_id)
        REFERENCES dbo.Therapist(therapist_id),
    CONSTRAINT FK_TTQ_Treatment
        FOREIGN KEY (treatment_id)
        REFERENCES dbo.SpaTreatment(treatment_id)
);
GO

/* Conceptual relation: Treatment Room compatible with Spa Treatment. */
CREATE TABLE dbo.TreatmentRoomCompatibility (
    room_id             INT NOT NULL,
    treatment_id        INT NOT NULL,

    CONSTRAINT PK_TreatmentRoomCompatibility
        PRIMARY KEY (room_id, treatment_id),
    CONSTRAINT FK_TRC_Room
        FOREIGN KEY (room_id)
        REFERENCES dbo.TreatmentRoom(room_id),
    CONSTRAINT FK_TRC_Treatment
        FOREIGN KEY (treatment_id)
        REFERENCES dbo.SpaTreatment(treatment_id)
);
GO

CREATE TABLE dbo.SpaSession (
    spa_session_id      INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_SpaSession PRIMARY KEY,
    retreat_booking_id  INT NOT NULL,
    treatment_id        INT NOT NULL,
    therapist_id        INT NOT NULL,
    room_id             INT NOT NULL,
    requested_start_at  DATETIME2(0) NULL,
    scheduled_start_at  DATETIME2(0) NOT NULL,
    scheduled_end_at    DATETIME2(0) NOT NULL,
    booking_source      VARCHAR(20) NOT NULL,
    session_status      VARCHAR(20) NOT NULL
        CONSTRAINT DF_SpaSession_Status DEFAULT ('SCHEDULED'),
    confirmation_status VARCHAR(20) NOT NULL
        CONSTRAINT DF_SpaSession_Confirmation DEFAULT ('PENDING'),
    customer_note       NVARCHAR(1000) NULL,
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_SpaSession_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_SpaSession_Booking
        FOREIGN KEY (retreat_booking_id)
        REFERENCES dbo.RetreatBooking(retreat_booking_id),
    CONSTRAINT FK_SpaSession_Treatment
        FOREIGN KEY (treatment_id)
        REFERENCES dbo.SpaTreatment(treatment_id),
    CONSTRAINT FK_SpaSession_Therapist
        FOREIGN KEY (therapist_id)
        REFERENCES dbo.Therapist(therapist_id),
    CONSTRAINT FK_SpaSession_Room
        FOREIGN KEY (room_id)
        REFERENCES dbo.TreatmentRoom(room_id),
    CONSTRAINT CK_SpaSession_Time
        CHECK (scheduled_end_at > scheduled_start_at),
    CONSTRAINT CK_SpaSession_Source
        CHECK (booking_source IN ('CUSTOMER','RECEPTIONIST','SYSTEM')),
    CONSTRAINT CK_SpaSession_Status
        CHECK (session_status IN
            ('SCHEDULED','RESCHEDULING','CANCELLED','COMPLETED','NO_SHOW')),
    CONSTRAINT CK_SpaSession_Confirmation
        CHECK (confirmation_status IN
            ('PENDING','CONFIRMED','DECLINED','EXPIRED'))
);
GO

CREATE INDEX IX_SpaSession_Therapist_Time
    ON dbo.SpaSession (therapist_id, scheduled_start_at, scheduled_end_at);
GO

CREATE INDEX IX_SpaSession_Room_Time
    ON dbo.SpaSession (room_id, scheduled_start_at, scheduled_end_at);
GO

/*
Enforce:
1) Therapist must be qualified for Treatment.
2) Treatment Room must be compatible with Treatment.
3) Therapist and Room cannot overlap an active session interval.
*/
CREATE OR ALTER TRIGGER dbo.TR_SpaSession_ValidateScheduling
ON dbo.SpaSession
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        LEFT JOIN dbo.TherapistTreatmentQualification q
            ON q.therapist_id = i.therapist_id
           AND q.treatment_id = i.treatment_id
        WHERE q.therapist_id IS NULL
    )
    BEGIN
        THROW 51001, 'Therapist is not qualified for the selected Spa Treatment.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        LEFT JOIN dbo.TreatmentRoomCompatibility c
            ON c.room_id = i.room_id
           AND c.treatment_id = i.treatment_id
        WHERE c.room_id IS NULL
    )
    BEGIN
        THROW 51002, 'Treatment Room is not compatible with the selected Spa Treatment.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.SpaSession s
            ON s.spa_session_id <> i.spa_session_id
           AND s.session_status IN ('SCHEDULED','RESCHEDULING')
           AND i.session_status IN ('SCHEDULED','RESCHEDULING')
           AND i.scheduled_start_at < s.scheduled_end_at
           AND i.scheduled_end_at > s.scheduled_start_at
           AND (
                s.therapist_id = i.therapist_id
                OR s.room_id = i.room_id
           )
    )
    BEGIN
        THROW 51003, 'Scheduling conflict: Therapist or Treatment Room overlaps another active session.', 1;
    END;
END;
GO


/* ============================================================================
   5. F&B
   ============================================================================ */

CREATE TABLE dbo.MenuItem (
    menu_item_id        INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_MenuItem PRIMARY KEY,
    item_name           NVARCHAR(150) NOT NULL,
    category            NVARCHAR(100) NULL,
    meal_type           NVARCHAR(50) NULL,
    price               DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_MenuItem_Price DEFAULT (0),
    dietary_tags        NVARCHAR(500) NULL,
    allergen_information NVARCHAR(MAX) NULL,
    availability_status VARCHAR(20) NOT NULL
        CONSTRAINT DF_MenuItem_Availability DEFAULT ('AVAILABLE'),

    CONSTRAINT UQ_MenuItem_Name UNIQUE (item_name),
    CONSTRAINT CK_MenuItem_Price CHECK (price >= 0),
    CONSTRAINT CK_MenuItem_Availability
        CHECK (availability_status IN ('AVAILABLE','UNAVAILABLE'))
);
GO

CREATE TABLE dbo.Ingredient (
    ingredient_id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Ingredient PRIMARY KEY,
    ingredient_name     NVARCHAR(150) NOT NULL,

    CONSTRAINT UQ_Ingredient_Name UNIQUE (ingredient_name)
);
GO

/* Logical bridge: Menu Item requires Ingredients. */
CREATE TABLE dbo.MenuItemIngredient (
    menu_item_id        INT NOT NULL,
    ingredient_id       INT NOT NULL,
    required_quantity   DECIMAL(18,3) NULL,

    CONSTRAINT PK_MenuItemIngredient
        PRIMARY KEY (menu_item_id, ingredient_id),
    CONSTRAINT FK_MenuItemIngredient_MenuItem
        FOREIGN KEY (menu_item_id)
        REFERENCES dbo.MenuItem(menu_item_id),
    CONSTRAINT FK_MenuItemIngredient_Ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES dbo.Ingredient(ingredient_id),
    CONSTRAINT CK_MenuItemIngredient_Quantity
        CHECK (required_quantity IS NULL OR required_quantity > 0)
);
GO

CREATE TABLE dbo.IngredientBatch (
    ingredient_batch_id INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_IngredientBatch PRIMARY KEY,
    ingredient_id       INT NOT NULL,
    received_date       DATE NOT NULL,
    expiration_date     DATE NOT NULL,
    remaining_quantity  DECIMAL(18,3) NOT NULL,
    stock_condition     NVARCHAR(50) NOT NULL,

    CONSTRAINT FK_IngredientBatch_Ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES dbo.Ingredient(ingredient_id),
    CONSTRAINT CK_IngredientBatch_Dates
        CHECK (expiration_date >= received_date),
    CONSTRAINT CK_IngredientBatch_Quantity
        CHECK (remaining_quantity >= 0)
);
GO

CREATE TABLE dbo.MealOrder (
    meal_order_id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_MealOrder PRIMARY KEY,
    retreat_booking_id  INT NOT NULL,
    order_date          DATE NOT NULL,
    meal_type           NVARCHAR(50) NULL,
    order_type          VARCHAR(20) NOT NULL,
    order_status        VARCHAR(20) NOT NULL
        CONSTRAINT DF_MealOrder_Status DEFAULT ('PENDING'),
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_MealOrder_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_MealOrder_Booking
        FOREIGN KEY (retreat_booking_id)
        REFERENCES dbo.RetreatBooking(retreat_booking_id),
    CONSTRAINT CK_MealOrder_Type
        CHECK (order_type IN ('DAILY_MEAL','A_LA_CARTE')),
    CONSTRAINT CK_MealOrder_Status
        CHECK (order_status IN ('PENDING','PREPARING','READY','DELIVERED','CANCELLED'))
);
GO

CREATE TABLE dbo.MealOrderItem (
    meal_order_item_id  INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_MealOrderItem PRIMARY KEY,
    meal_order_id       INT NOT NULL,
    menu_item_id        INT NOT NULL,
    quantity            INT NOT NULL,

    CONSTRAINT FK_MealOrderItem_Order
        FOREIGN KEY (meal_order_id)
        REFERENCES dbo.MealOrder(meal_order_id),
    CONSTRAINT FK_MealOrderItem_MenuItem
        FOREIGN KEY (menu_item_id)
        REFERENCES dbo.MenuItem(menu_item_id),
    CONSTRAINT CK_MealOrderItem_Quantity CHECK (quantity > 0),
    CONSTRAINT UQ_MealOrderItem_OrderMenu UNIQUE (meal_order_id, menu_item_id)
);
GO


/* ============================================================================
   6. FOLIO / INVOICE / PAYMENT / REVIEW
   ============================================================================ */

CREATE TABLE dbo.Folio (
    folio_id            INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Folio PRIMARY KEY,
    retreat_booking_id  INT NOT NULL,
    total_charges       DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_Folio_TotalCharges DEFAULT (0),
    total_paid          DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_Folio_TotalPaid DEFAULT (0),
    balance_due AS (total_charges - total_paid) PERSISTED,
    folio_status        VARCHAR(20) NOT NULL
        CONSTRAINT DF_Folio_Status DEFAULT ('OPEN'),
    closed_at           DATETIME2(0) NULL,

    CONSTRAINT UQ_Folio_Booking UNIQUE (retreat_booking_id),
    CONSTRAINT FK_Folio_Booking
        FOREIGN KEY (retreat_booking_id)
        REFERENCES dbo.RetreatBooking(retreat_booking_id),
    CONSTRAINT CK_Folio_Amounts
        CHECK (total_charges >= 0 AND total_paid >= 0),
    CONSTRAINT CK_Folio_Status
        CHECK (folio_status IN ('OPEN','PARTIALLY_PAID','PAID','CLOSED'))
);
GO

CREATE TABLE dbo.FolioItem (
    folio_item_id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_FolioItem PRIMARY KEY,
    folio_id            INT NOT NULL,
    charge_category     VARCHAR(20) NOT NULL,
    description         NVARCHAR(500) NOT NULL,
    amount              DECIMAL(18,2) NOT NULL,
    charged_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_FolioItem_ChargedAt DEFAULT (SYSUTCDATETIME()),

    /* Source references exist only in logical DB, not in the conceptual ERD. */
    source_booking_id   INT NULL,
    source_spa_session_id INT NULL,
    source_meal_order_id INT NULL,

    CONSTRAINT FK_FolioItem_Folio
        FOREIGN KEY (folio_id)
        REFERENCES dbo.Folio(folio_id),
    CONSTRAINT FK_FolioItem_Booking
        FOREIGN KEY (source_booking_id)
        REFERENCES dbo.RetreatBooking(retreat_booking_id),
    CONSTRAINT FK_FolioItem_SpaSession
        FOREIGN KEY (source_spa_session_id)
        REFERENCES dbo.SpaSession(spa_session_id),
    CONSTRAINT FK_FolioItem_MealOrder
        FOREIGN KEY (source_meal_order_id)
        REFERENCES dbo.MealOrder(meal_order_id),

    CONSTRAINT CK_FolioItem_Amount CHECK (amount >= 0),
    CONSTRAINT CK_FolioItem_Category
        CHECK (charge_category IN ('PACKAGE','SPA','FNB')),
    CONSTRAINT CK_FolioItem_Source
        CHECK (
            (charge_category = 'PACKAGE'
                AND source_booking_id IS NOT NULL
                AND source_spa_session_id IS NULL
                AND source_meal_order_id IS NULL)
            OR
            (charge_category = 'SPA'
                AND source_booking_id IS NULL
                AND source_spa_session_id IS NOT NULL
                AND source_meal_order_id IS NULL)
            OR
            (charge_category = 'FNB'
                AND source_booking_id IS NULL
                AND source_spa_session_id IS NULL
                AND source_meal_order_id IS NOT NULL)
        )
);
GO

CREATE TABLE dbo.Invoice (
    invoice_id          INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Invoice PRIMARY KEY,
    folio_id            INT NOT NULL,
    invoice_number      NVARCHAR(50) NOT NULL,
    subtotal_amount     DECIMAL(18,2) NOT NULL,
    tax_amount          DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_Invoice_Tax DEFAULT (0),
    final_amount        DECIMAL(18,2) NOT NULL,
    invoice_status      VARCHAR(20) NOT NULL
        CONSTRAINT DF_Invoice_Status DEFAULT ('DRAFT'),
    issued_date         DATETIME2(0) NULL,

    CONSTRAINT UQ_Invoice_Folio UNIQUE (folio_id),
    CONSTRAINT UQ_Invoice_Number UNIQUE (invoice_number),
    CONSTRAINT FK_Invoice_Folio
        FOREIGN KEY (folio_id)
        REFERENCES dbo.Folio(folio_id),
    CONSTRAINT CK_Invoice_Amounts
        CHECK (subtotal_amount >= 0 AND tax_amount >= 0 AND final_amount >= 0),
    CONSTRAINT CK_Invoice_Status
        CHECK (invoice_status IN ('DRAFT','ISSUED','PAID','CANCELLED'))
);
GO

CREATE TABLE dbo.PaymentTransaction (
    transaction_id      INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_PaymentTransaction PRIMARY KEY,
    retreat_booking_id  INT NULL,   -- deposit payment
    invoice_id          INT NULL,   -- final checkout payment
    payment_type        VARCHAR(20) NOT NULL,
    payment_method      VARCHAR(30) NOT NULL,
    transaction_reference NVARCHAR(150) NULL,
    amount_paid         DECIMAL(18,2) NOT NULL,
    payment_status      VARCHAR(20) NOT NULL
        CONSTRAINT DF_Payment_Status DEFAULT ('PENDING'),
    transaction_date    DATETIME2(0) NOT NULL
        CONSTRAINT DF_Payment_Date DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_Payment_Booking
        FOREIGN KEY (retreat_booking_id)
        REFERENCES dbo.RetreatBooking(retreat_booking_id),
    CONSTRAINT FK_Payment_Invoice
        FOREIGN KEY (invoice_id)
        REFERENCES dbo.Invoice(invoice_id),
    CONSTRAINT CK_Payment_Amount CHECK (amount_paid >= 0),
    CONSTRAINT CK_Payment_Type
        CHECK (payment_type IN ('DEPOSIT','FINAL')),
    CONSTRAINT CK_Payment_Status
        CHECK (payment_status IN
            ('PENDING','SUCCESSFUL','FAILED','REFUNDED','CANCELLED')),
    CONSTRAINT CK_Payment_Target
        CHECK (
            (payment_type = 'DEPOSIT' AND retreat_booking_id IS NOT NULL AND invoice_id IS NULL)
            OR
            (payment_type = 'FINAL' AND retreat_booking_id IS NULL AND invoice_id IS NOT NULL)
        )
);
GO

CREATE UNIQUE INDEX UX_PaymentTransaction_Reference
ON dbo.PaymentTransaction(transaction_reference)
WHERE transaction_reference IS NOT NULL;
GO

CREATE TABLE dbo.CustomerReview (
    review_id           INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_CustomerReview PRIMARY KEY,
    retreat_booking_id  INT NOT NULL,
    overall_rating      TINYINT NOT NULL,
    comments            NVARCHAR(2000) NULL,
    room_rating         TINYINT NULL,
    spa_rating          TINYINT NULL,
    dining_rating       TINYINT NULL,
    submitted_at        DATETIME2(0) NOT NULL
        CONSTRAINT DF_CustomerReview_SubmittedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_CustomerReview_Booking UNIQUE (retreat_booking_id),
    CONSTRAINT FK_CustomerReview_Booking
        FOREIGN KEY (retreat_booking_id)
        REFERENCES dbo.RetreatBooking(retreat_booking_id),
    CONSTRAINT CK_CustomerReview_Rating
        CHECK (overall_rating BETWEEN 1 AND 5),
    CONSTRAINT CK_CustomerReview_CategoryRatings
        CHECK ((room_rating   IS NULL OR room_rating   BETWEEN 1 AND 5)
           AND (spa_rating    IS NULL OR spa_rating    BETWEEN 1 AND 5)
           AND (dining_rating IS NULL OR dining_rating BETWEEN 1 AND 5))
);
GO

/* Keep Folio.total_charges synchronized with FolioItem. */
CREATE OR ALTER TRIGGER dbo.TR_FolioItem_RecalculateTotal
ON dbo.FolioItem
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH Affected AS (
        SELECT folio_id FROM inserted
        UNION
        SELECT folio_id FROM deleted
    )
    UPDATE f
    SET total_charges = ISNULL(x.total_charges, 0)
    FROM dbo.Folio f
    INNER JOIN Affected a ON a.folio_id = f.folio_id
    OUTER APPLY (
        SELECT SUM(fi.amount) AS total_charges
        FROM dbo.FolioItem fi
        WHERE fi.folio_id = f.folio_id
    ) x;
END;
GO

/* Keep Folio.total_paid synchronized with successful FINAL payments. */
CREATE OR ALTER TRIGGER dbo.TR_PaymentTransaction_RecalculateFolioPaid
ON dbo.PaymentTransaction
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedInvoice AS (
        SELECT invoice_id FROM inserted WHERE invoice_id IS NOT NULL
        UNION
        SELECT invoice_id FROM deleted WHERE invoice_id IS NOT NULL
    ),
    AffectedFolio AS (
        SELECT DISTINCT i.folio_id
        FROM dbo.Invoice i
        INNER JOIN AffectedInvoice a ON a.invoice_id = i.invoice_id
    )
    UPDATE f
    SET total_paid = ISNULL(x.total_paid, 0),
        folio_status =
            CASE
                WHEN ISNULL(x.total_paid,0) = 0 THEN 'OPEN'
                WHEN ISNULL(x.total_paid,0) < f.total_charges THEN 'PARTIALLY_PAID'
                WHEN ISNULL(x.total_paid,0) >= f.total_charges THEN 'PAID'
                ELSE f.folio_status
            END
    FROM dbo.Folio f
    INNER JOIN AffectedFolio af ON af.folio_id = f.folio_id
    OUTER APPLY (
        SELECT SUM(pt.amount_paid) AS total_paid
        FROM dbo.PaymentTransaction pt
        INNER JOIN dbo.Invoice inv ON inv.invoice_id = pt.invoice_id
        WHERE inv.folio_id = f.folio_id
          AND pt.payment_status = 'SUCCESSFUL'
          AND pt.payment_type = 'FINAL'
    ) x;
END;
GO


/* ============================================================================
   7. ADMINISTRATION / PERMISSION / AUDIT
   ============================================================================ */

CREATE TABLE dbo.[Permission] (
    permission_id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_Permission PRIMARY KEY,
    module_or_screen    NVARCHAR(100) NOT NULL,
    action_type         NVARCHAR(50) NOT NULL,
    is_delegable        BIT NOT NULL
        CONSTRAINT DF_Permission_IsDelegable DEFAULT (0),
    is_admin_only       BIT NOT NULL
        CONSTRAINT DF_Permission_IsAdminOnly DEFAULT (0),
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_Permission_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT UQ_Permission UNIQUE (module_or_screen, action_type)
);
GO

/* Logical bridge: Role has Permissions. */
CREATE TABLE dbo.RolePermission (
    role_id             INT NOT NULL,
    permission_id       INT NOT NULL,

    CONSTRAINT PK_RolePermission PRIMARY KEY (role_id, permission_id),
    CONSTRAINT FK_RolePermission_Role
        FOREIGN KEY (role_id) REFERENCES dbo.[Role](role_id),
    CONSTRAINT FK_RolePermission_Permission
        FOREIGN KEY (permission_id)
        REFERENCES dbo.[Permission](permission_id)
);
GO

CREATE TABLE dbo.SystemConfiguration (
    configuration_id        INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_SystemConfiguration PRIMARY KEY,
    configuration_type      NVARCHAR(50) NOT NULL,
    configuration_key       NVARCHAR(120) NOT NULL,
    configuration_value     NVARCHAR(1000) NULL,
    configuration_status    VARCHAR(20) NOT NULL
        CONSTRAINT DF_SystemConfiguration_Status DEFAULT ('ACTIVE'),
    updated_by_user_id      INT NULL,
    updated_at              DATETIME2(0) NOT NULL
        CONSTRAINT DF_SystemConfiguration_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    value_type              VARCHAR(20) NOT NULL
        CONSTRAINT DF_SystemConfig_ValueType DEFAULT ('INT'),
    min_value               DECIMAL(18,4) NULL,
    max_value               DECIMAL(18,4) NULL,
    unit                    NVARCHAR(40) NULL,
    description             NVARCHAR(500) NULL,
    manager_editable        BIT NOT NULL
        CONSTRAINT DF_SystemConfig_ManagerEditable DEFAULT (0),

    CONSTRAINT UQ_SystemConfiguration_Key UNIQUE (configuration_key),
    CONSTRAINT FK_SystemConfiguration_User
        FOREIGN KEY (updated_by_user_id)
        REFERENCES dbo.[User](user_id),
    CONSTRAINT CK_SystemConfiguration_Status
        CHECK (configuration_status IN ('ACTIVE','INACTIVE'))
);
GO

CREATE TABLE dbo.RightDelegation (
    delegation_id       INT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_RightDelegation PRIMARY KEY,
    granted_by_admin_user_id INT NOT NULL,
    received_by_manager_user_id INT NOT NULL,
    valid_from          DATETIME2(0) NOT NULL,
    valid_until         DATETIME2(0) NOT NULL,
    delegation_status   VARCHAR(20) NOT NULL
        CONSTRAINT DF_RightDelegation_Status DEFAULT ('PENDING'),
    revoked_at          DATETIME2(0) NULL,
    revoked_by_admin_user_id INT NULL,

    CONSTRAINT FK_RightDelegation_Admin
        FOREIGN KEY (granted_by_admin_user_id)
        REFERENCES dbo.[User](user_id),
    CONSTRAINT FK_RightDelegation_Manager
        FOREIGN KEY (received_by_manager_user_id)
        REFERENCES dbo.[User](user_id),
    CONSTRAINT FK_RightDelegation_RevokedBy
        FOREIGN KEY (revoked_by_admin_user_id)
        REFERENCES dbo.[User](user_id),
    CONSTRAINT CK_RightDelegation_Dates CHECK (valid_until > valid_from),
    CONSTRAINT CK_RightDelegation_DifferentUsers
        CHECK (granted_by_admin_user_id <> received_by_manager_user_id),
    CONSTRAINT CK_RightDelegation_Status
        CHECK (delegation_status IN ('PENDING','ACTIVE','EXPIRED','REVOKED'))
);
GO

/* Logical bridge: one delegation may scope multiple permissions. */
CREATE TABLE dbo.RightDelegationPermission (
    delegation_id       INT NOT NULL,
    permission_id       INT NOT NULL,

    CONSTRAINT PK_RightDelegationPermission
        PRIMARY KEY (delegation_id, permission_id),
    CONSTRAINT FK_RDP_Delegation
        FOREIGN KEY (delegation_id)
        REFERENCES dbo.RightDelegation(delegation_id),
    CONSTRAINT FK_RDP_Permission
        FOREIGN KEY (permission_id)
        REFERENCES dbo.[Permission](permission_id)
);
GO

CREATE TABLE dbo.AuditLog (
    audit_log_id        BIGINT IDENTITY(1,1) NOT NULL
        CONSTRAINT PK_AuditLog PRIMARY KEY,
    actor_user_id       INT NULL,
    actor_role          VARCHAR(50) NULL,
    action              NVARCHAR(150) NOT NULL,
    target_data_type    NVARCHAR(100) NULL,
    target_ref_id       VARCHAR(100) NULL,
    access_status       NVARCHAR(50) NULL,
    old_value           NVARCHAR(500) NULL,
    new_value           NVARCHAR(500) NULL,
    delegation_id       INT NULL,
    created_at          DATETIME2(0) NOT NULL
        CONSTRAINT DF_AuditLog_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_AuditLog_User
        FOREIGN KEY (actor_user_id)
        REFERENCES dbo.[User](user_id),
    CONSTRAINT FK_AuditLog_RightDelegation
        FOREIGN KEY (delegation_id)
        REFERENCES dbo.RightDelegation(delegation_id)
);
GO

CREATE INDEX IX_AuditLog_ActorCreatedAt
    ON dbo.AuditLog(actor_user_id, created_at DESC);
GO


/* ============================================================================
   8. USEFUL INDEXES
   ============================================================================ */

CREATE INDEX IX_RetreatBooking_Customer_Status
    ON dbo.RetreatBooking(customer_profile_id, booking_status);
GO

CREATE INDEX IX_RetreatBooking_Dates
    ON dbo.RetreatBooking(check_in_date, check_out_date);
GO

CREATE INDEX IX_MealOrder_Booking_Date
    ON dbo.MealOrder(retreat_booking_id, order_date);
GO

CREATE INDEX IX_FolioItem_Folio_Category
    ON dbo.FolioItem(folio_id, charge_category);
GO

CREATE INDEX IX_IngredientBatch_Ingredient_Expiry
    ON dbo.IngredientBatch(ingredient_id, expiration_date);
GO

CREATE NONCLUSTERED INDEX IX_User_AccountStatus_LockedAt
    ON dbo.[User](account_status, locked_at)
    WHERE locked_at IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_RightDelegation_Status_Expiry
    ON dbo.RightDelegation(delegation_status, valid_from, valid_until);
GO

CREATE NONCLUSTERED INDEX IX_AuditLog_TargetRefId
    ON dbo.AuditLog(target_ref_id, created_at DESC)
    WHERE target_ref_id IS NOT NULL;
GO



/* ============================================================================
   9. INITIAL ROLE SEED DATA
   ============================================================================ */

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Customer')
    INSERT dbo.[Role](role_name, description)
    VALUES (N'Customer', N'Authenticated resort customer.');

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Receptionist')
    INSERT dbo.[Role](role_name, description)
    VALUES (N'Receptionist', N'Front-desk and stay operations staff.');

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Therapist')
    INSERT dbo.[Role](role_name, description)
    VALUES (N'Therapist', N'Spa Therapist / Yoga Instructor.');

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'F&B Staff')
    INSERT dbo.[Role](role_name, description)
    VALUES (N'F&B Staff', N'Food and beverage operational staff / Chef.');

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Manager')
    INSERT dbo.[Role](role_name, description)
    VALUES (N'Manager', N'Management monitoring and approved delegated functions.');

IF NOT EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_name = N'Admin')
    INSERT dbo.[Role](role_name, description)
    VALUES (N'Admin', N'System administration and governance.');
GO


/* ============================================================================
   10. QUICK VERIFICATION
   ============================================================================ */

SELECT
    t.name AS table_name
FROM sys.tables t
ORDER BY t.name;
GO

PRINT 'HSWRMS database schema created successfully.';
GO