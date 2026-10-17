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
    private final com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository packageRepo;

    public VillaInventoryDataInitializer(ResortZoneRepository zoneRepo,
                                         VillaCategoryRepository categoryRepo,
                                         PhysicalVillaRepository villaRepo,
                                         VillaFunctionalAreaRepository areaRepo,
                                         com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository packageRepo) {
        this.zoneRepo = zoneRepo;
        this.categoryRepo = categoryRepo;
        this.villaRepo = villaRepo;
        this.areaRepo = areaRepo;
        this.packageRepo = packageRepo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Initializing HSWRMS Villa Inventory Master Data (27 Villas, 6 Categories, 6 Zones, Packages)...");

        initZones();
        Map<String, VillaCategory> categoryMap = initCategories();
        initPhysicalVillas(categoryMap);
        initFunctionalAreas();
        initRetreatPackages();

        log.info("HSWRMS Villa Inventory Master Data Initialized successfully.");
    }

    private void initRetreatPackages() {
        Object[][] pkgs = {
                {"RET-DETOX-03", "3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)", "Detox & Cleansing", 2, new BigDecimal("12500000"), "ACTIVE"},
                {"RET-DETOX-05", "5D4N Tái Tạo Năng Lượng & Thải Độc Sâu (Deep Reset Detox)", "Deep Detoxification", 4, new BigDecimal("24800000"), "ACTIVE"},
                {"RET-SLEEP-03", "3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)", "Sleep Improvement", 2, new BigDecimal("11800000"), "ACTIVE"},
                {"RET-STRESS-04", "4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)", "Stress Reduction", 3, new BigDecimal("17500000"), "ACTIVE"},
                {"RET-AGING-04", "4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)", "Anti-Aging & Cellular Care", 3, new BigDecimal("22000000"), "ACTIVE"},
                {"RET-ALIGN-03", "3D2N Nắn Chỉnh Cột Sống & Cổ Vai Gáy (Spine & Posture Care)", "Physical Alignment", 2, new BigDecimal("13200000"), "ACTIVE"},
                {"RET-VITAL-05", "5D4N Quản Lý Vóc Dáng & Đốt Mỡ Tự Nhiên (Vitality Slimming)", "Fitness & Weight Loss", 4, new BigDecimal("26500000"), "ACTIVE"},
                {"RET-MOM-03", "3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Prenatal Care)", "Maternal Wellness", 2, new BigDecimal("14000000"), "ACTIVE"}
        };

        for (Object[] p : pkgs) {
            String code = (String) p[0];
            String name = (String) p[1];
            packageRepo.findByPackageCode(code).or(() -> packageRepo.findByPackageName(name)).ifPresentOrElse(
                    existing -> {
                        existing.setPackageCode(code);
                        existing.setPackageName(name);
                        existing.setWellnessGoal((String) p[2]);
                        existing.setDurationNights((Integer) p[3]);
                        existing.setBasePrice((BigDecimal) p[4]);
                        existing.setPackageStatus((String) p[5]);
                        packageRepo.save(existing);
                    },
                    () -> {
                        com.heavenstay.hswrms.m2booking.entity.RetreatPackage entity =
                                new com.heavenstay.hswrms.m2booking.entity.RetreatPackage(
                                        name, (String) p[2], (Integer) p[3], (BigDecimal) p[4], (String) p[5]
                                );
                        entity.setPackageCode(code);
                        packageRepo.save(entity);
                    }
            );
        }
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
                {"1-Bedroom Garden Villa", 3, new BigDecimal("0.00"), "ACTIVE", 8, 1, "1 PN (King Bed)", "80 - 120 m²", false, "Không (Vườn xanh riêng)", "Thiền tịnh, yên tĩnh, bồn tắm nằm thảo dược, sân vườn biệt lập", "Detox, Stress Relief, Mindful Living", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", "Vườn thiền riêng biệt lập | Bồn tắm khoáng thảo mộc | Gần Spa Pavilion"},
                {"1-Bedroom Beachfront Pool Villa", 3, new BigDecimal("2500000.00"), "ACTIVE", 6, 1, "1 PN (King Bed)", "120 - 180 m²", true, "Có (Hồ bơi 25 - 40m²)", "Sát bãi biển, bước chân ra cát trắng, hiên tắm nắng ngắm bình minh", "Couple Rejuvenation, Longevity, Stress Relief", new BigDecimal("7200000"), "1 Super King Bed (2.0m x 2.2m)", 2, 1, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", "Hồ bơi 30m² sát biển | View biển 180 độ | Lối đi thẳng ra bờ cát trắng"},
                {"2-Bedroom Pool Villa", 6, new BigDecimal("4500000.00"), "ACTIVE", 6, 2, "2 PN (1 King + 1 Twin)", "180 - 250 m²", true, "Có (Hồ bơi 30 - 50m²)", "Bếp ăn gia đình mở, phòng khách rộng, hiên tiệc cocktail hồ bơi", "Family Wellness, Holistic Rebalance", new BigDecimal("9500000"), "1 King Bed + 2 Twin Beds", 4, 2, "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", "Hồ bơi 40-45m² | Bếp mở & phòng khách lớn | 2 phòng ngủ khép kín hoàn toàn"},
                {"3-Bedroom Ocean View Villa", 9, new BigDecimal("7000000.00"), "ACTIVE", 4, 3, "3 PN (2 King + 1 Twin)", "280 - 400 m²", true, "Có (Hồ bơi 45 - 70m²)", "View biển bao quát từ trên đồi, sân vườn nướng BBQ, ban công lộng gió", "Family Wellness, Active Longevity Group", new BigDecimal("12800000"), "2 King Beds + 2 Twin Beds", 6, 3, "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "Hồ bơi chân mây 55m² | Tầm nhìn đỉnh cao vịnh biển | Sân nướng BBQ ngoài trời"},
                {"4-5 Bedroom Family Estate", 12, new BigDecimal("12000000.00"), "ACTIVE", 2, 5, "4 - 5 PN linh hoạt (3 King + 2 Twin)", "450 - 700 m²", true, "Có (Hồ bơi tràn 60 - 100m²)", "Biệt lập tuyệt đối, sảnh lounge tầng 2, phòng xông hơi riêng", "Corporate Executive Retreat, Multi-Gen Estate", new BigDecimal("18500000"), "3 King Beds + 4 Twin Beds", 10, 2, "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80", "Hồ bơi tràn 80m² | Phòng Sauna đá muối riêng | Biệt lập 100% giữa thiên nhiên"},
                {"Presidential Royal Residence", 16, new BigDecimal("25000000.00"), "ACTIVE", 1, 6, "6 PN Master Suites", "800 - 1500+ m²", true, "Có (Hồ bơi vô cực 150m²)", "Dinh thự độc bản, Quản gia riêng 24/7, rạp chiếu phim, Spa riêng, xe Buggy riêng", "Ultra-Luxury VIP, Royal Wellness Celebration", new BigDecimal("35000000"), "4 Master Kings + 4 Queen Beds", 12, 4, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", "Hồ bơi vô cực 150m² | Quản gia Butler phục vụ 24/7 | Rạp chiếu phim & Private Spa riêng"}
        };

        for (Object[] cat : categories) {
            String name = (String) cat[0];
            VillaCategory entity = categoryRepo.findByCategoryName(name).orElseGet(() -> {
                VillaCategory newCat = new VillaCategory(
                        name, (Integer) cat[1], (BigDecimal) cat[2], (String) cat[3], (Integer) cat[4],
                        (Integer) cat[5], (String) cat[6], (String) cat[7], (Boolean) cat[8], (String) cat[9],
                        (String) cat[10], (String) cat[11]
                );
                newCat.setBasePrice((BigDecimal) cat[12]);
                newCat.setBedType((String) cat[13]);
                newCat.setMaxAdults((Integer) cat[14]);
                newCat.setMaxChildren((Integer) cat[15]);
                newCat.setImage((String) cat[16]);
                newCat.setHighlights((String) cat[17]);
                return categoryRepo.save(newCat);
            });
            // Update prices if needed
            if (entity.getBasePrice() == null) {
                entity.setBasePrice((BigDecimal) cat[12]);
                entity.setBedType((String) cat[13]);
                entity.setMaxAdults((Integer) cat[14]);
                entity.setMaxChildren((Integer) cat[15]);
                entity.setImage((String) cat[16]);
                entity.setHighlights((String) cat[17]);
                entity = categoryRepo.save(entity);
            }
            map.put(name, entity);
        }

        return map;
    }

    private void initPhysicalVillas(Map<String, VillaCategory> catMap) {
        Object[][] villas = {
                // V101 - V108 (Garden)
                {"1-Bedroom Garden Villa", "V101", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Hướng vườn sinh thái, gần Wellness Pavilion & Spa", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", "Vườn thiền riêng, Bồn tắm thảo dược, Wi-Fi 6 tốc độ cao, Hiên trà ngoài trời"},
                {"1-Bedroom Garden Villa", "V102", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Không gian thiền tịnh, rặng dừa xanh mướt", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", "Vườn chuối cảnh quan, Bồn ngâm khoáng, Sofa đọc sách, Máy lọc không khí"},
                {"1-Bedroom Garden Villa", "V103", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Gần lối dạo bộ thiền hành (Zen Garden)", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", "Đường dạo sỏi trắng thiền, Bồn tắm ngoài trời kín đáo, Trà thảo dược Welcome"},
                {"1-Bedroom Garden Villa", "V104", "Tầng 1 (Ground)", "OCCUPIED", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Phù hợp khách Detox cá nhân hoặc cặp đôi", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80", "Thảm tập Yoga định tuyến, Loa thiền chuông xoay, Đèn tinh dầu trầm hương"},
                {"1-Bedroom Garden Villa", "V105", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Khuôn viên biệt lập có thảm cỏ riêng", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80", "Sân cỏ tự nhiên riêng, Ghế lười thư giãn, Bồn tắm đá mài tự nhiên"},
                {"1-Bedroom Garden Villa", "V106", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Hiên thưởng trà ngoài trời thoáng mát", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80", "Bộ bàn trà đạo tử sa, Góc đọc sách ngắm hoa, Giường nệm cao su non"},
                {"1-Bedroom Garden Villa", "V107", "Tầng 1 (Ground)", "NEEDS_CLEANING", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Chuẩn bị dọn phòng sau phiên Checkout", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80", "Gần khu dịch vụ dọn phòng, Bồn tắm sục, Tinh dầu sả chanh khử khuẩn"},
                {"1-Bedroom Garden Villa", "V108", "Tầng 1 (Ground)", "AVAILABLE", "Khu Vườn Nhiệt Đới (Garden Zone)", "1 King Bed", 3, new BigDecimal("105.00"), false, "Không (Vườn riêng)", "Gần phân khu F&B Organic Kitchen", new BigDecimal("4500000"), "1 King Bed (1.8m x 2.0m)", 2, 1, "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80", "Thuận tiện gọi thực đơn Detox nóng, Vườn thảo mộc cạnh hiên, TV 4K"},

                // V201 - V206 (Beachfront)
                {"1-Bedroom Beachfront Pool Villa", "V201", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Sát bãi cát trắng, hồ bơi riêng ngắm bình minh", new BigDecimal("7200000"), "1 Super King Bed (2.0m x 2.2m)", 2, 1, "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80", "Hồ bơi sát cát trắng, Giường phơi nắng đôi, Lối đi riêng ra biển, Bồn tắm view biển"},
                {"1-Bedroom Beachfront Pool Villa", "V202", "Tầng 1 (Ground)", "OCCUPIED", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "View biển 180 độ, phòng tắm lộ thiên giếng trời", new BigDecimal("7200000"), "1 Super King Bed (2.0m x 2.2m)", 2, 1, "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80", "Phòng tắm thiên nhiên lộ thiên, Bể ngâm nước ấm, Rượu vang đón tiếp, Dịch vụ hoa tươi"},
                {"1-Bedroom Beachfront Pool Villa", "V203", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Lối đi thẳng ra bờ biển, hiên tắm nắng riêng", new BigDecimal("7200000"), "1 Super King Bed (2.0m x 2.2m)", 2, 1, "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", "Hiên tắm nắng gỗ Teak, Ghế dù bãi biển, Ống nhòm ngắm hải âu, Hệ thống loa Bluetooth"},
                {"1-Bedroom Beachfront Pool Villa", "V204", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Trang bị bồn ngâm thủy lực thảo dược ngoài trời", new BigDecimal("7200000"), "1 Super King Bed (2.0m x 2.2m)", 2, 1, "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", "Bồn Jacuzzi ngoài trời, Liệu trình muối biển tẩy da chết tại villa, Máy pha cafe Nespresso"},
                {"1-Bedroom Beachfront Pool Villa", "V205", "Tầng 1 (Ground)", "AVAILABLE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Vị trí ngắm hoàng hôn tuyệt đẹp trên biển", new BigDecimal("7200000"), "1 Super King Bed (2.0m x 2.2m)", 2, 1, "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80", "Góc ngắm hoàng hôn triệu đô, Đèn chiếu sáng hồ bơi đổi màu, Thực đơn BBQ bãi biển"},
                {"1-Bedroom Beachfront Pool Villa", "V206", "Tầng 1 (Ground)", "MAINTENANCE", "Phân Khu Sát Biển (Beachfront)", "1 King Bed", 3, new BigDecimal("150.00"), true, "Có (Hồ bơi 30m²)", "Bảo dưỡng định kỳ hệ thống lọc hồ bơi", new BigDecimal("7200000"), "1 Super King Bed (2.0m x 2.2m)", 2, 1, "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", "Đang căn chỉnh điện phân muối hồ bơi, Khử khoáng đường ống nước biển"},

                // V301 - V306 (Lagoon)
                {"2-Bedroom Pool Villa", "V301", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Phù hợp gia đình nhỏ, bếp nấu mở & phòng khách lớn", new BigDecimal("9500000"), "1 King Bed + 2 Twin Beds", 4, 2, "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80", "Bếp gia đình tiện nghi, Bàn ăn 6 chỗ, Hồ bơi trẻ em nông, Phòng khách thông thoáng"},
                {"2-Bedroom Pool Villa", "V302", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Mặt nước tĩnh lặng, cầu gỗ dạo bộ ven hồ", new BigDecimal("9500000"), "1 King Bed + 2 Twin Beds", 4, 2, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", "Cầu gỗ câu cá thư giãn, Hồ sen sinh thái cạnh hồ bơi, Set trà thảo dược cho gia đình"},
                {"2-Bedroom Pool Villa", "V303", "2 Tầng (Duplex)", "OCCUPIED", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("240.00"), true, "Có (Hồ bơi 45m²)", "Phòng Master tầng 2 có ban công ngắm toàn cảnh", new BigDecimal("9500000"), "1 King Bed + 2 Twin Beds", 4, 2, "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", "Thiết kế Duplex hiện đại, Cầu thang gỗ kính sang trọng, Ban công ngắm đầm sen"},
                {"2-Bedroom Pool Villa", "V304", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("240.00"), true, "Có (Hồ bơi 45m²)", "Khu vực bàn ăn gia đình 6 chỗ kết nối hiên hồ bơi", new BigDecimal("9500000"), "1 King Bed + 2 Twin Beds", 4, 2, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80", "Bàn tiệc kết nối hồ bơi, Duplex 2 tầng, Tủ rượu gia đình, Bồn tắm nằm thảo dược"},
                {"2-Bedroom Pool Villa", "V305", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Hai phòng ngủ khép kín độc lập, bảo đảm riêng tư", new BigDecimal("9500000"), "1 King Bed + 2 Twin Beds", 4, 2, "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80", "2 phòng ngủ độc lập, Hồ bơi 40m², Sân vườn nhiệt đới, Mini bar miễn phí"},
                {"2-Bedroom Pool Villa", "V306", "Tầng 1 (Ground)", "AVAILABLE", "Khu Đầm Phá & Vườn (Lagoon/Garden)", "2 PN (1 King + 1 Twin)", 6, new BigDecimal("220.00"), true, "Có (Hồ bơi 40m²)", "Sân vườn bên hiên tích hợp tiểu cảnh nước tĩnh", new BigDecimal("9500000"), "1 King Bed + 2 Twin Beds", 4, 2, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", "Tiểu cảnh nước phong thủy, Hồ bơi muối điện phân, Phòng khách mở, Smart Home"},

                // V401 - V404 (Ocean Hill)
                {"3-Bedroom Ocean View Villa", "V401", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Tầm nhìn biển bao quát từ đồi cao, sân nướng BBQ", new BigDecimal("12800000"), "2 King Beds + 2 Twin Beds", 6, 3, "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", "Bếp BBQ sân thượng, Hồ bơi vô cực nhìn ra vịnh, Dịch vụ đầu bếp tại chỗ, Ghế tắm nắng đôi"},
                {"3-Bedroom Ocean View Villa", "V402", "2 Tầng (Duplex)", "OCCUPIED", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Phù hợp gia đình đa thế hệ, 3 phòng tắm khép kín", new BigDecimal("12800000"), "2 King Beds + 2 Twin Beds", 6, 3, "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80", "3 phòng tắm bồn sục jacuzzi riêng, Phòng sinh hoạt gia đình lớn, Sofa chữ L cao cấp"},
                {"3-Bedroom Ocean View Villa", "V403", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Ban công đón gió biển lộng gió, phòng khách rộng", new BigDecimal("12800000"), "2 King Beds + 2 Twin Beds", 6, 3, "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80", "Ban công panorama 270 độ, Bàn tiệc rượu ngoài trời, Hệ thống đèn rọi nghệ thuật"},
                {"3-Bedroom Ocean View Villa", "V404", "2 Tầng (Duplex)", "AVAILABLE", "Khu Đồi Hướng Biển (Ocean Hill)", "3 PN (2 King + 1 Twin)", 9, new BigDecimal("350.00"), true, "Có (Hồ bơi 55m²)", "Hồ bơi chân mây hướng trực diện hoàng hôn biển", new BigDecimal("12800000"), "2 King Beds + 2 Twin Beds", 6, 3, "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80", "Hồ bơi kính viền chân mây, Dịch vụ trà chiều hoàng hôn, Xe điện Buggy phục vụ riêng"},

                // V501 - V502 (Hillside Cliff)
                {"4-5 Bedroom Family Estate", "V501", "2 Tầng (Estate)", "AVAILABLE", "Đỉnh Đồi Biệt Lập (Hillside Cliff)", "5 PN (3 King + 2 Twin)", 12, new BigDecimal("580.00"), true, "Có (Hồ bơi tràn 80m²)", "Biệt thự đại gia đình, phòng xông hơi riêng, bếp lớn", new BigDecimal("18500000"), "3 King Beds + 4 Twin Beds", 10, 2, "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80", "Hồ bơi tràn 80m², Phòng Sauna đá muối riêng, Bếp đảo bếp trưởng, Sân vườn 300m²"},
                {"4-5 Bedroom Family Estate", "V502", "2 Tầng (Estate)", "OCCUPIED", "Đỉnh Đồi Biệt Lập (Hillside Cliff)", "5 PN (3 King + 2 Twin)", 12, new BigDecimal("580.00"), true, "Có (Hồ bơi tràn 80m²)", "Phục vụ kỳ nghỉ doanh nghiệp cấp cao, sân tiệc riêng", new BigDecimal("18500000"), "3 King Beds + 4 Twin Beds", 10, 2, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80", "Sảnh tiệc riêng 16 người, Sauna khô & ướt, Hồ bơi 80m², Phòng quản gia riêng"},

                // V601 (Cliffside Sanctuary)
                {"Presidential Royal Residence", "V601", "2 Tầng (Palatial)", "AVAILABLE", "Mũi Vách Đá Biển (Cliffside Sanctuary)", "6 PN Master Suites", 16, new BigDecimal("1200.00"), true, "Có (Hồ bơi vô cực 150m²)", "Dinh thự Tổng thống độc bản: Rạp chiếu phim, Spa riêng, Butler 24/7", new BigDecimal("35000000"), "4 Master Kings + 4 Queen Beds", 12, 4, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", "Hồ bơi vô cực 150m², Quản gia riêng 24/7, Rạp chiếu phim Dolby Atmos, Xe Buggy riêng, Khu Spa & Sauna đôi"}
        };

        for (Object[] row : villas) {
            String catName = (String) row[0];
            String num = (String) row[1];
            VillaCategory cat = catMap.get(catName);
            if (cat == null) continue;

            PhysicalVilla v = villaRepo.findByVillaNumber(num).orElseGet(() -> new PhysicalVilla(
                    cat, num, (String) row[2], (String) row[3], (String) row[4], (String) row[5],
                    (Integer) row[6], (BigDecimal) row[7], (Boolean) row[8], (String) row[9], (String) row[10]
            ));

            v.setNightlyRate((BigDecimal) row[11]);
            v.setBedType((String) row[12]);
            v.setMaxAdults((Integer) row[13]);
            v.setMaxChildren((Integer) row[14]);
            v.setImage((String) row[15]);
            v.setAmenities((String) row[16]);
            villaRepo.save(v);
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
