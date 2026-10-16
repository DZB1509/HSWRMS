package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.dto.response.RetreatPackageFnbPlanResponse;
import com.heavenstay.hswrms.m4fnb.integration.BookingContextPort;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

/**
 * ============================================================================
 * [TRACEABILITY HEADER]
 * Module: M4 - Food & Beverage Management (F&B)
 * Requirements: SR-FNB-001, US-FNB-003, BR-FNB-002, BR-FNB-004
 * Design Pattern: Domain Service / Immutable Policy Registry
 * Compliance: Decree 13/2023/ND-CP & Decree 356/2025/ND-CP (Sensitive Health Data Minimization)
 * Business Rule: BR-FNB-002 (Package-based dietary entitlement & strict culinary contraindication controls)
 * Description: Manages official Retreat Package F&B Plans and enforces cross-module dietary safety rules.
 * ============================================================================
 */
@Service
public class RetreatPackageFnbService {

    private final Map<String, RetreatPackageFnbPlanResponse> packagePlanRegistry;
    private final ObjectProvider<BookingContextPort> bookingContextPortProvider;

    public RetreatPackageFnbService(ObjectProvider<BookingContextPort> bookingContextPortProvider) {
        this.bookingContextPortProvider = bookingContextPortProvider;
        this.packagePlanRegistry = initializeCanonicalPackagePlans();
    }

    /**
     * Retrieves all 8 canonical Retreat Package F&B Plans.
     */
    public List<RetreatPackageFnbPlanResponse> getAllPackagePlans() {
        return Collections.unmodifiableList(new ArrayList<>(packagePlanRegistry.values()));
    }

    /**
     * Retrieves the specific F&B Plan for a package code.
     */
    public RetreatPackageFnbPlanResponse getPackagePlan(String packageCode) {
        if (packageCode == null || packageCode.isBlank()) {
            throw new ResourceNotFoundException("RetreatPackageFnbPlan", "packageCode", "null");
        }
        String normalizedCode = packageCode.trim().toUpperCase(Locale.ROOT);
        RetreatPackageFnbPlanResponse plan = packagePlanRegistry.get(normalizedCode);
        if (plan == null) {
            throw new ResourceNotFoundException("RetreatPackageFnbPlan", "packageCode", packageCode);
        }
        return plan;
    }

    /**
     * Cross-module integration: Resolves the F&B Plan associated with an active customer retreat booking.
     */
    public RetreatPackageFnbPlanResponse getPlanForBooking(Integer bookingId) {
        BookingContextPort bookingPort = bookingContextPortProvider.getIfAvailable();
        if (bookingPort == null) {
            return getPackagePlan("RET-DETOX-03");
        }
        BookingContextPort.FnbBookingContext booking = bookingPort.getKitchenBookingContext(bookingId);
        if (booking == null || booking.packageCode() == null) {
            return getPackagePlan("RET-DETOX-03");
        }
        return Optional.ofNullable(packagePlanRegistry.get(booking.packageCode().trim().toUpperCase(Locale.ROOT)))
                .orElseGet(() -> getPackagePlan("RET-DETOX-03"));
    }

    /**
     * Clinical & Culinary Safety Validation:
     * Evaluates whether a menu item or recipe conflicts with the package's contraindication safety guidelines.
     */
    public List<String> validatePackageSafetyViolations(String packageCode, String itemName,
            String allergenInfo, String dietaryTags) {
        List<String> violations = new ArrayList<>();
        if (packageCode == null || itemName == null) {
            return violations;
        }

        String code = packageCode.trim().toUpperCase(Locale.ROOT);
        String nameLower = itemName.toLowerCase(Locale.ROOT);
        String allergenLower = allergenInfo == null ? "" : allergenInfo.toLowerCase(Locale.ROOT);
        String tagsLower = dietaryTags == null ? "" : dietaryTags.toLowerCase(Locale.ROOT);

        switch (code) {
            case "RET-MOM-03" -> {
                // Strict Prenatal Safety: 0% caffeine, no uterine stimulant herbs, 100% fully cooked
                if (nameLower.contains("cà phê") || nameLower.contains("coffee") || nameLower.contains("caffeine")
                        || nameLower.contains("trà đen") || nameLower.contains("matcha đậm")
                        || tagsLower.contains("caffeine")) {
                    violations.add("Gói Mẹ Bầu (RET-MOM-03) loại bỏ hoàn toàn caffeine để bảo vệ thai nhi.");
                }
                if (nameLower.contains("ngải cứu") || nameLower.contains("rau răm") || nameLower.contains("đu đủ xanh")
                        || nameLower.contains("rau ngót") || nameLower.contains("mướp đắng")) {
                    violations.add("Thảo dược/nguyên liệu kích thích co bóp tử cung (ngải cứu, rau răm, đu đủ xanh, rau ngót) bị cấm tuyệt đối.");
                }
                if (nameLower.contains("sashimi") || nameLower.contains("sushi") || nameLower.contains("tái")
                        || nameLower.contains("lòng đào") || nameLower.contains("sống") || nameLower.contains("raw")
                        || tagsLower.contains("raw")) {
                    violations.add("Món sống/tái bị cấm tuyệt đối với Mẹ Bầu do nguy cơ nhiễm khuẩn Listeria/Salmonella. Bắt buộc nấu chín kỹ 100%.");
                }
            }
            case "RET-DETOX-03" -> {
                // Pure Detox: Plant-based, 0% refined sugar
                if (nameLower.contains("đường tinh luyện") || nameLower.contains("sốt ngọt") || nameLower.contains("syrup")) {
                    violations.add("Gói Detox (RET-DETOX-03) cấm đường tinh luyện để đạt hiệu quả thanh lọc tế bào tối đa.");
                }
                if (nameLower.contains("chiên rán") || nameLower.contains("mỡ") || nameLower.contains("thịt đỏ")) {
                    violations.add("Gói Detox thuần thực dưỡng (Plant-based) không phục vụ thực phẩm chiên dầu mỡ hoặc thịt đỏ công nghiệp.");
                }
            }
            case "RET-SLEEP-03" -> {
                // Sleep: Avoid stimulants after lunch, avoid heavy spices
                if (nameLower.contains("cà phê") || nameLower.contains("caffeine") || nameLower.contains("nước tăng lực")) {
                    violations.add("Gói Giấc Ngủ Sâu (RET-SLEEP-03) nghiêm cấm chất kích thích thần kinh.");
                }
                if (nameLower.contains("cay nồng") || nameLower.contains("ớt hiểm") || nameLower.contains("quá mặn")) {
                    violations.add("Gói Giấc Ngủ tránh các món cay nóng gây kích thích dạ dày và mất ngủ ban đêm.");
                }
            }
            case "RET-VITAL-05" -> {
                // Calorie Deficit & Macro Balanced: No high fat, deep fried
                if (nameLower.contains("chiên ngập dầu") || nameLower.contains("kem béo") || nameLower.contains("siêu chế biến")) {
                    violations.add("Gói Quản Lý Vóc Dáng (RET-VITAL-05) thâm hụt calo chuẩn 1.400 - 1.600 kcal, hạn chế chất béo bão hòa.");
                }
            }
            default -> {
                // Other packages follow general wellness standards
            }
        }

        return violations;
    }

    public List<String> validatePackageSafetyViolations(String packageCode, String itemName,
            String allergenInfo, List<String> dietaryTags) {
        String tagsJoined = dietaryTags == null ? "" : String.join(", ", dietaryTags);
        return validatePackageSafetyViolations(packageCode, itemName, allergenInfo, tagsJoined);
    }

    /**
     * Initializes the canonical 8 Retreat Package F&B Plans matching resort specifications.
     */
    private static Map<String, RetreatPackageFnbPlanResponse> initializeCanonicalPackagePlans() {
        Map<String, RetreatPackageFnbPlanResponse> registry = new LinkedHashMap<>();

        // 1. RET-DETOX-03
        registry.put("RET-DETOX-03", new RetreatPackageFnbPlanResponse(
                "RET-DETOX-03",
                "3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)",
                2,
                "Detox & Purification",
                "Chế độ Detox thanh lọc chuyên sâu",
                "1.200 - 1.400 kcal/ngày (Kiềm hóa & Thải độc)",
                2, 2, 2,
                "02 bữa sáng thanh lọc, 02 bữa trưa & 02 bữa tối thực dưỡng (Plant-based, 0% đường tinh luyện)",
                "Nước ép cần tây hữu cơ, hạt chia & yến mạch, nước khoáng thanh lọc",
                List.of("Cần tây hữu cơ", "Hạt chia", "Yến mạch nguyên cám", "Rau bina", "Táo xanh"),
                List.of(
                        "02 bữa sáng thanh lọc (Nước ép cần tây hữu cơ, hạt chia & yến mạch)",
                        "02 bữa trưa & 02 bữa tối thực dưỡng (Plant-based, 0% đường tinh luyện)",
                        "Nguyên liệu rau củ hữu cơ rửa tiệt trùng ozone 100%"
                ),
                List.of("Đường tinh luyện", "Thịt đỏ chế biến sẵn", "Dầu mỡ chiên rán công nghiệp", "Nước ngọt có gas"),
                List.of("Nước ép cần tây hạt chia", "Cháo yến mạch thanh lọc", "Salad cầu vồng chanh leo", "Soup nấm củ thực dưỡng")
        ));

        // 2. RET-DETOX-05
        registry.put("RET-DETOX-05", new RetreatPackageFnbPlanResponse(
                "RET-DETOX-05",
                "5D4N Tái Tạo Năng Lượng & Thải Độc Sâu (Deep Reset Detox)",
                4,
                "Deep Reset & Cellular Detox",
                "Chế độ Intermittent Fasting & Clean Eating",
                "1.300 - 1.500 kcal/ngày (Fasting & Kiềm hóa tế bào)",
                4, 4, 4,
                "04 bữa sáng sinh tố thải độc & trái cây GI thấp, 04 bữa trưa dinh dưỡng cao & 04 bữa tối soup thanh nhiệt nhẹ bụng",
                "Nước ion kiềm & nước khoáng giàu Magie bổ sung hàng ngày",
                List.of("Trái cây Low-GI (bưởi, táo xanh, dâu tây)", "Cải xoăn Kale", "Hạt gai dầu", "Nước khoáng Magie"),
                List.of(
                        "04 bữa sáng sinh tố thải độc & trái cây chỉ số GI thấp",
                        "04 bữa trưa dinh dưỡng cao & 04 bữa tối soup thanh nhiệt nhẹ bụng",
                        "Nước ion kiềm & nước khoáng giàu Magie bổ sung hàng ngày duy trì điện giải"
                ),
                List.of("Thực phẩm chỉ số GI cao", "Đường hóa học", "Đồ chiên rán", "Rượu bia"),
                List.of("Sinh tố xanh thải độc Low-GI", "Salad hạt quinoa và bơ sáp", "Soup thanh nhiệt bí ngòi hoa đậu biếc")
        ));

        // 3. RET-SLEEP-03
        registry.put("RET-SLEEP-03", new RetreatPackageFnbPlanResponse(
                "RET-SLEEP-03",
                "3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)",
                2,
                "Circadian Rhythm & Sleep Restoration",
                "Chế độ kích hoạt Melatonin tự nhiên",
                "1.500 - 1.700 kcal/ngày (Giàu Tryptophan & Magie)",
                2, 2, 2,
                "02 bữa sáng giàu Tryptophan, 02 bữa trưa cân bằng Thân - Tâm, 02 bữa tối thanh đạm trước 19:00 kèm sữa hạt sen hạnh nhân",
                "Sữa hạt sen hạnh nhân ấm trước 21:00, Trà hoa cúc La Mã không caffein",
                List.of("Trứng organic lòng đào", "Hạt óc chó", "Quả bơ", "Hạt sen tươi", "Hạnh nhân", "Chuối sứ"),
                List.of(
                        "02 bữa sáng giàu Tryptophan (Trứng organic luộc lòng đào, hạt óc chó, quả bơ)",
                        "02 bữa trưa dinh dưỡng cân bằng Thân - Tâm",
                        "02 bữa tối thanh đạm trước 19:00 kèm sữa hạt sen hạnh nhân ấm để tối ưu hấp thụ Melatonin",
                        "Tuyệt đối không phục vụ caffeine hoặc chất kích thích sau 14:00"
                ),
                List.of("Caffeine (cà phê, trà đen)", "Thực phẩm giàu Tyramine gây tỉnh táo", "Gia vị cay nóng ban đêm"),
                List.of("Trứng organic luộc lòng đào kèm bơ lát", "Cháo hạt sen nấm hương thanh đạm", "Sữa hạt sen hạnh nhân ấm")
        ));

        // 4. RET-STRESS-04
        registry.put("RET-STRESS-04", new RetreatPackageFnbPlanResponse(
                "RET-STRESS-04",
                "4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)",
                3,
                "Stress Relief & Emotional Healing",
                "Thực đơn an thần & cân bằng năng lượng",
                "1.600 - 1.800 kcal/ngày (Giảm Cortisol & Bồi bổ Khí Huyết)",
                3, 3, 3,
                "03 bữa sáng tự chọn năng lượng tích cực, 03 bữa trưa thực dưỡng bồi bổ khí huyết, 03 bữa tối 3 món lành mạnh (Set Menu Mind-Body)",
                "Trà thảo mộc hoa cúc táo đỏ, Nước ép lựu đỏ & việt quất",
                List.of("Ngũ cốc nguyên hạt", "Kỷ tử hữu cơ", "Táo đỏ Tân Cương", "Nấm linh chi", "Đậu lăng"),
                List.of(
                        "03 bữa sáng tự chọn theo danh mục món ăn năng lượng tích cực",
                        "03 bữa trưa thực dưỡng bồi bổ khí huyết",
                        "03 bữa tối 3 món lành mạnh (Set Menu Mind-Body do Bếp trưởng thiết kế)"
                ),
                List.of("Đồ uống kích thích hệ thần kinh giao cảm", "Chất tạo ngọt nhân tạo", "Thức ăn nhanh"),
                List.of("Bát ngũ cốc năng lượng tích cực", "Canh tiềm ngũ vị bồi bổ khí huyết", "Cá tuyết áp chảo kỷ tử táo đỏ")
        ));

        // 5. RET-AGING-04
        registry.put("RET-AGING-04", new RetreatPackageFnbPlanResponse(
                "RET-AGING-04",
                "4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)",
                3,
                "Cellular Longevity & Anti-Aging",
                "Chế độ giàu chất chống oxy hóa (Antioxidant-Rich Diet)",
                "1.500 - 1.700 kcal/ngày (Giàu Polyphenol, Omega-3 & Collagen)",
                3, 3, 3,
                "03 bữa sáng sinh tố quả mọng & sữa chua Hy Lạp, 03 bữa trưa cá hồi Nauy áp chảo, 03 bữa tối giàu Collagen thực vật",
                "Trà hoa cúc hoàng gia dưỡng nhan, Nước ép dâu rừng việt quất",
                List.of("Quả mọng (Berries)", "Sữa chua Hy Lạp hữu cơ", "Cá hồi Nauy", "Dầu ô-liu nguyên chất", "Nấm tuyết"),
                List.of(
                        "03 bữa sáng sinh tố quả mọng (Berries), sữa chua Hy Lạp hữu cơ",
                        "03 bữa trưa cá hồi Nauy áp chảo rau củ hữu cơ & dầu ô-liu nguyên chất",
                        "03 bữa tối giàu Collagen thực vật & trà hoa cúc hoàng gia"
                ),
                List.of("Thực phẩm chiên biến tính (AGEs)", "Đường tinh luyện phá hủy collagen", "Chất béo chuyển hóa (Trans fat)"),
                List.of("Parfait quả mọng sữa chua Hy Lạp", "Cá hồi Nauy áp chảo rau củ sốt ô-liu", "Soup dưỡng nhan nấm tuyết nhựa đào")
        ));

        // 6. RET-ALIGN-03
        registry.put("RET-ALIGN-03", new RetreatPackageFnbPlanResponse(
                "RET-ALIGN-03",
                "3D2N Nắn Chỉnh Cột Sống & Cổ Vai Gáy (Spine & Posture Care)",
                2,
                "Spine Alignment & Joint Mobility",
                "Chế độ dinh dưỡng phục hồi gân cốt & kháng viêm tự nhiên",
                "1.600 - 1.800 kcal/ngày (Giàu Canxi hữu cơ & Curcumin kháng viêm)",
                2, 2, 2,
                "02 bữa sáng giàu đạm thực vật, Canxi & Vitamin D3, 02 bữa trưa & 02 bữa tối hỗ trợ tái tạo khớp (Nghệ tươi, gừng ấm, súp hầm)",
                "Golden Turmeric Latte (Sữa nghệ ấm hữu cơ), Nước ép cà rốt gừng tươi",
                List.of("Nghệ tươi (Curcumin)", "Gừng ấm", "Hạt óc chó", "Súp hầm dưỡng cốt", "Hạt mè đen", "Đậu hũ non"),
                List.of(
                        "02 bữa sáng giàu đạm thực vật, Canxi hữu cơ & Vitamin D3",
                        "02 bữa trưa & 02 bữa tối hỗ trợ tái tạo khớp (Nghệ tươi, gừng ấm, hạt óc chó, súp hầm dưỡng cốt)",
                        "Kiểm soát gia vị kháng viêm tự nhiên không gây kích ứng đường tiêu hóa"
                ),
                List.of("Thực phẩm làm tăng acid uric (nội tạng động vật)", "Thực phẩm lên men chua gắt", "Rượu bia"),
                List.of("Cháo mè đen đậu đỏ dưỡng cốt", "Súp hầm thảo mộc tái tạo khớp", "Đậu hũ non sốt nghệ tươi gừng ấm")
        ));

        // 7. RET-VITAL-05
        registry.put("RET-VITAL-05", new RetreatPackageFnbPlanResponse(
                "RET-VITAL-05",
                "5D4N Quản Lý Vóc Dáng & Đốt Mỡ Tự Nhiên (Vitality Slimming)",
                4,
                "Metabolic Boost & Natural Weight Management",
                "Chế độ Macro-Balanced thâm hụt Calo khoa học (Calorie Deficit)",
                "1.400 - 1.600 kcal/ngày (Định lượng chuẩn Bếp trưởng F&B)",
                4, 4, 4,
                "04 bữa sáng ngũ cốc nguyên cám, 04 bữa trưa giàu nạc protein & rau xanh hấp, 04 bữa tối thanh đạm kiểm soát năng lượng",
                "Trà xanh Matcha hữu cơ kích hoạt trao đổi chất, Nước detox dưa chuột bạc hà",
                List.of("Ngũ cốc nguyên cám", "Ức gà hữu cơ", "Thịt bò thăn nạc", "Bông cải xanh", "Cải xoăn Kale"),
                List.of(
                        "Bếp trưởng F&B (M4) định lượng khẩu phần chuẩn 1.400 - 1.600 kcal/ngày",
                        "04 bữa sáng ngũ cốc nguyên cám + 04 bữa trưa giàu nạc protein & rau xanh hấp + 04 bữa tối thanh đạm",
                        "Giảm tối đa lượng muối (dưới 5g/ngày) để tránh tích nước mô"
                ),
                List.of("Thực phẩm chiên ngập dầu", "Nước sốt béo ngậy có đường", "Đồ uống đóng lon", "Bánh ngọt"),
                List.of("Bát ngũ cốc nguyên cám yến mạch", "Ức gà hữu cơ áp chảo thảo mộc & bông cải hấp", "Salad thăn bò áp chảo ít béo")
        ));

        // 8. RET-MOM-03
        registry.put("RET-MOM-03", new RetreatPackageFnbPlanResponse(
                "RET-MOM-03",
                "3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Prenatal Care)",
                2,
                "Nurturing Prenatal Care & Fetal Safety",
                "Chế độ dinh dưỡng an thai lành tính",
                "2.000 - 2.200 kcal/ngày (Giàu Axit Folic, Sắt, Canxi & DHA)",
                2, 2, 2,
                "Thực đơn 3 bữa/ngày giàu Axit Folic, Sắt, Canxi và DHA từ tự nhiên",
                "Sữa hạt dừa hạnh nhân tiệt trùng, Nước dừa xiêm tươi mát, Trà thảo mộc rooibos không caffein",
                List.of("Rau bina (chân vịt)", "Cá hồi chín kỹ", "Thịt nạc bắp bò chín mềm", "Hạt óc chó", "Hạnh nhân", "Trứng hữu cơ chín kỹ"),
                List.of(
                        "Thực đơn 3 bữa/ngày giàu Axit Folic, Sắt, Canxi và DHA từ tự nhiên",
                        "100% nguyên liệu nuôi trồng hữu cơ có chứng nhận",
                        "Loại bỏ hoàn toàn caffeine và thảo dược gây co bóp tử cung",
                        "100% thức ăn phải được chế biến chín kỹ tuyệt đối để loại trừ rủi ro vi khuẩn"
                ),
                List.of(
                        "Caffeine (Cà phê, trà đen)",
                        "Thảo dược co bóp tử cung (Rau răm, ngải cứu, đu đủ xanh, rau ngót, mướp đắng)",
                        "Món sống/tái (Sashimi, sushi, trứng lòng đào, steak tái, phô mai chưa tiệt trùng)"
                ),
                List.of("Cháo cá hồi chín kỹ hạt sen bí đỏ", "Bò hầm đậu ngự cà rốt chín mềm", "Canh rau bina thịt băm nấu kỹ")
        ));

        return registry;
    }
}
