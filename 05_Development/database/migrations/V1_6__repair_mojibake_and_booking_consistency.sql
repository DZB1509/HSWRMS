/*
================================================================================
HSWRMS Migration V1.6 - Repair Mojibake & Normalize Booking/Villa Consistency
Description:
  1. Fix UTF-8 Mojibake in dbo.RetreatBooking.special_request and dbo.ResidenceRecord.
  2. Enforce M2 Business Rule: CONFIRMED and PENDING bookings must have assigned_villa_id = NULL.
     Only CHECKED_IN or COMPLETED bookings retain assigned_villa_id.
  3. Standardize past September 2026 bookings to COMPLETED status.
  4. Ensure active CHECKED_IN booking has valid ResidenceRecord.
  5. Sync dbo.PhysicalVilla.villa_status so ONLY villas with an active CHECKED_IN booking are OCCUPIED.
  6. Normalize total_estimated_amount and deposit_amount according to Package + VillaCategory formula.
================================================================================
*/

USE [HSWRMS];
GO

SET NOCOUNT ON;
GO

PRINT '>>> Beginning HSWRMS V1.6 Mojibake Repair & Booking Consistency Normalization...';
GO

BEGIN TRANSACTION;

-- ============================================================================
-- 1. REPAIR MOJIBAKE IN dbo.RetreatBooking.special_request
-- ============================================================================
PRINT '--- 1. Repairing Mojibake in dbo.RetreatBooking.special_request...';

UPDATE dbo.RetreatBooking
SET special_request = N'Gần hồ sen tĩnh lặng, chuẩn bị trà thảo mộc chiều.'
WHERE special_request COLLATE Latin1_General_100_BIN2 LIKE N'%há»“ sen%'
   OR special_request COLLATE Latin1_General_100_BIN2 LIKE N'%Gáº§n%'
   OR special_request LIKE N'%h? sen%';

UPDATE dbo.RetreatBooking
SET special_request = N'Liệu trình chuông xoay Tây Tạng buổi sáng.'
WHERE special_request COLLATE Latin1_General_100_BIN2 LIKE N'%chuÃ´ng xoay%'
   OR special_request COLLATE Latin1_General_100_BIN2 LIKE N'%Liá»‡u trÃ¬nh%'
   OR special_request LIKE N'%chu?ng xoay%';

UPDATE dbo.RetreatBooking
SET special_request = N'Thêm gối kiều mạch phục vụ thiền định sâu.'
WHERE special_request COLLATE Latin1_General_100_BIN2 LIKE N'%kiá» u máº¡ch%'
   OR special_request COLLATE Latin1_General_100_BIN2 LIKE N'%ThÃªm gá»‘i%'
   OR special_request LIKE N'%ki?u m?ch%';

UPDATE dbo.RetreatBooking
SET special_request = N'Ưu tiên villa sát biển ngắm hoàng hôn, ăn chay nhẹ.'
WHERE special_request COLLATE Latin1_General_100_BIN2 LIKE N'%sÃ¡t biá»ƒn%'
   OR special_request COLLATE Latin1_General_100_BIN2 LIKE N'%Æ¯u tiÃªn%'
   OR special_request LIKE N'%st bi?n%';

UPDATE dbo.RetreatBooking
SET special_request = N'Tinh dầu hoa oải hương xông phòng lúc 20:00.'
WHERE special_request COLLATE Latin1_General_100_BIN2 LIKE N'%oáº£i hÆ°Æ¡ng%'
   OR special_request COLLATE Latin1_General_100_BIN2 LIKE N'%Tinh dáº§u%'
   OR special_request LIKE N'%o?i h?ng%';

UPDATE dbo.RetreatBooking
SET special_request = N'Chế độ dinh dưỡng hữu cơ không đường (Sugar-free).'
WHERE special_request COLLATE Latin1_General_100_BIN2 LIKE N'%dinh dÆ°á»¡ng%'
   OR special_request COLLATE Latin1_General_100_BIN2 LIKE N'%Cháº¿ Ä‘á»™%'
   OR special_request LIKE N'%dinh d?ng%';

PRINT '--- 1. Finished special_request repair.';

-- ============================================================================
-- 2. REPAIR MOJIBAKE IN dbo.ResidenceRecord
-- ============================================================================
PRINT '--- 2. Repairing Mojibake in dbo.ResidenceRecord...';

UPDATE dbo.ResidenceRecord
SET nationality = N'Việt Nam'
WHERE nationality COLLATE Latin1_General_100_BIN2 LIKE N'%Viá»‡t%'
   OR nationality LIKE N'%Vi?t%';

UPDATE dbo.ResidenceRecord
SET permanent_address = N'55 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
WHERE permanent_address COLLATE Latin1_General_100_BIN2 LIKE N'%Nguyá»…n%'
   OR permanent_address LIKE N'%Nguy?n%';

PRINT '--- 2. Finished ResidenceRecord repair.';

-- ============================================================================
-- 3. NORMALIZE PAST SEPTEMBER 2026 BOOKINGS TO 'COMPLETED'
-- ============================================================================
PRINT '--- 3. Normalizing past September 2026 bookings to COMPLETED...';

UPDATE dbo.RetreatBooking
SET booking_status = 'COMPLETED'
WHERE check_out_date < '2026-10-01'
  AND booking_status IN ('CONFIRMED', 'CHECKED_IN');

PRINT '--- 3. Finished past bookings normalization.';

-- ============================================================================
-- 4. ENFORCE RULE: CONFIRMED / PENDING BOOKINGS MUST HAVE assigned_villa_id = NULL
-- ============================================================================
PRINT '--- 4. Unassigning villas for un-checked-in bookings (CONFIRMED / PENDING)...';

UPDATE dbo.RetreatBooking
SET assigned_villa_id = NULL
WHERE booking_status IN ('CONFIRMED', 'PENDING');

PRINT '--- 4. Finished villa unassignment for un-checked-in bookings.';

-- ============================================================================
-- 5. ENSURE ACTIVE CHECKED_IN BOOKING HAS VALID RESIDENCE RECORD
-- ============================================================================
PRINT '--- 5. Ensuring active CHECKED_IN bookings have ResidenceRecord...';

-- If booking #5 is checked in, ensure it has a residence declaration
IF EXISTS (SELECT 1 FROM dbo.RetreatBooking WHERE retreat_booking_id = 5 AND booking_status = 'CHECKED_IN')
   AND NOT EXISTS (SELECT 1 FROM dbo.ResidenceRecord WHERE retreat_booking_id = 5)
BEGIN
    INSERT INTO dbo.ResidenceRecord (
        retreat_booking_id,
        identification_number,
        identification_type,
        nationality,
        permanent_address,
        collected_at
    )
    VALUES (
        5,
        '079088001234',
        'CCCD',
        N'Việt Nam',
        N'55 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        SYSUTCDATETIME()
    );
END;

PRINT '--- 5. Finished ResidenceRecord verification for active check-in.';

-- ============================================================================
-- 6. SYNC PHYSICAL VILLA STATUS (ONLY ACTIVE CHECKED_IN BOOKINGS OCCUPY VILLAS)
-- ============================================================================
PRINT '--- 6. Synchronizing dbo.PhysicalVilla.villa_status...';

-- First, set all physical villas to AVAILABLE
UPDATE dbo.PhysicalVilla
SET villa_status = 'AVAILABLE';

-- Second, mark ONLY physical villas assigned to active CHECKED_IN bookings as OCCUPIED
UPDATE pv
SET pv.villa_status = 'OCCUPIED'
FROM dbo.PhysicalVilla pv
INNER JOIN dbo.RetreatBooking rb ON pv.villa_id = rb.assigned_villa_id
WHERE rb.booking_status = 'CHECKED_IN';

PRINT '--- 6. Finished PhysicalVilla synchronization.';

-- ============================================================================
-- 7. RECALCULATE ACCURATE AMOUNTS ON dbo.RetreatBooking
-- ============================================================================
PRINT '--- 7. Recalculating standard amounts on dbo.RetreatBooking...';

UPDATE b
SET b.total_estimated_amount = p.base_price + v.price_modifier,
    b.deposit_amount = ROUND((p.base_price + v.price_modifier) * 0.30, 0)
FROM dbo.RetreatBooking b
JOIN dbo.RetreatPackage p ON b.retreat_package_id = p.retreat_package_id
JOIN dbo.VillaCategory v ON b.requested_villa_category_id = v.villa_category_id;

PRINT '--- 7. Finished amounts recalculation.';

COMMIT TRANSACTION;
GO

PRINT '>>> HSWRMS V1.6 Migration successfully committed!';
GO
