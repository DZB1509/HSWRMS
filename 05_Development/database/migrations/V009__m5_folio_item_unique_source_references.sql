-- ============================================================================
-- HSWRMS Migration V009: M5 FolioItem Unique Source References
-- Prevents duplicate folio charge postings for the same MealOrder or SpaSession.
-- Filtered unique indexes allow multiple NULL rows for other charge categories.
-- ============================================================================

-- Defensive Pre-Check 1: Detect existing duplicate source_meal_order_id without modifying or deleting records
IF EXISTS (
    SELECT source_meal_order_id, COUNT(*)
    FROM dbo.FolioItem
    WHERE source_meal_order_id IS NOT NULL
    GROUP BY source_meal_order_id
    HAVING COUNT(*) > 1
)
BEGIN
    RAISERROR('Cannot create UX_FolioItem_SourceMealOrder: Duplicate source_meal_order_id records detected in dbo.FolioItem. Cleanse duplicates manually before applying index.', 16, 1);
    RETURN;
END
GO

-- Defensive Pre-Check 2: Detect existing duplicate source_spa_session_id without modifying or deleting records
IF EXISTS (
    SELECT source_spa_session_id, COUNT(*)
    FROM dbo.FolioItem
    WHERE source_spa_session_id IS NOT NULL
    GROUP BY source_spa_session_id
    HAVING COUNT(*) > 1
)
BEGIN
    RAISERROR('Cannot create UX_FolioItem_SourceSpaSession: Duplicate source_spa_session_id records detected in dbo.FolioItem. Cleanse duplicates manually before applying index.', 16, 1);
    RETURN;
END
GO

-- Create Filtered Unique Index for Meal Orders
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'dbo.FolioItem') AND name = N'UX_FolioItem_SourceMealOrder'
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_FolioItem_SourceMealOrder
        ON dbo.FolioItem(source_meal_order_id)
        WHERE source_meal_order_id IS NOT NULL;
END
GO

-- Create Filtered Unique Index for Spa Sessions
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'dbo.FolioItem') AND name = N'UX_FolioItem_SourceSpaSession'
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_FolioItem_SourceSpaSession
        ON dbo.FolioItem(source_spa_session_id)
        WHERE source_spa_session_id IS NOT NULL;
END
GO
