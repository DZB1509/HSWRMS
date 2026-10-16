export type SpaStatus = 'ACTIVE' | 'INACTIVE';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';

export interface SpaTreatmentItem {
  id: string | number;
  dbId?: number;
  treatmentCode: string;
  treatmentName: string;
  category: string;
  durationMinutes: number;
  basePrice: number;
  roomCompatibility: string;
  therapistQualification: string;
  contraindications: string;
  description: string;
  status: SpaStatus;
  image?: string;
  popularityScore?: number;
}

export interface RetreatPackageItem {
  id: string | number;
  dbId?: number;
  packageCode: string;
  packageName: string;
  wellnessGoal: string;
  durationNights: number;
  basePrice: number;
  includedTreatments: string;
  dietaryPlan: string;
  targetGuest: string;
  status: SpaStatus;
  image?: string;
  recommendedFor?: string;
}

export interface TreatmentRoomItem {
  id: string | number;
  roomName: string;
  roomType: string;
  status: RoomStatus;
  currentTherapist?: string;
  currentSession?: string;
}
