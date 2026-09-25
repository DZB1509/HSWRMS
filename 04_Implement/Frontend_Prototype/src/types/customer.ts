export type BookingStatus = 'upcoming' | 'in_stay' | 'completed' | 'cancelled';
export type DepositStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type DeletionRequestStatus = 'eligible' | 'pending' | 'deferred_active_retreat' | 'completed';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  wellnessReminders: boolean;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  preferredLanguage: string;
  emergencyContact: EmergencyContact;
  notificationPreferences: NotificationPreferences;
  membershipTier: string;
  memberSince: string;
  assignedVilla?: string;
}

export interface HealthDataConsent {
  hasConsented: boolean;
  consentedAt: string;
  policyVersion: string;
  purposeSummary: string;
}

export interface HealthNotes {
  medicalConditions: string[];
  injuriesOrSurgeries: string;
  mobilityConsiderations: string;
  currentMedications: string;
  stressLevel: 'mild' | 'moderate' | 'high';
  treatmentPreferences: string[];
  therapistNotes: string;
}

export interface DietaryProfile {
  allergies: string[];
  dietaryRestrictions: string[];
  intolerances: string[];
  dislikedIngredients: string[];
  specialInstructions: string;
}

export interface WellnessProfile {
  consent: HealthDataConsent;
  healthNotes: HealthNotes;
  dietaryProfile: DietaryProfile;
  isComplete: boolean;
  lastUpdated: string;
}

export interface HealthDataDeletionRequest {
  id: string;
  customerId: string;
  requestedAt: string;
  status: DeletionRequestStatus;
  targetDataTypes: string[];
  activeRetreatNotice?: string;
  reason?: string;
  acknowledgedPolicy: boolean;
  reviewedAt?: string;
}

export interface ItineraryActivity {
  time: string;
  name: {
    vi: string;
    en: string;
    'zh-CN': string;
    ja: string;
    fr: string;
  };
  type: 'wellness' | 'dining' | 'spa' | 'mindfulness' | 'rest';
  location: string;
}

export interface ItineraryDay {
  day: number;
  title: {
    vi: string;
    en: string;
    'zh-CN': string;
    ja: string;
    fr: string;
  };
  activities: ItineraryActivity[];
}

export interface RetreatBooking {
  id: string;
  bookingReference: string;
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
  villaType: {
    vi: string;
    en: string;
    'zh-CN': string;
    ja: string;
    fr: string;
  };
  villaNumber?: string;
  status: BookingStatus;
  totalPrice: number;
  depositAmount: number;
  remainingBalance: number;
  depositStatus: DepositStatus;
  paymentDetails?: {
    transactionId: string;
    paymentMethod: string;
    paidAt: string;
    cardLast4?: string;
  };
  specialRequests?: string;
  arrivalNotes?: string;
  itinerary: ItineraryDay[];
  createdAt: string;
}

export interface CustomerContextType {
  profile: CustomerProfile;
  updateProfile: (updated: Partial<CustomerProfile>) => void;
  wellnessProfile: WellnessProfile;
  updateWellnessProfile: (updated: Partial<WellnessProfile>) => void;
  deletionRequest: HealthDataDeletionRequest | null;
  submitDeletionRequest: (reason: string, acknowledged: boolean) => { success: boolean; status: DeletionRequestStatus; message: string };
  cancelDeletionRequest: () => void;
  bookings: RetreatBooking[];
  activeBooking: RetreatBooking | null;
  createBooking: (bookingData: Omit<RetreatBooking, 'id' | 'bookingReference' | 'createdAt'>) => RetreatBooking;
  getBookingById: (idOrReference: string) => RetreatBooking | undefined;
  updateBookingDeposit: (bookingId: string, transactionId: string, status: DepositStatus) => void;
}
