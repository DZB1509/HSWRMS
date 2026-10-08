/**
 * HSWRMS — Module 3: Spa & Therapy Scheduling
 * Domain type definitions.
 *
 * Business Rules enforced by these types:
 * 1. Spa booking is ATOMIC — Therapist + TreatmentRoom must both be available
 *    or the booking fails entirely. No partial reservations.
 * 2. Therapist sees ONLY treatment-relevant health notes via TherapistSafeWellnessView.
 * 3. Session lifecycle: booked → confirmed → in_progress → completed | no_show | cancelled.
 */

// ──────────────────────────────────────────────
// Enums & Status Types
// ──────────────────────────────────────────────

export type SpaSessionStatus =
  | 'booked'       // Customer selected slot, pending confirmation
  | 'confirmed'    // Therapist + Room atomically locked
  | 'in_progress'  // Therapist started the session
  | 'completed'    // Therapist marked done
  | 'no_show'      // Customer did not appear
  | 'cancelled';   // Customer or staff cancelled

export type TreatmentRoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

export type TherapistAvailability = 'available' | 'busy' | 'off_duty' | 'on_leave';

export type TreatmentCategory =
  | 'massage'
  | 'facial'
  | 'body_wrap'
  | 'hydrotherapy'
  | 'yoga'
  | 'meditation'
  | 'herbal_therapy'
  | 'aromatherapy';

export type SessionChargeType = 'included' | 'extra';

// ──────────────────────────────────────────────
// Core Domain Entities
// ──────────────────────────────────────────────

export interface LocalizedString {
  vi: string;
  en: string;
  'zh-CN': string;
  ja: string;
  fr: string;
}

export interface SpaTreatment {
  id: string;                 // e.g., 'TRT-001'
  name: LocalizedString;
  category: TreatmentCategory;
  description: LocalizedString;
  durationMinutes: number;    // e.g., 60, 90, 120
  price: number;              // VND — 0 if included in retreat
  isIncludedInRetreat: boolean;
  imageUrl: string;
  benefits: LocalizedString[];
  contraindications: string[]; // Medical conditions that contraindicate this treatment
}

export interface TreatmentRoom {
  id: string;                   // e.g., 'ROOM-01'
  name: LocalizedString;
  type: string;                 // e.g., 'Private Suite', 'Couples Room', 'Yoga Pavilion'
  capacity: number;             // 1 or 2
  status: TreatmentRoomStatus;
  amenities: string[];          // e.g., ['Steam Shower', 'Jacuzzi', 'Heated Mat']
  currentSessionId?: string;
}

export interface Therapist {
  id: string;                   // e.g., 'THER-01'
  name: string;                 // Display name only
  title: LocalizedString;       // e.g., 'Senior Spa Therapist'
  specializations: TreatmentCategory[];
  avatarUrl: string;
  availability: TherapistAvailability;
  yearsExperience: number;
  currentSessionId?: string;
}

// ──────────────────────────────────────────────
// Spa Session (Booking Record)
// ──────────────────────────────────────────────

export interface SpaSession {
  id: string;                   // e.g., 'SES-301'
  bookingReference: string;     // Links to customer retreat booking, e.g. 'HSW-88192'
  customerId: string;
  customerName: string;
  treatmentId: string;
  treatmentName: LocalizedString;
  therapistId: string;
  therapistName: string;
  roomId: string;
  roomName: LocalizedString;
  date: string;                 // 'YYYY-MM-DD'
  startTime: string;            // 'HH:mm'
  endTime: string;              // 'HH:mm'
  durationMinutes: number;
  status: SpaSessionStatus;
  chargeType: SessionChargeType;
  price: number;                // 0 if included
  therapistNotes?: string;      // Written by therapist after/during session
  customerSpecialRequest?: string;
  createdAt: string;
  completedAt?: string;

  // Prototype calendar sync & ~1h reminder mock metadata
  calendarSyncStatus?: 'synced' | 'pending' | 'none';
  reminderScheduledAt?: string;
  reminderDueAt?: string;

  // Future Folio traceable metadata (for Screen 41 / checkout blocking)
  bookingSource?: 'customer_portal' | 'receptionist_manual';
  folioPostingStatus?: 'included_in_package' | 'pending_checkout_folio' | 'posted_to_folio';
}

// ──────────────────────────────────────────────
// Time Slot (for availability grid)
// ──────────────────────────────────────────────

export interface TimeSlot {
  time: string;                 // 'HH:mm'
  isAvailable: boolean;
  therapistId?: string;
  roomId?: string;
  conflictReason?: string;      // e.g., 'Therapist busy', 'Room in maintenance'
}

export interface AvailableSlot {
  therapistId: string;
  therapistName: string;
  roomId: string;
  roomName: LocalizedString;
  date: string;
  startTime: string;
  endTime: string;
}

// ──────────────────────────────────────────────
// Atomic Booking Result & Structured Conflicts
// ──────────────────────────────────────────────

export type SpaConflictType =
  | 'THERAPIST_UNAVAILABLE'
  | 'ROOM_UNAVAILABLE'
  | 'BOTH_UNAVAILABLE'
  | 'OUTSIDE_RETREAT_WINDOW'
  | 'RESOURCE_UNAVAILABLE';

export interface AtomicBookingResult {
  success: boolean;
  session?: SpaSession;
  message: string;
  conflictType?: SpaConflictType;
  alternativeSlots?: AvailableSlot[];
}

// ──────────────────────────────────────────────
// Privacy-First: Therapist-Safe Wellness View
// Only treatment-relevant health data. No full medical
// records, no PII beyond what's needed for safe treatment.
// ──────────────────────────────────────────────

export interface TherapistSafeWellnessView {
  customerFirstName: string;            // First name only
  relevantMedicalConditions: string[];   // Only conditions that affect spa treatment
  mobilityConsiderations: string;
  treatmentPreferences: string[];
  therapistNotes: string;               // Prior therapist notes
  contraindications: string[];          // From treatment matching
  stressLevel: 'mild' | 'moderate' | 'high';
  // EXCLUDED: full name, DOB, address, allergies (food-only), dietary info, ID numbers
}

// ──────────────────────────────────────────────
// Spa Context Type
// ──────────────────────────────────────────────

export interface SpaContextType {
  // Data
  treatments: SpaTreatment[];
  rooms: TreatmentRoom[];
  therapists: Therapist[];
  sessions: SpaSession[];

  // Lookups
  getTreatmentById: (id: string) => SpaTreatment | undefined;
  getTherapistById: (id: string) => Therapist | undefined;
  getRoomById: (id: string) => TreatmentRoom | undefined;
  getSessionById: (id: string) => SpaSession | undefined;
  getSessionsByBookingRef: (bookingRef: string) => SpaSession[];
  getSessionsByTherapist: (therapistId: string, date?: string) => SpaSession[];

  // Availability
  getAvailableSlots: (
    treatmentId: string,
    date: string,
    preferredTherapistId?: string
  ) => AvailableSlot[];

  // Atomic Booking — enforces Therapist + Room simultaneous reservation
  bookSpaSession: (params: {
    bookingReference: string;
    customerId: string;
    customerName: string;
    treatmentId: string;
    therapistId: string;
    roomId: string;
    date: string;
    startTime: string;
    chargeType: SessionChargeType;
    customerSpecialRequest?: string;
    bookingSource?: 'customer_portal' | 'receptionist_manual';
  }) => AtomicBookingResult;

  // Conflict simulation helper for test cases (e.g., TEST E)
  simulateSlotConflict: (params: {
    date: string;
    startTime: string;
    therapistId?: string;
    roomId?: string;
  }) => void;

  // Session Lifecycle
  cancelSession: (sessionId: string) => { success: boolean; message: string };
  startSession: (sessionId: string) => { success: boolean; message: string };
  completeSession: (sessionId: string, therapistNotes?: string) => { success: boolean; message: string };
  markNoShow: (sessionId: string) => { success: boolean; message: string };

  // Privacy-First Data Projection
  getTherapistRelevantWellnessInfo: (customerId: string, treatmentId?: string) => TherapistSafeWellnessView | null;
}
