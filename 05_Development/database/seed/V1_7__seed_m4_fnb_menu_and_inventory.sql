USE [HSWRMS];


GO
SET ANSI_NULLS ON;


GO
SET QUOTED_IDENTIFIER ON;


GO
SET NOCOUNT ON;


GO
PRINT '============================================================================';

PRINT 'Starting HSWRMS V1_7 Seed: M4 F&B Menu Catalog, Ingredients & Active Inventory';

PRINT '============================================================================';

-- 0. SCHEMA RECONCILIATION FOR M4 F&B ENTITIES & TABLES
-- Ensure all columns required by Spring Boot JPA entities exist on HSWRMS
-- dbo.MenuItem columns
IF COL_LENGTH('dbo.MenuItem', 'meal_type') IS NULL
    BEGIN
        ALTER TABLE dbo.MenuItem
            ADD meal_type NVARCHAR (50) NULL;
        PRINT 'Added column meal_type to dbo.MenuItem.';
    END

IF COL_LENGTH('dbo.MenuItem', 'allergen_information') IS NULL
    BEGIN
        ALTER TABLE dbo.MenuItem
            ADD allergen_information NVARCHAR (MAX) NULL;
        PRINT 'Added column allergen_information to dbo.MenuItem.';
    END

IF COL_LENGTH('dbo.MenuItem', 'availability_status') IS NULL
    BEGIN
        ALTER TABLE dbo.MenuItem
            ADD availability_status VARCHAR (20) CONSTRAINT DF_MenuItem_AvailabilityStatus DEFAULT ('AVAILABLE') WITH VALUES NOT NULL;
        PRINT 'Added column availability_status to dbo.MenuItem.';
    END

IF COL_LENGTH('dbo.MenuItem', 'is_available') IS NULL
    BEGIN
        ALTER TABLE dbo.MenuItem
            ADD is_available BIT CONSTRAINT DF_MenuItem_IsAvailable DEFAULT (1) WITH VALUES NOT NULL;
        PRINT 'Added column is_available to dbo.MenuItem.';
    END

IF COL_LENGTH('dbo.MenuItem', 'is_extra') IS NULL
    BEGIN
        ALTER TABLE dbo.MenuItem
            ADD is_extra BIT CONSTRAINT DF_MenuItem_IsExtra DEFAULT (0) WITH VALUES NOT NULL;
        PRINT 'Added column is_extra to dbo.MenuItem.';
    END


GO
UPDATE dbo.MenuItem
SET    is_extra = 1
WHERE  menu_item_id BETWEEN 1 AND 15;

UPDATE dbo.MenuItem
SET    is_extra = 0
WHERE  menu_item_id >= 96;


GO
-- dbo.MenuItemIngredient columns
IF COL_LENGTH('dbo.MenuItemIngredient', 'required_quantity') IS NULL
    BEGIN
        IF COL_LENGTH('dbo.MenuItemIngredient', 'quantity_required') IS NOT NULL
            BEGIN
                ALTER TABLE dbo.MenuItemIngredient
                    ADD required_quantity DECIMAL (18, 4) NULL;
                EXECUTE ('UPDATE dbo.MenuItemIngredient SET required_quantity = quantity_required WHERE required_quantity IS NULL;');
                PRINT 'Added required_quantity and synced from quantity_required in dbo.MenuItemIngredient.';
            END
        ELSE
            BEGIN
                ALTER TABLE dbo.MenuItemIngredient
                    ADD required_quantity DECIMAL (18, 4) NULL;
                PRINT 'Added column required_quantity to dbo.MenuItemIngredient.';
            END
    END

-- dbo.IngredientBatch columns
IF COL_LENGTH('dbo.IngredientBatch', 'stock_condition') IS NULL
    BEGIN
        ALTER TABLE dbo.IngredientBatch
            ADD stock_condition VARCHAR (50) CONSTRAINT DF_IngredientBatch_StockCondition DEFAULT ('FRESH') WITH VALUES NOT NULL;
        PRINT 'Added column stock_condition to dbo.IngredientBatch.';
    END

IF COL_LENGTH('dbo.IngredientBatch', 'expiration_date') IS NULL
    BEGIN
        IF COL_LENGTH('dbo.IngredientBatch', 'expiry_date') IS NOT NULL
            BEGIN
                ALTER TABLE dbo.IngredientBatch
                    ADD expiration_date DATE NULL;
                EXECUTE ('UPDATE dbo.IngredientBatch SET expiration_date = expiry_date WHERE expiration_date IS NULL;');
                PRINT 'Added expiration_date and synced from expiry_date in dbo.IngredientBatch.';
            END
        ELSE
            BEGIN
                ALTER TABLE dbo.IngredientBatch
                    ADD expiration_date DATE NULL;
                PRINT 'Added column expiration_date to dbo.IngredientBatch.';
            END
    END

IF COL_LENGTH('dbo.IngredientBatch', 'remaining_quantity') IS NULL
    BEGIN
        IF COL_LENGTH('dbo.IngredientBatch', 'quantity_remaining') IS NOT NULL
            BEGIN
                ALTER TABLE dbo.IngredientBatch
                    ADD remaining_quantity DECIMAL (18, 3) NULL;
                EXECUTE ('UPDATE dbo.IngredientBatch SET remaining_quantity = quantity_remaining WHERE remaining_quantity IS NULL;');
                PRINT 'Added remaining_quantity and synced from quantity_remaining in dbo.IngredientBatch.';
            END
        ELSE
            BEGIN
                ALTER TABLE dbo.IngredientBatch
                    ADD remaining_quantity DECIMAL (18, 3) NULL;
                PRINT 'Added column remaining_quantity to dbo.IngredientBatch.';
            END
    END

-- dbo.MealOrder & MealOrderItem columns
IF OBJECT_ID('dbo.MealOrder', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.MealOrder', 'special_notes') IS NULL
    BEGIN
        ALTER TABLE dbo.MealOrder
            ADD special_notes NVARCHAR (1000) NULL;
        PRINT 'Added column special_notes to dbo.MealOrder.';
    END

IF OBJECT_ID('dbo.MealOrderItem', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.MealOrderItem', 'unit_price') IS NULL
    BEGIN
        ALTER TABLE dbo.MealOrderItem
            ADD unit_price DECIMAL (18, 2) CONSTRAINT DF_MealOrderItem_UnitPrice DEFAULT (0) WITH VALUES NOT NULL;
        PRINT 'Added column unit_price to dbo.MealOrderItem.';
    END

IF OBJECT_ID('dbo.MealOrderItem', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.MealOrderItem', 'preparation_status') IS NULL
    BEGIN
        ALTER TABLE dbo.MealOrderItem
            ADD preparation_status VARCHAR (20) CONSTRAINT DF_MealOrderItem_PreparationStatus DEFAULT ('PENDING') WITH VALUES NOT NULL;
        PRINT 'Added column preparation_status to dbo.MealOrderItem.';
    END


GO
BEGIN TRANSACTION;

-- 1. NẠP TOÀN BỘ 12 MÓN ĂN THỰC DƯỠNG (dbo.MenuItem)
SET IDENTITY_INSERT dbo.MenuItem ON;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 1)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (1, N'Súp Bào Ngư & Nấm Đông Cô Dưỡng Nhan', 'STARTER', 'DINNER', 180000.00, 'pescatarian,gluten_free,dairy_free', 'molluscs', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Súp Bào Ngư & Nấm Đông Cô Dưỡng Nhan',
           category             = 'STARTER',
           meal_type            = 'DINNER',
           price                = 180000.00,
           dietary_tags         = 'pescatarian,gluten_free,dairy_free',
           allergen_information = 'molluscs',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 1;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 2)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (2, N'Cá Chẽm Vịnh Vĩnh Hy Hấp Trà Xanh & Gừng Non', 'MAIN', 'LUNCH', 220000.00, 'pescatarian,gluten_free,dairy_free', 'fish', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Cá Chẽm Vịnh Vĩnh Hy Hấp Trà Xanh & Gừng Non',
           category             = 'MAIN',
           meal_type            = 'LUNCH',
           price                = 220000.00,
           dietary_tags         = 'pescatarian,gluten_free,dairy_free',
           allergen_information = 'fish',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 2;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 3)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (3, N'Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê Dưỡng Sinh', 'MAIN', 'LUNCH', 95000.00, 'vegan,gluten_free,dairy_free', '', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê Dưỡng Sinh',
           category             = 'MAIN',
           meal_type            = 'LUNCH',
           price                = 95000.00,
           dietary_tags         = 'vegan,gluten_free,dairy_free',
           allergen_information = '',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 3;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 4)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (4, N'Salad Rau Rừng Núi Chúa & Sốt Mè Rang Hữu Cơ', 'STARTER', 'LUNCH', 85000.00, 'vegetarian,dairy_free', 'sesame', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Salad Rau Rừng Núi Chúa & Sốt Mè Rang Hữu Cơ',
           category             = 'STARTER',
           meal_type            = 'LUNCH',
           price                = 85000.00,
           dietary_tags         = 'vegetarian,dairy_free',
           allergen_information = 'sesame',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 4;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 5)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (5, N'Chè Yến Ngũ Vị & Hạt Sen Long Nhãn', 'DESSERT', 'DINNER', 150000.00, 'pescatarian,gluten_free,dairy_free', '', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Chè Yến Ngũ Vị & Hạt Sen Long Nhãn',
           category             = 'DESSERT',
           meal_type            = 'DINNER',
           price                = 150000.00,
           dietary_tags         = 'pescatarian,gluten_free,dairy_free',
           allergen_information = '',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 5;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 6)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (6, N'Trà Thảo Mộc Thược Dược & Táo Đỏ Núi Chúa', 'BEVERAGE', 'ALL_DAY', 45000.00, 'vegan,gluten_free,dairy_free', '', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Trà Thảo Mộc Thược Dược & Táo Đỏ Núi Chúa',
           category             = 'BEVERAGE',
           meal_type            = 'ALL_DAY',
           price                = 45000.00,
           dietary_tags         = 'vegan,gluten_free,dairy_free',
           allergen_information = '',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 6;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 7)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (7, N'Gỏi Ngó Sen & Đậu Hũ Thảo Mộc', 'STARTER', 'LUNCH', 90000.00, 'vegetarian,vegan,dairy_free,gluten_free', 'soy', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Gỏi Ngó Sen & Đậu Hũ Thảo Mộc',
           category             = 'STARTER',
           meal_type            = 'LUNCH',
           price                = 90000.00,
           dietary_tags         = 'vegetarian,vegan,dairy_free,gluten_free',
           allergen_information = 'soy',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 7;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 8)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (8, N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu', 'DESSERT', 'BREAKFAST', 65000.00, 'vegan,gluten_free,dairy_free', '', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu',
           category             = 'DESSERT',
           meal_type            = 'BREAKFAST',
           price                = 65000.00,
           dietary_tags         = 'vegan,gluten_free,dairy_free',
           allergen_information = '',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 8;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 9)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (9, N'Cháo Yến Mạch Quả Mọng Hữu Cơ', 'MAIN', 'BREAKFAST', 85000.00, 'vegetarian,dairy_free', '', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Cháo Yến Mạch Quả Mọng Hữu Cơ',
           category             = 'MAIN',
           meal_type            = 'BREAKFAST',
           price                = 85000.00,
           dietary_tags         = 'vegetarian,dairy_free',
           allergen_information = '',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 9;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 10)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (10, N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ', 'MAIN', 'BREAKFAST', 110000.00, 'lacto_ovo_vegetarian', 'eggs', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ',
           category             = 'MAIN',
           meal_type            = 'BREAKFAST',
           price                = 110000.00,
           dietary_tags         = 'lacto_ovo_vegetarian',
           allergen_information = 'eggs',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 10;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 11)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (11, N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng', 'MAIN', 'LUNCH', 120000.00, 'vegan,dairy_free,gluten_free', 'nuts', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng',
           category             = 'MAIN',
           meal_type            = 'LUNCH',
           price                = 120000.00,
           dietary_tags         = 'vegan,dairy_free,gluten_free',
           allergen_information = 'nuts',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 11;

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItem
               WHERE  menu_item_id = 12)
    INSERT  INTO dbo.MenuItem (
        menu_item_id,
        item_name,
        category,
        meal_type,
        price,
        dietary_tags,
        allergen_information,
        availability_status
    )
    VALUES                    (12, N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây', 'MAIN', 'DINNER', 260000.00, 'pescatarian,gluten_free,dairy_free,keto', 'fish', 'AVAILABLE');
ELSE
    UPDATE dbo.MenuItem
    SET    item_name            = N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây',
           category             = 'MAIN',
           meal_type            = 'DINNER',
           price                = 260000.00,
           dietary_tags         = 'pescatarian,gluten_free,dairy_free,keto',
           allergen_information = 'fish',
           availability_status  = 'AVAILABLE'
    WHERE  menu_item_id = 12;

SET IDENTITY_INSERT dbo.MenuItem OFF;

-- Đồng bộ is_available = 1 nếu có cột is_available
IF COL_LENGTH('dbo.MenuItem', 'is_available') IS NOT NULL
    BEGIN
        EXECUTE ('UPDATE dbo.MenuItem SET is_available = 1 WHERE availability_status = ''AVAILABLE'';');
    END

-- 2. NẠP NGUYÊN LIỆU (dbo.Ingredient)
IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Yến mạch nguyên cám')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Yến mạch nguyên cám');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Sữa hạnh nhân hữu cơ')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Sữa hạnh nhân hữu cơ');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Quả mọng rừng tươi')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Quả mọng rừng tươi');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Mật ong hoa bạc hà')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Mật ong hoa bạc hà');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Trứng gà hữu cơ')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Trứng gà hữu cơ');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Bánh mì bột chua thủ công')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Bánh mì bột chua thủ công');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Quả bơ Hass nghiền')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Quả bơ Hass nghiền');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Xà lách mầm & muối biển hồng')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Xà lách mầm & muối biển hồng');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Bào ngư sống Vịnh Vĩnh Hy');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Nấm đông cô hữu cơ')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Nấm đông cô hữu cơ');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Cá chẽm tươi phi lê')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Cá chẽm tươi phi lê');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Gạo lứt đỏ Điện Biên')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Gạo lứt đỏ Điện Biên');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Hạt sen Huế tươi')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Hạt sen Huế tươi');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Hạt kê vàng dưỡng sinh')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Hạt kê vàng dưỡng sinh');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Rau rừng Núi Chúa bản địa')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Rau rừng Núi Chúa bản địa');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Sốt mè rang Nhật Bản')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Sốt mè rang Nhật Bản');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Yến sào đảo Khánh Hòa')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Yến sào đảo Khánh Hòa');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Trà hoa thược dược sấy lạnh')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Trà hoa thược dược sấy lạnh');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Táo đỏ hữu cơ Tân Cương')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Táo đỏ hữu cơ Tân Cương');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Hạt chia organic')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Hạt chia organic');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Cá hồi Nauy tươi phi lê')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Cá hồi Nauy tươi phi lê');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Quinoa trắng hữu cơ')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Quinoa trắng hữu cơ');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Nước cốt dừa Bến Tre')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Nước cốt dừa Bến Tre');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Xoài Cát Chu chín cây')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Xoài Cát Chu chín cây');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Gừng non & trà xanh hữu cơ')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Gừng non & trà xanh hữu cơ');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Ngó sen hồ giòn')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Ngó sen hồ giòn');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Đậu hũ non áp chảo')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Đậu hũ non áp chảo');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Rau răm & mè rang')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Rau răm & mè rang');

IF NOT EXISTS (SELECT 1
               FROM   dbo.Ingredient
               WHERE  ingredient_name = N'Giấm dừa lên men tự nhiên')
    INSERT  INTO dbo.Ingredient (
        ingredient_name
    )
    VALUES                      (N'Giấm dừa lên men tự nhiên');

-- 3. NẠP LÔ NGUYÊN LIỆU KHẢ DỤNG HẠN ĐẾN NĂM 2027 (dbo.IngredientBatch)
DECLARE @defaultExpiry AS DATE = '2027-12-31';

INSERT INTO dbo.IngredientBatch (
    ingredient_id,
    received_date,
    expiration_date,
    remaining_quantity,
    stock_condition
)
SELECT i.ingredient_id,
       '2026-09-01',
       @defaultExpiry,
       CASE WHEN i.ingredient_name LIKE N'%Trứng%' THEN 300.000 WHEN i.ingredient_name LIKE N'%Bánh mì%' THEN 240.000 WHEN i.ingredient_name LIKE N'%Sữa%' THEN 35000.000 WHEN i.ingredient_name LIKE N'%cốt dừa%' THEN 25000.000 WHEN i.ingredient_name LIKE N'%Mật ong%' THEN 8000.000 WHEN i.ingredient_name LIKE N'%Sốt%' THEN 5000.000 ELSE 15000.000 END,
       'FRESH'
FROM   dbo.Ingredient AS i
WHERE  NOT EXISTS (SELECT 1
                   FROM   dbo.IngredientBatch AS b
                   WHERE  b.ingredient_id = i.ingredient_id
                          AND b.remaining_quantity > 0);

-- Đồng bộ sang quantity_remaining và expiry_date nếu các cột cũ này tồn tại
IF COL_LENGTH('dbo.IngredientBatch', 'quantity_remaining') IS NOT NULL
    BEGIN
        EXECUTE ('UPDATE dbo.IngredientBatch SET quantity_remaining = remaining_quantity WHERE quantity_remaining IS NULL OR quantity_remaining = 0;');
    END

IF COL_LENGTH('dbo.IngredientBatch', 'expiry_date') IS NOT NULL
    BEGIN
        EXECUTE ('UPDATE dbo.IngredientBatch SET expiry_date = expiration_date WHERE expiry_date IS NULL;');
    END

-- 4. NẠP CÔNG THỨC ĐỊNH LƯỢNG (dbo.MenuItemIngredient)
-- Menu 1
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 1
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 1,
           ingredient_id,
           120.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 1
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Nấm đông cô hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 1,
           ingredient_id,
           50.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Nấm đông cô hữu cơ';

-- Menu 2
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 2
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Cá chẽm tươi phi lê'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 2,
           ingredient_id,
           200.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Cá chẽm tươi phi lê';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 2
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name LIKE N'%gừng%'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 2,
           ingredient_id,
           20.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name LIKE N'%gừng%';

-- Menu 3
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 3
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Gạo lứt đỏ Điện Biên'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 3,
           ingredient_id,
           100.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Gạo lứt đỏ Điện Biên';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 3
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Hạt sen Huế tươi'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 3,
           ingredient_id,
           40.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Hạt sen Huế tươi';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 3
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Hạt kê vàng dưỡng sinh'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 3,
           ingredient_id,
           30.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Hạt kê vàng dưỡng sinh';

-- Menu 4
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 4
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Rau rừng Núi Chúa bản địa'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 4,
           ingredient_id,
           150.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Rau rừng Núi Chúa bản địa';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 4
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Sốt mè rang Nhật Bản'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 4,
           ingredient_id,
           40.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Sốt mè rang Nhật Bản';

-- Menu 5
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 5
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Yến sào đảo Khánh Hòa'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 5,
           ingredient_id,
           25.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Yến sào đảo Khánh Hòa';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 5
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Hạt sen Huế tươi'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 5,
           ingredient_id,
           40.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Hạt sen Huế tươi';

-- Menu 6
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 6
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Trà hoa thược dược sấy lạnh'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 6,
           ingredient_id,
           15.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Trà hoa thược dược sấy lạnh';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 6
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Táo đỏ hữu cơ Tân Cương'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 6,
           ingredient_id,
           20.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Táo đỏ hữu cơ Tân Cương';

-- Menu 7
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 7
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Ngó sen hồ giòn'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 7,
           ingredient_id,
           80.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Ngó sen hồ giòn';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 7
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Đậu hũ non áp chảo'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 7,
           ingredient_id,
           60.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Đậu hũ non áp chảo';

-- Menu 8
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 8
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name LIKE N'%chia%'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 8,
           ingredient_id,
           30.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name LIKE N'%chia%';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 8
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name LIKE N'%cốt dừa%'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 8,
           ingredient_id,
           120.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name LIKE N'%cốt dừa%';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 8
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name LIKE N'%xoài%'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 8,
           ingredient_id,
           70.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name LIKE N'%xoài%';

-- Menu 9
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 9
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Yến mạch nguyên cám'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 9,
           ingredient_id,
           60.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Yến mạch nguyên cám';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 9
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Sữa hạnh nhân hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 9,
           ingredient_id,
           180.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Sữa hạnh nhân hữu cơ';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 9
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Quả mọng rừng tươi'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 9,
           ingredient_id,
           40.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Quả mọng rừng tươi';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 9
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Mật ong hoa bạc hà'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 9,
           ingredient_id,
           15.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Mật ong hoa bạc hà';

-- Menu 10
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 10
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Trứng gà hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 10,
           ingredient_id,
           2.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Trứng gà hữu cơ';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 10
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Bánh mì bột chua thủ công'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 10,
           ingredient_id,
           2.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Bánh mì bột chua thủ công';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 10
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Quả bơ Hass nghiền'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 10,
           ingredient_id,
           80.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Quả bơ Hass nghiền';

-- Menu 11
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 11
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Quinoa trắng hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 11,
           ingredient_id,
           70.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Quinoa trắng hữu cơ';

IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 11
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Sốt mè rang Nhật Bản'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 11,
           ingredient_id,
           30.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Sốt mè rang Nhật Bản';

-- Menu 12
IF NOT EXISTS (SELECT 1
               FROM   dbo.MenuItemIngredient
               WHERE  menu_item_id = 12
                      AND ingredient_id = (SELECT TOP 1 ingredient_id
                                           FROM   dbo.Ingredient
                                           WHERE  ingredient_name = N'Cá hồi Nauy tươi phi lê'))
    INSERT INTO dbo.MenuItemIngredient (
        menu_item_id,
        ingredient_id,
        required_quantity
    )
    SELECT 12,
           ingredient_id,
           160.000
    FROM   dbo.Ingredient
    WHERE  ingredient_name = N'Cá hồi Nauy tươi phi lê';

-- ============================================================================
-- ĐỊNH NGHĨA CÔNG THỨC ĐỊNH LƯỢNG CHO TẤT CẢ CÁC MÓN GÓI RETREAT (96 ĐẾN 175)
-- Đảm bảo mỗi món đều có liên kết nguyên liệu & lô khả dụng để trừ kho đúng
-- ============================================================================
INSERT INTO dbo.MenuItemIngredient (
    menu_item_id,
    ingredient_id,
    required_quantity
)
SELECT v.menu_item_id,
       v.ingredient_id,
       v.required_quantity
FROM   (VALUES -- 96 Cháo Yến Mạch Bí Đỏ & Hạt Chia
       (96, 148, 0.080), (96, 163, 0.100), (96, 158, 0.020), -- 97 Nước Ép Táo Cần Tây Không Đường
       (97, 206, 0.150), (97, 211, 0.100), -- 98 Cơm Gạo Lứt Đậu Hũ Hấp Nấm
       (98, 146, 0.100), (98, 201, 0.100), (98, 188, 0.050), -- 99 Canh Rau Củ Thảo Mộc
       (99, 166, 0.080), (99, 168, 0.080), (99, 163, 0.080), -- 100 Salad Củ Dền Dưỡng Sinh
       (100, 165, 0.100), (100, 176, 0.100), (100, 227, 0.020), -- 101 Cá Hấp Gừng Non & Khoai Lang Hấp
       (101, 196, 0.180), (101, 181, 0.020), (101, 156, 0.150), -- 102 Súp Bí Đỏ Dưỡng Sinh
       (102, 163, 0.200), (102, 219, 0.050), (102, 227, 0.010), -- 103 Rau Củ Hữu Cơ Hấp
       (103, 166, 0.080), (103, 168, 0.080), (103, 156, 0.080), -- 104 Táo Tươi & Sữa Hạt Không Đường
       (104, 206, 0.150), (104, 224, 0.200), -- 105 Trà Gừng Ấm Dưỡng Thể
       (105, 236, 0.010), (105, 233, 0.020), -- 106 Cháo Kê Hạt Sen Dưỡng Tâm
       (106, 149, 0.080), (106, 159, 0.050), -- 107 Đĩa Trái Cây Nhiệt Đới Theo Mùa
       (107, 218, 0.250), -- 108 Quinoa & Đậu Hũ Nướng Sả
       (108, 150, 0.080), (108, 201, 0.120), (108, 182, 0.020), -- 109 Canh Rong Biển Thanh Nhiệt
       (109, 191, 0.030), (109, 201, 0.080), -- 110 Salad Rau Mầm Sốt Chanh Dây
       (110, 175, 0.100), (110, 234, 0.020), (110, 227, 0.020), -- 111 Nấm Áp Chảo & Rau Xanh Hấp
       (111, 189, 0.150), (111, 168, 0.100), -- 112 Súp Đậu Lăng Đỏ
       (112, 203, 0.100), (112, 166, 0.050), (112, 180, 0.030), -- 113 Nước Ép Dứa Cà Rốt Dưa Leo
       (113, 216, 0.100), (113, 166, 0.100), (113, 177, 0.100), -- 114 Trà Hoa Cúc Dưỡng Tâm Ban Đêm
       (114, 235, 0.015), (114, 233, 0.015), -- 115 Cháo Kê Hạt Sen & Sữa Đậu Nành
       (115, 149, 0.080), (115, 159, 0.050), (115, 222, 0.150), -- 116 Cơm Lứt Đậu Đỏ & Đậu Hũ Sốt Nấm
       (116, 146, 0.100), (116, 157, 0.050), (116, 201, 0.100), -- 117 Canh Cải Bó Xôi Nấu Nấm
       (117, 169, 0.120), (117, 188, 0.050), -- 118 Rau Củ Nướng Thảo Mộc & Khoai Lang
       (118, 156, 0.150), (118, 166, 0.080), (118, 227, 0.020), -- 119 Trà Gạo Lứt Rang Mộc
       (119, 238, 0.020), -- 120 Overnight Oats Chuối & Hạt Chia
       (120, 148, 0.080), (120, 207, 0.100), (120, 158, 0.020), -- 121 Cà Ri Rau Củ Cốt Dừa Nhẹ & Quinoa
       (121, 150, 0.080), (121, 167, 0.100), (121, 226, 0.080), -- 122 Bún Gạo Lứt Đậu Hũ Nướng Sả & Rau Sống
       (122, 151, 0.150), (122, 201, 0.100), (122, 176, 0.050), -- 123 Trà Bạc Hà Tươi Thanh Nhiệt
       (123, 237, 0.015), (123, 239, 0.010), -- 124 Súp Cà Rốt Gừng Ấm & Hạt Bí
       (124, 166, 0.150), (124, 181, 0.015), (124, 160, 0.020), -- 125 Đậu Hũ Hấp Nước Tương & Cải Thìa
       (125, 201, 0.150), (125, 172, 0.100), -- 126 Canh Rong Biển Đậu Hũ Non
       (126, 191, 0.030), (126, 201, 0.100), -- 127 Cơm Gạo Lứt Xào Rau Củ & Nấm
       (127, 146, 0.100), (127, 166, 0.050), (127, 188, 0.050), -- 128 Hạt Hạnh Nhân Sấy Mộc Không Muối
       (128, 161, 0.060), -- 129 Trà Hoa Cúc Mật Ong Nhẹ
       (129, 235, 0.015), (129, 233, 0.015), -- 130 Cháo Yến Mạch Nấu Sữa Hạt Sen
       (130, 148, 0.080), (130, 159, 0.050), (130, 224, 0.150), -- 131 Trứng Gà Ta Luộc Lòng Đào & Bánh Mì Nguyên Cám
       (131, 204, 2.000), (131, 154, 1.000), -- 132 Kiwi Tươi Cắt Lát
       (132, 218, 0.150), -- 133 Cơm Gạo Lứt Cá Hồi Hấp Gừng Hành
       (133, 146, 0.100), (133, 193, 0.150), (133, 181, 0.015), -- 134 Canh Củ Sen Hầm Táo Đỏ
       (134, 164, 0.120), (134, 206, 0.050), -- 135 Salad Bơ Sáp Dầu Hạt Cải
       (135, 217, 0.100), (135, 176, 0.100), (135, 227, 0.020), -- 136 Trái Cây Rừng Tự Nhiên
       (136, 243, 0.150), -- 137 Cá Chẽm Áp Chảo Sốt Bơ Chanh & Khoai Nghiền
       (137, 196, 0.180), (137, 167, 0.120), (137, 234, 0.020), -- 138 Súp Măng Tây Xanh Nấu Nấm
       (138, 213, 0.100), (138, 188, 0.050), -- 139 Măng Tây & Cà Rốt Baby Nướng Dầu Ô-liu
       (139, 213, 0.100), (139, 166, 0.080), (139, 227, 0.020), -- 140 Bí Đỏ Hấp Mật Ong Nhẹ
       (140, 163, 0.150), (140, 233, 0.020), -- 141 Chuối Tiêu Dồi Dào Melatonin & Trà Hoa Cúc
       (141, 207, 0.150), (141, 235, 0.015), -- 142 Trứng Chần Bánh Mì Nguyên Cám & Bơ Nghiền
       (142, 204, 2.000), (142, 154, 1.000), (142, 217, 0.080), -- 143 Cá Hồi Áp Chảo Sốt Mè Gừng & Cơm Gạo Lứt
       (143, 193, 0.160), (143, 146, 0.100), (143, 162, 0.015), -- 144 Canh Sườn Hầm Củ Sen & Hạt Sen Dưỡng Tâm
       (144, 205, 0.250), (144, 164, 0.100), (144, 159, 0.040), -- 145 Sữa Chua Hy Lạp Lên Men & Trà Thảo Dược
       (145, 221, 0.120), (145, 235, 0.015), -- 146 Chè Long Nhãn Hạt Sen Nấu Đường Phèn Mộc
       (146, 159, 0.080), (146, 218, 0.050), -- 147 Trà Thảo Mộc An Thần Hoa Cúc Táo Đỏ
       (147, 235, 0.020), (147, 206, 0.030), -- 148 Phở Nước Dùng Gà Xé Thảo Mộc
       (148, 153, 0.180), (148, 197, 0.100), (148, 205, 0.250), -- 149 Cá Hồi Nướng Giấy Bạc & Salad Quinoa
       (149, 193, 0.160), (149, 150, 0.080), (149, 176, 0.080), -- 150 Cháo Nấm Bào Ngư Đậu Hũ Non
       (150, 147, 0.080), (150, 188, 0.060), (150, 201, 0.080), -- 151 Ức Gà Nướng Thảo Mộc Hương Thảo & Cơm Lứt
       (151, 197, 0.180), (151, 146, 0.100), -- 152 Cá Hấp Thì Là Cơm Lứt & Súp Bí Đỏ
       (152, 196, 0.160), (152, 146, 0.100), (152, 163, 0.080), -- 153 Sữa Chua Hy Lạp Granola Quả Mọng Berries
       (153, 221, 0.120), (153, 155, 0.040), (153, 243, 0.050), -- 154 Cá Hồi Nauy Áp Chảo Quinoa & Súp Cà Rốt Gừng
       (154, 193, 0.160), (154, 150, 0.080), (154, 166, 0.080), -- 155 Gà Hầm Nấm Đông Cô Giàu Collagen
       (155, 197, 0.180), (155, 214, 0.060), (155, 205, 0.200), -- 156 Dâu Tây Đà Lạt Tươi Chấm Mật Ong
       (156, 209, 0.150), (156, 233, 0.020), -- 157 Cá Thu Hấp Lá Chuối & Salad Cam Quả Bơ
       (157, 195, 0.180), (157, 208, 0.080), (157, 217, 0.080), -- 158 Nấm Portobello Nướng Thảo Dược & Rau Xanh
       (158, 189, 0.160), (158, 176, 0.100), (158, 227, 0.020), -- 159 Tôm Biển Hấp Nước Dừa & Cơm Lứt Bí Đỏ
       (159, 200, 0.150), (159, 146, 0.100), (159, 226, 0.050), -- 160 Sinh Tố Việt Quất Quả Mọng Chống Lão Hóa
       (160, 210, 0.100), (160, 219, 0.150), (160, 233, 0.015), -- 161 Cá Hồi Canh Rau Dền & Cơm Gạo Lứt Giàu Canxi
       (161, 193, 0.150), (161, 171, 0.100), (161, 146, 0.100), -- 162 Phở Gà Nước Dùng Hầm Xương Hữu Cơ 12 Giờ
       (162, 153, 0.180), (162, 197, 0.120), (162, 205, 0.300), -- 163 Gà Hầm Nước Xương Dưỡng Cốt & Cải Thìa Quinoa
       (163, 197, 0.150), (163, 172, 0.080), (163, 150, 0.080), -- 164 Bún Cá Biển Nấu Ngót & Canh Rong Biển
       (164, 152, 0.180), (164, 196, 0.140), (164, 191, 0.030), -- 165 Ức Gà Nướng Bông Cải Xanh & Cơm Quinoa Đốt Mỡ
       (165, 197, 0.180), (165, 168, 0.100), (165, 150, 0.080), -- 166 Cá Hấp Thì Là & Salad Cầu Vồng Dầu Ô-liu
       (166, 196, 0.160), (166, 185, 0.015), (166, 176, 0.100), -- 167 Đậu Nành Nhật Edamame Luộc Muối Hồng
       (167, 202, 0.150), (167, 229, 0.005), -- 168 Cháo Yến Mạch Thịt Nạc Bằm & Trứng Chín Kỹ
       (168, 148, 0.080), (168, 199, 0.080), (168, 204, 1.000), -- 169 Cơm Mềm Bò Nạc Hầm Bí Đỏ & Canh Rau Ngót Giàu Sắt
       (169, 147, 0.100), (169, 198, 0.120), (169, 170, 0.080), -- 170 Cá Hồi Nấu Chín Kỹ Khoai Lang & Súp Rau Củ
       (170, 193, 0.150), (170, 156, 0.100), (170, 166, 0.080), -- 171 Sữa Chua Tiệt Trùng & Cam Tươi Bóc Vỏ
       (171, 220, 0.120), (171, 208, 0.100), -- 172 Cơm Gạo Lứt Gà Hấp Lá Chanh & Canh Cải Bó Xôi
       (172, 146, 0.100), (172, 197, 0.150), (172, 169, 0.080), -- 173 Bún Gà Nấu Chín Kỹ Rau Củ Vườn Nhà
       (173, 152, 0.180), (173, 197, 0.120), (173, 166, 0.080), -- 174 Cháo Thịt Nạc Thảo Mộc & Sữa Tiệt Trùng Hữu Cơ
       (174, 147, 0.080), (174, 199, 0.080), (174, 219, 0.150), -- 175 Đậu Hũ Sốt Cà Chua & Thịt Nạc Hầm Rau Củ Mềm
       (175, 201, 0.100), (175, 178, 0.080), (175, 199, 0.080)) AS v(menu_item_id, ingredient_id, required_quantity)
WHERE  NOT EXISTS (SELECT 1
                   FROM   dbo.MenuItemIngredient AS r
                   WHERE  r.menu_item_id = v.menu_item_id
                          AND r.ingredient_id = v.ingredient_id);

-- Đồng bộ sang quantity_required nếu cột cũ này tồn tại
IF COL_LENGTH('dbo.MenuItemIngredient', 'quantity_required') IS NOT NULL
    BEGIN
        EXECUTE ('UPDATE dbo.MenuItemIngredient SET quantity_required = required_quantity WHERE quantity_required IS NULL;');
    END

COMMIT TRANSACTION;

PRINT '============================================================================';

PRINT 'HSWRMS V1_7 Seed Completed: All 12 Menu items, ingredients, batches & recipes are active!';

PRINT '============================================================================';