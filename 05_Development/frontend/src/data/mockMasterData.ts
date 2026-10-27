import type { RetreatPackageMaster, SpaServiceMaster, VillaCategoryMaster } from '../types/masterData';

export const INITIAL_PACKAGES_MASTER: RetreatPackageMaster[] = [
  {
    id: 'PKG-01',
    code: 'RET-MINDFUL-03',
    name: 'Tái Tạo Tĩnh Thức (Mindful Renewal)',
    durationDays: 3,
    durationNights: 2,
    goal: 'Tái thiết năng lượng & Thanh lọc tâm trí',
    includedSpaSessions: 2,
    basePrice: 18500000,
    status: 'active',
    description: 'Hành trình ngắn ngày được thiết kế riêng để tái thiết năng lượng, phục hồi giấc ngủ và thanh lọc tâm trí qua các liệu pháp thảo dược cổ truyền cùng yoga bình minh.'
  },
  {
    id: 'PKG-02',
    code: 'RET-RESET-05',
    name: 'Chuyển Hóa Toàn Diện (Complete Reset)',
    durationDays: 5,
    durationNights: 4,
    goal: 'Tái lập nhịp sinh học & Kích hoạt tự chữa lành',
    includedSpaSessions: 4,
    basePrice: 36000000,
    status: 'active',
    description: 'Chương trình nghỉ dưỡng chuyên sâu kéo dài 5 ngày giúp tái lập nhịp sinh học tự nhiên, kích hoạt khả năng tự chữa lành của cơ thể và nuôi dưỡng tâm trí an lạc.'
  },
  {
    id: 'PKG-03',
    code: 'RET-BALANCE-07',
    name: 'Cân Bằng Phục Hồi (Restorative Balance)',
    durationDays: 7,
    durationNights: 6,
    goal: 'Chữa lành Thân - Tâm - Trí toàn diện & Trẻ hóa',
    includedSpaSessions: 6,
    basePrice: 52000000,
    status: 'active',
    description: 'Chương trình dưỡng sinh 7 ngày hoàn hảo dành cho những ai tìm kiếm sự chuyển hóa bền vững, cân bằng cảm xúc và tái thiết nền tảng sức khỏe trọn vẹn.'
  }
];

export const INITIAL_SPA_SERVICES_MASTER: SpaServiceMaster[] = [
  {
    id: 'SPA-01',
    code: 'TRT-BAMBOO-60',
    name: 'Warm Bamboo & Herbal Compress Massage',
    category: 'Therapeutic Massage',
    durationMinutes: 60,
    practitionerType: 'Senior Spa Therapist',
    basePrice: 1500000,
    status: 'active',
    description: 'Heated organic bamboo stalks combined with steamed ginger-lemongrass herbal compresses.'
  },
  {
    id: 'SPA-02',
    code: 'TRT-SOUND-45',
    name: 'Tibetan Singing Bowl Sound Meditation',
    category: 'Sound Healing & Vibrational Therapy',
    durationMinutes: 45,
    practitionerType: 'Yoga & Meditation Master',
    basePrice: 1200000,
    status: 'active',
    description: 'Harmonic acoustic frequencies tuned to resonate with physiological energy centers.'
  },
  {
    id: 'SPA-03',
    code: 'TRT-HYDRO-75',
    name: 'Lymphatic Detox Hydrotherapy Soak',
    category: 'Hydrotherapy & Balneotherapy',
    durationMinutes: 75,
    practitionerType: 'Senior Spa Therapist',
    basePrice: 1800000,
    status: 'active',
    description: 'Mineral-infused thermal jet bath with sea salts and stimulating essential oils.'
  },
  {
    id: 'SPA-04',
    code: 'TRT-HOTSTONE-90',
    name: 'Deep Tissue Basalt Hot Stone Therapy',
    category: 'Therapeutic Massage',
    durationMinutes: 90,
    practitionerType: 'Senior Spa Therapist',
    basePrice: 2200000,
    status: 'active',
    description: 'Volcanic basalt stones heated to soothe deep muscular tension and improve circulation.'
  }
];

export const INITIAL_VILLAS_MASTER: VillaCategoryMaster[] = [
  {
    id: 'VIL-01',
    code: 'CAT-GARDEN',
    name: 'Garden Sanctuary Pool Villa',
    maxOccupancy: 2,
    hasPrivatePool: true,
    hasTreatmentPavilion: false,
    totalVillasCount: 8,
    baseNightlyRate: 4500000,
    status: 'active',
    description: 'Secluded tropical garden residence featuring private plunge pool and open-air rainfall shower.'
  },
  {
    id: 'VIL-02',
    code: 'CAT-OCEAN',
    name: 'Oceanfront Sunset Wellness Villa',
    maxOccupancy: 2,
    hasPrivatePool: true,
    hasTreatmentPavilion: true,
    totalVillasCount: 6,
    baseNightlyRate: 6800000,
    status: 'active',
    description: 'Direct sea view villa with private infinity pool and dedicated open-air massage cabana.'
  },
  {
    id: 'VIL-03',
    code: 'CAT-HILLSIDE',
    name: 'Hillside Panoramic Yoga Pavilion',
    maxOccupancy: 4,
    hasPrivatePool: true,
    hasTreatmentPavilion: true,
    totalVillasCount: 4,
    baseNightlyRate: 9200000,
    status: 'active',
    description: 'Two-bedroom elevated retreat pavilion with wraparound timber deck for private yoga instruction.'
  }
];
