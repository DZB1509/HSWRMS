/* ============================================================================
   V004 - CustomerReview optional category ratings (Module 5, S45)
   Apply to databases created from an earlier schema.sql. Idempotent.
   ============================================================================ */
IF COL_LENGTH('dbo.CustomerReview', 'room_rating') IS NULL
    ALTER TABLE dbo.CustomerReview ADD room_rating TINYINT NULL;
GO
IF COL_LENGTH('dbo.CustomerReview', 'spa_rating') IS NULL
    ALTER TABLE dbo.CustomerReview ADD spa_rating TINYINT NULL;
GO
IF COL_LENGTH('dbo.CustomerReview', 'dining_rating') IS NULL
    ALTER TABLE dbo.CustomerReview ADD dining_rating TINYINT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_CustomerReview_CategoryRatings')
    ALTER TABLE dbo.CustomerReview ADD CONSTRAINT CK_CustomerReview_CategoryRatings
        CHECK ((room_rating   IS NULL OR room_rating   BETWEEN 1 AND 5)
           AND (spa_rating    IS NULL OR spa_rating    BETWEEN 1 AND 5)
           AND (dining_rating IS NULL OR dining_rating BETWEEN 1 AND 5));
GO
