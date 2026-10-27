-- ============================================================================
-- HSWRMS Migration V007: M4 Dietary F&B Ingredients, Usable Batches & Recipes
-- Idempotent baseline reference data for HSWRMS environments.
-- Synchronized with baseline format (V001 - V005) for seamless cross-module integration.
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- 0. Precondition Check: Required F&B tables must exist
IF OBJECT_ID(N'dbo.Ingredient', N'U') IS NULL
   OR OBJECT_ID(N'dbo.IngredientBatch', N'U') IS NULL
   OR OBJECT_ID(N'dbo.MenuItemIngredient', N'U') IS NULL
   OR OBJECT_ID(N'dbo.MenuItem', N'U') IS NULL
BEGIN
    RAISERROR(N'HSWRMS Migration V007 Precondition Failed: Prerequisite F&B tables (dbo.Ingredient, dbo.IngredientBatch, dbo.MenuItemIngredient, dbo.MenuItem) do not exist. Please initialize database with schema.sql first.', 16, 1);
    RETURN;
END;
GO

BEGIN TRANSACTION;

-- 1. Reconcile clean Vietnamese UTF-8 Unicode names in dbo.MenuItem (fixing any Mojibake encoding)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 1)
    UPDATE dbo.MenuItem SET item_name = N'Súp Bào Ngư & Nấm Đông Cô Dưỡng Nhan', availability_status = 'AVAILABLE' WHERE menu_item_id = 1;
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 2)
    UPDATE dbo.MenuItem SET item_name = N'Cá Chẽm Vịnh Vĩnh Hy Hấp Trà Xanh & Gừng Non', availability_status = 'AVAILABLE' WHERE menu_item_id = 2;
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 3)
    UPDATE dbo.MenuItem SET item_name = N'Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê Dưỡng Sinh', availability_status = 'AVAILABLE' WHERE menu_item_id = 3;
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 4)
    UPDATE dbo.MenuItem SET item_name = N'Salad Rau Rừng Núi Chúa & Sốt Mè Rang Hữu Cơ', availability_status = 'AVAILABLE' WHERE menu_item_id = 4;
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 5)
    UPDATE dbo.MenuItem SET item_name = N'Chè Yến Ngũ Vị & Hạt Sen Long Nhãn', availability_status = 'AVAILABLE' WHERE menu_item_id = 5;
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 6)
    UPDATE dbo.MenuItem SET item_name = N'Trà Thảo Mộc Thược Dược & Táo Đỏ Núi Chúa', availability_status = 'AVAILABLE' WHERE menu_item_id = 6;
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 8)
BEGIN
    SET IDENTITY_INSERT dbo.MenuItem ON;
    INSERT INTO dbo.MenuItem (
        menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status
    ) VALUES (
        8, N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu', 'DESSERT', 'BREAKFAST', 65000.00, 'vegan,gluten_free,dairy_free', '', 'AVAILABLE'
    );
    SET IDENTITY_INSERT dbo.MenuItem OFF;
END
ELSE
    UPDATE dbo.MenuItem SET item_name = N'Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu', availability_status = 'AVAILABLE' WHERE menu_item_id = 8;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 9)
BEGIN
    SET IDENTITY_INSERT dbo.MenuItem ON;
    INSERT INTO dbo.MenuItem (
        menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status
    ) VALUES (
        9, N'Cháo Yến Mạch Quả Mọng Hữu Cơ', 'MAIN', 'BREAKFAST', 85000.00, 'vegetarian,dairy_free', '', 'AVAILABLE'
    );
    SET IDENTITY_INSERT dbo.MenuItem OFF;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 10)
BEGIN
    SET IDENTITY_INSERT dbo.MenuItem ON;
    INSERT INTO dbo.MenuItem (
        menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status
    ) VALUES (
        10, N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ', 'MAIN', 'BREAKFAST', 110000.00, 'lacto_ovo_vegetarian', 'eggs', 'AVAILABLE'
    );
    SET IDENTITY_INSERT dbo.MenuItem OFF;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 11)
BEGIN
    SET IDENTITY_INSERT dbo.MenuItem ON;
    INSERT INTO dbo.MenuItem (
        menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status
    ) VALUES (
        11, N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng', 'MAIN', 'LUNCH', 120000.00, 'vegan,dairy_free,gluten_free', 'nuts', 'AVAILABLE'
    );
    SET IDENTITY_INSERT dbo.MenuItem OFF;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 12)
BEGIN
    SET IDENTITY_INSERT dbo.MenuItem ON;
    INSERT INTO dbo.MenuItem (
        menu_item_id, item_name, category, meal_type, price, dietary_tags, allergen_information, availability_status
    ) VALUES (
        12, N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây', 'MAIN', 'DINNER', 260000.00, 'pescatarian,gluten_free,dairy_free,keto', 'fish', 'AVAILABLE'
    );
    SET IDENTITY_INSERT dbo.MenuItem OFF;
END;

-- 2. Idempotent Insertion of Canonical F&B Ingredients (dbo.Ingredient)
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Yến mạch nguyên cám')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Yến mạch nguyên cám');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Sữa hạnh nhân hữu cơ')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Sữa hạnh nhân hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Quả mọng rừng tươi')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Quả mọng rừng tươi');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Mật ong hoa bạc hà')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Mật ong hoa bạc hà');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Trứng gà hữu cơ')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Trứng gà hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Bánh mì bột chua thủ công')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Bánh mì bột chua thủ công');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Quả bơ Hass nghiền')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Quả bơ Hass nghiền');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Xà lách mầm & muối biển hồng')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Xà lách mầm & muối biển hồng');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Bào ngư sống Vịnh Vĩnh Hy');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Nấm đông cô hữu cơ')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Nấm đông cô hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Cá chẽm tươi phi lê')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Cá chẽm tươi phi lê');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Gạo lứt đỏ Điện Biên')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Gạo lứt đỏ Điện Biên');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Hạt sen Huế tươi');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt kê vàng dưỡng sinh')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Hạt kê vàng dưỡng sinh');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Rau rừng Núi Chúa bản địa')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Rau rừng Núi Chúa bản địa');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Sốt mè rang Nhật Bản');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Yến sào đảo Khánh Hòa')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Yến sào đảo Khánh Hòa');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Trà hoa thược dược sấy lạnh')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Trà hoa thược dược sấy lạnh');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Táo đỏ hữu cơ Tân Cương')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Táo đỏ hữu cơ Tân Cương');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt chia organic')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Hạt chia organic');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Cá hồi Nauy tươi phi lê')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Cá hồi Nauy tươi phi lê');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name = N'Quinoa trắng hữu cơ')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Quinoa trắng hữu cơ');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%cốt dừa%')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Nước cốt dừa Bến Tre');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%xoài%')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Xoài Cát Chu chín cây');
IF NOT EXISTS (SELECT 1 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%gừng%')
    INSERT INTO dbo.Ingredient (ingredient_name) VALUES (N'Gừng non & trà xanh hữu cơ');

-- 3. Idempotent Insertion of Usable FEFO Batches (dbo.IngredientBatch)
-- Guarantees active stock valid until 2027 with FRESH condition
DECLARE @defaultExpiry DATE = '2027-06-30';

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
    N'FRESH'
FROM dbo.Ingredient i
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.IngredientBatch b 
    WHERE b.ingredient_id = i.ingredient_id 
      AND b.expiration_date >= '2026-09-24' 
      AND b.remaining_quantity > 0 
      AND b.stock_condition IN ('FRESH', 'GOOD', 'NEAR_EXPIRY')
);

-- 4. Idempotent Recipe Configuration (dbo.MenuItemIngredient)
-- Links menu items 1..6 with ingredients so Menu Capacity computes exact servings

-- Menu 1: Súp Bào Ngư & Nấm Đông Cô (120g Bào ngư, 50g Nấm đông cô)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 1)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 1 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 1, ingredient_id, 120.000 FROM dbo.Ingredient WHERE ingredient_name = N'Bào ngư sống Vịnh Vĩnh Hy';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 1 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Nấm đông cô hữu cơ'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 1, ingredient_id, 50.000 FROM dbo.Ingredient WHERE ingredient_name = N'Nấm đông cô hữu cơ';
END;

-- Menu 2: Cá Chẽm Vịnh Vĩnh Hy Hấp Trà Xanh (200g Cá chẽm)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 2)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 2 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Cá chẽm tươi phi lê'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 2, ingredient_id, 200.000 FROM dbo.Ingredient WHERE ingredient_name = N'Cá chẽm tươi phi lê';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 2 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%gừng%'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 2, ingredient_id, 20.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%gừng%';
END;

-- Menu 3: Cơm Gạo Lứt Đỏ Hạt Sen & Hạt Kê (100g Gạo lứt, 40g Hạt sen, 30g Hạt kê)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 3)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 3 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Gạo lứt đỏ Điện Biên'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 3, ingredient_id, 100.000 FROM dbo.Ingredient WHERE ingredient_name = N'Gạo lứt đỏ Điện Biên';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 3 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 3, ingredient_id, 40.000 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 3 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Hạt kê vàng dưỡng sinh'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 3, ingredient_id, 30.000 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt kê vàng dưỡng sinh';
END;

-- Menu 4: Salad Rau Rừng Núi Chúa (150g Rau rừng, 40ml Sốt mè)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 4)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 4 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Rau rừng Núi Chúa bản địa'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 4, ingredient_id, 150.000 FROM dbo.Ingredient WHERE ingredient_name = N'Rau rừng Núi Chúa bản địa';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 4 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 4, ingredient_id, 40.000 FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản';
END;

-- Menu 5: Chè Yến Ngũ Vị (25g Yến sào, 40g Hạt sen)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 5)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 5 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Yến sào đảo Khánh Hòa'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 5, ingredient_id, 25.000 FROM dbo.Ingredient WHERE ingredient_name = N'Yến sào đảo Khánh Hòa';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 5 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 5, ingredient_id, 40.000 FROM dbo.Ingredient WHERE ingredient_name = N'Hạt sen Huế tươi';
END;

-- Menu 6: Trà Thảo Mộc Thược Dược & Táo Đỏ (15g Trà hoa, 20g Táo đỏ)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 6)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 6 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Trà hoa thược dược sấy lạnh'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 6, ingredient_id, 15.000 FROM dbo.Ingredient WHERE ingredient_name = N'Trà hoa thược dược sấy lạnh';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 6 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Táo đỏ hữu cơ Tân Cương'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 6, ingredient_id, 20.000 FROM dbo.Ingredient WHERE ingredient_name = N'Táo đỏ hữu cơ Tân Cương';
END;

-- Menu 7: Gỏi Ngó Sen & Đậu Hũ Thảo Mộc (80g Ngó sen, 60g Đậu hũ, 15g Rau răm mè rang, 20ml Giấm dừa)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 7)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 7 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Ngó sen hồ giòn'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 7, ingredient_id, 80.000 FROM dbo.Ingredient WHERE ingredient_name = N'Ngó sen hồ giòn';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 7 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Đậu hũ non áp chảo'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 7, ingredient_id, 60.000 FROM dbo.Ingredient WHERE ingredient_name = N'Đậu hũ non áp chảo';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 7 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Rau răm & mè rang'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 7, ingredient_id, 15.000 FROM dbo.Ingredient WHERE ingredient_name = N'Rau răm & mè rang';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 7 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Giấm dừa lên men tự nhiên'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 7, ingredient_id, 20.000 FROM dbo.Ingredient WHERE ingredient_name = N'Giấm dừa lên men tự nhiên';
END;

-- Menu 8: Pudding Hạt Chia Nước Cốt Dừa & Xoài Cát Chu (30g Hạt chia, 120ml Nước cốt dừa, 70g Xoài Cát Chu)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 8)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 8 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%chia%'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 8, ingredient_id, 30.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%chia%';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 8 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%cốt dừa%'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 8, ingredient_id, 120.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%cốt dừa%';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 8 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name LIKE N'%xoài%'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 8, ingredient_id, 70.000 FROM dbo.Ingredient WHERE ingredient_name LIKE N'%xoài%';
END;

-- Menu 9: Cháo Yến Mạch (Yến mạch 60g, Sữa hạnh nhân 180ml, Quả mọng 40g, Mật ong 15ml)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 9)
BEGIN
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
END;

-- Menu 10: Bữa Sáng Trứng Chần (Trứng 2 quả, Bánh mì 2 lát, Quả bơ 80g, Xà lách mầm 20g)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 10)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 10 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Trứng gà hữu cơ'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 10, ingredient_id, 2.000 FROM dbo.Ingredient WHERE ingredient_name = N'Trứng gà hữu cơ';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 10 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Bánh mì bột chua thủ công'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 10, ingredient_id, 2.000 FROM dbo.Ingredient WHERE ingredient_name = N'Bánh mì bột chua thủ công';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 10 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Quả bơ Hass nghiền'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 10, ingredient_id, 80.000 FROM dbo.Ingredient WHERE ingredient_name = N'Quả bơ Hass nghiền';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 10 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Xà lách mầm & muối biển hồng'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 10, ingredient_id, 20.000 FROM dbo.Ingredient WHERE ingredient_name = N'Xà lách mầm & muối biển hồng';
END;

-- Menu 11: Salad Quinoa (Quinoa 70g, Sốt mè 30g)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 11)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 11 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Quinoa trắng hữu cơ'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 11, ingredient_id, 70.000 FROM dbo.Ingredient WHERE ingredient_name = N'Quinoa trắng hữu cơ';

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 11 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 11, ingredient_id, 30.000 FROM dbo.Ingredient WHERE ingredient_name = N'Sốt mè rang Nhật Bản';
END;

-- Menu 12: Cá Hồi Áp Chảo (Cá hồi 160g)
IF EXISTS (SELECT 1 FROM dbo.MenuItem WHERE menu_item_id = 12)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItemIngredient WHERE menu_item_id = 12 AND ingredient_id = (SELECT TOP 1 ingredient_id FROM dbo.Ingredient WHERE ingredient_name = N'Cá hồi Nauy tươi phi lê'))
        INSERT INTO dbo.MenuItemIngredient (menu_item_id, ingredient_id, required_quantity)
        SELECT 12, ingredient_id, 160.000 FROM dbo.Ingredient WHERE ingredient_name = N'Cá hồi Nauy tươi phi lê';
END;

COMMIT TRANSACTION;
PRINT 'V007: M4 F&B ingredients, usable batches, and recipes configured successfully.';
GO
