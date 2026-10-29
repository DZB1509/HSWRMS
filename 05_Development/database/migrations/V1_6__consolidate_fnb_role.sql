/*
================================================================================
HSWRMS Migration V1.6 - Consolidate F&B Staff Role (Remove redundant role 10)
Target Database: SQL Server / Azure SQL
Canonical Role: role_id = 4 ('F&B Staff')
================================================================================
*/

USE [HSWRMS];
GO

IF EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_id = 10 OR (role_name = 'FNB_STAFF' AND role_id <> 4))
BEGIN
    DECLARE @redundantRoleId INT;
    SELECT TOP 1 @redundantRoleId = role_id FROM dbo.[Role] WHERE role_id = 10 OR (role_name = 'FNB_STAFF' AND role_id <> 4);

    -- 1. Migrate UserRole: remove duplicates then update to role 4
    DELETE FROM dbo.UserRole 
    WHERE role_id = @redundantRoleId 
      AND user_id IN (SELECT user_id FROM dbo.UserRole WHERE role_id = 4);

    UPDATE dbo.UserRole 
    SET role_id = 4 
    WHERE role_id = @redundantRoleId;

    -- 2. Migrate RolePermission: remove duplicates then update to role 4
    IF OBJECT_ID(N'dbo.RolePermission', N'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.RolePermission 
        WHERE role_id = @redundantRoleId 
          AND permission_id IN (SELECT permission_id FROM dbo.RolePermission WHERE role_id = 4);

        UPDATE dbo.RolePermission 
        SET role_id = 4 
        WHERE role_id = @redundantRoleId;
    END

    -- 3. Delete redundant role
    DELETE FROM dbo.[Role] WHERE role_id = @redundantRoleId;
END
GO
