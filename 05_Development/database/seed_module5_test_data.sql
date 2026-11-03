-- ==============================================================================
-- Seed Mock Bookings for Module 5 Billing, Folio & Checkout Testing
-- ==============================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
BEGIN TRANSACTION;

PRINT N'>>> Bắt đầu tạo dữ liệu các phòng giả định phục vụ kiểm thử Module 5...';

-- 1. Dọn dẹp dữ liệu cũ của các booking 10, 11, 12, 13 (nếu có)
DELETE FROM dbo.PaymentTransaction WHERE retreat_booking_id IN (10, 11, 12, 13) 
    OR invoice_id IN (SELECT invoice_id FROM dbo.Invoice WHERE folio_id IN (SELECT folio_id FROM dbo.Folio WHERE retreat_booking_id IN (10, 11, 12, 13)));
DELETE FROM dbo.CreditNote WHERE invoice_id IN (SELECT invoice_id FROM dbo.Invoice WHERE folio_id IN (SELECT folio_id FROM dbo.Folio WHERE retreat_booking_id IN (10, 11, 12, 13)));
DELETE FROM dbo.Invoice WHERE folio_id IN (SELECT folio_id FROM dbo.Folio WHERE retreat_booking_id IN (10, 11, 12, 13));
DELETE FROM dbo.FolioItem WHERE folio_id IN (SELECT folio_id FROM dbo.Folio WHERE retreat_booking_id IN (10, 11, 12, 13));
DELETE FROM dbo.Folio WHERE retreat_booking_id IN (10, 11, 12, 13);
DELETE FROM dbo.MealOrderItem WHERE meal_order_id IN (SELECT meal_order_id FROM dbo.MealOrder WHERE retreat_booking_id IN (10, 11, 12, 13));
DELETE FROM dbo.MealOrder WHERE retreat_booking_id IN (10, 11, 12, 13);
DELETE FROM dbo.SpaSession WHERE retreat_booking_id IN (10, 11, 12, 13);
DELETE FROM dbo.ResidenceRecord WHERE retreat_booking_id IN (10, 11, 12, 13);
DELETE FROM dbo.CustomerReview WHERE retreat_booking_id IN (10, 11, 12, 13);
DELETE FROM dbo.RetreatBooking WHERE retreat_booking_id IN (10, 11, 12, 13);

-- 2. Thêm 4 Đặt phòng (RetreatBooking)
SET IDENTITY_INSERT dbo.RetreatBooking ON;

-- Booking 10: Eleanor Vance - Villa V101 (24.500.000 đ, cọc 7.350.000 đ, Extras 2.100.000 đ, cần thanh toán 19.418.000 đ)
INSERT INTO dbo.RetreatBooking (
    retreat_booking_id, customer_profile_id, retreat_package_id, requested_villa_category_id, assigned_villa_id,
    check_in_date, check_out_date, booking_status, deposit_amount, total_estimated_amount,
    special_request, created_at, guest_count
) VALUES (
    10, 3, 2, 2, 1,
    CAST(DATEADD(day, -4, GETDATE()) AS DATE), CAST(GETDATE() AS DATE), 'CHECKED_IN', 7350000.00, 24500000.00,
    N'Khách yêu cầu trà thảo mộc & phục vụ bữa tối tại phòng', SYSUTCDATETIME(), 2
);

-- Booking 11: Demo Customer - Villa V103 (12.500.000 đ, cọc 3.750.000 đ, không extras, cần thanh toán 8.750.000 đ)
INSERT INTO dbo.RetreatBooking (
    retreat_booking_id, customer_profile_id, retreat_package_id, requested_villa_category_id, assigned_villa_id,
    check_in_date, check_out_date, booking_status, deposit_amount, total_estimated_amount,
    special_request, created_at, guest_count
) VALUES (
    11, 4, 1, 2, 3,
    CAST(DATEADD(day, -2, GETDATE()) AS DATE), CAST(GETDATE() AS DATE), 'CHECKED_IN', 3750000.00, 12500000.00,
    N'Khách check-in sáng sớm', SYSUTCDATETIME(), 1
);

-- Booking 12: Tăng Xuân Hòa - Villa V201 (11.800.000 đ, đã trả 100%, Balance Due = 0 đ, Test Zero Balance Checkout)
INSERT INTO dbo.RetreatBooking (
    retreat_booking_id, customer_profile_id, retreat_package_id, requested_villa_category_id, assigned_villa_id,
    check_in_date, check_out_date, booking_status, deposit_amount, total_estimated_amount,
    special_request, created_at, guest_count
) VALUES (
    12, 8, 3, 1, 9,
    CAST(DATEADD(day, -2, GETDATE()) AS DATE), CAST(GETDATE() AS DATE), 'CHECKED_IN', 11800000.00, 11800000.00,
    N'Đã thanh toán 100% trước kỳ nghỉ', SYSUTCDATETIME(), 2
);

-- Booking 13: Xuân Hòa - Villa V301 (Có đơn F&B đang chế biến, Test Billing Guard Block)
INSERT INTO dbo.RetreatBooking (
    retreat_booking_id, customer_profile_id, retreat_package_id, requested_villa_category_id, assigned_villa_id,
    check_in_date, check_out_date, booking_status, deposit_amount, total_estimated_amount,
    special_request, created_at, guest_count
) VALUES (
    13, 5, 4, 3, 15,
    CAST(DATEADD(day, -3, GETDATE()) AS DATE), CAST(GETDATE() AS DATE), 'CHECKED_IN', 5250000.00, 17500000.00,
    N'Khách cần yên tĩnh tầng cao', SYSUTCDATETIME(), 2
);
SET IDENTITY_INSERT dbo.RetreatBooking OFF;

-- Cập nhật trạng thái Villa tương ứng thành OCCUPIED
UPDATE dbo.PhysicalVilla SET villa_status = 'OCCUPIED' WHERE villa_id IN (1, 3, 9, 15);

-- 3. Khai báo thông tin lưu trú (ResidenceRecord)
INSERT INTO dbo.ResidenceRecord (retreat_booking_id, identification_number, identification_type, nationality, permanent_address, collected_at, full_name, date_of_birth)
VALUES
(10, '001202008888', 'CCCD', N'Việt Nam', N'123 Lê Lợi, Quận 1, TP.HCM', SYSUTCDATETIME(), N'Eleanor Vance', '1992-05-15'),
(11, '001202009999', 'CCCD', N'Việt Nam', N'456 Kim Mã, Ba Đình, Hà Nội', SYSUTCDATETIME(), N'Demo Customer', '1990-10-20'),
(12, '079201012345', 'CCCD', N'Việt Nam', N'789 Nguyễn Văn Cừ, Cần Thơ', SYSUTCDATETIME(), N'Tăng Xuân Hòa', '1998-07-18'),
(13, '079201015678', 'CCCD', N'Việt Nam', N'12 Pasteur, Nha Trang', SYSUTCDATETIME(), N'Xuân Hòa', '1995-12-08');

-- 4. Thêm giao dịch đặt cọc ban đầu (PaymentTransaction)
INSERT INTO dbo.PaymentTransaction (retreat_booking_id, payment_type, payment_method, transaction_reference, amount_paid, payment_status, transaction_date)
VALUES 
(10, 'DEPOSIT', 'VNPAY', 'VNP-DEP-88010', 7350000.00, 'SUCCESSFUL', DATEADD(day, -4, SYSUTCDATETIME())),
(11, 'DEPOSIT', 'VNPAY', 'VNP-DEP-88011', 3750000.00, 'SUCCESSFUL', DATEADD(day, -2, SYSUTCDATETIME())),
(12, 'DEPOSIT', 'BANK_TRANSFER', 'VNP-DEP-88012', 11800000.00, 'SUCCESSFUL', DATEADD(day, -2, SYSUTCDATETIME())),
(13, 'DEPOSIT', 'VNPAY', 'VNP-DEP-88013', 5250000.00, 'SUCCESSFUL', DATEADD(day, -3, SYSUTCDATETIME()));

-- 5. Chi phí dịch vụ ngoài gói
-- Booking 10: 1 buổi Spa COMPLETED (1.500.000 đ)
INSERT INTO dbo.SpaSession (
    retreat_booking_id, treatment_id, therapist_id, room_id,
    requested_start_at, scheduled_start_at, scheduled_end_at,
    booking_source, session_status, confirmation_status, customer_note,
    created_at, schedule_version
) VALUES (
    10, 2, 5, 2,
    DATEADD(day, -1, SYSUTCDATETIME()), DATEADD(day, -1, SYSUTCDATETIME()), DATEADD(minute, 90, DATEADD(day, -1, SYSUTCDATETIME())),
    'RECEPTIONIST', 'COMPLETED', 'CONFIRMED', N'Trị liệu ngoài gói theo yêu cầu của khách',
    DATEADD(day, -1, SYSUTCDATETIME()), 1
);
DECLARE @spaId10 INT = SCOPE_IDENTITY();

-- Booking 10: 1 đơn F&B DELIVERED (600.000 đ)
INSERT INTO dbo.MealOrder (
    retreat_booking_id, order_date, meal_type, order_type, order_status, created_at, special_instructions
) VALUES (
    10, CAST(DATEADD(day, -1, GETDATE()) AS DATE), N'DINNER', 'A_LA_CARTE', 'DELIVERED', DATEADD(day, -1, SYSUTCDATETIME()), N'Giao tại Villa V101'
);
DECLARE @mealId10 INT = SCOPE_IDENTITY();

-- Booking 13: 1 đơn F&B DELIVERED (Dịch vụ phụ trội ngoài gói chưa thanh toán, sẽ quyết toán tại Final Invoice)
INSERT INTO dbo.MealOrder (
    retreat_booking_id, order_date, meal_type, order_type, order_status, created_at, special_instructions
) VALUES (
    13, CAST(GETDATE() AS DATE), N'LUNCH', 'A_LA_CARTE', 'DELIVERED', SYSUTCDATETIME(), N'Giao tại Villa V301 - Đã giao phòng'
);
DECLARE @mealId13 INT = SCOPE_IDENTITY();

-- 6. Tạo Bảng Kê Kỳ Nghỉ (Folio) & Các Dòng Chi Phí (FolioItem)
-- Folio 10 (Booking 10):
INSERT INTO dbo.Folio (retreat_booking_id, total_charges, total_paid, folio_status)
VALUES (10, 26600000.00, 7350000.00, 'OPEN');
DECLARE @folioId10 INT = SCOPE_IDENTITY();

INSERT INTO dbo.FolioItem (folio_id, charge_category, description, amount, charged_at, source_booking_id, is_voided)
VALUES (@folioId10, 'PACKAGE', N'Gói Nghỉ Dưỡng Sanctuary Retreat (5D4N)', 24500000.00, DATEADD(day, -4, SYSUTCDATETIME()), 10, 0);

INSERT INTO dbo.FolioItem (folio_id, charge_category, description, amount, charged_at, source_spa_session_id, is_voided)
VALUES (@folioId10, 'SPA', N'Trị Liệu Dẫn Lưu Bạch Huyết Chuyên Sâu (90 phút)', 1500000.00, DATEADD(day, -1, SYSUTCDATETIME()), @spaId10, 0);

INSERT INTO dbo.FolioItem (folio_id, charge_category, description, amount, charged_at, source_meal_order_id, is_voided)
VALUES (@folioId10, 'FNB', N'Bữa Tối Dưỡng Sinh Thực Dưỡng Cao Cấp', 600000.00, DATEADD(day, -1, SYSUTCDATETIME()), @mealId10, 0);

-- Folio 11 (Booking 11):
INSERT INTO dbo.Folio (retreat_booking_id, total_charges, total_paid, folio_status)
VALUES (11, 12500000.00, 3750000.00, 'OPEN');
DECLARE @folioId11 INT = SCOPE_IDENTITY();

INSERT INTO dbo.FolioItem (folio_id, charge_category, description, amount, charged_at, source_booking_id, is_voided)
VALUES (@folioId11, 'PACKAGE', N'Gói Nghỉ Dưỡng Pure Detox (3D2N)', 12500000.00, DATEADD(day, -2, SYSUTCDATETIME()), 11, 0);

-- Folio 12 (Booking 12):
INSERT INTO dbo.Folio (retreat_booking_id, total_charges, total_paid, folio_status)
VALUES (12, 11800000.00, 11800000.00, 'OPEN');
DECLARE @folioId12 INT = SCOPE_IDENTITY();

INSERT INTO dbo.FolioItem (folio_id, charge_category, description, amount, charged_at, source_booking_id, is_voided)
VALUES (@folioId12, 'PACKAGE', N'Gói Nghỉ Dưỡng Khôi Phục Giấc Ngủ Sâu (3D2N)', 11800000.00, DATEADD(day, -2, SYSUTCDATETIME()), 12, 0);

-- Folio 13 (Booking 13):
INSERT INTO dbo.Folio (retreat_booking_id, total_charges, total_paid, folio_status)
VALUES (13, 17950000.00, 5250000.00, 'OPEN');
DECLARE @folioId13 INT = SCOPE_IDENTITY();

INSERT INTO dbo.FolioItem (folio_id, charge_category, description, amount, charged_at, source_booking_id, is_voided)
VALUES (@folioId13, 'PACKAGE', N'Gói Nghỉ Dưỡng Chữa Lành Thân - Tâm (4D3N)', 17500000.00, DATEADD(day, -3, SYSUTCDATETIME()), 13, 0);

INSERT INTO dbo.FolioItem (folio_id, charge_category, description, amount, charged_at, source_meal_order_id, is_voided)
VALUES (@folioId13, 'FNB', N'Đơn Ẩm Thực Gọi Món Đang Chế Biến', 450000.00, SYSUTCDATETIME(), @mealId13, 0);

COMMIT TRANSACTION;
PRINT N'>>> Đã khởi tạo thành công 4 phòng giả định phục vụ kiểm thử Module 5!';
