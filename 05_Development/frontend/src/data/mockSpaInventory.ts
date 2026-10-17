import type { SpaTreatmentItem, RetreatPackageItem, TreatmentRoomItem, RoomTypeMasterItem, QualificationMasterItem } from '../types/spaManagement';

/**
 * HSWRMS Spa & Therapy Standardized Inventory V3
 * Source: 02_Requirement/Screen_Inventory/HSWRMS_Goi_Spa_Tri_Lieu_Chuan_Hoa_v3.xlsx
 */

export const SPA_TREATMENTS_INVENTORY: SpaTreatmentItem[] = [
  {
    "id": "TRT-SPA-MASS-01",
    "treatmentCode": "SPA-MASS-01",
    "treatmentName": "Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)",
    "category": "Body Massage",
    "durationMinutes": 90,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1650000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MASSAGE_STANDARD, MASSAGE_VIP (Cần HEATED_STONE_TRAY)",
    "requiredQualificationCode": "QUAL_HOT_STONE_MASSAGE",
    "therapistQualification": "QUAL_HOT_STONE_MASSAGE",
    "contraindications": "Sốt cao, vết thương hở, bệnh ngoài da lây nhiễm, viêm tắc tĩnh mạch",
    "precautions": "Huyết áp cao (cần chỉnh nhiệt độ đá dưới 45°C), da mỏng nhạy cảm",
    "description": "Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-02",
    "treatmentCode": "SPA-MASS-02",
    "treatmentName": "Massage Cơ Sâu Bấm Huyệt (Deep Tissue Massage)",
    "category": "Body Massage",
    "durationMinutes": 75,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1450000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MASSAGE_STANDARD, MASSAGE_VIP (Cần ADJUSTABLE_TREATMENT_BED)",
    "requiredQualificationCode": "QUAL_DEEP_TISSUE_TRIGGER_POINT",
    "therapistQualification": "QUAL_DEEP_TISSUE_TRIGGER_POINT",
    "contraindications": "Phụ nữ mang thai, loãng xương nặng giai đoạn 3, chấn thương mới dưới 48h",
    "precautions": "Thoát vị đĩa đệm (tránh tác động lực ép vuông góc trực tiếp lên đốt sống L4-L5)",
    "description": "Massage Cơ Sâu Bấm Huyệt (Deep Tissue Massage). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-03",
    "treatmentCode": "SPA-MASS-03",
    "treatmentName": "Trị Liệu Dẫn Lưu Bạch Huyết (Lymphatic Drainage)",
    "category": "Detox Therapy",
    "durationMinutes": 75,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1550000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MASSAGE_STANDARD, MASSAGE_VIP",
    "requiredQualificationCode": "QUAL_MANUAL_LYMPHATIC_DRAINAGE",
    "therapistQualification": "QUAL_MANUAL_LYMPHATIC_DRAINAGE",
    "contraindications": "Suy tim sung huyết cấp, huyết khối tĩnh mạch sâu (DVT), ung thư đang hóa trị",
    "precautions": "Hạ huyết áp tư thế, viêm hạch lành tính (cần dùng lực siêu nhẹ < 4kPa)",
    "description": "Trị Liệu Dẫn Lưu Bạch Huyết (Lymphatic Drainage). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-04",
    "treatmentCode": "SPA-MASS-04",
    "treatmentName": "Bấm Huyệt Y Học Cổ Truyền (Vietnamese Acupressure)",
    "category": "Traditional Therapy",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1150000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MASSAGE_STANDARD, MASSAGE_VIP",
    "requiredQualificationCode": "QUAL_TRADITIONAL_ACUPRESSURE",
    "therapistQualification": "QUAL_TRADITIONAL_ACUPRESSURE",
    "contraindications": "Gãy xương chưa liền sẹo, vùng da viêm loét hoại tử, xuất huyết dưới da",
    "precautions": "Phụ nữ có thai (tuyệt đối không bấm huyệt Hợp Cốc, Tam Âm Giao, Kiên Tỉnh)",
    "description": "Bấm Huyệt Y Học Cổ Truyền (Vietnamese Acupressure). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-05",
    "treatmentCode": "SPA-MASS-05",
    "treatmentName": "Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)",
    "category": "Herbal Therapy",
    "durationMinutes": 75,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1350000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MASSAGE_STANDARD, MASSAGE_VIP (Cần HERBAL_COMPRESS_STEAMER)",
    "requiredQualificationCode": "QUAL_HERBAL_COMPRESS_THERAPY",
    "therapistQualification": "QUAL_HERBAL_COMPRESS_THERAPY",
    "contraindications": "Dị ứng cấp tính với tinh dầu gừng, quế, ngải cứu; mất cảm giác nhiệt độ ngoài da",
    "precautions": "Da mỏng sau điều trị laser, người tiểu đường mất cảm giác ngoại biên",
    "description": "Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-MASS-06",
    "treatmentCode": "SPA-MASS-06",
    "treatmentName": "Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)",
    "category": "Maternal Care",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1250000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MASSAGE_VIP (Cần PRENATAL_U_PILLOW)",
    "requiredQualificationCode": "QUAL_PRENATAL_MASSAGE",
    "therapistQualification": "QUAL_PRENATAL_MASSAGE",
    "contraindications": "Mang thai tam cá nguyệt đầu (dưới 12 tuần), dọa sảy thai, tiền sản giật",
    "precautions": "[PENDING_MEDICAL_REVIEW]: Phù chân nhiều (chỉ xoa vuốt nhẹ hướng tâm, không ấn huyệt mắt cá chân). Cần BS Sản khoa/Chuyên môn y tế xác minh phạm vi thao tác.",
    "description": "Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HEAL-01",
    "treatmentCode": "SPA-HEAL-01",
    "treatmentName": "Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Sound Bath)",
    "category": "Energy Healing",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1200000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "SOUND_SANCTUARY (Cần ACOUSTICALLY_ISOLATED)",
    "requiredQualificationCode": "QUAL_TIBETAN_SOUND_HEALING",
    "therapistQualification": "QUAL_TIBETAN_SOUND_HEALING",
    "contraindications": "Người gắn máy tạo nhịp tim (Pacemaker), người có tiền sử động kinh do rung động",
    "precautions": "Có cấy ghép kim loại lớn trong cơ thể (không đặt chuông gõ trực tiếp lên vị trí đó)",
    "description": "Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Sound Bath). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HEAL-02",
    "treatmentCode": "SPA-HEAL-02",
    "treatmentName": "Nhỏ Dầu Ấm Luân Xa Trán (Ayurvedic Shirodhara)",
    "category": "Ayurveda Therapy",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1750000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "AYURVEDA_ROOM (Cần DRONI_TABLE, HANGING_BOWL)",
    "requiredQualificationCode": "QUAL_AYURVEDA_SHIRODHARA",
    "therapistQualification": "QUAL_AYURVEDA_SHIRODHARA",
    "contraindications": "Chấn thương sọ não chưa phục hồi, viêm tai giữa chảy mủ, cảm lạnh sốt cao",
    "precautions": "Huyết áp quá thấp, chứng sợ không gian kín khi nhắm mắt (Claustrophobia)",
    "description": "Nhỏ Dầu Ấm Luân Xa Trán (Ayurvedic Shirodhara). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HEAL-03",
    "treatmentCode": "SPA-HEAL-03",
    "treatmentName": "Bấm Huyệt Thải Độc Bụng (Chi Nei Tsang Abdominal)",
    "category": "Holistic Detox",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1300000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MASSAGE_STANDARD, MASSAGE_VIP",
    "requiredQualificationCode": "QUAL_CHI_NEI_TSANG",
    "therapistQualification": "QUAL_CHI_NEI_TSANG",
    "contraindications": "Vừa phẫu thuật ổ bụng dưới 6 tháng, phình động mạch chủ bụng, đang mang thai",
    "precautions": "Vừa ăn no dưới 2 tiếng (phải đợi tiêu hóa hết), đang đặt vòng tránh thai mới",
    "description": "Bấm Huyệt Thải Độc Bụng (Chi Nei Tsang Abdominal). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-FACE-01",
    "treatmentCode": "SPA-FACE-01",
    "treatmentName": "Nâng Cơ Mặt Guasha Ngọc Thạch (Jade Guasha Facelift)",
    "category": "Facial Care",
    "durationMinutes": 75,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1400000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "FACIAL_SPECIALIZED",
    "requiredQualificationCode": "QUAL_FACIAL_GUASHA",
    "therapistQualification": "QUAL_FACIAL_GUASHA",
    "contraindications": "Mụn bọc viêm mủ diện rộng, da trầy xước lở loét, vừa phẫu thuật thẩm mỹ mặt",
    "precautions": "Vừa tiêm Botox/Filler dưới 14 ngày (tránh tác động lực gây dịch chuyển thuốc)",
    "description": "Nâng Cơ Mặt Guasha Ngọc Thạch (Jade Guasha Facelift). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-FACE-02",
    "treatmentCode": "SPA-FACE-02",
    "treatmentName": "Cấp Ẩm Phục Hồi Tế Bào Da (Deep Hydration & Cellular Repair)",
    "category": "Facial Care",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1250000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "FACIAL_SPECIALIZED (Cần ELECTROPHORESIS_DEVICE)",
    "requiredQualificationCode": "QUAL_ADVANCED_SKINCARE",
    "therapistQualification": "QUAL_ADVANCED_SKINCARE",
    "contraindications": "Nhiễm trùng Herpes môi đang bùng phát, dị ứng với mọi loại mỹ phẩm",
    "precautions": "Tiền sử dị ứng với chiết xuất thực vật (cần kiểm tra trước tại vùng da cổ tay)",
    "description": "Cấp Ẩm Phục Hồi Tế Bào Da (Deep Hydration & Cellular Repair). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-FACE-03",
    "treatmentCode": "SPA-FACE-03",
    "treatmentName": "Trẻ Hóa Tế Bào Tảo Biển Hữu Cơ (Organic Marine Collagen)",
    "category": "Anti-Aging Facial",
    "durationMinutes": 75,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1600000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "FACIAL_SPECIALIZED (Cần OXYGEN_SPRAY_MACHINE)",
    "requiredQualificationCode": "QUAL_ADVANCED_FACIAL_AESTHETICS",
    "therapistQualification": "QUAL_ADVANCED_FACIAL_AESTHETICS",
    "contraindications": "Dị ứng nặng với hải sản, i-ốt hoặc tảo biển đỏ/nâu",
    "precautions": "Làn da nhạy cảm mỏng manh (giảm nồng độ AHA/Enzyme tẩy tế bào chết ban đầu)",
    "description": "Trẻ Hóa Tế Bào Tảo Biển Hữu Cơ (Organic Marine Collagen). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-BODY-01",
    "treatmentCode": "SPA-BODY-01",
    "treatmentName": "Tẩy Tế Bào Chết Cà Phê & Dừa (Dak Lak Coffee & Coconut Polish)",
    "category": "Body Scrub",
    "durationMinutes": 45,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 850000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "WET_ROOM (Cần STANDING_SHOWER)",
    "requiredQualificationCode": "QUAL_BODY_SCRUB_POLISH",
    "therapistQualification": "QUAL_BODY_SCRUB_POLISH",
    "contraindications": "Da đang cháy nắng rát đỏ, vết thương chưa cắt chỉ, chàm vảy nến bùng phát",
    "precautions": "Vừa waxing lông toàn thân dưới 24h (tránh kích ứng rát da)",
    "description": "Tẩy Tế Bào Chết Cà Phê & Dừa (Dak Lak Coffee & Coconut Polish). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1519735777090-ec97162dc266?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-BODY-02",
    "treatmentCode": "SPA-BODY-02",
    "treatmentName": "Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)",
    "category": "Body Wrap",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 1100000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "BODY_WRAP_ROOM (Cần HEATED_WRAP_BED)",
    "requiredQualificationCode": "QUAL_BODY_WRAP_THERMAL",
    "therapistQualification": "QUAL_BODY_WRAP_THERMAL",
    "contraindications": "Suy giãn tĩnh mạch chi dưới mức độ 3, bệnh tim nặng, sốt cao",
    "precautions": "Chứng sợ bị quấn chặt kín (Claustrophobia) - cần nới lỏng vùng ngực",
    "description": "Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HYDRO-01",
    "treatmentCode": "SPA-HYDRO-01",
    "treatmentName": "Thủy Trị Liệu Vòi Phun Vichy Shower (Vichy Rain Therapy)",
    "category": "Hydrotherapy",
    "durationMinutes": 45,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 950000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "VICHY_SHOWER_ROOM (Cần VICHY_7_NOZZLE_SYSTEM)",
    "requiredQualificationCode": "QUAL_HYDROTHERAPY",
    "therapistQualification": "QUAL_HYDROTHERAPY",
    "contraindications": "Viêm tai giữa chưa lành màng nhĩ, bệnh ngoài da truyền nhiễm, say rượu",
    "precautions": "Huyết áp dao động thất thường (cần duy trì nhiệt độ nước ấm ổn định 37°C)",
    "description": "Thủy Trị Liệu Vòi Phun Vichy Shower (Vichy Rain Therapy). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-HYDRO-02",
    "treatmentCode": "SPA-HYDRO-02",
    "treatmentName": "Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)",
    "category": "Hydrotherapy",
    "durationMinutes": 45,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 800000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "JACUZZI_ROOM (Cần PRIVATE_JACUZZI)",
    "requiredQualificationCode": "QUAL_HYDROTHERAPY",
    "therapistQualification": "QUAL_HYDROTHERAPY",
    "contraindications": "Phụ nữ đang trong chu kỳ kinh nguyệt, vết thương nhiễm trùng hở",
    "precautions": "Huyết áp thấp (giới hạn thời gian ngâm bồn không quá 20 phút liên tục)",
    "description": "Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-YOGA-01",
    "treatmentCode": "SPA-YOGA-01",
    "treatmentName": "Yoga Trị Liệu Chỉnh Trục Cột Sống 1-1 (Therapeutic Spine Yoga)",
    "category": "Yoga & Movement",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 900000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "YOGA_STUDIO",
    "requiredQualificationCode": "QUAL_YOGA_THERAPY_RYT200_500",
    "therapistQualification": "QUAL_YOGA_THERAPY_RYT200_500",
    "contraindications": "Thoát vị đĩa đệm thể cấp tính đang chèn ép tủy đau liệt, gãy xương chưa liền",
    "precautions": "Huyết áp cao không kiểm soát (tránh tư thế dốc ngược đầu Downward Dog quá lâu)",
    "description": "Yoga Trị Liệu Chỉnh Trục Cột Sống 1-1 (Therapeutic Spine Yoga). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80"
  },
  {
    "id": "TRT-SPA-YOGA-02",
    "treatmentCode": "SPA-YOGA-02",
    "treatmentName": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
    "category": "Mindfulness",
    "durationMinutes": 60,
    "durationUnit": "Phút (Minutes)",
    "basePrice": 850000,
    "pricingRule": "Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "roomCompatibility": "MEDITATION_ROOM (Cần QUIET_MEDITATION_SPACE)",
    "requiredQualificationCode": "QUAL_MINDFULNESS_COACH",
    "therapistQualification": "QUAL_MINDFULNESS_COACH",
    "contraindications": "Không có chống chỉ định tuyệt đối",
    "precautions": "Khách có tiền sử hen suyễn cấp (tránh kỹ thuật thở mạnh Kapalabhati kéo dài)",
    "description": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation). Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch hoặc gọi thêm: Tính phí phát sinh ghi nợ Folio (M5).",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
  }
];

export const RETREAT_PACKAGES_INVENTORY: RetreatPackageItem[] = [
  {
    "id": "PKG-RET-DETOX-03",
    "packageCode": "RET-DETOX-03",
    "packageName": "3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)",
    "wellnessGoal": "Detox & Cleansing",
    "durationNights": 2,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 12500000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết (01 buổi - 75p)\n• SPA-BODY-01: Tẩy tế bào chết cà phê & dừa (01 buổi - 45p)\n• SPA-HYDRO-02: Ngâm bồn thảo dược Dao Đỏ (01 buổi - 45p)\n• SPA-YOGA-02: Hít thở năng lượng & Thiền định (02 buổi - 60p)\n[Tổng cộng: 05 buổi]",
    "dietaryPlan": "Chế độ Detox thanh lọc chuyên sâu:\n- 02 bữa sáng thanh lọc (Nước ép cần tây hữu cơ, hạt chia & yến mạch)\n- 02 bữa trưa & 02 bữa tối thực dưỡng (Plant-based, 0% đường tinh luyện)\n- Trà thảo mộc thải độc phục vụ cả ngày tại Villa",
    "extraChargePolicy": "ĐÃ BAO GỒM toàn bộ các buổi trị liệu và F&B nêu trên. Khách đặt thêm dịch vụ ngoài danh mục hoặc ngoài số buổi quy định sẽ tính là Extra Spa (M3) / Extra F&B (M4) và ghi nợ Folio (M5) qua hợp đồng tích hợp.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Detox & Cleansing",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-MASS-03",
        "treatmentName": "Trị Liệu Dẫn Lưu Bạch Huyết (Lymphatic Drainage)",
        "category": "Detox Therapy",
        "durationMinutes": 75,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Kích hoạt hệ bạch huyết."
      },
      {
        "treatmentCode": "SPA-BODY-01",
        "treatmentName": "Tẩy Tế Bào Chết Cà Phê & Dừa (Dak Lak Coffee & Coconut Polish)",
        "category": "Body Scrub",
        "durationMinutes": 45,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 45 phút/buổi. Thanh tẩy tế bào chết."
      },
      {
        "treatmentCode": "SPA-HYDRO-02",
        "treatmentName": "Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)",
        "category": "Hydrotherapy",
        "durationMinutes": 45,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 45 phút/buổi. Thủy liệu pháp thư giãn."
      },
      {
        "treatmentCode": "SPA-YOGA-02",
        "treatmentName": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
        "category": "Mindfulness",
        "durationMinutes": 60,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Thiền định thanh lọc thân tâm."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 2,
      "lunchCount": 2,
      "dinnerCount": 2,
      "totalMeals": 6,
      "menuPlan": "Detox Thanh Lọc Chuyên Sâu",
      "dietaryNotes": "Plant-based 100%, 0% đường tinh luyện, nước ép cần tây hữu cơ & trà thảo mộc",
      "entitlementStatus": "APPROVED"
    }
  },
  {
    "id": "PKG-RET-DETOX-05",
    "packageCode": "RET-DETOX-05",
    "packageName": "5D4N Tái Tạo Năng Lượng & Thải Độc Sâu (Deep Reset Detox)",
    "wellnessGoal": "Deep Detoxification",
    "durationNights": 4,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 24800000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết (02 buổi - 75p)\n• SPA-HEAL-03: Bấm huyệt thải độc bụng Chi Nei Tsang (01 buổi - 60p)\n• SPA-BODY-02: Ủ khoáng nóng bùn tự nhiên (01 buổi - 60p)\n• SPA-HYDRO-01: Thủy trị liệu Vichy Shower (02 buổi - 45p)\n• SPA-YOGA-02: Hít thở Pranayama & Thiền định (04 buổi - 60p)\n[Tổng cộng: 10 buổi]",
    "dietaryPlan": "Chế độ Intermittent Fasting & Clean Eating:\n- 04 bữa sáng sinh tố thải độc & trái cây chỉ số GI thấp\n- 04 bữa trưa dinh dưỡng cao & 04 bữa tối soup thanh nhiệt nhẹ bụng\n- Nước ion kiềm & nước khoáng giàu Magie bổ sung hàng ngày\n[Tổng cộng: 12 bữa ăn]",
    "extraChargePolicy": "ĐÃ BAO GỒM đúng 10 buổi trị liệu và 12 bữa ăn theo thực đơn M4. Bất kỳ dịch vụ spa thứ 11 trở đi hoặc món gọi thêm ngoài định mức đều tính phí phụ thu vào Folio.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Deep Detoxification",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-MASS-03",
        "treatmentName": "Trị Liệu Dẫn Lưu Bạch Huyết (Lymphatic Drainage)",
        "category": "Detox Therapy",
        "durationMinutes": 75,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Dẫn lưu giải độc chuyên sâu."
      },
      {
        "treatmentCode": "SPA-HEAL-03",
        "treatmentName": "Bấm Huyệt Thải Độc Bụng (Chi Nei Tsang Abdominal)",
        "category": "Holistic Detox",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Massage tạng phủ giải độc."
      },
      {
        "treatmentCode": "SPA-BODY-02",
        "treatmentName": "Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)",
        "category": "Body Wrap",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Đào thải độc tố qua da."
      },
      {
        "treatmentCode": "SPA-HYDRO-01",
        "treatmentName": "Thủy Trị Liệu Vòi Phun Vichy Shower (Vichy Rain Therapy)",
        "category": "Hydrotherapy",
        "durationMinutes": 45,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 45 phút/buổi. Massage dòng nước Vichy."
      },
      {
        "treatmentCode": "SPA-YOGA-02",
        "treatmentName": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
        "category": "Mindfulness",
        "durationMinutes": 60,
        "includedSessions": 4,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Luyện thở Pranayama hàng ngày."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 4,
      "lunchCount": 4,
      "dinnerCount": 4,
      "totalMeals": 12,
      "menuPlan": "Intermittent Fasting & Clean Eating",
      "dietaryNotes": "Sinh tố GI thấp, súp thanh nhiệt, giàu Magie, kiểm soát kiềm tính",
      "entitlementStatus": "APPROVED"
    }
  },
  {
    "id": "PKG-RET-SLEEP-03",
    "packageCode": "RET-SLEEP-03",
    "packageName": "3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)",
    "wellnessGoal": "Sleep Improvement",
    "durationNights": 2,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 11800000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-HEAL-01: Liệu pháp chuông xoay Tây Tạng (01 buổi - 60p)\n• SPA-HEAL-02: Nhỏ dầu ấm trán Shirodhara (01 buổi - 60p)\n• SPA-MASS-05: Trị liệu thảo dược cổ truyền (01 buổi - 75p)\n• SPA-YOGA-02: Thiền buông thư Yoga Nidra (02 buổi - 60p)\n[Tổng cộng: 05 buổi]",
    "dietaryPlan": "Chế độ kích hoạt Melatonin tự nhiên:\n- 02 bữa sáng giàu Tryptophan (Trứng organic luộc lòng đào, hạt óc chó, quả bơ)\n- 02 bữa trưa dinh dưỡng cân bằng Thân - Tâm\n- 02 bữa tối thanh đạm trước 19:00 kèm sữa hạt sen hạnh nhân ấm trước giờ ngủ",
    "extraChargePolicy": "ĐÃ BAO GỒM 05 liệu trình chăm sóc giấc ngủ và khẩu phần F&B. Trị liệu Massage thêm vào khung giờ khuya nếu có sẽ tính theo biểu giá dịch vụ đơn lẻ tại Sheet 2.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Sleep Improvement",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-HEAL-01",
        "treatmentName": "Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Sound Bath)",
        "category": "Energy Healing",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Sóng rung đưa não về tần số Alpha/Theta."
      },
      {
        "treatmentCode": "SPA-HEAL-02",
        "treatmentName": "Nhỏ Dầu Ấm Luân Xa Trán (Ayurvedic Shirodhara)",
        "category": "Ayurveda Therapy",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Trị mất ngủ kinh niên."
      },
      {
        "treatmentCode": "SPA-MASS-05",
        "treatmentName": "Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)",
        "category": "Herbal Therapy",
        "durationMinutes": 75,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Chườm ấm kinh lạc."
      },
      {
        "treatmentCode": "SPA-YOGA-02",
        "treatmentName": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
        "category": "Mindfulness",
        "durationMinutes": 60,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Thiền buông thư Yoga Nidra buổi tối."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 2,
      "lunchCount": 2,
      "dinnerCount": 2,
      "totalMeals": 6,
      "menuPlan": "Thực Đơn Kích Hoạt Melatonin",
      "dietaryNotes": "Giàu Tryptophan (Trứng organic, hạt óc chó, bơ), sữa hạt sen ấm trước 21h",
      "entitlementStatus": "APPROVED"
    }
  },
  {
    "id": "PKG-RET-STRESS-04",
    "packageCode": "RET-STRESS-04",
    "packageName": "4D3N Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)",
    "wellnessGoal": "Stress Reduction",
    "durationNights": 3,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 17500000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-MASS-01: Massage đá nóng núi lửa Himalaya (01 buổi - 90p)\n• SPA-HEAL-01: Liệu pháp chuông xoay Tây Tạng (01 buổi - 60p)\n• SPA-FACE-02: Cấp ẩm phục hồi tế bào da (01 buổi - 60p)\n• SPA-HYDRO-02: Ngâm bồn thảo dược Dao Đỏ (01 buổi - 45p)\n• SPA-YOGA-02: Thiền định hít thở chánh niệm (03 buổi - 60p)\n[Tổng cộng: 07 buổi]",
    "dietaryPlan": "Thực đơn an thần & cân bằng năng lượng:\n- 03 bữa sáng tự chọn theo danh mục món ăn năng lượng tích cực\n- 03 bữa trưa thực dưỡng bồi bổ khí huyết\n- 03 bữa tối 3 món lành mạnh (Set Menu Mind-Body do Bếp trưởng thiết kế)",
    "extraChargePolicy": "ĐÃ BAO GỒM 07 buổi Spa và ẩm thực theo chương trình. Khách có thể đổi liệu trình tương đương thời lượng nếu báo trước 12h, nếu nâng cấp lên gói dài hơn sẽ phụ thu chênh lệch.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Stress Reduction",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-MASS-01",
        "treatmentName": "Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)",
        "category": "Body Massage",
        "durationMinutes": 90,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 90 phút/buổi. Thư giãn mô sâu."
      },
      {
        "treatmentCode": "SPA-HEAL-01",
        "treatmentName": "Liệu Pháp Chuông Xoay Tây Tạng (Tibetan Sound Bath)",
        "category": "Energy Healing",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Chữa lành tâm trí."
      },
      {
        "treatmentCode": "SPA-FACE-02",
        "treatmentName": "Cấp Ẩm Phục Hồi Tế Bào Da (Deep Hydration & Cellular Repair)",
        "category": "Facial Care",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Phục hồi làn da mệt mỏi."
      },
      {
        "treatmentCode": "SPA-HYDRO-02",
        "treatmentName": "Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)",
        "category": "Hydrotherapy",
        "durationMinutes": 45,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 45 phút/buổi. Thư giãn cơ bắp."
      },
      {
        "treatmentCode": "SPA-YOGA-02",
        "treatmentName": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
        "category": "Mindfulness",
        "durationMinutes": 60,
        "includedSessions": 3,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Thiền chánh niệm hàng ngày."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 3,
      "lunchCount": 3,
      "dinnerCount": 3,
      "totalMeals": 9,
      "menuPlan": "Set Menu Mind-Body Harmony",
      "dietaryNotes": "Thực dưỡng bồi bổ khí huyết, cân bằng năng lượng âm dương, canh dưỡng tâm",
      "entitlementStatus": "APPROVED"
    }
  },
  {
    "id": "PKG-RET-AGING-04",
    "packageCode": "RET-AGING-04",
    "packageName": "4D3N Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)",
    "wellnessGoal": "Anti-Aging & Cellular Care",
    "durationNights": 3,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 22000000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-FACE-01: Nâng cơ mặt Guasha ngọc thạch (01 buổi - 75p)\n• SPA-FACE-03: Trẻ hóa tế bào tảo biển hữu cơ (01 buổi - 75p)\n• SPA-MASS-01: Massage đá nóng thư giãn sâu (01 buổi - 90p)\n• SPA-BODY-02: Ủ khoáng nóng thảo dược núi cao (01 buổi - 60p)\n• SPA-YOGA-01: Yoga chỉnh trục & lưu thông khí huyết (02 buổi - 60p)\n[Tổng cộng: 06 buổi]",
    "dietaryPlan": "Chế độ giàu chất chống oxy hóa (Antioxidant-Rich Diet):\n- 03 bữa sáng sinh tố quả mọng (Berries), sữa chua Hy Lạp hữu cơ\n- 03 bữa trưa cá hồi Nauy áp chảo rau củ hữu cơ & dầu ô-liu nguyên chất\n- 03 bữa tối giàu Collagen sinh học tự nhiên & nước hầm bổ dưỡng",
    "extraChargePolicy": "ĐÃ BAO GỒM 06 liệu trình làm đẹp, trẻ hóa cao cấp và trọn gói F&B. Các dịch vụ thẩm mỹ hoặc chăm sóc móng/tóc phát sinh khác sẽ tính riêng vào Folio.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Anti-Aging & Cellular Care",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-FACE-01",
        "treatmentName": "Nâng Cơ Mặt Guasha Ngọc Thạch (Jade Guasha Facelift)",
        "category": "Facial Care",
        "durationMinutes": 75,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Kích thích tăng sinh collagen."
      },
      {
        "treatmentCode": "SPA-FACE-03",
        "treatmentName": "Trẻ Hóa Tế Bào Tảo Biển Hữu Cơ (Organic Marine Collagen)",
        "category": "Anti-Aging Facial",
        "durationMinutes": 75,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Bổ sung vi khoáng làm mờ nếp nhăn."
      },
      {
        "treatmentCode": "SPA-MASS-01",
        "treatmentName": "Massage Đá Nóng Núi Lửa Himalaya (Himalayan Hot Stone)",
        "category": "Body Massage",
        "durationMinutes": 90,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 90 phút/buổi. Tăng tuần hoàn máu toàn thân."
      },
      {
        "treatmentCode": "SPA-BODY-02",
        "treatmentName": "Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)",
        "category": "Body Wrap",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Tái tạo da toàn thân."
      },
      {
        "treatmentCode": "SPA-YOGA-01",
        "treatmentName": "Yoga Trị Liệu Chỉnh Trục Cột Sống 1-1 (Therapeutic Spine Yoga)",
        "category": "Yoga & Movement",
        "durationMinutes": 60,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Tăng độ dẻo dai cơ thể."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 3,
      "lunchCount": 3,
      "dinnerCount": 3,
      "totalMeals": 9,
      "menuPlan": "Thực Đơn Chống Oxy Hóa Cao",
      "dietaryNotes": "Quả mọng berries, cá hồi áp chảo dầu ô-liu, giàu collagen tự nhiên & nước hầm bổ",
      "entitlementStatus": "APPROVED"
    }
  },
  {
    "id": "PKG-RET-ALIGN-03",
    "packageCode": "RET-ALIGN-03",
    "packageName": "3D2N Nắn Chỉnh Cột Sống & Cổ Vai Gáy (Spine & Posture Care)",
    "wellnessGoal": "Physical Alignment",
    "durationNights": 2,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 13200000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-MASS-02: Trị liệu cơ sâu bấm huyệt Deep Tissue (01 buổi - 75p)\n• SPA-MASS-04: Bấm huyệt y học cổ truyền Việt Nam (01 buổi - 60p)\n• SPA-MASS-05: Trị liệu chườm thảo dược ấm (01 buổi - 75p)\n• SPA-YOGA-01: Yoga phục hồi chỉnh vẹo cột sống 1-kèm-1 (02 buổi - 60p)\n[Tổng cộng: 05 buổi]",
    "dietaryPlan": "Chế độ dinh dưỡng phục hồi gân cốt & kháng viêm tự nhiên:\n- 02 bữa sáng giàu đạm thực vật, Canxi hữu cơ & Vitamin D3\n- 02 bữa trưa & 02 bữa tối hỗ trợ tái tạo khớp (Nghệ tươi, gừng ấm, hạt óc chó, súp hầm)",
    "extraChargePolicy": "ĐÃ BAO GỒM 05 liệu trình chuyên sâu chỉnh trục và dinh dưỡng. Nếu khách yêu cầu Kỹ thuật viên cao cấp ngoài phân bổ mặc định sẽ không phát sinh thêm phí trừ khi kéo dài thời gian buổi tập.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Physical Alignment",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-MASS-02",
        "treatmentName": "Massage Cơ Sâu Bấm Huyệt (Deep Tissue Massage)",
        "category": "Body Massage",
        "durationMinutes": 75,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Giải phóng co thắt cổ vai gáy."
      },
      {
        "treatmentCode": "SPA-MASS-04",
        "treatmentName": "Bấm Huyệt Y Học Cổ Truyền (Vietnamese Acupressure)",
        "category": "Traditional Therapy",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Thông kinh hoạt lạc."
      },
      {
        "treatmentCode": "SPA-MASS-05",
        "treatmentName": "Trị Liệu Thảo Dược Cổ Truyền (Herbal Compress Therapy)",
        "category": "Herbal Therapy",
        "durationMinutes": 75,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Giảm đau nhức phong thấp."
      },
      {
        "treatmentCode": "SPA-YOGA-01",
        "treatmentName": "Yoga Trị Liệu Chỉnh Trục Cột Sống 1-1 (Therapeutic Spine Yoga)",
        "category": "Yoga & Movement",
        "durationMinutes": 60,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Huấn luyện viên kèm chỉnh vẹo cột sống."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 2,
      "lunchCount": 2,
      "dinnerCount": 2,
      "totalMeals": 6,
      "menuPlan": "Dinh Dưỡng Kháng Viêm Tự Nhiên",
      "dietaryNotes": "Giàu Canxi hữu cơ, đạm thực vật, nghệ tươi & gừng ấm phục hồi mô sụn",
      "entitlementStatus": "APPROVED"
    }
  },
  {
    "id": "PKG-RET-VITAL-05",
    "packageCode": "RET-VITAL-05",
    "packageName": "5D4N Quản Lý Vóc Dáng & Đốt Mỡ Tự Nhiên (Vitality Slimming)",
    "wellnessGoal": "Fitness & Weight Loss",
    "durationNights": 4,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 26500000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-MASS-03: Trị liệu dẫn lưu bạch huyết giảm ứ nước (02 buổi - 75p)\n• SPA-BODY-02: Ủ nóng bùn khoáng hóa lỏng mô mỡ (01 buổi - 60p)\n• SPA-HYDRO-01: Tắm mưa Vichy Shower giải tỏa cơ bắp (02 buổi - 45p)\n• SPA-YOGA-01: Vận động chuyên sâu đốt calo 1-kèm-1 (03 buổi - 60p)\n• SPA-YOGA-02: Hít thở thanh lọc điều hòa tạng phủ (02 buổi - 60p)\n[Tổng cộng: 10 buổi]",
    "dietaryPlan": "Chế độ Macro-Balanced thâm hụt Calo khoa học (Calorie Deficit):\n- Bếp trưởng F&B (M4) định lượng khẩu phần chuẩn 1.400 - 1.600 kcal/ngày\n- 04 bữa sáng ngũ cốc nguyên cám + 04 bữa trưa giàu nạc hữu cơ + 04 bữa tối low-carb\n- 100% không đồ chiên rán, không phụ gia công nghiệp",
    "extraChargePolicy": "ĐÃ BAO GỒM 10 buổi tập luyện/trị liệu và 12 bữa ăn khoa học. Các món ăn hoặc đồ uống có đường gọi thêm tại Bar/Villa sẽ bị hệ thống gắn cờ Extra và tính phí riêng.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Fitness & Weight Loss",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-MASS-03",
        "treatmentName": "Trị Liệu Dẫn Lưu Bạch Huyết (Lymphatic Drainage)",
        "category": "Detox Therapy",
        "durationMinutes": 75,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 75 phút/buổi. Giảm phù nề ứ nước."
      },
      {
        "treatmentCode": "SPA-BODY-02",
        "treatmentName": "Ủ Khoáng Nóng Thảo Dược Núi Cao (Warm Mineral Body Wrap)",
        "category": "Body Wrap",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Thúc đẩy đốt mỡ thừa."
      },
      {
        "treatmentCode": "SPA-HYDRO-01",
        "treatmentName": "Thủy Trị Liệu Vòi Phun Vichy Shower (Vichy Rain Therapy)",
        "category": "Hydrotherapy",
        "durationMinutes": 45,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 45 phút/buổi. Thủy liệu pháp săn chắc mô."
      },
      {
        "treatmentCode": "SPA-YOGA-01",
        "treatmentName": "Yoga Trị Liệu Chỉnh Trục Cột Sống 1-1 (Therapeutic Spine Yoga)",
        "category": "Yoga & Movement",
        "durationMinutes": 60,
        "includedSessions": 3,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Vận động tăng cường cơ bắp và đốt calo."
      },
      {
        "treatmentCode": "SPA-YOGA-02",
        "treatmentName": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
        "category": "Mindfulness",
        "durationMinutes": 60,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Cân bằng nhịp sinh học và trao đổi chất."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 4,
      "lunchCount": 4,
      "dinnerCount": 4,
      "totalMeals": 12,
      "menuPlan": "Macro-Balanced Calorie Deficit",
      "dietaryNotes": "Khẩu phần định lượng 1.400 - 1.600 kcal/ngày, ít muối, giàu nạc hữu cơ",
      "entitlementStatus": "APPROVED"
    }
  },
  {
    "id": "PKG-RET-MOM-03",
    "packageCode": "RET-MOM-03",
    "packageName": "3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Prenatal Care)",
    "wellnessGoal": "Maternal Wellness",
    "durationNights": 2,
    "durationUnit": "Đêm (Nights)",
    "basePrice": 14000000,
    "basePriceUnit": "VND/khách/gói",
    "includedTreatments": "• SPA-MASS-06: Massage mẹ bầu an yên (02 buổi - 60p)\n• SPA-FACE-02: Cấp ẩm phục hồi tế bào da hữu cơ (01 buổi - 60p)\n• SPA-HYDRO-02: Ngâm chân nước ấm thảo dược thảo mộc (01 buổi - 45p)\n• SPA-YOGA-02: Lớp hít thở & thiền tiền sản nhẹ nhàng (02 buổi - 60p)\n[Tổng cộng: 06 buổi]",
    "dietaryPlan": "Chế độ dinh dưỡng an thai lành tính:\n- Thực đơn 3 bữa/ngày giàu Axit Folic, Sắt, Canxi và DHA từ tự nhiên\n- 100% nguyên liệu nuôi trồng hữu cơ có chứng nhận, loại bỏ hoàn toàn caffeine và thảo dược gây co bóp tử cung\n[Trạng thái: PENDING_CONFIRMATION số bữa chính xác theo check-in/out]",
    "extraChargePolicy": "ĐÃ BAO GỒM toàn bộ 06 buổi chăm sóc mẹ bầu an toàn. Phải qua kiểm tra hồ sơ sức khỏe thai kỳ tại S08/S33 trước khi thực hiện buổi đầu tiên.",
    "targetGuest": "Khách hàng tìm kiếm trải nghiệm chăm sóc sức khỏe toàn diện chuyên sâu",
    "status": "ACTIVE",
    "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    "recommendedFor": "Maternal Wellness",
    "treatmentMappings": [
      {
        "treatmentCode": "SPA-MASS-06",
        "treatmentName": "Massage Mẹ Bầu An Yên (Nurturing Prenatal Massage)",
        "category": "Maternal Care",
        "durationMinutes": 60,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Giảm tải áp lực cột sống cho thai phụ."
      },
      {
        "treatmentCode": "SPA-FACE-02",
        "treatmentName": "Cấp Ẩm Phục Hồi Tế Bào Da (Deep Hydration & Cellular Repair)",
        "category": "Facial Care",
        "durationMinutes": 60,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Chăm sóc da an toàn thai kỳ."
      },
      {
        "treatmentCode": "SPA-HYDRO-02",
        "treatmentName": "Ngâm Bồn Khoáng Thảo Dược Dao Đỏ (Red Dao Herbal Bath)",
        "category": "Hydrotherapy",
        "durationMinutes": 45,
        "includedSessions": 1,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 45 phút/buổi. Chỉ ngâm chân thảo dược giảm phù nề tĩnh mạch."
      },
      {
        "treatmentCode": "SPA-YOGA-02",
        "treatmentName": "Hít Thở Năng Lượng & Thiền Định (Pranayama & Meditation)",
        "category": "Mindfulness",
        "durationMinutes": 60,
        "includedSessions": 2,
        "entitlementStatus": "INCLUDED",
        "notes": "Thời lượng: 60 phút/buổi. Khí công & thở tiền sản nhẹ nhàng."
      }
    ],
    "fnbEntitlement": {
      "breakfastCount": 2,
      "lunchCount": 2,
      "dinnerCount": 2,
      "totalMeals": 6,
      "menuPlan": "Dinh Dưỡng An Thai Hữu Cơ",
      "dietaryNotes": "Giàu Axit Folic, Sắt, Canxi & DHA tự nhiên; loại bỏ 100% caffeine và gia vị kích thích",
      "entitlementStatus": "PENDING_CONFIRMATION"
    }
  }
];

export const TREATMENT_ROOMS_INVENTORY: TreatmentRoomItem[] = [
  { id: 'ROOM-101', roomName: 'Phòng Sen Trắng (VIP Suite 101)', roomType: 'MASSAGE_VIP', status: 'AVAILABLE', currentTherapist: 'Nguyễn Thị Hoa', currentSession: 'Trống' },
  { id: 'ROOM-102', roomName: 'Phòng Hoàng Lan (VIP Suite 102)', roomType: 'MASSAGE_VIP', status: 'AVAILABLE', currentTherapist: 'Trần Văn Nam', currentSession: 'Trống' },
  { id: 'ROOM-103', roomName: 'Phòng Trúc Xanh (Standard Room 103)', roomType: 'MASSAGE_STANDARD', status: 'AVAILABLE', currentTherapist: 'Lê Thu Trang', currentSession: 'Trống' },
  { id: 'ROOM-104', roomName: 'Phòng Quỳnh Hương (Standard Room 104)', roomType: 'MASSAGE_STANDARD', status: 'AVAILABLE', currentTherapist: 'Phạm Minh Đức', currentSession: 'Trống' },
  { id: 'ROOM-105', roomName: 'Phòng Mẫu Đơn VIP Bầu (Prenatal VIP 105)', roomType: 'MASSAGE_VIP', status: 'AVAILABLE', currentTherapist: 'Vũ Thanh Hằng', currentSession: 'Trống' },
  { id: 'ROOM-201', roomName: 'Phòng Thiền Chuông Tĩnh Tâm (Sound Sanctuary 201)', roomType: 'SOUND_SANCTUARY', status: 'AVAILABLE', currentTherapist: 'Ngô Bảo Châu', currentSession: 'Trống' },
  { id: 'ROOM-202', roomName: 'Phòng Trị Liệu Ayurveda Soma (Ayurveda Room 202)', roomType: 'AYURVEDA_ROOM', status: 'AVAILABLE', currentTherapist: 'Lý Hoàng Nam', currentSession: 'Trống' },
  { id: 'ROOM-203', roomName: 'Phòng Chăm Sóc Da Ngọc Bích (Facial Specialized 203)', roomType: 'FACIAL_SPECIALIZED', status: 'AVAILABLE', currentTherapist: 'Đỗ Mỹ Linh', currentSession: 'Trống' },
  { id: 'ROOM-301', roomName: 'Phòng Thủy Lực Vichy Rain (Vichy Shower Room 301)', roomType: 'VICHY_SHOWER_ROOM', status: 'AVAILABLE', currentTherapist: 'Hoàng Kim Chi', currentSession: 'Trống' },
  { id: 'ROOM-302', roomName: 'Phòng Bồn Gỗ Pơ Mu & Jacuzzi (Jacuzzi Room 302)', roomType: 'JACUZZI_ROOM', status: 'AVAILABLE', currentTherapist: 'Đinh Tiến Dũng', currentSession: 'Trống' },
  { id: 'ROOM-401', roomName: 'Sala Yoga & Thiền Hoa Sen (Yoga Studio 401)', roomType: 'YOGA_STUDIO', status: 'AVAILABLE', currentTherapist: 'Master Anand', currentSession: 'Trống' }
];

export const ROOM_TYPES_MASTER: RoomTypeMasterItem[] = [
  {
    "roomType": "MASSAGE_STANDARD",
    "typeName": "Phòng Massage Tiêu Chuẩn",
    "technicalSpecs": "Phòng trị liệu body đơn tiêu chuẩn, giường massage cố định hoặc nâng hạ, rèm ngăn.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "MASSAGE_VIP",
    "typeName": "Phòng Massage VIP",
    "technicalSpecs": "Phòng VIP riêng tư cao cấp, trang bị bồn ngâm chân, bàn trang điểm, sofa thư giãn.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "FACIAL_SPECIALIZED",
    "typeName": "Phòng Facial Chuyên Sâu",
    "technicalSpecs": "Phòng chăm sóc da mặt chuyên dụng, trang bị máy điện di, máy soi da, máy phun oxy.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "SOUND_SANCTUARY",
    "typeName": "Phòng Trị Liệu Âm Thanh",
    "technicalSpecs": "Phòng thiền âm thanh thiết kế cách âm đặc biệt (Acoustically Isolated), tiêu âm vách.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "AYURVEDA_ROOM",
    "typeName": "Phòng Trị Liệu Ayurveda",
    "technicalSpecs": "Phòng thiết kế theo chuẩn Ayurveda cổ truyền, bàn gỗ Droni, chậu treo đồng nhỏ dầu.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "WET_ROOM",
    "typeName": "Phòng Tắm Thủy Trị Liệu",
    "technicalSpecs": "Phòng ướt lát đá chống trượt, vòi sen đứng áp lực, rãnh thoát nước nhanh cho body scrub.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "BODY_WRAP_ROOM",
    "typeName": "Phòng Trị Liệu Quấn Cơ Thể",
    "technicalSpecs": "Phòng quấn nóng bùn khoáng thảo dược, giường trị liệu có màng giữ nhiệt chuyên biệt.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "VICHY_SHOWER_ROOM",
    "typeName": "Phòng Vichy Shower Chuyên Dụng",
    "technicalSpecs": "Phòng lắp hệ thống giàn phun Vichy Shower 7 vòi điều áp nóng lạnh tuần hoàn.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "JACUZZI_ROOM",
    "typeName": "Phòng Bồn Tắm Khoáng / Jacuzzi",
    "technicalSpecs": "Phòng tắm thủy lực riêng biệt, trang bị bồn gỗ Pơ-mu tự nhiên hoặc bể sục Jacuzzi.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "YOGA_STUDIO",
    "typeName": "Phòng Tập Yoga Trị Liệu",
    "technicalSpecs": "Sàn gỗ tự nhiên, trang bị gương khổ lớn, thảm tập định tuyến, dây kháng lực, bóng yoga.",
    "designStatus": "DESIGN_APPROVED"
  },
  {
    "roomType": "MEDITATION_ROOM",
    "typeName": "Phòng Thiền & Chánh Niệm",
    "technicalSpecs": "Không gian tĩnh lặng tuyệt đối, ánh sáng dịu nhẹ ấm áp, bồ đoàn đệm ngồi thiền cao cấp.",
    "designStatus": "DESIGN_APPROVED"
  }
];

export const QUALIFICATIONS_MASTER: QualificationMasterItem[] = [
  {
    "qualificationCode": "QUAL_HOT_STONE_MASSAGE",
    "qualificationName": "Chứng chỉ Body Therapy & Massage Đá Nóng",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_DEEP_TISSUE_TRIGGER_POINT",
    "qualificationName": "Chứng chỉ Trị liệu Cơ xương khớp & Điểm kích hoạt Trigger Point",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_MANUAL_LYMPHATIC_DRAINAGE",
    "qualificationName": "Chứng chỉ Kỹ thuật Dẫn lưu Bạch huyết (MLD Certified)",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_TRADITIONAL_ACUPRESSURE",
    "qualificationName": "Chứng chỉ Y học Cổ truyền / Xoa bóp bấm huyệt trị liệu",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_HERBAL_COMPRESS_THERAPY",
    "qualificationName": "Chứng chỉ Thảo mộc học & Trị liệu túi chườm thuốc cổ truyền",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_PRENATAL_MASSAGE",
    "qualificationName": "Chứng chỉ Chăm sóc & Massage Thai kỳ Quốc tế (Prenatal Certified)",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_TIBETAN_SOUND_HEALING",
    "qualificationName": "Chứng chỉ Master Chuông xoay Tây Tạng (Sound Healing Practitioner)",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_AYURVEDA_SHIRODHARA",
    "qualificationName": "Chứng chỉ Liệu trình Trị liệu Cổ truyền Ayurveda Practitioner",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_CHI_NEI_TSANG",
    "qualificationName": "Chứng chỉ Khí công & Massage Nội tạng Chi Nei Tsang Practitioner",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_FACIAL_GUASHA",
    "qualificationName": "Chứng chỉ Thẩm mỹ Da liễu & Kỹ thuật Nâng cơ Guasha Ngọc thạch",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_ADVANCED_SKINCARE",
    "qualificationName": "Chứng chỉ Chăm sóc Da Liễu Cơ bản & Nâng cao (Skincare Specialist)",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_ADVANCED_FACIAL_AESTHETICS",
    "qualificationName": "Chứng chỉ Trị liệu Tế bào & Thẩm mỹ Da mặt Chuyên sâu",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_BODY_SCRUB_POLISH",
    "qualificationName": "Chứng chỉ Chăm sóc & Thanh tẩy Tế bào chết Toàn thân (Body Scrub)",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_BODY_WRAP_THERMAL",
    "qualificationName": "Chứng chỉ Quấn nóng Bùn khoáng & Liệu pháp Nhiệt Thải độc",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_HYDROTHERAPY",
    "qualificationName": "Chứng chỉ Kỹ thuật viên Thủy Liệu Pháp Chuyên nghiệp (Hydrotherapist)",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_YOGA_THERAPY_RYT200_500",
    "qualificationName": "Bằng Huấn luyện viên Yoga Alliance RYT 200/500h (Yoga Trị liệu)",
    "baselineStatus": "DESIGN_APPROVED"
  },
  {
    "qualificationCode": "QUAL_MINDFULNESS_COACH",
    "qualificationName": "Chứng chỉ Giảng viên Thiền & Khí công Chánh niệm (Mindfulness Coach)",
    "baselineStatus": "DESIGN_APPROVED"
  }
];
