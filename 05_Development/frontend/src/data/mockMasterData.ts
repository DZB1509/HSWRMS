import type { RetreatPackageMaster, SpaServiceMaster, VillaCategoryMaster } from '../types/masterData';

export const INITIAL_PACKAGES_MASTER: RetreatPackageMaster[] = [
  {
    id: 'PKG-01',
    code: 'RET-DETOX-01',
    name: 'Holistic Detox & Cleansing Journey',
    durationDays: 5,
    durationNights: 4,
    goal: 'Detoxification & Cellular Renewal',
    includedSpaSessions: 4,
    basePrice: 24500000,
    status: 'active',
    description: 'A 5-day botanical cleansing program combining organic juices, hydrotherapy, and lymphatic drainage.'
  },
  {
    id: 'PKG-02',
    code: 'RET-YOGA-02',
    name: 'Mindfulness, Prana & Yoga Immersion',
    durationDays: 7,
    durationNights: 6,
    goal: 'Mental Clarity & Emotional Balance',
    includedSpaSessions: 6,
    basePrice: 32000000,
    status: 'active',
    description: 'Daily sunrise meditation, private restorative yoga coaching, and sound bath alignment.'
  },
  {
    id: 'PKG-03',
    code: 'RET-SLEEP-03',
    name: 'Deep Sleep & Circadian Restoration',
    durationDays: 4,
    durationNights: 3,
    goal: 'Insomnia Relief & Stress Alleviation',
    includedSpaSessions: 3,
    basePrice: 19500000,
    status: 'active',
    description: 'Targeted sleep architecture recovery with evening herbal baths, valerian tea rituals, and reflexology.'
  },
  {
    id: 'PKG-04',
    code: 'RET-AYUR-04',
    name: 'Ayurvedic Rejuvenation & Vitality',
    durationDays: 6,
    durationNights: 5,
    goal: 'Dosha Balancing & Re-energization',
    includedSpaSessions: 5,
    basePrice: 28000000,
    status: 'active',
    description: 'Ancient Vedic bodywork, Shirodhara warm oil therapy, and customized tridoshic nutrition.'
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
