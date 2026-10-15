export type VillaOperationalStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'NEEDS_CLEANING' | 'INACTIVE';

export interface PhysicalVillaItem {
  id: string; // e.g., 'V101'
  villaNumber: string; // e.g., 'V101'
  categoryId: number;
  categoryName: string;
  zoneName: string;
  floor: string;
  bedroomCount: number;
  bedroomInfo: string;
  bedType?: string; // e.g. 'King Bed (1.8m x 2.0m)'
  maxAdults?: number; // e.g. 2
  maxChildren?: number; // e.g. 1
  maxOccupancy: number;
  areaSqm: number;
  nightlyRate?: number; // Base or override nightly rate in VND
  hasPrivatePool: boolean;
  poolInfo: string;
  status: VillaOperationalStatus;
  viewAndOperationalNotes: string;
  image: string;
  amenities: string[];
  housekeepingNotes?: string;
  lastMaintenanceDate?: string;
}

export interface VillaCategoryItem {
  id: number;
  categoryName: string;
  categoryCode?: string;
  inventoryCount: number;
  bedroomCount: number;
  bedType?: string;
  bedroomDescription: string;
  maxAdults?: number;
  maxChildren?: number;
  maxOccupancy: number;
  standardOccupancy: number;
  areaRange: string;
  basePrice?: number; // Base standard nightly rate in VND
  priceModifier: number; // in VND
  hasPrivatePool: boolean;
  poolDescription: string;
  featuresAndAmenities: string;
  eligiblePackages: string[];
  image: string;
  highlights: string[];
}

export interface ResortZoneItem {
  id: number;
  zoneName: string;
  zoneCode: string;
  landscapeDescription: string;
  villaCount: number;
  villaNumbers: string[];
  applicableCategory: string;
  relativePriceTier: string;
  operationalAdvantages: string;
  iconName: string;
  gradient: string;
}

export interface VillaFunctionalAreaItem {
  id: number;
  spaceGroup: 'Khu Vực Nghỉ Ngơi (Private)' | 'Khu Sinh Hoạt Chung (Social)' | 'Khu Ngoại Thất & Thư Giãn' | 'Khu Phụ Trợ & Tiện Ích Cao Cấp';
  roomName: string;
  areaRangeSqm: string;
  quantityIn1Br: string;
  quantityIn23Br: string;
  quantityInEstate46Br: string;
  keyFurnishing: string;
  operationalPurpose: string;
}
