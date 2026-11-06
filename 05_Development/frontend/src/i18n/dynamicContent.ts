/**
 * HSWRMS Dynamic Content Localization Module
 * 
 * Provides authentic 5-language translations and resilient resolvers
 * for dynamic database entities:
 * 1. Retreat Packages (8 packages)
 * 2. Villa Categories (6 categories)
 * 3. Spa Treatments (18 treatments)
 * 4. Booking Statuses & Payment Types
 * 
 * Supported Locales: vi, en, fr, ja, zh-CN
 * Fallback Guarantee: Vietnamese (vi) is the primary fallback; never returns blank.
 */

export type SupportedLocale = 'vi' | 'en' | 'fr' | 'ja' | 'zh-CN';

export interface LocalizedText {
  vi: string;
  en: string;
  fr: string;
  ja: string;
  'zh-CN': string;
}

export interface LocalizedRetreatPackage {
  id: number;
  packageCode: string;
  name: LocalizedText;
  wellnessGoal: LocalizedText;
  targetGuest: LocalizedText;
}

export interface LocalizedVillaCategory {
  id: number;
  code: string;
  name: LocalizedText;
  description: LocalizedText;
}

export interface LocalizedSpaTreatment {
  id: number;
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  category: LocalizedText;
}

// ============================================================================
// 1. RETREAT PACKAGES (All 8 Canonical Packages)
// ============================================================================

export const RETREAT_PACKAGES_I18N: Record<string, LocalizedRetreatPackage> = {
  'RET-DETOX-03': {
    id: 1,
    packageCode: 'RET-DETOX-03',
    name: {
      vi: '3N2Đ Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)',
      en: '3D2N Pure Detox & Cleansing Retreat',
      fr: 'Retraite Pure Détox & Purification (3J2N)',
      ja: '3日2泊 ピュアデトックス＆浄化リトリート',
      'zh-CN': '3天2晚 纯净排毒与身心净化之旅',
    },
    wellnessGoal: {
      vi: 'Thải độc tế bào & Thanh lọc toàn diện cơ thể',
      en: 'Detoxification & Cellular Purification',
      fr: 'Détoxification & Purification Cellulaire',
      ja: '体内デトックス＆細胞浄化',
      'zh-CN': '排毒清体与细胞净化',
    },
    targetGuest: {
      vi: 'Khách muốn giải tỏa độc tố, mệt mỏi và làm sạch cơ thể',
      en: 'Guests seeking deep detoxification, stress relief, and total renewal',
      fr: 'Hôtes en quête de détoxification profonde et revitalisation',
      ja: '疲労回復と体内リセットを求めるお客様',
      'zh-CN': '希望深度排毒、舒缓身心疲劳与焕发活力的客人',
    },
  },

  'RET-DETOX-05': {
    id: 2,
    packageCode: 'RET-DETOX-05',
    name: {
      vi: '5N4Đ Tái Tạo Năng Lượng & Thải Độc Sâu (Deep Reset Detox)',
      en: '5D4N Deep Reset & Energy Renewal Detox',
      fr: 'Retraite Détox Profonde & Renouveau Énergétique (5J4N)',
      ja: '5日4泊 ディープレセット＆エネルギー再生デトックス',
      'zh-CN': '5天4晚 深度焕活排毒之旅',
    },
    wellnessGoal: {
      vi: 'Thải độc tế bào chuyên sâu & Tái tạo năng lượng sống',
      en: 'Deep Cellular Detox & Vital Energy Reset',
      fr: 'Détox Cellulaire Profonde & Regain d\'Énergie',
      ja: '深層細胞デトックス＆バイタルエネルギー再生',
      'zh-CN': '深度细胞排毒与生命活力焕新',
    },
    targetGuest: {
      vi: 'Người chịu áp lực công việc kéo dài, kiệt sức tinh thần',
      en: 'Guests experiencing chronic exhaustion, burnout, or metabolic fatigue',
      fr: 'Personnes souffrant de fatigue chronique ou de surmenage',
      ja: '慢性疲労やバーンアウトに悩むエグゼクティブ',
      'zh-CN': '长期处于高压环境、慢性疲劳与亚健康状态的宾客',
    },
  },

  'RET-SLEEP-03': {
    id: 3,
    packageCode: 'RET-SLEEP-03',
    name: {
      vi: '3N2Đ Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)',
      en: '3D2N Holistic Deep Sleep Restoration',
      fr: 'Restauration Holistique du Sommeil Profond (3J2N)',
      ja: '3日2泊 ホリスティック安眠回復リトリート',
      'zh-CN': '3天2晚 全方位深度睡眠调理之旅',
    },
    wellnessGoal: {
      vi: 'Khôi phục nhịp sinh học & Chữa lành giấc ngủ',
      en: 'Circadian Rhythm Reset & Deep Sleep Therapy',
      fr: 'Régulation du Rythme Circadien & Sommeil Réparateur',
      ja: '概日リズム調整＆深睡眠セラピー',
      'zh-CN': '调节生物钟节奏与促进深度睡眠',
    },
    targetGuest: {
      vi: 'Người mất ngủ kinh niên, khó ngủ, giấc ngủ chập chờn',
      en: 'Individuals suffering from insomnia, disrupted sleep, or jet lag',
      fr: 'Personnes sujettes à l\'insomnie ou aux troubles du sommeil',
      ja: '不眠症や睡眠の質の低下に悩む方',
      'zh-CN': '受失眠困扰、多梦易醒或受时差影响的宾客',
    },
  },

  'RET-STRESS-04': {
    id: 4,
    packageCode: 'RET-STRESS-04',
    name: {
      vi: '4N3Đ Chữa Lành Thân - Tâm & Buông Thư (Mind-Body Harmony)',
      en: '4D3N Mind-Body Harmony & Stress Relief',
      fr: 'Harmonie Corps-Esprit & Sérénité (4J3N)',
      ja: '4日3泊 心身調和＆ストレス緩和リトリート',
      'zh-CN': '4天3晚 身心调和与压力舒缓之旅',
    },
    wellnessGoal: {
      vi: 'Buông thư hệ thần kinh, giải tỏa căng thẳng và cân bằng nội tâm',
      en: 'Nervous System Soothing, Emotional Balance & Serenity',
      fr: 'Apaisement Nerveux, Équilibre Émotionnel & Sérénité',
      ja: '自律神経調整＆メンタルバランスの回復',
      'zh-CN': '舒缓神经系统、释放心理压力与平衡情绪',
    },
    targetGuest: {
      vi: 'Doanh nhân, nhà quản lý cần phục hồi tâm thế tĩnh tại',
      en: 'Executives, creatives, and guests seeking mindfulness and calm',
      fr: 'Cadres et professionnels en quête de calme intérieur',
      ja: '静寂と内省の時間を求めるビジネスリーダー',
      'zh-CN': '寻求内心平静、摆脱焦虑的高压职场人士',
    },
  },

  'RET-AGING-04': {
    id: 5,
    packageCode: 'RET-AGING-04',
    name: {
      vi: '4N3Đ Trẻ Hóa Tế Bào & Sắc Diện Hoàng Gia (Longevity & Radiance)',
      en: '4D3N Longevity, Cellular Care & Royal Radiance',
      fr: 'Longévité, Soin Cellulaire & Éclat Royal (4J3N)',
      ja: '4日3泊 ロンジェビティ＆ロイヤルエイジングケア',
      'zh-CN': '4天3晚 细胞赋活与皇家焕颜之旅',
    },
    wellnessGoal: {
      vi: 'Chống lão hóa đa tầng, phục hồi collagen và sáng mịn làn da',
      en: 'Multi-layer Anti-aging, Collagen Restoration & Youthful Glow',
      fr: 'Anti-âge Multi-niveaux, Synthèse de Collagène & Éclat',
      ja: 'マルチエイジングケア＆コラーゲン再生促進',
      'zh-CN': '多维抗衰老、胶原修护与肌肤焕发年轻光彩',
    },
    targetGuest: {
      vi: 'Khách hàng quan tâm đến chăm sóc da cao cấp và tuổi thọ khỏe mạnh',
      en: 'Guests pursuing holistic aesthetics, skin longevity, and graceful aging',
      fr: 'Hôtes recherchant des soins esthétiques de prestige et la longévité',
      ja: '本物志向のエイジングケアと美肌を求めるお客様',
      'zh-CN': '注重容颜保养、追求健康长寿与高品质抗衰的宾客',
    },
  },

  'RET-ALIGN-03': {
    id: 6,
    packageCode: 'RET-ALIGN-03',
    name: {
      vi: '3N2Đ Nắn Chỉnh Cột Sống & Cổ Vai Gáy (Spine & Posture Care)',
      en: '3D2N Spine & Posture Physical Alignment',
      fr: 'Alignement Vertébral & Postural (3J2N)',
      ja: '3日2泊 脊椎＆姿勢アライメントケア',
      'zh-CN': '3天2晚 脊椎整复与体态矫正之旅',
    },
    wellnessGoal: {
      vi: 'Giải phóng điểm chèn ép cột sống, giảm đau mỏi cổ vai gáy',
      en: 'Spinal Decompression, Postural Realignment & Joint Mobilization',
      fr: 'Décompression Vertébrale, Posture & Mobilité Articulaire',
      ja: '背骨の歪み矯正＆首肩こりの根本解消',
      'zh-CN': '脊椎减压、缓解颈肩酸痛与纠正不良体态',
    },
    targetGuest: {
      vi: 'Dân văn phòng ngồi nhiều, người bị thoái hóa đốt sống nhẹ',
      en: 'Sedentary professionals, drivers, and guests with neck/shoulder tension',
      fr: 'Employés de bureau sédentaires et personnes souffrant du dos',
      ja: 'デスクワークによる慢性的な肩こり・腰痛に悩む方',
      'zh-CN': '久坐办公族、颈椎肩颈劳损与体态失衡人群',
    },
  },

  'RET-VITAL-05': {
    id: 7,
    packageCode: 'RET-VITAL-05',
    name: {
      vi: '5N4Đ Định Hình Vóc Dáng & Đánh Thức Năng Lượng (Vitality & Silhouette)',
      en: '5D4N Vitality, Energy Awakening & Silhouette',
      fr: 'Vitalité, Éveil Énergétique & Silhouette (5J4N)',
      ja: '5日4泊 バイタリティ＆シルエット活性化リトリート',
      'zh-CN': '5天4晚 唤醒活力与体态雕塑之旅',
    },
    wellnessGoal: {
      vi: 'Đốt mỡ tự nhiên, săn chắc cơ bắp và tối ưu hóa trao đổi chất',
      en: 'Metabolic Activation, Body Sculpting & Dynamic Vitality',
      fr: 'Activation Métabolique, Tonification Corporelle & Vitalité',
      ja: '代謝アップ＆ボディシェイプ・活力向上',
      'zh-CN': '促进新陈代谢、塑造紧致身形与激发澎湃活力',
    },
    targetGuest: {
      vi: 'Người muốn lấy lại phom dáng khỏe khoắn và năng lượng tươi trẻ',
      en: 'Guests aiming to reshape fitness, lose excess weight, and boost stamina',
      fr: 'Personnes désireuses de retrouver silhouette tonique et vitalité',
      ja: '理想的なボディラインと体力強化を目指すお客様',
      'zh-CN': '希望管理身材、减轻体重与提升身体机能的宾客',
    },
  },

  'RET-MOM-03': {
    id: 8,
    packageCode: 'RET-MOM-03',
    name: {
      vi: '3N2Đ Nâng Niu Mẹ Bầu & Phục Hồi Sau Sinh (Mother-to-Be Bliss)',
      en: '3D2N Mother-to-Be Bliss & Postnatal Care',
      fr: 'Douceur Maternelle & Soins Postnatals (3J2N)',
      ja: '3日2泊 マタニティ＆産後リカバリーケア',
      'zh-CN': '3天2晚 孕产呵护与产后修护之旅',
    },
    wellnessGoal: {
      vi: 'Giảm phù nề, dưỡng ẩm da thai kỳ và xoa dịu áp lực tinh thần cho mẹ',
      en: 'Gentle Prenatal Pampering, Edema Relief & Maternal Wellbeing',
      fr: 'Détente Prénatale Douce, Soulagement des Jambes & Sérénité',
      ja: 'むくみ改善＆マタニティ期の心身リラクゼーション',
      'zh-CN': '缓解孕期水肿、深层滋养肌肤与抚慰准妈妈情绪',
    },
    targetGuest: {
      vi: 'Phụ nữ mang thai từ tuần 14 trở đi hoặc các mẹ sau sinh 3 tháng',
      en: 'Expectant mothers (second/third trimester) and postpartum mothers',
      fr: 'Femmes enceintes (après 1er trimestre) et jeunes mamans',
      ja: '妊娠中期以降のプレママおよび産後のママ',
      'zh-CN': '孕中期（14周以上）及产后需要舒缓调理的妈妈',
    },
  },
};

// ============================================================================
// 2. VILLA CATEGORIES (All 6 Standardized Categories)
// ============================================================================

export const VILLA_CATEGORIES_I18N: Record<string, LocalizedVillaCategory> = {
  '1': {
    id: 1,
    code: 'VIL-GARDEN-1BR',
    name: {
      vi: 'Biệt Thự 1 Phòng Ngủ Hướng Vườn',
      en: '1-Bedroom Garden Villa',
      fr: 'Villa 1 Chambre Vue Jardin',
      ja: '1ベッドルーム ガーデンヴィラ',
      'zh-CN': '一居室园景别墅',
    },
    description: {
      vi: 'Thiền tịnh, yên tĩnh, bồn tắm nằm thảo dược, sân vườn biệt lập',
      en: 'Tranquil sanctuary with herbal soaking tub and private secluded lush garden',
      fr: 'Sanctuaire paisible avec baignoire aux herbes et jardin luxuriant privé',
      ja: '薬草風呂とプライベートガーデンを備えた静寂のサンクチュアリ',
      'zh-CN': '静谧清幽，配草本浸泡浴缸与私密独立静修花园',
    },
  },

  '2': {
    id: 2,
    code: 'VIL-BEACH-POOL-1BR',
    name: {
      vi: 'Biệt Thự 1 Phòng Ngủ Hồ Bơi Trước Biển',
      en: '1-Bedroom Beachfront Pool Villa',
      fr: 'Villa 1 Chambre Bord de Mer avec Piscine',
      ja: '1ベッドルーム ビーチフロント プールヴィラ',
      'zh-CN': '一居室海滨泳池别墅',
    },
    description: {
      vi: 'Sát bãi biển, bước chân ra cát trắng, hiên tắm nắng ngắm bình minh và hồ bơi riêng',
      en: 'Steps from pristine white sand, private plunge pool and sunrise sundeck',
      fr: 'Accès direct à la plage de sable blanc, piscine privée et terrasse au lever du soleil',
      ja: '白砂のビーチ直結、プライベートプールと朝日のサンデッキ完備',
      'zh-CN': '直通纯白沙滩，配备私人清凉泳池与观日出阳光露台',
    },
  },

  '3': {
    id: 3,
    code: 'VIL-POOL-2BR',
    name: {
      vi: 'Biệt Thự 2 Phòng Ngủ Có Hồ Bơi',
      en: '2-Bedroom Pool Villa',
      fr: 'Villa 2 Chambres avec Piscine',
      ja: '2ベッドルーム プールヴィラ',
      'zh-CN': '两居室泳池别墅',
    },
    description: {
      vi: 'Bếp ăn gia đình mở, phòng khách rộng, hiên tiệc cocktail hồ bơi',
      en: 'Spacious open-concept living, fully equipped pantry and poolside lounge deck',
      fr: 'Vaste espace de vie ouvert, cuisine équipée et terrasse au bord de la piscine',
      ja: '開放的なリビング、フルキッチン、プールサイドのラウンジデッキ',
      'zh-CN': '宽敞开阔客厅，配家庭开放式餐厨与泳池鸡尾酒休闲庭院',
    },
  },

  '4': {
    id: 4,
    code: 'VIL-OCEAN-3BR',
    name: {
      vi: 'Biệt Thự 3 Phòng Ngủ Hướng Biển',
      en: '3-Bedroom Ocean View Villa',
      fr: 'Villa 3 Chambres Vue Océan',
      ja: '3ベッドルーム オーシャンビューヴィラ',
      'zh-CN': '三居室海景别墅',
    },
    description: {
      vi: 'View biển bao quát từ trên đồi, sân vườn nướng BBQ, ban công lộng gió',
      en: 'Panoramic hillside ocean vistas, private BBQ garden and breezy terrace',
      fr: 'Vue panoramique sur l\'océan, jardin BBQ privé et terrasse aérée',
      ja: '高台からのパノラマオーシャンビュー、BBQガーデン、海風抜けるテラス',
      'zh-CN': '依山俯瞰壮丽全景海景，配专属BBQ花园与海风露台',
    },
  },

  '5': {
    id: 5,
    code: 'VIL-ESTATE-FAMILY',
    name: {
      vi: 'Dinh Thự Gia Đình 4-5 Phòng Ngủ',
      en: '4-5 Bedroom Family Estate',
      fr: 'Domaine Familial 4-5 Chambres',
      ja: '4〜5ベッドルーム ファミリーエステート',
      'zh-CN': '4-5居室家庭尊享庄园',
    },
    description: {
      vi: 'Biệt lập tuyệt đối, sảnh lounge tầng 2, phòng xông hơi riêng và hồ bơi lớn',
      en: 'Absolute seclusion, second-floor executive lounge, private sauna and infinity pool',
      fr: 'Isolement absolu, salon exécutif à l\'étage, sauna privé et grande piscine',
      ja: '完全プライベート設計、2階ラウンジ、専用サウナ、インフィニティプール',
      'zh-CN': '尊贵私密庄园，配二层行政酒廊、私人桑拿房与大尺度无边际泳池',
    },
  },

  '6': {
    id: 6,
    code: 'VIL-PRESIDENTIAL',
    name: {
      vi: 'Dinh Thự Hoàng Gia Tổng Thống',
      en: 'Presidential Royal Residence',
      fr: 'Résidence Royale Présidentielle',
      ja: 'プレジデンシャル ロイヤル レジデンス',
      'zh-CN': '总统皇家府邸',
    },
    description: {
      vi: 'Dinh thự độc bản, Quản gia riêng 24/7, rạp chiếu phim, Spa riêng, xe Buggy riêng',
      en: 'Flagship bespoke estate, 24/7 private butler, cinema, dedicated private spa and buggy',
      fr: 'Domaine signature unique, majordome privé 24/7, cinéma, spa privé et buggy',
      ja: '最高峰の特注レジデンス、24時間バトラー、シアタールーム、専用スパ＆バギー',
      'zh-CN': '独版传世府邸，24小时私人管家、家庭影院、独立Spa水疗室与专享电瓶车',
    },
  },
};

// ============================================================================
// 3. SPA TREATMENTS (All 18 Standardized Treatments)
// ============================================================================

export const SPA_TREATMENTS_I18N: Record<string, LocalizedSpaTreatment> = {
  'SPA-MASS-01': {
    id: 1,
    code: 'SPA-MASS-01',
    name: {
      vi: 'Massage Đá Nóng Núi Lửa Himalaya',
      en: 'Himalayan Hot Stone Massage',
      fr: 'Massage aux Pierres Chaudes de l\'Himalaya',
      ja: 'ヒマラヤホットストーンマッサージ',
      'zh-CN': '喜马拉雅火山热石按摩',
    },
    description: {
      vi: 'Sử dụng đá bazan núi lửa Himalaya giữ nhiệt ấm áp kết hợp tinh dầu thảo mộc, xoa dịu đau nhức cơ bắp sâu.',
      en: 'Warmed volcanic basalt stones combined with therapeutic herbal oils to release deep muscular tension.',
      fr: 'Pierres de basalte volcanique chaudes alliées aux huiles d\'herbes pour apaiser les tensions profondes.',
      ja: '温めたヒマラヤ火山玄武岩と薬草オイルを融合し、深層の筋肉の緊張と凝りをじんわり解きほぐします。',
      'zh-CN': '精选喜马拉雅火山玄武岩恒温热敷，配合天然草本芳香精油，深入舒缓肌肉酸痛与疲劳。',
    },
    category: {
      vi: 'Massage Trị Liệu',
      en: 'Therapeutic Massage',
      fr: 'Massage Thérapeutique',
      ja: 'セラピーマッサージ',
      'zh-CN': '理疗按摩',
    },
  },

  'SPA-MASS-02': {
    id: 2,
    code: 'SPA-MASS-02',
    name: {
      vi: 'Massage Cơ Sâu Bấm Huyệt Deep Tissue',
      en: 'Deep Tissue & Trigger Point Massage',
      fr: 'Massage des Tissus Profonds & Points Gâchettes',
      ja: 'ディープティシュー＆トリガーポイント指圧',
      'zh-CN': '深层肌肉组织指压理疗按摩',
    },
    description: {
      vi: 'Tác động sâu vào các lớp mô liên kết và giải tỏa các nút co thắt cơ, phục hồi sự linh hoạt.',
      en: 'Firm targeted pressure reaching deep fascia layers to release stubborn knots and restore mobility.',
      fr: 'Pressions ciblées profondes pour libérer les nœuds musculaires et restaurer la souplesse.',
      ja: '深層筋膜へ的確にアプローチし、頑固なコリや結節をほぐして身体の柔軟性を取り戻します。',
      'zh-CN': '精准施压深层筋膜与肌腱连接点，释放紧绷结节，恢复肌肉弹性与肢体灵活度。',
    },
    category: {
      vi: 'Massage Trị Liệu',
      en: 'Therapeutic Massage',
      fr: 'Massage Thérapeutique',
      ja: 'セラピーマッサージ',
      'zh-CN': '理疗按摩',
    },
  },

  'SPA-MASS-03': {
    id: 3,
    code: 'SPA-MASS-03',
    name: {
      vi: 'Trị Liệu Dẫn Lưu Bạch Huyết',
      en: 'Manual Lymphatic Drainage Therapy',
      fr: 'Drainage Lymphatique Manuel',
      ja: 'マニュアルリンパドレナージュ療法',
      'zh-CN': '淋巴引流排毒理疗',
    },
    description: {
      vi: 'Kỹ thuật vuốt chạm nhẹ nhàng theo dòng chảy bạch huyết, hỗ trợ đào thải độc tố và giảm giữ nước.',
      en: 'Gentle rhythmic strokes stimulating lymphatic circulation to eliminate toxins and reduce fluid retention.',
      fr: 'Manœuvres douces stimulant la circulation lymphatique pour éliminer les toxines et l\'œdème.',
      ja: 'リンパ液の流れに沿った穏やかなリズミカルなタッチで、体内の老廃物排出とむくみを改善します。',
      'zh-CN': '采用轻柔有节奏的专业推按技法，顺应淋巴循环方向，促进毒素代谢并显著消除水肿。',
    },
    category: {
      vi: 'Thải Độc',
      en: 'Detox Therapy',
      fr: 'Thérapie Détox',
      ja: 'デトックス療法',
      'zh-CN': '排毒理疗',
    },
  },

  'SPA-MASS-04': {
    id: 4,
    code: 'SPA-MASS-04',
    name: {
      vi: 'Bấm Huyệt Y Học Cổ Truyền Việt Nam',
      en: 'Traditional Vietnamese Acupressure',
      fr: 'Acupression Traditionnelle Vietnamienne',
      ja: 'ベトナム伝統指圧療法',
      'zh-CN': '越南传统经络指压穴位调理',
    },
    description: {
      vi: 'Tác động chính xác vào 108 đại huyệt vị giúp đả thông kinh lạc, hành khí hoạt huyết theo y lý phương Đông.',
      en: 'Authentic acupressure along Eastern meridian pathways to unblock vital qi energy and boost circulation.',
      fr: 'Pression millénaire sur les méridiens pour débloquer le flux d\'énergie vitale et stimuler la circulation.',
      ja: '東洋医学の経絡理論に基づき主要なツボを刺激、気血の巡りを整え自然治癒力を引き出します。',
      'zh-CN': '遵循东方医学经络气血理论，重点循经点穴，通经活络、行气活血、调和五脏六腑。',
    },
    category: {
      vi: 'Trị Liệu Cổ Truyền',
      en: 'Traditional Therapy',
      fr: 'Thérapie Traditionnelle',
      ja: '伝統療法',
      'zh-CN': '传统古法理疗',
    },
  },

  'SPA-MASS-05': {
    id: 5,
    code: 'SPA-MASS-05',
    name: {
      vi: 'Trị Liệu Túi Thảo Dược Cổ Truyền',
      en: 'Warm Herbal Poultice Therapy',
      fr: 'Thérapie aux Pochons d\'Herbes Chaudes',
      ja: '温感ハーブボール湿布療法',
      'zh-CN': '温经通络古法草本热敷球理疗',
    },
    description: {
      vi: 'Chườm túi thảo dược sao nóng gồm gừng núi, ngải cứu, quế chi, xua tan phong hàn và nhức mỏi.',
      en: 'Steamed herbal compresses infused with wild ginger and mugwort to dispel cold and soothe joints.',
      fr: 'Pochons de plantes cuits à la vapeur pour chasser les tensions et réchauffer les articulations.',
      ja: 'ヨモギや生姜など厳選薬草を蒸し上げた温熱ハーブボールで、冷えを取り関節痛を和らげます。',
      'zh-CN': '精选艾草、山姜等多种名贵天然草本高温蒸汽烘热，温敷经络关节，祛风散寒、温养肌体。',
    },
    category: {
      vi: 'Trị Liệu Thảo Dược',
      en: 'Herbal Therapy',
      fr: 'Thérapie aux Herbes',
      ja: 'ハーブセラピー',
      'zh-CN': '草本理疗',
    },
  },

  'SPA-MASS-06': {
    id: 6,
    code: 'SPA-MASS-06',
    name: {
      vi: 'Massage Chăm Sóc Mẹ Bầu An Yên',
      en: 'Nurturing Prenatal Massage',
      fr: 'Massage Prénatal Bien-être',
      ja: 'マタニティ安らぎトリートメント',
      'zh-CN': '安适孕期专属温和呵护按摩',
    },
    description: {
      vi: 'Tư thế nằm nghiêng nâng đỡ chuyên biệt, xoa bóp êm dịu giải tỏa nhức mỏi lưng hông cho phụ nữ mang thai.',
      en: 'Specialized side-lying positioning and gentle nurturing strokes to relieve lower back and hip strain.',
      fr: 'Position latérale ergonomique et gestes doux pour soulager le dos et les hanches des futures mamans.',
      ja: '妊婦様専用の横向き姿勢で優しく施術。腰や股関節の負担を軽減し深いリラックスをもたらします。',
      'zh-CN': '采用安全舒适的专属侧卧支撑体位，施以轻柔安抚手法，显著舒缓孕期下背部与髋部压力。',
    },
    category: {
      vi: 'Chăm Sóc Thai Kỳ',
      en: 'Maternal Care',
      fr: 'Soins Maternité',
      ja: 'マタニティケア',
      'zh-CN': '孕产养护',
    },
  },

  'SPA-FACE-01': {
    id: 7,
    code: 'SPA-FACE-01',
    name: {
      vi: 'Nâng Cơ Mặt Ngọc Thạch Guasha',
      en: 'Jade Guasha Facial Sculpting',
      fr: 'Soin Visage Sculptant Guasha en Jade',
      ja: '翡翠カッサ フェイシャルリフト',
      'zh-CN': '天然翡翠刮痧面部紧致提升',
    },
    description: {
      vi: 'Dùng ngọc bích tự nhiên miết nâng cơ mặt, kích thích vi tuần hoàn và làm thon gọn đường nét thanh tú.',
      en: 'Natural nephrite jade scraping strokes that contour facial lines, drain lymph, and stimulate collagen.',
      fr: 'Lissage au jade naturel pour sculpter les contours, stimuler le collagène et illuminer le teint.',
      ja: '天然翡翠を用いた伝統カッサ技術で、リンパを流しフェイスラインをシャープに引き締めます。',
      'zh-CN': '精选天然温润青翠玉石，顺应面部筋膜走向轻柔刮拭，紧致轮廓、消除浮肿与激活胶原。',
    },
    category: {
      vi: 'Chăm Sóc Da Mặt',
      en: 'Facial Care',
      fr: 'Soin du Visage',
      ja: 'フェイシャルケア',
      'zh-CN': '面部护理',
    },
  },

  'SPA-FACE-02': {
    id: 8,
    code: 'SPA-FACE-02',
    name: {
      vi: 'Cấp Ẩm Phục Hồi Tế Bào Da',
      en: 'Cellular Hydration Facial',
      fr: 'Soin Hydratant & Réparateur Cellulaire',
      ja: 'セルラーハイドレーション フェイシャル',
      'zh-CN': '细胞深层补水舒缓修护面部护理',
    },
    description: {
      vi: 'Đưa dưỡng chất Hyaluronic đa phân tử và chiết xuất lô hội tự nhiên thẩm thấu sâu, phục hồi màng ẩm.',
      en: 'Multi-molecular hyaluronic acid and botanical infusions delivering deep moisture to replenish barrier health.',
      fr: 'Infusion d\'acide hyaluronique et d\'extraits botaniques pour réparer et hydrater intensément.',
      ja: '多重分子ヒアルロン酸と植物エキスが角質層の深くまで浸透、みずみずしい素肌へと導きます。',
      'zh-CN': '注入多重分子玻尿酸与有机高纯芦荟精华，强韧肌肤屏障，实现长效水润与光彩通透。',
    },
    category: {
      vi: 'Chăm Sóc Da Mặt',
      en: 'Facial Care',
      fr: 'Soin du Visage',
      ja: 'フェイシャルケア',
      'zh-CN': '面部护理',
    },
  },

  'SPA-FACE-03': {
    id: 9,
    code: 'SPA-FACE-03',
    name: {
      vi: 'Trẻ Hóa Tế Bào Tảo Biển Hữu Cơ',
      en: 'Organic Marine Algae Rejuvenation',
      fr: 'Soin Rajeunissant aux Algues Marines Bio',
      ja: 'オーガニック海藻エイジングリバース',
      'zh-CN': '有机深海海藻活性细胞抗衰赋活',
    },
    description: {
      vi: 'Chiết xuất tảo xoắn Spirulina và vi chất biển khơi giàu chất chống oxy hóa, làm mờ nếp nhăn và săn chắc da.',
      en: 'Antioxidant-dense spirulina algae mask and oceanic minerals visibly firming skin and reducing fine lines.',
      fr: 'Masque à la spiruline et minéraux marins pour lisser les ridules et raffermir visiblement l\'épiderme.',
      ja: '高純度スピルリナと海洋性ミネラルの力で、小じわを目立たなくし若々しいハリと弾力を与えます。',
      'zh-CN': '蕴含高浓度螺旋藻提取物与海洋活性微量元素，抵抗自由基氧化，淡化细纹并紧塑肌肤弹性。',
    },
    category: {
      vi: 'Chăm Sóc Da Mặt',
      en: 'Facial Care',
      fr: 'Soin du Visage',
      ja: 'フェイシャルケア',
      'zh-CN': '面部护理',
    },
  },

  'SPA-BODY-01': {
    id: 10,
    code: 'SPA-BODY-01',
    name: {
      vi: 'Tẩy Tế Bào Chết Cà Phê Tây Nguyên & Dừa',
      en: 'Highland Coffee & Coconut Body Polish',
      fr: 'Gommage Corps Café des Hauts Plateaux & Noix de Coco',
      ja: '高原コーヒー＆ココナッツ ボディポリッシュ',
      'zh-CN': '高原咖啡原豆与椰子油温和身体磨砂',
    },
    description: {
      vi: 'Hạt cà phê Robusta rang mộc xay mịn kết hợp dầu dừa nguyên chất, loại bỏ lớp sừng già cỗi và làm mịn màng da.',
      en: 'Finely ground robusta coffee beans blended with organic cold-pressed coconut oil to polish and revitalize skin.',
      fr: 'Café robusta moulu et huile de coco vierge pour exfolier en douceur et lisser le grain de peau.',
      ja: '挽きたてロブスタ豆とオーガニックココナッツオイルが古い角質をやさしく取り除き、シルク肌へ。',
      'zh-CN': '精磨高原天然罗布斯塔咖啡原豆与初榨椰子油相融，温和祛除老化角质，重现如丝幼滑肌。',
    },
    category: {
      vi: 'Tẩy Tế Bào Chết',
      en: 'Body Scrub',
      fr: 'Gommage Corporel',
      ja: 'ボディスクラブ',
      'zh-CN': '身体去角质',
    },
  },

  'SPA-BODY-02': {
    id: 11,
    code: 'SPA-BODY-02',
    name: {
      vi: 'Ủ Khoáng Nóng Bùn Tự Nhiên & Thảo Mộc',
      en: 'Thermal Mineral Mud & Herbal Body Wrap',
      fr: 'Enveloppement à la Boue Minérale & Herbes',
      ja: '天然ミネラル泥＆ハーブ 温熱ボディラップ',
      'zh-CN': '天然温泉矿物热泥与草本精华体膜',
    },
    description: {
      vi: 'Đắp bùn khoáng thiên nhiên giàu nguyên tố vi lượng kết hợp ủ ấm nhiệt quang, giải phóng độc tố qua lỗ chân lông.',
      en: 'Rich volcanic mud packed with trace elements heated to detoxify tissues and soothe muscular soreness.',
      fr: 'Boue minérale riche enveloppée de chaleur pour purifier les tissus et apaiser les tensions musculaires.',
      ja: '天然ミネラルを豊富に含む温かい泥パックが全身を包み込み、毛穴の奥から老廃物を排出します。',
      'zh-CN': '涂敷富含多种稀缺微量元素的天然温泉矿泥并温热包裹，促进微循环，深层排出积存杂质。',
    },
    category: {
      vi: 'Ủ Cơ Thể',
      en: 'Body Wrap',
      fr: 'Enveloppement',
      ja: 'ボディラップ',
      'zh-CN': '身体裹敷',
    },
  },

  'SPA-HYDRO-01': {
    id: 12,
    code: 'SPA-HYDRO-01',
    name: {
      vi: 'Thủy Trị Liệu Vichy Shower Đa Điểm',
      en: 'Multi-jet Vichy Shower Hydrotherapy',
      fr: 'Douche Vichy Hydrothérapie Multi-jets',
      ja: 'マルチジェット ヴィシーシャワー 水力療法',
      'zh-CN': '多喷嘴维希流水疗微压雨幕按摩',
    },
    description: {
      vi: 'Hệ thống 7 vòi sen áp lực nước ấm đa điểm kích thích tuần hoàn máu và đem lại cảm giác sảng khoái tột độ.',
      en: 'Synchronized seven-head warm water shower creating rhythmic rain sensations to stimulate blood circulation.',
      fr: 'Sept jets d\'eau chaude synchronisés créant une pluie relaxante qui stimule la circulation sanguine.',
      ja: '7つの温水ジェットシャワーが全身を心地よく刺激し、血行を促進して至福の爽快感をもたらします。',
      'zh-CN': '同步七头温水雨幕按节律均匀冲击全身，轻柔唤醒外周毛细血管，重赋身心澎湃舒爽活力。',
    },
    category: {
      vi: 'Thủy Liệu Pháp',
      en: 'Hydrotherapy',
      fr: 'Hydrothérapie',
      ja: '水力療法',
      'zh-CN': '水疗护理',
    },
  },

  'SPA-HYDRO-02': {
    id: 13,
    code: 'SPA-HYDRO-02',
    name: {
      vi: 'Ngâm Bồn Thảo Dược Người Dao Đỏ',
      en: 'Red Dao Herbal Soaking Bath',
      fr: 'Bain Immersion aux Herbes des Dao Rouges',
      ja: 'レッドザオ族伝統 薬草浸透風呂',
      'zh-CN': '红瑶族古法秘方百草木桶浸泡浴',
    },
    description: {
      vi: 'Bài thuốc bí truyền 39 vị thảo mộc núi rừng nấu trong bồn gỗ pơ-mu, đả thông kinh mạch và hồi phục nguyên khí.',
      en: 'Sacred Himalayan medicinal bath recipe with 39 wild mountain herbs stewed in fragrant fokienia wood tubs.',
      fr: 'Bain traditionnel composé de 39 plantes médicinales sauvages dans une cuve en bois aromatique.',
      ja: '芳醇なヒノキの木樽に39種の山岳薬草を煮出した秘伝湯。身体の芯から温め気力を充実させます。',
      'zh-CN': '源自高山秘境39味野生草本古法熬制，浸浴于香柏木桶中，通畅百脉、驱寒除湿、大补元气。',
    },
    category: {
      vi: 'Thủy Liệu Pháp',
      en: 'Hydrotherapy',
      fr: 'Hydrothérapie',
      ja: '水力療法',
      'zh-CN': '水疗护理',
    },
  },

  'SPA-HEAL-01': {
    id: 14,
    code: 'SPA-HEAL-01',
    name: {
      vi: 'Trị Liệu Chuông Xoay Tây Tạng',
      en: 'Tibetan Singing Bowl Sound Therapy',
      fr: 'Sonothérapie aux Bols Chantants Tibétains',
      ja: 'チベット シンギングボウル 音響療法',
      'zh-CN': '西藏颂钵原音声波能量疗愈',
    },
    description: {
      vi: 'Sóng âm thanh và dao động tần số thuần khiết từ chuông hợp kim 7 kim loại lập lại trật tự cân bằng tế bào.',
      en: 'Harmonic acoustic sound waves from handcrafted seven-metal bowls tuning body cells to healing frequencies.',
      fr: 'Ondes vibratoires pures de bols aux sept métaux réalignant les fréquences cellulaires et la paix intérieure.',
      ja: '7メタル合金ボウルが放つ倍音の響きと微細振動が、細胞レベルで深いリラクゼーションと調和を促します。',
      'zh-CN': '由七种纯正合金手工锻造颂钵鸣响空灵倍音频段，共振细胞微循环，澄净杂念并重归能量平衡。',
    },
    category: {
      vi: 'Chữa Lành Năng Lượng',
      en: 'Energy Healing',
      fr: 'Soin Énergétique',
      ja: 'エネルギーヒーリング',
      'zh-CN': '能量疗愈',
    },
  },

  'SPA-HEAL-02': {
    id: 15,
    code: 'SPA-HEAL-02',
    name: {
      vi: 'Nhỏ Dầu Ấm Trán Shirodhara Ayurveda',
      en: 'Shirodhara Warm Oil Forehead Flow',
      fr: 'Shirodhara Filet d\'Huile Tiède Ayurvédique',
      ja: 'シロダーラ アーユルヴェーダ 温油滴下療法',
      'zh-CN': '阿育吠陀温热草本精油滴额滴心疗法',
    },
    description: {
      vi: 'Dòng dầu thảo dược ấm chảy liên tục lên luân xa trán (con mắt thứ ba), xoa dịu hệ thần kinh và tan biến âu lo.',
      en: 'Continuous gentle stream of warm medicated herbal oil poured over the third eye to induce meditative bliss.',
      fr: 'Filet continu d\'huile chaude médicinale sur le troisième œil pour calmer le mental et dissiper l\'anxiété.',
      ja: '温かい薬効オイルを額（第3の目）へ途切れることなく注ぎ続け、脳の緊張を解き瞑想の境地へ誘います。',
      'zh-CN': '将温热特调草药精油呈平缓水滴流持续倾注于眉心轮，深度舒缓脑神经，带您进入恬然禅定之境。',
    },
    category: {
      vi: 'Ayurveda',
      en: 'Ayurvedic Therapy',
      fr: 'Ayurveda',
      ja: 'アーユルヴェーダ',
      'zh-CN': '阿育吠陀传统疗法',
    },
  },

  'SPA-HEAL-03': {
    id: 16,
    code: 'SPA-HEAL-03',
    name: {
      vi: 'Bấm Huyệt Thải Độc Bụng Chi Nei Tsang',
      en: 'Chi Nei Tsang Abdominal Detox',
      fr: 'Chi Nei Tsang Massage Détox Abdominal',
      ja: 'チネイザン 腹部内臓デトックス気功療法',
      'zh-CN': '道家奇内脏腹部气功排毒点穴按摩',
    },
    description: {
      vi: 'Xoa bóp khí công nội tạng vùng bụng, giải tỏa căng cứng tiêu hóa và thanh lọc các cảm xúc tiêu cực ứ đọng.',
      en: 'Taoist abdominal visceral massage releasing internal blockages, improving digestion and clearing emotional stress.',
      fr: 'Massage taoïste viscéral pour relâcher les tensions internes, stimuler la digestion et libérer les blocages.',
      ja: '道教に伝わる腹部内臓マッサージ。内臓の緊張をほぐし消化機能を高め、溜まった感情を解放します。',
      'zh-CN': '源自道家气功内脏腹部推揉点穴法，畅通消化系统淤滞，化解腹部紧绷郁结，舒畅内蕴不良情绪。',
    },
    category: {
      vi: 'Chữa Lành Năng Lượng',
      en: 'Energy Healing',
      fr: 'Soin Énergétique',
      ja: 'エネルギーヒーリング',
      'zh-CN': '能量疗愈',
    },
  },

  'SPA-YOGA-01': {
    id: 17,
    code: 'SPA-YOGA-01',
    name: {
      vi: 'Yoga Trị Liệu & Chỉnh Trục Cơ Thể',
      en: 'Therapeutic Yoga & Postural Alignment',
      fr: 'Yoga Thérapeutique & Alignement Postural',
      ja: 'セラピーヨガ＆姿勢アライメント指導',
      'zh-CN': '理疗瑜伽与身体中轴体态对位重塑',
    },
    description: {
      vi: 'Lớp học kèm riêng 1:1 điều chỉnh tư thế, kéo giãn cột sống và tăng cường sức mạnh khối cơ nâng đỡ cốt lõi.',
      en: 'Private 1:1 yoga guidance focusing on spinal alignment, deep stretching, and stabilizing the core muscles.',
      fr: 'Séance personnalisée 1:1 axée sur l\'alignement vertébral, l\'étirement profond et le gainage.',
      ja: '専任インストラクターによる1対1の指導で、背骨のアライメントを整え体幹の深層筋を鍛えます。',
      'zh-CN': '一对一私密定制指导，精准调整脊柱与盆骨骨骼中立位，拉伸深层肌肉并强化核心肌群力量。',
    },
    category: {
      vi: 'Yoga & Thân Thể',
      en: 'Yoga & Movement',
      fr: 'Yoga & Corps',
      ja: 'ヨガ＆ムーブメント',
      'zh-CN': '瑜伽与身体动律',
    },
  },

  'SPA-YOGA-02': {
    id: 18,
    code: 'SPA-YOGA-02',
    name: {
      vi: 'Hít Thở Năng Lượng Pranayama & Thiền Định',
      en: 'Pranayama Breathwork & Meditation',
      fr: 'Pranayama Respiration Consciente & Méditation',
      ja: 'プラナヤマ呼吸法＆マインドフルネス瞑想',
      'zh-CN': '调息能量普拉纳亚玛呼吸与正念冥想',
    },
    description: {
      vi: 'Phương pháp kiểm soát hơi thở thanh lọc tâm trí kết hợp thiền chánh niệm bên bờ biển lúc hoàng hôn.',
      en: 'Yogic breath control practice combined with serene guided mindfulness meditation by the ocean at twilight.',
      fr: 'Techniques respiratoires yogiques et méditation guidée au crépuscule face à l\'océan pour apaiser l\'esprit.',
      ja: '呼吸を整え雑念を鎮めるプラナヤマと、波音を聴きながらのガイド付きマインドフルネス瞑想。',
      'zh-CN': '掌握古老生命能量呼吸调控法，融合日落海滨导引式正念冥想，平复繁杂思绪与回归内在本源。',
    },
    category: {
      vi: 'Yoga & Thân Thể',
      en: 'Yoga & Movement',
      fr: 'Yoga & Corps',
      ja: 'ヨガ＆ムーブメント',
      'zh-CN': '瑜伽与身体动律',
    },
  },
};

// ============================================================================
// 4. BOOKING STATUS & PAYMENT STATUS RESOLVERS
// ============================================================================

export const BOOKING_STATUS_I18N: Record<string, LocalizedText> = {
  upcoming: {
    vi: 'Sắp diễn ra',
    en: 'Upcoming',
    fr: 'À venir',
    ja: '今後の予定',
    'zh-CN': '即将开始',
  },
  in_stay: {
    vi: 'Đang lưu trú',
    en: 'In Stay',
    fr: 'En séjour',
    ja: '滞在中',
    'zh-CN': '在住中',
  },
  completed: {
    vi: 'Đã hoàn thành',
    en: 'Completed',
    fr: 'Terminé',
    ja: '完了',
    'zh-CN': '已完成',
  },
  cancelled: {
    vi: 'Đã hủy',
    en: 'Cancelled',
    fr: 'Annulé',
    ja: 'キャンセル済み',
    'zh-CN': '已取消',
  },
  pending: {
    vi: 'Chờ xử lý',
    en: 'Pending',
    fr: 'En attente',
    ja: '保留中',
    'zh-CN': '待处理',
  },
  confirmed: {
    vi: 'Đã xác nhận',
    en: 'Confirmed',
    fr: 'Confirmé',
    ja: '確認済み',
    'zh-CN': '已确认',
  },
};

// ============================================================================
// 5. RESILIENT RESOLVER FUNCTIONS
// ============================================================================

/**
 * Normalizes text for fuzzy match
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds a retreat package entry by code, id, or canonical name
 */
export function findRetreatPackageI18n(keyOrCodeOrId?: string | number | null): LocalizedRetreatPackage | null {
  if (keyOrCodeOrId === undefined || keyOrCodeOrId === null) return null;

  // Direct match by code
  const codeKey = String(keyOrCodeOrId).trim().toUpperCase();
  if (RETREAT_PACKAGES_I18N[codeKey]) {
    return RETREAT_PACKAGES_I18N[codeKey];
  }

  // Match by numeric ID
  const numId = typeof keyOrCodeOrId === 'number' ? keyOrCodeOrId : parseInt(codeKey, 10);
  if (!isNaN(numId)) {
    const byId = Object.values(RETREAT_PACKAGES_I18N).find((p) => p.id === numId);
    if (byId) return byId;
  }

  // Match by code pattern in string (e.g. contains 'RET-DETOX-03')
  const matchedBySubCode = Object.values(RETREAT_PACKAGES_I18N).find((p) =>
    codeKey.includes(p.packageCode)
  );
  if (matchedBySubCode) return matchedBySubCode;

  // Match by name similarity or keywords
  const norm = normalizeKey(String(keyOrCodeOrId));
  const matchedByName = Object.values(RETREAT_PACKAGES_I18N).find((p) => {
    return (
      norm.includes(normalizeKey(p.packageCode)) ||
      norm.includes(normalizeKey(p.name.vi)) ||
      norm.includes(normalizeKey(p.name.en)) ||
      (norm.includes('puredetox') && p.packageCode === 'RET-DETOX-03') ||
      (norm.includes('deepreset') && p.packageCode === 'RET-DETOX-05') ||
      (norm.includes('deepsleep') && p.packageCode === 'RET-SLEEP-03') ||
      (norm.includes('mindbody') && p.packageCode === 'RET-STRESS-04') ||
      (norm.includes('longevity') && p.packageCode === 'RET-AGING-04') ||
      (norm.includes('posture') && p.packageCode === 'RET-ALIGN-03') ||
      (norm.includes('vitality') && p.packageCode === 'RET-VITAL-05') ||
      (norm.includes('mothertobe') && p.packageCode === 'RET-MOM-03')
    );
  });

  return matchedByName || null;
}

/**
 * Resolves a full 5-language localized object for a retreat package
 */
export function resolvePackageLocalized(
  keyOrCodeOrId?: string | number | null,
  fallback?: string
): LocalizedText {
  const pkg = findRetreatPackageI18n(keyOrCodeOrId);
  const fb = fallback || (keyOrCodeOrId ? String(keyOrCodeOrId) : 'Retreat Journey');
  if (pkg) {
    return pkg.name;
  }
  return {
    vi: fb,
    en: fb,
    fr: fb,
    ja: fb,
    'zh-CN': fb,
  };
}

/**
 * Resolves localized package name for a specific language
 */
export function resolvePackageName(
  keyOrCodeOrId?: string | number | null,
  lang?: string,
  fallback?: string
): string {
  const loc = resolvePackageLocalized(keyOrCodeOrId, fallback);
  const target = (lang || 'vi') as SupportedLocale;
  return loc[target] || loc.en || loc.vi || (fallback || '');
}

/**
 * Resolves localized package wellness goal for a specific language
 */
export function resolvePackageWellnessGoal(
  keyOrCodeOrId?: string | number | null,
  lang?: string,
  fallback?: string
): string {
  const pkg = findRetreatPackageI18n(keyOrCodeOrId);
  if (!pkg) return fallback || '';
  const target = (lang || 'vi') as SupportedLocale;
  return pkg.wellnessGoal[target] || pkg.wellnessGoal.en || pkg.wellnessGoal.vi || (fallback || '');
}

/**
 * Finds a villa category entry by id or name
 */
export function findVillaCategoryI18n(keyOrId?: string | number | null): LocalizedVillaCategory | null {
  if (keyOrId === undefined || keyOrId === null) return null;

  const keyStr = String(keyOrId).trim();
  // By numeric ID (1-6)
  if (VILLA_CATEGORIES_I18N[keyStr]) {
    return VILLA_CATEGORIES_I18N[keyStr];
  }

  const numId = typeof keyOrId === 'number' ? keyOrId : parseInt(keyStr, 10);
  if (!isNaN(numId) && VILLA_CATEGORIES_I18N[String(numId)]) {
    return VILLA_CATEGORIES_I18N[String(numId)];
  }

  // By code or name fuzzy match
  const norm = normalizeKey(keyStr);
  const found = Object.values(VILLA_CATEGORIES_I18N).find((v) => {
    return (
      norm.includes(normalizeKey(v.code)) ||
      norm.includes(normalizeKey(v.name.en)) ||
      norm.includes(normalizeKey(v.name.vi)) ||
      (norm.includes('garden') && v.id === 1) ||
      (norm.includes('beachfront') && v.id === 2) ||
      (norm.includes('2bedroom') && v.id === 3) ||
      (norm.includes('oceanview') && v.id === 4) ||
      (norm.includes('familyestate') && v.id === 5) ||
      (norm.includes('presidential') && v.id === 6)
    );
  });

  return found || null;
}

/**
 * Resolves full 5-language localized object for a villa category
 */
export function resolveVillaCategoryLocalized(
  keyOrId?: string | number | null,
  fallback?: string
): LocalizedText {
  const cat = findVillaCategoryI18n(keyOrId);
  const fb = fallback || (keyOrId ? String(keyOrId) : 'Standard Villa');
  if (cat) {
    return cat.name;
  }
  return {
    vi: fb,
    en: fb,
    fr: fb,
    ja: fb,
    'zh-CN': fb,
  };
}

/**
 * Resolves localized villa category name for a specific language
 */
export function resolveVillaCategoryName(
  keyOrId?: string | number | null,
  lang?: string,
  fallback?: string
): string {
  const loc = resolveVillaCategoryLocalized(keyOrId, fallback);
  const target = (lang || 'vi') as SupportedLocale;
  return loc[target] || loc.en || loc.vi || (fallback || '');
}

/**
 * Finds a spa treatment entry by code, ID, or name
 */
export function findSpaTreatmentI18n(keyOrCodeOrId?: string | number | null): LocalizedSpaTreatment | null {
  if (keyOrCodeOrId === undefined || keyOrCodeOrId === null) return null;

  const codeStr = String(keyOrCodeOrId).trim().toUpperCase();
  if (SPA_TREATMENTS_I18N[codeStr]) {
    return SPA_TREATMENTS_I18N[codeStr];
  }

  // By numeric ID
  const numId = typeof keyOrCodeOrId === 'number' ? keyOrCodeOrId : parseInt(codeStr, 10);
  if (!isNaN(numId)) {
    const byId = Object.values(SPA_TREATMENTS_I18N).find((t) => t.id === numId);
    if (byId) return byId;
  }

  // By code contained in string
  const byCode = Object.values(SPA_TREATMENTS_I18N).find((t) => codeStr.includes(t.code));
  if (byCode) return byCode;

  // By name fuzzy match
  const norm = normalizeKey(codeStr);
  const byName = Object.values(SPA_TREATMENTS_I18N).find((t) => {
    return (
      norm.includes(normalizeKey(t.code)) ||
      norm.includes(normalizeKey(t.name.vi)) ||
      norm.includes(normalizeKey(t.name.en)) ||
      (norm.includes('vietnameseacupressure') && t.code === 'SPA-MASS-04') ||
      (norm.includes('traditionalherbal') && t.code === 'SPA-MASS-05') ||
      (norm.includes('maternal') && t.code === 'SPA-MASS-06') ||
      (norm.includes('guasha') && t.code === 'SPA-FACE-01') ||
      (norm.includes('cellularhydration') && t.code === 'SPA-FACE-02') ||
      (norm.includes('organicalgae') && t.code === 'SPA-FACE-03') ||
      (norm.includes('coffee') && t.code === 'SPA-BODY-01') ||
      (norm.includes('mudwrap') && t.code === 'SPA-BODY-02') ||
      (norm.includes('mineralmud') && t.code === 'SPA-BODY-02') ||
      (norm.includes('vichy') && t.code === 'SPA-HYDRO-01') ||
      (norm.includes('reddao') && t.code === 'SPA-HYDRO-02') ||
      (norm.includes('soundhealing') && t.code === 'SPA-HEAL-01') ||
      (norm.includes('tibetansound') && t.code === 'SPA-HEAL-01') ||
      (norm.includes('shirodhara') && t.code === 'SPA-HEAL-02') ||
      (norm.includes('chineitsang') && t.code === 'SPA-HEAL-03') ||
      (norm.includes('spinealignment') && t.code === 'SPA-YOGA-01') ||
      (norm.includes('breathwork') && t.code === 'SPA-YOGA-02') ||
      (norm.includes('hotstone') && t.code === 'SPA-MASS-01') ||
      (norm.includes('himalayan') && t.code === 'SPA-MASS-01') ||
      (norm.includes('deeptissue') && t.code === 'SPA-MASS-02') ||
      (norm.includes('lymphatic') && t.code === 'SPA-MASS-03')
    );
  });

  return byName || null;
}

/**
 * Resolves full 5-language localized object for a spa treatment
 */
export function resolveSpaTreatmentLocalized(
  keyOrCodeOrId?: string | number | null,
  fallback?: string
): LocalizedText {
  const trt = findSpaTreatmentI18n(keyOrCodeOrId);
  const fb = fallback || (keyOrCodeOrId ? String(keyOrCodeOrId) : 'Spa Treatment');
  if (trt) {
    return trt.name;
  }
  return {
    vi: fb,
    en: fb,
    fr: fb,
    ja: fb,
    'zh-CN': fb,
  };
}

/**
 * Resolves localized spa treatment description
 */
export function resolveSpaTreatmentDescriptionLocalized(
  keyOrCodeOrId?: string | number | null,
  fallback?: string
): LocalizedText {
  const trt = findSpaTreatmentI18n(keyOrCodeOrId);
  const fb = fallback || '';
  if (trt) {
    return trt.description;
  }
  return {
    vi: fb,
    en: fb,
    fr: fb,
    ja: fb,
    'zh-CN': fb,
  };
}

/**
 * Resolves localized spa treatment name for a specific language
 */
export function resolveSpaTreatmentName(
  keyOrCodeOrId?: string | number | null,
  lang?: string,
  fallback?: string
): string {
  const loc = resolveSpaTreatmentLocalized(keyOrCodeOrId, fallback);
  const target = (lang || 'vi') as SupportedLocale;
  return loc[target] || loc.en || loc.vi || (fallback || '');
}

/**
 * Resolves localized spa treatment category for a specific language
 */
export function resolveSpaTreatmentCategory(
  keyOrCodeOrId?: string | number | null,
  lang?: string,
  fallback?: string
): string {
  const trt = findSpaTreatmentI18n(keyOrCodeOrId);
  const target = (lang || 'vi') as SupportedLocale;
  if (trt?.category) {
    return trt.category[target] || trt.category.en || trt.category.vi || (fallback || '');
  }
  return fallback || '';
}

/**
 * Resolves booking status label
 */
export function resolveBookingStatusText(status?: string, lang?: string): string {
  if (!status) return '';
  const key = status.toLowerCase();
  const loc = BOOKING_STATUS_I18N[key];
  if (!loc) return status;
  const target = (lang || 'vi') as SupportedLocale;
  return loc[target] || loc.en || loc.vi || status;
}
