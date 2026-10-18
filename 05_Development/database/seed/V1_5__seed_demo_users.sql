USE [HSWRMS];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting HSWRMS Demo Users Seeding...';

-- 1. Create Default Customer User
IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE email = 'customer@heavenstay.com')
BEGIN
    INSERT INTO dbo.[User] (full_name, email, phone_number, password_hash, account_status, email_verified)
    VALUES (N'Eleanor Vance', 'customer@heavenstay.com', '+84912345678', '$2a$10$w1qE/9s7E7tQzR.557vYCeZ7aO4J9jY3Xp07wYh11h8Z9vU.4jXyO', 'ACTIVE', 1);
END
GO

DECLARE @CustomerUserId INT = (SELECT user_id FROM dbo.[User] WHERE email = 'customer@heavenstay.com');
DECLARE @CustomerRoleId INT = (SELECT role_id FROM dbo.[Role] WHERE role_name = 'CUSTOMER');

IF @CustomerUserId IS NOT NULL AND @CustomerRoleId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.UserRole WHERE user_id = @CustomerUserId AND role_id = @CustomerRoleId)
    BEGIN
        INSERT INTO dbo.UserRole (user_id, role_id) VALUES (@CustomerUserId, @CustomerRoleId);
    END
END
GO

DECLARE @CustomerUserId INT = (SELECT user_id FROM dbo.[User] WHERE email = 'customer@heavenstay.com');
IF @CustomerUserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.CustomerProfile WHERE user_id = @CustomerUserId)
BEGIN
    INSERT INTO dbo.CustomerProfile (user_id, date_of_birth, residential_address, preferred_language, emergency_contact_name, emergency_contact_phone)
    VALUES (@CustomerUserId, '1990-05-15', N'123 Le Loi, District 1, Ho Chi Minh City', 'en', N'Thomas Vance', '+84909876543');
END
GO

-- 2. Create Default Receptionist User
IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE email = 'receptionist@heavenstay.com')
BEGIN
    INSERT INTO dbo.[User] (full_name, email, phone_number, password_hash, account_status, email_verified)
    VALUES (N'Nguyen Van Reception', 'receptionist@heavenstay.com', '+84901234567', '$2a$10$w1qE/9s7E7tQzR.557vYCeZ7aO4J9jY3Xp07wYh11h8Z9vU.4jXyO', 'ACTIVE', 1);
END
GO

DECLARE @RecepUserId INT = (SELECT user_id FROM dbo.[User] WHERE email = 'receptionist@heavenstay.com');
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
