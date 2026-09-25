/**
 * HSWRMS — Module 3: Spa Context Provider
 *
 * Centralized state management for Spa & Therapy Scheduling.
 * Enforces ATOMIC booking (Therapist + Room must both be available).
 * Provides privacy-first data projections for therapist view.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  SpaTreatment,
  TreatmentRoom,
  Therapist,
  SpaSession,
  SpaSessionStatus,
  AvailableSlot,
  AtomicBookingResult,
  TherapistSafeWellnessView,
  SpaContextType,
  SessionChargeType,
} from '../types/spa';
import {
  INITIAL_TREATMENTS,
  INITIAL_ROOMS,
  INITIAL_THERAPISTS,
  INITIAL_SPA_SESSIONS,
} from '../data/mockSpa';
import { useCustomer } from './CustomerContext';

const SpaContext = createContext<SpaContextType | undefined>(undefined);

// ──────────────────────────────────────────────
// Helper: Time arithmetic
// ──────────────────────────────────────────────

const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m: number): string => {
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const sessionsOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  const a0 = timeToMinutes(startA);
  const a1 = timeToMinutes(endA);
  const b0 = timeToMinutes(startB);
  const b1 = timeToMinutes(endB);
  return a0 < b1 && b0 < a1;
};

// ──────────────────────────────────────────────
// Spa Provider
// ──────────────────────────────────────────────

export const SpaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wellnessProfile } = useCustomer();

  const [treatments] = useState<SpaTreatment[]>(INITIAL_TREATMENTS);
  const [rooms, setRooms] = useState<TreatmentRoom[]>(INITIAL_ROOMS);
  const [therapists, setTherapists] = useState<Therapist[]>(INITIAL_THERAPISTS);
  const [sessions, setSessions] = useState<SpaSession[]>(INITIAL_SPA_SESSIONS);

  // ── Lookups ────────────────────────────────

  const getTreatmentById = useCallback(
    (id: string) => treatments.find((t) => t.id === id),
    [treatments]
  );

  const getTherapistById = useCallback(
    (id: string) => therapists.find((t) => t.id === id),
    [therapists]
  );

  const getRoomById = useCallback(
    (id: string) => rooms.find((r) => r.id === id),
    [rooms]
  );

  const getSessionById = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions]
  );

  const getSessionsByBookingRef = useCallback(
    (bookingRef: string) => sessions.filter((s) => s.bookingReference === bookingRef),
    [sessions]
  );

  const getSessionsByTherapist = useCallback(
    (therapistId: string, date?: string) =>
      sessions.filter(
        (s) =>
          s.therapistId === therapistId &&
          (date ? s.date === date : true) &&
          !['cancelled', 'no_show'].includes(s.status)
      ),
    [sessions]
  );

  // ── Availability Engine ────────────────────

  const getAvailableSlots = useCallback(
    (treatmentId: string, date: string, preferredTherapistId?: string): AvailableSlot[] => {
      const treatment = treatments.find((t) => t.id === treatmentId);
      if (!treatment) return [];

      const duration = treatment.durationMinutes;
      const slotStartTimes = ['08:00', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00'];

      const activeSessions = sessions.filter(
        (s) => s.date === date && !['cancelled', 'no_show'].includes(s.status)
      );

      const slots: AvailableSlot[] = [];

      // Determine eligible therapists
      const eligibleTherapists = preferredTherapistId
        ? therapists.filter((t) => t.id === preferredTherapistId && t.availability !== 'off_duty' && t.availability !== 'on_leave')
        : therapists.filter(
            (t) =>
              t.specializations.includes(treatment.category) &&
              t.availability !== 'off_duty' &&
              t.availability !== 'on_leave'
          );

      // Check eligible rooms (status must be available)
      const eligibleRooms = rooms.filter((r) => r.status === 'available' || r.status === 'cleaning');

      for (const startTime of slotStartTimes) {
        const endTime = minutesToTime(timeToMinutes(startTime) + duration);

        // Don't go past 19:00 operating hours
        if (timeToMinutes(endTime) > timeToMinutes('19:00')) continue;

        for (const therapist of eligibleTherapists) {
          // Check therapist is free during this window
          const therapistBusy = activeSessions.some(
            (s) =>
              s.therapistId === therapist.id &&
              sessionsOverlap(startTime, endTime, s.startTime, s.endTime)
          );
          if (therapistBusy) continue;

          for (const room of eligibleRooms) {
            // Check room is free during this window
            const roomBusy = activeSessions.some(
              (s) =>
                s.roomId === room.id &&
                sessionsOverlap(startTime, endTime, s.startTime, s.endTime)
            );
            if (roomBusy) continue;

            slots.push({
              therapistId: therapist.id,
              therapistName: therapist.name,
              roomId: room.id,
              roomName: room.name,
              date,
              startTime,
              endTime,
            });
          }
        }
      }

      return slots;
    },
    [treatments, therapists, rooms, sessions]
  );

  // ── Atomic Booking ─────────────────────────
  // BUSINESS RULE: Therapist + Room must BOTH be available
  // at the exact same time, or the booking fails entirely.

  const bookSpaSession = useCallback(
    (params: {
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
    }): AtomicBookingResult => {
      const treatment = treatments.find((t) => t.id === params.treatmentId);
      if (!treatment) {
        return { success: false, message: 'Treatment not found.' };
      }

      if (!params.therapistId || params.therapistId === 'any') {
        return {
          success: false,
          conflictType: 'THERAPIST_UNAVAILABLE',
          message: 'Booking failed: A specific assigned therapist is required before confirming a session.',
        };
      }

      const therapist = therapists.find((t) => t.id === params.therapistId);
      if (!therapist) {
        return {
          success: false,
          conflictType: 'THERAPIST_UNAVAILABLE',
          message: 'Therapist not found.',
        };
      }

      if (!params.roomId || params.roomId === 'any' || params.roomId === 'unspecified') {
        return {
          success: false,
          conflictType: 'ROOM_UNAVAILABLE',
          message: 'Booking failed: A specific treatment room is required before confirming a session.',
        };
      }

      const room = rooms.find((r) => r.id === params.roomId);
      if (!room) {
        return {
          success: false,
          conflictType: 'ROOM_UNAVAILABLE',
          message: 'Treatment room not found.',
        };
      }

      const endTime = minutesToTime(timeToMinutes(params.startTime) + treatment.durationMinutes);

      // Check Therapist availability (ATOMIC condition 1)
      const activeSessions = sessions.filter(
        (s) => s.date === params.date && !['cancelled', 'no_show'].includes(s.status)
      );

      const therapistConflict = activeSessions.some(
        (s) =>
          s.therapistId === params.therapistId &&
          sessionsOverlap(params.startTime, endTime, s.startTime, s.endTime)
      );

      // Check Room availability (ATOMIC condition 2)
      const roomConflict = activeSessions.some(
        (s) =>
          s.roomId === params.roomId &&
          sessionsOverlap(params.startTime, endTime, s.startTime, s.endTime)
      );

      // ATOMIC FAIL: If EITHER is unavailable, booking fails entirely WITHOUT MUTATION
      if (therapistConflict || roomConflict) {
        const alternativeSlots = getAvailableSlots(params.treatmentId, params.date);
        const reasons: string[] = [];
        if (therapistConflict) reasons.push(`${therapist.name} is not available at ${params.startTime}`);
        if (roomConflict) reasons.push(`${room.name.en} is occupied at ${params.startTime}`);

        const conflictType =
          therapistConflict && roomConflict
            ? 'BOTH_UNAVAILABLE'
            : therapistConflict
            ? 'THERAPIST_UNAVAILABLE'
            : 'ROOM_UNAVAILABLE';

        return {
          success: false,
          conflictType,
          message: `Booking failed: ${reasons.join('; ')}. Please select an alternative slot.`,
          alternativeSlots: alternativeSlots.slice(0, 10),
        };
      }

      // Room maintenance/cleaning check
      if (room.status === 'maintenance') {
        return {
          success: false,
          conflictType: 'ROOM_UNAVAILABLE',
          message: `${room.name.en} is currently under maintenance.`,
          alternativeSlots: getAvailableSlots(params.treatmentId, params.date).slice(0, 10),
        };
      }

      // Therapist off-duty check
      if (therapist.availability === 'off_duty' || therapist.availability === 'on_leave') {
        return {
          success: false,
          conflictType: 'THERAPIST_UNAVAILABLE',
          message: `${therapist.name} is currently ${therapist.availability.replace('_', ' ')}.`,
          alternativeSlots: getAvailableSlots(params.treatmentId, params.date).slice(0, 10),
        };
      }

      const startMin = timeToMinutes(params.startTime);
      const reminderMin = Math.max(0, startMin - 60);

      // ── SUCCESS: Create session atomically with mock calendar and folio metadata ──
      const newSession: SpaSession = {
        id: `SES-${Date.now().toString(36).toUpperCase()}`,
        bookingReference: params.bookingReference,
        customerId: params.customerId,
        customerName: params.customerName,
        treatmentId: params.treatmentId,
        treatmentName: treatment.name,
        therapistId: params.therapistId,
        therapistName: therapist.name,
        roomId: params.roomId,
        roomName: room.name,
        date: params.date,
        startTime: params.startTime,
        endTime,
        durationMinutes: treatment.durationMinutes,
        status: 'confirmed',
        chargeType: params.chargeType,
        price: params.chargeType === 'included' ? 0 : treatment.price,
        customerSpecialRequest: params.customerSpecialRequest,
        createdAt: new Date().toISOString(),
        // Prototype calendar sync & ~1h reminder simulation
        calendarSyncStatus: 'synced',
        reminderScheduledAt: new Date().toISOString(),
        reminderDueAt: `${params.date}T${minutesToTime(reminderMin)}:00`,
        // Traceable future folio metadata
        bookingSource: params.bookingSource || 'customer_portal',
        folioPostingStatus: params.chargeType === 'included' ? 'included_in_package' : 'pending_checkout_folio',
      };

      setSessions((prev) => [...prev, newSession]);

      return {
        success: true,
        session: newSession,
        message: `Spa session confirmed: ${treatment.name.en} with ${therapist.name} at ${params.startTime} in ${room.name.en}.`,
      };
    },
    [treatments, therapists, rooms, sessions, getAvailableSlots]
  );

  // ── Test Simulation: Introduce slot conflict (for TEST E validation) ──
  const simulateSlotConflict = useCallback(
    (conflictParams: {
      date: string;
      startTime: string;
      therapistId?: string;
      roomId?: string;
    }) => {
      const targetTherapist = conflictParams.therapistId
        ? therapists.find((t) => t.id === conflictParams.therapistId) || therapists[0]
        : therapists[0];
      const targetRoom = conflictParams.roomId
        ? rooms.find((r) => r.id === conflictParams.roomId) || rooms[0]
        : rooms[0];

      const simSession: SpaSession = {
        id: `SES-SIM-${Date.now().toString(36).toUpperCase()}`,
        bookingReference: 'HSW-SIM-CONFLICT',
        customerId: 'usr-sim-01',
        customerName: 'Simulated Conflict Occupant',
        treatmentId: 'TRT-001',
        treatmentName: {
          vi: 'Buổi trị liệu mô phỏng xung đột',
          en: 'Simulated Conflict Session',
          'zh-CN': '模拟冲突时段',
          ja: 'シミュレート競合セッション',
          fr: 'Session de Conflit Simulé',
        },
        therapistId: targetTherapist.id,
        therapistName: targetTherapist.name,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        date: conflictParams.date,
        startTime: conflictParams.startTime,
        endTime: minutesToTime(timeToMinutes(conflictParams.startTime) + 60),
        durationMinutes: 60,
        status: 'confirmed',
        chargeType: 'included',
        price: 0,
        createdAt: new Date().toISOString(),
        calendarSyncStatus: 'synced',
        bookingSource: 'customer_portal',
        folioPostingStatus: 'included_in_package',
      };

      setSessions((prev) => [...prev, simSession]);
    },
    [therapists, rooms]
  );

  // ── Session Lifecycle ──────────────────────

  const updateSessionStatus = useCallback(
    (
      sessionId: string,
      newStatus: SpaSessionStatus,
      therapistNotes?: string
    ): { success: boolean; message: string } => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        return { success: false, message: `Session ${sessionId} not found.` };
      }

      // Validate state transitions
      const validTransitions: Record<SpaSessionStatus, SpaSessionStatus[]> = {
        booked: ['confirmed', 'cancelled'],
        confirmed: ['in_progress', 'cancelled', 'no_show'],
        in_progress: ['completed'],
        completed: [],
        no_show: [],
        cancelled: [],
      };

      if (!validTransitions[session.status]?.includes(newStatus)) {
        return {
          success: false,
          message: `Cannot transition from ${session.status} to ${newStatus}.`,
        };
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              status: newStatus,
              therapistNotes: therapistNotes ?? s.therapistNotes,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : s.completedAt,
            };
          }
          return s;
        })
      );

      // Update therapist/room state when session starts or ends
      if (newStatus === 'in_progress') {
        setTherapists((prev) =>
          prev.map((t) =>
            t.id === session.therapistId ? { ...t, availability: 'busy', currentSessionId: sessionId } : t
          )
        );
        setRooms((prev) =>
          prev.map((r) =>
            r.id === session.roomId ? { ...r, status: 'occupied', currentSessionId: sessionId } : r
          )
        );
      } else if (['completed', 'no_show', 'cancelled'].includes(newStatus)) {
        setTherapists((prev) =>
          prev.map((t) =>
            t.currentSessionId === sessionId ? { ...t, availability: 'available', currentSessionId: undefined } : t
          )
        );
        setRooms((prev) =>
          prev.map((r) =>
            r.currentSessionId === sessionId ? { ...r, status: 'available', currentSessionId: undefined } : r
          )
        );
      }

      return { success: true, message: `Session ${sessionId} updated to ${newStatus}.` };
    },
    [sessions]
  );

  const cancelSession = useCallback(
    (sessionId: string) => updateSessionStatus(sessionId, 'cancelled'),
    [updateSessionStatus]
  );

  const startSession = useCallback(
    (sessionId: string) => updateSessionStatus(sessionId, 'in_progress'),
    [updateSessionStatus]
  );

  const completeSession = useCallback(
    (sessionId: string, therapistNotes?: string) =>
      updateSessionStatus(sessionId, 'completed', therapistNotes),
    [updateSessionStatus]
  );

  const markNoShow = useCallback(
    (sessionId: string) => updateSessionStatus(sessionId, 'no_show'),
    [updateSessionStatus]
  );

  // ── Privacy-First: Therapist-Safe Wellness Data ──
  // ONLY exposes treatment-relevant health notes.
  // EXCLUDED: full name, DOB, address, food allergies,
  // dietary restrictions, ID numbers, payment info.

  const getTherapistRelevantWellnessInfo = useCallback(
    (customerId: string, treatmentId?: string): TherapistSafeWellnessView | null => {
      // In demo mode, customerId maps to canonical customer
      if (customerId !== 'usr-cust-01') return null;
      if (!wellnessProfile?.isComplete) return null;

      const { healthNotes } = wellnessProfile;
      const treatment = treatmentId ? treatments.find((t) => t.id === treatmentId) : undefined;
      const category = treatment?.category;

      let relevantMedicalConditions: string[] = [];
      let mobilityConsiderations = '';
      let treatmentPreferences: string[] = [];
      let therapistNotes = '';

      if (!category || category === 'massage' || category === 'body_wrap') {
        // Massage & Body Treatments: back/lumbar notes, positioning cushions, pressure preferences
        relevantMedicalConditions = healthNotes.medicalConditions.filter((c) =>
          c.toLowerCase().includes('lumbar') || c.toLowerCase().includes('tension')
        );
        mobilityConsiderations = healthNotes.mobilityConsiderations;
        treatmentPreferences = healthNotes.treatmentPreferences.filter(
          (p) => p.toLowerCase().includes('aromatherapy') || p.toLowerCase().includes('compress') || p.toLowerCase().includes('shoulder')
        );
        therapistNotes = 'Ensure lower back support cushion during massage. Customer cleared for gentle massage therapies.';
      } else if (category === 'yoga') {
        // Yoga: spinal stretch and lumbar mobility
        relevantMedicalConditions = healthNotes.medicalConditions.filter((c) =>
          c.toLowerCase().includes('lumbar')
        );
        mobilityConsiderations = 'Prefers gentle lower-back stretching; strictly avoid forceful spinal twists.';
        treatmentPreferences = ['Gentle restorative stretching only', 'Supported bolster positioning'];
        therapistNotes = 'Customer is cleared for gentle restorative yoga. Avoid unsupported backbends.';
      } else if (category === 'hydrotherapy' || category === 'herbal_therapy') {
        // Hydrotherapy & Steam: cardiovascular/hypertension considerations
        relevantMedicalConditions = healthNotes.medicalConditions.filter((c) =>
          c.toLowerCase().includes('hypertension')
        );
        mobilityConsiderations = '';
        treatmentPreferences = healthNotes.treatmentPreferences.filter((p) =>
          p.toLowerCase().includes('herbal') || p.toLowerCase().includes('aromatherapy')
        );
        therapistNotes = 'Customer cleared for herbal steam therapy. Moderate temperature recommended.';
      } else if (category === 'facial') {
        // Facial: skin and head/neck only, zero lumbar notes
        relevantMedicalConditions = [];
        mobilityConsiderations = '';
        treatmentPreferences = ['Aromatherapy (Lavender & Eucalyptus)', 'Gentle neck & shoulder relaxation'];
        therapistNotes = 'No facial sensitivities or skin allergies on record.';
      } else if (category === 'meditation') {
        // Meditation: posture and breathing only
        relevantMedicalConditions = [];
        mobilityConsiderations = 'Prefers supported seated cushion for comfort.';
        treatmentPreferences = ['Quiet guided practice', 'Low ambient lighting'];
        therapistNotes = 'Customer prefers gentle mindfulness guidance with breath focus.';
      }

      return {
        customerFirstName: 'Eleanor', // First name only — no full PII
        relevantMedicalConditions,
        mobilityConsiderations,
        treatmentPreferences,
        therapistNotes,
        contraindications: treatment?.contraindications || [],
        stressLevel: healthNotes.stressLevel,
      };
    },
    [wellnessProfile, treatments]
  );

  // ── Context Value ──────────────────────────

  const value: SpaContextType = {
    treatments,
    rooms,
    therapists,
    sessions,
    getTreatmentById,
    getTherapistById,
    getRoomById,
    getSessionById,
    getSessionsByBookingRef,
    getSessionsByTherapist,
    getAvailableSlots,
    bookSpaSession,
    simulateSlotConflict,
    cancelSession,
    startSession,
    completeSession,
    markNoShow,
    getTherapistRelevantWellnessInfo,
  };

  return <SpaContext.Provider value={value}>{children}</SpaContext.Provider>;
};

export const useSpa = (): SpaContextType => {
  const context = useContext(SpaContext);
  if (!context) {
    throw new Error('useSpa must be used within a SpaProvider');
  }
  return context;
};
