-- ============================================================================
-- HSWRMS Migration V007: M4 Dietary F&B Ingredients, Usable Batches & Recipes
-- Idempotent baseline reference data for HSWRMS environments.
-- Synchronized with V1_7 seed and clean UTF-8 Unicode.
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- 0. Schema Reconciliation: Ensure required columns exist for M4 F&B entities
IF OBJECT_ID(N'dbo.MenuItem', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.MenuItem', 'meal_type') IS NULL
        ALTER TABLE dbo.MenuItem ADD meal_type NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.MenuItem', 'allergen_information') IS NULL
        ALTER TABLE dbo.MenuItem ADD allergen_information NVARCHAR(MAX) NULL;

    IF COL_LENGTH('dbo.MenuItem', 'availability_status') IS NULL
        ALTER TABLE dbo.MenuItem ADD availability_status VARCHAR(20) NOT NULL CONSTRAINT DF_MenuItem_AvailabilityStatus_V007 DEFAULT ('AVAILABLE') WITH VALUES;

    IF COL_LENGTH('dbo.MenuItem', 'is_available') IS NULL
        ALTER TABLE dbo.MenuItem ADD is_available BIT NOT NULL CONSTRAINT DF_MenuItem_IsAvailable_V007 DEFAULT (1) WITH VALUES;
END;
GO

IF OBJECT_ID(N'dbo.MenuItemIngredient', N'U') IS NOT NULL AND COL_LENGTH('dbo.MenuItemIngredient', 'required_quantity') IS NULL
BEGIN
    IF COL_LENGTH('dbo.MenuItemIngredient', 'quantity_required') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.MenuItemIngredient ADD required_quantity DECIMAL(18,4) NULL;
        EXEC('UPDATE dbo.MenuItemIngredient SET required_quantity = quantity_required WHERE required_quantity IS NULL;');
    END
    ELSE
        ALTER TABLE dbo.MenuItemIngredient ADD required_quantity DECIMAL(18,4) NULL;
END;
GO

IF OBJECT_ID(N'dbo.IngredientBatch', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.IngredientBatch', 'stock_condition') IS NULL
        ALTER TABLE dbo.IngredientBatch ADD stock_condition VARCHAR(50) NOT NULL CONSTRAINT DF_IngredientBatch_StockCondition_V007 DEFAULT ('FRESH') WITH VALUES;

    IF COL_LENGTH('dbo.IngredientBatch', 'expiration_date') IS NULL
    BEGIN
        IF COL_LENGTH('dbo.IngredientBatch', 'expiry_date') IS NOT NULL
        BEGIN
            ALTER TABLE dbo.IngredientBatch ADD expiration_date DATE NULL;
            EXEC('UPDATE dbo.IngredientBatch SET expiration_date = expiry_date WHERE expiration_date IS NULL;');
        END
        ELSE
            ALTER TABLE dbo.IngredientBatch ADD expiration_date DATE NULL;
    END

    IF COL_LENGTH('dbo.IngredientBatch', 'remaining_quantity') IS NULL
    BEGIN
        IF COL_LENGTH('dbo.IngredientBatch', 'quantity_remaining') IS NOT NULL
        BEGIN
            ALTER TABLE dbo.IngredientBatch ADD remaining_quantity DECIMAL(18,3) NULL;
            EXEC('UPDATE dbo.IngredientBatch SET remaining_quantity = quantity_remaining WHERE remaining_quantity IS NULL;');
        END
        ELSE
            ALTER TABLE dbo.IngredientBatch ADD remaining_quantity DECIMAL(18,3) NULL;
    END
END;
GO

BEGIN TRANSACTION;

-- 1. Nạp và chuẩn hóa toàn bộ 12 món ăn thực dưỡng (dbo.MenuItem)
SET IDENTITY_INSERT dbo.MenuItem ON;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 1)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (1, N'Súp Bào Ngư & Nấm Đông Cô Dưỡng Nhan', 'STARTER', 'DINNER', 180000.00, 'pescatarian,gluten_free,dairy_free', 'molluscs', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Súp Bào Ngư & Nấm Đông Cô Dưỡng Nhan', category = 'STARTER', meal_type = 'DINNER', price = 180000.00, dietary_tags = 'pescatarian,gluten_free,dairy_free', allergen_information = 'molluscs', availability_status = 'AVAILABLE' WHERE menu_item_id = 1;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 2)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (2, N'Cá Chẽm Vịnh Vĩnh Hy Hấp Trà Xanh & Gừng Non', 'MAIN', 'LUNCH', 220000.00, 'pescatarian,gluten_free,dairy_free', 'fish', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Cá Chẽm Vịnh Vĩnh Hy Hấp Trà Xanh & Gừng Non', category = 'MAIN', meal_type = 'LUNCH', price = 220000.00, dietary_tags = 'pescatarian,gluten_free,dairy_free', allergen_information = 'fish', availability_status = 'AVAILABLE' WHERE menu_item_id = 2;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 3)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (3, N'Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê Dưỡng Sinh', 'MAIN', 'LUNCH', 95000.00, 'vegan,gluten_free,dairy_free', '', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê Dưỡng Sinh', category = 'MAIN', meal_type = 'LUNCH', price = 95000.00, dietary_tags = 'vegan,gluten_free,dairy_free', allergen_information = '', availability_status = 'AVAILABLE' WHERE menu_item_id = 3;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 4)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (4, N'Salad Rau Rừng Núi Chúa & Sốt Mè Rang Hữu Cơ', 'STARTER', 'LUNCH', 85000.00, 'vegetarian,dairy_free', 'sesame', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Salad Rau Rừng Núi Chúa & Sốt Mè Rang Hữu Cơ', category = 'STARTER', meal_type = 'LUNCH', price = 85000.00, dietary_tags = 'vegetarian,dairy_free', allergen_information = 'sesame', availability_status = 'AVAILABLE' WHERE menu_item_id = 4;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 5)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (5, N'Chè Yến Ngũ Vị & Hạt Sen Long Nhãn', 'DESSERT', 'DINNER', 150000.00, 'pescatarian,gluten_free,dairy_free', '', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Chè Yến Ngũ Vị & Hạt Sen Long Nhãn', category = 'DESSERT', meal_type = 'DINNER', price = 150000.00, dietary_tags = 'pescatarian,gluten_free,dairy_free', allergen_information = '', availability_status = 'AVAILABLE' WHERE menu_item_id = 5;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 6)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (6, N'Trà Thảo Mộc Thược Dược & Táo Đỏ Núi Chúa', 'BEVERAGE', 'ALL_DAY', 45000.00, 'vegan,gluten_free,dairy_free', '', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Trà Thảo Mộc Thược Dược & Táo Đỏ Núi Chúa', category = 'BEVERAGE', meal_type = 'ALL_DAY', price = 45000.00, dietary_tags = 'vegan,gluten_free,dairy_free', allergen_information = '', availability_status = 'AVAILABLE' WHERE menu_item_id = 6;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 7)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (7, N'Gỏi Ngó Sen & Đậu Hũ Thảo Mộc', 'STARTER', 'LUNCH', 90000.00, 'vegetarian,vegan,dairy_free,gluten_free', 'soy', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Gỏi Ngó Sen & Đậu Hũ Thảo Mộc', category = 'STARTER', meal_type = 'LUNCH', price = 90000.00, dietary_tags = 'vegetarian,vegan,dairy_free,gluten_free', allergen_information = 'soy', availability_status = 'AVAILABLE' WHERE menu_item_id = 7;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 8)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (8, N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu', 'DESSERT', 'BREAKFAST', 65000.00, 'vegan,gluten_free,dairy_free', '', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu', category = 'DESSERT', meal_type = 'BREAKFAST', price = 65000.00, dietary_tags = 'vegan,gluten_free,dairy_free', allergen_information = '', availability_status = 'AVAILABLE' WHERE menu_item_id = 8;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 9)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (9, N'Cháo Yến Mạch Quả Mọng Hữu Cơ', 'MAIN', 'BREAKFAST', 85000.00, 'vegetarian,dairy_free', '', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Cháo Yến Mạch Quả Mọng Hữu Cơ', category = 'MAIN', meal_type = 'BREAKFAST', price = 85000.00, dietary_tags = 'vegetarian,dairy_free', allergen_information = '', availability_status = 'AVAILABLE' WHERE menu_item_id = 9;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 10)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (10, N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ', 'MAIN', 'BREAKFAST', 110000.00, 'lacto_ovo_vegetarian', 'eggs', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ', category = 'MAIN', meal_type = 'BREAKFAST', price = 110000.00, dietary_tags = 'lacto_ovo_vegetarian', allergen_information = 'eggs', availability_status = 'AVAILABLE' WHERE menu_item_id = 10;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 11)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (11, N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng', 'MAIN', 'LUNCH', 120000.00, 'vegan,dairy_free,gluten_free', 'nuts', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng', category = 'MAIN', meal_type = 'LUNCH', price = 120000.00, dietary_tags = 'vegan,dairy_free,gluten_free', allergen_information = 'nuts', availability_status = 'AVAILABLE' WHERE menu_item_id = 11;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 12)
    INSERT INTO dbo.MenuItem (menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status)
    VALUES (12, N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây', 'MAIN', 'DINNER', 260000.00, 'pescatarian,gluten_free,dairy_free,keto', 'fish', 'AVAILABLE')
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây', category = 'MAIN', meal_type = 'DINNER', price = 260000.00, dietary_tags = 'pescatarian,gluten_free,dairy_free,keto', allergen_information = 'fish', availability_status = 'AVAILABLE' WHERE menu_item_id = 12;

SET IDENTITY_INSERT dbo.MenuItem OFF;

IF COL_LENGTH('dbo.MenuItem', 'is_available') IS NOT NULL
BEGIN
    EXEC('UPDATE dbo.MenuItem SET is_available = 1 WHERE availability_status = ''AVAILABLE'';');
END;

-- 2. Nạp nguyên liệu sạch (dbo.Ingredient)
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Yến mạch nguyên cám') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Yến mạch nguyên cám');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Sữa hạnh nhân hữu cơ') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Sữa hạnh nhân hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Quả mọng rừng tươi') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Quả mọng rừng tươi');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Mật ong hoa bạc hà') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Mật ong hoa bạc hà');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Trứng gà hữu cơ') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Trứng gà hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Bánh mì bột chua thủ công') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Bánh mì bột chua thủ công');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Quả bơ Hass nghiền') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Quả bơ Hass nghiền');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Xà lách mầm & muối biển hồng') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Xà lách mầm & muối biển hồng');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Bào ngư sống Vịnh Vĩnh Hy');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Nấm đông cô hữu cơ') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Nấm đông cô hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Cá chẽm tươi phi lê') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Cá chẽm tươi phi lê');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Gạo lứt đỏ Điện Biên') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Gạo lứt đỏ Điện Biên');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Hạt sen Huế tươi');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt kê vàng dưỡng sinh') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Hạt kê vàng dưỡng sinh');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Rau rừng Núi Chúa bản địa') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Rau rừng Núi Chúa bản địa');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Sốt mè rang Nhật Bản');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Yến sào đảo Khánh Hòa') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Yến sào đảo Khánh Hòa');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Trà hoa thược dược sấy lạnh') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Trà hoa thược dược sấy lạnh');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Táo đỏ hữu cơ Tân Cương') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Táo đỏ hữu cơ Tân Cương');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt chia organic') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Hạt chia organic');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Cá hồi Nauy tươi phi lê') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Cá hồi Nauy tươi phi lê');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Quinoa trắng hữu cơ') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Quinoa trắng hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Nước cốt dừa Bến Tre') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Nước cốt dừa Bến Tre');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Xoài Cát Chu chín cây') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Xoài Cát Chu chín cây');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Gừng non & trà xanh hữu cơ') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Gừng non & trà xanh hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Ngó sen hồ giòn') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Ngó sen hồ giòn');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Đậu hũ non áp chảo') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Đậu hũ non áp chảo');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Rau răm & mè rang') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Rau răm & mè rang');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Giấm dừa lên men tự nhiên') INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Giấm dừa lên men tự nhiên');

-- 3. Nạp lô nguyên liệu FEFO khả dụng hạn đến 2027 (dbo.IngredientBatch)
DECLARE @defaultExpiry DATE = '2027-12-31';

INSERT INTO dbo.IngredientBatch (ingredient_id, received_date, expiration_date, remaining_quantity, stock_condition)
SELECT 
    i.ingredient_id, 
    '2026-09-01', 
    @defaultExpiry, 
    CASE 
        WHEN i.ingredient_name LIKE N'%Trứng%' THEN 300.000
        WHEN i.ingredient_name LIKE N'%Bánh mì%' THEN 240.000
        WHEN i.ingredient_name LIKE N'%Sữa%' THEN 35000.000
        WHEN i.ingredient_name LIKE N'%cốt dừa%' THEN 25000.000
        WHEN i.ingredient_name LIKE N'%Mật ong%' THEN 8000.000
        WHEN i.ingredient_name LIKE N'%Sốt%' THEN 5000.000
        ELSE 15000.000
    END, 
    'FRESH'
FROM dbo.Ingredient i
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.IngredientBatch b 
    WHERE b.ingredient_id = i.ingredient_id 
      AND b.remaining_quantity > 0
);

IF COL_LENGTH('dbo.IngredientBatch', 'quantity_remaining') IS NOT NULL
BEGIN
    EXEC('UPDATE dbo.IngredientBatch SET quantity_remaining = remaining_quantity WHERE quantity_remaining IS NULL OR quantity_remaining = 0;');
END;

IF COL_LENGTH('dbo.IngredientBatch', 'expiry_date') IS NOT NULL
BEGIN
    EXEC('UPDATE dbo.IngredientBatch SET expiry_date = expiration_date WHERE expiry_date IS NULL;');
END;

-- 4. Nạp công thức định lượng (dbo.MenuItemIngredient)
-- Menu 1
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 1 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 1, ingredient_id, 120.000 FROM dbo.Ingredient WHERE ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 1 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Nấm đông cô hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 1, ingredient_id, 50.000 FROM dbo.Ingredient WHERE ingredient_name = N'Nấm đông cô hữu cơ';

-- Menu 2
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 2 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Cá chẽm tươi phi lê'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 2, ingredient_id, 200.000 FROM dbo.Ingredient WHERE ingredient_name = N'Cá chẽm tươi phi lê';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 2 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%gừng%'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 2, ingredient_id, 20.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%gừng%';

-- Menu 3
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 3 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Gạo lứt đỏ Điện Biên'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 3, ingredient_id, 100.000 FROM dbo.Ingredient WHERE ingredient_name = N'Gạo lứt đỏ Điện Biên';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 3 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 3, ingredient_id, 40.000 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 3 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Hạt kê vàng dưỡng sinh'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 3, ingredient_id, 30.000 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt kê vàng dưỡng sinh';

-- Menu 4
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 4 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Rau rừng Núi Chúa bản địa'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 4, ingredient_id, 150.000 FROM dbo.Ingredient WHERE ingredient_name = N'Rau rừng Núi Chúa bản địa';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 4 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 4, ingredient_id, 40.000 FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản';

-- Menu 5
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 5 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Yến sào đảo Khánh Hòa'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 5, ingredient_id, 25.000 FROM dbo.Ingredient WHERE ingredient_name = N'Yến sào đảo Khánh Hòa';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 5 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 5, ingredient_id, 40.000 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi';

-- Menu 6
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 6 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Trà hoa thược dược sấy lạnh'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 6, ingredient_id, 15.000 FROM dbo.Ingredient WHERE ingredient_name = N'Trà hoa thược dược sấy lạnh';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 6 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Táo đỏ hữu cơ Tân Cương'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 6, ingredient_id, 20.000 FROM dbo.Ingredient WHERE ingredient_name = N'Táo đỏ hữu cơ Tân Cương';

-- Menu 7
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 7 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Ngó sen hồ giòn'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 7, ingredient_id, 80.000 FROM dbo.Ingredient WHERE ingredient_name = N'Ngó sen hồ giòn';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 7 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Đậu hũ non áp chảo'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 7, ingredient_id, 60.000 FROM dbo.Ingredient WHERE ingredient_name = N'Đậu hũ non áp chảo';

-- Menu 8
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 8 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%chia%'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 8, ingredient_id, 30.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%chia%';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 8 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%cốt dừa%'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 8, ingredient_id, 120.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%cốt dừa%';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 8 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%xoài%'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 8, ingredient_id, 70.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%xoài%';

-- Menu 9
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 9 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Yến mạch nguyên cám'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 9, ingredient_id, 60.000 FROM dbo.Ingredient WHERE ingredient_name = N'Yến mạch nguyên cám';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 9 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Sữa hạnh nhân hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 9, ingredient_id, 180.000 FROM dbo.Ingredient WHERE ingredient_name = N'Sữa hạnh nhân hữu cơ';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 9 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Quả mọng rừng tươi'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 9, ingredient_id, 40.000 FROM dbo.Ingredient WHERE ingredient_name = N'Quả mọng rừng tươi';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 9 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Mật ong hoa bạc hà'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 9, ingredient_id, 15.000 FROM dbo.Ingredient WHERE ingredient_name = N'Mật ong hoa bạc hà';

-- Menu 10
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 10 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Trứng gà hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 10, ingredient_id, 2.000 FROM dbo.Ingredient WHERE ingredient_name = N'Trứng gà hữu cơ';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 10 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Bánh mì bột chua thủ công'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 10, ingredient_id, 2.000 FROM dbo.Ingredient WHERE ingredient_name = N'Bánh mì bột chua thủ công';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 10 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Quả bơ Hass nghiền'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 10, ingredient_id, 80.000 FROM dbo.Ingredient WHERE ingredient_name = N'Quả bơ Hass nghiền';

-- Menu 11
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 11 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Quinoa trắng hữu cơ'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 11, ingredient_id, 70.000 FROM dbo.Ingredient WHERE ingredient_name = N'Quinoa trắng hữu cơ';

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 11 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 11, ingredient_id, 30.000 FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản';

-- Menu 12
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 12 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Cá hồi Nauy tươi phi lê'))
    INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
    SELECT 12, ingredient_id, 160.000 FROM dbo.Ingredient WHERE ingredient_name = N'Cá hồi Nauy tươi phi lê';

IF COL_LENGTH('dbo.MenuItemIngredient', 'quantity_required') IS NOT NULL
BEGIN
    EXEC('UPDATE dbo.MenuItemIngredient SET quantity_required = required_quantity WHERE quantity_required IS NULL;');
END;

COMMIT TRANSACTION;
PRINT 'V007: M4 F&B ingredients, usable batches, and recipes configured successfully.';
GO
