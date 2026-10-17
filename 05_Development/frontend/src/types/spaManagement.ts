export type SpaStatus = 'ACTIVE' | 'INACTIVE';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';

export interface SpaTreatmentItem {
  id: string | number;
  dbId?: number;
  treatmentCode: string;
  treatmentName: string;
  category: string;
  durationMinutes: number;
  durationUnit?: string;
  basePrice: number;
  pricingRule?: string;
  roomCompatibility: string;
  requiredQualificationCode?: string;
  therapistQualification: string;
  contraindications: string;
  precautions?: string;
  description: string;
  status: SpaStatus;
  image?: string;
  popularityScore?: number;
}

export interface PackageTreatmentMappingItem {
  treatmentCode: string;
  treatmentName: string;
  category?: string;
  durationMinutes?: number;
  includedSessions: number;
  entitlementStatus: string;
  notes?: string;
}

export interface PackageFnBEntitlementItem {
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  totalMeals: number;
  menuPlan?: string;
  dietaryNotes?: string;
  entitlementStatus?: string;
}

export interface RetreatPackageItem {
  id: string | number;
  dbId?: number;
  packageCode: string;
  packageName: string;
  wellnessGoal: string;
  durationNights: number;
  durationUnit?: string;
  basePrice: number;
  basePriceUnit?: string;
  includedTreatments: string;
  dietaryPlan: string;
  extraChargePolicy?: string;
  targetGuest: string;
  status: SpaStatus;
  image?: string;
  recommendedFor?: string;
  treatmentMappings?: PackageTreatmentMappingItem[];
  fnbEntitlement?: PackageFnBEntitlementItem;
}

export interface TreatmentRoomItem {
  id: string | number;
  roomName: string;
  roomType: string;
  status: RoomStatus;
  currentTherapist?: string;
  currentSession?: string;
}

export interface RoomTypeMasterItem {
  roomType: string;
  typeName: string;
  technicalSpecs?: string;
  designStatus?: string;
}

export interface QualificationMasterItem {
  qualificationCode: string;
  qualificationName: string;
  baselineStatus?: string;
}
