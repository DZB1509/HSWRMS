import type { SpaTreatmentItem, RetreatPackageItem, TreatmentRoomItem } from '../types/spaManagement';

/**
 * HSWRMS Spa & Therapy Inventory
 * Source: 02_Requirement/Screen_Inventory/Goi_Dich_Vu_Spa_Tri_Lieu_HSWRMS.xlsx
 */

export const SPA_TREATMENTS_INVENTORY: SpaTreatmentItem[] = [
  {
    "id": "TRT-SPA-MASS-01",
    "treatmentCode": "SPA-MASS-01",
    "treatmentName": "Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)",
    "category": "Body Massage",
    "durationMinutes": 90,
    "basePrice": 1650000,
    "roomCompatibility": "Phòng Massage Standard/VIP",
    "therapistQualification": "Chứng chỉ Body Therapy & Đá nóng",
    "contraindications": "Huyết áp cao chưa kiểm soát, vết thương hở ngoài da",
    "description": "Dùng đá muối khoáng nóng thâm nhập mô sâu, giãn cơ, lưu thông khí huyết",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-02",
    "treatmentCode": "SPA-MASS-02",
    "treatmentName": "Massage Cơ Sâu Giải Phóng Căng Thẳng (Deep Tissue)",
    "category": "Body Massage",
    "durationMinutes": 75,
    "basePrice": 1450000,
    "roomCompatibility": "Phòng Massage Standard/VIP",
    "therapistQualification": "Chứng chỉ Trị liệu Cơ xương khớp",
    "contraindications": "Phụ nữ mang thai, người loãng xương nặng, chấn thương mới",
    "description": "Tác động lực sâu giải tỏa bó cơ vai, lưng, hông do ngồi sai tư thế",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-03",
    "treatmentCode": "SPA-MASS-03",
    "treatmentName": "Trị Liệu Dẫn Lưu Bạch Huyết (Manual Lymphatic Drainage)",
    "category": "Detox Therapy",
    "durationMinutes": 75,
    "basePrice": 1550000,
    "roomCompatibility": "Phòng Massage Standard/VIP",
    "therapistQualification": "Chứng chỉ Lymphatic Drainage",
    "contraindications": "Suy tim xung huyết, huyết khối tĩnh mạch, nhiễm trùng cấp",
    "description": "Kỹ thuật vuốt nhẹ kích thích hệ bạch huyết thải độc tố tự nhiên",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-04",
    "treatmentCode": "SPA-MASS-04",
    "treatmentName": "Massage Bấm Huyệt Truyền Thống Việt Nam (Vietnamese Acupressure)",
    "category": "Body Massage",
    "durationMinutes": 60,
    "basePrice": 1150000,
    "roomCompatibility": "Phòng Massage Standard/VIP",
    "therapistQualification": "Chứng chỉ Y học Cổ truyền / Xoa bóp bấm huyệt",
    "contraindications": "Gãy xương chưa lành, sốt cao, phụ nữ có thai",
    "description": "Kết hợp bấm 36 huyệt đạo chính và giác hơi thảo dược làm ấm kinh lạc",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-05",
    "treatmentCode": "SPA-MASS-05",
    "treatmentName": "Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)",
    "category": "Herbal Therapy",
    "durationMinutes": 75,
    "basePrice": 1350000,
    "roomCompatibility": "Phòng Massage Standard/VIP",
    "therapistQualification": "Chứng chỉ Thảo dược trị liệu",
    "contraindications": "Dị ứng với ngải cứu, gừng, quế; da nhạy cảm nhiệt độ",
    "description": "Chườm túi thảo mộc ấm nóng lên các điểm đau nhức phong thấp",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-06",
    "treatmentCode": "SPA-MASS-06",
    "treatmentName": "Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)",
    "category": "Maternal Care",
    "durationMinutes": 60,
    "basePrice": 1250000,
    "roomCompatibility": "Phòng Massage VIP (Có gối bầu)",
    "therapistQualification": "Chứng chỉ Massage Thai kỳ chuyên nghiệp",
    "contraindications": "Thai dưới 12 tuần, tiền sản giật, dọa sảy thai",
    "description": "Động tác êm dịu giúp mẹ bầu xua tan căng thẳng, phù chân và mỏi lưng",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HEAL-01",
    "treatmentCode": "SPA-HEAL-01",
    "treatmentName": "Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Singing Bowl)",
    "category": "Energy Healing",
    "durationMinutes": 60,
    "basePrice": 1200000,
    "roomCompatibility": "Phòng Thiền Tĩnh Tâm / Chuông xoay",
    "therapistQualification": "Chứng chỉ Master Sound Healing",
    "contraindications": "Người đeo máy tạo nhịp tim (Pacemaker), động kinh",
    "description": "Tần số âm thanh và sóng rung làm dịu sóng não, đưa tâm trí về trạng thái Alpha",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HEAL-02",
    "treatmentCode": "SPA-HEAL-02",
    "treatmentName": "Liệu Pháp Shirodhara Nhỏ Dầu Luân Xa Trán (Ayurvedic Shirodhara)",
    "category": "Ayurveda Therapy",
    "durationMinutes": 60,
    "basePrice": 1750000,
    "roomCompatibility": "Phòng Trị Liệu Ayurveda Chuyên Biệt",
    "therapistQualification": "Chứng chỉ Liệu trình Ayurveda",
    "contraindications": "Chấn thương đầu cổ, viêm xoang cấp tính",
    "description": "Dòng dầu thảo mộc ấm nhỏ liên tục lên luân xa con mắt thứ 3, trị mất ngủ sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1512290900672-1f062c3f81e8?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HEAL-03",
    "treatmentCode": "SPA-HEAL-03",
    "treatmentName": "Bấm Huyệt Thải Độc Bụng Chi Nei Tsang (Taoist Abdominal Massage)",
    "category": "Holistic Therapy",
    "durationMinutes": 60,
    "basePrice": 1300000,
    "roomCompatibility": "Phòng Massage Standard/VIP",
    "therapistQualification": "Chứng chỉ Nội tạng Chi Nei Tsang",
    "contraindications": "Phụ nữ mang thai, vừa phẫu thuật bụng dưới 6 tháng",
    "description": "Thao tác trên vùng rốn và nội tạng giải phóng cảm xúc tiêu cực và đầy hơi",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-FACE-01",
    "treatmentCode": "SPA-FACE-01",
    "treatmentName": "Trị Liệu Nâng Cơ Guasha Ngọc Thạch (Jade Guasha Facelift)",
    "category": "Facial Care",
    "durationMinutes": 75,
    "basePrice": 1400000,
    "roomCompatibility": "Phòng Chăm Sóc Da Mặt (Facial Room)",
    "therapistQualification": "Chứng chỉ Thẩm mỹ Da liễu / Facial Care",
    "contraindications": "Mụn viêm bọc mủ nặng, vừa tiêm filler/botox dưới 2 tuần",
    "description": "Kỹ thuật miết đá ngọc bích kích thích collagen, thon gọn đường viền hàm V-line",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-FACE-02",
    "treatmentCode": "SPA-FACE-02",
    "treatmentName": "Cấp Ẩm Phục Hồi Tế Bào Chuyên Sâu (Deep Hydration & Repair)",
    "category": "Facial Care",
    "durationMinutes": 60,
    "basePrice": 1250000,
    "roomCompatibility": "Phòng Chăm Sóc Da Mặt (Facial Room)",
    "therapistQualification": "Chứng chỉ Thẩm mỹ Da liễu / Facial Care",
    "contraindications": "Dị ứng với chiết xuất Hyaluronic Acid hoặc nha đam",
    "description": "Điện di tinh chất kết hợp mặt nạ tế bào gốc làm dịu da cháy nắng, mất nước",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1512290903671-17adc540429b?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-FACE-03",
    "treatmentCode": "SPA-FACE-03",
    "treatmentName": "Trẻ Hóa Da Tảo Biển Hữu Cơ (Organic Marine Collagen)",
    "category": "Anti-Aging Facial",
    "durationMinutes": 75,
    "basePrice": 1600000,
    "roomCompatibility": "Phòng Chăm Sóc Da Mặt (Facial Room)",
    "therapistQualification": "Chứng chỉ Thẩm mỹ Da liễu Chuyên sâu",
    "contraindications": "Dị ứng hải sản/tảo biển, da mỏng lộ mao mạch nặng",
    "description": "Bổ sung vi khoáng biển sâu làm mờ nếp nhăn và cải thiện sắc tố da",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-BODY-01",
    "treatmentCode": "SPA-BODY-01",
    "treatmentName": "Tẩy Tế Bào Chết Cà Phê Đắk Lắk & Dừa (Body Polish)",
    "category": "Body Scrub",
    "durationMinutes": 45,
    "basePrice": 850000,
    "roomCompatibility": "Phòng Tắm Thủy Lực / Vichy Shower",
    "therapistQualification": "Chứng chỉ Chăm sóc Cơ thể",
    "contraindications": "Da trầy xước, cháy nắng, chàm vảy nến diện rộng",
    "description": "Loại bỏ sừng già chết, mang lại làn da mềm mịn thơm tự nhiên",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-BODY-02",
    "treatmentCode": "SPA-BODY-02",
    "treatmentName": "Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)",
    "category": "Body Wrap",
    "durationMinutes": 60,
    "basePrice": 1100000,
    "roomCompatibility": "Phòng Trị Liệu Toàn Thân (Wrap/Bath)",
    "therapistQualification": "Chứng chỉ Chăm sóc Cơ thể",
    "contraindications": "Bệnh tim mạch, hội chứng sợ không gian kín (Claustrophobia)",
    "description": "Quấn màng giữ nhiệt cùng bùn khoáng tự nhiên, tăng tuần hoàn và giữ ẩm",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HYDRO-01",
    "treatmentCode": "SPA-HYDRO-01",
    "treatmentName": "Thủy Trị Liệu Dòng Chảy Áp Lực Vichy Shower (Vichy Rain)",
    "category": "Hydrotherapy",
    "durationMinutes": 45,
    "basePrice": 950000,
    "roomCompatibility": "Phòng Vòi Phun Vichy Shower",
    "therapistQualification": "Chứng chỉ Kỹ thuật viên Thủy liệu pháp",
    "contraindications": "Nhiễm trùng da, viêm tai giữa chưa hồi phục",
    "description": "Hệ thống 7 vòi phun nước ấm mát-xa toàn thân nhịp nhàng như mưa rào",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HYDRO-02",
    "treatmentCode": "SPA-HYDRO-02",
    "treatmentName": "Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)",
    "category": "Hydrotherapy",
    "durationMinutes": 45,
    "basePrice": 800000,
    "roomCompatibility": "Phòng Bồn Gỗ Pơ Mu / Jacuzzi",
    "therapistQualification": "Chứng chỉ Kỹ thuật viên Spa",
    "contraindications": "Huyết áp thấp nặng, phụ nữ đang trong kỳ kinh nguyệt",
    "description": "Bài thuốc ngâm 32 vị thuốc rừng giúp giãn gân cốt, thơm cơ thể và ngủ ngon",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-YOGA-01",
    "treatmentCode": "SPA-YOGA-01",
    "treatmentName": "Phiên Yoga Trị Liệu Cột Sống 1-1 (Therapeutic Spine Yoga)",
    "category": "Yoga & Movement",
    "durationMinutes": 60,
    "basePrice": 900000,
    "roomCompatibility": "Phòng Tập Yoga / Sala Hoa Sen",
    "therapistQualification": "Chứng chỉ Yoga Alliance RYT 200/500",
    "contraindications": "Thoát vị đĩa đệm cấp tính đang đau dữ dội",
    "description": "Huấn luyện viên kèm riêng các tư thế điều chỉnh độ cong sinh lý cột sống",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-YOGA-02",
    "treatmentCode": "SPA-YOGA-02",
    "treatmentName": "Phiên Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
    "category": "Mindfulness",
    "durationMinutes": 60,
    "basePrice": 850000,
    "roomCompatibility": "Phòng Thiền Tĩnh Tâm / Khuôn viên Yên Tĩnh",
    "therapistQualification": "Chứng chỉ Huấn luyện viên Thiền / Yoga",
    "contraindications": "Không có chống chỉ định nghiêm trọng",
    "description": "Rèn luyện dung tích phổi, giảm tiết hormone Cortisol gây stress mạn tính",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
  }
];

export const RETREAT_PACKAGES_INVENTORY: RetreatPackageItem[] = [
  {
    "id": "PKG-RET-DETOX-03",
    "packageCode": "RET-DETOX-03",
    "packageName": "3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)",
    "wellnessGoal": "Detox & Purification",
    "durationNights": 2,
    "basePrice": 12500000,
    "includedTreatments": "• 01 Massage dẫn lưu bạch huyết (75p)\n• 01 Tẩy tế bào chết trà xanh & bùn khoáng (60p)\n• 01 Liệu pháp xông hơi thảo dược & ngâm khoáng (45p)\n• 02 Buổi Hatha Yoga thanh lọc buổi sáng",
    "dietaryPlan": "Thực đơn Detox thanh lọc, nước ép lạnh hữu cơ, không đường & không chất béo bão hòa",
    "targetGuest": "Khách muốn đào thải độc tố, người làm việc áp lực cao, mệt mỏi đường tiêu hóa",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "PKG-RET-DETOX-05",
    "packageCode": "RET-DETOX-05",
    "packageName": "5D4N Tái Tạo Năng Lượng & Thải Độc Chuyên Sâu (Deep Detox & Reset)",
    "wellnessGoal": "Deep Detoxification",
    "durationNights": 4,
    "basePrice": 24800000,
    "includedTreatments": "• 02 Dẫn lưu bạch huyết toàn thân (75p)\n• 01 Trị liệu bấm huyệt bụng Chi Nei Tsang (60p)\n• 01 Tẩy tế bào chết & ủ dưỡng tảo biển (60p)\n• 02 Thủy liệu pháp bồn khoáng Jacuzzi (45p)\n• 04 Phiên Yoga & Thiền định thở Pranayama",
    "dietaryPlan": "Liệu trình ăn kiêng gián đoạn / Plant-based chuyên sâu, trà thảo mộc đào thải kim loại nặng",
    "targetGuest": "Khách hàng cần phục hồi cơ thể sau thời gian dài stress hoặc lối sống kém lành mạnh",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "PKG-RET-SLEEP-03",
    "packageCode": "RET-SLEEP-03",
    "packageName": "3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)",
    "wellnessGoal": "Sleep Improvement",
    "durationNights": 2,
    "basePrice": 11800000,
    "includedTreatments": "• 01 Massage trị liệu chuông xoay Tây Tạng (Sound Bath 60p)\n• 01 Massage đầu - cổ - vai gáy & ngâm chân thảo mộc (60p)\n• 01 Massage thư giãn Thụy Điển với tinh dầu oải hương (75p)\n• 02 Buổi Thiền Yoga Nidra buổi tối (45p)",
    "dietaryPlan": "Thực đơn tăng sinh Melatonin tự nhiên: hạt sen, cá ngừ, hạnh nhân, trà hoa cúc buổi tối",
    "targetGuest": "Người mắc chứng mất ngủ kinh niên, rối loạn nhịp sinh học (Jet-lag), mệt mỏi thần kinh",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1512290900672-1f062c3f81e8?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "PKG-RET-STRESS-04",
    "packageCode": "RET-STRESS-04",
    "packageName": "4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)",
    "wellnessGoal": "Stress Reduction",
    "durationNights": 3,
    "basePrice": 17500000,
    "includedTreatments": "• 01 Massage đá nóng núi lửa Himalaya (90p)\n• 01 Liệu pháp Shirodhara nhỏ dầu ấm luân xa trán (60p)\n• 01 Liệu pháp mùi hương Aromatherapy giải tỏa căng thẳng (75p)\n• 03 Phiên Thiền chuông & Đi bộ thiền hành trong rừng (Forest Bathing)",
    "dietaryPlan": "Thực đơn dưỡng tâm bổ khí, cân bằng năng lượng Âm - Dương, đồ uống thảo dược phục hồi",
    "targetGuest": "Doanh nhân, nhà quản lý, người đối mặt với kiệt sức (Burnout), khủng hoảng tâm lý",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "PKG-RET-AGING-04",
    "packageCode": "RET-AGING-04",
    "packageName": "4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)",
    "wellnessGoal": "Anti-Aging & Cellular Care",
    "durationNights": 3,
    "basePrice": 22000000,
    "includedTreatments": "• 01 Chăm sóc da mặt chuyên sâu nâng cơ Guasha ngọc thạch (75p)\n• 01 Trị liệu trẻ hóa da với Collagen sinh học & Oxygen (60p)\n• 01 Massage toàn thân dưỡng ẩm hoàng gia với tinh dầu hoa hồng Damask (90p)\n• 01 Tắm trắng mịn thảo mộc sâm nhung (45p)",
    "dietaryPlan": "Thực đơn giàu Collagen, chất chống oxy hóa cao (Antioxidants), các loại quả mọng và Superfoods",
    "targetGuest": "Phái đẹp, phụ nữ sau tuổi 30 mong muốn tái tạo độ đàn hồi da và thanh xuân rạng rỡ",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "PKG-RET-ALIGN-03",
    "packageCode": "RET-ALIGN-03",
    "packageName": "3D2N Nắn Chỉnh Cột Sống & Phục Hồi Thể Lực (Spine & Posture Care)",
    "wellnessGoal": "Physical Therapy & Posture",
    "durationNights": 2,
    "basePrice": 13200000,
    "includedTreatments": "• 01 Trị liệu cơ sâu bấm huyệt giải phóng co thắt (Deep Tissue 75p)\n• 01 Nắn chỉnh cổ vai gáy và kéo giãn cột sống trị liệu (60p)\n• 01 Chườm túi thảo mộc thuốc Bắc ấm giảm thoái hóa (60p)\n• 02 Buổi Yoga phục hồi tư thế (Therapeutic Alignment Yoga 1-1)",
    "dietaryPlan": "Thực đơn hỗ trợ xương khớp: bổ sung Canxi hữu cơ, Glucosamine tự nhiên, nước hầm xương hữu cơ",
    "targetGuest": "Dân văn phòng bị hội chứng gù lưng, đau cổ vai gáy mạn tính, người chơi thể thao thoái hóa",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "PKG-RET-VITAL-05",
    "packageCode": "RET-VITAL-05",
    "packageName": "5D4N Tăng Cường Sinh Lực & Quản Lý Vóc Dáng (Vitality & Weight Trim)",
    "wellnessGoal": "Fitness & Body Shaping",
    "durationNights": 4,
    "basePrice": 26500000,
    "includedTreatments": "• 02 Massage giảm mỡ săn chắc cơ thể đả thông kinh lạc (75p)\n• 01 Trị liệu quấn nóng bùn khoáng hủy mỡ (Body Wrap 60p)\n• 02 Thủy liệu pháp áp lực cao dưới nước (Hydrotherapy 45p)\n• 04 Buổi huấn luyện thể lực cá nhân (HIIT/Pilates/Cardio 60p)",
    "dietaryPlan": "Thực đơn Macro-balanced chuẩn Calories deficit nhẹ, đạm thực vật cao cấp, ít muối (Low-sodium)",
    "targetGuest": "Người muốn thon gọn vóc dáng, giảm mỡ nội tạng an toàn kết hợp tăng cường sức bền",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "PKG-RET-MOM-03",
    "packageCode": "RET-MOM-03",
    "packageName": "3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Nurturing Prenatal)",
    "wellnessGoal": "Maternal Wellness",
    "durationNights": 2,
    "basePrice": 14000000,
    "includedTreatments": "• 02 Massage chuyên biệt cho mẹ bầu giảm nhức mỏi lưng hông (60p)\n• 01 Ngâm chân thảo mộc giảm phù nề tĩnh mạch (45p)\n• 01 Chăm sóc mặt thảo mộc dịu nhẹ an toàn thai kỳ (60p)\n• 02 Lớp Yoga tiền sản hít thở chuẩn bị sinh nở nhẹ nhàng",
    "dietaryPlan": "Thực đơn hữu cơ lành tính, giàu Axit Folic, Sắt, Vitamin tự nhiên theo khuyến nghị dinh dưỡng thai kỳ",
    "targetGuest": "Mẹ bầu ở tam cá nguyệt thứ 2 và 3 cần thư giãn tinh thần và giảm tải áp lực thể chất",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
  }
];

export const TREATMENT_ROOMS_INVENTORY: TreatmentRoomItem[] = [
  {
    "id": 1,
    "roomName": "Phòng Sen Trắng (VIP Suite 101)",
    "roomType": "MASSAGE_VIP",
    "status": "AVAILABLE"
  },
  {
    "id": 2,
    "roomName": "Phòng Hoàng Lan (VIP Suite 102)",
    "roomType": "MASSAGE_VIP",
    "status": "AVAILABLE"
  },
  {
    "id": 3,
    "roomName": "Phòng Trúc Xanh (Standard Room 103)",
    "roomType": "MASSAGE_STANDARD",
    "status": "AVAILABLE"
  },
  {
    "id": 4,
    "roomName": "Phòng Quỳnh Hương (Standard Room 104)",
    "roomType": "MASSAGE_STANDARD",
    "status": "AVAILABLE"
  },
  {
    "id": 5,
    "roomName": "Phòng Mẫu Đơn VIP Bầu (Prenatal VIP 105)",
    "roomType": "PRENATAL_VIP",
    "status": "AVAILABLE"
  },
  {
    "id": 6,
    "roomName": "Phòng Thiền Chuông Tĩnh Tâm (Sound Pavilion 201)",
    "roomType": "SOUND_HEALING",
    "status": "AVAILABLE"
  },
  {
    "id": 7,
    "roomName": "Phòng Trị Liệu Ayurveda Soma (Ayurveda Chamber 202)",
    "roomType": "AYURVEDA",
    "status": "AVAILABLE"
  },
  {
    "id": 8,
    "roomName": "Phòng Chăm Sóc Da Ngọc Bích (Facial Room 203)",
    "roomType": "FACIAL",
    "status": "AVAILABLE"
  },
  {
    "id": 9,
    "roomName": "Phòng Thủy Lực Vichy Rain (Vichy Shower 301)",
    "roomType": "VICHY_SHOWER",
    "status": "AVAILABLE"
  },
  {
    "id": 10,
    "roomName": "Phòng Bồn Gỗ Pơ Mu & Jacuzzi (Herbal Bath 302)",
    "roomType": "HYDROTHERAPY",
    "status": "AVAILABLE"
  },
  {
    "id": 11,
    "roomName": "Sala Yoga & Thiền Hoa Sen (Yoga Sala 401)",
    "roomType": "YOGA_MEDITATION",
    "status": "AVAILABLE"
  }
];
