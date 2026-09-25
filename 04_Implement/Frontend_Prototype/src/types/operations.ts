export type VillaStatus = 'ready' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance';
export type HousekeepingStatus = 'inspected' | 'clean' | 'in_progress' | 'dirty';
export type ArrivalStatus = 'expected' | 'arrived' | 'checked_in' | 'delayed' | 'cancelled';
export type ResidenceDeclarationStatus = 'pending' | 'ready' | 'submitted';

export interface Villa {
  id: string; // e.g., 'V-101'
  code: string; // e.g., '101'
  name: {
    vi: string;
    en: string;
    'zh-CN': string;
    ja: string;
    fr: string;
  };
  category: string; // e.g., 'Lotus Pool Villa', 'Hillside Pine Canopy', etc.
  capacity: number; // e.g., 2 or 4
  bedType: string; // e.g., '1 King Bed' or '2 King Beds'
  status: VillaStatus;
  housekeeping: HousekeepingStatus;
  currentBookingRef?: string;
  currentCustomerName?: string;
  nextArrival?: {
    date: string;
    time: string;
    customerName: string;
    bookingRef: string;
  };
  features: string[];
  maintenanceReason?: string;
  lastCleanedAt?: string;
}

export interface CustomerIdentityVerification {
  fullLegalName: string;
  nationality: string;
  dateOfBirth: string;
  idType: 'passport' | 'national_id' | 'driver_license';
  idNumber: string;
  issueDate?: string;
  expiryDate?: string;
  permanentAddress: string;
  residenceCountry: string;
  arrivalTransport?: string;
  receptionistNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ArrivalRecord {
  id: string; // e.g., 'ARR-01'
  bookingReference: string; // e.g., 'HSW-84920'
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  retreatSlug: string;
  retreatName: {
    vi: string;
    en: string;
    'zh-CN': string;
    ja: string;
    fr: string;
  };
  heroImage: string;
  startDate: string;
  endDate: string;
  days: number;
  nights: number;
  partySize: number;
  expectedArrivalTime: string; // e.g., '14:00'
  actualArrivalTime?: string;
  depositStatus: 'paid' | 'pending' | 'failed';
  totalPrice: number;
  depositAmount: number;
  assignedVillaId?: string; // e.g., 'V-102'
  assignedVillaNumber?: string; // e.g., 'Villa #102'
  villaCategory: string;
  villaReadiness: 'ready' | 'cleaning' | 'maintenance' | 'unassigned';
  arrivalStatus: ArrivalStatus;
  residenceDeclarationStatus: ResidenceDeclarationStatus;
  identityVerification?: CustomerIdentityVerification;
  specialRequests?: string;
  arrivalNotes?: string;
  wellnessProfileCompleted: boolean; // SAFE minimal flag for readiness
  checkedInAt?: string;
}

export interface OperationalAlert {
  id: string;
  type: 'unassigned_villa' | 'villa_not_ready' | 'pending_declaration' | 'delayed_arrival' | 'deposit_issue';
  severity: 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  bookingRef?: string;
  villaId?: string;
  actionPath?: string;
}

export interface OperationsContextType {
  villas: Villa[];
  arrivals: ArrivalRecord[];
  todayDate: string;
  alerts: OperationalAlert[];
  getVillaById: (id: string) => Villa | undefined;
  getArrivalByBookingRef: (bookingRef: string) => ArrivalRecord | undefined;
  assignVillaToBooking: (bookingRef: string, villaId: string) => { success: boolean; message: string };
  updateVillaStatus: (villaId: string, status: VillaStatus, housekeeping?: HousekeepingStatus) => { success: boolean; message: string };
  startCheckIn: (bookingRef: string) => void;
  saveCheckInDraft: (bookingRef: string, identityData: Partial<CustomerIdentityVerification>) => void;
  completeCheckIn: (bookingRef: string, identityData: CustomerIdentityVerification, villaId: string) => { success: boolean; message: string };
  submitDailyResidenceDeclarations: () => { count: number; message: string };
  markResidenceDeclaration: (bookingRef: string, status: ResidenceDeclarationStatus) => void;
}
