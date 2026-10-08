/**
 * Screen #28 — Spa Booking Confirmation
 * 
 * Business Rules Enforced:
 * 1. Final confirmation before mutation.
 * 2. Atomic Re-Check: Both a specific Therapist AND a specific Treatment Room
 *    must be available. If either conflicts, mutation FAILS entirely.
 * 3. Stale availability protection: Re-checks in centralized SpaContext.
 * 4. Structured conflict handling: THERAPIST_UNAVAILABLE, ROOM_UNAVAILABLE, BOTH_UNAVAILABLE.
 * 5. Success transitions atomically to Screen 29 (My Spa Sessions).
 * 6. Prototype calendar sync and ~1h reminder simulation state.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useCustomer } from '../../context/CustomerContext';
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
  Heart,
  Leaf,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Bell,
  Shield,
  Zap,
} from 'lucide-react';
import type { LocalizedString, SessionChargeType, SpaConflictType } from '../../types/spa';

interface PendingBookingData {
  bookingReference: string;
  customerId: string;
  customerName: string;
  treatmentId: string;
  therapistId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime?: string;
  chargeType: SessionChargeType;
  customerSpecialRequest?: string;
}

export const SpaConfirmationPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    getSessionById,
    getTreatmentById,
    getTherapistById,
    getRoomById,
    bookSpaSession,
    simulateSlotConflict,
  } = useSpa();

  const { activeBooking, profile } = useCustomer();

  // Mode 1: Already confirmed session (e.g. ?session=SES-301)
  const sessionId = searchParams.get('session');
  const confirmedSession = sessionId ? getSessionById(sessionId) : undefined;

  // Mode 2: Pending booking before mutation (from Screen 26 or Screen 27)
  const locationState = location.state as PendingBookingData | undefined;

  const pendingTreatmentId = locationState?.treatmentId || searchParams.get('treatment') || '';
  const pendingDate = locationState?.date || searchParams.get('date') || '2026-09-26';
  const pendingStartTime = locationState?.startTime || searchParams.get('time') || '';
  const pendingTherapistId = locationState?.therapistId || searchParams.get('therapist') || '';
  const pendingRoomId = locationState?.roomId || searchParams.get('room') || '';
  const pendingRequest = locationState?.customerSpecialRequest || searchParams.get('request') || '';

  const pendingTreatment = pendingTreatmentId ? getTreatmentById(pendingTreatmentId) : undefined;
  const pendingTherapist = pendingTherapistId ? getTherapistById(pendingTherapistId) : undefined;
  const pendingRoom = pendingRoomId ? getRoomById(pendingRoomId) : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<{
    conflictType: SpaConflictType;
    message: string;
  } | null>(null);
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Helper to calculate end time from start time and treatment duration
  const calculateEndTime = (start: string, duration: number): string => {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + duration;
    const endH = Math.floor(total / 60);
    const endM = total % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const calculatedEndTime = pendingTreatment && pendingStartTime
    ? locationState?.endTime || calculateEndTime(pendingStartTime, pendingTreatment.durationMinutes)
    : '';

  // ── ATOMIC CONFIRMATION HANDLER ────────────────────────
  const handleConfirmReservation = () => {
    if (!pendingTreatment || !pendingTherapist || !pendingRoom || pendingTherapistId === 'any' || pendingRoomId === 'any') return;

    setIsSubmitting(true);
    const bookingRef = activeBooking?.bookingReference || locationState?.bookingReference;
    const custId = profile?.id || locationState?.customerId;
    const custName = profile?.fullName || locationState?.customerName;

    if (!bookingRef || !custId) {
      setIsSubmitting(false);
      setConflictError({
        conflictType: 'RESOURCE_UNAVAILABLE',
        message: t(
          'spa.activeBookingRequired',
          'An active retreat booking and signed-in customer profile are required to reserve spa sessions.'
        ),
      });
      return;
    }

    // Centralized atomic re-check and mutation
    setTimeout(() => {
      const result = bookSpaSession({
        bookingReference: bookingRef,
        customerId: custId,
        customerName: custName || '',
        treatmentId: pendingTreatment.id,
        therapistId: pendingTherapist.id,
        roomId: pendingRoom.id,
        date: pendingDate,
        startTime: pendingStartTime,
        chargeType: pendingTreatment.isIncludedInRetreat ? 'included' : 'extra',
        customerSpecialRequest: pendingRequest || undefined,
        bookingSource: 'customer_portal',
      });

      setIsSubmitting(false);

      if (result.success) {
        // Success: Atomic booking completed -> Navigate to confirmed session view with CTAs
        if (result.session?.id) {
          navigate(`/customer/spa/confirmation?session=${result.session.id}`);
        } else {
          navigate('/customer/spa/sessions');
        }
      } else {
        // Failure: Stale slot or resource conflict -> NO mutation performed!
        setConflictError({
          conflictType: result.conflictType || 'RESOURCE_UNAVAILABLE',
          message: result.message,
        });
      }
    }, 600);
  };

  // ── TEST E: Simulate Stale Slot Conflict ──────────────
  const handleSimulateConflict = () => {
    if (!pendingTherapist || !pendingRoom) return;
    simulateSlotConflict({
      date: pendingDate,
      startTime: pendingStartTime,
      therapistId: pendingTherapist.id,
      roomId: pendingRoom.id,
    });
    setSimulatedNotice(
      t(
        'spa.conflictInjectedNotice',
        'Slot conflict injected! Click "Confirm & Reserve Session" below to verify that atomic re-check prevents booking.'
      )
    );
  };

  // ── CASE 1: Displaying an already confirmed session ────
  if (confirmedSession) {
    const sessionTreatment = getTreatmentById(confirmedSession.treatmentId);
    const sessionTherapist = getTherapistById(confirmedSession.therapistId);
    const sessionRoom = getRoomById(confirmedSession.roomId);

    return (
      <div className="spa-confirmation-page" id="screen-28-spa-booking-confirmation">
        <div className="spa-confirmation-card">
          <div className="spa-confirmation-header">
            <div className="spa-confirmation-icon">
              <CheckCircle size={56} />
            </div>
            <h1>{t('spa.bookingConfirmed', 'Booking Confirmed')}</h1>
            <p className="spa-confirmation-subtitle">
              {t('spa.confirmationDesc', 'Your spa session has been successfully reserved. Both your therapist and treatment room are confirmed.')}
            </p>
          </div>

          <div className="spa-confirmation-details">
            {sessionTreatment && (
              <div className="spa-confirmation-treatment">
                <img src={sessionTreatment.imageUrl} alt={localize(sessionTreatment.name)} className="spa-confirmation-img" />
                <div className="spa-confirmation-treatment-info">
                  <h2>{localize(confirmedSession.treatmentName)}</h2>
                  {confirmedSession.chargeType === 'included' ? (
                    <span className="spa-card-included-tag">
                      <Leaf size={12} /> {t('spa.includedInPackage', 'Included in Package')}
                    </span>
                  ) : (
                    <span className="spa-confirmation-price">{formatPrice(confirmedSession.price)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="spa-confirmation-grid">
              <div className="spa-confirmation-item">
                <Calendar size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.date', 'Date')}</span>
                  <span className="spa-confirmation-value">
                    {new Date(confirmedSession.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <Clock size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.time', 'Time')}</span>
                  <span className="spa-confirmation-value">
                    {confirmedSession.startTime} — {confirmedSession.endTime} ({confirmedSession.durationMinutes} {t('spa.minutes', 'min')})
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <User size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.therapist', 'Therapist')}</span>
                  <span className="spa-confirmation-value">
                    {confirmedSession.therapistName}
                    {sessionTherapist && <span className="spa-confirmation-sub"> · {localize(sessionTherapist.title)}</span>}
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <MapPin size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.room', 'Room')}</span>
                  <span className="spa-confirmation-value">
                    {localize(confirmedSession.roomName)}
                    {sessionRoom && <span className="spa-confirmation-sub"> · {sessionRoom.type}</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Prototype Calendar & Reminder Simulation Banner */}
            <div className="spa-confirmation-notice">
              <Bell size={16} />
              <span>{t('spa.calendarReminderNotice', 'Calendar sync & ~1-hour reminder metadata scheduled (prototype simulation).')}</span>
            </div>

            <div className="spa-confirmation-id">
              <span>{t('spa.sessionId', 'Session ID')}: {confirmedSession.id}</span>
            </div>
          </div>

          <div className="spa-confirmation-actions">
            <button
              className="spa-confirm-btn"
              onClick={() => navigate('/customer/spa/sessions')}
              id="spa-view-sessions"
            >
              {t('spa.viewMySessions', 'View My Sessions')}
              <ArrowRight size={18} />
            </button>
            <button
              className="spa-secondary-btn"
              onClick={() => navigate('/customer/spa')}
              id="spa-book-another"
            >
              {t('spa.bookAnother', 'Book Another Treatment')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CASE 2: Review & Confirm Pending Booking (Pre-Mutation) ──
  if (pendingTreatment && pendingTherapist && pendingRoom) {
    return (
      <div className="spa-confirmation-page" id="screen-28-spa-booking-confirmation">
        <div className="spa-confirmation-card">
          {/* Header */}
          <div className="spa-confirmation-header">
            <div className="spa-confirmation-icon spa-confirmation-icon--pending">
              <Shield size={48} />
            </div>
            <h1>{t('spa.reviewTitle', 'Review & Confirm Spa Booking')}</h1>
            <p className="spa-confirmation-subtitle">
              {t(
                'spa.reviewSubtitle',
                'Please review your session details. Your therapist and treatment room are atomically reserved upon confirmation.'
              )}
            </p>
          </div>

          {/* Test Simulation Controls (For TEST E) */}
          <div className="spa-test-simulation-bar" style={{
            margin: '1rem 0',
            padding: '0.75rem 1rem',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px dashed rgba(234, 179, 8, 0.4)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', fontSize: '0.85rem' }}>
              <Zap size={16} />
              <span>{t('spa.simulateConflictNotice', 'Quality Assurance / Test Control:')}</span>
            </div>
            <button
              type="button"
              className="spa-secondary-btn"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              onClick={handleSimulateConflict}
              id="btn-simulate-stale-conflict"
            >
              {t('spa.simulateConflictBtn', 'Simulate Stale Slot Conflict (Test E)')}
            </button>
          </div>

          {simulatedNotice && (
            <div className="ops-alert-banner ops-alert-banner--warning" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={16} />
              <span style={{ fontSize: '0.85rem' }}>{simulatedNotice}</span>
            </div>
          )}

          {/* Conflict Error Alert (Re-check failure) */}
          {conflictError && (
            <div
              className="ops-alert-banner ops-alert-banner--error"
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '0.5rem',
                color: '#fca5a5',
              }}
              role="alert"
              aria-live="assertive"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ margin: '0 0 0.35rem', color: '#ef4444', fontSize: '0.95rem', fontWeight: 600 }}>
                    {t('spa.conflictTitle', 'Slot No Longer Available')} · [{conflictError.conflictType}]
                  </h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {conflictError.message}
                  </p>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                    {t(
                      'spa.atomicFailExplain',
                      'No reservation was created. Both a specific Therapist and Treatment Room must be completely free for this time window.'
                    )}
                  </p>
                  <button
                    className="spa-confirm-btn"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    onClick={() =>
                      navigate(
                        `/customer/spa/alternatives?treatment=${pendingTreatment.id}&date=${pendingDate}`
                      )
                    }
                    id="btn-goto-alternatives"
                  >
                    <RotateCcw size={14} style={{ marginRight: '6px' }} />
                    {t('spa.selectAlternativeBtn', 'Select Alternative Slot')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Session Details */}
          <div className="spa-confirmation-details">
            <div className="spa-confirmation-treatment">
              <img src={pendingTreatment.imageUrl} alt={localize(pendingTreatment.name)} className="spa-confirmation-img" />
              <div className="spa-confirmation-treatment-info">
                <h2>{localize(pendingTreatment.name)}</h2>
                {pendingTreatment.isIncludedInRetreat ? (
                  <span className="spa-card-included-tag">
                    <Leaf size={12} /> {t('spa.includedInPackage', 'Included in Package')}
                  </span>
                ) : (
                  <span className="spa-confirmation-price">{formatPrice(pendingTreatment.price)}</span>
                )}
              </div>
            </div>

            <div className="spa-confirmation-grid">
              <div className="spa-confirmation-item">
                <Calendar size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.date', 'Date')}</span>
                  <span className="spa-confirmation-value">
                    {new Date(pendingDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <Clock size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.time', 'Time')}</span>
                  <span className="spa-confirmation-value">
                    {pendingStartTime} — {calculatedEndTime} ({pendingTreatment.durationMinutes} {t('spa.minutes', 'min')})
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <User size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.therapist', 'Therapist')}</span>
                  <span className="spa-confirmation-value">
                    {pendingTherapist.name}
                    <span className="spa-confirmation-sub"> · {localize(pendingTherapist.title)}</span>
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <MapPin size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.room', 'Room')}</span>
                  <span className="spa-confirmation-value">
                    {localize(pendingRoom.name)}
                    <span className="spa-confirmation-sub"> · {pendingRoom.type}</span>
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <User size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.customer', 'Customer')}</span>
                  <span className="spa-confirmation-value">{profile?.fullName || locationState?.customerName || '—'}</span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <Shield size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.bookingReference', 'Retreat Booking Ref')}</span>
                  <span className="spa-confirmation-value">{activeBooking?.bookingReference || locationState?.bookingReference || '—'}</span>
                </div>
              </div>
            </div>

            {pendingRequest && (
              <div className="spa-confirmation-request">
                <Heart size={16} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.specialRequest', 'Special Request')}</span>
                  <span className="spa-confirmation-value">{pendingRequest}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="spa-confirmation-actions">
            {!(activeBooking?.bookingReference || locationState?.bookingReference) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '1rem',
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '13px',
                  width: '100%',
                }}
                role="alert"
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{t('spa.activeBookingRequired', 'An active retreat booking and signed-in customer profile are required to reserve spa sessions.')}</span>
              </div>
            )}

            <button
              className="spa-confirm-btn"
              onClick={handleConfirmReservation}
              disabled={
                isSubmitting ||
                !(activeBooking?.bookingReference || locationState?.bookingReference) ||
                !(profile?.id || locationState?.customerId)
              }
              id="btn-confirm-spa-booking"
            >
              {isSubmitting ? (
                <span>{t('spa.processing', 'Processing...')}</span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>{t('spa.confirmBooking', 'Confirm & Reserve Session')}</span>
                </>
              )}
            </button>
            <button
              className="spa-secondary-btn"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              id="btn-back-to-selection"
            >
              {t('spa.back', 'Back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CASE 3: Compact Empty State (Requirement 4) ────────
  return (
    <div className="spa-confirmation-page" id="screen-28-spa-booking-confirmation">
      <div className="spa-empty-card">
        <div className="spa-empty-icon-box">
          <Sparkles size={32} />
        </div>
        <h3>{t('spa.noSession', 'No Active Reservation Selected')}</h3>
        <p>
          {t('spa.noSessionDesc', 'Please select a treatment and time slot from the spa catalogue to review and confirm.')}
        </p>
        <div className="spa-empty-actions">
          <button className="spa-confirm-btn" onClick={() => navigate('/customer/spa')} id="spa-conf-browse">
            {t('spa.browseTreatments', 'Explore Treatments')}
          </button>
          <button className="spa-secondary-btn" onClick={() => navigate('/customer/dashboard')} id="spa-conf-dashboard">
            {t('spa.returnToDashboard', 'Dashboard')}
          </button>
        </div>
      </div>
    </div>
  );
};
