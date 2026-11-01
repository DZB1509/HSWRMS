USE [HSWRMS];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting HSWRMS Demo Users Seeding...';

-- 1. Create Default Customer User (Standardized to .dev)
IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE email = 'customer@heavenstay.dev')
BEGIN
    INSERT INTO dbo.[User] (full_name, email, phone_number, password_hash, account_status, email_verified)
    VALUES (N'Demo Customer', 'customer@heavenstay.dev', '+84912345678', '$2a$10$u8y7KsM0EjyumIcWnmj5v.ssi7jOAuHb5l4.An9zpCYEqMUhhxVae', 'ACTIVE', 1);
END
GO

DECLARE @CustomerUserId INT = (SELECT user_id FROM dbo.[User] WHERE email = 'customer@heavenstay.dev');
DECLARE @CustomerRoleId INT = (SELECT role_id FROM dbo.[Role] WHERE role_name = 'CUSTOMER');

IF @CustomerUserId IS NOT NULL AND @CustomerRoleId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.UserRole WHERE user_id = @CustomerUserId AND role_id = @CustomerRoleId)
    BEGIN
        INSERT INTO dbo.UserRole (user_id, role_id) VALUES (@CustomerUserId, @CustomerRoleId);
    END
END
GO

DECLARE @CustomerUserId INT = (SELECT user_id FROM dbo.[User] WHERE email = 'customer@heavenstay.dev');
IF @CustomerUserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.CustomerProfile WHERE user_id = @CustomerUserId)
BEGIN
    INSERT INTO dbo.CustomerProfile (user_id, date_of_birth, residential_address, preferred_language, emergency_contact_name, emergency_contact_phone)
    VALUES (@CustomerUserId, '1990-05-15', N'123 Le Loi, District 1, Ho Chi Minh City', 'en', N'Thomas Vance', '+84909876543');
END
GO

-- 2. Create Default Receptionist User (Standardized to .dev)
IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE email = 'receptionist@heavenstay.dev')
BEGIN
    INSERT INTO dbo.[User] (full_name, email, phone_number, password_hash, account_status, email_verified)
    VALUES (N'Demo Receptionist', 'receptionist@heavenstay.dev', '+84901234567', '$2a$10$u8y7KsM0EjyumIcWnmj5v.ssi7jOAuHb5l4.An9zpCYEqMUhhxVae', 'ACTIVE', 1);
END
GO

DECLARE @RecepUserId INT = (SELECT user_id FROM dbo.[User] WHERE email = 'receptionist@heavenstay.dev');
DECLARE @RecepRoleId INT = (SELECT role_id FROM dbo.[Role] WHERE role_name = 'RECEPTIONIST');

IF @RecepUserId IS NOT NULL AND @RecepRoleId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.UserRole WHERE user_id = @RecepUserId AND role_id = @RecepRoleId)
    BEGIN
        INSERT INTO dbo.UserRole (user_id, role_id) VALUES (@RecepUserId, @RecepRoleId);
    END
END
GO

PRINT 'HSWRMS Demo Users Seeding completed successfully!';
GO
