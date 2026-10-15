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
  maxOccupancy: number;
  areaSqm: number;
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
  inventoryCount: number;
  bedroomCount: number;
  bedroomDescription: string;
  maxOccupancy: number;
  standardOccupancy: number;
  areaRange: string;
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
