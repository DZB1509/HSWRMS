export type MasterDataCategory = 'packages' | 'spa' | 'villas';

export interface RetreatPackageMaster {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  durationNights: number;
  goal: string;
  includedSpaSessions: number;
  basePrice: number;
  status: 'active' | 'archived';
  description: string;
}

export interface SpaServiceMaster {
  id: string;
  code: string;
  name: string;
  category: string;
  durationMinutes: number;
  practitionerType: string;
  basePrice: number;
  status: 'active' | 'archived';
  description: string;
}

export interface VillaCategoryMaster {
  id: string;
  code: string;
  name: string;
  maxOccupancy: number;
  hasPrivatePool: boolean;
  hasTreatmentPavilion: boolean;
  totalVillasCount: number;
  baseNightlyRate: number;
  status: 'active' | 'archived';
  description: string;
}
