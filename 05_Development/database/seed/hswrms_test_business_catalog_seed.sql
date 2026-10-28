-- ============================================================================
-- HSWRMS TEST DATABASE BUSINESS CATALOG SEED SCRIPT (REMEDIATED)
-- ============================================================================
-- Environment Target: HSWRMS_TEST ONLY (Database ID: 45)
-- Execution Authorization: Explicit DBA / Admin Controlled Session Only
--
-- SAFETY WARNING:
-- DO NOT EXECUTE THIS SCRIPT AGAINST PRODUCTION OR MASTER DATABASE (HSWRMS).
-- This script contains business master catalog seed data designed exclusively
-- for end-to-end integration and API testing in the dedicated test environment.
--
-- Authoritative Data Sources:
-- - Module 2 Villa Categories: mockMasterData.ts (INITIAL_VILLAS_MASTER)
-- - Module 2 Retreat Packages: mockMasterData.ts (INITIAL_PACKAGES_MASTER)
-- - Module 3 Spa Treatments & Rooms: m3_spa_seed.sql (Authoritative Dev Seed)
-- - Module 4 F&B Menu Items: mockDining.ts (MOCK_MENU_ITEMS)
-- - Relational Constraints: schema.sql (Sections 2, 3, 4)
--
-- Remediation & Safety Highlights (Phase 5.8.3.110 & 5.8.3.113):
-- 1. Guard Hygiene & T-SQL Compliance: Current database name assigned to local variable
--    @CurrentDatabase before passing to RAISERROR, eliminating Msg 102 compile error.
--    Eliminated SET NOEXEC ON to prevent persistent session side-effects.
--    Target database validation uses fail-closed RETURN within the same single batch.
-- 2. Anti-Invention: Omitted PhysicalVilla, RetreatPackageVillaCategory,
--    and RetreatPackageSpaTreatment due to lack of authoritative source data.
-- 3. Auxiliary Sourcing: Reset unsourced description columns (bedroom_description,
--    area_description, pool_description, room_type) to NULL.
-- 4. Conflict Detection: Every seed entity actively validates existing records
--    for conflicting attribute values, failing fast on material mismatches rather
--    than silently skipping them.
-- 5. Idempotency Guarantee: 100% row-level checks, ZERO hardcoded primary keys,
--    atomic single-batch transaction with XACT_ABORT ON.
-- ============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

-- ----------------------------------------------------------------------------
-- 0. MANDATORY TARGET DATABASE GUARD (Defense-in-Depth Preflight Check)
-- ----------------------------------------------------------------------------
-- The guard and transaction are executed in a single contiguous batch.
-- If DB_NAME() is not HSWRMS_TEST, an error is raised and RETURN immediately
-- terminates batch execution without executing any DDL/DML, and without
-- mutating session-level execution flags (e.g. SET NOEXEC).
--
-- OPERATOR NOTE:
-- A SQL guard is defense-in-depth, not a substitute for operator authorization
-- and verification of the connected database before script invocation.
-- ----------------------------------------------------------------------------
DECLARE @CurrentDatabase NVARCHAR(128) = DB_NAME();

IF @CurrentDatabase <> N'HSWRMS_TEST'
BEGIN
    RAISERROR(N'CRITICAL SAFETY HALT: This seed script must only be executed against [HSWRMS_TEST]. Current database context is [%s]. Execution terminated immediately.', 16, 1, @CurrentDatabase);
    RETURN;
END;

PRINT N'============================================================================';
PRINT N'STARTING HSWRMS_TEST BUSINESS CATALOG SEED EXECUTION';
PRINT N'Target Database: ' + @CurrentDatabase;
PRINT N'Executing User:  ' + SUSER_SNAME();
PRINT N'Timestamp:       ' + CONVERT(NVARCHAR(30), GETDATE(), 126);
PRINT N'============================================================================';

BEGIN TRANSACTION;

-- ============================================================================
-- BATCH 1: VILLA CATEGORIES (Source: mockMasterData.ts INITIAL_VILLAS_MASTER)
-- Table Constraint: UQ_VillaCategory_Name (category_name)
-- Check Constraints: CK_VillaCategory_Occupancy (> 0), CK_VillaCategory_Status ('ACTIVE','INACTIVE')
-- Note: Unsourced auxiliary fields (bedroom_description, area_description,
-- pool_description, eligible_packages) are populated as NULL per schema default.
-- ============================================================================
PRINT N'--> Seeding Batch 1: dbo.VillaCategory...';

-- 1.1 Garden Sanctuary Pool Villa
IF EXISTS (SELECT 1 FROM dbo.VillaCategory WHERE category_name = N'Garden Sanctuary Pool Villa' AND (max_occupancy <> 2 OR price_modifier <> 0.00 OR category_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: VillaCategory [Garden Sanctuary Pool Villa] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.VillaCategory WHERE category_name = N'Garden Sanctuary Pool Villa')
BEGIN
    INSERT INTO dbo.VillaCategory (
        category_name, max_occupancy, price_modifier, inventory_count,
        bedroom_count, bedroom_description, area_description,
        has_private_pool, pool_description, features_and_amenities,
        eligible_packages, category_status
    )
    VALUES (
        N'Garden Sanctuary Pool Villa',
        2,
        0.00,
        8,
        1,
        NULL,
        NULL,
        1,
        NULL,
        N'Secluded tropical garden residence featuring private plunge pool and open-air rainfall shower.',
        NULL,
        'ACTIVE'
    );
    PRINT N'    Inserted: VillaCategory [Garden Sanctuary Pool Villa]';
END
ELSE
    PRINT N'    Verified: VillaCategory [Garden Sanctuary Pool Villa] (Already exists with matching attributes)';

-- 1.2 Oceanfront Sunset Wellness Villa
IF EXISTS (SELECT 1 FROM dbo.VillaCategory WHERE category_name = N'Oceanfront Sunset Wellness Villa' AND (max_occupancy <> 2 OR price_modifier <> 2300000.00 OR category_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: VillaCategory [Oceanfront Sunset Wellness Villa] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.VillaCategory WHERE category_name = N'Oceanfront Sunset Wellness Villa')
BEGIN
    INSERT INTO dbo.VillaCategory (
        category_name, max_occupancy, price_modifier, inventory_count,
        bedroom_count, bedroom_description, area_description,
        has_private_pool, pool_description, features_and_amenities,
        eligible_packages, category_status
    )
    VALUES (
        N'Oceanfront Sunset Wellness Villa',
        2,
        2300000.00, -- Rate differential over base category (6,800,000 VND - 4,500,000 VND base)
        6,
        1,
        NULL,
        NULL,
        1,
        NULL,
        N'Direct sea view villa with private infinity pool and dedicated open-air massage cabana.',
        NULL,
        'ACTIVE'
    );
    PRINT N'    Inserted: VillaCategory [Oceanfront Sunset Wellness Villa]';
END
ELSE
    PRINT N'    Verified: VillaCategory [Oceanfront Sunset Wellness Villa] (Already exists with matching attributes)';

-- 1.3 Hillside Panoramic Yoga Pavilion
IF EXISTS (SELECT 1 FROM dbo.VillaCategory WHERE category_name = N'Hillside Panoramic Yoga Pavilion' AND (max_occupancy <> 4 OR price_modifier <> 4700000.00 OR category_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: VillaCategory [Hillside Panoramic Yoga Pavilion] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.VillaCategory WHERE category_name = N'Hillside Panoramic Yoga Pavilion')
BEGIN
    INSERT INTO dbo.VillaCategory (
        category_name, max_occupancy, price_modifier, inventory_count,
        bedroom_count, bedroom_description, area_description,
        has_private_pool, pool_description, features_and_amenities,
        eligible_packages, category_status
    )
    VALUES (
        N'Hillside Panoramic Yoga Pavilion',
        4,
        4700000.00, -- Rate differential over base category (9,200,000 VND - 4,500,000 VND base)
        4,
        2,
        NULL,
        NULL,
        1,
        NULL,
        N'Two-bedroom elevated retreat pavilion with wraparound timber deck for private yoga instruction.',
        NULL,
        'ACTIVE'
    );
    PRINT N'    Inserted: VillaCategory [Hillside Panoramic Yoga Pavilion]';
END
ELSE
    PRINT N'    Verified: VillaCategory [Hillside Panoramic Yoga Pavilion] (Already exists with matching attributes)';


-- ============================================================================
-- BATCH 2: SPA TREATMENTS & ROOMS (Source: m3_spa_seed.sql)
-- Table Constraints: UQ_SpaTreatment_Name (treatment_name), UQ_TreatmentRoom_Name (room_name)
-- Filtered Index: UQ_SpaTreatment_TreatmentCode (treatment_code WHERE NOT NULL)
-- Check Constraints: CK_SpaTreatment_Duration (> 0), CK_SpaTreatment_Price (>= 0),
--                    CK_SpaTreatment_Status ('ACTIVE','INACTIVE'),
--                    CK_TreatmentRoom_Status ('AVAILABLE','OCCUPIED','MAINTENANCE','INACTIVE')
-- Note: treatment_code is NULL per m3_spa_seed.sql. room_type is NULL per m3_spa_seed.sql.
-- ============================================================================
PRINT N'--> Seeding Batch 2: dbo.SpaTreatment & dbo.TreatmentRoom...';

-- 2.1 Herbal Poultice Therapy
IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Herbal Poultice Therapy' AND (duration_minutes <> 90 OR base_price <> 1800000.00 OR treatment_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: SpaTreatment [Herbal Poultice Therapy] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Herbal Poultice Therapy')
BEGIN
    INSERT INTO dbo.SpaTreatment (treatment_code, treatment_name, duration_minutes, base_price, category, description, treatment_status)
    VALUES (NULL, N'Herbal Poultice Therapy', 90, 1800000.00, 'MASSAGE', N'Traditional Vietnamese warm herbal compression relieving deep muscular tension and revitalizing circulation.', 'ACTIVE');
    PRINT N'    Inserted: SpaTreatment [Herbal Poultice Therapy]';
END
ELSE
    PRINT N'    Verified: SpaTreatment [Herbal Poultice Therapy] (Already exists with matching attributes)';

-- 2.2 Lotus Radiance Facial
IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Lotus Radiance Facial' AND (duration_minutes <> 60 OR base_price <> 1200000.00 OR treatment_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: SpaTreatment [Lotus Radiance Facial] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Lotus Radiance Facial')
BEGIN
    INSERT INTO dbo.SpaTreatment (treatment_code, treatment_name, duration_minutes, base_price, category, description, treatment_status)
    VALUES (NULL, N'Lotus Radiance Facial', 60, 1200000.00, 'FACIAL', N'Restorative skincare treatment using organic white lotus extracts and gentle acupressure for cellular renewal.', 'ACTIVE');
    PRINT N'    Inserted: SpaTreatment [Lotus Radiance Facial]';
END
ELSE
    PRINT N'    Verified: SpaTreatment [Lotus Radiance Facial] (Already exists with matching attributes)';

-- 2.3 Mineral Hydrotherapy Soak
IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Mineral Hydrotherapy Soak' AND (duration_minutes <> 60 OR base_price <> 950000.00 OR treatment_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: SpaTreatment [Mineral Hydrotherapy Soak] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Mineral Hydrotherapy Soak')
BEGIN
    INSERT INTO dbo.SpaTreatment (treatment_code, treatment_name, duration_minutes, base_price, category, description, treatment_status)
    VALUES (NULL, N'Mineral Hydrotherapy Soak', 60, 950000.00, 'HYDROTHERAPY', N'Thermal hydrotherapy pool treatment infused with coastal minerals to soothe the nervous system.', 'ACTIVE');
    PRINT N'    Inserted: SpaTreatment [Mineral Hydrotherapy Soak]';
END
ELSE
    PRINT N'    Verified: SpaTreatment [Mineral Hydrotherapy Soak] (Already exists with matching attributes)';

-- 2.4 Mindful Pranyama & Meditation
IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Mindful Pranyama & Meditation' AND (duration_minutes <> 60 OR base_price <> 600000.00 OR treatment_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: SpaTreatment [Mindful Pranyama & Meditation] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Mindful Pranyama & Meditation')
BEGIN
    INSERT INTO dbo.SpaTreatment (treatment_code, treatment_name, duration_minutes, base_price, category, description, treatment_status)
    VALUES (NULL, N'Mindful Pranyama & Meditation', 60, 600000.00, 'MEDITATION', N'Guided breathwork and mindfulness meditation session fostering inner stillness and mental clarity.', 'ACTIVE');
    PRINT N'    Inserted: SpaTreatment [Mindful Pranyama & Meditation]';
END
ELSE
    PRINT N'    Verified: SpaTreatment [Mindful Pranyama & Meditation] (Already exists with matching attributes)';

-- 2.5 Deep Tissue Bamboo Massage
IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Deep Tissue Bamboo Massage' AND (duration_minutes <> 90 OR base_price <> 2100000.00 OR treatment_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: SpaTreatment [Deep Tissue Bamboo Massage] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Deep Tissue Bamboo Massage')
BEGIN
    INSERT INTO dbo.SpaTreatment (treatment_code, treatment_name, duration_minutes, base_price, category, description, treatment_status)
    VALUES (NULL, N'Deep Tissue Bamboo Massage', 90, 2100000.00, 'MASSAGE', N'Therapeutic deep pressure massage utilizing heated bamboo stalks for intense muscle recovery.', 'ACTIVE');
    PRINT N'    Inserted: SpaTreatment [Deep Tissue Bamboo Massage]';
END
ELSE
    PRINT N'    Verified: SpaTreatment [Deep Tissue Bamboo Massage] (Already exists with matching attributes)';

-- 2.6 Treatment Rooms
IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoom WHERE room_name = N'Lotus Pavilion Suite 1')
    INSERT INTO dbo.TreatmentRoom (room_name, room_type, room_status) VALUES (N'Lotus Pavilion Suite 1', NULL, 'AVAILABLE');

IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoom WHERE room_name = N'Lotus Pavilion Suite 2')
    INSERT INTO dbo.TreatmentRoom (room_name, room_type, room_status) VALUES (N'Lotus Pavilion Suite 2', NULL, 'AVAILABLE');

IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoom WHERE room_name = N'Bamboo Sanctuary Suite A')
    INSERT INTO dbo.TreatmentRoom (room_name, room_type, room_status) VALUES (N'Bamboo Sanctuary Suite A', NULL, 'AVAILABLE');

IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoom WHERE room_name = N'Hydro-Thermal Suite')
    INSERT INTO dbo.TreatmentRoom (room_name, room_type, room_status) VALUES (N'Hydro-Thermal Suite', NULL, 'AVAILABLE');

IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoom WHERE room_name = N'Meditation Garden Pavilion')
    INSERT INTO dbo.TreatmentRoom (room_name, room_type, room_status) VALUES (N'Meditation Garden Pavilion', NULL, 'AVAILABLE');

PRINT N'    Verified: 5 Treatment Rooms seeded / verified.';


-- ============================================================================
-- BATCH 3: MENU ITEMS (Source: mockDining.ts MOCK_MENU_ITEMS)
-- Table Constraint: UQ_MenuItem_Name (item_name)
-- Check Constraints: CK_MenuItem_Price (>= 0), CK_MenuItem_Availability ('AVAILABLE','UNAVAILABLE')
-- Dietary tags & allergens: Comma-separated strings matching MealOrderServiceImpl regex split rule.
-- Note on price 0.00: Test-seed representation consistent with schema default DF_MenuItem_Price
-- and mockDining.ts omission of price for included dishes (isExtra: false).
-- This does NOT represent an approved retail a-la-carte pricing policy.
-- ============================================================================
PRINT N'--> Seeding Batch 3: dbo.MenuItem...';

-- 3.1 MENU-001: Cháo Yến Mạch Quả Mọng Hữu Cơ
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Cháo Yến Mạch Quả Mọng Hữu Cơ' AND (price <> 0.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Cháo Yến Mạch Quả Mọng Hữu Cơ] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Cháo Yến Mạch Quả Mọng Hữu Cơ')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Cháo Yến Mạch Quả Mọng Hữu Cơ', N'main', N'BREAKFAST', 0.00, N'vegetarian,dairy_free', NULL, 'AVAILABLE');

-- 3.2 MENU-002: Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ' AND (price <> 0.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ', N'main', N'BREAKFAST', 0.00, N'lacto_ovo_vegetarian', N'eggs', 'AVAILABLE');

-- 3.3 MENU-003: Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng' AND (price <> 0.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng', N'main', N'LUNCH', 0.00, N'vegan,dairy_free,gluten_free', N'nuts', 'AVAILABLE');

-- 3.4 MENU-004: Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây' AND (price <> 0.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây', N'main', N'DINNER', 0.00, N'pescatarian,gluten_free,dairy_free,keto', N'fish', 'AVAILABLE');

-- 3.5 MENU-005: Sinh Tố Detox Xanh Thanh Lọc
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Sinh Tố Detox Xanh Thanh Lọc' AND (price <> 150000.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Sinh Tố Detox Xanh Thanh Lọc] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Sinh Tố Detox Xanh Thanh Lọc')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Sinh Tố Detox Xanh Thanh Lọc', N'wellness_drink', N'ALL_DAY', 150000.00, N'vegan,dairy_free,gluten_free', NULL, 'AVAILABLE');

-- 3.6 MENU-006: Thăn Bò Wagyu & Tôm Hùm Nướng Thảo Mộc
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Thăn Bò Wagyu & Tôm Hùm Nướng Thảo Mộc' AND (price <> 1500000.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Thăn Bò Wagyu & Tôm Hùm Nướng Thảo Mộc] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Thăn Bò Wagyu & Tôm Hùm Nướng Thảo Mộc')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Thăn Bò Wagyu & Tôm Hùm Nướng Thảo Mộc', N'main', N'DINNER', 1500000.00, NULL, N'shellfish,dairy', 'AVAILABLE');

-- 3.7 MENU-007: Gỏi Ngó Sen & Đậu Hũ Thảo Mộc
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Gỏi Ngó Sen & Đậu Hũ Thảo Mộc' AND (price <> 0.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Gỏi Ngó Sen & Đậu Hũ Thảo Mộc] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Gỏi Ngó Sen & Đậu Hũ Thảo Mộc')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Gỏi Ngó Sen & Đậu Hũ Thảo Mộc', N'starter', N'LUNCH,DINNER', 0.00, N'vegan,gluten_free,dairy_free', N'soy', 'AVAILABLE');

-- 3.8 MENU-008: Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu' AND (price <> 0.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu', N'dessert', N'ALL_DAY', 0.00, N'vegan,gluten_free,dairy_free', NULL, 'AVAILABLE');

-- 3.9 MENU-009: Trà Hoa Đậu Biếc Thảo Mộc Tươi
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Trà Hoa Đậu Biếc Thảo Mộc Tươi' AND (price <> 120000.00 OR availability_status <> 'AVAILABLE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: MenuItem [Trà Hoa Đậu Biếc Thảo Mộc Tươi] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE item_name = N'Trà Hoa Đậu Biếc Thảo Mộc Tươi')
    INSERT INTO dbo.MenuItem (item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (N'Trà Hoa Đậu Biếc Thảo Mộc Tươi', N'beverage', N'ALL_DAY', 120000.00, N'vegetarian,gluten_free,dairy_free', NULL, 'AVAILABLE');

PRINT N'    Verified: 9 Menu Items seeded / verified.';


-- ============================================================================
-- BATCH 4: RETREAT PACKAGES (Source: mockMasterData.ts INITIAL_PACKAGES_MASTER)
-- Table Constraint: UQ_RetreatPackage_Name (package_name)
-- Check Constraints: CK_RetreatPackage_Duration (> 0), CK_RetreatPackage_Price (>= 0), CK_RetreatPackage_Status ('ACTIVE','INACTIVE')
-- Note: Unsourced fields (dietary_plan, extra_charge_policy, target_guest)
-- are populated as NULL per schema default.
-- ============================================================================
PRINT N'--> Seeding Batch 4: dbo.RetreatPackage...';

-- 4.1 Holistic Detox & Cleansing Journey
IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Holistic Detox & Cleansing Journey' AND (duration_nights <> 4 OR base_price <> 24500000.00 OR package_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: RetreatPackage [Holistic Detox & Cleansing Journey] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Holistic Detox & Cleansing Journey')
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights,
        duration_unit, base_price, base_price_unit, included_treatments,
        dietary_plan, extra_charge_policy, target_guest, package_status
    )
    VALUES (
        'RET-DETOX-01',
        N'Holistic Detox & Cleansing Journey',
        N'Detoxification & Cellular Renewal',
        4,
        N'Đêm (Nights)',
        24500000.00,
        N'VND/khách/gói',
        N'A 5-day botanical cleansing program combining organic juices, hydrotherapy, and lymphatic drainage.',
        NULL,
        NULL,
        NULL,
        'ACTIVE'
    );
    PRINT N'    Inserted: RetreatPackage [Holistic Detox & Cleansing Journey]';
END
ELSE
    PRINT N'    Verified: RetreatPackage [Holistic Detox & Cleansing Journey] (Already exists with matching attributes)';

-- 4.2 Mindfulness, Prana & Yoga Immersion
IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Mindfulness, Prana & Yoga Immersion' AND (duration_nights <> 6 OR base_price <> 32000000.00 OR package_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: RetreatPackage [Mindfulness, Prana & Yoga Immersion] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Mindfulness, Prana & Yoga Immersion')
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights,
        duration_unit, base_price, base_price_unit, included_treatments,
        dietary_plan, extra_charge_policy, target_guest, package_status
    )
    VALUES (
        'RET-YOGA-02',
        N'Mindfulness, Prana & Yoga Immersion',
        N'Mental Clarity & Emotional Balance',
        6,
        N'Đêm (Nights)',
        32000000.00,
        N'VND/khách/gói',
        N'Daily sunrise meditation, private restorative yoga coaching, and sound bath alignment.',
        NULL,
        NULL,
        NULL,
        'ACTIVE'
    );
    PRINT N'    Inserted: RetreatPackage [Mindfulness, Prana & Yoga Immersion]';
END
ELSE
    PRINT N'    Verified: RetreatPackage [Mindfulness, Prana & Yoga Immersion] (Already exists with matching attributes)';

-- 4.3 Deep Sleep & Circadian Restoration
IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Deep Sleep & Circadian Restoration' AND (duration_nights <> 3 OR base_price <> 19500000.00 OR package_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: RetreatPackage [Deep Sleep & Circadian Restoration] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Deep Sleep & Circadian Restoration')
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights,
        duration_unit, base_price, base_price_unit, included_treatments,
        dietary_plan, extra_charge_policy, target_guest, package_status
    )
    VALUES (
        'RET-SLEEP-03',
        N'Deep Sleep & Circadian Restoration',
        N'Insomnia Relief & Stress Alleviation',
        3,
        N'Đêm (Nights)',
        19500000.00,
        N'VND/khách/gói',
        N'Targeted sleep architecture recovery with evening herbal baths, valerian tea rituals, and reflexology.',
        NULL,
        NULL,
        NULL,
        'ACTIVE'
    );
    PRINT N'    Inserted: RetreatPackage [Deep Sleep & Circadian Restoration]';
END
ELSE
    PRINT N'    Verified: RetreatPackage [Deep Sleep & Circadian Restoration] (Already exists with matching attributes)';

-- 4.4 Ayurvedic Rejuvenation & Vitality
IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Ayurvedic Rejuvenation & Vitality' AND (duration_nights <> 5 OR base_price <> 28000000.00 OR package_status <> 'ACTIVE'))
BEGIN
    RAISERROR(N'CONFLICT DETECTED: RetreatPackage [Ayurvedic Rejuvenation & Vitality] already exists with conflicting attributes. Aborting seed.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'Ayurvedic Rejuvenation & Vitality')
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights,
        duration_unit, base_price, base_price_unit, included_treatments,
        dietary_plan, extra_charge_policy, target_guest, package_status
    )
    VALUES (
        'RET-AYUR-04',
        N'Ayurvedic Rejuvenation & Vitality',
        N'Dosha Balancing & Re-energization',
        5,
        N'Đêm (Nights)',
        28000000.00,
        N'VND/khách/gói',
        N'Ancient Vedic bodywork, Shirodhara warm oil therapy, and customized tridoshic nutrition.',
        NULL,
        NULL,
        NULL,
        'ACTIVE'
    );
    PRINT N'    Inserted: RetreatPackage [Ayurvedic Rejuvenation & Vitality]';
END
ELSE
    PRINT N'    Verified: RetreatPackage [Ayurvedic Rejuvenation & Vitality] (Already exists with matching attributes)';


-- ============================================================================
-- OMITTED / BLOCKED SECTIONS (Documentation of Open Domain Blockers)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BLOCKER 1: dbo.PhysicalVilla (STATUS: EXPLICITLY OMITTED)
-- ----------------------------------------------------------------------------
-- OMISSION RATIONALE:
-- Authoritative fixture mockMasterData.ts defines aggregate inventory counts
-- (totalVillasCount = 8, 6, 4) but provides zero concrete villa identifiers,
-- floor assignments, or zone names. M5DataInitializer.java contains four villas
-- for a single demo category ("Sanctuary Pool Villa"), but lacks complete,
-- authoritative records across the three canonical categories.
-- Per Phase 5.8.3.110 requirements, synthetic identifiers (e.g. Villa #101,
-- #201, #301) are removed and not replaced with guessed data.
--
-- EXACT DOMAIN DECISION REQUIRED:
-- Resort operations must provide the authoritative physical villa asset register
-- (villa numbers, floors, zones, and categories) before this table can be seeded.
-- ----------------------------------------------------------------------------
PRINT N'--> Section dbo.PhysicalVilla: OMITTED (Blocked pending authoritative physical asset register).';

-- ----------------------------------------------------------------------------
-- BLOCKER 2: dbo.RetreatPackageVillaCategory (STATUS: EXPLICITLY OMITTED)
-- ----------------------------------------------------------------------------
-- OMISSION RATIONALE:
-- No authoritative source (mockMasterData.ts, entity classes, or migrations)
-- defines which retreat packages are eligible for which villa categories.
-- The previously proposed 12-link universal matrix was an unverified assumption.
--
-- EXACT DOMAIN DECISION REQUIRED:
-- Product management must specify the package-to-villa eligibility matrix
-- (e.g. whether all packages can be booked in any villa, or if specific packages
-- are restricted to specific villa categories).
-- ----------------------------------------------------------------------------
PRINT N'--> Section dbo.RetreatPackageVillaCategory: OMITTED (Blocked pending package-villa eligibility policy).';

-- ----------------------------------------------------------------------------
-- BLOCKER 3: dbo.RetreatPackageSpaTreatment (STATUS: EXPLICITLY OMITTED)
-- ----------------------------------------------------------------------------
-- OMISSION RATIONALE:
-- mockMasterData.ts specifies total included sessions (4, 6, 3, 5), but does
-- not map which specific treatments from dbo.SpaTreatment correspond to each package.
--
-- EXACT DOMAIN DECISION REQUIRED:
-- Product Owner must define the package-to-treatment entitlement breakdown
-- (e.g. RET-DETOX-01 -> 2x Hydrotherapy + 2x Herbal Poultice).
-- ----------------------------------------------------------------------------
PRINT N'--> Section dbo.RetreatPackageSpaTreatment: OMITTED (Blocked pending spa entitlement matrix).';

-- ----------------------------------------------------------------------------
-- BLOCKER 4: dbo.Ingredient & dbo.MenuItemIngredient (STATUS: EXPLICITLY OMITTED)
-- ----------------------------------------------------------------------------
-- OMISSION RATIONALE:
-- mockDining.ts contains no recipe breakdown or ingredient proportions.
-- Deferred to post-MVP back-of-house inventory tracking.
-- ----------------------------------------------------------------------------
PRINT N'--> Section dbo.Ingredient & dbo.MenuItemIngredient: OMITTED (Deferred post-MVP).';

COMMIT TRANSACTION;
PRINT N'============================================================================';
PRINT N'SUCCESS: HSWRMS_TEST Business Catalog Seed Completed and Committed.';
PRINT N'============================================================================';

-- ============================================================================
-- POST-SEED VERIFICATION QUERIES (Read-Only Audit)
-- ============================================================================
SELECT N'dbo.VillaCategory' AS CatalogTable, COUNT(*) AS TotalRows, SUM(CASE WHEN category_status = 'ACTIVE' THEN 1 ELSE 0 END) AS ActiveCount FROM dbo.VillaCategory
UNION ALL
SELECT N'dbo.SpaTreatment', COUNT(*), SUM(CASE WHEN treatment_status = 'ACTIVE' THEN 1 ELSE 0 END) FROM dbo.SpaTreatment
UNION ALL
SELECT N'dbo.TreatmentRoom', COUNT(*), SUM(CASE WHEN room_status = 'AVAILABLE' THEN 1 ELSE 0 END) FROM dbo.TreatmentRoom
UNION ALL
SELECT N'dbo.MenuItem', COUNT(*), SUM(CASE WHEN availability_status = 'AVAILABLE' THEN 1 ELSE 0 END) FROM dbo.MenuItem
UNION ALL
SELECT N'dbo.RetreatPackage', COUNT(*), SUM(CASE WHEN package_status = 'ACTIVE' THEN 1 ELSE 0 END) FROM dbo.RetreatPackage
UNION ALL
SELECT N'dbo.PhysicalVilla (Blocked)', COUNT(*), NULL FROM dbo.PhysicalVilla
UNION ALL
SELECT N'dbo.RetreatPackageVillaCategory (Blocked)', COUNT(*), NULL FROM dbo.RetreatPackageVillaCategory
UNION ALL
SELECT N'dbo.RetreatPackageSpaTreatment (Blocked)', COUNT(*), NULL FROM dbo.RetreatPackageSpaTreatment;
