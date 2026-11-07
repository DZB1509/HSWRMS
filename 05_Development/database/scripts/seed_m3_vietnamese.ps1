<#
.SYNOPSIS
    HSWRMS Module 3 (Spa & Wellness) Vietnamese Therapist and Treatment Room Seed Script.

.DESCRIPTION
    Idempotent seed script to provision development data for M3 Spa:
      - 9 Active Vietnamese Therapists with qualifications across 18 treatments
      - 4 Treatment Rooms (Suite VIP Sen Vàng, Phòng Trúc Xanh, Phòng Facial Mộc Lan, Phòng Thiền & Yoga An Nhiên)
      - Associated room compatibilities and therapist user accounts with BCrypt-hashed passwords
    Preserves all existing baseline records (Therapists #1-#3, Sessions #20-#21, Customer Booking #3).

.PARAMETER ServerInstance
    The SQL Server instance to connect to (default: 'localhost').

.PARAMETER DatabaseName
    Target database name (default: 'HSWRMS').

.PARAMETER Username
    SQL Server authentication username (optional; if omitted, checks env/file or uses Integrated Security).

.PARAMETER Password
    SQL Server authentication password (optional).

.PARAMETER CredentialsEnvFile
    Path to an external .env file defining HSWRMS_DB_USERNAME and HSWRMS_DB_PASSWORD.
#>

[CmdletBinding()]
param(
    [string]$ServerInstance = "localhost",
    [string]$DatabaseName = "HSWRMS",
    [string]$Username = $env:HSWRMS_DB_USERNAME,
    [string]$Password = $env:HSWRMS_DB_PASSWORD,
    [string]$CredentialsEnvFile = $env:HSWRMS_CREDENTIALS_FILE
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Attempt to load credentials from file if username/password not provided
if (-not $Username -or -not $Password) {
    $searchPaths = @(
        $CredentialsEnvFile,
        (Join-Path $PSScriptRoot "..\..\..\..\HSWRMS_DB_BACKUPS\hswrms_local_credentials.env"),
        (Join-Path $PSScriptRoot "..\..\..\HSWRMS_DB_BACKUPS\hswrms_local_credentials.env"),
        (Join-Path (Get-Location) "hswrms_local_credentials.env")
    )
    foreach ($sp in $searchPaths) {
        if ($sp -and (Test-Path $sp)) {
            Get-Content $sp | ForEach-Object {
                $line = $_.Trim()
                if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
                    $idx = $line.IndexOf('=')
                    $k = $line.Substring(0, $idx).Trim()
                    $v = $line.Substring($idx + 1).Trim()
                    if ($k -eq 'HSWRMS_DB_USERNAME' -and -not $Username) { $Username = $v }
                    if ($k -eq 'HSWRMS_DB_PASSWORD' -and -not $Password) { $Password = $v }
                }
            }
            if ($Username -and $Password) { break }
        }
    }
}

# Construct ADO.NET Connection String securely
if ($Username -and $Password) {
    $connStr = "Server=$ServerInstance;Database=$DatabaseName;User Id=$Username;Password=$Password;TrustServerCertificate=True;"
} else {
    $connStr = "Server=$ServerInstance;Database=$DatabaseName;Integrated Security=True;TrustServerCertificate=True;"
}

$sql = @"
SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Standard BCrypt development password hash
    DECLARE @devPasswordHash NVARCHAR(500) = N'$2a$10$u8y7KsM0EjyumIcWnmj5v.ssi7jOAuHb5l4.An9zpCY7K0bM84mWC';

    -- 2. New Vietnamese Therapists Table Variable
    DECLARE @NewTherapists TABLE (
        full_name NVARCHAR(150),
        email NVARCHAR(255),
        phone_number NVARCHAR(30),
        treatment_ids VARCHAR(200)
    );

    INSERT INTO @NewTherapists (full_name, email, phone_number, treatment_ids) VALUES
    (N'Nguyễn Minh Anh', N'minhanh.nguyen@heavenstay.com', N'+84981110001', '1,2,3,4,5,6,13,14'),
    (N'Trần Thu Hà', N'thuha.tran@heavenstay.com', N'+84981110002', '10,11,12,13,14'),
    (N'Lê Hoàng Nam', N'hoangnam.le@heavenstay.com', N'+84981110003', '1,2,4,5,9,17'),
    (N'Phạm Ngọc Lan', N'ngoclan.pham@heavenstay.com', N'+84981110004', '7,8,9,17,18'),
    (N'Đỗ Quang Huy', N'quanghuy.do@heavenstay.com', N'+84981110005', '13,14,15,16'),
    (N'Vũ Thị Mai', N'thimai.vu@heavenstay.com', N'+84981110006', '1,3,5,6,11,14'),
    (N'Bùi Đức Thành', N'ducthanh.bui@heavenstay.com', N'+84981110007', '4,7,9,17,18'),
    (N'Hoàng Khánh Linh', N'khanhlinh.hoang@heavenstay.com', N'+84981110008', '1,7,8,10,11'),
    (N'Đặng Quốc Bảo', N'quocbao.dang@heavenstay.com', N'+84981110009', '1,2,3,4,5,7,8,10,12,15,16,17,18');

    DECLARE @name NVARCHAR(150), @email NVARCHAR(255), @phone NVARCHAR(30), @tids VARCHAR(200);
    DECLARE @userId INT, @therapistId INT;

    DECLARE therapist_cursor CURSOR LOCAL FAST_FORWARD FOR 
    SELECT full_name, email, phone_number, treatment_ids FROM @NewTherapists;

    OPEN therapist_cursor;
    FETCH NEXT FROM therapist_cursor INTO @name, @email, @phone, @tids;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Idempotent User Insert
        IF NOT EXISTS (SELECT 1 FROM dbo.[User] WHERE email = @email)
        BEGIN
            INSERT INTO dbo.[User] (full_name, email, phone_number, password_hash, account_status, email_verified, created_at, updated_at)
            VALUES (@name, @email, @phone, @devPasswordHash, 'ACTIVE', 1, SYSUTCDATETIME(), SYSUTCDATETIME());
            SET @userId = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            SELECT @userId = user_id FROM dbo.[User] WHERE email = @email;
        END

        -- Idempotent UserRole (Role 3 = Therapist)
        IF NOT EXISTS (SELECT 1 FROM dbo.UserRole WHERE user_id = @userId AND role_id = 3)
        BEGIN
            INSERT INTO dbo.UserRole (user_id, role_id, assigned_at)
            VALUES (@userId, 3, SYSUTCDATETIME());
        END

        -- Idempotent Therapist Profile
        IF NOT EXISTS (SELECT 1 FROM dbo.Therapist WHERE user_id = @userId)
        BEGIN
            INSERT INTO dbo.Therapist (user_id, therapist_status)
            VALUES (@userId, 'ACTIVE');
            SET @therapistId = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            SELECT @therapistId = therapist_id FROM dbo.Therapist WHERE user_id = @userId;
        END

        -- Idempotent Qualifications
        DECLARE @pos INT = 1, @nextPos INT, @val VARCHAR(10), @tid INT;
        WHILE @pos <= LEN(@tids)
        BEGIN
            SET @nextPos = CHARINDEX(',', @tids, @pos);
            IF @nextPos = 0 SET @nextPos = LEN(@tids) + 1;
            SET @val = SUBSTRING(@tids, @pos, @nextPos - @pos);
            SET @tid = CAST(LTRIM(RTRIM(@val)) AS INT);

            IF NOT EXISTS (SELECT 1 FROM dbo.TherapistTreatmentQualification WHERE therapist_id = @therapistId AND treatment_id = @tid)
            BEGIN
                INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id)
                VALUES (@therapistId, @tid);
            END

            SET @pos = @nextPos + 1;
        END

        FETCH NEXT FROM therapist_cursor INTO @name, @email, @phone, @tids;
    END

    CLOSE therapist_cursor;
    DEALLOCATE therapist_cursor;

    -- 3. New Treatment Rooms
    DECLARE @NewRooms TABLE (
        room_name NVARCHAR(100),
        room_type NVARCHAR(100),
        treatment_ids VARCHAR(200)
    );

    INSERT INTO @NewRooms (room_name, room_type, treatment_ids) VALUES
    (N'Suite VIP Sen Vàng', N'MASSAGE_VIP', '1,2,3,4,5,6,7,8,9,10,11,12,13,14'),
    (N'Phòng Trúc Xanh', N'MASSAGE_STANDARD', '1,2,3,4,5,6,9,13,14'),
    (N'Phòng Facial Mộc Lan', N'FACIAL_SPECIALIZED', '10,11,12,13,14'),
    (N'Phòng Thiền & Yoga An Nhiên', N'MEDITATION_ROOM', '7,8,9,17,18');

    DECLARE @rname NVARCHAR(100), @rtype NVARCHAR(100), @rtids VARCHAR(200), @roomId INT;
    DECLARE room_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT room_name, room_type, treatment_ids FROM @NewRooms;

    OPEN room_cursor;
    FETCH NEXT FROM room_cursor INTO @rname, @rtype, @rtids;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoom WHERE room_name = @rname)
        BEGIN
            INSERT INTO dbo.TreatmentRoom (room_name, room_status, room_type)
            VALUES (@rname, 'AVAILABLE', @rtype);
            SET @roomId = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            SELECT @roomId = room_id FROM dbo.TreatmentRoom WHERE room_name = @rname;
        END

        -- Idempotent Room Compatibilities
        SET @pos = 1;
        WHILE @pos <= LEN(@rtids)
        BEGIN
            SET @nextPos = CHARINDEX(',', @rtids, @pos);
            IF @nextPos = 0 SET @nextPos = LEN(@rtids) + 1;
            SET @val = SUBSTRING(@rtids, @pos, @nextPos - @pos);
            SET @tid = CAST(LTRIM(RTRIM(@val)) AS INT);

            IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoomCompatibility WHERE room_id = @roomId AND treatment_id = @tid)
            BEGIN
                INSERT INTO dbo.TreatmentRoomCompatibility (room_id, treatment_id)
                VALUES (@roomId, @tid);
            END

            SET @pos = @nextPos + 1;
        END

        FETCH NEXT FROM room_cursor INTO @rname, @rtype, @rtids;
    END

    CLOSE room_cursor;
    DEALLOCATE room_cursor;

    COMMIT TRANSACTION;
    PRINT 'VIETNAMESE SPA SEEDING COMPLETED SUCCESSFULLY';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @errMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@errMsg, 16, 1);
END CATCH;
"@

$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sql
    $cmd.CommandTimeout = 60
    $cmd.ExecuteNonQuery() | Out-Null
    Write-Host "Vietnamese M3 Spa Seed Data verified/applied successfully."
} finally {
    if ($conn.State -eq 'Open') {
        $conn.Close()
    }
}
