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
  compatibleRoomType?: string;
  basePrice: number;
  status: 'active' | 'archived';
  description: string;
}

export interface VillaCategoryMaster {
  id: string;
  code: string;
  name: string;
  bedroomCount?: number;
  bedType?: string;
  maxAdults?: number;
  maxChildren?: number;
  maxOccupancy: number;
  areaRange?: string;
  hasPrivatePool: boolean;
  hasTreatmentPavilion: boolean;
  totalVillasCount: number;
  baseNightlyRate: number;
  status: 'active' | 'archived';
  description: string;
}
