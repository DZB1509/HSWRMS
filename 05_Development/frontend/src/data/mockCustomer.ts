import type {
  CustomerProfile,
  WellnessProfile,
  RetreatBooking,
  HealthDataDeletionRequest,
} from '../types/customer';

export const INITIAL_CUSTOMER_PROFILE: CustomerProfile = {
  id: 'usr-cust-01',
  fullName: 'Eleanor Vance',
  email: 'eleanor.vance@example.com',
  phone: '+84 901 234 567',
  dateOfBirth: '1988-06-14',
  address: 'No. 28 Tran Hung Dao, Hoan Kiem, Hanoi, Vietnam',
  preferredLanguage: 'en',
  membershipTier: 'HeavenStay Lotus Sanctuary Member',
  memberSince: '2024-03-15',
  assignedVilla: 'Villa #102 (Tranquil Garden)',
  emergencyContact: {
    name: 'Robert Vance',
    phone: '+84 912 345 678',
    relationship: 'Spouse',
  },
  notificationPreferences: {
    email: true,
    sms: true,
    wellnessReminders: true,
  },
};

export const INITIAL_WELLNESS_PROFILE: WellnessProfile = {
  isComplete: true,
  lastUpdated: '2026-09-18T10:30:00Z',
  consent: {
    hasConsented: true,
    consentedAt: '2026-09-18T10:30:00Z',
    policyVersion: 'v1.2 — Wellness Treatment & Dietary Data Privacy Agreement',
    purposeSummary:
      'Data collected is used exclusively for customized therapeutic treatments by licensed therapists and personalized meal safety preparation by our executive culinary team. Never shared for marketing or unauthorized third parties.',
  },
  healthNotes: {
    medicalConditions: ['Mild lumbar tension', 'Mild hypertension (well managed)'],
    injuriesOrSurgeries: 'Lumbar muscle strain (2024), fully recovered with gentle exercise.',
    mobilityConsiderations: 'Prefers gentle lower-back stretching; avoid forceful spinal twists.',
    currentMedications: 'Herbal adaptogens, morning magnesium supplement.',
    stressLevel: 'moderate',
    treatmentPreferences: [
      'Aromatherapy (Lavender & Eucalyptus)',
      'Warm Herbal Compress',
      'Shoulder & Neck Deep Relaxation',
    ],
  },
  dietaryProfile: {
    allergies: ['Crustaceans & Shellfish', 'Peanuts'],
    dietaryRestrictions: ['Vegetarian', 'Gluten-Conscious'],
    intolerances: ['Lactose (mild — prefers oat/almond milk)'],
    dislikedIngredients: ['Coriander leaves', 'Excessive chili heat'],
    specialInstructions: 'Dedicated clean preparation station free of shellfish contact. Prefers warm ginger-lemongrass tea with all meals.',
  },
};

export const INITIAL_DELETION_REQUEST: HealthDataDeletionRequest | null = null;

const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const INITIAL_BOOKINGS: RetreatBooking[] = [
  {
    id: 'HSW-BK-2026-0881',
    bookingReference: 'HSW-88192',
    retreatSlug: 'mindful-renewal',
    retreatName: {
      vi: 'Tái Tạo Tĩnh Thức',
      en: 'Mindful Renewal',
      'zh-CN': '正念觉醒·焕新之旅',
      ja: 'マインドフル・リニューアル',
      fr: 'Renouveau en Pleine Conscience',
    },
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80',
    startDate: getRelativeDateStr(0),
    endDate: getRelativeDateStr(3),
    days: 3,
    nights: 2,
    villaType: {
      vi: 'Biệt Thự Khoáng Nóng Bên Vách Đá',
      en: 'Ocean Cliff Mineral Pool Villa',
      'zh-CN': '悬崖海景矿泉泳池别墅',
      ja: 'オーシャンクリフ・ミネラルプールヴィラ',
      fr: 'Villa Falaises Marines avec Piscine Minérale',
    },
    villaNumber: 'Villa #102',
    status: 'upcoming',
    totalPrice: 18500000,
    depositAmount: 7350000,
    remainingBalance: 17150000,
    depositStatus: 'paid',
    paymentDetails: {
      transactionId: 'VNP-20261015-88192',
      paymentMethod: 'VNPay QR / ATM',
      paidAt: '2026-09-20T14:22:10Z',
      cardLast4: '8821',
    },
    specialRequests: 'Quiet villa location near the lotus pond. Afternoon herbal tea setup.',
    arrivalNotes: 'Estimated arrival at 14:30 via resort shuttle from Noi Bai International Airport.',
    createdAt: '2026-09-20T14:15:00Z',
    itinerary: [
      {
        day: 1,
        title: {
          vi: 'Ngày 1: Đón Tiếp, Định Tâm & Thả Lỏng Tinh Thần',
          en: 'Day 1: Arrival, Centering & Initial Grounding',
          'zh-CN': '第一天：抵离接待、宁心与安神放松',
          ja: '1日目：ご到着、センタリング＆精神の解放',
          fr: 'Jour 1 : Accueil, Recentrage & Apaisement',
        },
        activities: [
          {
            time: '14:00',
            name: {
              vi: 'Nghi thức Nhận Phòng Hương Thảo Mộc',
              en: 'Herbal Welcome Check-in Ceremony',
              'zh-CN': '草本迎宾入住仪式',
              ja: 'ハーブウェルカムチェックインセレモニー',
              fr: 'Cérémonie d’Arrivée aux Herbes',
            },
            type: 'wellness',
            location: 'Sanctuary Pavilion',
          },
          {
            time: '16:00',
            name: {
              vi: 'Tư Vấn Sức Khỏe & Liệu Trình Cá Nhân Hóa (Therapist)',
              en: 'Private Wellness Consultation with Therapist',
              'zh-CN': '专业理疗师专属健康咨询',
              ja: 'セラピストによるプライベートウェルネス相談',
              fr: 'Consultation Bien-être avec Thérapeute',
            },
            type: 'spa',
            location: 'Lotus Wellness Spa Suite #3',
          },
          {
            time: '18:30',
            name: {
              vi: 'Bữa Tối Dưỡng Sinh 3 Món Thanh Lọc',
              en: 'Three-Course Detox Dinner (Executive Chef)',
              'zh-CN': '主厨定制三道排毒养生晚宴',
              ja: 'オーガニックデトックスディナー（3コース）',
              fr: 'Dîner Détox en Trois Temps',
            },
            type: 'dining',
            location: 'Banyan Tree Dining Lounge',
          },
          {
            time: '20:30',
            name: {
              vi: 'Thiền Chuông Xoay Tây Tạng Trước Giờ Ngủ',
              en: 'Tibetan Singing Bowl Meditation for Restful Sleep',
              'zh-CN': '西藏颂钵安眠冥想',
              ja: 'シンギングボウル安眠メディテーション',
              fr: 'Méditation aux Bols Chantants Tibétains',
            },
            type: 'mindfulness',
            location: 'Zen Meditation Hall',
          },
        ],
      },
      {
        day: 2,
        title: {
          vi: 'Ngày 2: Chữa Lành Sâu & Khơi Thông Năng Lượng',
          en: 'Day 2: Deep Healing & Vitality Restoration',
          'zh-CN': '第二天：深度疗愈与充沛身心能量',
          ja: '2日目：ディープヒーリング＆エネルギー覚醒',
          fr: 'Jour 2 : Guérison Profonde & Restauration',
        },
        activities: [
          {
            time: '06:30',
            name: {
              vi: 'Khởi Động Ngày Mới với Hatha Yoga & Hơi Thở Pranayama',
              en: 'Sunrise Hatha Yoga & Pranayama Breathwork',
              'zh-CN': '晨曦哈达瑜伽与调息法',
              ja: '朝日と共に行うハタヨガ＆呼吸法',
              fr: 'Yoga Hatha au Lever du Soleil & Pranayama',
            },
            type: 'wellness',
            location: 'Pine Hill Open-air Deck',
          },
          {
            time: '08:00',
            name: {
              vi: 'Bữa Sáng Dinh Dưỡng Thực Vật Hữu Cơ',
              en: 'Farm-to-Table Organic Botanical Breakfast',
              'zh-CN': '从农场到餐桌有机活力早餐',
              ja: 'オーガニックファームの朝食ブッフェ',
              fr: 'Petit-déjeuner Botanique Bio',
            },
            type: 'dining',
            location: 'Banyan Tree Dining Lounge',
          },
          {
            time: '10:00',
            name: {
              vi: 'Liệu Trình Trị Liệu Đá Muối Himalaya (90 phút)',
              en: 'Himalayan Salt Stone Healing Therapy (90 mins)',
              'zh-CN': '喜马拉雅矿盐热石深度理疗（90分钟）',
              ja: 'ヒマラヤソルトストーンセラピー（90分）',
              fr: 'Soin aux Pierres de Sel de l’Himalaya (90 min)',
            },
            type: 'spa',
            location: 'Lotus Wellness Spa Suite #3',
          },
          {
            time: '15:30',
            name: {
              vi: 'Hội Thảo Nghệ Thuật Trà Đạo & Chánh Niệm',
              en: 'Mindful Herbal Tea Ceremony Workshop',
              'zh-CN': '正念草本茶道体验工坊',
              ja: 'マインドフルハーブティーセレモニー',
              fr: 'Atelier Cérémonie du Thé en Pleine Conscience',
            },
            type: 'mindfulness',
            location: 'Lotus Tea Pavilion',
          },
          {
            time: '19:00',
            name: {
              vi: 'Bữa Tối Hải Sản Thanh Vị (Đã Điều Chỉnh Theo Dị Ứng)',
              en: 'Nourishing Catch-of-the-Day (Allergy-Safeguarded)',
              'zh-CN': '低敏定制温补晚膳',
              ja: 'アレルギー対応 季節のシーフードディナー',
              fr: 'Dîner Délicat de la Pêche du Jour',
            },
            type: 'dining',
            location: 'Banyan Tree Dining Lounge',
          },
        ],
      },
      {
        day: 3,
        title: {
          vi: 'Ngày 3: Tái Sinh Năng Lượng & Rời Khu Nghỉ Dưỡng',
          en: 'Day 3: Reintegration, Blessing & Departure',
          'zh-CN': '第三天：新生归融、祝福与返程',
          ja: '3日目：新たな日常へ＆チェックアウト',
          fr: 'Jour 3 : Réintégration, Bénédiction & Départ',
        },
        activities: [
          {
            time: '07:00',
            name: {
              vi: 'Thiền Đi Bộ Trong Vườn Thiền & Bấm Huyệt Bàn Chân',
              en: 'Forest Walking Meditation & Reflexology Garden',
              'zh-CN': '森林漫步冥想与足底养生反射径',
              ja: '森林ウォーキング瞑想＆リフレクソロジー',
              fr: 'Méditation Marchée en Forêt & Réflexologie',
            },
            type: 'mindfulness',
            location: 'Pine Forest Path',
          },
          {
            time: '08:30',
            name: {
              vi: 'Bữa Sáng Dưỡng Nhan & Nước Ép Thảo Mộc Ép Lạnh',
              en: 'Glow Botanical Breakfast & Cold-pressed Elixirs',
              'zh-CN': '焕颜养生早餐与冷压草本养颜汁',
              ja: 'コールドプレスジュースと美容朝食',
              fr: 'Petit-déjeuner Vitalité & Élixirs Pressés à Froid',
            },
            type: 'dining',
            location: 'Banyan Tree Dining Lounge',
          },
          {
            time: '11:00',
            name: {
              vi: 'Tư Vấn Kế Hoạch Duy Trì Sức Khỏe Tại Nhà',
              en: 'Home Care Wellness Transition Plan Handover',
              'zh-CN': '日常居家养生方案交接咨询',
              ja: 'ホームケア・ウェルネスプランのご案内',
              fr: 'Remise du Plan de Maintien du Bien-être à Domicile',
            },
            type: 'wellness',
            location: 'Sanctuary Pavilion',
          },
          {
            time: '12:00',
            name: {
              vi: 'Nghi Thức Chia Tay & Trả Phòng Thư Thái',
              en: 'Farewell Blessing & Relaxed Check-out',
              'zh-CN': '珍重道别与从容退房',
              ja: '感謝のセレモニー＆チェックアウト',
              fr: 'Cérémonie d’Au Revoir & Départ Serein',
            },
            type: 'wellness',
            location: 'Sanctuary Pavilion',
          },
        ],
      },
    ],
  },
  {
    id: 'HSW-BK-2026-0740',
    bookingReference: 'HSW-77401',
    retreatSlug: 'holistic-renewal',
    retreatName: {
      vi: 'Tái Tạo Toàn Diện Thân & Tâm',
      en: 'Holistic Body & Soul Renewal Retreat',
      'zh-CN': '身心全面蜕变焕新疗程',
      ja: 'ホリスティック・ボディ＆ソウル再生リトリート',
      fr: 'Renouveau Holistique du Corps & de l’Âme',
    },
    heroImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
    startDate: '2026-08-10',
    endDate: '2026-08-15',
    days: 5,
    nights: 4,
    villaType: {
      vi: 'Biệt Thự Đỉnh Đồi Hướng Rừng Thông',
      en: 'Hillside Pine Canopy Villa',
      'zh-CN': '松林山顶瞰景别墅',
      ja: '松林を見渡す丘の上のヴィラ',
      fr: 'Villa Colline Vue Forêt de Pins',
    },
    villaNumber: 'Villa #108',
    status: 'completed',
    totalPrice: 48000000,
    depositAmount: 14400000,
    remainingBalance: 0,
    depositStatus: 'paid',
    paymentDetails: {
      transactionId: 'VNP-20260810-77401',
      paymentMethod: 'VNPay Credit Card',
      paidAt: '2026-07-28T09:12:04Z',
      cardLast4: '4119',
    },
    specialRequests: 'Extra hypoallergenic pillows, warm bath oil blend.',
    createdAt: '2026-07-28T09:00:00Z',
    itinerary: [],
  },
];
