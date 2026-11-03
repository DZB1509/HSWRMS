-- HSWRMS M2: add nullable villa pricing columns for databases initialized
-- before base_price/nightly_rate were added to schema.sql and the entities.
-- Existing rows remain NULL; no historic pricing is inferred or backfilled.

IF OBJECT_ID(N'dbo.VillaCategory', N'U') IS NULL
   OR OBJECT_ID(N'dbo.PhysicalVilla', N'U') IS NULL
BEGIN
    ;THROW 51018, 'HSWRMS V018 requires dbo.VillaCategory and dbo.PhysicalVilla.', 1;
END;

IF COL_LENGTH(N'dbo.VillaCategory', N'base_price') IS NULL
BEGIN
    ALTER TABLE dbo.VillaCategory ADD base_price DECIMAL(18,2) NULL;
END;

IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.types t ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.VillaCategory')
      AND c.name = N'base_price'
      AND (t.name <> N'decimal' OR c.precision <> 18 OR c.scale <> 2 OR c.is_nullable <> 1)
)
BEGIN
    ;THROW 51019, 'HSWRMS V018 found an incompatible dbo.VillaCategory.base_price definition.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.VillaCategory')
      AND c.name = N'base_price'
      AND (
          TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(dc.definition, N'(', N''), N')', N'')) IS NULL
          OR TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(dc.definition, N'(', N''), N')', N'')) <> 3500000.00
      )
)
BEGIN
    ;THROW 51020, 'HSWRMS V018 found an incompatible dbo.VillaCategory.base_price default.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.VillaCategory')
      AND c.name = N'base_price'
)
BEGIN
    ALTER TABLE dbo.VillaCategory
        ADD CONSTRAINT DF_VillaCategory_BasePrice DEFAULT (3500000) FOR base_price;
END;

IF COL_LENGTH(N'dbo.PhysicalVilla', N'nightly_rate') IS NULL
BEGIN
    ALTER TABLE dbo.PhysicalVilla ADD nightly_rate DECIMAL(18,2) NULL;
END;

IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.types t ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.PhysicalVilla')
      AND c.name = N'nightly_rate'
      AND (t.name <> N'decimal' OR c.precision <> 18 OR c.scale <> 2 OR c.is_nullable <> 1)
)
BEGIN
    ;THROW 51021, 'HSWRMS V018 found an incompatible dbo.PhysicalVilla.nightly_rate definition.', 1;
END;
