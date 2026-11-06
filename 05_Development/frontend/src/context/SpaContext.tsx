/**
 * HSWRMS — Module 3: Spa Context Provider
 *
 * Centralized state management for Spa & Therapy Scheduling.
 * Enforces ATOMIC booking (Therapist + Room must both be available).
 * Provides privacy-first data projections for therapist view.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useReducer, useRef } from 'react';
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
} from '../types/spa';
import { spaApi } from '../features/m3-spa/api/spaApi';
import { useAuth } from '../hooks/useAuth';
import { SPA_TREATMENTS_INVENTORY } from '../data/mockSpaInventory';
import {
  resolveSpaTreatmentLocalized,
  resolveSpaTreatmentDescriptionLocalized,
} from '../i18n/dynamicContent';
import {
  createIdentityScopedState,
  identityScopedReducer,
  selectIdentityScopedState,
} from '../utils/identityScopedState';

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
  const { role, currentUser } = useAuth();
  const identity = currentUser?.id ?? null;
  const [treatments, setTreatments] = useState<SpaTreatment[]>([]);
  const [rooms] = useState<TreatmentRoom[]>([]);
  const [therapists] = useState<Therapist[]>([]);
  const [sessionState, dispatchSessionState] = useReducer(
    identityScopedReducer<SpaSession[]>,
    createIdentityScopedState<SpaSession[]>(null, []),
  );
  const sessionRequestSequence = useRef(0);
  const currentIdentitySessions = selectIdentityScopedState(sessionState, identity, []);
  const sessions = currentIdentitySessions.data;
  const isLoading = currentIdentitySessions.isLoading;
  const error = currentIdentitySessions.error;

  useEffect(() => {
    let active = true;
    const requestId = ++sessionRequestSequence.current;
    dispatchSessionState({
      type: 'begin',
      identity,
      requestId,
      emptyData: [],
      isLoading: identity !== null,
    });

    if (identity === null) {
      return () => { active = false; };
    }

    const sessionRequest = role === 'therapist' ? spaApi.getTherapistDashboard() : spaApi.getMySpaSessions();
    Promise.allSettled([spaApi.getTreatments(), sessionRequest]).then(([treatmentResult, sessionResult]) => {
      if (!active) return;
      if (treatmentResult.status === 'fulfilled') setTreatments(treatmentResult.value.map((item, idx) => {
        const name = item.treatmentName;
        const localized = resolveSpaTreatmentLocalized(item.treatmentId || (item as any).treatmentCode || item.treatmentName, name);
        const inv = SPA_TREATMENTS_INVENTORY.find(i => 
          i.treatmentName.toLowerCase() === item.treatmentName.toLowerCase() ||
          (item.treatmentId && i.treatmentCode.endsWith(String(item.treatmentId).padStart(2, '0')))
        ) || SPA_TREATMENTS_INVENTORY[idx] || SPA_TREATMENTS_INVENTORY[item.treatmentId - 1];
        const imageUrl = inv?.image || '/assets/spa/fallback.jpg';
        const localizedDesc = resolveSpaTreatmentDescriptionLocalized(item.treatmentId || (item as any).treatmentCode || item.treatmentName, item.description || inv?.description || name);
        return { 
          id:String(item.treatmentId), 
          name:localized, 
          category:((item.category ? item.category.toLowerCase() : 'body massage') as SpaTreatment['category']), 
          description:localizedDesc, 
          durationMinutes:item.durationMinutes, 
          price:item.basePrice, 
          isIncludedInRetreat:item.isIncluded, 
          imageUrl, 
          benefits: inv?.pricingRule ? [{ vi: inv.pricingRule, en: inv.pricingRule, 'zh-CN': inv.pricingRule, ja: inv.pricingRule, fr: inv.pricingRule }] : [], 
          contraindications: inv?.contraindications ? [inv.contraindications] : [] 
        };
      }));
      const nextSessions = sessionResult.status === 'fulfilled' ? sessionResult.value.map(item => {
        const name = resolveSpaTreatmentLocalized(item.treatmentId || item.treatmentName, item.treatmentName);
        const resource = { vi:item.roomName,en:item.roomName,'zh-CN':item.roomName,ja:item.roomName,fr:item.roomName };
        const status = item.sessionStatus === 'COMPLETED' ? 'completed' : item.sessionStatus === 'NO_SHOW' ? 'no_show' : item.sessionStatus === 'CANCELLED' ? 'cancelled' : item.confirmationStatus === 'PENDING' ? 'booked' : 'confirmed';
        return { id:String(item.spaSessionId), bookingReference:item.bookingReference, customerId:'', customerName:item.customerName, treatmentId:String(item.treatmentId), treatmentName:name, therapistId:String(item.therapistId), therapistName:item.therapistName, roomId:String(item.roomId), roomName:resource, date:item.date, startTime:item.startTime, endTime:item.endTime, durationMinutes:item.durationMinutes, status, chargeType:item.isIncluded ? 'included' : 'extra', price:item.basePrice, customerSpecialRequest:item.customerNote, createdAt:item.scheduledStartAt } as SpaSession;
      }) : [];
      dispatchSessionState({
        type: 'resolve',
        identity,
        requestId,
        data: nextSessions,
        error: treatmentResult.status === 'rejected' || sessionResult.status === 'rejected'
          ? 'Some Spa data could not be loaded from the server.'
          : null,
      });
    });
    return () => { active = false; };
  }, [identity, role]);

  // ── Lookups ────────────────────────────────

  const getTreatmentById = useCallback(
    (id: string | number) => treatments.find((t) => id != null && String(t.id).toLowerCase() === String(id).toLowerCase()),
    [treatments]
  );

  const getTherapistById = useCallback(
    (id: string | number) => therapists.find((t) => id != null && String(t.id).toLowerCase() === String(id).toLowerCase()),
    [therapists]
  );

  const getRoomById = useCallback(
    (id: string | number) => rooms.find((r) => id != null && String(r.id).toLowerCase() === String(id).toLowerCase()),
    [rooms]
  );

  const getSessionById = useCallback(
    (id: string | number) => sessions.find((s) => id != null && String(s.id).toLowerCase() === String(id).toLowerCase()),
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

  const bookSpaSession = useCallback((): AtomicBookingResult => ({
    success: false,
    message: 'Local Spa booking is disabled. Use the server candidate generation and atomic reservation flow.',
  }), []);

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

      if (identity !== null) {
        dispatchSessionState({
          type: 'update',
          identity,
          update: (prev) => [...prev, simSession],
        });
      }
    },
    [therapists, rooms, identity]
  );

  // ── Session Lifecycle ──────────────────────

  const persistSessionAction = useCallback(async (sessionId: string, outcome: 'CANCELLED' | 'COMPLETED' | 'NO_SHOW', therapistNotes?: string) => {
    if (identity === null) return { success: false, message: 'Sign in to update a Spa session.' };
    const numericId = Number(sessionId.replace(/\D/g, ''));
    if (!Number.isSafeInteger(numericId) || numericId <= 0) return { success: false, message: 'A persisted server session ID is required.' };
    try {
      const saved = outcome === 'CANCELLED' ? await spaApi.cancelSession(numericId) : await spaApi.recordOutcome(numericId, { outcome, therapistNotes });
      const status: SpaSessionStatus = saved.sessionStatus === 'COMPLETED' ? 'completed' : saved.sessionStatus === 'NO_SHOW' ? 'no_show' : saved.sessionStatus === 'CANCELLED' ? 'cancelled' : saved.confirmationStatus === 'PENDING' ? 'booked' : 'confirmed';
      dispatchSessionState({
        type: 'update',
        identity,
        update: (prev) => prev.map(session => session.id === sessionId ? { ...session, status, customerSpecialRequest: saved.customerNote || session.customerSpecialRequest } : session),
      });
      return { success: true, message: `Server confirmed session status ${saved.sessionStatus}.` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'The server did not confirm the session change.' };
    }
  }, [identity]);

  const cancelSession = useCallback((sessionId: string) => persistSessionAction(sessionId, 'CANCELLED'), [persistSessionAction]);
  const startSession = useCallback(() => ({ success: false, message: 'Starting a session is unavailable: the approved lifecycle does not persist IN_PROGRESS.' }), []);
  const completeSession = useCallback((sessionId: string, therapistNotes?: string) => persistSessionAction(sessionId, 'COMPLETED', therapistNotes), [persistSessionAction]);
  const markNoShow = useCallback((sessionId: string) => persistSessionAction(sessionId, 'NO_SHOW'), [persistSessionAction]);

  // ── Privacy-First: Therapist-Safe Wellness Data ──
  // ONLY exposes treatment-relevant health notes.
  // EXCLUDED: full name, DOB, address, food allergies,
  // dietary restrictions, ID numbers, payment info.

  const getTherapistRelevantWellnessInfo = useCallback((_customerId: string, _treatmentId?: string): TherapistSafeWellnessView | null => null, []);

  // ── Context Value ──────────────────────────

  const value: SpaContextType = {
    treatments,
    rooms,
    therapists,
    sessions,
    isLoading,
    error,
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
