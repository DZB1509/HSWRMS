/* Additive M4 columns required by the existing meal-order API and fulfillment model. */
IF COL_LENGTH('dbo.MealOrder', 'special_notes') IS NULL
    ALTER TABLE dbo.MealOrder ADD special_notes NVARCHAR(1000) NULL;
GO
IF COL_LENGTH('dbo.MealOrderItem', 'unit_price') IS NULL
BEGIN
    ALTER TABLE dbo.MealOrderItem ADD unit_price DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_MealOrderItem_UnitPrice DEFAULT (0) WITH VALUES;
END;
GO
IF COL_LENGTH('dbo.MealOrderItem', 'preparation_status') IS NULL
BEGIN
    ALTER TABLE dbo.MealOrderItem ADD preparation_status VARCHAR(20) NOT NULL
        CONSTRAINT DF_MealOrderItem_PreparationStatus DEFAULT ('PENDING') WITH VALUES;
    ALTER TABLE dbo.MealOrderItem ADD CONSTRAINT CK_MealOrderItem_PreparationStatus
        CHECK (preparation_status IN ('PENDING', 'PREPARING', 'READY'));
END;
GO
