-- ============================================================================
-- HSWRMS Migration V006: M4 Meal Order & Order Item Additive Fields
-- Idempotent schema evolution for existing database environments.
-- Synchronized with baseline format (V001 - V005) for seamless cross-module integration.
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- 0. Precondition Check
IF OBJECT_ID(N'dbo.MealOrder', N'U') IS NULL OR OBJECT_ID(N'dbo.MealOrderItem', N'U') IS NULL
BEGIN
    RAISERROR(N'HSWRMS Migration V006 Precondition Failed: Prerequisite tables (dbo.MealOrder, dbo.MealOrderItem) do not exist. Please initialize database with schema.sql first.', 16, 1);
    RETURN;
END;
GO

-- 1. Ensure special_notes on dbo.MealOrder for delivery notes, villa requests, wellness tags
IF COL_LENGTH('dbo.MealOrder', 'special_notes') IS NULL
BEGIN
    ALTER TABLE dbo.MealOrder ADD special_notes NVARCHAR(1000) NULL;
    PRINT 'V006: Added column special_notes to dbo.MealOrder.';
END;
GO

-- 2. Ensure unit_price on dbo.MealOrderItem for A-la-carte pricing & Folio billing
IF COL_LENGTH('dbo.MealOrderItem', 'unit_price') IS NULL
BEGIN
    ALTER TABLE dbo.MealOrderItem ADD unit_price DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_MealOrderItem_UnitPrice DEFAULT (0) WITH VALUES;
    PRINT 'V006: Added column unit_price to dbo.MealOrderItem.';
END;
GO

-- 3. Ensure preparation_status on dbo.MealOrderItem for KDS kitchen line tracking
IF COL_LENGTH('dbo.MealOrderItem', 'preparation_status') IS NULL
BEGIN
    ALTER TABLE dbo.MealOrderItem ADD preparation_status VARCHAR(20) NOT NULL
        CONSTRAINT DF_MealOrderItem_PreparationStatus DEFAULT ('PENDING') WITH VALUES;
    ALTER TABLE dbo.MealOrderItem ADD CONSTRAINT CK_MealOrderItem_PreparationStatus
        CHECK (preparation_status IN ('PENDING', 'PREPARING', 'READY'));
    PRINT 'V006: Added column preparation_status to dbo.MealOrderItem.';
END;
GO
