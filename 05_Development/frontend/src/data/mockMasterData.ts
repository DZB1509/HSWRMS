import type { RetreatPackageMaster, SpaServiceMaster, VillaCategoryMaster } from '../types/masterData';
import { SPA_TREATMENTS_INVENTORY, RETREAT_PACKAGES_INVENTORY } from './mockSpaInventory';

export const INITIAL_PACKAGES_MASTER: RetreatPackageMaster[] = RETREAT_PACKAGES_INVENTORY.map((p) => ({
  id: p.id as string,
  code: p.packageCode,
  name: p.packageName,
  durationDays: p.durationNights + 1,
  durationNights: p.durationNights,
  goal: p.wellnessGoal,
  includedSpaSessions: p.durationNights * 2,
  basePrice: p.basePrice,
  status: p.status === 'ACTIVE' ? 'active' : 'archived',
  description: `${p.wellnessGoal}. Bao gồm: ${p.includedTreatments.split('\n')[0] || ''}. Dinh dưỡng: ${p.dietaryPlan}`
}));

export const INITIAL_SPA_SERVICES_MASTER: SpaServiceMaster[] = SPA_TREATMENTS_INVENTORY.map((t) => ({
  id: t.id as string,
  code: t.treatmentCode,
  name: t.treatmentName,
  category: t.category,
  durationMinutes: t.durationMinutes,
  practitionerType: t.therapistQualification,
  compatibleRoomType: t.roomCompatibility,
  basePrice: t.basePrice,
  status: t.status === 'ACTIVE' ? 'active' : 'archived',
  description: `${t.description}. Chống chỉ định: ${t.contraindications || 'Không có'}`
}));

export const INITIAL_VILLAS_MASTER: VillaCategoryMaster[] = [
  {
    id: 'VIL-01',
    code: 'CAT-GARDEN',
    name: 'Garden Sanctuary Pool Villa',
    bedroomCount: 1,
    bedType: '1 King Bed (1.8m x 2.0m)',
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    areaRange: '95 - 110 m²',
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
    bedroomCount: 1,
    bedType: '1 Super King Bed (2.0m x 2.2m)',
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    areaRange: '130 - 160 m²',
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
    bedroomCount: 2,
    bedType: '1 King Bed + 2 Twin Beds',
    maxAdults: 4,
    maxChildren: 2,
    maxOccupancy: 6,
    areaRange: '200 - 240 m²',
    hasPrivatePool: true,
    hasTreatmentPavilion: true,
    totalVillasCount: 4,
    baseNightlyRate: 9200000,
    status: 'active',
    description: 'Two-bedroom elevated retreat pavilion with wraparound timber deck for private yoga instruction.'
  }
];
