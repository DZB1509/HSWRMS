export interface DailyItineraryItem {
  day: number;
  stageNumber: string; // e.g. "001", "002"
  title: Record<string, string>;
  description: Record<string, string>;
  highlights: Record<string, string[]> | string[];
}

export interface RetreatPackage {
  id: string;
  slug: string;
  days: number;
  nights: number;
  startingPrice: number; // in VND
  heroImage: string;
  galleryImages: string[];
  names: Record<string, string>;
  taglines: Record<string, string>;
  summaries: Record<string, string>;
  descriptions: Record<string, string>;
  villaName: Record<string, string>;
  villaDescription: Record<string, string>;
  suitableFor: Record<string, string[]>;
  inclusions: Record<string, string[]>;
  wellnessHighlights: Record<string, string[]>;
  diningHighlights: Record<string, string[]>;
  itinerary: DailyItineraryItem[];
}

export const MOCK_RETREAT_PACKAGES: RetreatPackage[] = [
  {
    id: 'ret-01',
    slug: 'mindful-renewal',
    days: 3,
    nights: 2,
    startingPrice: 18500000,
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
    ],
    names: {
      vi: 'Tái Tạo Tĩnh Thức',
      en: 'Mindful Renewal',
      'zh-CN': '正念觉醒·焕新之旅',
      ja: 'マインドフル・リニューアル',
      fr: 'Renouveau en Pleine Conscience',
    },
    taglines: {
      vi: '3 Ngày 2 Đêm · Tĩnh Lặng & Giải Tỏa Áp Lực Sâu',
      en: '3 Days 2 Nights · Deep Silence & Stress Relief',
      'zh-CN': '3天2晚 · 沉浸深静与身心释压',
      ja: '3日間2泊 · 静寂と深層リラクゼーション',
      fr: '3 Jours 2 Nuits · Silence Profond & Détente Absolue',
    },
    summaries: {
      vi: 'Hành trình ngắn ngày được thiết kế riêng để tái thiết năng lượng, phục hồi giấc ngủ và thanh lọc tâm trí qua các liệu pháp thảo dược cổ truyền cùng yoga bình minh.',
      en: 'A concise transformative retreat crafted to reset internal energy, restore natural sleep cycles, and clear mental tension through ancestral herbal therapies and dawn yoga.',
      'zh-CN': '专为释放累积压力打造的短途疗愈之旅，融合传统草本调理、日出瑜伽与有机轻食，重焕充沛精力。',
      ja: '日々の疲労と睡眠の乱れを整える3日間のリセット滞在。東洋ハーブ温熱療法と朝日を浴びるヨガで、クリアな意識を取り戻します。',
      fr: 'Une courte immersion réparatrice conçue pour réinitialiser les cycles de sommeil et libérer les tensions mentales par l’herboristerie ancestrale et le yoga matinal.',
    },
    descriptions: {
      vi: 'Mindful Renewal là sự kết hợp tinh tế giữa việc nghỉ ngơi tuyệt đối trong biệt thự hướng biển biệt lập và chuỗi liệu trình chăm sóc chuyên sâu. Bạn sẽ được chuyên gia thể trạng đo lường chỉ số căng thẳng, sau đó bước vào lộ trình thủy trị liệu khoáng nóng, massage ấn huyệt thảo mộc và các buổi thiền chuông thanh lọc tâm trí.',
      en: 'Mindful Renewal balances secluded oceanfront villa living with intensive, restorative wellness rituals. Beginning with an intuitive wellness assessment, your days transition effortlessly from warm mineral hydrotherapy and poultice acupressure to sunset Tibetan singing bowl meditations.',
      'zh-CN': 'Mindful Renewal 将独栋临海别墅的静谧隐居与高阶定制调养相融合。由资深理疗师为您开启体质评估，随之沉浸于矿泉水疗、草本温灸与日落颂钵冥想中。',
      ja: 'プライベートな海辺のヴィラでの贅沢な休息と、体系的なウェルネスケアの融合。滞在初日の個別カウンセリングから始まり、ミネラル温鉱泉、ハーブ温圧、そして夕暮れのチベットシンギングボウル瞑想へと導かれます。',
      fr: 'Mindful Renewal associe l’intimité d’une villa face à l’océan à des rituels de soin ciblés. Débutant par un bilan de vitalité personnalisé, votre séjour s’articule autour de l’hydrothérapie minérale, de massages aux herbes et de méditations sonores au crépuscule.',
    },
    villaName: {
      vi: 'Ocean Cliff Mineral Pool Villa',
      en: 'Ocean Cliff Mineral Pool Villa',
      'zh-CN': '悬崖海景矿泉泳池别墅',
      ja: 'オーシャンクリフ・ミネラルプールヴィラ',
      fr: 'Villa Falaises Marines avec Piscine Minérale',
    },
    villaDescription: {
      vi: 'Biệt thự 180m² trên vách đá nhìn trọn vịnh Vĩnh Hy, hồ bơi nước khoáng ấm riêng và sàn thiền định gỗ teak ngoài trời.',
      en: 'A 180m² private clifftop haven overlooking Vinh Hy Bay, complete with heated mineral plunge pool and teakwood meditation deck.',
      'zh-CN': '180平方米悬崖居所，私享永熙湾全景、独立恒温矿泉泳池及户外柚木瑜伽冥想台。',
      ja: 'ビンヒー湾を望む180㎡の断崖ヴィラ。専用の温鉱泉プールとチーク材の屋外瞑想デッキを備えています。',
      fr: 'Un refuge privé de 180m² surplombant la baie, doté d’une piscine minérale chauffée et d’une terrasse de méditation en teck.',
    },
    suitableFor: {
      vi: ['Mất ngủ mãn tính', 'Căng thẳng văn phòng', 'Cần nạp năng lượng nhanh', 'Lần đầu trải nghiệm Retreat'],
      en: ['Chronic Sleeplessness', 'Executive Fatigue', 'Rapid Recharge', 'First-time Retreat Customers'],
      'zh-CN': ['慢性失眠', '职场高压疲劳', '短途极速能量补给', '初次体验疗愈者'],
      ja: ['慢性的な睡眠不足', '仕事のストレス過多', '短期間での活力回復', '初めてのリトリート滞在'],
      fr: ['Insomnies chroniques', 'Fatigue nerveuse', 'Recharge rapide', 'Première expérience de retraite'],
    },
    inclusions: {
      vi: [
        '2 Đêm nghỉ tại Ocean Cliff Mineral Pool Villa',
        '2 Buổi trị liệu thảo dược Đông y chuyên sâu (90 phút/buổi)',
        'Tham gia lớp Yoga Sunrise & Sound Bath hàng ngày',
        'Thực đơn 3 bữa dưỡng sinh organic toàn phần theo thể trạng',
        'Dịch vụ quản gia chăm sóc sức khỏe riêng biệt 24/7',
        'Đưa đón sân bay Cam Ranh khứ hồi bằng xe limousine cao cấp'
      ],
      en: [
        '2 Nights in Ocean Cliff Mineral Pool Villa',
        '2 Bespoke Ancestral Herbal Therapies (90 mins each)',
        'Daily Sunrise Yoga & Sunset Sound Bath Sessions',
        'Full-board personalized organic wellness gastronomy',
        'Dedicated personal wellness ambassador service 24/7',
        'Complimentary luxury private transfers from Cam Ranh Airport'
      ],
      'zh-CN': [
        '入住悬崖海景矿泉泳池别墅 2 晚',
        '2 次定制东方草本深度理疗（每次 90 分钟）',
        '每日晨曦流瑜伽与落日颂钵音声疗愈',
        '量身体质定制的三餐全有机滋补美馔',
        '24 小时私享专属养生管家服务',
        '金兰国际机场往返豪华专车私密接送'
      ],
      ja: [
        'オーシャンクリフ・ミネラルプールヴィラでのご宿泊 2泊',
        '専任セラピストによる東洋ハーブ療法 2回（各90分）',
        '毎朝のサンライズヨガ＆夕刻のサウンドバスへの参加',
        '個別の体質に合わせた3食のオーガニック養生料理',
        '24時間対応の専任ウェルネスアンバサダーサービス',
        'カムラン空港からの往復高級リムジン無料送迎'
      ],
      fr: [
        '2 Nuits en Villa Falaises Marines avec Piscine Minérale',
        '2 Soins ancestraux personnalisés aux herbes (90 min chacun)',
        'Séances quotidiennes de Yoga au lever du soleil & Bain sonore',
        'Pension complète gastronomique biologique adaptée à votre profil',
        'Service d’un ambassadeur de bien-être dédié 24h/24',
        'Transferts privés aller-retour en limousine depuis l’aéroport de Cam Ranh'
      ],
    },
    wellnessHighlights: {
      vi: ['Ấn huyệt kinh lạc thảo dược ấm', 'Thủy liệu pháp khoáng nóng biệt lập', 'Liệu pháp âm thanh chuông xoay Tây Tạng'],
      en: ['Heated Herbal Poultice Acupressure', 'Secluded Thermal Hydrotherapy', 'Full Moon Tibetan Sound Healing'],
      'zh-CN': ['温热草本经络点穴理疗', '私密温矿泉水疗净润', '满月颂钵音声深层共振'],
      ja: ['温熱ハーブ温圧・経絡トリートメント', '完全個室の温鉱泉ハイドロセラピー', 'チベットシンギングボウルによるサウンドヒーリング'],
      fr: ['Acupression aux pochons d’herbes chaudes', 'Hydrothérapie thermale privée', 'Bain sonore aux bols tibétains traditionnels'],
    },
    diningHighlights: {
      vi: ['100% nguyên liệu hữu cơ từ nông trại Đà Lạt', 'Công thức ít muối, không đường tinh luyện', 'Trà thảo mộc bài trừ độc tố tự nhiên'],
      en: ['100% Certified Organic Farm Produce from Dalat', 'Refined sugar-free, low-sodium culinary balancing', 'Artisanal detoxification herbal infusions'],
      'zh-CN': ['大叻有机农场每日晨摘应季食材', '天然减盐无精制糖的纯粹烹饪', '秘方草本天然净体调理茶饮'],
      ja: ['ダラット有機農園直送の厳選食材', '精製糖不使用・減塩による身体に優しい調味', '自家製デトックスハーブティー'],
      fr: ['Produits 100% biologiques des hauts plateaux de Dalat', 'Cuisine sans sucre raffiné et à faible teneur en sodium', 'Infusions détoxifiantes artisanales aux plantes'],
    },
    itinerary: [
      {
        day: 1,
        stageNumber: '001',
        title: {
          vi: 'Đón Tiếp, Thể Trạng & Giấc Ngủ An Yên',
          en: 'Arrival, Constitution Assessment & Sound Sleep',
          'zh-CN': '抵离安歇·体质问诊与深眠初启',
          ja: 'ご到着・体質カルテ作成と安眠への誘い',
          fr: 'Accueil, Bilan de Vitalité & Sommeil Réparateur',
        },
        description: {
          vi: 'Đón bạn từ sân bay về với vịnh biển. Thưởng thức trà thảo mộc chào mừng, gặp gỡ chuyên gia sức khỏe để ghi nhận chỉ số và bước vào buổi ngâm khoáng giải tỏa mỏi mệt.',
          en: 'Luxury private arrival from Cam Ranh. Welcome botanical elixir, private consultation to personalize your treatment journey, and an evening soothing mineral bath.',
          'zh-CN': '专车迎抵。静享定制欢迎草本茶饮，面见专业理疗师记录体能指标，晚间体验舒缓矿泉浴，开启深层睡眠。',
          ja: '空港からの専用車でお出迎え。ウェルカムハーブティーの後、体質カルテを作成し、夕刻のミネラル温浴で旅の疲れをほぐします。',
          fr: 'Arrivée privée depuis l’aéroport. Élixir botanique de bienvenue, consultation individuelle pour affiner votre parcours et bain minéral du soir.',
        },
        highlights: {
          vi: ['Nhận phòng riêng tại biệt thự', 'Tư vấn thể trạng & sức khỏe chuyên sâu', 'Nghi thức ngâm chân thảo mộc'],
          en: ['Private Check-in at Villa', 'Comprehensive Wellness Consultation', 'Herbal Foot Cleansing Ritual'],
          'zh-CN': ['别墅内专属私密入住', '全维体质健康问诊评估', '草本足道净润舒缓仪式'],
          ja: ['ヴィラ内プライベートチェックイン', '専任カウンセラーによる健康問診', 'ハーブフットバス浄化リチュアル'],
          fr: ['Enregistrement privé en villa', 'Consultation de bien-être approfondie', 'Rituel de bain de pieds aux herbes'],
        },
      },
      {
        day: 2,
        stageNumber: '002',
        title: {
          vi: 'Thức Tỉnh Bình Minh & Trị Liệu Thảo Mộc',
          en: 'Dawn Awakening & Ancestral Herbal Therapy',
          'zh-CN': '晨光初醒·经典草本深度疗愈',
          ja: '目覚めの呼吸と伝統ハーブトリートメント',
          fr: 'Éveil Matinal & Soin Ancestral aux Plantes',
        },
        description: {
          vi: 'Chào ngày mới với lớp yoga hơi thở bên vách đá. Buổi chiều trải nghiệm 90 phút ấn huyệt thảo mộc nóng giải phóng tắc nghẽn cơ thể, khép lại bằng tiệc tối thực dưỡng ngắm hoàng hôn.',
          en: 'Greet the sunrise with clifftop breathwork yoga. The afternoon unveils a 90-minute warm herbal poultice massage, culminating in a candlelit organic dinner by the sea.',
          'zh-CN': '崖顶晨流瑜伽开启清晨。午后享受 90 分钟秘方草本温敷推拿疏通经络，黄昏时分面朝大海享用烛光有机晚宴。',
          ja: '断崖デッキでのモーニングヨガからスタート。午後は90分間の温熱ハーブ温圧トリートメントで滞りを流し、夕暮れ時の養生ディナーを。',
          fr: 'Salutation du soleil avec yoga postural sur les falaises. Après-midi consacré au massage signature de 90 minutes aux pochons chauds, suivi d’un dîner biologique aux chandelles.',
        },
        highlights: {
          vi: ['Yoga Vinyasa chào bình minh', '90 phút ấn huyệt thảo mộc nóng đặc trưng', 'Thiền định hoàng hôn hướng biển'],
          en: ['Sunrise Vinyasa Flow', '90-min Signature Herbal Poultice', 'Sunset Ocean Meditation'],
          'zh-CN': ['晨光朝阳流瑜伽修习', '90分钟经典温热本草温灸推拿', '落日沧海静心冥想'],
          ja: ['サンライズ・ヴィンヤサヨガ', '90分 伝統ハーブ温圧シグネチャー', '夕暮れのオーシャン瞑想'],
          fr: ['Vinyasa yoga au lever du soleil', 'Soin signature aux pochons d’herbes 90 min', 'Méditation face à la mer au crépuscule'],
        },
      },
      {
        day: 3,
        stageNumber: '003',
        title: {
          vi: 'Cân Bằng Nội Tại & Trở Về Tràn Đầy Sức Sống',
          en: 'Inner Alignment & Rejuvenated Departure',
          'zh-CN': '内在调和·满载生机笃定归途',
          ja: '心身の調和と健やかな旅立ち',
          fr: 'Alignement Intérieur & Départ Revitalisé',
        },
        description: {
          vi: 'Buổi thiền chuông xoay Tây Tạng buổi sáng giúp cố định năng lượng tích cực. Nhận hồ sơ tư vấn chế độ sinh hoạt tiếp nối tại nhà từ chuyên gia trước khi khởi hành.',
          en: 'A morning Tibetan singing bowl resonance locks in centered energy. Receive your personalized post-retreat lifestyle and dietary guide before private transfer home.',
          'zh-CN': '清晨颂钵音疗凝驻充盈能量。离开前理疗师将交付专属居家养生与食疗指引手册，专车护送启程。',
          ja: 'シンギングボウルの響きに身を委ね、整ったエネルギーを定着させます。ご自宅での養生アドバイスを受け取り、爽やかにご出発。',
          fr: 'Bain sonore matinal aux bols chantants pour ancrer la sérénité. Remise de votre guide de bien-être personnalisé à poursuivre chez vous avant le transfert retour.',
        },
        highlights: {
          vi: ['Trị liệu âm thanh chuông xoay Tây Tạng', 'Cẩm nang dưỡng sinh cá nhân tại nhà', 'Bữa trưa dinh dưỡng tạm biệt'],
          en: ['Tibetan Sound Immersion', 'Personalized Take-Home Wellness Guide', 'Farewell Vitality Brunch'],
          'zh-CN': ['西藏全频颂钵共振音声疗愈', '专属居家调养与食疗指引手册', '欢送元气营养午宴'],
          ja: ['チベットシンギングボウル音浴体験', 'ご自宅用パーソナル養生ガイド', '旅立ちのヴァイタリティブランチ'],
          fr: ['Immersion sonore aux bols tibétains', 'Guide personnalisé de bien-être à emporter', 'Brunch revitalisant d’au revoir'],
        },
      },
    ],
  },
  {
    id: 'ret-02',
    slug: 'complete-reset',
    days: 5,
    nights: 4,
    startingPrice: 36000000,
    heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80',
    ],
    names: {
      vi: 'Chuyển Hóa Toàn Diện',
      en: 'Complete Reset',
      'zh-CN': '身心蜕变·重塑生命节律',
      ja: 'コンプリート・リセット',
      fr: 'Réinitialisation Complète',
    },
    taglines: {
      vi: '5 Ngày 4 Đêm · Tái Tạo Hệ Miễn Dịch & Thải Độc Sâu',
      en: '5 Days 4 Nights · Immune Restoration & Deep Detox',
      'zh-CN': '5天4晚 · 深度排毒与自愈力激活',
      ja: '5日間4泊 · 免疫力向上と深層デトックス',
      fr: '5 Jours 4 Nuits · Régénération Immunitaire & Détox Profonde',
    },
    summaries: {
      vi: 'Chương trình nghỉ dưỡng chuyên sâu kéo dài 5 ngày giúp tái lập nhịp sinh học tự nhiên, kích hoạt khả năng tự chữa lành của cơ thể và nuôi dưỡng tâm trí an lạc.',
      en: 'A comprehensive 5-day sanctuary program designed to reset circadian rhythms, trigger somatic self-healing, and cultivate enduring mental serenity.',
      'zh-CN': '为期5天的深度沉浸式静修，旨在重建天然昼夜生物节律，唤醒身体自我疗愈本能，培育深沉宁静。',
      ja: '生体リズムを根本からリセットする5日間の本格プログラム。自己治癒力を高め、揺るぎない心の平穏を育みます。',
      fr: 'Un programme complet de 5 jours conçu pour rééquilibrer vos rythmes circadiens, stimuler l’auto-guérison et cultiver une paix intérieure durable.',
    },
    descriptions: {
      vi: 'Complete Reset là kỳ nghỉ dưỡng được khách hàng yêu thích nhất tại HeavenStay. Trong 5 ngày, bạn sẽ tạm ngắt kết nối với thế giới kỹ thuật số, hòa mình vào không gian rừng và biển nguyên sơ, trải nghiệm thực đơn thanh lọc 5 màu và các liệu trình spa thải độc chuyên sâu.',
      en: 'Complete Reset is HeavenStay’s flagship sanctuary experience. Over five unhurried days, disconnect from digital noise, embrace untouched wilderness, and immerse yourself in an anti-inflammatory 5-color culinary curriculum paired with intensive daily botanical spa rituals.',
      'zh-CN': 'Complete Reset 是 HeavenStay 备受赞誉的招牌疗愈体验。在这从容的 5 天里，远离数码干扰，依偎原生林海，体验五色抗炎食疗与每日专属水疗护理。',
      ja: 'HeavenStayを象徴する一番人気の5日間プログラム。デジタルの喧騒を離れ、森と海の自然に抱かれながら、抗酸化5色食養生と日替わりの本格スパトリートメントをご堪能いただけます。',
      fr: 'Complete Reset est l’expérience emblématique de HeavenStay. Durant cinq jours hors du temps, déconnectez-vous du tumulte numérique et profitez d’une alimentation anti-inflammatoire associée à des soins quotidiens d’exception.',
    },
    villaName: {
      vi: 'Lotus Water Sanctuary Villa',
      en: 'Lotus Water Sanctuary Villa',
      'zh-CN': '莲池水榭独栋水疗别墅',
      ja: 'ロータスウォーター・サンクチュアリヴィラ',
      fr: 'Villa Sanctuaire sur l’Eau aux Nénuphars',
    },
    villaDescription: {
      vi: 'Biệt thự nổi 220m² giữa hồ sen tự nhiên, có phòng xông hơi thảo dược riêng, bồn ngâm đá nguyên khối và lối đi riêng ra bãi biển.',
      en: 'A 220m² overwater sanctuary nestled across natural lotus ponds, featuring private herbal steam suite, monolithic stone tub, and direct path to secluded sands.',
      'zh-CN': '220平方米水上私属胜境，矗立于天然莲池之上，拥有独立草本蒸汽房、天然整石浴缸及直达秘境沙滩的私家小径。',
      ja: '自然の蓮池に佇む220㎡の水上ヴィラ。専用ハーブスチームサウナ、一枚岩を削り出した石風呂、静かなプライベートビーチへの小径を備えています。',
      fr: 'Un havre de paix sur pilotis de 220m² sur un lac de lotus naturel, comprenant hammam aux herbes privatif, baignoire en pierre monolithique et accès direct à la plage.',
    },
    suitableFor: {
      vi: ['Kiệt sức thể chất & tinh thần (Burnout)', 'Mất cân bằng chuyển hóa', 'Cần thải độc thanh lọc cơ thể', 'Tái thiết lập lối sống'],
      en: ['Executive Burnout', 'Metabolic Imbalance', 'Systemic Detoxification', 'Lifestyle Transformation'],
      'zh-CN': ['深度疲惫与职业倦怠', '代谢紊乱失调', '全身深度排毒调理', '重构健康生活方式'],
      ja: ['重度の慢性疲労・バーンアウト', '代謝サイクルの乱れ', '本格的な体内デトックス', 'ライフスタイルの根本改善'],
      fr: ['Épuisement professionnel (Burnout)', 'Déséquilibre métabolique', 'Détoxification globale', 'Transition de vie'],
    },
    inclusions: {
      vi: [
        '4 Đêm nghỉ tại Lotus Water Sanctuary Villa',
        '4 Buổi trị liệu thải độc và massage đá nóng núi lửa (90-120 phút/buổi)',
        'Buổi tư vấn chế độ ăn cá nhân hóa cùng Bếp trưởng Dưỡng sinh',
        'Lớp học Yoga chuyên sâu, Thiền Vipassana & Khí công buổi sáng',
        'Thực đơn thực dưỡng thanh lọc 5 bữa/ngày (bao gồm trà thảo dược bài độc)',
        'Đặc quyền tắm rừng trị liệu (Shinrin-yoku) có hướng dẫn viên chuyên biệt'
      ],
      en: [
        '4 Nights in Lotus Water Sanctuary Villa',
        '4 Daily Detox & Volcanic Hot Stone Rituals (90-120 mins each)',
        'Private One-on-One Consultation with our Executive Wellness Chef',
        'Daily Advanced Yoga, Vipassana Meditation & Morning Qigong',
        '5-course daily nutrient-dense detox menu including botanical elixirs',
        'Guided Shinrin-yoku (Forest Bathing) sensory immersion in national park'
      ],
      'zh-CN': [
        '入住莲池水榭独栋水疗别墅 4 晚',
        '4 次每日排毒与火山温石疗愈（每次 90-120 分钟）',
        '与养生行政总厨进行一对一专属饮食方案深度定制',
        '每日进阶体位瑜伽、内观禅修与晨间气功调息',
        '全天五次少食多餐营养密集的排毒餐配以药膳草本饮',
        '国家森林保护区专属向导陪同之沉浸式森林浴（Shinrin-yoku）'
      ],
      ja: [
        'ロータスウォーター・サンクチュアリヴィラでのご宿泊 4泊',
        'デトックス＆火山岩ホットストーン療法 4回（各90〜120分）',
        'エグゼクティブ・ウェルネスシェフとの個別栄養相談',
        'アドバンスヨガ、ヴィパッサナー瞑想、朝の気功セッション',
        '1日5回の栄養バランスを考慮したデトックスコースと薬膳茶',
        '国立公園内のガイド付き森林浴（シンリンヨク）体験'
      ],
      fr: [
        '4 Nuits en Villa Sanctuaire sur l’Eau aux Nénuphars',
        '4 Rituels détoxifiants et massages aux pierres volcaniques (90-120 min)',
        'Consultation diététique privée avec le Chef exécutif bien-être',
        'Séances de Yoga avancé, Méditation Vipassana & Qi Gong matinal',
        'Pension détox 5 repas légers par jour incluant élixirs botaniques',
        'Immersion guidée de bain de forêt (Shinrin-yoku) dans le parc national'
      ],
    },
    wellnessHighlights: {
      vi: ['Massage thải độc đá nóng bazan', 'Tắm rừng Shinrin-yoku tĩnh lặng', 'Trị liệu thanh lọc gan ruột bằng thảo mộc'],
      en: ['Basalt Volcanic Stone Drainage', 'Guided National Forest Shinrin-yoku', 'Botanical Digestive Purification'],
      'zh-CN': ['玄武火山温石深层排酸引流', '国家公园深处静谧森林浴', '传统本草温润肠胃净化'],
      ja: ['玄武岩ホットストーンによるリンパドレナージュ', '国立公園でのマインドフル森林浴', '厳選ハーブを用いた体内クレンジング'],
      fr: ['Drainage aux pierres chaudes de basalte', 'Bain de forêt guidé (Shinrin-yoku)', 'Purification digestive par les plantes'],
    },
    diningHighlights: {
      vi: ['Chế độ ăn 5 màu thực vật bảo vệ tế bào', 'Nước ép thủy lực lạnh thanh lọc cơ thể', 'Gia vị thảo mộc kháng viêm tự nhiên'],
      en: ['5-Color Phytochemical Cellular Protection Cuisine', 'Cold-pressed bioactive juices', 'Anti-inflammatory artisanal spice curation'],
      'zh-CN': ['五色植物化学素细胞滋养美馔', '冷压初榨活性蔬果净化汁', '天然抗炎本草调味与汤膳'],
      ja: ['抗酸化・細胞活性を促す5色植物食', 'コールドプレス生搾りデトックスジュース', '抗炎症効果の高い厳選スパイス料理'],
      fr: ['Cuisine phytochimique aux 5 couleurs pour la régénération cellulaire', 'Jus pressés à froid bioactifs', 'Assaisonnements anti-inflammatoires faits maison'],
    },
    itinerary: [
      {
        day: 1,
        stageNumber: '001',
        title: {
          vi: 'Hội Tụ & Thanh Lọc Khởi Đầu',
          en: 'Arrival, Grounding & Cleansing Initiation',
          'zh-CN': '步入净境·身心立基与排毒初启',
          ja: '静寂への到着と身体のクレンジング',
          fr: 'Arrivée, Ancrage & Début de la Détox',
        },
        description: {
          vi: 'Nhận phòng tại biệt thự nổi sen. Kiểm tra thể trạng chi tiết và bắt đầu thực đơn thanh lọc nhẹ nhàng cùng buổi xông hơi thảo dược thơm.',
          en: 'Settle into your floating lotus sanctuary. Undergo biomarker and vitality screening, followed by an aromatic herbal steam session and cleansing supper.',
          'zh-CN': '入住水上莲池居所。进行全方位生理机能检测，享受香氛草本蒸汽疗愈与温润净体晚餐。',
          ja: '水上ヴィラにチェックイン。詳細なウェルネスチェックの後、アロマハーブスチームと軽やかなクレンジングディナーで旅が始まります。',
          fr: 'Installation dans votre villa sur pilotis. Bilan de vitalité approfondi, suivi d’une séance de hammam aromatique et d’un premier dîner détoxifiant.',
        },
        highlights: {
          vi: ['Đón tiếp tại Thủy Đình Sen', 'Đo lường chỉ số sinh học thể trạng', 'Không gian xông hơi thảo dược riêng'],
          en: ['Lotus Pavilion Welcome', 'Biomarker Vitality Screening', 'Herbal Steam Sanctuary'],
          'zh-CN': ['莲池水榭优雅迎宾', '生理机能与体质全项筛查', '私属香氛草本蒸汽房体验'],
          ja: ['ロータスパビリオンでのウェルカム', 'バイオマーカー測定＆健康診断', 'プライベートハーブスチームサウナ'],
          fr: ['Accueil au Pavillon du Lotus', 'Bilan des biomarqueurs et vitalité', 'Hammam privatif aux herbes bienfaisantes'],
        },
      },
      {
        day: 2,
        stageNumber: '002',
        title: {
          vi: 'Kích Hoạt Năng Lượng & Thải Độc Đá Núi Lửa',
          en: 'Vitality Awakening & Volcanic Stone Ritual',
          'zh-CN': '能量激发·火山温石深层排浊',
          ja: '生命力の覚醒と火山岩ホットストーン',
          fr: 'Éveil de Vitalité & Rituel aux Pierres Volcaniques',
        },
        description: {
          vi: 'Tập khí công đón năng lượng sớm. Trải nghiệm liệu trình 120 phút kết hợp đá bazan ấm và tinh dầu gừng rừng giải phóng cơ thể.',
          en: 'Morning qigong to align vital breath. Indulge in a 120-minute heated basalt stone ritual infused with wild ginger essence to melt muscular stagnation.',
          'zh-CN': '晨起修习气功调顺元气。午后体验 120 分钟玄武岩温石配合野姜精油的深层舒缓理疗。',
          ja: '朝の気功でエネルギーを活性化。午後は野性生姜オイルを用いた120分の玄武岩ホットストーントリートメントで深層のコリを解放します。',
          fr: 'Qi Gong matinal pour harmoniser le souffle. Rituel de 120 minutes aux pierres de basalte chaudes infusées de gingembre sauvage pour dissoudre les tensions.',
        },
        highlights: {
          vi: ['Khí công buổi sớm bên bờ biển', 'Nghi thức massage đá nóng bazan 120 phút', 'Nước uống thảo mộc kháng viêm hoàng hôn'],
          en: ['Ocean Morning Qigong', '120-min Basalt Hot Stone Ritual', 'Anti-inflammatory Sunset Tonic'],
          'zh-CN': ['晨曦海风气功调息', '120分钟玄武火山温石排酸护理', '夕阳天然抗炎养生药饮'],
          ja: ['海辺での朝の気功セッション', '120分 玄武岩ホットストーンリチュアル', '抗酸化ハーブトニック（夕暮れ）'],
          fr: ['Qi Gong matinal face à l’océan', 'Rituel aux pierres de basalte 120 min', 'Tonique anti-inflammatoire au coucher du soleil'],
        },
      },
      {
        day: 3,
        stageNumber: '003',
        title: {
          vi: 'Tắm Rừng Tĩnh Lặng & Chữa Lành Bằng Giác Quan',
          en: 'Shinrin-yoku Forest Bathing & Sensory Peace',
          'zh-CN': '静谧森林浴·五感深愈重连自然',
          ja: 'マインドフル森林浴と五感の解放',
          fr: 'Bain de Forêt Shinrin-yoku & Paix des Sens',
        },
        description: {
          vi: 'Đi bộ chánh niệm sâu vào rừng quốc gia cùng chuyên gia. Hít thở phytoncide tự nhiên, thiền định bên dòng suối mát và kết thúc bằng bữa trưa picnic hữu cơ.',
          en: 'Mindful walking deep into the pristine national biosphere. Inhale natural plant phytoncides, meditate beside crystalline forest streams, and enjoy an organic wilderness luncheon.',
          'zh-CN': '随专属向导步入国家森林深处体验正念步行，深呼吸天然植物精气（Phytoncide），在溪流畔冥想并享用野外有机轻食。',
          ja: '国立公園の深林へ入るガイド付きマインドフルウォーキング。フィトンチッドを胸いっぱいに吸い込み、清流のほとりで瞑想とピクニックランチを。',
          fr: 'Marche méditative au cœur de la réserve biosphère. Respirez les phytoncides bienfaisants, méditez près d’un ruisseau cristallin et dégustez un pique-nique bio en pleine nature.',
        },
        highlights: {
          vi: ['Tắm rừng Shinrin-yoku có hướng dẫn', 'Thiền định tĩnh lặng bên dòng suối', 'Khám phá ẩm thực thảo mộc hoang dã'],
          en: ['Guided Forest Bathing', 'Stream Meditation', 'Wild Plant Culinary Masterclass'],
          'zh-CN': ['国家公园专属向导森林浴', '溪畔空灵静心行禅', '野生本草植物食疗体验'],
          ja: ['ガイド付き森林浴（シンリンヨク）', '清流のほとりでのマインドフル瞑想', '自生ハーブのナチュラルフード体験'],
          fr: ['Bain de forêt guidé (Shinrin-yoku)', 'Méditation au bord du ruisseau', 'Atelier culinaire aux plantes sauvages'],
        },
      },
      {
        day: 4,
        stageNumber: '004',
        title: {
          vi: 'Cân Bằng Nội Tiết & Dưỡng Sinh Toàn Thân',
          en: 'Endocrine Alignment & Deep Somatic Restoration',
          'zh-CN': '节律调和·全身筋络深层固本',
          ja: 'ホルモンバランス調整と深層修復',
          fr: 'Harmonie Hormonale & Réparation Somatique Profonde',
        },
        description: {
          vi: 'Thực hành yoga hồi phục nhẹ nhàng (Restorative Yoga). Liệu pháp quấn ủ tảo biển thiên nhiên và massage bấm huyệt bạch huyết kích thích tuần hoàn.',
          en: 'Gentle restorative yoga with bolsters and silk wraps. Organic marine algae body cocoon followed by lymphatic drainage massage to illuminate internal radiance.',
          'zh-CN': '修习舒缓修复瑜伽。体验天然海洋藻泥身体裹敷与淋巴排毒引流手法，由内而外焕发机体活力。',
          ja: 'ボルスターを用いたリストラティブヨガ。海藻ボディパックとリンパドレナージュトリートメントで、全身の巡りを促します。',
          fr: 'Yoga restauratif doux avec supports. Enveloppement corporel aux algues marines et drainage lymphatique pour raviver la vitalité intérieure.',
        },
        highlights: {
          vi: ['Yoga hồi phục cùng chuông xoay', 'Quấn ủ thải độc tảo biển hữu cơ', 'Thực đơn 5 món dưỡng sinh của Bếp trưởng'],
          en: ['Restorative Yoga & Sound', 'Marine Algae Detox Cocoon', 'Chef’s Table Five-Course Vitality Dinner'],
          'zh-CN': ['舒缓修复瑜伽与音声和鸣', '天然海洋活藻身体排毒裹敷', '主厨定制五道式高能净体晚宴'],
          ja: ['リストラティブヨガ＆サウンド', 'オーガニック海藻デトックスパック', 'シェフズテーブル 5品コース養生ディナー'],
          fr: ['Yoga restauratif et vibration sonore', 'Enveloppement détoxifiant aux algues marines', 'Dîner vitalité 5 services de la Table du Chef'],
        },
      },
      {
        day: 5,
        stageNumber: '005',
        title: {
          vi: 'Tái Sinh & Khởi Đầu Chu Kỳ Sống Mới',
          en: 'Rebirth, Vitality Integration & Return',
          'zh-CN': '元气新生·全面整合与从容启程',
          ja: '新たな旅立ちと持続可能なウェルネス',
          fr: 'Renaissance, Intégration & Retour Serein',
        },
        description: {
          vi: 'Buổi thiền định bình minh ghi nhớ cảm giác an lạc. Chuyên gia trao gửi kế hoạch duy trì thói quen ăn uống, ngủ nghỉ khi trở về cuộc sống thường nhật.',
          en: 'Closing sunrise ceremony by the ocean. Receive your long-term holistic wellness roadmap, including recipe guides and movement plans, before luxury departure.',
          'zh-CN': '晨曦海滨结业冥想仪式。接收专属于您的长期养生路线图、食疗食谱与运动建议，尊享专车送别。',
          ja: '海辺での日の出クロージングセレモニー。帰宅後も実践できる食事レシピやストレッチプランを含むライフスタイル指針を受け取り、帰路へ。',
          fr: 'Cérémonie d’ancrage au lever du soleil face à la mer. Remise de votre feuille de route santé sur mesure avec recettes et conseils de vie avant votre départ.',
        },
        highlights: {
          vi: ['Vòng tròn kết nối thiền bình minh', 'Bản đồ định hướng sức khỏe dài hạn', 'Xe riêng đưa tiễn khứ hồi'],
          en: ['Sunrise Closing Circle', 'Personalized Long-term Health Blueprint', 'Private Chauffeur Return'],
          'zh-CN': ['晨曦海滨结业冥想仪式', '专属个性化长效健康守护蓝图', '豪华私享专车护送启程'],
          ja: ['日の出のクロージングサークル', '持続可能な生涯ヘルスケア青写真', 'プライベート専用車でのお見送り'],
          fr: ['Cercle de clôture au lever du soleil', 'Plan personnalisé de santé à long terme', 'Transfert retour avec chauffeur privé'],
        },
      },
    ],
  },
  {
    id: 'ret-03',
    slug: 'restorative-balance',
    days: 7,
    nights: 6,
    startingPrice: 52000000,
    heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80',
    ],
    names: {
      vi: 'Cân Bằng Phục Hồi',
      en: 'Restorative Balance',
      'zh-CN': '元气平衡·七日深度静修',
      ja: 'リストラティブ・バランス',
      fr: 'Équilibre Régénérateur',
    },
    taglines: {
      vi: '7 Ngày 6 Đêm · Chữa Lành Toàn Diện Thân - Tâm - Trí',
      en: '7 Days 6 Nights · Complete Body, Mind & Soul Healing',
      'zh-CN': '7天6晚 · 身心灵全维度平衡与养护',
      ja: '7日間6泊 · 心・身体・魂の調和と完全治癒',
      fr: '7 Jours 6 Nuits · Harmonie Corps, Esprit & Âme',
    },
    summaries: {
      vi: 'Chương trình dưỡng sinh 7 ngày hoàn hảo dành cho những ai tìm kiếm sự chuyển hóa bền vững, cân bằng cảm xúc và tái thiết nền tảng sức khỏe trọn vẹn.',
      en: 'Our ultimate 7-day master retreat designed for those seeking enduring somatic transformation, emotional harmony, and complete longevity renewal.',
      'zh-CN': '专为追求长效身心修复与情绪平衡打造的 7 天旗舰疗愈项目，全面筑牢健康活力基石。',
      ja: '持続的な心身の変容と感情の調和、長寿のための健康基盤を築く7日間のマスターリトリートプログラム。',
      fr: 'Notre retraite maîtresse de 7 jours, conçue pour instaurer une transformation physique durable, une sérénité émotionnelle et une vitalité régénérée.',
    },
    descriptions: {
      vi: 'Restorative Balance mang đến trải nghiệm nghỉ dưỡng dưỡng sinh ở tầm cao nhất. Bạn sẽ được chăm sóc riêng bởi đội ngũ chuyên gia bao gồm bác sĩ y học cổ truyền, thiền sư, giáo viên yoga và bếp trưởng dinh dưỡng. Mỗi ngày là một bước đi tĩnh lặng tiến sâu vào sự thư thái nguyên bản.',
      en: 'Restorative Balance represents the pinnacle of bespoke wellness hospitality at HeavenStay. Guided by a dedicated multidisciplinary circle—traditional medicine practitioners, meditation masters, yogis, and nutritional chefs—each day unfolds with deliberate tranquility and profound care.',
      'zh-CN': 'Restorative Balance 代表着 HeavenStay 定制康养服务的至高水准。由传统草本医师、冥想导师、瑜伽大师与营养主厨组成的专业团队全程贴心护航，每日从容步入生命本真的丰盈之境。',
      ja: 'HeavenStayが誇る最高峰の7日間プログラム。東洋医学の専門家、瞑想マスター、ヨガ指導者、管理栄養シェフからなるチームが、お客様専任で心身の深層調和をサポートします。',
      fr: 'Restorative Balance incarne l’apogée de l’hospitalité holistique chez HeavenStay. Accompagné par un cercle pluridisciplinaire dévoué (médecins traditionnels, maîtres de méditation, yogis et chefs nutritionnels), chaque jour est une célébration de la sérénité.',
    },
    villaName: {
      vi: 'Grand Forest Sanctuary Estate',
      en: 'Grand Forest Sanctuary Estate',
      'zh-CN': '幽林谧境双卧泳池庄园',
      ja: 'グランドフォレスト・サンクチュアリ邸宅',
      fr: 'Grand Domaine Sanctuaire au Cœur des Bois',
    },
    villaDescription: {
      vi: 'Dinh thự biệt lập 350m² giữa đại ngàn, hồ bơi nước ấm 15m, phòng xông hơi tuyết lạnh và không gian trà đạo thiền tịnh riêng biệt.',
      en: 'A 350m² secluded forest estate featuring a 15m heated lap pool, private ice-mist sauna, and serene outdoor tea ceremony pavilion.',
      'zh-CN': '350平方米森林秘境庄园，配有15米恒温恒泉泳池、私属雪雾冰蒸房及静谧户外茶道禅庭。',
      ja: '原生林に隠れた350㎡の広大なプライベート邸宅。15mの温水ラッププール、アイスミストサウナ、静かな茶道パビリオンを完備。',
      fr: 'Un domaine privé de 350m² entouré par la forêt ancienne, avec couloir de nage chauffé de 15m, sauna givré et pavillon de cérémonie du thé.',
    },
    suitableFor: {
      vi: ['Tái tạo sau điều trị', 'Tìm kiếm sự cân bằng sâu sắc', 'Doanh nhân & Lãnh đạo', 'Kỳ nghỉ tĩnh dưỡng dài ngày'],
      en: ['Post-Recovery Renewal', 'Deep Emotional Harmonization', 'Leaders & Visionaries', 'Extended Wellness Sabbatical'],
      'zh-CN': ['术后或亚健康深层调养', '深层情绪平衡与压力释放', '企业领袖与长期高压人士', '长假养生静修'],
      ja: ['病後・療養後の体力回復', '感情の深いリバランス', 'エグゼクティブ・リーダー層', '長期のウェルネス休暇'],
      fr: ['Convalescence & renouveau vital', 'Harmonisation émotionnelle profonde', 'Dirigeants & esprits créatifs', 'Séjour sabbatique bien-être'],
    },
    inclusions: {
      vi: [
        '6 Đêm nghỉ tại Grand Forest Sanctuary Estate',
        '6 Buổi spa chuyên biệt theo phác đồ từng ngày (90-120 phút)',
        'Kiểm tra và theo dõi chỉ số sức khỏe hàng ngày với chuyên gia y học',
        'Các buổi thực hành 1:1 cùng Thạc sĩ Yoga và Thiền định',
        'Thực đơn cao cấp chuẩn bị riêng theo sở thích và dị ứng',
        'Nghi thức tắm suối khoáng tự nhiên và thưởng trà đạo thiền'
      ],
      en: [
        '6 Nights in Grand Forest Sanctuary Estate',
        '6 Daily Tailored Therapeutic Spa Rituals (90-120 mins)',
        'Daily morning biomarker and somatic vital tracking',
        'Private 1-on-1 sessions with Master Yogis & Meditation Guides',
        'Full bespoke fine dining tailored to metabolic allergies',
        'Private mineral spring immersion and mindful tea ceremony'
      ],
      'zh-CN': [
        '入住幽林谧境双卧泳池庄园 6 晚',
        '6 次按每日循序渐进方案定制的深度水疗（每次 90-120 分钟）',
        '每日晨间生命体征与体能恢复数据跟踪',
        '与瑜伽导师及内观禅师开展一对一私教深度研习',
        '由主厨团队按过敏与口味档案全定制的一日三餐高端美馔',
        '私享天然矿泉浸润仪式与户外禅意茶道体验'
      ],
      ja: [
        'グランドフォレスト・サンクチュアリ邸宅でのご宿泊 6泊',
        '日替わりの本格テーラーメイドスパ療法 6回（各90〜120分）',
        '毎朝のバイオマーカー測定とコンディション確認',
        '専任ヨガマスター・瞑想講師とのマンツーマンセッション',
        'アレルギーや体調に完全に合わせた特別仕立ての养生会席料理',
        'プライベート温泉入浴の儀とマインドフル茶道体験'
      ],
      fr: [
        '6 Nuits au Grand Domaine Sanctuaire au Cœur des Bois',
        '6 Soins spa personnalisés selon le protocole quotidien (90-120 min)',
        'Suivi quotidien des marqueurs de vitalité et de sommeil',
        'Séances individuelles privées 1:1 avec nos Maîtres Yogis et Guides',
        'Haute gastronomie biologique entièrement sur mesure selon vos allergies',
        'Cérémonie privée du thé et immersion en source minérale naturelle'
      ],
    },
    wellnessHighlights: {
      vi: ['Phác đồ trị liệu 7 ngày cá nhân hóa', 'Nghi thức tắm khoáng & chuông xoay toàn năng', 'Liệu pháp giác quan hương thơm bản địa'],
      en: ['7-Day Curated Integrative Therapy Protocol', 'Mineral Immersion with Resonant Full Harmonic Bowl', 'Native Botanical Aromachology'],
      'zh-CN': ['7天专属多学科全维度综合理疗方案', '天然矿泉温浴与全频谐波颂钵深疗', '本土原生植物天然芳香精油疗法'],
      ja: ['7日間の総合的インテグレーティブ・セラピー', '高調波シンギングボウルとミネラル源泉浴', '土着ハーブを用いたアロマコロジートリートメント'],
      fr: ['Protocole intégratif sur mesure de 7 jours', 'Immersion en source minérale et bols harmoniques', 'Aromathérapie aux essences indigènes précieuses'],
    },
    diningHighlights: {
      vi: ['Thực dưỡng trường thọ cân bằng âm dương', 'Cá tươi đánh bắt bền vững từ ngư dân Vĩnh Hy', 'Nước khoáng ngầm tự nhiên thanh khiết'],
      en: ['Longevity Yin-Yang balancing culinary design', 'Sustainable day-catch seafood from Vinh Hy waters', 'Pristine deep-aquifer natural mineral water'],
      'zh-CN': ['阴阳平衡延年益寿食养美学体系', '永熙湾当地渔民可持续捕捞深海鲜鱼', '采自深层地热天然纯净弱碱矿泉水'],
      ja: ['陰陽調和と長寿のための養生美食コース', 'ビンヒー湾近海で獲れた新鮮な天然魚介', '深層天然ミネラル地下水の提供'],
      fr: ['Gastronomie de longévité basée sur l’équilibre Yin-Yang', 'Pêche durable du jour issue de la baie de Vinh Hy', 'Eau minérale naturelle puisée dans la roche profonde'],
    },
    itinerary: [
      {
        day: 1,
        stageNumber: '001',
        title: {
          vi: 'Hạ Cánh & Chạm Vào Yên Bình',
          en: 'Sanctuary Welcome & Grounding',
          'zh-CN': '归心安住·私邸静歇与立志启程',
          ja: '聖域へのチェックインと深い安らぎ',
          fr: 'Accueil au Sanctuaire & Ancrage',
        },
        description: {
          vi: 'Đón tiếp riêng tại Grand Forest Sanctuary Estate. Gặp gỡ hội đồng chuyên môn sức khỏe để thiết lập mục tiêu 7 ngày.',
          en: 'Private check-in at your forest estate. Meet with your dedicated health circle to calibrate intentions for the transformative 7 days ahead.',
          'zh-CN': '入住森林秘境庄园。与专属康养专家团队举行启动会议，校准未来 7 天的蜕变目标。',
          ja: 'フォレスト邸宅へチェックイン。専門チームとのキックオフで、7日間の目標とプログラムをすり合わせます。',
          fr: 'Installation privée dans votre domaine forestier. Rencontre avec l’équipe pluridisciplinaire pour définir vos intentions de transformation.',
        },
        highlights: {
          vi: ['Nhận bàn giao Dinh thự riêng', 'Hội ngộ Hội đồng chuyên gia sức khỏe', 'Trà đạo chào mừng lúc hoàng hôn'],
          en: ['Private Estate Induction', 'Health Circle Alignment', 'Sunset Welcome Tea'],
          'zh-CN': ['森林庄园尊享管家迎接入住', '专属多学科康养专家团队联席会议', '暮光定制欢迎茶礼'],
          ja: ['邸宅でのプライベートインダクション', '専任メディカルチームとのミーティング', '夕暮れのウェルカム茶道セレモニー'],
          fr: ['Accueil personnalisé au Domaine', 'Harmonisation avec le Cercle de Santé', 'Thé de bienvenue au crépuscule'],
        },
      },
      {
        day: 2,
        stageNumber: '002',
        title: {
          vi: 'Thanh Lọc Thể Xác & Khởi Động Hơi Thở',
          en: 'Somatic Purification & Breath Realignment',
          'zh-CN': '身躯澄澈·调息通络与水疗润养',
          ja: '身体の浄化と呼吸の再調整',
          fr: 'Purification Somatique & Réalignement du Souffle',
        },
        description: {
          vi: 'Khởi đầu với bài tập thở Pranayama. Thủy trị liệu ngâm khoáng và liệu pháp xoa bóp giải tỏa điểm căng cơ toàn thân.',
          en: 'Begin with Pranayama breathwork. Enjoy customized hydrotherapy followed by deep somatic trigger-point bodywork.',
          'zh-CN': '以调息呼吸法唤醒晨间。随后享受专属水疗与全身扳机点深层肌筋膜放松。',
          ja: 'プラーナヤーマ呼吸法でスタート。ハイドロセラピーとトリガーポイント筋膜リリースで深く緊張を緩めます。',
          fr: 'Début avec la respiration Pranayama. Hydrothérapie personnalisée suivie d’un massage profond des points de tension.',
        },
        highlights: {
          vi: ['Lớp thở Pranayama chuyên sâu', 'Trị liệu giải tỏa điểm căng cơ Trigger Point', 'Nước dùng thực dưỡng hồi phục sinh lực'],
          en: ['Pranayama Session', 'Trigger Point Therapy', 'Nourishing Vital Broths'],
          'zh-CN': ['深度调息（Pranayama）功法研习', '全身肌筋膜触发点靶向理疗', '温养元气滋补骨汤膳'],
          ja: ['プラーナヤーマ呼吸法セッション', 'トリガーポイント深層筋膜リリース', '滋養あふれる養生スープ'],
          fr: ['Séance de respiration Pranayama', 'Thérapie des points gâchettes (Trigger Points)', 'Bouillons vitaux nourrissants'],
        },
      },
      {
        day: 3,
        stageNumber: '003',
        title: {
          vi: 'Tĩnh Tâm & Khám Phá Rừng Sâu',
          en: 'Forest Communion & Meditation',
          'zh-CN': '林深听籁·静心行禅与自然共振',
          ja: '大自然との対話と内観瞑想',
          fr: 'Communion avec la Forêt & Méditation',
        },
        description: {
          vi: 'Đi bộ chánh niệm trong rừng nguyên sinh, trải nghiệm thiền định thinh lặng và bữa trưa thảo mộc hữu cơ giữa thiên nhiên.',
          en: 'Forest immersion walking in deep national park grounds, silent meditation under the ancient canopies, and a woodland botanical lunch.',
          'zh-CN': '深入古树林间进行正念步行，在绿荫穹顶下静坐禅思，品味原野自然药膳午餐。',
          ja: '巨木の森を歩くマインドフルウォーキング。木々の天蓋の下での静寂瞑想と、森の中でのオーガニックランチ。',
          fr: 'Immersion en forêt ancienne, méditation silencieuse sous la canopée et déjeuner botanique sous les arbres.',
        },
        highlights: {
          vi: ['Thiền đi bộ dưới tán rừng cổ thụ', 'Yến tiệc thảo mộc giữa đại ngàn', 'Bồn tắm âm thanh pha lê buổi tối'],
          en: ['Canopy Walking Meditation', 'Woodland Herbal Feast', 'Evening Crystal Sound Bath'],
          'zh-CN': ['古林穹顶下正念行禅', '原生态林间秘境本草盛筵', '晚间水晶钵共振深度睡眠音疗'],
          ja: ['原生林の天蓋を歩くウォーキング瞑想', '森の中のハーブフィースト', '夜のクリスタルボウル・サウンドバス'],
          fr: ['Marche méditative sous la canopée', 'Festin botanique en forêt', 'Bain sonore nocturne aux bols de cristal'],
        },
      },
      {
        day: 4,
        stageNumber: '004',
        title: {
          vi: 'Điểm Cân Bằng Giữa Kỳ & Tái Thiết Lập',
          en: 'Midpoint Harmonic Calibration',
          'zh-CN': '中程校准·阴阳重塑与心神安和',
          ja: '中間地点での調律とリバランス',
          fr: 'Étalonnage Harmonique de Mi-Séjour',
        },
        description: {
          vi: 'Đánh giá lại sự chuyển biến của cơ thể sau 3 ngày. Trải nghiệm nghi thức massage 4 tay bằng thảo mộc cổ truyền hoàng gia.',
          en: 'Midpoint biomarker evaluation. Experience an extraordinary 4-hand traditional herbal royal massage therapy.',
          'zh-CN': '复盘前三日生理蜕变指标。尊享非凡的四手皇家御用本草精油深度和顺理疗。',
          ja: '中間バイオマーカー測定。熟練のセラピスト2名による贅沢な4ハンド伝統ハーブマッサージをご堪能ください。',
          fr: 'Bilan intermédiaire de vitalité. Rituel d’exception à quatre mains aux herbes royales vietnamiennes.',
        },
        highlights: {
          vi: ['Đánh giá chuyển biến thể trạng giữa kỳ', 'Massage thảo dược hoàng gia 4 tay', 'Bữa tối nến lãng mạn tại biệt thự'],
          en: ['Midpoint Health Review', 'Four-Hand Royal Herbal Massage', 'Candlelit Villa Dinner'],
          'zh-CN': ['中程生理指标与蜕变复盘', '双人四手宫廷秘传本草推拿', '私属别墅烛光养生晚宴'],
          ja: ['中間ヘルスレビュー＆問診', '贅沢な4ハンド宮廷ハーブマッサージ', 'ヴィラでのキャンドルナイトディナー'],
          fr: ['Bilan de santé de mi-séjour', 'Massage royal à quatre mains aux herbes', 'Dîner aux chandelles en villa'],
        },
      },
      {
        day: 5,
        stageNumber: '005',
        title: {
          vi: 'Thư Giãn Cảm Xúc & Liệu Pháp Âm Thanh',
          en: 'Emotional Release & Sound Therapy',
          'zh-CN': '情绪解缚·满弦音波深层涤荡',
          ja: '感情の解放とフルサウンドセラピー',
          fr: 'Libération Émotionnelle & Thérapie Sonore',
        },
        description: {
          vi: 'Lớp yoga luân xa giải tỏa cảm xúc dồn nén. Buổi tối ngâm bồn cánh hoa thảo mộc và hòa âm chuông đồng Tây Tạng cổ.',
          en: 'Chakra alignment restorative yoga to untangle subtle emotional blockages. Evening floral botanical immersion and Tibetan bell concert.',
          'zh-CN': '脉轮平衡瑜伽舒展深层潜意识堵塞。夜晚享受鲜花药浴与珍罕古董颂钵音乐盛筵。',
          ja: 'チャクラを整えるヨガで感情の滞りを解放。夜は花びらを浮かべたハーブバスとチベット古銅ベルの音色に浸ります。',
          fr: 'Yoga d’alignement des chakras pour dénouer les émotions retenues. Bain floral du soir et concert de cloches tibétaines.',
        },
        highlights: {
          vi: ['Yoga khai mở 7 luân xa', 'Ngâm bồn khoáng cánh hoa tươi', 'Trị liệu hòa âm sóng rung toàn phần'],
          en: ['Chakra Yoga Immersion', 'Floating Floral Mineral Bath', 'Full Harmonic Resonance'],
          'zh-CN': ['七轮能量脉轮瑜伽深修', '鲜花飘香温矿泉浸润花浴', '全频谐波深层声波共振'],
          ja: ['チャクラアライメントヨガ', '生花を浮かべたミネラルバス', 'フルハーモニック・サウンド共振'],
          fr: ['Immersion Yoga des Chakras', 'Bain minéral aux pétales de fleurs fraîches', 'Résonance harmonique intégrale'],
        },
      },
      {
        day: 6,
        stageNumber: '006',
        title: {
          vi: 'Đỉnh Cao Sức Sống & Trà Đạo Hoàng Hôn',
          en: 'Vitality Apex & Twilight Tea Ceremony',
          'zh-CN': '元气登峰·暮光茶席与感恩盛筵',
          ja: '活力の頂点と黄昏の茶会セレモニー',
          fr: 'Apogée de Vitalité & Cérémonie du Thé au Crépuscule',
        },
        description: {
          vi: 'Tận hưởng ngày trị liệu thảnh thơi trọn vẹn. Buổi chiều thưởng trà shan tuyết cổ thụ cùng thiền sư trên sàn gỗ ngắm hoàng hôn.',
          en: 'A celebratory day of vibrant lightness. Sunset ancient Shan Tuyet tea ceremony with the meditation master overlooking the bay.',
          'zh-CN': '感受身轻如燕的丰盈活力。傍晚时分与禅师在悬崖水台共享古树单丛茶席，俯瞰落日沧海。',
          ja: '心身の軽やかさを実感する至福の1日。夕暮れ時、海を見下ろすパビリオンで瞑想マスターと古樹茶を楽しむ茶道セレモニー。',
          fr: 'Une journée de plénitude et de vitalité retrouvée. Cérémonie du thé ancien Shan Tuyet au coucher du soleil face à la baie.',
        },
        highlights: {
          vi: ['Lớp làm chủ vận động thể chất chuyên sâu', 'Trà đạo Shan Tuyết cổ thụ ngắm hoàng hôn', 'Thực đơn thử nếm của Bếp trưởng'],
          en: ['Bespoke Movement Mastery', 'Shan Tuyet Tea Ceremony', 'Celebratory Master Chef Tasting'],
          'zh-CN': ['定制体态与动能精修指导', '古树雪茶高雅日落茶席', '名厨庆典养生美馔品鉴'],
          ja: ['身体動作マスターセッション', '古樹シャントゥエット茶の茶会', 'マスターシェフ特製テイスティング'],
          fr: ['Maîtrise du mouvement personnalisé', 'Cérémonie du thé Shan Tuyet au couchant', 'Dégustation gastronomique du Maître Chef'],
        },
      },
      {
        day: 7,
        stageNumber: '007',
        title: {
          vi: 'Tái Sinh Trọn Vẹn & Khởi Hành An Yên',
          en: 'Integral Transformation & Mindful Departure',
          'zh-CN': '圆满升华·心定神宁步入新程',
          ja: '完全な調和と新しい日常への出発',
          fr: 'Transformation Intégrale & Départ Serein',
        },
        description: {
          vi: 'Nghi thức kết thúc kỳ nghỉ, nhận cẩm nang dưỡng sinh trọn đời được thiết kế riêng. Đưa đón VIP trở về sân bay.',
          en: 'A sacred closing circle. Receive your lifelong bespoke wellness almanac and personal nutrition protocols before luxury return transfer.',
          'zh-CN': '举行静修圆满结业仪式。获赠终身定制专属养生宝典与营养调养指南，尊享贵宾专车送达机场。',
          ja: '締めくくりのクロージングセレモニー。生涯にわたって役立つ個別のウェルネス指针を受け取り、VIP専用車で空港へ。',
          fr: 'Cercle de clôture sacré. Remise de votre almanach de bien-être personnel et protocoles de nutrition avant le transfert VIP.',
        },
        highlights: {
          vi: ['Nghi thức kết nối vòng tròn thiêng liêng', 'Cẩm nang dưỡng sinh trọn đời', 'Đưa đón VIP tiễn ra sân bay'],
          en: ['Sacred Closing Circle', 'Lifelong Wellness Almanac', 'VIP Chauffeured Departure'],
          'zh-CN': ['圆满圣境结业祈愿仪式', '终身定制养生调养全书', '贵宾专车送达服务'],
          ja: ['聖なるクロージングサークル', '生涯寄り添うウェルネス年鑑', 'VIP専用送迎車でのご出発'],
          fr: ['Cercle de clôture sacré', 'Almanach de santé et bien-être pour la vie', 'Départ avec chauffeur VIP'],
        },
      },
    ],
  },
];
