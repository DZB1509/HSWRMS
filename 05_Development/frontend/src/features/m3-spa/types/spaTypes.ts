/**
 * HSWRMS — Module 3: Spa & Therapy Scheduling
 * Authoritative Backend-Aligned TypeScript Types.
 *
 * Invariants:
 * 1. Two separate status lifecycles: session_status and confirmation_status.
 * 2. Pure system-driven scheduling: candidates are indivisible bundles (Time + Therapist + Room).
 * 3. Therapist projection provides ONLY treatment-relevant health/safety notes.
 */

export type BackendSpaSessionStatus =
  | 'SCHEDULED'
  | 'RESCHEDULING'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type BackendSpaConfirmationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'EXPIRED';

export type BookingSourceType = 'CUSTOMER' | 'RECEPTIONIST' | 'SYSTEM';

export interface BackendSpaTreatment {
  treatmentId: number;
  treatmentName: string;
  durationMinutes: number;
  basePrice: number;
  category: string;
  description: string;
  isIncluded: boolean;
  treatmentStatus: string;
}

export interface SchedulingCandidate {
  candidateId: string;
  treatmentId: number;
  treatmentName: string;
  durationMinutes: number;
  therapistId: number;
  therapistName: string;
  roomId: number;
  roomName: string;
  scheduledStartAt: string; // ISO string
  scheduledEndAt: string;   // ISO string
  startTime: string;        // HH:mm
  endTime: string;          // HH:mm
  date: string;             // YYYY-MM-DD
}

export interface CandidateGenerationResult {
  candidates: SchedulingCandidate[];
  requestedDate: string;
  treatmentDurationMinutes: number;
  noAvailability: boolean;
  alternativeCandidates: SchedulingCandidate[];
  message: string;
}

export interface GenerateCandidatesPayload {
  treatmentId: number;
  preferredDate: string;    // YYYY-MM-DD
  timeRangePreference?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANY';
  preferredStartTime?: string; // HH:mm
  preferredEndTime?: string;   // HH:mm
  flexibleWithDate?: boolean;
}

export interface ConfirmReservationPayload {
  treatmentId: number;
  therapistId: number;
  roomId: number;
  scheduledStartAt: string; // ISO string
  scheduledEndAt: string;   // ISO string
  retreatBookingId?: number;
  customerNote?: string;
  bookingSource?: BookingSourceType;
  rescheduleSessionId?: number;
}

export interface BackendSpaSession {
  spaSessionId: number;
  retreatBookingId: number;
  bookingReference: string;
  customerName: string;
  treatmentId: number;
  treatmentName: string;
  durationMinutes: number;
  basePrice: number;
  isIncluded: boolean;
  therapistId: number;
  therapistName: string;
  roomId: number;
  roomName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingSource: BookingSourceType;
  sessionStatus: BackendSpaSessionStatus;
  confirmationStatus: BackendSpaConfirmationStatus;
  customerNote?: string;
}

export interface TherapistSessionDetail {
  spaSessionId: number;
  treatmentName: string;
  durationMinutes: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  roomName: string;
  customerFirstName: string;
  treatmentSafetyNotes: string;
  relevantPrecautions: string[];
  sessionStatus: BackendSpaSessionStatus;
  confirmationStatus: BackendSpaConfirmationStatus;
  customerNote?: string;
}

export interface CompleteSessionPayload {
  outcome: 'COMPLETED' | 'NO_SHOW';
  therapistNotes?: string;
}
