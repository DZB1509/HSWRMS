/*
================================================================================
HSWRMS Seed Data V1.4 - Spa Treatments, Retreat Packages & Entitlements V3
Source: 02_Requirement/Screen_Inventory/HSWRMS_Goi_Spa_Tri_Lieu_Chuan_Hoa_v3.xlsx
Target Database: Microsoft SQL Server (HSWRMS)
================================================================================
*/

USE [HSWRMS];
GO

SET NOCOUNT ON;
GO

PRINT '>>> Beginning HSWRMS Spa & Retreat Packages V3 Seeding...';
GO

/* ============================================================================
   1. ROOM TYPE MASTER (Sheet 6 - Table A: 11 Room Types)
   ============================================================================ */
PRINT '--- Seeding Room Type Master...';

MERGE INTO dbo.RoomTypeMaster AS target
USING (VALUES
    ('MASSAGE_STANDARD', N'Phòng Massage Tiêu Chuẩn', N'Phòng trị liệu body đơn tiêu chuẩn, giường massage cố định hoặc nâng hạ, rèm ngăn.', 'DESIGN_APPROVED'),
    ('MASSAGE_VIP', N'Phòng Massage VIP', N'Phòng VIP riêng tư cao cấp, trang bị bồn ngâm chân, bàn trang điểm, sofa thư giãn.', 'DESIGN_APPROVED'),
    ('FACIAL_SPECIALIZED', N'Phòng Facial Chuyên Sâu', N'Phòng chăm sóc da mặt chuyên dụng, trang bị máy điện di, máy soi da, máy phun oxy.', 'DESIGN_APPROVED'),
    ('SOUND_SANCTUARY', N'Phòng Trị Liệu Âm Thanh', N'Phòng thiền âm thanh thiết kế cách âm đặc biệt (Acoustically Isolated), tiêu âm vách.', 'DESIGN_APPROVED'),
    ('AYURVEDA_ROOM', N'Phòng Trị Liệu Ayurveda', N'Phòng thiết kế theo chuẩn Ayurveda cổ truyền, bàn gỗ Droni, chậu treo đồng nhỏ dầu.', 'DESIGN_APPROVED'),
    ('WET_ROOM', N'Phòng Tắm Thủy Trị Liệu', N'Phòng ướt lát đá chống trượt, vòi sen đứng áp lực, rãnh thoát nước nhanh cho body scrub.', 'DESIGN_APPROVED'),
    ('BODY_WRAP_ROOM', N'Phòng Trị Liệu Quấn Cơ Thể', N'Phòng quấn nóng bùn khoáng thảo dược, giường trị liệu có màng giữ nhiệt chuyên biệt.', 'DESIGN_APPROVED'),
    ('VICHY_SHOWER_ROOM', N'Phòng Vichy Shower Chuyên Dụng', N'Phòng lắp hệ thống giàn phun Vichy Shower 7 vòi điều áp nóng lạnh tuần hoàn.', 'DESIGN_APPROVED'),
    ('JACUZZI_ROOM', N'Phòng Bồn Tắm Khoáng / Jacuzzi', N'Phòng tắm thủy lực riêng biệt, trang bị bồn gỗ Pơ-mu tự nhiên hoặc bể sục Jacuzzi.', 'DESIGN_APPROVED'),
    ('YOGA_STUDIO', N'Phòng Tập Yoga Trị Liệu', N'Sàn gỗ tự nhiên, trang bị gương khổ lớn, thảm tập định tuyến, dây kháng lực, bóng yoga.', 'DESIGN_APPROVED'),
    ('MEDITATION_ROOM', N'Phòng Thiền & Chánh Niệm', N'Không gian tĩnh lặng tuyệt đối, ánh sáng dịu nhẹ ấm áp, bồ đoàn đệm ngồi thiền cao cấp.', 'DESIGN_APPROVED')
) AS source (room_type, type_name, technical_specs, design_status)
ON target.room_type = source.room_type
WHEN MATCHED THEN
    UPDATE SET 
        target.type_name = source.type_name,
        target.technical_specs = source.technical_specs,
        target.design_status = source.design_status
WHEN NOT MATCHED THEN
    INSERT (room_type, type_name, technical_specs, design_status)
    VALUES (source.room_type, source.type_name, source.technical_specs, source.design_status);
GO

/* ============================================================================
   2. QUALIFICATION MASTER (Sheet 7 - Table A: 17 Qualifications)
   ============================================================================ */
PRINT '--- Seeding Qualification Master...';

MERGE INTO dbo.QualificationMaster AS target
USING (VALUES
    ('QUAL_HOT_STONE_MASSAGE', N'Chứng chỉ Body Therapy & Massage Đá Nóng', 'DESIGN_APPROVED'),
    ('QUAL_DEEP_TISSUE_TRIGGER_POINT', N'Chứng chỉ Trị liệu Cơ xương khớp & Điểm kích hoạt Trigger Point', 'DESIGN_APPROVED'),
    ('QUAL_MANUAL_LYMPHATIC_DRAINAGE', N'Chứng chỉ Kỹ thuật Dẫn lưu Bạch huyết (MLD Certified)', 'DESIGN_APPROVED'),
    ('QUAL_TRADITIONAL_ACUPRESSURE', N'Chứng chỉ Y học Cổ truyền / Xoa bóp bấm huyệt trị liệu', 'DESIGN_APPROVED'),
    ('QUAL_HERBAL_COMPRESS_THERAPY', N'Chứng chỉ Thảo mộc học & Trị liệu túi chườm thuốc cổ truyền', 'DESIGN_APPROVED'),
    ('QUAL_PRENATAL_MASSAGE', N'Chứng chỉ Chăm sóc & Massage Thai kỳ Quốc tế (Prenatal Certified)', 'DESIGN_APPROVED'),
    ('QUAL_TIBETAN_SOUND_HEALING', N'Chứng chỉ Master Chuông xoay Tây Tạng (Sound Healing Practitioner)', 'DESIGN_APPROVED'),
    ('QUAL_AYURVEDA_SHIRODHARA', N'Chứng chỉ Liệu trình Trị liệu Cổ truyền Ayurveda Practitioner', 'DESIGN_APPROVED'),
    ('QUAL_CHI_NEI_TSANG', N'Chứng chỉ Khí công & Massage Nội tạng Chi Nei Tsang Practitioner', 'DESIGN_APPROVED'),
    ('QUAL_FACIAL_GUASHA', N'Chứng chỉ Thẩm mỹ Da liễu & Kỹ thuật Nâng cơ Guasha Ngọc thạch', 'DESIGN_APPROVED'),
    ('QUAL_ADVANCED_SKINCARE', N'Chứng chỉ Chăm sóc Da Liễu Cơ bản & Nâng cao (Skincare Specialist)', 'DESIGN_APPROVED'),
    ('QUAL_ADVANCED_FACIAL_AESTHETICS', N'Chứng chỉ Trị liệu Tế bào & Thẩm mỹ Da mặt Chuyên sâu', 'DESIGN_APPROVED'),
    ('QUAL_BODY_SCRUB_POLISH', N'Chứng chỉ Chăm sóc & Thanh tẩy Tế bào chết Toàn thân (Body Scrub)', 'DESIGN_APPROVED'),
    ('QUAL_BODY_WRAP_THERMAL', N'Chứng chỉ Quấn nóng Bùn khoáng & Liệu pháp Nhiệt Thải độc', 'DESIGN_APPROVED'),
    ('QUAL_HYDROTHERAPY', N'Chứng chỉ Kỹ thuật viên Thủy Liệu Pháp Chuyên nghiệp (Hydrotherapist)', 'DESIGN_APPROVED'),
    ('QUAL_YOGA_THERAPY_RYT200_500', N'Bằng Huấn luyện viên Yoga Alliance RYT 200/500h (Yoga Trị liệu)', 'DESIGN_APPROVED'),
    ('QUAL_MINDFULNESS_COACH', N'Chứng chỉ Giảng viên Thiền & Khí công Chánh niệm (Mindfulness Coach)', 'DESIGN_APPROVED')
) AS source (qualification_code, qualification_name, baseline_status)
ON target.qualification_code = source.qualification_code
WHEN MATCHED THEN
    UPDATE SET 
        target.qualification_name = source.qualification_name,
        target.baseline_status = source.baseline_status
WHEN NOT MATCHED THEN
    INSERT (qualification_code, qualification_name, baseline_status)
    VALUES (source.qualification_code, source.qualification_name, source.baseline_status);
GO

/* ============================================================================
   3. SPA TREATMENTS (Sheet 2: 18 Treatments)
   ============================================================================ */
PRINT '--- Seeding 18 Standardized Spa Treatments...';


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-MASS-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)',
        category = N'Body Massage',
        duration_minutes = 90,
        duration_unit = N'Phút (Minutes)',
        base_price = 1650000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MASSAGE_STANDARD, MASSAGE_VIP (Cần HEATED_STONE_TRAY)',
        required_qualification_code = N'QUAL_HOT_STONE_MASSAGE',
        therapist_qualification = N'QUAL_HOT_STONE_MASSAGE',
        contraindications = N'Sốt cao, vết thương hở, bệnh ngoài da lây nhiễm, viêm tắc tĩnh mạch',
        precautions = N'Huyết áp cao (cần chỉnh nhiệt độ đá dưới 45°C), da mỏng nhạy cảm',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-MASS-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-MASS-01', N'Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)', N'Body Massage', 90, N'Phút (Minutes)',
        1650000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MASSAGE_STANDARD, MASSAGE_VIP (Cần HEATED_STONE_TRAY)', N'QUAL_HOT_STONE_MASSAGE',
        N'QUAL_HOT_STONE_MASSAGE', N'Sốt cao, vết thương hở, bệnh ngoài da lây nhiễm, viêm tắc tĩnh mạch', N'Huyết áp cao (cần chỉnh nhiệt độ đá dưới 45°C), da mỏng nhạy cảm', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-MASS-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Massage Cơ Sâu Bấm Huyệt (Deep Tissue Massage)',
        category = N'Body Massage',
        duration_minutes = 75,
        duration_unit = N'Phút (Minutes)',
        base_price = 1450000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MASSAGE_STANDARD, MASSAGE_VIP (Cần ADJUSTABLE_TREATMENT_BED)',
        required_qualification_code = N'QUAL_DEEP_TISSUE_TRIGGER_POINT',
        therapist_qualification = N'QUAL_DEEP_TISSUE_TRIGGER_POINT',
        contraindications = N'Phụ nữ mang thai, loãng xương nặng giai đoạn 3, chấn thương mới dưới 48h',
        precautions = N'Thoát vị đĩa đệm (tránh tác động lực ép vuông góc trực tiếp lên đốt sống L4-L5)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-MASS-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-MASS-02', N'Massage Cơ Sâu Bấm Huyệt (Deep Tissue Massage)', N'Body Massage', 75, N'Phút (Minutes)',
        1450000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MASSAGE_STANDARD, MASSAGE_VIP (Cần ADJUSTABLE_TREATMENT_BED)', N'QUAL_DEEP_TISSUE_TRIGGER_POINT',
        N'QUAL_DEEP_TISSUE_TRIGGER_POINT', N'Phụ nữ mang thai, loãng xương nặng giai đoạn 3, chấn thương mới dưới 48h', N'Thoát vị đĩa đệm (tránh tác động lực ép vuông góc trực tiếp lên đốt sống L4-L5)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-MASS-03')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Trị Liệu Dẫn Lưu Bạch Huyết (Lymphatic Drainage)',
        category = N'Detox Therapy',
        duration_minutes = 75,
        duration_unit = N'Phút (Minutes)',
        base_price = 1550000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MASSAGE_STANDARD, MASSAGE_VIP',
        required_qualification_code = N'QUAL_MANUAL_LYMPHATIC_DRAINAGE',
        therapist_qualification = N'QUAL_MANUAL_LYMPHATIC_DRAINAGE',
        contraindications = N'Suy tim sung huyết cấp, huyết khối tĩnh mạch sâu (DVT), ung thư đang hóa trị',
        precautions = N'Hạ huyết áp tư thế, viêm hạch lành tính (cần dùng lực siêu nhẹ < 4kPa)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-MASS-03';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-MASS-03', N'Trị Liệu Dẫn Lưu Bạch Huyết (Lymphatic Drainage)', N'Detox Therapy', 75, N'Phút (Minutes)',
        1550000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MASSAGE_STANDARD, MASSAGE_VIP', N'QUAL_MANUAL_LYMPHATIC_DRAINAGE',
        N'QUAL_MANUAL_LYMPHATIC_DRAINAGE', N'Suy tim sung huyết cấp, huyết khối tĩnh mạch sâu (DVT), ung thư đang hóa trị', N'Hạ huyết áp tư thế, viêm hạch lành tính (cần dùng lực siêu nhẹ < 4kPa)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-MASS-04')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Bấm Huyệt Y Học Cổ Truyền (Vietnamese Acupressure)',
        category = N'Traditional Therapy',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 1150000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MASSAGE_STANDARD, MASSAGE_VIP',
        required_qualification_code = N'QUAL_TRADITIONAL_ACUPRESSURE',
        therapist_qualification = N'QUAL_TRADITIONAL_ACUPRESSURE',
        contraindications = N'Gãy xương chưa liền sẹo, vùng da viêm loét hoại tử, xuất huyết dưới da',
        precautions = N'Phụ nữ có thai (tuyệt đối không bấm huyệt Hợp Cốc, Tam Âm Giao, Kiên Tỉnh)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-MASS-04';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-MASS-04', N'Bấm Huyệt Y Học Cổ Truyền (Vietnamese Acupressure)', N'Traditional Therapy', 60, N'Phút (Minutes)',
        1150000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MASSAGE_STANDARD, MASSAGE_VIP', N'QUAL_TRADITIONAL_ACUPRESSURE',
        N'QUAL_TRADITIONAL_ACUPRESSURE', N'Gãy xương chưa liền sẹo, vùng da viêm loét hoại tử, xuất huyết dưới da', N'Phụ nữ có thai (tuyệt đối không bấm huyệt Hợp Cốc, Tam Âm Giao, Kiên Tỉnh)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-MASS-05')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)',
        category = N'Herbal Therapy',
        duration_minutes = 75,
        duration_unit = N'Phút (Minutes)',
        base_price = 1350000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MASSAGE_STANDARD, MASSAGE_VIP (Cần HERBAL_COMPRESS_STEAMER)',
        required_qualification_code = N'QUAL_HERBAL_COMPRESS_THERAPY',
        therapist_qualification = N'QUAL_HERBAL_COMPRESS_THERAPY',
        contraindications = N'Dị ứng cấp tính với tinh dầu gừng, quế, ngải cứu; mất cảm giác nhiệt độ ngoài da',
        precautions = N'Da mỏng sau điều trị laser, người tiểu đường mất cảm giác ngoại biên',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-MASS-05';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-MASS-05', N'Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)', N'Herbal Therapy', 75, N'Phút (Minutes)',
        1350000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MASSAGE_STANDARD, MASSAGE_VIP (Cần HERBAL_COMPRESS_STEAMER)', N'QUAL_HERBAL_COMPRESS_THERAPY',
        N'QUAL_HERBAL_COMPRESS_THERAPY', N'Dị ứng cấp tính với tinh dầu gừng, quế, ngải cứu; mất cảm giác nhiệt độ ngoài da', N'Da mỏng sau điều trị laser, người tiểu đường mất cảm giác ngoại biên', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-MASS-06')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)',
        category = N'Maternal Care',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 1250000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MASSAGE_VIP (Cần PRENATAL_U_PILLOW)',
        required_qualification_code = N'QUAL_PRENATAL_MASSAGE',
        therapist_qualification = N'QUAL_PRENATAL_MASSAGE',
        contraindications = N'Mang thai tam cá nguyệt đầu (dưới 12 tuần), dọa sảy thai, tiền sản giật',
        precautions = N'[PENDING_MEDICAL_REVIEW]: Phù chân nhiều (chỉ xoa vuốt nhẹ hướng tâm, không ấn huyệt mắt cá chân). Cần BS Sản khoa/Chuyên môn y tế xác minh phạm vi thao tác.',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-MASS-06';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-MASS-06', N'Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)', N'Maternal Care', 60, N'Phút (Minutes)',
        1250000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MASSAGE_VIP (Cần PRENATAL_U_PILLOW)', N'QUAL_PRENATAL_MASSAGE',
        N'QUAL_PRENATAL_MASSAGE', N'Mang thai tam cá nguyệt đầu (dưới 12 tuần), dọa sảy thai, tiền sản giật', N'[PENDING_MEDICAL_REVIEW]: Phù chân nhiều (chỉ xoa vuốt nhẹ hướng tâm, không ấn huyệt mắt cá chân). Cần BS Sản khoa/Chuyên môn y tế xác minh phạm vi thao tác.', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-HEAL-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Sound Bath)',
        category = N'Energy Healing',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 1200000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'SOUND_SANCTUARY (Cần ACOUSTICALLY_ISOLATED)',
        required_qualification_code = N'QUAL_TIBETAN_SOUND_HEALING',
        therapist_qualification = N'QUAL_TIBETAN_SOUND_HEALING',
        contraindications = N'Người gắn máy tạo nhịp tim (Pacemaker), người có tiền sử động kinh do rung động',
        precautions = N'Có cấy ghép kim loại lớn trong cơ thể (không đặt chuông gõ trực tiếp lên vị trí đó)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-HEAL-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-HEAL-01', N'Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Sound Bath)', N'Energy Healing', 60, N'Phút (Minutes)',
        1200000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'SOUND_SANCTUARY (Cần ACOUSTICALLY_ISOLATED)', N'QUAL_TIBETAN_SOUND_HEALING',
        N'QUAL_TIBETAN_SOUND_HEALING', N'Người gắn máy tạo nhịp tim (Pacemaker), người có tiền sử động kinh do rung động', N'Có cấy ghép kim loại lớn trong cơ thể (không đặt chuông gõ trực tiếp lên vị trí đó)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-HEAL-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Nhỏ Dầu Ấm Luân Xa Trán (Ayurvedic Shirodhara)',
        category = N'Ayurveda Therapy',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 1750000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'AYURVEDA_ROOM (Cần DRONI_TABLE, HANGING_BOWL)',
        required_qualification_code = N'QUAL_AYURVEDA_SHIRODHARA',
        therapist_qualification = N'QUAL_AYURVEDA_SHIRODHARA',
        contraindications = N'Chấn thương sọ não chưa phục hồi, viêm tai giữa chảy mủ, cảm lạnh sốt cao',
        precautions = N'Huyết áp quá thấp, chứng sợ không gian kín khi nhắm mắt (Claustrophobia)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-HEAL-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-HEAL-02', N'Nhỏ Dầu Ấm Luân Xa Trán (Ayurvedic Shirodhara)', N'Ayurveda Therapy', 60, N'Phút (Minutes)',
        1750000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'AYURVEDA_ROOM (Cần DRONI_TABLE, HANGING_BOWL)', N'QUAL_AYURVEDA_SHIRODHARA',
        N'QUAL_AYURVEDA_SHIRODHARA', N'Chấn thương sọ não chưa phục hồi, viêm tai giữa chảy mủ, cảm lạnh sốt cao', N'Huyết áp quá thấp, chứng sợ không gian kín khi nhắm mắt (Claustrophobia)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-HEAL-03')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Bấm Huyệt Thải Độc Bụng (Chi Nei Tsang Abdominal)',
        category = N'Holistic Detox',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 1300000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MASSAGE_STANDARD, MASSAGE_VIP',
        required_qualification_code = N'QUAL_CHI_NEI_TSANG',
        therapist_qualification = N'QUAL_CHI_NEI_TSANG',
        contraindications = N'Vừa phẫu thuật ổ bụng dưới 6 tháng, phình động mạch chủ bụng, đang mang thai',
        precautions = N'Vừa ăn no dưới 2 tiếng (phải đợi tiêu hóa hết), đang đặt vòng tránh thai mới',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-HEAL-03';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-HEAL-03', N'Bấm Huyệt Thải Độc Bụng (Chi Nei Tsang Abdominal)', N'Holistic Detox', 60, N'Phút (Minutes)',
        1300000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MASSAGE_STANDARD, MASSAGE_VIP', N'QUAL_CHI_NEI_TSANG',
        N'QUAL_CHI_NEI_TSANG', N'Vừa phẫu thuật ổ bụng dưới 6 tháng, phình động mạch chủ bụng, đang mang thai', N'Vừa ăn no dưới 2 tiếng (phải đợi tiêu hóa hết), đang đặt vòng tránh thai mới', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-FACE-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Nâng Cơ Mặt Guasha Ngọc Thạch (Jade Guasha Facelift)',
        category = N'Facial Care',
        duration_minutes = 75,
        duration_unit = N'Phút (Minutes)',
        base_price = 1400000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'FACIAL_SPECIALIZED',
        required_qualification_code = N'QUAL_FACIAL_GUASHA',
        therapist_qualification = N'QUAL_FACIAL_GUASHA',
        contraindications = N'Mụn bọc viêm mủ diện rộng, da trầy xước lở loét, vừa phẫu thuật thẩm mỹ mặt',
        precautions = N'Vừa tiêm Botox/Filler dưới 14 ngày (tránh tác động lực gây dịch chuyển thuốc)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-FACE-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-FACE-01', N'Nâng Cơ Mặt Guasha Ngọc Thạch (Jade Guasha Facelift)', N'Facial Care', 75, N'Phút (Minutes)',
        1400000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'FACIAL_SPECIALIZED', N'QUAL_FACIAL_GUASHA',
        N'QUAL_FACIAL_GUASHA', N'Mụn bọc viêm mủ diện rộng, da trầy xước lở loét, vừa phẫu thuật thẩm mỹ mặt', N'Vừa tiêm Botox/Filler dưới 14 ngày (tránh tác động lực gây dịch chuyển thuốc)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-FACE-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Cấp Ẩm Phục Hồi Tế Bào Da (Deep Hydration & Cellular Repair)',
        category = N'Facial Care',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 1250000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'FACIAL_SPECIALIZED (Cần ELECTROPHORESIS_DEVICE)',
        required_qualification_code = N'QUAL_ADVANCED_SKINCARE',
        therapist_qualification = N'QUAL_ADVANCED_SKINCARE',
        contraindications = N'Nhiễm trùng Herpes môi đang bùng phát, dị ứng với mọi loại mỹ phẩm',
        precautions = N'Tiền sử dị ứng với chiết xuất thực vật (cần kiểm tra trước tại vùng da cổ tay)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-FACE-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-FACE-02', N'Cấp Ẩm Phục Hồi Tế Bào Da (Deep Hydration & Cellular Repair)', N'Facial Care', 60, N'Phút (Minutes)',
        1250000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'FACIAL_SPECIALIZED (Cần ELECTROPHORESIS_DEVICE)', N'QUAL_ADVANCED_SKINCARE',
        N'QUAL_ADVANCED_SKINCARE', N'Nhiễm trùng Herpes môi đang bùng phát, dị ứng với mọi loại mỹ phẩm', N'Tiền sử dị ứng với chiết xuất thực vật (cần kiểm tra trước tại vùng da cổ tay)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-FACE-03')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Trẻ Hóa Tế Bào Tảo Biển Hữu Cơ (Organic Marine Collagen)',
        category = N'Anti-Aging Facial',
        duration_minutes = 75,
        duration_unit = N'Phút (Minutes)',
        base_price = 1600000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'FACIAL_SPECIALIZED (Cần OXYGEN_SPRAY_MACHINE)',
        required_qualification_code = N'QUAL_ADVANCED_FACIAL_AESTHETICS',
        therapist_qualification = N'QUAL_ADVANCED_FACIAL_AESTHETICS',
        contraindications = N'Dị ứng nặng với hải sản, i-ốt hoặc tảo biển đỏ/nâu',
        precautions = N'Làn da nhạy cảm mỏng manh (giảm nồng độ AHA/Enzyme tẩy tế bào chết ban đầu)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-FACE-03';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-FACE-03', N'Trẻ Hóa Tế Bào Tảo Biển Hữu Cơ (Organic Marine Collagen)', N'Anti-Aging Facial', 75, N'Phút (Minutes)',
        1600000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'FACIAL_SPECIALIZED (Cần OXYGEN_SPRAY_MACHINE)', N'QUAL_ADVANCED_FACIAL_AESTHETICS',
        N'QUAL_ADVANCED_FACIAL_AESTHETICS', N'Dị ứng nặng với hải sản, i-ốt hoặc tảo biển đỏ/nâu', N'Làn da nhạy cảm mỏng manh (giảm nồng độ AHA/Enzyme tẩy tế bào chết ban đầu)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-BODY-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Tẩy Tế Bào Chết Cà Phê & Dừa (Dak Lak Coffee & Coconut Polish)',
        category = N'Body Scrub',
        duration_minutes = 45,
        duration_unit = N'Phút (Minutes)',
        base_price = 850000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'WET_ROOM (Cần STANDING_SHOWER)',
        required_qualification_code = N'QUAL_BODY_SCRUB_POLISH',
        therapist_qualification = N'QUAL_BODY_SCRUB_POLISH',
        contraindications = N'Da đang cháy nắng rát đỏ, vết thương chưa cắt chỉ, chàm vảy nến bùng phát',
        precautions = N'Vừa waxing lông toàn thân dưới 24h (tránh kích ứng rát da)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-BODY-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-BODY-01', N'Tẩy Tế Bào Chết Cà Phê & Dừa (Dak Lak Coffee & Coconut Polish)', N'Body Scrub', 45, N'Phút (Minutes)',
        850000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'WET_ROOM (Cần STANDING_SHOWER)', N'QUAL_BODY_SCRUB_POLISH',
        N'QUAL_BODY_SCRUB_POLISH', N'Da đang cháy nắng rát đỏ, vết thương chưa cắt chỉ, chàm vảy nến bùng phát', N'Vừa waxing lông toàn thân dưới 24h (tránh kích ứng rát da)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-BODY-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)',
        category = N'Body Wrap',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 1100000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'BODY_WRAP_ROOM (Cần HEATED_WRAP_BED)',
        required_qualification_code = N'QUAL_BODY_WRAP_THERMAL',
        therapist_qualification = N'QUAL_BODY_WRAP_THERMAL',
        contraindications = N'Suy giãn tĩnh mạch chi dưới mức độ 3, bệnh tim nặng, sốt cao',
        precautions = N'Chứng sợ bị quấn chặt kín (Claustrophobia) - cần nới lỏng vùng ngực',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-BODY-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-BODY-02', N'Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)', N'Body Wrap', 60, N'Phút (Minutes)',
        1100000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'BODY_WRAP_ROOM (Cần HEATED_WRAP_BED)', N'QUAL_BODY_WRAP_THERMAL',
        N'QUAL_BODY_WRAP_THERMAL', N'Suy giãn tĩnh mạch chi dưới mức độ 3, bệnh tim nặng, sốt cao', N'Chứng sợ bị quấn chặt kín (Claustrophobia) - cần nới lỏng vùng ngực', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-HYDRO-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Thủy Trị Liệu Vòi Phun Vichy Shower (Vichy Rain Therapy)',
        category = N'Hydrotherapy',
        duration_minutes = 45,
        duration_unit = N'Phút (Minutes)',
        base_price = 950000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'VICHY_SHOWER_ROOM (Cần VICHY_7_NOZZLE_SYSTEM)',
        required_qualification_code = N'QUAL_HYDROTHERAPY',
        therapist_qualification = N'QUAL_HYDROTHERAPY',
        contraindications = N'Viêm tai giữa chưa lành màng nhĩ, bệnh ngoài da truyền nhiễm, say rượu',
        precautions = N'Huyết áp dao động thất thường (cần duy trì nhiệt độ nước ấm ổn định 37°C)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-HYDRO-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-HYDRO-01', N'Thủy Trị Liệu Vòi Phun Vichy Shower (Vichy Rain Therapy)', N'Hydrotherapy', 45, N'Phút (Minutes)',
        950000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'VICHY_SHOWER_ROOM (Cần VICHY_7_NOZZLE_SYSTEM)', N'QUAL_HYDROTHERAPY',
        N'QUAL_HYDROTHERAPY', N'Viêm tai giữa chưa lành màng nhĩ, bệnh ngoài da truyền nhiễm, say rượu', N'Huyết áp dao động thất thường (cần duy trì nhiệt độ nước ấm ổn định 37°C)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-HYDRO-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)',
        category = N'Hydrotherapy',
        duration_minutes = 45,
        duration_unit = N'Phút (Minutes)',
        base_price = 800000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'JACUZZI_ROOM (Cần PRIVATE_JACUZZI)',
        required_qualification_code = N'QUAL_HYDROTHERAPY',
        therapist_qualification = N'QUAL_HYDROTHERAPY',
        contraindications = N'Phụ nữ đang trong chu kỳ kinh nguyệt, vết thương nhiễm trùng hở',
        precautions = N'Huyết áp thấp (giới hạn thời gian ngâm bồn không quá 20 phút liên tục)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-HYDRO-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-HYDRO-02', N'Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)', N'Hydrotherapy', 45, N'Phút (Minutes)',
        800000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'JACUZZI_ROOM (Cần PRIVATE_JACUZZI)', N'QUAL_HYDROTHERAPY',
        N'QUAL_HYDROTHERAPY', N'Phụ nữ đang trong chu kỳ kinh nguyệt, vết thương nhiễm trùng hở', N'Huyết áp thấp (giới hạn thời gian ngâm bồn không quá 20 phút liên tục)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-YOGA-01')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Yoga Trị Liệu Chỉnh Trục Cột Sống 1-1 (Therapeutic Spine Yoga)',
        category = N'Yoga & Movement',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 900000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'YOGA_STUDIO',
        required_qualification_code = N'QUAL_YOGA_THERAPY_RYT200_500',
        therapist_qualification = N'QUAL_YOGA_THERAPY_RYT200_500',
        contraindications = N'Thoát vị đĩa đệm thể cấp tính đang chèn ép tủy đau liệt, gãy xương chưa liền',
        precautions = N'Huyết áp cao không kiểm soát (tránh tư thế dốc ngược đầu Downward Dog quá lâu)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-YOGA-01';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-YOGA-01', N'Yoga Trị Liệu Chỉnh Trục Cột Sống 1-1 (Therapeutic Spine Yoga)', N'Yoga & Movement', 60, N'Phút (Minutes)',
        900000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'YOGA_STUDIO', N'QUAL_YOGA_THERAPY_RYT200_500',
        N'QUAL_YOGA_THERAPY_RYT200_500', N'Thoát vị đĩa đệm thể cấp tính đang chèn ép tủy đau liệt, gãy xương chưa liền', N'Huyết áp cao không kiểm soát (tránh tư thế dốc ngược đầu Downward Dog quá lâu)', 'ACTIVE'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_code = 'SPA-YOGA-02')
BEGIN
    UPDATE dbo.SpaTreatment
    SET treatment_name = N'Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)',
        category = N'Mindfulness',
        duration_minutes = 60,
        duration_unit = N'Phút (Minutes)',
        base_price = 850000,
        pricing_rule = N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).',
        room_compatibility = N'MEDITATION_ROOM (Cần QUIET_MEDITATION_SPACE)',
        required_qualification_code = N'QUAL_MINDFULNESS_COACH',
        therapist_qualification = N'QUAL_MINDFULNESS_COACH',
        contraindications = N'Không có chống chỉ định tuyệt đối',
        precautions = N'Khách có tiền sử hen suyễn cấp (tránh kỹ thuật thở mạnh Kapalabhati kéo dài)',
        treatment_status = 'ACTIVE'
    WHERE treatment_code = 'SPA-YOGA-02';
END
ELSE
BEGIN
    INSERT INTO dbo.SpaTreatment (
        treatment_code, treatment_name, category, duration_minutes, duration_unit,
        base_price, pricing_rule, room_compatibility, required_qualification_code,
        therapist_qualification, contraindications, precautions, treatment_status
    ) VALUES (
        'SPA-YOGA-02', N'Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)', N'Mindfulness', 60, N'Phút (Minutes)',
        850000, N'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).', N'MEDITATION_ROOM (Cần QUIET_MEDITATION_SPACE)', N'QUAL_MINDFULNESS_COACH',
        N'QUAL_MINDFULNESS_COACH', N'Không có chống chỉ định tuyệt đối', N'Khách có tiền sử hen suyễn cấp (tránh kỹ thuật thở mạnh Kapalabhati kéo dài)', 'ACTIVE'
    );
END
GO


/* ============================================================================
   4. RETREAT PACKAGES (Sheet 1: 8 Packages)
   ============================================================================ */
PRINT '--- Seeding 8 Standardized Retreat Packages...';


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-DETOX-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)',
        wellness_goal = N'Detox & Cleansing',
        duration_nights = 2,
        duration_unit = N'Đêm (Nights)',
        base_price = 12500000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết (01 buổi - 75p)
• SPA-BODY-01: Tẩy tế bào chết cà phê & dừa (01 buổi - 45p)
• SPA-HYDRO-02: Ngâm bồn thảo dược Dao Đỏ (01 buổi - 45p)
• SPA-YOGA-02: Hít thở năng lượng & Thiền định (02 buổi - 60p)
[Tổng cộng: 05 buổi]',
        dietary_plan = N'Chế độ Detox thanh lọc chuyên sâu:
- 02 bữa sáng thanh lọc (Nước ép cần tây hữu cơ, hạt chia & yến mạch)
- 02 bữa trưa & 02 bữa tối thực dưỡng (Plant-based, 0% đường tinh luyện)
- Trà thảo mộc thải độc phục vụ cả ngày tại Villa',
        extra_charge_policy = N'ĐÃ BAO GỒM toàn bộ các buổi trị liệu và F&B nêu trên. Khách đặt thêm dịch vụ ngoài danh mục hoặc ngoài số buổi quy định sẽ tính là Extra Spa (M3) / Extra F&B (M4) và ghi nợ Folio (M5) qua hợp đồng tích hợp.'
    WHERE package_code = 'RET-DETOX-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-DETOX-03', N'3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)', N'Detox & Cleansing', 2, N'Đêm (Nights)',
        12500000, N'VND/khách/gói', 'ACTIVE', N'• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết (01 buổi - 75p)
• SPA-BODY-01: Tẩy tế bào chết cà phê & dừa (01 buổi - 45p)
• SPA-HYDRO-02: Ngâm bồn thảo dược Dao Đỏ (01 buổi - 45p)
• SPA-YOGA-02: Hít thở năng lượng & Thiền định (02 buổi - 60p)
[Tổng cộng: 05 buổi]', N'Chế độ Detox thanh lọc chuyên sâu:
- 02 bữa sáng thanh lọc (Nước ép cần tây hữu cơ, hạt chia & yến mạch)
- 02 bữa trưa & 02 bữa tối thực dưỡng (Plant-based, 0% đường tinh luyện)
- Trà thảo mộc thải độc phục vụ cả ngày tại Villa',
        N'ĐÃ BAO GỒM toàn bộ các buổi trị liệu và F&B nêu trên. Khách đặt thêm dịch vụ ngoài danh mục hoặc ngoài số buổi quy định sẽ tính là Extra Spa (M3) / Extra F&B (M4) và ghi nợ Folio (M5) qua hợp đồng tích hợp.'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-DETOX-05')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'5D4N Tái Tạo Năng Lượng & Thải Độc Sâu (Deep Reset Detox)',
        wellness_goal = N'Deep Detoxification',
        duration_nights = 4,
        duration_unit = N'Đêm (Nights)',
        base_price = 24800000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết (02 buổi - 75p)
• SPA-HEAL-03: Bấm huyệt thải độc bụng Chi Nei Tsang (01 buổi - 60p)
• SPA-BODY-02: Ủ khoáng nóng bùn tự nhiên (01 buổi - 60p)
• SPA-HYDRO-01: Thủy trị liệu Vichy Shower (02 buổi - 45p)
• SPA-YOGA-02: Hít thở Pranayama & Thiền định (04 buổi - 60p)
[Tổng cộng: 10 buổi]',
        dietary_plan = N'Chế độ Intermittent Fasting & Clean Eating:
- 04 bữa sáng sinh tố thải độc & trái cây chỉ số GI thấp
- 04 bữa trưa dinh dưỡng cao & 04 bữa tối soup thanh nhiệt nhẹ bụng
- Nước ion kiềm & nước khoáng giàu Magie bổ sung hàng ngày
[Tổng cộng: 12 bữa ăn]',
        extra_charge_policy = N'ĐÃ BAO GỒM đúng 10 buổi trị liệu và 12 bữa ăn theo thực đơn M4. Bất kỳ dịch vụ spa thứ 11 trở đi hoặc món gọi thêm ngoài định mức đều tính phí phụ thu vào Folio.'
    WHERE package_code = 'RET-DETOX-05';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-DETOX-05', N'5D4N Tái Tạo Năng Lượng & Thải Độc Sâu (Deep Reset Detox)', N'Deep Detoxification', 4, N'Đêm (Nights)',
        24800000, N'VND/khách/gói', 'ACTIVE', N'• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết (02 buổi - 75p)
• SPA-HEAL-03: Bấm huyệt thải độc bụng Chi Nei Tsang (01 buổi - 60p)
• SPA-BODY-02: Ủ khoáng nóng bùn tự nhiên (01 buổi - 60p)
• SPA-HYDRO-01: Thủy trị liệu Vichy Shower (02 buổi - 45p)
• SPA-YOGA-02: Hít thở Pranayama & Thiền định (04 buổi - 60p)
[Tổng cộng: 10 buổi]', N'Chế độ Intermittent Fasting & Clean Eating:
- 04 bữa sáng sinh tố thải độc & trái cây chỉ số GI thấp
- 04 bữa trưa dinh dưỡng cao & 04 bữa tối soup thanh nhiệt nhẹ bụng
- Nước ion kiềm & nước khoáng giàu Magie bổ sung hàng ngày
[Tổng cộng: 12 bữa ăn]',
        N'ĐÃ BAO GỒM đúng 10 buổi trị liệu và 12 bữa ăn theo thực đơn M4. Bất kỳ dịch vụ spa thứ 11 trở đi hoặc món gọi thêm ngoài định mức đều tính phí phụ thu vào Folio.'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-SLEEP-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)',
        wellness_goal = N'Sleep Improvement',
        duration_nights = 2,
        duration_unit = N'Đêm (Nights)',
        base_price = 11800000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-HEAL-01: Liệu pháp chuông xoay Tây Tạng (01 buổi - 60p)
• SPA-HEAL-02: Nhỏ dầu ấm trán Shirodhara (01 buổi - 60p)
• SPA-MASS-05: Trị liệu thảo dược cổ truyền (01 buổi - 75p)
• SPA-YOGA-02: Thiền buông thư Yoga Nidra (02 buổi - 60p)
[Tổng cộng: 05 buổi]',
        dietary_plan = N'Chế độ kích hoạt Melatonin tự nhiên:
- 02 bữa sáng giàu Tryptophan (Trứng organic luộc lòng đào, hạt óc chó, quả bơ)
- 02 bữa trưa dinh dưỡng cân bằng Thân - Tâm
- 02 bữa tối thanh đạm trước 19:00 kèm sữa hạt sen hạnh nhân ấm trước giờ ngủ',
        extra_charge_policy = N'ĐÃ BAO GỒM 05 liệu trình chăm sóc giấc ngủ và khẩu phần F&B. Trị liệu Massage thêm vào khung giờ khuya nếu có sẽ tính theo biểu giá dịch vụ đơn lẻ tại Sheet 2.'
    WHERE package_code = 'RET-SLEEP-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-SLEEP-03', N'3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)', N'Sleep Improvement', 2, N'Đêm (Nights)',
        11800000, N'VND/khách/gói', 'ACTIVE', N'• SPA-HEAL-01: Liệu pháp chuông xoay Tây Tạng (01 buổi - 60p)
• SPA-HEAL-02: Nhỏ dầu ấm trán Shirodhara (01 buổi - 60p)
• SPA-MASS-05: Trị liệu thảo dược cổ truyền (01 buổi - 75p)
• SPA-YOGA-02: Thiền buông thư Yoga Nidra (02 buổi - 60p)
[Tổng cộng: 05 buổi]', N'Chế độ kích hoạt Melatonin tự nhiên:
- 02 bữa sáng giàu Tryptophan (Trứng organic luộc lòng đào, hạt óc chó, quả bơ)
- 02 bữa trưa dinh dưỡng cân bằng Thân - Tâm
- 02 bữa tối thanh đạm trước 19:00 kèm sữa hạt sen hạnh nhân ấm trước giờ ngủ',
        N'ĐÃ BAO GỒM 05 liệu trình chăm sóc giấc ngủ và khẩu phần F&B. Trị liệu Massage thêm vào khung giờ khuya nếu có sẽ tính theo biểu giá dịch vụ đơn lẻ tại Sheet 2.'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-STRESS-04')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)',
        wellness_goal = N'Stress Reduction',
        duration_nights = 3,
        duration_unit = N'Đêm (Nights)',
        base_price = 17500000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-MASS-01: Massage đá nóng núi lửa Himalaya (01 buổi - 90p)
• SPA-HEAL-01: Liệu pháp chuông xoay Tây Tạng (01 buổi - 60p)
• SPA-FACE-02: Cấp ẩm phục hồi tế bào da (01 buổi - 60p)
• SPA-HYDRO-02: Ngâm bồn thảo dược Dao Đỏ (01 buổi - 45p)
• SPA-YOGA-02: Thiền định hít thở chánh niệm (03 buổi - 60p)
[Tổng cộng: 07 buổi]',
        dietary_plan = N'Thực đơn an thần & cân bằng năng lượng:
- 03 bữa sáng tự chọn theo danh mục món ăn năng lượng tích cực
- 03 bữa trưa thực dưỡng bồi bổ khí huyết
- 03 bữa tối 3 món lành mạnh (Set Menu Mind-Body do Bếp trưởng thiết kế)',
        extra_charge_policy = N'ĐÃ BAO GỒM 07 buổi Spa và ẩm thực theo chương trình. Khách có thể đổi liệu trình tương đương thời lượng nếu báo trước 12h, nếu nâng cấp lên gói dài hơn sẽ phụ thu chênh lệch.'
    WHERE package_code = 'RET-STRESS-04';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-STRESS-04', N'4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)', N'Stress Reduction', 3, N'Đêm (Nights)',
        17500000, N'VND/khách/gói', 'ACTIVE', N'• SPA-MASS-01: Massage đá nóng núi lửa Himalaya (01 buổi - 90p)
• SPA-HEAL-01: Liệu pháp chuông xoay Tây Tạng (01 buổi - 60p)
• SPA-FACE-02: Cấp ẩm phục hồi tế bào da (01 buổi - 60p)
• SPA-HYDRO-02: Ngâm bồn thảo dược Dao Đỏ (01 buổi - 45p)
• SPA-YOGA-02: Thiền định hít thở chánh niệm (03 buổi - 60p)
[Tổng cộng: 07 buổi]', N'Thực đơn an thần & cân bằng năng lượng:
- 03 bữa sáng tự chọn theo danh mục món ăn năng lượng tích cực
- 03 bữa trưa thực dưỡng bồi bổ khí huyết
- 03 bữa tối 3 món lành mạnh (Set Menu Mind-Body do Bếp trưởng thiết kế)',
        N'ĐÃ BAO GỒM 07 buổi Spa và ẩm thực theo chương trình. Khách có thể đổi liệu trình tương đương thời lượng nếu báo trước 12h, nếu nâng cấp lên gói dài hơn sẽ phụ thu chênh lệch.'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-AGING-04')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)',
        wellness_goal = N'Anti-Aging & Cellular Care',
        duration_nights = 3,
        duration_unit = N'Đêm (Nights)',
        base_price = 22000000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-FACE-01: Nâng cơ mặt Guasha ngọc thạch (01 buổi - 75p)
• SPA-FACE-03: Trẻ hóa tế bào tảo biển hữu cơ (01 buổi - 75p)
• SPA-MASS-01: Massage đá nóng thư giãn sâu (01 buổi - 90p)
• SPA-BODY-02: Ủ khoáng nóng thảo dược núi cao (01 buổi - 60p)
• SPA-YOGA-01: Yoga chỉnh trục & lưu thông khí huyết (02 buổi - 60p)
[Tổng cộng: 06 buổi]',
        dietary_plan = N'Chế độ giàu chất chống oxy hóa (Antioxidant-Rich Diet):
- 03 bữa sáng sinh tố quả mọng (Berries), sữa chua Hy Lạp hữu cơ
- 03 bữa trưa cá hồi Nauy áp chảo rau củ hữu cơ & dầu ô-liu nguyên chất
- 03 bữa tối giàu Collagen sinh học tự nhiên & nước hầm bổ dưỡng',
        extra_charge_policy = N'ĐÃ BAO GỒM 06 liệu trình làm đẹp, trẻ hóa cao cấp và trọn gói F&B. Các dịch vụ thẩm mỹ hoặc chăm sóc móng/tóc phát sinh khác sẽ tính riêng vào Folio.'
    WHERE package_code = 'RET-AGING-04';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-AGING-04', N'4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)', N'Anti-Aging & Cellular Care', 3, N'Đêm (Nights)',
        22000000, N'VND/khách/gói', 'ACTIVE', N'• SPA-FACE-01: Nâng cơ mặt Guasha ngọc thạch (01 buổi - 75p)
• SPA-FACE-03: Trẻ hóa tế bào tảo biển hữu cơ (01 buổi - 75p)
• SPA-MASS-01: Massage đá nóng thư giãn sâu (01 buổi - 90p)
• SPA-BODY-02: Ủ khoáng nóng thảo dược núi cao (01 buổi - 60p)
• SPA-YOGA-01: Yoga chỉnh trục & lưu thông khí huyết (02 buổi - 60p)
[Tổng cộng: 06 buổi]', N'Chế độ giàu chất chống oxy hóa (Antioxidant-Rich Diet):
- 03 bữa sáng sinh tố quả mọng (Berries), sữa chua Hy Lạp hữu cơ
- 03 bữa trưa cá hồi Nauy áp chảo rau củ hữu cơ & dầu ô-liu nguyên chất
- 03 bữa tối giàu Collagen sinh học tự nhiên & nước hầm bổ dưỡng',
        N'ĐÃ BAO GỒM 06 liệu trình làm đẹp, trẻ hóa cao cấp và trọn gói F&B. Các dịch vụ thẩm mỹ hoặc chăm sóc móng/tóc phát sinh khác sẽ tính riêng vào Folio.'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-ALIGN-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'3D2N Nắn Chỉnh Cột Sống & Cổ Vai Gáy (Spine & Posture Care)',
        wellness_goal = N'Physical Alignment',
        duration_nights = 2,
        duration_unit = N'Đêm (Nights)',
        base_price = 13200000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-MASS-02: Trị liệu cơ sâu bấm huyệt Deep Tissue (01 buổi - 75p)
• SPA-MASS-04: Bấm huyệt y học cổ truyền Việt Nam (01 buổi - 60p)
• SPA-MASS-05: Trị liệu chườm thảo dược ấm (01 buổi - 75p)
• SPA-YOGA-01: Yoga phục hồi chỉnh vẹo cột sống 1-kèm-1 (02 buổi - 60p)
[Tổng cộng: 05 buổi]',
        dietary_plan = N'Chế độ dinh dưỡng phục hồi gân cốt & kháng viêm tự nhiên:
- 02 bữa sáng giàu đạm thực vật, Canxi hữu cơ & Vitamin D3
- 02 bữa trưa & 02 bữa tối hỗ trợ tái tạo khớp (Nghệ tươi, gừng ấm, hạt óc chó, súp hầm)',
        extra_charge_policy = N'ĐÃ BAO GỒM 05 liệu trình chuyên sâu chỉnh trục và dinh dưỡng. Nếu khách yêu cầu Kỹ thuật viên cao cấp ngoài phân bổ mặc định sẽ không phát sinh thêm phí trừ khi kéo dài thời gian buổi tập.'
    WHERE package_code = 'RET-ALIGN-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-ALIGN-03', N'3D2N Nắn Chỉnh Cột Sống & Cổ Vai Gáy (Spine & Posture Care)', N'Physical Alignment', 2, N'Đêm (Nights)',
        13200000, N'VND/khách/gói', 'ACTIVE', N'• SPA-MASS-02: Trị liệu cơ sâu bấm huyệt Deep Tissue (01 buổi - 75p)
• SPA-MASS-04: Bấm huyệt y học cổ truyền Việt Nam (01 buổi - 60p)
• SPA-MASS-05: Trị liệu chườm thảo dược ấm (01 buổi - 75p)
• SPA-YOGA-01: Yoga phục hồi chỉnh vẹo cột sống 1-kèm-1 (02 buổi - 60p)
[Tổng cộng: 05 buổi]', N'Chế độ dinh dưỡng phục hồi gân cốt & kháng viêm tự nhiên:
- 02 bữa sáng giàu đạm thực vật, Canxi hữu cơ & Vitamin D3
- 02 bữa trưa & 02 bữa tối hỗ trợ tái tạo khớp (Nghệ tươi, gừng ấm, hạt óc chó, súp hầm)',
        N'ĐÃ BAO GỒM 05 liệu trình chuyên sâu chỉnh trục và dinh dưỡng. Nếu khách yêu cầu Kỹ thuật viên cao cấp ngoài phân bổ mặc định sẽ không phát sinh thêm phí trừ khi kéo dài thời gian buổi tập.'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-VITAL-05')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'5D4N Quản Lý Vóc Dáng & Đốt Mỡ Tự Nhiên (Vitality Slimming)',
        wellness_goal = N'Fitness & Weight Loss',
        duration_nights = 4,
        duration_unit = N'Đêm (Nights)',
        base_price = 26500000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết giảm ứ nước (02 buổi - 75p)
• SPA-BODY-02: Ủ nóng bùn khoáng hóa lỏng mô mỡ (01 buổi - 60p)
• SPA-HYDRO-01: Tắm mưa Vichy Shower giải tỏa cơ bắp (02 buổi - 45p)
• SPA-YOGA-01: Vận động chuyên sâu đốt calo 1-kèm-1 (03 buổi - 60p)
• SPA-YOGA-02: Hít thở thanh lọc điều hòa tạng phủ (02 buổi - 60p)
[Tổng cộng: 10 buổi]',
        dietary_plan = N'Chế độ Macro-Balanced thâm hụt Calo khoa học (Calorie Deficit):
- Bếp trưởng F&B (M4) định lượng khẩu phần chuẩn 1.400 - 1.600 kcal/ngày
- 04 bữa sáng ngũ cốc nguyên cám + 04 bữa trưa giàu nạc hữu cơ + 04 bữa tối low-carb
- 100% không đồ chiên rán, không phụ gia công nghiệp',
        extra_charge_policy = N'ĐÃ BAO GỒM 10 buổi tập luyện/trị liệu và 12 bữa ăn khoa học. Các món ăn hoặc đồ uống có đường gọi thêm tại Bar/Villa sẽ bị hệ thống gắn cờ Extra và tính phí riêng.'
    WHERE package_code = 'RET-VITAL-05';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-VITAL-05', N'5D4N Quản Lý Vóc Dáng & Đốt Mỡ Tự Nhiên (Vitality Slimming)', N'Fitness & Weight Loss', 4, N'Đêm (Nights)',
        26500000, N'VND/khách/gói', 'ACTIVE', N'• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết giảm ứ nước (02 buổi - 75p)
• SPA-BODY-02: Ủ nóng bùn khoáng hóa lỏng mô mỡ (01 buổi - 60p)
• SPA-HYDRO-01: Tắm mưa Vichy Shower giải tỏa cơ bắp (02 buổi - 45p)
• SPA-YOGA-01: Vận động chuyên sâu đốt calo 1-kèm-1 (03 buổi - 60p)
• SPA-YOGA-02: Hít thở thanh lọc điều hòa tạng phủ (02 buổi - 60p)
[Tổng cộng: 10 buổi]', N'Chế độ Macro-Balanced thâm hụt Calo khoa học (Calorie Deficit):
- Bếp trưởng F&B (M4) định lượng khẩu phần chuẩn 1.400 - 1.600 kcal/ngày
- 04 bữa sáng ngũ cốc nguyên cám + 04 bữa trưa giàu nạc hữu cơ + 04 bữa tối low-carb
- 100% không đồ chiên rán, không phụ gia công nghiệp',
        N'ĐÃ BAO GỒM 10 buổi tập luyện/trị liệu và 12 bữa ăn khoa học. Các món ăn hoặc đồ uống có đường gọi thêm tại Bar/Villa sẽ bị hệ thống gắn cờ Extra và tính phí riêng.'
    );
END
GO


IF EXISTS (SELECT 1 FROM dbo.RetreatPackage WHERE package_code = 'RET-MOM-03')
BEGIN
    UPDATE dbo.RetreatPackage
    SET package_name = N'3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Prenatal Care)',
        wellness_goal = N'Maternal Wellness',
        duration_nights = 2,
        duration_unit = N'Đêm (Nights)',
        base_price = 14000000,
        base_price_unit = N'VND/khách/gói',
        package_status = 'ACTIVE',
        included_treatments = N'• SPA-MASS-06: Massage mẹ bầu an yên (02 buổi - 60p)
• SPA-FACE-02: Cấp ẩm phục hồi tế bào da hữu cơ (01 buổi - 60p)
• SPA-HYDRO-02: Ngâm chân nước ấm thảo dược thảo mộc (01 buổi - 45p)
• SPA-YOGA-02: Lớp hít thở & thiền tiền sản nhẹ nhàng (02 buổi - 60p)
[Tổng cộng: 06 buổi]',
        dietary_plan = N'Chế độ dinh dưỡng an thai lành tính:
- Thực đơn 3 bữa/ngày giàu Axit Folic, Sắt, Canxi và DHA từ tự nhiên
- 100% nguyên liệu nuôi trồng hữu cơ có chứng nhận, loại bỏ hoàn toàn caffeine và thảo dược gây co bóp tử cung
[Trạng thái: PENDING_CONFIRMATION số bữa chính xác theo check-in/out]',
        extra_charge_policy = N'ĐÃ BAO GỒM toàn bộ 06 buổi chăm sóc mẹ bầu an toàn. Phải qua kiểm tra hồ sơ sức khỏe thai kỳ tại S08/S33 trước khi thực hiện buổi đầu tiên.'
    WHERE package_code = 'RET-MOM-03';
END
ELSE
BEGIN
    INSERT INTO dbo.RetreatPackage (
        package_code, package_name, wellness_goal, duration_nights, duration_unit,
        base_price, base_price_unit, package_status, included_treatments, dietary_plan,
        extra_charge_policy
    ) VALUES (
        'RET-MOM-03', N'3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Prenatal Care)', N'Maternal Wellness', 2, N'Đêm (Nights)',
        14000000, N'VND/khách/gói', 'ACTIVE', N'• SPA-MASS-06: Massage mẹ bầu an yên (02 buổi - 60p)
• SPA-FACE-02: Cấp ẩm phục hồi tế bào da hữu cơ (01 buổi - 60p)
• SPA-HYDRO-02: Ngâm chân nước ấm thảo dược thảo mộc (01 buổi - 45p)
• SPA-YOGA-02: Lớp hít thở & thiền tiền sản nhẹ nhàng (02 buổi - 60p)
[Tổng cộng: 06 buổi]', N'Chế độ dinh dưỡng an thai lành tính:
- Thực đơn 3 bữa/ngày giàu Axit Folic, Sắt, Canxi và DHA từ tự nhiên
- 100% nguyên liệu nuôi trồng hữu cơ có chứng nhận, loại bỏ hoàn toàn caffeine và thảo dược gây co bóp tử cung
[Trạng thái: PENDING_CONFIRMATION số bữa chính xác theo check-in/out]',
        N'ĐÃ BAO GỒM toàn bộ 06 buổi chăm sóc mẹ bầu an toàn. Phải qua kiểm tra hồ sơ sức khỏe thai kỳ tại S08/S33 trước khi thực hiện buổi đầu tiên.'
    );
END
GO


-- Mark old obsolete packages as INACTIVE if they are not in the 8 standardized packages
UPDATE dbo.RetreatPackage
SET package_status = 'INACTIVE'
WHERE package_code IS NULL OR package_code NOT IN ('RET-DETOX-03', 'RET-DETOX-05', 'RET-SLEEP-03', 'RET-STRESS-04', 'RET-AGING-04', 'RET-ALIGN-03', 'RET-VITAL-05', 'RET-MOM-03');
GO

/* ============================================================================
   5. PACKAGE - TREATMENT MAPPINGS (Sheet 4: 36 Mappings)
   ============================================================================ */
PRINT '--- Seeding Package - Treatment Mappings with Session Quotas...';

-- Clear existing mappings for the 8 packages to re-seed cleanly
DELETE FROM dbo.RetreatPackageSpaTreatment
WHERE retreat_package_id IN (SELECT retreat_package_id FROM dbo.RetreatPackage WHERE package_code IN ('RET-DETOX-03', 'RET-DETOX-05', 'RET-SLEEP-03', 'RET-STRESS-04', 'RET-AGING-04', 'RET-ALIGN-03', 'RET-VITAL-05', 'RET-MOM-03'));
GO


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Kích hoạt hệ bạch huyết.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-03' AND t.treatment_code = 'SPA-MASS-03';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 45 phút/buổi. Thanh tẩy tế bào chết.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-03' AND t.treatment_code = 'SPA-BODY-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 45 phút/buổi. Thủy liệu pháp thư giãn.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-03' AND t.treatment_code = 'SPA-HYDRO-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Thiền định thanh lọc thân tâm.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-03' AND t.treatment_code = 'SPA-YOGA-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Dẫn lưu giải độc chuyên sâu.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-05' AND t.treatment_code = 'SPA-MASS-03';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Massage tạng phủ giải độc.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-05' AND t.treatment_code = 'SPA-HEAL-03';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Đào thải độc tố qua da.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-05' AND t.treatment_code = 'SPA-BODY-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 45 phút/buổi. Massage dòng nước Vichy.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-05' AND t.treatment_code = 'SPA-HYDRO-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 4, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Luyện thở Pranayama hàng ngày.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-DETOX-05' AND t.treatment_code = 'SPA-YOGA-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Sóng rung đưa não về tần số Alpha/Theta.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-SLEEP-03' AND t.treatment_code = 'SPA-HEAL-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Trị mất ngủ kinh niên.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-SLEEP-03' AND t.treatment_code = 'SPA-HEAL-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Chườm ấm kinh lạc.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-SLEEP-03' AND t.treatment_code = 'SPA-MASS-05';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Thiền buông thư Yoga Nidra buổi tối.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-SLEEP-03' AND t.treatment_code = 'SPA-YOGA-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 90 phút/buổi. Thư giãn mô sâu.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-STRESS-04' AND t.treatment_code = 'SPA-MASS-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Chữa lành tâm trí.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-STRESS-04' AND t.treatment_code = 'SPA-HEAL-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Phục hồi làn da mệt mỏi.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-STRESS-04' AND t.treatment_code = 'SPA-FACE-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 45 phút/buổi. Thư giãn cơ bắp.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-STRESS-04' AND t.treatment_code = 'SPA-HYDRO-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 3, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Thiền chánh niệm hàng ngày.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-STRESS-04' AND t.treatment_code = 'SPA-YOGA-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Kích thích tăng sinh collagen.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-AGING-04' AND t.treatment_code = 'SPA-FACE-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Bổ sung vi khoáng làm mờ nếp nhăn.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-AGING-04' AND t.treatment_code = 'SPA-FACE-03';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 90 phút/buổi. Tăng tuần hoàn máu toàn thân.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-AGING-04' AND t.treatment_code = 'SPA-MASS-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Tái tạo da toàn thân.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-AGING-04' AND t.treatment_code = 'SPA-BODY-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Tăng độ dẻo dai cơ thể.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-AGING-04' AND t.treatment_code = 'SPA-YOGA-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Giải phóng co thắt cổ vai gáy.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-ALIGN-03' AND t.treatment_code = 'SPA-MASS-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Thông kinh hoạt lạc.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-ALIGN-03' AND t.treatment_code = 'SPA-MASS-04';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Giảm đau nhức phong thấp.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-ALIGN-03' AND t.treatment_code = 'SPA-MASS-05';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Huấn luyện viên kèm chỉnh vẹo cột sống.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-ALIGN-03' AND t.treatment_code = 'SPA-YOGA-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 75 phút/buổi. Giảm phù nề ứ nước.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-VITAL-05' AND t.treatment_code = 'SPA-MASS-03';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Thúc đẩy đốt mỡ thừa.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-VITAL-05' AND t.treatment_code = 'SPA-BODY-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 45 phút/buổi. Thủy liệu pháp săn chắc mô.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-VITAL-05' AND t.treatment_code = 'SPA-HYDRO-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 3, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Vận động tăng cường cơ bắp và đốt calo.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-VITAL-05' AND t.treatment_code = 'SPA-YOGA-01';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Cân bằng nhịp sinh học và trao đổi chất.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-VITAL-05' AND t.treatment_code = 'SPA-YOGA-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Giảm tải áp lực cột sống cho thai phụ.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-MOM-03' AND t.treatment_code = 'SPA-MASS-06';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Chăm sóc da an toàn thai kỳ.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-MOM-03' AND t.treatment_code = 'SPA-FACE-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 1, 'INCLUDED', N'Thời lượng: 45 phút/buổi. Chỉ ngâm chân thảo dược giảm phù nề tĩnh mạch.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-MOM-03' AND t.treatment_code = 'SPA-HYDRO-02';


INSERT INTO dbo.RetreatPackageSpaTreatment (
    retreat_package_id, treatment_id, included_sessions, entitlement_status, notes
)
SELECT p.retreat_package_id, t.treatment_id, 2, 'INCLUDED', N'Thời lượng: 60 phút/buổi. Khí công & thở tiền sản nhẹ nhàng.'
FROM dbo.RetreatPackage p
CROSS JOIN dbo.SpaTreatment t
WHERE p.package_code = 'RET-MOM-03' AND t.treatment_code = 'SPA-YOGA-02';

GO

/* ============================================================================
   6. PACKAGE F&B ENTITLEMENTS (Sheet 5: 8 Entitlements)
   ============================================================================ */
PRINT '--- Seeding Package F&B Entitlements...';


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 2 AS breakfast_count, 2 AS lunch_count, 
           2 AS dinner_count, 6 AS total_meals, 
           N'Detox Thanh Lọc Chuyên Sâu' AS menu_plan, N'Plant-based 100%, 0% đường tinh luyện, nước ép cần tây hữu cơ & trà thảo mộc' AS dietary_notes,
           'APPROVED' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-DETOX-03'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 4 AS breakfast_count, 4 AS lunch_count, 
           4 AS dinner_count, 12 AS total_meals, 
           N'Intermittent Fasting & Clean Eating' AS menu_plan, N'Sinh tố GI thấp, súp thanh nhiệt, giàu Magie, kiểm soát kiềm tính' AS dietary_notes,
           'APPROVED' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-DETOX-05'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 2 AS breakfast_count, 2 AS lunch_count, 
           2 AS dinner_count, 6 AS total_meals, 
           N'Thực Đơn Kích Hoạt Melatonin' AS menu_plan, N'Giàu Tryptophan (Trứng organic, hạt óc chó, bơ), sữa hạt sen ấm trước 21h' AS dietary_notes,
           'APPROVED' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-SLEEP-03'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 3 AS breakfast_count, 3 AS lunch_count, 
           3 AS dinner_count, 9 AS total_meals, 
           N'Set Menu Mind-Body Harmony' AS menu_plan, N'Thực dưỡng bồi bổ khí huyết, cân bằng năng lượng âm dương, canh dưỡng tâm' AS dietary_notes,
           'APPROVED' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-STRESS-04'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 3 AS breakfast_count, 3 AS lunch_count, 
           3 AS dinner_count, 9 AS total_meals, 
           N'Thực Đơn Chống Oxy Hóa Cao' AS menu_plan, N'Quả mọng berries, cá hồi áp chảo dầu ô-liu, giàu collagen tự nhiên & nước hầm bổ' AS dietary_notes,
           'APPROVED' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-AGING-04'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 2 AS breakfast_count, 2 AS lunch_count, 
           2 AS dinner_count, 6 AS total_meals, 
           N'Dinh Dưỡng Kháng Viêm Tự Nhiên' AS menu_plan, N'Giàu Canxi hữu cơ, đạm thực vật, nghệ tươi & gừng ấm phục hồi mô sụn' AS dietary_notes,
           'APPROVED' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-ALIGN-03'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 4 AS breakfast_count, 4 AS lunch_count, 
           4 AS dinner_count, 12 AS total_meals, 
           N'Macro-Balanced Calorie Deficit' AS menu_plan, N'Khẩu phần định lượng 1.400 - 1.600 kcal/ngày, ít muối, giàu nạc hữu cơ' AS dietary_notes,
           'APPROVED' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-VITAL-05'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


MERGE INTO dbo.PackageFnBEntitlement AS target
USING (
    SELECT p.retreat_package_id, 2 AS breakfast_count, 2 AS lunch_count, 
           2 AS dinner_count, 6 AS total_meals, 
           N'Dinh Dưỡng An Thai Hữu Cơ' AS menu_plan, N'Giàu Axit Folic, Sắt, Canxi & DHA tự nhiên; loại bỏ 100% caffeine và gia vị kích thích' AS dietary_notes,
           'PENDING_CONFIRMATION' AS entitlement_status
    FROM dbo.RetreatPackage p
    WHERE p.package_code = 'RET-MOM-03'
) AS source
ON target.retreat_package_id = source.retreat_package_id
WHEN MATCHED THEN
    UPDATE SET
        target.breakfast_count = source.breakfast_count,
        target.lunch_count = source.lunch_count,
        target.dinner_count = source.dinner_count,
        target.total_meals = source.total_meals,
        target.menu_plan = source.menu_plan,
        target.dietary_notes = source.dietary_notes,
        target.entitlement_status = source.entitlement_status
WHEN NOT MATCHED THEN
    INSERT (retreat_package_id, breakfast_count, lunch_count, dinner_count, total_meals, menu_plan, dietary_notes, entitlement_status)
    VALUES (source.retreat_package_id, source.breakfast_count, source.lunch_count, source.dinner_count, source.total_meals, source.menu_plan, source.dietary_notes, source.entitlement_status);
GO


/* ============================================================================
   7. TREATMENT TYPE ROOM COMPATIBILITY (Sheet 6 - Table C: 24 Mappings)
   ============================================================================ */
PRINT '--- Seeding Treatment Type Room Compatibilities...';

DELETE FROM dbo.TreatmentTypeRoomCompatibility;
GO


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_STANDARD', N'HEATED_STONE_TRAY', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-01';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_VIP', N'HEATED_STONE_TRAY', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-01';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_STANDARD', N'ADJUSTABLE_TREATMENT_BED', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-02';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_VIP', N'ADJUSTABLE_TREATMENT_BED', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-02';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_STANDARD', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-03';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_VIP', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-03';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_STANDARD', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-04';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_VIP', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-04';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_STANDARD', N'HERBAL_COMPRESS_STEAMER', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-05';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_VIP', N'HERBAL_COMPRESS_STEAMER', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-05';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_VIP', N'PRENATAL_U_PILLOW', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-MASS-06';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'SOUND_SANCTUARY', N'ACOUSTICALLY_ISOLATED', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-HEAL-01';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'AYURVEDA_ROOM', N'DRONI_TABLE, HANGING_BOWL', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-HEAL-02';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_STANDARD', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-HEAL-03';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MASSAGE_VIP', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-HEAL-03';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'FACIAL_SPECIALIZED', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-FACE-01';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'FACIAL_SPECIALIZED', N'ELECTROPHORESIS_DEVICE', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-FACE-02';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'FACIAL_SPECIALIZED', N'OXYGEN_SPRAY_MACHINE', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-FACE-03';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'WET_ROOM', N'STANDING_SHOWER', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-BODY-01';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'BODY_WRAP_ROOM', N'HEATED_WRAP_BED', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-BODY-02';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'VICHY_SHOWER_ROOM', N'VICHY_7_NOZZLE_SYSTEM', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-HYDRO-01';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'JACUZZI_ROOM', N'PRIVATE_JACUZZI', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-HYDRO-02';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'YOGA_STUDIO', N'Không yêu cầu thêm', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-YOGA-01';


INSERT INTO dbo.TreatmentTypeRoomCompatibility (treatment_id, room_type, required_features, design_status)
SELECT t.treatment_id, 'MEDITATION_ROOM', N'QUIET_MEDITATION_SPACE', 'DESIGN_APPROVED'
FROM dbo.SpaTreatment t
WHERE t.treatment_code = 'SPA-YOGA-02';

GO

PRINT '>>> Spa Treatments, Retreat Packages & Entitlements V3 Seeded Successfully!';
GO
