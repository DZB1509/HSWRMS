package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.ResortZone;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.entity.VillaFunctionalArea;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.ResortZoneRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaFunctionalAreaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Automatically seeds and synchronizes the 27 physical villas, 6 categories,
 * 6 resort zones, and 16 functional spaces from HSWRMS_Villa_Inventory.xlsx.
 */
@Component
@Order(10)
public class VillaInventoryDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(VillaInventoryDataInitializer.class);

    private final ResortZoneRepository zoneRepo;
    private final VillaCategoryRepository categoryRepo;
    private final PhysicalVillaRepository villaRepo;
    private final VillaFunctionalAreaRepository areaRepo;

    public VillaInventoryDataInitializer(ResortZoneRepository zoneRepo,
                                         VillaCategoryRepository categoryRepo,
                                         PhysicalVillaRepository villaRepo,
                                         VillaFunctionalAreaRepository areaRepo) {
        this.zoneRepo = zoneRepo;
        this.categoryRepo = categoryRepo;
        this.villaRepo = villaRepo;
        this.areaRepo = areaRepo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Initializing HSWRMS Villa Inventory Master Data (27 Villas, 6 Categories, 6 Zones)...");

        initZones();
        Map<String, VillaCategory> categoryMap = initCategories();
        initPhysicalVillas(categoryMap);
        initFunctionalAreas();

        log.info("HSWRMS Villa Inventory Master Data Initialized successfully.");
    }

    private void initZones() {
        Object[][] zones = {
                {"Garden Zone (Khuôn viên Vườn Nhiệt Đới)", "Bao quanh bởi vườn thiền, cây xanh rợp bóng, thảm hoa", 8, "1-Bedroom Garden Villa", "Tiêu chuẩn ($$)", "Cực kỳ yên tĩnh, mát mẻ, gần Spa Pavilion & Nhà hàng"},
                {"Beachfront Zone (Dải Bờ Biển Trực Diện)", "Hàng đầu sát mép sóng, view biển 180 độ không chắn tầm nhìn", 6, "1-Bedroom Beachfront Pool Villa", "Rất cao ($$$$$)", "Chỉ 5 bước chân chạm cát biển, hồ bơi riêng sát bãi cát"},
                {"Lagoon Zone (Ven Hồ Thủy Sinh Sinh Thái)", "Bên mặt nước đầm phá tĩnh lặng, rặng sen súng và cầu gỗ", 6, "2-Bedroom Pool Villa", "Cao cấp ($$$$)", "Lãng mạn, thanh bình, không gian mở thoáng đãng cho gia đình"},
                {"Ocean Hill Zone (Sườn Đồi Hướng Biển)", "Tọa lạc sườn dốc đồi cao, bao quát toàn cảnh vịnh biển đại dương", 4, "3-Bedroom Ocean View Villa", "Cao cấp ($$$$)", "Đón gió biển lộng mát, ngắm bình minh/hoàng hôn tuyệt đẹp"},
                {"Hillside Cliff Zone (Đỉnh Đồi Biệt Lập)", "Đỉnh đồi cao nhất, tách biệt hoàn toàn giữa rừng cây nguyên sơ", 2, "4-5 Bedroom Family Estate", "Đặc biệt xa xỉ ($$$$$+)", "Riêng tư tuyệt đối 100%, hồ bơi chân mây tràn bờ nhìn từ trên cao"},
                {"Cliffside Sanctuary (Mũi Vách Đá Độc Bản)", "Tọa lạc trên mũi đá nhô ra biển độc tôn của toàn khu nghỉ dưỡng", 1, "Presidential Royal Residence", "Tối thượng (VIP Palatial)", "Vị trí kim cương của resort, tầm nhìn 270 độ đại dương vô cực"}
        };

        for (Object[] z : zones) {
            String name = (String) z[0];
            zoneRepo.findByZoneName(name).orElseGet(() -> zoneRepo.save(new ResortZone(
                    name, (String) z[1], (Integer) z[2], (String) z[3], (String) z[4], (String) z[5]
            )));
        }
    }

    private Map<String, VillaCategory> initCategories() {
        Map<String, VillaCategory> map = new HashMap<>();

        Object[][] categories = {
                {"1-Bedroom Garden Villa", 3, new BigDecimal("0.00"), "ACTIVE", 8, 1, "1 PN (King Bed)", "80 - 120 m²", false, "Không (Vườn xanh riêng)", "Thiền tịnh, yên tĩnh, bồn tắm nằm thảo dược, sân vườn biệt lập", "Detox, Stress Relief, Mindful Living"},
                {"1-Bedroom Beachfront Pool Villa", 3, new BigDecimal("2500000.00"), "ACTIVE", 6, 1, "1 PN (King Bed)", "120 - 180 m²", true, "Có (Hồ bơi 25 - 40m²)", "Sát bãi biển, bước chân ra cát trắng, hiên tắm nắng ngắm bình minh", "Couple Rejuvenation, Longevity, Stress Relief"},
                {"2-Bedroom Pool Villa", 6, new BigDecimal("4500000.00"), "ACTIVE", 6, 2, "2 PN (1 King + 1 Twin)", "180 - 250 m²", true, "Có (Hồ bơi 30 - 50m²)", "Bếp ăn gia đình mở, phòng khách rộng, hiên tiệc cocktail hồ bơi", "Family Wellness, Holistic Rebalance"},
                {"3-Bedroom Ocean View Villa", 9, new BigDecimal("7000000.00"), "ACTIVE", 4, 3, "3 PN (2 King + 1 Twin)", "280 - 400 m²", true, "Có (Hồ bơi 45 - 70m²)", "View biển bao quát từ trên đồi, sân vườn nướng BBQ, ban công lộng gió", "Family Wellness, Active Longevity Group"},
                {"4-5 Bedroom Family Estate", 12, new BigDecimal("12000000.00"), "ACTIVE", 2, 5, "4 - 5 PN linh hoạt (3 King + 2 Twin)", "450 - 700 m²", true, "Có (Hồ bơi tràn 60 - 100m²)", "Biệt lập tuyệt đối, sảnh lounge tầng 2, phòng xông hơi riêng", "Corporate Executive Retreat, Multi-Gen Estate"},
                {"Presidential Royal Residence", 16, new BigDecimal("25000000.00"), "ACTIVE", 1, 6, "6 PN Master Suites", "800 - 1500+ m²", true, "Có (Hồ bơi vô cực 150m²)", "Dinh thự độc bản, Quản gia riêng 24/7, rạp chiếu phim, Spa riêng, xe Buggy riêng", "Ultra-Luxury VIP, Royal Wellness Celebration"}
        };

        for (Object[] cat : categories) {
            String name = (String) cat[0];
            VillaCategory entity = categoryRepo.findByCategoryName(name).orElseGet(() -> categoryRepo.save(new VillaCategory(
                    name, (Integer) cat[1], (BigDecimal) cat[2], (String) cat[3], (Integer) cat[4],
                    (Integer) cat[5], (String) cat[6], (String) cat[7], (Boolean) cat[8], (String) cat[9],
                    (String) cat[10], (String) cat[11]
            )));
            map.put(name, entity);
        }

        return map;
    }

    private void initPhysicalVillas(Map<String, VillaCategory> catMap) {
        Object[][] villas = {
                // V101 - V108 (Garden)
                {"1-Bedroom Garden Villa", "V101", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Hướng vườn sinh thái, gần Wellness Pavilion & Spa"},
                {"1-Bedroom Garden Villa", "V102", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Không gian thiền tịnh, rặng dừa xanh mướt"},
                {"1-Bedroom Garden Villa", "V103", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Gần lối dạo bộ thiền hành (Zen Garden)"},
                {"1-Bedroom Garden Villa", "V104", "Tầng 1 (Ground)", "OCCUPIED", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Phù hợp khách Detox cá nhân hoặc cặp đôi"},
                {"1-Bedroom Garden Villa", "V105", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Khuôn viên biệt lập có thảm cỏ riêng"},
                {"1-Bedroom Garden Villa", "V106", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Hiên thưởng trà ngoài trời thoáng mát"},
                {"1-Bedroom Garden Villa", "V107", "Tầng 1 (Ground)", "NEEDS_CLEANING", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Chuẩn bị dọn phòng sau phiên Checkout"},
                {"1-Bedroom Garden Villa", "V108", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Gần phân khu F&B Organic Kitchen"},

                // V201 - V206 (Beachfront)
                {"1-Bedroom Beachfront Pool Villa", "V201", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Sát bãi cát trắng, hồ bơi riêng ngắm bình minh"},
                {"1-Bedroom Beachfront Pool Villa", "V202", "Tầng 1 (Ground)", "OCCUPIED", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "View biển 180 độ, phòng tắm lộ thiên giếng trời"},
                {"1-Bedroom Beachfront Pool Villa", "V203", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Lối đi thẳng ra bờ biển, hiên tắm nắng riêng"},
                {"1-Bedroom Beachfront Pool Villa", "V204", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Trang bị bồn ngâm thủy lực thảo dược ngoài trời"},
                {"1-Bedroom Beachfront Pool Villa", "V205", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Vị trí ngắm hoàng hôn tuyệt đẹp trên biển"},
                {"1-Bedroom Beachfront Pool Villa", "V206", "Tầng 1 (Ground)", "MAINTENANCE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Bảo dưỡng định kỳ hệ thống lọc hồ bơi"},

                // V301 - V306 (Lagoon)
                {"2-Bedroom Pool Villa", "V301", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Phù hợp gia đình nhỏ, bếp nấu mở & phòng khách lớn"},
                {"2-Bedroom Pool Villa", "V302", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Mặt nước tĩnh lặng, cầu gỗ dạo bộ ven hồ"},
                {"2-Bedroom Pool Villa", "V303", "2 Tầng (Duplex)", "OCCUPIED", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("240.00"), true, "Có (Hồ bơi 45m²)", "Phòng Master tầng 2 có ban công ngắm toàn cảnh"},
                {"2-Bedroom Pool Villa", "V304", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("240.00"), true, "Có (Hồ bơi 45m²)", "Khu vực bàn ăn gia đình 6 chỗ kết nối hiên hồ bơi"},
                {"2-Bedroom Pool Villa", "V305", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Hai phòng ngủ khép kín độc lập, bảo đảm riêng tư"},
                {"2-Bedroom Pool Villa", "V306", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Sân vườn bên hiên tích hợp tiểu cảnh nước tĩnh"},

                // V401 - V404 (Ocean Hill)
                {"3-Bedroom Ocean View Villa", "V401", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Tầm nhìn biển bao quát từ đồi cao, sân nướng BBQ"},
                {"3-Bedroom Ocean View Villa", "V402", "2 Tầng (Duplex)", "OCCUPIED", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Phù hợp gia đình đa thế hệ, 3 phòng tắm khép kín"},
                {"3-Bedroom Ocean View Villa", "V403", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Ban công đón gió biển lộng gió, phòng khách rộng"},
                {"3-Bedroom Ocean View Villa", "V404", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Hồ bơi chân mây hướng trực diện hoàng hôn biển"},

                // V501 - V502 (Hillside Cliff)
                {"4-5 Bedroom Family Estate", "V501", "2 Tầng (Estate)", "AVAILABLE", "Đỉnh Đồi Biệt Lập (Hillside Cliff)", "5 PN (3 King + 2 Twin)", 12, new BigDecimal("580.00"), true, "Có (Hồ bơi tràn 80m²)", "Biệt thự đại gia đình, phòng xông hơi riêng, bếp lớn"},
                {"4-5 Bedroom Family Estate", "V502", "2 Tầng (Estate)", "OCCUPIED", "Đỉnh Đồi Biệt Lập (Hillside Cliff)", "5 PN (3 King + 2 Twin)", 12, new BigDecimal("580.00"), true, "Có (Hồ bơi tràn 80m²)", "Phục vụ kỳ nghỉ doanh nghiệp cấp cao, sân tiệc riêng"},

                // V601 (Cliffside Sanctuary)
                {"Presidential Royal Residence", "V601", "2 Tầng (Palatial)", "AVAILABLE", "Mũi Vách Đá Biển (Cliffside Sanctuary)", "6 PN Master Suites", 16, new BigDecimal("1200.00"), true, "Có (Hồ bơi vô cực 150m²)", "Dinh thự Tổng thống độc bản: Rạp chiếu phim, Spa riêng, Butler 24/7"}
        };

        for (Object[] row : villas) {
            String catName = (String) row[0];
            String num = (String) row[1];
            VillaCategory cat = catMap.get(catName);
            if (cat == null) continue;

            villaRepo.findByVillaNumber(num).orElseGet(() -> villaRepo.save(new PhysicalVilla(
                    cat, num, (String) row[2], (String) row[3], (String) row[4], (String) row[5],
                    (Integer) row[6], (BigDecimal) row[7], (Boolean) row[8], (String) row[9], (String) row[10]
            )));
        }
    }

    private void initFunctionalAreas() {
        Object[][] areas = {
                {"Khu Vực Nghỉ Ngơi (Private)", "Master Bedroom (Phòng ngủ chính)", "28 - 45", "1 phòng", "1 phòng", "2 - 4 phòng", "Giường King 2m, nệm organic, tủ walk-in, bàn làm việc, ban công ngắm cảnh", "Không gian nghỉ ngơi chính, view biển/vườn tối ưu"},
                {"Khu Vực Nghỉ Ngơi (Private)", "Standard / Guest Bedroom (Phòng ngủ phụ)", "18 - 28", "0 (Không có)", "1 - 2 phòng", "2 - 4 phòng", "Giường Queen hoặc 2 giường Twin, tủ âm tường, bàn trang điểm", "Linh hoạt cho con cái, người thân hoặc khách đi cùng"},
                {"Khu Vực Nghỉ Ngơi (Private)", "En-suite Bathroom (Phòng tắm khép kín)", "8 - 18", "1 phòng", "2 - 3 phòng", "4 - 7 phòng", "Bồn tắm nằm thảo dược (Bathtub), vách kính tắm đứng, lavabo đôi, bệt tự động", "Bắt buộc đi kèm mỗi PN; hỗ trợ ngâm khoáng/tinh dầu tại phòng"},
                {"Khu Vực Nghỉ Ngơi (Private)", "Dressing / Walk-in Closet", "4 - 8", "1 phòng", "1 - 2 phòng", "2 - 4 phòng", "Hệ tủ áo gỗ mộc, bàn phấn, gương soi toàn thân đèn LED âm tường", "Đảm bảo tính sang trọng và tiện lợi khi lưu trú dài ngày"},
                {"Khu Sinh Hoạt Chung (Social)", "Living Room (Phòng khách)", "30 - 60", "1 phòng (kết hợp)", "1 phòng riêng", "1 - 2 sảnh lounge", "Sofa cao cấp thương hiệu Ý, bàn trà gỗ lũa, Smart TV, âm thanh âm trần", "Không gian sinh hoạt chung kết nối mở ra sân vườn/hồ bơi"},
                {"Khu Sinh Hoạt Chung (Social)", "Dining Area (Khu vực bàn ăn)", "15 - 25", "1 bàn (2-4 ghế)", "1 bàn (6-8 chỗ)", "1 đại tiệc (12-16 chỗ)", "Bàn ăn gỗ óc chó nguyên tấm, đèn thả chùm nghệ thuật, kệ rượu", "Địa điểm phục vụ F&B tận phòng (Villa Dining - M4)"},
                {"Khu Sinh Hoạt Chung (Social)", "Kitchen & Island Bar (Bếp & Quầy Bar)", "12 - 20", "Mini Pantry Bar", "Bếp gia đình hoàn chỉnh", "Bếp bếp đảo + Bar lớn", "Bếp từ âm, tủ lạnh side-by-side, máy pha cà phê, dụng cụ nấu ăn", "Phục vụ chế độ ăn riêng hoặc đầu bếp nấu trực tiếp"},
                {"Khu Sinh Hoạt Chung (Social)", "Powder Room (Vệ sinh chung)", "2.5 - 4.5", "Tích hợp", "1 phòng tầng trệt", "1 - 2 phòng", "Chậu rửa đá tự nhiên, bồn cầu thông minh cao cấp", "Vệ sinh cho khách vãng lai khu vực sinh hoạt chung"},
                {"Khu Ngoại Thất & Thư Giãn", "Private Pool (Hồ bơi riêng)", "25 - 150", "Tùy căn (0 - 30m²)", "Có (40 - 55m²)", "Có (80 - 150m²)", "Lọc điện phân muối khoáng, đèn đổi màu âm nước, thác nước tràn", "Điểm nhấn trải nghiệm cốt lõi của dòng Pool Villa"},
                {"Khu Ngoại Thất & Thư Giãn", "Sun Deck & Pool Terrace (Hiên tắm nắng)", "15 - 40", "1 hiên nhỏ", "1 hiên hồ bơi", "Hiên lớn + Cabana", "Giường tắm nắng ngoài trời chống thấm (Sunbed), dù che lớn, bàn trà", "Khu vực thư giãn ngắm cảnh, tắm nắng và tập Yoga sớm"},
                {"Khu Ngoại Thất & Thư Giãn", "Outdoor BBQ Pavilion (Khu BBQ ngoài trời)", "15 - 30", "Không có", "Tùy chọn sân vườn", "1 nhà chòi riêng", "Bếp nướng BBQ ngoài trời, bàn tiệc gỗ, mái che pergola lam gỗ", "Tổ chức tiệc nướng gia đình ngoài trời theo gói M4"},
                {"Khu Ngoại Thất & Thư Giãn", "Private Garden (Khu vườn riêng)", "40 - 200+", "40 - 80 m²", "80 - 150 m²", "200 - 500 m²", "Thảm cỏ nhung, cây bóng mát nhiệt đới, lối đi rải sỏi dạo bộ", "Mật độ xanh cao, tạo không gian cách ly riêng tư tuyệt đối"},
                {"Khu Phụ Trợ & Tiện Ích Cao Cấp", "Laundry & Utility (Khu giặt phơi/kỹ thuật)", "4 - 8", "Tủ máy giặt sấy", "1 phòng kỹ thuật", "1 phòng riêng", "Máy giặt sấy cao cấp, tủ chứa dung dịch vệ sinh và khăn phòng", "Tiện ích lưu trú dài ngày (Long-stay Retreat)"},
                {"Khu Phụ Trợ & Tiện Ích Cao Cấp", "Private Spa & Sauna (Phòng Xông Hơi Riêng)", "8 - 18", "Không có", "Tùy chọn", "1 phòng xông đôi", "Phòng xông hơi đá muối Himalaya/Sauna khô, giường massage", "Đặc quyền chăm sóc sức khỏe tại phòng cao cấp (M3)"},
                {"Khu Phụ Trợ & Tiện Ích Cao Cấp", "Staff / Maid Room (Phòng quản gia/lái xe)", "6 - 10", "Không có", "Không có", "1 phòng riêng + WC", "Giường đơn, tủ đồ cá nhân, lối vào phụ riêng biệt", "Dành cho quản gia riêng (Butler) hoặc trợ lý đi cùng đoàn VIP"},
                {"Khu Phụ Trợ & Tiện Ích Cao Cấp", "Entertainment Cinema Room (Rạp chiếu phim)", "18 - 35", "Không có", "Không có", "1 phòng giải trí riêng", "Màn chiếu 150 inch, âm thanh vòm Dolby Atmos, sofa ngả da", "Phục vụ giải trí kín đáo đỉnh cao của Dinh thự Tổng thống"}
        };

        for (Object[] a : areas) {
            String roomName = (String) a[1];
            areaRepo.findByRoomName(roomName).orElseGet(() -> areaRepo.save(new VillaFunctionalArea(
                    (String) a[0], roomName, (String) a[2], (String) a[3], (String) a[4], (String) a[5], (String) a[6], (String) a[7]
            )));
        }
    }
}
