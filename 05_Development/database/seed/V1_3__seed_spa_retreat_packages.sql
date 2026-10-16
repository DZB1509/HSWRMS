/*
================================================================================
HSWRMS Seed Data V1.3 - Spa Treatments, Retreat Packages & Treatment Rooms
Source: 02_Requirement/Screen_Inventory/Goi_Dich_Vu_Spa_Tri_Lieu_HSWRMS.xlsx
Target Database: SQL Server / Azure SQL
================================================================================
*/

USE [HSWRMS];
GO

SET NOCOUNT ON;
GO

PRINT '>>> Beginning HSWRMS Spa & Retreat Packages Seeding...';
GO

/* ============================================================================
   1. RETREAT PACKAGES (Sheet 1: Gói Retreat Trọn Gói)
   ============================================================================ */
PRINT '--- Seeding Retreat Packages...';

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)' OR package_code = 'RET-DETOX-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-DETOX-03',
        package_name = N'3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)',
        wellness_goal = N'Detox & Purification',
        duration_nights = 2,
        base_price = 12500000,
        included_treatments = N'• 01 Massage dẫn lưu bạch huyết (75p)
• 01 Tẩy tế bào chết trà xanh & bùn khoáng (60p)
• 01 Liệu pháp xông hơi thảo dược & ngâm khoáng (45p)
• 02 Buổi Hatha Yoga thanh lọc buổi sáng',
        dietary_plan = N'Thực đơn Detox thanh lọc, nước ép lạnh hữu cơ, không đường & không chất béo bão hòa',
        target_guest = N'Khách muốn đào thải độc tố, người làm việc áp lực cao, mệt mỏi đường tiêu hóa',
        package_status = 'ACTIVE'
    WHERE package_name = N'3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)' OR package_code = 'RET-DETOX-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-DETOX-03', N'3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)', N'Detox & Purification', 2, 12500000,
        N'• 01 Massage dẫn lưu bạch huyết (75p)
• 01 Tẩy tế bào chết trà xanh & bùn khoáng (60p)
• 01 Liệu pháp xông hơi thảo dược & ngâm khoáng (45p)
• 02 Buổi Hatha Yoga thanh lọc buổi sáng', N'Thực đơn Detox thanh lọc, nước ép lạnh hữu cơ, không đường & không chất béo bão hòa', N'Khách muốn đào thải độc tố, người làm việc áp lực cao, mệt mỏi đường tiêu hóa', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'5D4N Tái Tạo Năng Lượng & Thải Độc Chuyên Sâu (Deep Detox & Reset)' OR package_code = 'RET-DETOX-05')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-DETOX-05',
        package_name = N'5D4N Tái Tạo Năng Lượng & Thải Độc Chuyên Sâu (Deep Detox & Reset)',
        wellness_goal = N'Deep Detoxification',
        duration_nights = 4,
        base_price = 24800000,
        included_treatments = N'• 02 Dẫn lưu bạch huyết toàn thân (75p)
• 01 Trị liệu bấm huyệt bụng Chi Nei Tsang (60p)
• 01 Tẩy tế bào chết & ủ dưỡng tảo biển (60p)
• 02 Thủy liệu pháp bồn khoáng Jacuzzi (45p)
• 04 Phiên Yoga & Thiền định thở Pranayama',
        dietary_plan = N'Liệu trình ăn kiêng gián đoạn / Plant-based chuyên sâu, trà thảo mộc đào thải kim loại nặng',
        target_guest = N'Khách hàng cần phục hồi cơ thể sau thời gian dài stress hoặc lối sống kém lành mạnh',
        package_status = 'ACTIVE'
    WHERE package_name = N'5D4N Tái Tạo Năng Lượng & Thải Độc Chuyên Sâu (Deep Detox & Reset)' OR package_code = 'RET-DETOX-05';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-DETOX-05', N'5D4N Tái Tạo Năng Lượng & Thải Độc Chuyên Sâu (Deep Detox & Reset)', N'Deep Detoxification', 4, 24800000,
        N'• 02 Dẫn lưu bạch huyết toàn thân (75p)
• 01 Trị liệu bấm huyệt bụng Chi Nei Tsang (60p)
• 01 Tẩy tế bào chết & ủ dưỡng tảo biển (60p)
• 02 Thủy liệu pháp bồn khoáng Jacuzzi (45p)
• 04 Phiên Yoga & Thiền định thở Pranayama', N'Liệu trình ăn kiêng gián đoạn / Plant-based chuyên sâu, trà thảo mộc đào thải kim loại nặng', N'Khách hàng cần phục hồi cơ thể sau thời gian dài stress hoặc lối sống kém lành mạnh', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)' OR package_code = 'RET-SLEEP-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-SLEEP-03',
        package_name = N'3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)',
        wellness_goal = N'Sleep Improvement',
        duration_nights = 2,
        base_price = 11800000,
        included_treatments = N'• 01 Massage trị liệu chuông xoay Tây Tạng (Sound Bath 60p)
• 01 Massage đầu - cổ - vai gáy & ngâm chân thảo mộc (60p)
• 01 Massage thư giãn Thụy Điển với tinh dầu oải hương (75p)
• 02 Buổi Thiền Yoga Nidra buổi tối (45p)',
        dietary_plan = N'Thực đơn tăng sinh Melatonin tự nhiên: hạt sen, cá ngừ, hạnh nhân, trà hoa cúc buổi tối',
        target_guest = N'Người mắc chứng mất ngủ kinh niên, rối loạn nhịp sinh học (Jet-lag), mệt mỏi thần kinh',
        package_status = 'ACTIVE'
    WHERE package_name = N'3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)' OR package_code = 'RET-SLEEP-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-SLEEP-03', N'3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)', N'Sleep Improvement', 2, 11800000,
        N'• 01 Massage trị liệu chuông xoay Tây Tạng (Sound Bath 60p)
• 01 Massage đầu - cổ - vai gáy & ngâm chân thảo mộc (60p)
• 01 Massage thư giãn Thụy Điển với tinh dầu oải hương (75p)
• 02 Buổi Thiền Yoga Nidra buổi tối (45p)', N'Thực đơn tăng sinh Melatonin tự nhiên: hạt sen, cá ngừ, hạnh nhân, trà hoa cúc buổi tối', N'Người mắc chứng mất ngủ kinh niên, rối loạn nhịp sinh học (Jet-lag), mệt mỏi thần kinh', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)' OR package_code = 'RET-STRESS-04')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-STRESS-04',
        package_name = N'4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)',
        wellness_goal = N'Stress Reduction',
        duration_nights = 3,
        base_price = 17500000,
        included_treatments = N'• 01 Massage đá nóng núi lửa Himalaya (90p)
• 01 Liệu pháp Shirodhara nhỏ dầu ấm luân xa trán (60p)
• 01 Liệu pháp mùi hương Aromatherapy giải tỏa căng thẳng (75p)
• 03 Phiên Thiền chuông & Đi bộ thiền hành trong rừng (Forest Bathing)',
        dietary_plan = N'Thực đơn dưỡng tâm bổ khí, cân bằng năng lượng Âm - Dương, đồ uống thảo dược phục hồi',
        target_guest = N'Doanh nhân, nhà quản lý, người đối mặt với kiệt sức (Burnout), khủng hoảng tâm lý',
        package_status = 'ACTIVE'
    WHERE package_name = N'4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)' OR package_code = 'RET-STRESS-04';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-STRESS-04', N'4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)', N'Stress Reduction', 3, 17500000,
        N'• 01 Massage đá nóng núi lửa Himalaya (90p)
• 01 Liệu pháp Shirodhara nhỏ dầu ấm luân xa trán (60p)
• 01 Liệu pháp mùi hương Aromatherapy giải tỏa căng thẳng (75p)
• 03 Phiên Thiền chuông & Đi bộ thiền hành trong rừng (Forest Bathing)', N'Thực đơn dưỡng tâm bổ khí, cân bằng năng lượng Âm - Dương, đồ uống thảo dược phục hồi', N'Doanh nhân, nhà quản lý, người đối mặt với kiệt sức (Burnout), khủng hoảng tâm lý', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)' OR package_code = 'RET-AGING-04')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-AGING-04',
        package_name = N'4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)',
        wellness_goal = N'Anti-Aging & Cellular Care',
        duration_nights = 3,
        base_price = 22000000,
        included_treatments = N'• 01 Chăm sóc da mặt chuyên sâu nâng cơ Guasha ngọc thạch (75p)
• 01 Trị liệu trẻ hóa da với Collagen sinh học & Oxygen (60p)
• 01 Massage toàn thân dưỡng ẩm hoàng gia với tinh dầu hoa hồng Damask (90p)
• 01 Tắm trắng mịn thảo mộc sâm nhung (45p)',
        dietary_plan = N'Thực đơn giàu Collagen, chất chống oxy hóa cao (Antioxidants), các loại quả mọng và Superfoods',
        target_guest = N'Phái đẹp, phụ nữ sau tuổi 30 mong muốn tái tạo độ đàn hồi da và thanh xuân rạng rỡ',
        package_status = 'ACTIVE'
    WHERE package_name = N'4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)' OR package_code = 'RET-AGING-04';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-AGING-04', N'4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)', N'Anti-Aging & Cellular Care', 3, 22000000,
        N'• 01 Chăm sóc da mặt chuyên sâu nâng cơ Guasha ngọc thạch (75p)
• 01 Trị liệu trẻ hóa da với Collagen sinh học & Oxygen (60p)
• 01 Massage toàn thân dưỡng ẩm hoàng gia với tinh dầu hoa hồng Damask (90p)
• 01 Tắm trắng mịn thảo mộc sâm nhung (45p)', N'Thực đơn giàu Collagen, chất chống oxy hóa cao (Antioxidants), các loại quả mọng và Superfoods', N'Phái đẹp, phụ nữ sau tuổi 30 mong muốn tái tạo độ đàn hồi da và thanh xuân rạng rỡ', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'3D2N Nắn Chỉnh Cột Sống & Phục Hồi Thể Lực (Spine & Posture Care)' OR package_code = 'RET-ALIGN-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-ALIGN-03',
        package_name = N'3D2N Nắn Chỉnh Cột Sống & Phục Hồi Thể Lực (Spine & Posture Care)',
        wellness_goal = N'Physical Therapy & Posture',
        duration_nights = 2,
        base_price = 13200000,
        included_treatments = N'• 01 Trị liệu cơ sâu bấm huyệt giải phóng co thắt (Deep Tissue 75p)
• 01 Nắn chỉnh cổ vai gáy và kéo giãn cột sống trị liệu (60p)
• 01 Chườm túi thảo mộc thuốc Bắc ấm giảm thoái hóa (60p)
• 02 Buổi Yoga phục hồi tư thế (Therapeutic Alignment Yoga 1-1)',
        dietary_plan = N'Thực đơn hỗ trợ xương khớp: bổ sung Canxi hữu cơ, Glucosamine tự nhiên, nước hầm xương hữu cơ',
        target_guest = N'Dân văn phòng bị hội chứng gù lưng, đau cổ vai gáy mạn tính, người chơi thể thao thoái hóa',
        package_status = 'ACTIVE'
    WHERE package_name = N'3D2N Nắn Chỉnh Cột Sống & Phục Hồi Thể Lực (Spine & Posture Care)' OR package_code = 'RET-ALIGN-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-ALIGN-03', N'3D2N Nắn Chỉnh Cột Sống & Phục Hồi Thể Lực (Spine & Posture Care)', N'Physical Therapy & Posture', 2, 13200000,
        N'• 01 Trị liệu cơ sâu bấm huyệt giải phóng co thắt (Deep Tissue 75p)
• 01 Nắn chỉnh cổ vai gáy và kéo giãn cột sống trị liệu (60p)
• 01 Chườm túi thảo mộc thuốc Bắc ấm giảm thoái hóa (60p)
• 02 Buổi Yoga phục hồi tư thế (Therapeutic Alignment Yoga 1-1)', N'Thực đơn hỗ trợ xương khớp: bổ sung Canxi hữu cơ, Glucosamine tự nhiên, nước hầm xương hữu cơ', N'Dân văn phòng bị hội chứng gù lưng, đau cổ vai gáy mạn tính, người chơi thể thao thoái hóa', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'5D4N Tăng Cường Sinh Lực & Quản Lý Vóc Dáng (Vitality & Weight Trim)' OR package_code = 'RET-VITAL-05')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-VITAL-05',
        package_name = N'5D4N Tăng Cường Sinh Lực & Quản Lý Vóc Dáng (Vitality & Weight Trim)',
        wellness_goal = N'Fitness & Body Shaping',
        duration_nights = 4,
        base_price = 26500000,
        included_treatments = N'• 02 Massage giảm mỡ săn chắc cơ thể đả thông kinh lạc (75p)
• 01 Trị liệu quấn nóng bùn khoáng hủy mỡ (Body Wrap 60p)
• 02 Thủy liệu pháp áp lực cao dưới nước (Hydrotherapy 45p)
• 04 Buổi huấn luyện thể lực cá nhân (HIIT/Pilates/Cardio 60p)',
        dietary_plan = N'Thực đơn Macro-balanced chuẩn Calories deficit nhẹ, đạm thực vật cao cấp, ít muối (Low-sodium)',
        target_guest = N'Người muốn thon gọn vóc dáng, giảm mỡ nội tạng an toàn kết hợp tăng cường sức bền',
        package_status = 'ACTIVE'
    WHERE package_name = N'5D4N Tăng Cường Sinh Lực & Quản Lý Vóc Dáng (Vitality & Weight Trim)' OR package_code = 'RET-VITAL-05';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-VITAL-05', N'5D4N Tăng Cường Sinh Lực & Quản Lý Vóc Dáng (Vitality & Weight Trim)', N'Fitness & Body Shaping', 4, 26500000,
        N'• 02 Massage giảm mỡ săn chắc cơ thể đả thông kinh lạc (75p)
• 01 Trị liệu quấn nóng bùn khoáng hủy mỡ (Body Wrap 60p)
• 02 Thủy liệu pháp áp lực cao dưới nước (Hydrotherapy 45p)
• 04 Buổi huấn luyện thể lực cá nhân (HIIT/Pilates/Cardio 60p)', N'Thực đơn Macro-balanced chuẩn Calories deficit nhẹ, đạm thực vật cao cấp, ít muối (Low-sodium)', N'Người muốn thon gọn vóc dáng, giảm mỡ nội tạng an toàn kết hợp tăng cường sức bền', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_name = N'3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Nurturing Prenatal)' OR package_code = 'RET-MOM-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_code = 'RET-MOM-03',
        package_name = N'3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Nurturing Prenatal)',
        wellness_goal = N'Maternal Wellness',
        duration_nights = 2,
        base_price = 14000000,
        included_treatments = N'• 02 Massage chuyên biệt cho mẹ bầu giảm nhức mỏi lưng hông (60p)
• 01 Ngâm chân thảo mộc giảm phù nề tĩnh mạch (45p)
• 01 Chăm sóc mặt thảo mộc dịu nhẹ an toàn thai kỳ (60p)
• 02 Lớp Yoga tiền sản hít thở chuẩn bị sinh nở nhẹ nhàng',
        dietary_plan = N'Thực đơn hữu cơ lành tính, giàu Axit Folic, Sắt, Vitamin tự nhiên theo khuyến nghị dinh dưỡng thai kỳ',
        target_guest = N'Mẹ bầu ở tam cá nguyệt thứ 2 và 3 cần thư giãn tinh thần và giảm tải áp lực thể chất',
        package_status = 'ACTIVE'
    WHERE package_name = N'3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Nurturing Prenatal)' OR package_code = 'RET-MOM-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, base_price,
        included_treatments, dietary_plan, target_guest, package_status
    ) VALUES (
        'RET-MOM-03', N'3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Nurturing Prenatal)', N'Maternal Wellness', 2, 14000000,
        N'• 02 Massage chuyên biệt cho mẹ bầu giảm nhức mỏi lưng hông (60p)
• 01 Ngâm chân thảo mộc giảm phù nề tĩnh mạch (45p)
• 01 Chăm sóc mặt thảo mộc dịu nhẹ an toàn thai kỳ (60p)
• 02 Lớp Yoga tiền sản hít thở chuẩn bị sinh nở nhẹ nhàng', N'Thực đơn hữu cơ lành tính, giàu Axit Folic, Sắt, Vitamin tự nhiên theo khuyến nghị dinh dưỡng thai kỳ', N'Mẹ bầu ở tam cá nguyệt thứ 2 và 3 cần thư giãn tinh thần và giảm tải áp lực thể chất', 'ACTIVE'
    );
END
GO

/* ============================================================================
   2. SPA TREATMENTS (Sheet 2: Danh Mục Spa Trị Liệu)
   ============================================================================ */
PRINT '--- Seeding Spa Treatments...';

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)' OR treatment_code = 'SPA-MASS-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-MASS-01',
        treatment_name = N'Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)',
        category = N'Body Massage',
        duration_minutes = 90,
        base_price = 1650000,
        room_compatibility = N'Phòng Massage Standard/VIP',
        therapist_qualification = N'Chứng chỉ Body Therapy & Đá nóng',
        contraindications = N'Huyết áp cao chưa kiểm soát, vết thương hở ngoài da',
        description = N'Dùng đá muối khoáng nóng thâm nhập mô sâu, giãn cơ, lưu thông khí huyết',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)' OR treatment_code = 'SPA-MASS-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-MASS-01', N'Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)', N'Body Massage', 90, 1650000,
        N'Phòng Massage Standard/VIP', N'Chứng chỉ Body Therapy & Đá nóng', N'Huyết áp cao chưa kiểm soát, vết thương hở ngoài da', N'Dùng đá muối khoáng nóng thâm nhập mô sâu, giãn cơ, lưu thông khí huyết', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Massage Cơ Sâu Giải Phóng Căng Thẳng (Deep Tissue)' OR treatment_code = 'SPA-MASS-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-MASS-02',
        treatment_name = N'Massage Cơ Sâu Giải Phóng Căng Thẳng (Deep Tissue)',
        category = N'Body Massage',
        duration_minutes = 75,
        base_price = 1450000,
        room_compatibility = N'Phòng Massage Standard/VIP',
        therapist_qualification = N'Chứng chỉ Trị liệu Cơ xương khớp',
        contraindications = N'Phụ nữ mang thai, người loãng xương nặng, chấn thương mới',
        description = N'Tác động lực sâu giải tỏa bó cơ vai, lưng, hông do ngồi sai tư thế',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Massage Cơ Sâu Giải Phóng Căng Thẳng (Deep Tissue)' OR treatment_code = 'SPA-MASS-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-MASS-02', N'Massage Cơ Sâu Giải Phóng Căng Thẳng (Deep Tissue)', N'Body Massage', 75, 1450000,
        N'Phòng Massage Standard/VIP', N'Chứng chỉ Trị liệu Cơ xương khớp', N'Phụ nữ mang thai, người loãng xương nặng, chấn thương mới', N'Tác động lực sâu giải tỏa bó cơ vai, lưng, hông do ngồi sai tư thế', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Trị Liệu Dẫn Lưu Bạch Huyết (Manual Lymphatic Drainage)' OR treatment_code = 'SPA-MASS-03')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-MASS-03',
        treatment_name = N'Trị Liệu Dẫn Lưu Bạch Huyết (Manual Lymphatic Drainage)',
        category = N'Detox Therapy',
        duration_minutes = 75,
        base_price = 1550000,
        room_compatibility = N'Phòng Massage Standard/VIP',
        therapist_qualification = N'Chứng chỉ Lymphatic Drainage',
        contraindications = N'Suy tim xung huyết, huyết khối tĩnh mạch, nhiễm trùng cấp',
        description = N'Kỹ thuật vuốt nhẹ kích thích hệ bạch huyết thải độc tố tự nhiên',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Trị Liệu Dẫn Lưu Bạch Huyết (Manual Lymphatic Drainage)' OR treatment_code = 'SPA-MASS-03';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-MASS-03', N'Trị Liệu Dẫn Lưu Bạch Huyết (Manual Lymphatic Drainage)', N'Detox Therapy', 75, 1550000,
        N'Phòng Massage Standard/VIP', N'Chứng chỉ Lymphatic Drainage', N'Suy tim xung huyết, huyết khối tĩnh mạch, nhiễm trùng cấp', N'Kỹ thuật vuốt nhẹ kích thích hệ bạch huyết thải độc tố tự nhiên', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Massage Bấm Huyệt Truyền Thống Việt Nam (Vietnamese Acupressure)' OR treatment_code = 'SPA-MASS-04')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-MASS-04',
        treatment_name = N'Massage Bấm Huyệt Truyền Thống Việt Nam (Vietnamese Acupressure)',
        category = N'Body Massage',
        duration_minutes = 60,
        base_price = 1150000,
        room_compatibility = N'Phòng Massage Standard/VIP',
        therapist_qualification = N'Chứng chỉ Y học Cổ truyền / Xoa bóp bấm huyệt',
        contraindications = N'Gãy xương chưa lành, sốt cao, phụ nữ có thai',
        description = N'Kết hợp bấm 36 huyệt đạo chính và giác hơi thảo dược làm ấm kinh lạc',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Massage Bấm Huyệt Truyền Thống Việt Nam (Vietnamese Acupressure)' OR treatment_code = 'SPA-MASS-04';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-MASS-04', N'Massage Bấm Huyệt Truyền Thống Việt Nam (Vietnamese Acupressure)', N'Body Massage', 60, 1150000,
        N'Phòng Massage Standard/VIP', N'Chứng chỉ Y học Cổ truyền / Xoa bóp bấm huyệt', N'Gãy xương chưa lành, sốt cao, phụ nữ có thai', N'Kết hợp bấm 36 huyệt đạo chính và giác hơi thảo dược làm ấm kinh lạc', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)' OR treatment_code = 'SPA-MASS-05')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-MASS-05',
        treatment_name = N'Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)',
        category = N'Herbal Therapy',
        duration_minutes = 75,
        base_price = 1350000,
        room_compatibility = N'Phòng Massage Standard/VIP',
        therapist_qualification = N'Chứng chỉ Thảo dược trị liệu',
        contraindications = N'Dị ứng với ngải cứu, gừng, quế; da nhạy cảm nhiệt độ',
        description = N'Chườm túi thảo mộc ấm nóng lên các điểm đau nhức phong thấp',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)' OR treatment_code = 'SPA-MASS-05';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-MASS-05', N'Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)', N'Herbal Therapy', 75, 1350000,
        N'Phòng Massage Standard/VIP', N'Chứng chỉ Thảo dược trị liệu', N'Dị ứng với ngải cứu, gừng, quế; da nhạy cảm nhiệt độ', N'Chườm túi thảo mộc ấm nóng lên các điểm đau nhức phong thấp', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)' OR treatment_code = 'SPA-MASS-06')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-MASS-06',
        treatment_name = N'Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)',
        category = N'Maternal Care',
        duration_minutes = 60,
        base_price = 1250000,
        room_compatibility = N'Phòng Massage VIP (Có gối bầu)',
        therapist_qualification = N'Chứng chỉ Massage Thai kỳ chuyên nghiệp',
        contraindications = N'Thai dưới 12 tuần, tiền sản giật, dọa sảy thai',
        description = N'Động tác êm dịu giúp mẹ bầu xua tan căng thẳng, phù chân và mỏi lưng',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)' OR treatment_code = 'SPA-MASS-06';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-MASS-06', N'Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)', N'Maternal Care', 60, 1250000,
        N'Phòng Massage VIP (Có gối bầu)', N'Chứng chỉ Massage Thai kỳ chuyên nghiệp', N'Thai dưới 12 tuần, tiền sản giật, dọa sảy thai', N'Động tác êm dịu giúp mẹ bầu xua tan căng thẳng, phù chân và mỏi lưng', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Singing Bowl)' OR treatment_code = 'SPA-HEAL-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-HEAL-01',
        treatment_name = N'Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Singing Bowl)',
        category = N'Energy Healing',
        duration_minutes = 60,
        base_price = 1200000,
        room_compatibility = N'Phòng Thiền Tĩnh Tâm / Chuông xoay',
        therapist_qualification = N'Chứng chỉ Master Sound Healing',
        contraindications = N'Người đeo máy tạo nhịp tim (Pacemaker), động kinh',
        description = N'Tần số âm thanh và sóng rung làm dịu sóng não, đưa tâm trí về trạng thái Alpha',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Singing Bowl)' OR treatment_code = 'SPA-HEAL-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-HEAL-01', N'Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Singing Bowl)', N'Energy Healing', 60, 1200000,
        N'Phòng Thiền Tĩnh Tâm / Chuông xoay', N'Chứng chỉ Master Sound Healing', N'Người đeo máy tạo nhịp tim (Pacemaker), động kinh', N'Tần số âm thanh và sóng rung làm dịu sóng não, đưa tâm trí về trạng thái Alpha', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Liệu Pháp Shirodhara Nhỏ Dầu Luân Xa Trán (Ayurvedic Shirodhara)' OR treatment_code = 'SPA-HEAL-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-HEAL-02',
        treatment_name = N'Liệu Pháp Shirodhara Nhỏ Dầu Luân Xa Trán (Ayurvedic Shirodhara)',
        category = N'Ayurveda Therapy',
        duration_minutes = 60,
        base_price = 1750000,
        room_compatibility = N'Phòng Trị Liệu Ayurveda Chuyên Biệt',
        therapist_qualification = N'Chứng chỉ Liệu trình Ayurveda',
        contraindications = N'Chấn thương đầu cổ, viêm xoang cấp tính',
        description = N'Dòng dầu thảo mộc ấm nhỏ liên tục lên luân xa con mắt thứ 3, trị mất ngủ sâu',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Liệu Pháp Shirodhara Nhỏ Dầu Luân Xa Trán (Ayurvedic Shirodhara)' OR treatment_code = 'SPA-HEAL-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-HEAL-02', N'Liệu Pháp Shirodhara Nhỏ Dầu Luân Xa Trán (Ayurvedic Shirodhara)', N'Ayurveda Therapy', 60, 1750000,
        N'Phòng Trị Liệu Ayurveda Chuyên Biệt', N'Chứng chỉ Liệu trình Ayurveda', N'Chấn thương đầu cổ, viêm xoang cấp tính', N'Dòng dầu thảo mộc ấm nhỏ liên tục lên luân xa con mắt thứ 3, trị mất ngủ sâu', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Bấm Huyệt Thải Độc Bụng Chi Nei Tsang (Taoist Abdominal Massage)' OR treatment_code = 'SPA-HEAL-03')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-HEAL-03',
        treatment_name = N'Bấm Huyệt Thải Độc Bụng Chi Nei Tsang (Taoist Abdominal Massage)',
        category = N'Holistic Therapy',
        duration_minutes = 60,
        base_price = 1300000,
        room_compatibility = N'Phòng Massage Standard/VIP',
        therapist_qualification = N'Chứng chỉ Nội tạng Chi Nei Tsang',
        contraindications = N'Phụ nữ mang thai, vừa phẫu thuật bụng dưới 6 tháng',
        description = N'Thao tác trên vùng rốn và nội tạng giải phóng cảm xúc tiêu cực và đầy hơi',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Bấm Huyệt Thải Độc Bụng Chi Nei Tsang (Taoist Abdominal Massage)' OR treatment_code = 'SPA-HEAL-03';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-HEAL-03', N'Bấm Huyệt Thải Độc Bụng Chi Nei Tsang (Taoist Abdominal Massage)', N'Holistic Therapy', 60, 1300000,
        N'Phòng Massage Standard/VIP', N'Chứng chỉ Nội tạng Chi Nei Tsang', N'Phụ nữ mang thai, vừa phẫu thuật bụng dưới 6 tháng', N'Thao tác trên vùng rốn và nội tạng giải phóng cảm xúc tiêu cực và đầy hơi', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Trị Liệu Nâng Cơ Guasha Ngọc Thạch (Jade Guasha Facelift)' OR treatment_code = 'SPA-FACE-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-FACE-01',
        treatment_name = N'Trị Liệu Nâng Cơ Guasha Ngọc Thạch (Jade Guasha Facelift)',
        category = N'Facial Care',
        duration_minutes = 75,
        base_price = 1400000,
        room_compatibility = N'Phòng Chăm Sóc Da Mặt (Facial Room)',
        therapist_qualification = N'Chứng chỉ Thẩm mỹ Da liễu / Facial Care',
        contraindications = N'Mụn viêm bọc mủ nặng, vừa tiêm filler/botox dưới 2 tuần',
        description = N'Kỹ thuật miết đá ngọc bích kích thích collagen, thon gọn đường viền hàm V-line',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Trị Liệu Nâng Cơ Guasha Ngọc Thạch (Jade Guasha Facelift)' OR treatment_code = 'SPA-FACE-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-FACE-01', N'Trị Liệu Nâng Cơ Guasha Ngọc Thạch (Jade Guasha Facelift)', N'Facial Care', 75, 1400000,
        N'Phòng Chăm Sóc Da Mặt (Facial Room)', N'Chứng chỉ Thẩm mỹ Da liễu / Facial Care', N'Mụn viêm bọc mủ nặng, vừa tiêm filler/botox dưới 2 tuần', N'Kỹ thuật miết đá ngọc bích kích thích collagen, thon gọn đường viền hàm V-line', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Cấp Ẩm Phục Hồi Tế Bào Chuyên Sâu (Deep Hydration & Repair)' OR treatment_code = 'SPA-FACE-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-FACE-02',
        treatment_name = N'Cấp Ẩm Phục Hồi Tế Bào Chuyên Sâu (Deep Hydration & Repair)',
        category = N'Facial Care',
        duration_minutes = 60,
        base_price = 1250000,
        room_compatibility = N'Phòng Chăm Sóc Da Mặt (Facial Room)',
        therapist_qualification = N'Chứng chỉ Thẩm mỹ Da liễu / Facial Care',
        contraindications = N'Dị ứng với chiết xuất Hyaluronic Acid hoặc nha đam',
        description = N'Điện di tinh chất kết hợp mặt nạ tế bào gốc làm dịu da cháy nắng, mất nước',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Cấp Ẩm Phục Hồi Tế Bào Chuyên Sâu (Deep Hydration & Repair)' OR treatment_code = 'SPA-FACE-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-FACE-02', N'Cấp Ẩm Phục Hồi Tế Bào Chuyên Sâu (Deep Hydration & Repair)', N'Facial Care', 60, 1250000,
        N'Phòng Chăm Sóc Da Mặt (Facial Room)', N'Chứng chỉ Thẩm mỹ Da liễu / Facial Care', N'Dị ứng với chiết xuất Hyaluronic Acid hoặc nha đam', N'Điện di tinh chất kết hợp mặt nạ tế bào gốc làm dịu da cháy nắng, mất nước', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Trẻ Hóa Da Tảo Biển Hữu Cơ (Organic Marine Collagen)' OR treatment_code = 'SPA-FACE-03')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-FACE-03',
        treatment_name = N'Trẻ Hóa Da Tảo Biển Hữu Cơ (Organic Marine Collagen)',
        category = N'Anti-Aging Facial',
        duration_minutes = 75,
        base_price = 1600000,
        room_compatibility = N'Phòng Chăm Sóc Da Mặt (Facial Room)',
        therapist_qualification = N'Chứng chỉ Thẩm mỹ Da liễu Chuyên sâu',
        contraindications = N'Dị ứng hải sản/tảo biển, da mỏng lộ mao mạch nặng',
        description = N'Bổ sung vi khoáng biển sâu làm mờ nếp nhăn và cải thiện sắc tố da',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Trẻ Hóa Da Tảo Biển Hữu Cơ (Organic Marine Collagen)' OR treatment_code = 'SPA-FACE-03';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-FACE-03', N'Trẻ Hóa Da Tảo Biển Hữu Cơ (Organic Marine Collagen)', N'Anti-Aging Facial', 75, 1600000,
        N'Phòng Chăm Sóc Da Mặt (Facial Room)', N'Chứng chỉ Thẩm mỹ Da liễu Chuyên sâu', N'Dị ứng hải sản/tảo biển, da mỏng lộ mao mạch nặng', N'Bổ sung vi khoáng biển sâu làm mờ nếp nhăn và cải thiện sắc tố da', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Tẩy Tế Bào Chết Cà Phê Đắk Lắk & Dừa (Body Polish)' OR treatment_code = 'SPA-BODY-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-BODY-01',
        treatment_name = N'Tẩy Tế Bào Chết Cà Phê Đắk Lắk & Dừa (Body Polish)',
        category = N'Body Scrub',
        duration_minutes = 45,
        base_price = 850000,
        room_compatibility = N'Phòng Tắm Thủy Lực / Vichy Shower',
        therapist_qualification = N'Chứng chỉ Chăm sóc Cơ thể',
        contraindications = N'Da trầy xước, cháy nắng, chàm vảy nến diện rộng',
        description = N'Loại bỏ sừng già chết, mang lại làn da mềm mịn thơm tự nhiên',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Tẩy Tế Bào Chết Cà Phê Đắk Lắk & Dừa (Body Polish)' OR treatment_code = 'SPA-BODY-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-BODY-01', N'Tẩy Tế Bào Chết Cà Phê Đắk Lắk & Dừa (Body Polish)', N'Body Scrub', 45, 850000,
        N'Phòng Tắm Thủy Lực / Vichy Shower', N'Chứng chỉ Chăm sóc Cơ thể', N'Da trầy xước, cháy nắng, chàm vảy nến diện rộng', N'Loại bỏ sừng già chết, mang lại làn da mềm mịn thơm tự nhiên', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)' OR treatment_code = 'SPA-BODY-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-BODY-02',
        treatment_name = N'Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)',
        category = N'Body Wrap',
        duration_minutes = 60,
        base_price = 1100000,
        room_compatibility = N'Phòng Trị Liệu Toàn Thân (Wrap/Bath)',
        therapist_qualification = N'Chứng chỉ Chăm sóc Cơ thể',
        contraindications = N'Bệnh tim mạch, hội chứng sợ không gian kín (Claustrophobia)',
        description = N'Quấn màng giữ nhiệt cùng bùn khoáng tự nhiên, tăng tuần hoàn và giữ ẩm',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)' OR treatment_code = 'SPA-BODY-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-BODY-02', N'Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)', N'Body Wrap', 60, 1100000,
        N'Phòng Trị Liệu Toàn Thân (Wrap/Bath)', N'Chứng chỉ Chăm sóc Cơ thể', N'Bệnh tim mạch, hội chứng sợ không gian kín (Claustrophobia)', N'Quấn màng giữ nhiệt cùng bùn khoáng tự nhiên, tăng tuần hoàn và giữ ẩm', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Thủy Trị Liệu Dòng Chảy Áp Lực Vichy Shower (Vichy Rain)' OR treatment_code = 'SPA-HYDRO-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-HYDRO-01',
        treatment_name = N'Thủy Trị Liệu Dòng Chảy Áp Lực Vichy Shower (Vichy Rain)',
        category = N'Hydrotherapy',
        duration_minutes = 45,
        base_price = 950000,
        room_compatibility = N'Phòng Vòi Phun Vichy Shower',
        therapist_qualification = N'Chứng chỉ Kỹ thuật viên Thủy liệu pháp',
        contraindications = N'Nhiễm trùng da, viêm tai giữa chưa hồi phục',
        description = N'Hệ thống 7 vòi phun nước ấm mát-xa toàn thân nhịp nhàng như mưa rào',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Thủy Trị Liệu Dòng Chảy Áp Lực Vichy Shower (Vichy Rain)' OR treatment_code = 'SPA-HYDRO-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-HYDRO-01', N'Thủy Trị Liệu Dòng Chảy Áp Lực Vichy Shower (Vichy Rain)', N'Hydrotherapy', 45, 950000,
        N'Phòng Vòi Phun Vichy Shower', N'Chứng chỉ Kỹ thuật viên Thủy liệu pháp', N'Nhiễm trùng da, viêm tai giữa chưa hồi phục', N'Hệ thống 7 vòi phun nước ấm mát-xa toàn thân nhịp nhàng như mưa rào', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)' OR treatment_code = 'SPA-HYDRO-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-HYDRO-02',
        treatment_name = N'Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)',
        category = N'Hydrotherapy',
        duration_minutes = 45,
        base_price = 800000,
        room_compatibility = N'Phòng Bồn Gỗ Pơ Mu / Jacuzzi',
        therapist_qualification = N'Chứng chỉ Kỹ thuật viên Spa',
        contraindications = N'Huyết áp thấp nặng, phụ nữ đang trong kỳ kinh nguyệt',
        description = N'Bài thuốc ngâm 32 vị thuốc rừng giúp giãn gân cốt, thơm cơ thể và ngủ ngon',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)' OR treatment_code = 'SPA-HYDRO-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-HYDRO-02', N'Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)', N'Hydrotherapy', 45, 800000,
        N'Phòng Bồn Gỗ Pơ Mu / Jacuzzi', N'Chứng chỉ Kỹ thuật viên Spa', N'Huyết áp thấp nặng, phụ nữ đang trong kỳ kinh nguyệt', N'Bài thuốc ngâm 32 vị thuốc rừng giúp giãn gân cốt, thơm cơ thể và ngủ ngon', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Phiên Yoga Trị Liệu Cột Sống 1-1 (Therapeutic Spine Yoga)' OR treatment_code = 'SPA-YOGA-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-YOGA-01',
        treatment_name = N'Phiên Yoga Trị Liệu Cột Sống 1-1 (Therapeutic Spine Yoga)',
        category = N'Yoga & Movement',
        duration_minutes = 60,
        base_price = 900000,
        room_compatibility = N'Phòng Tập Yoga / Sala Hoa Sen',
        therapist_qualification = N'Chứng chỉ Yoga Alliance RYT 200/500',
        contraindications = N'Thoát vị đĩa đệm cấp tính đang đau dữ dội',
        description = N'Huấn luyện viên kèm riêng các tư thế điều chỉnh độ cong sinh lý cột sống',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Phiên Yoga Trị Liệu Cột Sống 1-1 (Therapeutic Spine Yoga)' OR treatment_code = 'SPA-YOGA-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-YOGA-01', N'Phiên Yoga Trị Liệu Cột Sống 1-1 (Therapeutic Spine Yoga)', N'Yoga & Movement', 60, 900000,
        N'Phòng Tập Yoga / Sala Hoa Sen', N'Chứng chỉ Yoga Alliance RYT 200/500', N'Thoát vị đĩa đệm cấp tính đang đau dữ dội', N'Huấn luyện viên kèm riêng các tư thế điều chỉnh độ cong sinh lý cột sống', 'ACTIVE'
    );
END
GO

IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Phiên Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)' OR treatment_code = 'SPA-YOGA-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_code = 'SPA-YOGA-02',
        treatment_name = N'Phiên Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)',
        category = N'Mindfulness',
        duration_minutes = 60,
        base_price = 850000,
        room_compatibility = N'Phòng Thiền Tĩnh Tâm / Khuôn viên Yên Tĩnh',
        therapist_qualification = N'Chứng chỉ Huấn luyện viên Thiền / Yoga',
        contraindications = N'Không có chống chỉ định nghiêm trọng',
        description = N'Rèn luyện dung tích phổi, giảm tiết hormone Cortisol gây stress mạn tính',
        treatment_status = 'ACTIVE'
    WHERE treatment_name = N'Phiên Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)' OR treatment_code = 'SPA-YOGA-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, base_price,
        room_compatibility, therapist_qualification, contraindications, description, treatment_status
    ) VALUES (
        'SPA-YOGA-02', N'Phiên Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)', N'Mindfulness', 60, 850000,
        N'Phòng Thiền Tĩnh Tâm / Khuôn viên Yên Tĩnh', N'Chứng chỉ Huấn luyện viên Thiền / Yoga', N'Không có chống chỉ định nghiêm trọng', N'Rèn luyện dung tích phổi, giảm tiết hormone Cortisol gây stress mạn tính', 'ACTIVE'
    );
END
GO

/* ============================================================================
   3. TREATMENT ROOMS (From Excel Specifications & Sheet 3)
   ============================================================================ */
PRINT '--- Seeding Treatment Rooms...';

MERGE INTO dbo.TreatmentRoom AS target
USING (VALUES
    (N'Phòng Sen Trắng (VIP Suite 101)', N'MASSAGE_VIP', 'AVAILABLE'),
    (N'Phòng Hoàng Lan (VIP Suite 102)', N'MASSAGE_VIP', 'AVAILABLE'),
    (N'Phòng Trúc Xanh (Standard Room 103)', N'MASSAGE_STANDARD', 'AVAILABLE'),
    (N'Phòng Quỳnh Hương (Standard Room 104)', N'MASSAGE_STANDARD', 'AVAILABLE'),
    (N'Phòng Mẫu Đơn VIP Bầu (Prenatal VIP 105)', N'PRENATAL_VIP', 'AVAILABLE'),
    (N'Phòng Thiền Chuông Tĩnh Tâm (Sound Pavilion 201)', N'SOUND_HEALING', 'AVAILABLE'),
    (N'Phòng Trị Liệu Ayurveda Soma (Ayurveda Chamber 202)', N'AYURVEDA', 'AVAILABLE'),
    (N'Phòng Chăm Sóc Da Ngọc Bích (Facial Room 203)', N'FACIAL', 'AVAILABLE'),
    (N'Phòng Thủy Lực Vichy Rain (Vichy Shower 301)', N'VICHY_SHOWER', 'AVAILABLE'),
    (N'Phòng Bồn Gỗ Pơ Mu & Jacuzzi (Herbal Bath 302)', N'HYDROTHERAPY', 'AVAILABLE'),
    (N'Sala Yoga & Thiền Hoa Sen (Yoga Sala 401)', N'YOGA_MEDITATION', 'AVAILABLE')
) AS source (room_name, room_type, room_status)
ON target.room_name = source.room_name
WHEN MATCHED THEN
    UPDATE SET target.room_type = source.room_type, target.room_status = source.room_status
WHEN NOT MATCHED THEN
    INSERT (room_name, room_type, room_status)
    VALUES (source.room_name, source.room_type, source.room_status);
GO

PRINT '>>> Spa Treatments, Retreat Packages & Treatment Rooms seeded successfully!';
GO
