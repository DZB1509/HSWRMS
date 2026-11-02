-- ============================================================================
-- HSWRMS Migration V003: M2 Retreat Booking Schema Reconciliation
-- Idempotent schema evolution for existing database environments.
-- Reconciles columns mapped by RetreatPackage, VillaCategory, and PhysicalVilla entities.
-- Partial-state safe: handles missing tables, existing columns missing defaults,
-- conflicting default expressions (fail-fast), and spa entitlement safety (no guess).
-- ============================================================================

-- 0. Precondition Check: Fail clearly if prerequisite baseline tables are absent
IF OBJECT_ID(N'dbo.RetreatPackage', N'U') IS NULL
   OR OBJECT_ID(N'dbo.VillaCategory', N'U') IS NULL
   OR OBJECT_ID(N'dbo.PhysicalVilla', N'U') IS NULL
BEGIN
    RAISERROR(N'HSWRMS Migration V003 Precondition Failed: One or more prerequisite tables (dbo.RetreatPackage, dbo.VillaCategory, dbo.PhysicalVilla) do not exist. Please initialize the database with schema.sql first.', 16, 1);
    RETURN;
END
GO

-- 1. Reconcile dbo.RetreatPackage columns
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'package_code'
)
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD package_code VARCHAR(50) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'duration_unit'
)
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD duration_unit NVARCHAR(50) NOT NULL 
        CONSTRAINT DF_RetreatPackage_DurationUnit DEFAULT (N'Đêm (Nights)');
END
ELSE
BEGIN
    -- Partial-state check: column exists, inspect default constraint and nullability
    DECLARE @RP_Duration_Constraint sysname;
    DECLARE @RP_Duration_Def NVARCHAR(MAX);
    SELECT @RP_Duration_Constraint = d.name, @RP_Duration_Def = d.definition
    FROM sys.default_constraints d
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.RetreatPackage')
      AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackage'), 'duration_unit', 'ColumnId');

    IF @RP_Duration_Constraint IS NULL
    BEGIN
        -- Case 1: No default constraint exists
        -- Safe auto-repair: system-wide standard duration unit is nights ('Đêm (Nights)')
        UPDATE dbo.RetreatPackage SET duration_unit = N'Đêm (Nights)' WHERE duration_unit IS NULL;
        ALTER TABLE dbo.RetreatPackage ALTER COLUMN duration_unit NVARCHAR(50) NOT NULL;
        ALTER TABLE dbo.RetreatPackage ADD CONSTRAINT DF_RetreatPackage_DurationUnit DEFAULT (N'Đêm (Nights)') FOR duration_unit;
    END
    ELSE IF LTRIM(RTRIM(@RP_Duration_Def)) IN (N'(N''Đêm (Nights)'')', N'((N''Đêm (Nights)''))', N'(''Đêm (Nights)'')', N'((''Đêm (Nights)''))')
    BEGIN
        -- Case 2: Constraint exists and expression matches expected baseline
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackage'), 'duration_unit', 'AllowsNull') = 1
        BEGIN
            UPDATE dbo.RetreatPackage SET duration_unit = N'Đêm (Nights)' WHERE duration_unit IS NULL;
            ALTER TABLE dbo.RetreatPackage ALTER COLUMN duration_unit NVARCHAR(50) NOT NULL;
        END
    END
    ELSE
    BEGIN
        -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
        DECLARE @RP_Duration_Msg NVARCHAR(500) = CAST(ISNULL(@RP_Duration_Def, N'NULL') AS NVARCHAR(255));
        RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.RetreatPackage column duration_unit has conflicting default constraint [%s] with definition %s. Expected (N''Đêm (Nights)''). Please have a DBA review and reconcile this constraint.', 16, 1, @RP_Duration_Constraint, @RP_Duration_Msg);
        RETURN;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'base_price_unit'
)
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD base_price_unit NVARCHAR(50) NOT NULL 
        CONSTRAINT DF_RetreatPackage_BasePriceUnit DEFAULT (N'VND/khách/gói');
END
ELSE
BEGIN
    -- Partial-state check: column exists, inspect default constraint and nullability
    DECLARE @RP_PriceUnit_Constraint sysname;
    DECLARE @RP_PriceUnit_Def NVARCHAR(MAX);
    SELECT @RP_PriceUnit_Constraint = d.name, @RP_PriceUnit_Def = d.definition
    FROM sys.default_constraints d
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.RetreatPackage')
      AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackage'), 'base_price_unit', 'ColumnId');

    IF @RP_PriceUnit_Constraint IS NULL
    BEGIN
        -- Case 1: No default constraint exists
        -- Safe auto-repair: system-wide standard package pricing unit is 'VND/khách/gói'
        UPDATE dbo.RetreatPackage SET base_price_unit = N'VND/khách/gói' WHERE base_price_unit IS NULL;
        ALTER TABLE dbo.RetreatPackage ALTER COLUMN base_price_unit NVARCHAR(50) NOT NULL;
        ALTER TABLE dbo.RetreatPackage ADD CONSTRAINT DF_RetreatPackage_BasePriceUnit DEFAULT (N'VND/khách/gói') FOR base_price_unit;
    END
    ELSE IF LTRIM(RTRIM(@RP_PriceUnit_Def)) IN (N'(N''VND/khách/gói'')', N'((N''VND/khách/gói''))', N'(''VND/khách/gói'')', N'((''VND/khách/gói''))')
    BEGIN
        -- Case 2: Constraint exists and expression matches expected baseline
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackage'), 'base_price_unit', 'AllowsNull') = 1
        BEGIN
            UPDATE dbo.RetreatPackage SET base_price_unit = N'VND/khách/gói' WHERE base_price_unit IS NULL;
            ALTER TABLE dbo.RetreatPackage ALTER COLUMN base_price_unit NVARCHAR(50) NOT NULL;
        END
    END
    ELSE
    BEGIN
        -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
        DECLARE @RP_PriceUnit_Msg NVARCHAR(500) = CAST(ISNULL(@RP_PriceUnit_Def, N'NULL') AS NVARCHAR(255));
        RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.RetreatPackage column base_price_unit has conflicting default constraint [%s] with definition %s. Expected (N''VND/khách/gói''). Please have a DBA review and reconcile this constraint.', 16, 1, @RP_PriceUnit_Constraint, @RP_PriceUnit_Msg);
        RETURN;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'included_treatments'
)
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD included_treatments NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'dietary_plan'
)
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD dietary_plan NVARCHAR(1000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'extra_charge_policy'
)
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD extra_charge_policy NVARCHAR(1000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.RetreatPackage') AND name = 'target_guest'
)
BEGIN
    ALTER TABLE dbo.RetreatPackage ADD target_guest NVARCHAR(500) NULL;
END
GO

-- 2. Reconcile dbo.VillaCategory columns
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'inventory_count'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD inventory_count INT NOT NULL 
        CONSTRAINT DF_VillaCategory_InventoryCount DEFAULT (0);
END
ELSE
BEGIN
    -- Partial-state check: column exists, inspect default constraint and nullability
    DECLARE @VC_Inventory_Constraint sysname;
    DECLARE @VC_Inventory_Def NVARCHAR(MAX);
    SELECT @VC_Inventory_Constraint = d.name, @VC_Inventory_Def = d.definition
    FROM sys.default_constraints d
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.VillaCategory')
      AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.VillaCategory'), 'inventory_count', 'ColumnId');

    IF @VC_Inventory_Constraint IS NULL
    BEGIN
        -- Case 1: No default constraint exists
        -- Safe auto-repair: conservative baseline defaults unverified inventory to 0 to prevent booking unconfirmed villas
        UPDATE dbo.VillaCategory SET inventory_count = 0 WHERE inventory_count IS NULL;
        ALTER TABLE dbo.VillaCategory ALTER COLUMN inventory_count INT NOT NULL;
        ALTER TABLE dbo.VillaCategory ADD CONSTRAINT DF_VillaCategory_InventoryCount DEFAULT (0) FOR inventory_count;
    END
    ELSE IF TRY_CAST(REPLACE(REPLACE(REPLACE(@VC_Inventory_Def, '(', ''), ')', ''), ' ', '') AS INT) = 0
    BEGIN
        -- Case 2: Constraint exists and expression matches expected baseline (0)
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.VillaCategory'), 'inventory_count', 'AllowsNull') = 1
        BEGIN
            UPDATE dbo.VillaCategory SET inventory_count = 0 WHERE inventory_count IS NULL;
            ALTER TABLE dbo.VillaCategory ALTER COLUMN inventory_count INT NOT NULL;
        END
    END
    ELSE
    BEGIN
        -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
        DECLARE @VC_Inventory_Msg NVARCHAR(500) = CAST(ISNULL(@VC_Inventory_Def, N'NULL') AS NVARCHAR(255));
        RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.VillaCategory column inventory_count has conflicting default constraint [%s] with definition %s. Expected (0). Please have a DBA review and reconcile this constraint.', 16, 1, @VC_Inventory_Constraint, @VC_Inventory_Msg);
        RETURN;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'bedroom_count'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD bedroom_count INT NOT NULL 
        CONSTRAINT DF_VillaCategory_BedroomCount DEFAULT (1);
END
ELSE
BEGIN
    -- Partial-state check: column exists, inspect default constraint and nullability
    DECLARE @VC_Bedroom_Constraint sysname;
    DECLARE @VC_Bedroom_Def NVARCHAR(MAX);
    SELECT @VC_Bedroom_Constraint = d.name, @VC_Bedroom_Def = d.definition
    FROM sys.default_constraints d
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.VillaCategory')
      AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.VillaCategory'), 'bedroom_count', 'ColumnId');

    IF @VC_Bedroom_Constraint IS NULL
    BEGIN
        -- Case 1: No default constraint exists
        -- Safe auto-repair: minimal architectural unit is 1 bedroom per villa category
        UPDATE dbo.VillaCategory SET bedroom_count = 1 WHERE bedroom_count IS NULL;
        ALTER TABLE dbo.VillaCategory ALTER COLUMN bedroom_count INT NOT NULL;
        ALTER TABLE dbo.VillaCategory ADD CONSTRAINT DF_VillaCategory_BedroomCount DEFAULT (1) FOR bedroom_count;
    END
    ELSE IF TRY_CAST(REPLACE(REPLACE(REPLACE(@VC_Bedroom_Def, '(', ''), ')', ''), ' ', '') AS INT) = 1
    BEGIN
        -- Case 2: Constraint exists and expression matches expected baseline (1)
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.VillaCategory'), 'bedroom_count', 'AllowsNull') = 1
        BEGIN
            UPDATE dbo.VillaCategory SET bedroom_count = 1 WHERE bedroom_count IS NULL;
            ALTER TABLE dbo.VillaCategory ALTER COLUMN bedroom_count INT NOT NULL;
        END
    END
    ELSE
    BEGIN
        -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
        DECLARE @VC_Bedroom_Msg NVARCHAR(500) = CAST(ISNULL(@VC_Bedroom_Def, N'NULL') AS NVARCHAR(255));
        RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.VillaCategory column bedroom_count has conflicting default constraint [%s] with definition %s. Expected (1). Please have a DBA review and reconcile this constraint.', 16, 1, @VC_Bedroom_Constraint, @VC_Bedroom_Msg);
        RETURN;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'bedroom_description'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD bedroom_description NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'area_description'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD area_description NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'has_private_pool'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD has_private_pool BIT NOT NULL 
        CONSTRAINT DF_VillaCategory_HasPrivatePool DEFAULT (0);
END
ELSE
BEGIN
    -- Partial-state check: column exists, inspect default constraint and nullability
    DECLARE @VC_Pool_Constraint sysname;
    DECLARE @VC_Pool_Def NVARCHAR(MAX);
    SELECT @VC_Pool_Constraint = d.name, @VC_Pool_Def = d.definition
    FROM sys.default_constraints d
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.VillaCategory')
      AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.VillaCategory'), 'has_private_pool', 'ColumnId');

    IF @VC_Pool_Constraint IS NULL
    BEGIN
        -- Case 1: No default constraint exists
        -- Safe auto-repair: conservative baseline defaults to no private pool (0)
        UPDATE dbo.VillaCategory SET has_private_pool = 0 WHERE has_private_pool IS NULL;
        ALTER TABLE dbo.VillaCategory ALTER COLUMN has_private_pool BIT NOT NULL;
        ALTER TABLE dbo.VillaCategory ADD CONSTRAINT DF_VillaCategory_HasPrivatePool DEFAULT (0) FOR has_private_pool;
    END
    ELSE IF TRY_CAST(REPLACE(REPLACE(REPLACE(@VC_Pool_Def, '(', ''), ')', ''), ' ', '') AS INT) = 0
    BEGIN
        -- Case 2: Constraint exists and expression matches expected baseline (0)
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.VillaCategory'), 'has_private_pool', 'AllowsNull') = 1
        BEGIN
            UPDATE dbo.VillaCategory SET has_private_pool = 0 WHERE has_private_pool IS NULL;
            ALTER TABLE dbo.VillaCategory ALTER COLUMN has_private_pool BIT NOT NULL;
        END
    END
    ELSE
    BEGIN
        -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
        DECLARE @VC_Pool_Msg NVARCHAR(500) = CAST(ISNULL(@VC_Pool_Def, N'NULL') AS NVARCHAR(255));
        RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.VillaCategory column has_private_pool has conflicting default constraint [%s] with definition %s. Expected (0). Please have a DBA review and reconcile this constraint.', 16, 1, @VC_Pool_Constraint, @VC_Pool_Msg);
        RETURN;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'pool_description'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD pool_description NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'features_and_amenities'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD features_and_amenities NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.VillaCategory') AND name = 'eligible_packages'
)
BEGIN
    ALTER TABLE dbo.VillaCategory ADD eligible_packages NVARCHAR(250) NULL;
END
GO

-- 3. Reconcile dbo.PhysicalVilla columns
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'zone_name'
)
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD zone_name NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'bedroom_info'
)
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD bedroom_info NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'max_occupancy'
)
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD max_occupancy INT NOT NULL 
        CONSTRAINT DF_PhysicalVilla_MaxOccupancy DEFAULT (3);
END
ELSE
BEGIN
    -- Partial-state check: column exists, inspect default constraint and nullability
    DECLARE @PV_Occupancy_Constraint sysname;
    DECLARE @PV_Occupancy_Def NVARCHAR(MAX);
    SELECT @PV_Occupancy_Constraint = d.name, @PV_Occupancy_Def = d.definition
    FROM sys.default_constraints d
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.PhysicalVilla')
      AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.PhysicalVilla'), 'max_occupancy', 'ColumnId');

    IF @PV_Occupancy_Constraint IS NULL
    BEGIN
        -- Case 1: No default constraint exists
        -- Safe auto-repair: baseline physical villa standard occupancy is 3 guests
        UPDATE dbo.PhysicalVilla SET max_occupancy = 3 WHERE max_occupancy IS NULL;
        ALTER TABLE dbo.PhysicalVilla ALTER COLUMN max_occupancy INT NOT NULL;
        ALTER TABLE dbo.PhysicalVilla ADD CONSTRAINT DF_PhysicalVilla_MaxOccupancy DEFAULT (3) FOR max_occupancy;
    END
    ELSE IF TRY_CAST(REPLACE(REPLACE(REPLACE(@PV_Occupancy_Def, '(', ''), ')', ''), ' ', '') AS INT) = 3
    BEGIN
        -- Case 2: Constraint exists and expression matches expected baseline (3)
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.PhysicalVilla'), 'max_occupancy', 'AllowsNull') = 1
        BEGIN
            UPDATE dbo.PhysicalVilla SET max_occupancy = 3 WHERE max_occupancy IS NULL;
            ALTER TABLE dbo.PhysicalVilla ALTER COLUMN max_occupancy INT NOT NULL;
        END
    END
    ELSE
    BEGIN
        -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
        DECLARE @PV_Occupancy_Msg NVARCHAR(500) = CAST(ISNULL(@PV_Occupancy_Def, N'NULL') AS NVARCHAR(255));
        RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.PhysicalVilla column max_occupancy has conflicting default constraint [%s] with definition %s. Expected (3). Please have a DBA review and reconcile this constraint.', 16, 1, @PV_Occupancy_Constraint, @PV_Occupancy_Msg);
        RETURN;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'area_sqm'
)
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD area_sqm DECIMAL(10,2) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'has_private_pool'
)
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD has_private_pool BIT NOT NULL 
        CONSTRAINT DF_PhysicalVilla_HasPrivatePool DEFAULT (0);
END
ELSE
BEGIN
    -- Partial-state check: column exists, inspect default constraint and nullability
    DECLARE @PV_Pool_Constraint sysname;
    DECLARE @PV_Pool_Def NVARCHAR(MAX);
    SELECT @PV_Pool_Constraint = d.name, @PV_Pool_Def = d.definition
    FROM sys.default_constraints d
    WHERE d.parent_object_id = OBJECT_ID(N'dbo.PhysicalVilla')
      AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.PhysicalVilla'), 'has_private_pool', 'ColumnId');

    IF @PV_Pool_Constraint IS NULL
    BEGIN
        -- Case 1: No default constraint exists
        -- Safe auto-repair: conservative baseline defaults to no private pool (0)
        UPDATE dbo.PhysicalVilla SET has_private_pool = 0 WHERE has_private_pool IS NULL;
        ALTER TABLE dbo.PhysicalVilla ALTER COLUMN has_private_pool BIT NOT NULL;
        ALTER TABLE dbo.PhysicalVilla ADD CONSTRAINT DF_PhysicalVilla_HasPrivatePool DEFAULT (0) FOR has_private_pool;
    END
    ELSE IF TRY_CAST(REPLACE(REPLACE(REPLACE(@PV_Pool_Def, '(', ''), ')', ''), ' ', '') AS INT) = 0
    BEGIN
        -- Case 2: Constraint exists and expression matches expected baseline (0)
        IF COLUMNPROPERTY(OBJECT_ID(N'dbo.PhysicalVilla'), 'has_private_pool', 'AllowsNull') = 1
        BEGIN
            UPDATE dbo.PhysicalVilla SET has_private_pool = 0 WHERE has_private_pool IS NULL;
            ALTER TABLE dbo.PhysicalVilla ALTER COLUMN has_private_pool BIT NOT NULL;
        END
    END
    ELSE
    BEGIN
        -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
        DECLARE @PV_Pool_Msg NVARCHAR(500) = CAST(ISNULL(@PV_Pool_Def, N'NULL') AS NVARCHAR(255));
        RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.PhysicalVilla column has_private_pool has conflicting default constraint [%s] with definition %s. Expected (0). Please have a DBA review and reconcile this constraint.', 16, 1, @PV_Pool_Constraint, @PV_Pool_Msg);
        RETURN;
    END
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'pool_info'
)
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD pool_info NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'view_and_operational_notes'
)
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD view_and_operational_notes NVARCHAR(500) NULL;
END
GO

-- 4. Reconcile dbo.RetreatPackageSpaTreatment bridge table and metadata columns
-- 4.1 If bridge table is missing entirely from older deployment, create it cleanly
IF OBJECT_ID(N'dbo.RetreatPackageSpaTreatment', N'U') IS NULL
BEGIN
    IF OBJECT_ID(N'dbo.SpaTreatment', N'U') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration V003 Precondition Failed: Prerequisite baseline table dbo.SpaTreatment does not exist. Cannot create bridge table dbo.RetreatPackageSpaTreatment with foreign key FK_RPST_SpaTreatment. Please initialize baseline schema with schema.sql first.', 16, 1);
        RETURN;
    END

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
END
ELSE
BEGIN
    -- If bridge table exists, verify prerequisite foreign key to dbo.SpaTreatment
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = 'FK_RPST_SpaTreatment' 
          AND parent_object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment')
    )
    BEGIN
        IF OBJECT_ID(N'dbo.SpaTreatment', N'U') IS NULL
        BEGIN
            RAISERROR(N'HSWRMS Migration V003 Precondition Failed: Prerequisite baseline table dbo.SpaTreatment does not exist. Cannot create foreign key FK_RPST_SpaTreatment on dbo.RetreatPackageSpaTreatment. Please initialize baseline schema with schema.sql first.', 16, 1);
            RETURN;
        END

        ALTER TABLE dbo.RetreatPackageSpaTreatment
            ADD CONSTRAINT FK_RPST_SpaTreatment
            FOREIGN KEY (treatment_id)
            REFERENCES dbo.SpaTreatment(treatment_id);
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = 'FK_RPST_RetreatPackage' 
          AND parent_object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment')
    )
    BEGIN
        ALTER TABLE dbo.RetreatPackageSpaTreatment
            ADD CONSTRAINT FK_RPST_RetreatPackage
            FOREIGN KEY (retreat_package_id)
            REFERENCES dbo.RetreatPackage(retreat_package_id);
    END
END
GO

-- 4.2 Reconcile included_sessions: fail-fast on NULL data, prevent unauthorized entitlement guessing
IF OBJECT_ID(N'dbo.RetreatPackageSpaTreatment', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment') AND name = 'included_sessions'
    )
    BEGIN
        DECLARE @ExistingRows_Sessions INT;
        SELECT @ExistingRows_Sessions = COUNT(*) FROM dbo.RetreatPackageSpaTreatment;
        IF @ExistingRows_Sessions > 0
        BEGIN
            -- Table has existing data, but missing column included_sessions.
            -- Adding NOT NULL DEFAULT (1) would silently grant 1 session to all existing packages.
            -- To avoid guessing guest entitlements, add as NULL and fail-fast for manual DBA/BA review.
            ALTER TABLE dbo.RetreatPackageSpaTreatment ADD included_sessions INT NULL;
            RAISERROR(N'HSWRMS Migration V003 Entitlement Safety Error: Column included_sessions added as NULLable to dbo.RetreatPackageSpaTreatment because %d existing row(s) exist. DBA/BA must explicitly verify and populate included_sessions before NOT NULL constraint can be applied.', 16, 1, @ExistingRows_Sessions);
            RETURN;
        END
        ELSE
        BEGIN
            -- Table has 0 rows: safe to add NOT NULL with default constraint
            ALTER TABLE dbo.RetreatPackageSpaTreatment ADD included_sessions INT NOT NULL 
                CONSTRAINT DF_RPST_included_sessions DEFAULT (1);
        END
    END
    ELSE
    BEGIN
        -- Column exists. Verify if there are any NULL values requiring resolution.
        DECLARE @NullSessionsCount INT;
        SELECT @NullSessionsCount = COUNT(*) FROM dbo.RetreatPackageSpaTreatment WHERE included_sessions IS NULL;
        IF @NullSessionsCount > 0
        BEGIN
            -- FAIL-FAST: Do not guess 1 session for NULL rows
            RAISERROR(N'HSWRMS Migration V003 Entitlement Safety Error: dbo.RetreatPackageSpaTreatment contains %d row(s) with NULL included_sessions. Automatic conversion to 1 session is prohibited to prevent unauthorized entitlement grant. Manual DBA/BA resolution required before enforcing NOT NULL.', 16, 1, @NullSessionsCount);
            RETURN;
        END

        -- All rows (if any) have non-NULL included_sessions. Verify default constraint.
        DECLARE @RPST_Sessions_Constraint sysname;
        DECLARE @RPST_Sessions_Def NVARCHAR(MAX);
        SELECT @RPST_Sessions_Constraint = d.name, @RPST_Sessions_Def = d.definition
        FROM sys.default_constraints d
        WHERE d.parent_object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment')
          AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackageSpaTreatment'), 'included_sessions', 'ColumnId');

        IF @RPST_Sessions_Constraint IS NULL
        BEGIN
            -- Case 1: No default constraint exists
            IF COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackageSpaTreatment'), 'included_sessions', 'AllowsNull') = 1
            BEGIN
                ALTER TABLE dbo.RetreatPackageSpaTreatment ALTER COLUMN included_sessions INT NOT NULL;
            END
            ALTER TABLE dbo.RetreatPackageSpaTreatment ADD CONSTRAINT DF_RPST_included_sessions DEFAULT (1) FOR included_sessions;
        END
        ELSE IF TRY_CAST(REPLACE(REPLACE(REPLACE(@RPST_Sessions_Def, '(', ''), ')', ''), ' ', '') AS INT) = 1
        BEGIN
            -- Case 2: Constraint exists and matches expected baseline (1)
            IF COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackageSpaTreatment'), 'included_sessions', 'AllowsNull') = 1
            BEGIN
                ALTER TABLE dbo.RetreatPackageSpaTreatment ALTER COLUMN included_sessions INT NOT NULL;
            END
        END
        ELSE
        BEGIN
            -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
            DECLARE @RPST_Sessions_Msg NVARCHAR(500) = CAST(ISNULL(@RPST_Sessions_Def, N'NULL') AS NVARCHAR(255));
            RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.RetreatPackageSpaTreatment column included_sessions has conflicting default constraint [%s] with definition %s. Expected (1). Please have a DBA review and reconcile this constraint.', 16, 1, @RPST_Sessions_Constraint, @RPST_Sessions_Msg);
            RETURN;
        END
    END
END
GO

-- 4.3 Reconcile entitlement_status: fail-fast on NULL data, prevent unauthorized entitlement guessing
IF OBJECT_ID(N'dbo.RetreatPackageSpaTreatment', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment') AND name = 'entitlement_status'
    )
    BEGIN
        DECLARE @ExistingRows_Status INT;
        SELECT @ExistingRows_Status = COUNT(*) FROM dbo.RetreatPackageSpaTreatment;
        IF @ExistingRows_Status > 0
        BEGIN
            -- Table has existing data, but missing column entitlement_status.
            -- Adding NOT NULL DEFAULT ('INCLUDED') would silently confirm all existing treatments as INCLUDED.
            -- To avoid guessing guest entitlements, add as NULL and fail-fast for manual DBA/BA review.
            ALTER TABLE dbo.RetreatPackageSpaTreatment ADD entitlement_status VARCHAR(50) NULL;
            RAISERROR(N'HSWRMS Migration V003 Entitlement Safety Error: Column entitlement_status added as NULLable to dbo.RetreatPackageSpaTreatment because %d existing row(s) exist. DBA/BA must explicitly verify and populate entitlement_status before NOT NULL constraint can be applied.', 16, 1, @ExistingRows_Status);
            RETURN;
        END
        ELSE
        BEGIN
            -- Table has 0 rows: safe to add NOT NULL with default constraint
            ALTER TABLE dbo.RetreatPackageSpaTreatment ADD entitlement_status VARCHAR(50) NOT NULL 
                CONSTRAINT DF_RPST_entitlement_status DEFAULT ('INCLUDED');
        END
    END
    ELSE
    BEGIN
        -- Column exists. Verify if there are any NULL values requiring resolution.
        DECLARE @NullStatusCount INT;
        SELECT @NullStatusCount = COUNT(*) FROM dbo.RetreatPackageSpaTreatment WHERE entitlement_status IS NULL;
        IF @NullStatusCount > 0
        BEGIN
            -- FAIL-FAST: Do not guess 'INCLUDED' for NULL rows
            RAISERROR(N'HSWRMS Migration V003 Entitlement Safety Error: dbo.RetreatPackageSpaTreatment contains %d row(s) with NULL entitlement_status. Automatic conversion to ''INCLUDED'' is prohibited to prevent unconfirmed guest privilege grant. Manual DBA/BA resolution required before enforcing NOT NULL.', 16, 1, @NullStatusCount);
            RETURN;
        END

        -- All rows (if any) have non-NULL entitlement_status. Verify default constraint.
        DECLARE @RPST_Status_Constraint sysname;
        DECLARE @RPST_Status_Def NVARCHAR(MAX);
        SELECT @RPST_Status_Constraint = d.name, @RPST_Status_Def = d.definition
        FROM sys.default_constraints d
        WHERE d.parent_object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment')
          AND d.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackageSpaTreatment'), 'entitlement_status', 'ColumnId');

        IF @RPST_Status_Constraint IS NULL
        BEGIN
            -- Case 1: No default constraint exists
            IF COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackageSpaTreatment'), 'entitlement_status', 'AllowsNull') = 1
            BEGIN
                ALTER TABLE dbo.RetreatPackageSpaTreatment ALTER COLUMN entitlement_status VARCHAR(50) NOT NULL;
            END
            ALTER TABLE dbo.RetreatPackageSpaTreatment ADD CONSTRAINT DF_RPST_entitlement_status DEFAULT ('INCLUDED') FOR entitlement_status;
        END
        ELSE IF LTRIM(RTRIM(@RPST_Status_Def)) IN ('(''INCLUDED'')', '((''INCLUDED''))', '(N''INCLUDED'')', '((N''INCLUDED''))')
        BEGIN
            -- Case 2: Constraint exists and matches expected baseline ('INCLUDED')
            IF COLUMNPROPERTY(OBJECT_ID(N'dbo.RetreatPackageSpaTreatment'), 'entitlement_status', 'AllowsNull') = 1
            BEGIN
                ALTER TABLE dbo.RetreatPackageSpaTreatment ALTER COLUMN entitlement_status VARCHAR(50) NOT NULL;
            END
        END
        ELSE
        BEGIN
            -- Case 3: Constraint exists but expression is conflicting -> FAIL-FAST
            DECLARE @RPST_Status_Msg NVARCHAR(500) = CAST(ISNULL(@RPST_Status_Def, N'NULL') AS NVARCHAR(255));
            RAISERROR(N'HSWRMS Migration V003 Error: Table dbo.RetreatPackageSpaTreatment column entitlement_status has conflicting default constraint [%s] with definition %s. Expected (''INCLUDED''). Please have a DBA review and reconcile this constraint.', 16, 1, @RPST_Status_Constraint, @RPST_Status_Msg);
            RETURN;
        END
    END
END
GO

-- 4.4 Reconcile notes column
IF OBJECT_ID(N'dbo.RetreatPackageSpaTreatment', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.RetreatPackageSpaTreatment') AND name = 'notes'
    )
    BEGIN
        ALTER TABLE dbo.RetreatPackageSpaTreatment ADD notes NVARCHAR(500) NULL;
    END
END
GO

-- 5. Performance index for villa availability search and assignment
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'dbo.PhysicalVilla') AND name = 'IX_PhysicalVilla_Status_Category'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PhysicalVilla_Status_Category
        ON dbo.PhysicalVilla(villa_status, villa_category_id);
END
GO
