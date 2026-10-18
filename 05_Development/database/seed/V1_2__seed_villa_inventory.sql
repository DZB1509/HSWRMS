/*
================================================================================
HSWRMS Seed Data V1.2 - Villa Inventory & Physical Resort Layout
Source File: 02_Requirement/Screen_Inventory/HSWRMS_Villa_Inventory (1).xlsx
Target Database: SQL Server / Azure SQL
Author: HSWRMS Development Team

Contents:
  1. Resort Zones (6 zones from Sheet 4)
  2. Villa Categories (6 categories from Sheet 2)
  3. Physical Villas (27 physical villas V101-V601 from Sheet 1)
  4. Villa Functional Areas (16 functional areas from Sheet 3)
================================================================================
*/

USE [HSWRMS];
GO

SET NOCOUNT ON;
GO

PRINT '>>> Beginning HSWRMS Villa Inventory Seeding...';
GO

/* ============================================================================
   1. RESORT ZONES (Sheet 4: Phan_Loai_Theo_Vi_Tri)
   ============================================================================ */
PRINT '--- Seeding Resort Zones...';

MERGE INTO dbo.ResortZone AS target
USING (VALUES
    (N'Garden Zone (Khuôn viên Vườn Nhiệt Đới)',
     N'Bao quanh bởi vườn thiền, cây xanh rợp bóng, thảm hoa',
     8,
     N'1-Bedroom Garden Villa',
     N'Tiêu chuẩn ($$)',
     N'Cực kỳ yên tĩnh, mát mẻ, gần Spa Pavilion & Nhà hàng'),

    (N'Beachfront Zone (Dải Bờ Biển Trực Diện)',
     N'Hàng đầu sát mép sóng, view biển 180 độ không chắn tầm nhìn',
     6,
     N'1-Bedroom Beachfront Pool Villa',
     N'Rất cao ($$$$$)',
     N'Chỉ 5 bước chân chạm cát biển, hồ bơi riêng sát bãi cát'),

    (N'Lagoon Zone (Ven Hồ Thủy Sinh Sinh Thái)',
     N'Bên mặt nước đầm phá tĩnh lặng, rặng sen súng và cầu gỗ',
     6,
     N'2-Bedroom Pool Villa',
     N'Cao cấp ($$$$)',
     N'Lãng mạn, thanh bình, không gian mở thoáng đãng cho gia đình'),

    (N'Ocean Hill Zone (Sườn Đồi Hướng Biển)',
     N'Tọa lạc sườn dốc đồi cao, bao quát toàn cảnh vịnh biển đại dương',
     4,
     N'3-Bedroom Ocean View Villa',
     N'Cao cấp ($$$$)',
     N'Đón gió biển lộng mát, ngắm bình minh/hoàng hôn tuyệt đẹp'),

    (N'Hillside Cliff Zone (Đỉnh Đồi Biệt Lập)',
     N'Đỉnh đồi cao nhất, tách biệt hoàn toàn giữa rừng cây nguyên sơ',
     2,
     N'4-5 Bedroom Family Estate',
     N'Đặc biệt xa xỉ ($$$$$+)',
     N'Riêng tư tuyệt đối 100%, hồ bơi chân mây tràn bờ nhìn từ trên cao'),

    (N'Cliffside Sanctuary (Mũi Vách Đá Độc Bản)',
     N'Tọa lạc trên mũi đá nhô ra biển độc tôn của toàn khu nghỉ dưỡng',
     1,
     N'Presidential Royal Residence',
     N'Tối thượng (VIP Palatial)',
     N'Vị trí kim cương của resort, tầm nhìn 270 độ đại dương vô cực')
) AS source (zone_name, landscape_description, villa_count, villa_category_name, relative_price_tier, operational_advantages)
ON target.zone_name = source.zone_name
WHEN MATCHED THEN
    UPDATE SET 
        target.landscape_description = source.landscape_description,
        target.villa_count           = source.villa_count,
        target.villa_category_name   = source.villa_category_name,
        target.relative_price_tier   = source.relative_price_tier,
        target.operational_advantages= source.operational_advantages
WHEN NOT MATCHED THEN
    INSERT (zone_name, landscape_description, villa_count, villa_category_name, relative_price_tier, operational_advantages)
    VALUES (source.zone_name, source.landscape_description, source.villa_count, source.villa_category_name, source.relative_price_tier, source.operational_advantages);
GO

/* ============================================================================
   2. VILLA CATEGORIES (Sheet 2: Co_Cau_Theo_Hang_Villa)
   ============================================================================ */
PRINT '--- Seeding Villa Categories...';

MERGE INTO dbo.VillaCategory AS target
USING (VALUES
    (N'1-Bedroom Garden Villa', 3, 0.00, 'ACTIVE', 8, 1, 
     N'1 PN (King Bed)', N'80 - 120 m²', 0, 
     N'Không (Vườn xanh riêng)', 
     N'Thiền tịnh, yên tĩnh, bồn tắm nằm thảo dược, sân vườn biệt lập', 
     N'Detox, Stress Relief, Mindful Living'),

    (N'1-Bedroom Beachfront Pool Villa', 3, 2500000.00, 'ACTIVE', 6, 1, 
     N'1 PN (King Bed)', N'120 - 180 m²', 1, 
     N'Có (Hồ bơi 25 - 40m²)', 
     N'Sát bãi biển, bước chân ra cát trắng, hiên tắm nắng ngắm bình minh', 
     N'Couple Rejuvenation, Longevity, Stress Relief'),

    (N'2-Bedroom Pool Villa', 6, 4500000.00, 'ACTIVE', 6, 2, 
     N'2 PN (1 King + 1 Twin)', N'180 - 250 m²', 1, 
     N'Có (Hồ bơi 30 - 50m²)', 
     N'Bếp ăn gia đình mở, phòng khách rộng, hiên tiệc cocktail hồ bơi', 
     N'Family Wellness, Holistic Rebalance'),

    (N'3-Bedroom Ocean View Villa', 9, 7000000.00, 'ACTIVE', 4, 3, 
     N'3 PN (2 King + 1 Twin)', N'280 - 400 m²', 1, 
     N'Có (Hồ bơi 45 - 70m²)', 
     N'View biển bao quát từ trên đồi, sân vườn nướng BBQ, ban công lộng gió', 
     N'Family Wellness, Active Longevity Group'),

    (N'4-5 Bedroom Family Estate', 12, 12000000.00, 'ACTIVE', 2, 5, 
     N'4 - 5 PN linh hoạt (3 King + 2 Twin)', N'450 - 700 m²', 1, 
     N'Có (Hồ bơi tràn 60 - 100m²)', 
     N'Biệt lập tuyệt đối, sảnh lounge tầng 2, phòng xông hơi riêng', 
     N'Corporate Executive Retreat, Multi-Gen Estate'),

    (N'Presidential Royal Residence', 16, 25000000.00, 'ACTIVE', 1, 6, 
     N'6 PN Master Suites', N'800 - 1500+ m²', 1, 
     N'Có (Hồ bơi vô cực 150m²)', 
     N'Dinh thự độc bản, Quản gia riêng 24/7, rạp chiếu phim, Spa riêng, xe Buggy riêng', 
     N'Ultra-Luxury VIP, Royal Wellness Celebration')
) AS source (category_name, max_occupancy, price_modifier, category_status, inventory_count, bedroom_count, 
             bedroom_description, area_description, has_private_pool, pool_description, 
             features_and_amenities, eligible_packages)
ON target.category_name = source.category_name
WHEN MATCHED THEN
    UPDATE SET 
        target.max_occupancy        = source.max_occupancy,
        target.price_modifier       = source.price_modifier,
        target.category_status      = source.category_status,
        target.inventory_count      = source.inventory_count,
        target.bedroom_count        = source.bedroom_count,
        target.bedroom_description  = source.bedroom_description,
        target.area_description     = source.area_description,
        target.has_private_pool     = source.has_private_pool,
        target.pool_description     = source.pool_description,
        target.features_and_amenities = source.features_and_amenities,
        target.eligible_packages    = source.eligible_packages
WHEN NOT MATCHED THEN
    INSERT (category_name, max_occupancy, price_modifier, category_status, inventory_count, bedroom_count, 
            bedroom_description, area_description, has_private_pool, pool_description, 
            features_and_amenities, eligible_packages)
    VALUES (source.category_name, source.max_occupancy, source.price_modifier, source.category_status, source.inventory_count, source.bedroom_count, 
            source.bedroom_description, source.area_description, source.has_private_pool, source.pool_description, 
            source.features_and_amenities, source.eligible_packages);
GO

/* ============================================================================
   3. PHYSICAL VILLAS (Sheet 1: Danh_Sach_Physical_Villa - 27 Villas)
   ============================================================================ */
PRINT '--- Seeding 27 Physical Villas...';

MERGE INTO dbo.PhysicalVilla AS target
USING (
    SELECT 
        vc.villa_category_id,
        src.villa_number,
        src.floor,
        src.villa_status,
        src.zone_name,
        src.bedroom_info,
        src.max_occupancy,
        src.area_sqm,
        src.has_private_pool,
        src.pool_info,
        src.view_and_operational_notes
    FROM (VALUES
        -- 1-Bedroom Garden Villas (V101 - V108)
        (N'1-Bedroom Garden Villa', N'V101', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Hướng vườn sinh thái, gần Wellness Pavilion & Spa'),

        (N'1-Bedroom Garden Villa', N'V102', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Không gian thiền tịnh, rặng dừa xanh mướt'),

        (N'1-Bedroom Garden Villa', N'V103', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Gần lối dạo bộ thiền hành (Zen Garden)'),

        (N'1-Bedroom Garden Villa', N'V104', N'Tầng 1 (Ground)', 'OCCUPIED', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Phù hợp khách Detox cá nhân hoặc cặp đôi'),

        (N'1-Bedroom Garden Villa', N'V105', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Khuôn viên biệt lập có thảm cỏ riêng'),

        (N'1-Bedroom Garden Villa', N'V106', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Hiên thưởng trà ngoài trời thoáng mát'),

        (N'1-Bedroom Garden Villa', N'V107', N'Tầng 1 (Ground)', 'NEEDS_CLEANING', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Chuẩn bị dọn phòng sau phiên Checkout'),

        (N'1-Bedroom Garden Villa', N'V108', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Vườn Nhiệt Đới (Garden Zone)', N'1 King Bed', 3, 105.00, 0, N'Không (Vườn riêng)', 
         N'Gần phân khu F&B Organic Kitchen'),

        -- 1-Bedroom Beachfront Pool Villas (V201 - V206)
        (N'1-Bedroom Beachfront Pool Villa', N'V201', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Phân Khu Sát Biển (Beachfront)', N'1 King Bed', 3, 150.00, 1, N'Có (Hồ bơi 30m²)', 
         N'Sát bãi cát trắng, hồ bơi riêng ngắm bình minh'),

        (N'1-Bedroom Beachfront Pool Villa', N'V202', N'Tầng 1 (Ground)', 'OCCUPIED', 
         N'Phân Khu Sát Biển (Beachfront)', N'1 King Bed', 3, 150.00, 1, N'Có (Hồ bơi 30m²)', 
         N'View biển 180 độ, phòng tắm lộ thiên giếng trời'),

        (N'1-Bedroom Beachfront Pool Villa', N'V203', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Phân Khu Sát Biển (Beachfront)', N'1 King Bed', 3, 150.00, 1, N'Có (Hồ bơi 30m²)', 
         N'Lối đi thẳng ra bờ biển, hiên tắm nắng riêng'),

        (N'1-Bedroom Beachfront Pool Villa', N'V204', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Phân Khu Sát Biển (Beachfront)', N'1 King Bed', 3, 150.00, 1, N'Có (Hồ bơi 30m²)', 
         N'Trang bị bồn ngâm thủy lực thảo dược ngoài trời'),

        (N'1-Bedroom Beachfront Pool Villa', N'V205', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Phân Khu Sát Biển (Beachfront)', N'1 King Bed', 3, 150.00, 1, N'Có (Hồ bơi 30m²)', 
         N'Vị trí ngắm hoàng hôn tuyệt đẹp trên biển'),

        (N'1-Bedroom Beachfront Pool Villa', N'V206', N'Tầng 1 (Ground)', 'MAINTENANCE', 
         N'Phân Khu Sát Biển (Beachfront)', N'1 King Bed', 3, 150.00, 1, N'Có (Hồ bơi 30m²)', 
         N'Bảo dưỡng định kỳ hệ thống lọc hồ bơi'),

        -- 2-Bedroom Pool Villas (V301 - V306)
        (N'2-Bedroom Pool Villa', N'V301', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Đầm Phá & Vườn (Lagoon/Garden)', N'2 PN (1 King + 1 Twin)', 6, 220.00, 1, N'Có (Hồ bơi 40m²)', 
         N'Phù hợp gia đình nhỏ, bếp nấu mở & phòng khách lớn'),

        (N'2-Bedroom Pool Villa', N'V302', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Đầm Phá & Vườn (Lagoon/Garden)', N'2 PN (1 King + 1 Twin)', 6, 220.00, 1, N'Có (Hồ bơi 40m²)', 
         N'Mặt nước tĩnh lặng, cầu gỗ dạo bộ ven hồ'),

        (N'2-Bedroom Pool Villa', N'V303', N'2 Tầng (Duplex)', 'OCCUPIED', 
         N'Khu Đầm Phá & Vườn (Lagoon/Garden)', N'2 PN (1 King + 1 Twin)', 6, 240.00, 1, N'Có (Hồ bơi 45m²)', 
         N'Phòng Master tầng 2 có ban công ngắm toàn cảnh'),

        (N'2-Bedroom Pool Villa', N'V304', N'2 Tầng (Duplex)', 'AVAILABLE', 
         N'Khu Đầm Phá & Vườn (Lagoon/Garden)', N'2 PN (1 King + 1 Twin)', 6, 240.00, 1, N'Có (Hồ bơi 45m²)', 
         N'Khu vực bàn ăn gia đình 6 chỗ kết nối hiên hồ bơi'),

        (N'2-Bedroom Pool Villa', N'V305', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Đầm Phá & Vườn (Lagoon/Garden)', N'2 PN (1 King + 1 Twin)', 6, 220.00, 1, N'Có (Hồ bơi 40m²)', 
         N'Hai phòng ngủ khép kín độc lập, bảo đảm riêng tư'),

        (N'2-Bedroom Pool Villa', N'V306', N'Tầng 1 (Ground)', 'AVAILABLE', 
         N'Khu Đầm Phá & Vườn (Lagoon/Garden)', N'2 PN (1 King + 1 Twin)', 6, 220.00, 1, N'Có (Hồ bơi 40m²)', 
         N'Sân vườn bên hiên tích hợp tiểu cảnh nước tĩnh'),

        -- 3-Bedroom Ocean View Villas (V401 - V404)
        (N'3-Bedroom Ocean View Villa', N'V401', N'2 Tầng (Duplex)', 'AVAILABLE', 
         N'Khu Đồi Hướng Biển (Ocean Hill)', N'3 PN (2 King + 1 Twin)', 9, 350.00, 1, N'Có (Hồ bơi 55m²)', 
         N'Tầm nhìn biển bao quát từ đồi cao, sân nướng BBQ'),

        (N'3-Bedroom Ocean View Villa', N'V402', N'2 Tầng (Duplex)', 'OCCUPIED', 
         N'Khu Đồi Hướng Biển (Ocean Hill)', N'3 PN (2 King + 1 Twin)', 9, 350.00, 1, N'Có (Hồ bơi 55m²)', 
         N'Phù hợp gia đình đa thế hệ, 3 phòng tắm khép kín'),

        (N'3-Bedroom Ocean View Villa', N'V403', N'2 Tầng (Duplex)', 'AVAILABLE', 
         N'Khu Đồi Hướng Biển (Ocean Hill)', N'3 PN (2 King + 1 Twin)', 9, 350.00, 1, N'Có (Hồ bơi 55m²)', 
         N'Ban công đón gió biển lộng gió, phòng khách rộng'),

        (N'3-Bedroom Ocean View Villa', N'V404', N'2 Tầng (Duplex)', 'AVAILABLE', 
         N'Khu Đồi Hướng Biển (Ocean Hill)', N'3 PN (2 King + 1 Twin)', 9, 350.00, 1, N'Có (Hồ bơi 55m²)', 
         N'Hồ bơi chân mây hướng trực diện hoàng hôn biển'),

        -- 4-5 Bedroom Family Estates (V501 - V502)
        (N'4-5 Bedroom Family Estate', N'V501', N'2 Tầng (Estate)', 'AVAILABLE', 
         N'Đỉnh Đồi Biệt Lập (Hillside Cliff)', N'5 PN (3 King + 2 Twin)', 12, 580.00, 1, N'Có (Hồ bơi tràn 80m²)', 
         N'Biệt thự đại gia đình, phòng xông hơi riêng, bếp lớn'),

        (N'4-5 Bedroom Family Estate', N'V502', N'2 Tầng (Estate)', 'OCCUPIED', 
         N'Đỉnh Đồi Biệt Lập (Hillside Cliff)', N'5 PN (3 King + 2 Twin)', 12, 580.00, 1, N'Có (Hồ bơi tràn 80m²)', 
         N'Phục vụ kỳ nghỉ doanh nghiệp cấp cao, sân tiệc riêng'),

        -- Presidential Royal Residence (V601)
        (N'Presidential Royal Residence', N'V601', N'2 Tầng (Palatial)', 'AVAILABLE', 
         N'Mũi Vách Đá Biển (Cliffside Sanctuary)', N'6 PN Master Suites', 16, 1200.00, 1, N'Có (Hồ bơi vô cực 150m²)', 
         N'Dinh thự Tổng thống độc bản: Rạp chiếu phim, Spa riêng, Butler 24/7')
    ) AS src (category_name, villa_number, floor, villa_status, zone_name, bedroom_info, max_occupancy, area_sqm, has_private_pool, pool_info, view_and_operational_notes)
    INNER JOIN dbo.VillaCategory vc ON vc.category_name = src.category_name
) AS source
ON target.villa_number = source.villa_number
WHEN MATCHED THEN
    UPDATE SET 
        target.villa_category_id         = source.villa_category_id,
        target.floor                     = source.floor,
        target.villa_status              = source.villa_status,
        target.zone_name                 = source.zone_name,
        target.bedroom_info              = source.bedroom_info,
        target.max_occupancy             = source.max_occupancy,
        target.area_sqm                  = source.area_sqm,
        target.has_private_pool          = source.has_private_pool,
        target.pool_info                 = source.pool_info,
        target.view_and_operational_notes= source.view_and_operational_notes
WHEN NOT MATCHED THEN
    INSERT (villa_category_id, villa_number, floor, villa_status, zone_name, bedroom_info, max_occupancy, area_sqm, has_private_pool, pool_info, view_and_operational_notes)
    VALUES (source.villa_category_id, source.villa_number, source.floor, source.villa_status, source.zone_name, source.bedroom_info, source.max_occupancy, source.area_sqm, source.has_private_pool, source.pool_info, source.view_and_operational_notes);
GO

/* ============================================================================
   4. VILLA FUNCTIONAL AREAS (Sheet 3: Phong_Chuc_Nang_Villa - 16 Areas)
   ============================================================================ */
PRINT '--- Seeding 16 Villa Functional Areas...';

MERGE INTO dbo.VillaFunctionalArea AS target
USING (VALUES
    (N'Khu Vực Nghỉ Ngơi (Private)', N'Master Bedroom (Phòng ngủ chính)', N'28 - 45', N'1 phòng', N'1 phòng', N'2 - 4 phòng', 
     N'Giường King 2m, nệm organic, tủ walk-in, bàn làm việc, ban công ngắm cảnh', 
     N'Không gian nghỉ ngơi chính, view biển/vườn tối ưu'),

    (N'Khu Vực Nghỉ Ngơi (Private)', N'Standard / Guest Bedroom (Phòng ngủ phụ)', N'18 - 28', N'0 (Không có)', N'1 - 2 phòng', N'2 - 4 phòng', 
     N'Giường Queen hoặc 2 giường Twin, tủ âm tường, bàn trang điểm', 
     N'Linh hoạt cho con cái, người thân hoặc khách đi cùng'),

    (N'Khu Vực Nghỉ Ngơi (Private)', N'En-suite Bathroom (Phòng tắm khép kín)', N'8 - 18', N'1 phòng', N'2 - 3 phòng', N'4 - 7 phòng', 
     N'Bồn tắm nằm thảo dược (Bathtub), vách kính tắm đứng, lavabo đôi, bệt tự động', 
     N'Bắt buộc đi kèm mỗi PN; hỗ trợ ngâm khoáng/tinh dầu tại phòng'),

    (N'Khu Vực Nghỉ Ngơi (Private)', N'Dressing / Walk-in Closet', N'4 - 8', N'1 phòng', N'1 - 2 phòng', N'2 - 4 phòng', 
     N'Hệ tủ áo gỗ mộc, bàn phấn, gương soi toàn thân đèn LED âm tường', 
     N'Đảm bảo tính sang trọng và tiện lợi khi lưu trú dài ngày'),

    (N'Khu Sinh Hoạt Chung (Social)', N'Living Room (Phòng khách)', N'30 - 60', N'1 phòng (kết hợp)', N'1 phòng riêng', N'1 - 2 sảnh lounge', 
     N'Sofa cao cấp thương hiệu Ý, bàn trà gỗ lũa, Smart TV, âm thanh âm trần', 
     N'Không gian sinh hoạt chung kết nối mở ra sân vườn/hồ bơi'),

    (N'Khu Sinh Hoạt Chung (Social)', N'Dining Area (Khu vực bàn ăn)', N'15 - 25', N'1 bàn (2-4 ghế)', N'1 bàn (6-8 chỗ)', N'1 đại tiệc (12-16 chỗ)', 
     N'Bàn ăn gỗ óc chó nguyên tấm, đèn thả chùm nghệ thuật, kệ rượu', 
     N'Địa điểm phục vụ F&B tận phòng (Villa Dining - M4)'),

    (N'Khu Sinh Hoạt Chung (Social)', N'Kitchen & Island Bar (Bếp & Quầy Bar)', N'12 - 20', N'Mini Pantry Bar', N'Bếp gia đình hoàn chỉnh', N'Bếp bếp đảo + Bar lớn', 
     N'Bếp từ âm, tủ lạnh side-by-side, máy pha cà phê, dụng cụ nấu ăn', 
     N'Phục vụ chế độ ăn riêng hoặc đầu bếp nấu trực tiếp'),

    (N'Khu Sinh Hoạt Chung (Social)', N'Powder Room (Vệ sinh chung)', N'2.5 - 4.5', N'Tích hợp', N'1 phòng tầng trệt', N'1 - 2 phòng', 
     N'Chậu rửa đá tự nhiên, bồn cầu thông minh cao cấp', 
     N'Vệ sinh cho khách vãng lai khu vực sinh hoạt chung'),

    (N'Khu Ngoại Thất & Thư Giãn', N'Private Pool (Hồ bơi riêng)', N'25 - 150', N'Tùy căn (0 - 30m²)', N'Có (40 - 55m²)', N'Có (80 - 150m²)', 
     N'Lọc điện phân muối khoáng, đèn đổi màu âm nước, thác nước tràn', 
     N'Điểm nhấn trải nghiệm cốt lõi của dòng Pool Villa'),

    (N'Khu Ngoại Thất & Thư Giãn', N'Sun Deck & Pool Terrace (Hiên tắm nắng)', N'15 - 40', N'1 hiên nhỏ', N'1 hiên hồ bơi', N'Hiên lớn + Cabana', 
     N'Giường tắm nắng ngoài trời chống thấm (Sunbed), dù che lớn, bàn trà', 
     N'Khu vực thư giãn ngắm cảnh, tắm nắng và tập Yoga sớm'),

    (N'Khu Ngoại Thất & Thư Giãn', N'Outdoor BBQ Pavilion (Khu BBQ ngoài trời)', N'15 - 30', N'Không có', N'Tùy chọn sân vườn', N'1 nhà chòi riêng', 
     N'Bếp nướng BBQ ngoài trời, bàn tiệc gỗ, mái che pergola lam gỗ', 
     N'Tổ chức tiệc nướng gia đình ngoài trời theo gói M4'),

    (N'Khu Ngoại Thất & Thư Giãn', N'Private Garden (Khu vườn riêng)', N'40 - 200+', N'40 - 80 m²', N'80 - 150 m²', N'200 - 500 m²', 
     N'Thảm cỏ nhung, cây bóng mát nhiệt đới, lối đi rải sỏi dạo bộ', 
     N'Mật độ xanh cao, tạo không gian cách ly riêng tư tuyệt đối'),

    (N'Khu Phụ Trợ & Tiện Ích Cao Cấp', N'Laundry & Utility (Khu giặt phơi/kỹ thuật)', N'4 - 8', N'Tủ máy giặt sấy', N'1 phòng kỹ thuật', N'1 phòng riêng', 
     N'Máy giặt sấy cao cấp, tủ chứa dung dịch vệ sinh và khăn phòng', 
     N'Tiện ích lưu trú dài ngày (Long-stay Retreat)'),

    (N'Khu Phụ Trợ & Tiện Ích Cao Cấp', N'Private Spa & Sauna (Phòng Xông Hơi Riêng)', N'8 - 18', N'Không có', N'Tùy chọn', N'1 phòng xông đôi', 
     N'Phòng xông hơi đá muối Himalaya/Sauna khô, giường massage', 
     N'Đặc quyền chăm sóc sức khỏe tại phòng cao cấp (M3)'),

    (N'Khu Phụ Trợ & Tiện Ích Cao Cấp', N'Staff / Maid Room (Phòng quản gia/lái xe)', N'6 - 10', N'Không có', N'Không có', N'1 phòng riêng + WC', 
     N'Giường đơn, tủ đồ cá nhân, lối vào phụ riêng biệt', 
     N'Dành cho quản gia riêng (Butler) hoặc trợ lý đi cùng đoàn VIP'),

    (N'Khu Phụ Trợ & Tiện Ích Cao Cấp', N'Entertainment Cinema Room (Rạp chiếu phim)', N'18 - 35', N'Không có', N'Không có', N'1 phòng giải trí riêng', 
     N'Màn chiếu 150 inch, âm thanh vòm Dolby Atmos, sofa ngả da', 
     N'Phục vụ giải trí kín đáo đỉnh cao của Dinh thự Tổng thống')
) AS source (space_group, room_name, area_range_sqm, quantity_in_1br, quantity_in_2_3br, quantity_in_estate_4_6br, key_furnishing, operational_purpose)
ON target.room_name = source.room_name
WHEN MATCHED THEN
    UPDATE SET 
        target.space_group             = source.space_group,
        target.area_range_sqm          = source.area_range_sqm,
        target.quantity_in_1br         = source.quantity_in_1br,
        target.quantity_in_2_3br       = source.quantity_in_2_3br,
        target.quantity_in_estate_4_6br= source.quantity_in_estate_4_6br,
        target.key_furnishing          = source.key_furnishing,
        target.operational_purpose     = source.operational_purpose
WHEN NOT MATCHED THEN
    INSERT (space_group, room_name, area_range_sqm, quantity_in_1br, quantity_in_2_3br, quantity_in_estate_4_6br, key_furnishing, operational_purpose)
    VALUES (source.space_group, source.room_name, source.area_range_sqm, source.quantity_in_1br, source.quantity_in_2_3br, source.quantity_in_estate_4_6br, source.key_furnishing, source.operational_purpose);
GO

PRINT '>>> HSWRMS Villa Inventory Seeding completed successfully!';
PRINT '    - 6 Resort Zones';
PRINT '    - 6 Villa Categories';
PRINT '    - 27 Physical Villas (V101 - V601)';
PRINT '    - 16 Functional Areas & Amenities';
GO
