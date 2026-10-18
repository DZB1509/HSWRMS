USE [HSWRMS];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting Package - VillaCategory Mapping Seeding...';

-- Map all retreat packages (1 to 8) to eligible villa categories (1 to 6)
INSERT INTO dbo.RetreatPackageVillaCategory (retreat_package_id, villa_category_id)
SELECT p.retreat_package_id, c.villa_category_id
FROM dbo.RetreatPackage p
CROSS JOIN dbo.VillaCategory c
WHERE NOT EXISTS (
    SELECT 1 
    FROM dbo.RetreatPackageVillaCategory m
    WHERE m.retreat_package_id = p.retreat_package_id 
      AND m.villa_category_id = c.villa_category_id
);

PRINT 'Package - VillaCategory Mapping completed successfully!';
GO
