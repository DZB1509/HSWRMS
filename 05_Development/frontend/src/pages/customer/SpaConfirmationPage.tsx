/**
 * Screen #28 — Spa Booking Confirmation
 * 
 * Business Rules Enforced:
 * 1. Final confirmation before mutation.
 * 2. Atomic Re-Check: Both a specific Therapist AND a specific Treatment Room
 *    must be available. If either conflicts, mutation FAILS entirely.
 * 3. Stale availability protection: Re-checks through the server scheduling API.
 * 4. Structured conflict handling: THERAPIST_UNAVAILABLE, ROOM_UNAVAILABLE, BOTH_UNAVAILABLE.
 * 5. Success transitions atomically to Screen 29 (My Spa Sessions).
 * 6. Notification delivery is reported only when the server exposes that state.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useCustomer } from '../../context/CustomerContext';
import { spaApi } from '../../features/m3-spa/api/spaApi';
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
  RotateCcw,
  Bell,
  Shield,
} from 'lucide-react';
import type { LocalizedString, SessionChargeType, SpaConflictType } from '../../types/spa';
import type { SchedulingCandidate, BackendSpaSession } from '../../features/m3-spa/types/spaTypes';

interface PendingBookingData {
  bookingReference?: string;
  customerId?: string;
  customerName?: string;
  treatmentId?: string;
  therapistId?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  chargeType?: SessionChargeType;
  customerSpecialRequest?: string;
  selectedCandidate?: SchedulingCandidate;
  customerNote?: string;
  rescheduleSessionId?: number;
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
  } = useSpa();

  const { activeBooking, profile } = useCustomer();

  // Mode 1: Already confirmed session (e.g. ?session=SES-301)
  const sessionId = searchParams.get('session');
  const confirmedSession = sessionId ? getSessionById(sessionId) : undefined;

  // Mode 2: Pending booking before mutation (from Screen 26 or Screen 27)
  const locationState = location.state as PendingBookingData | undefined;

  const pendingTreatmentId = locationState?.treatmentId || searchParams.get('treatment') || '';
  const pendingDate = locationState?.date || searchParams.get('date') || new Date().toISOString().split('T')[0];
  const pendingStartTime = locationState?.startTime || searchParams.get('time') || '';
  const pendingTherapistId = locationState?.therapistId || searchParams.get('therapist') || '';
  const pendingRoomId = locationState?.roomId || searchParams.get('room') || '';
  const pendingRequest = locationState?.customerSpecialRequest || searchParams.get('request') || '';

  const pendingTreatment = pendingTreatmentId ? getTreatmentById(pendingTreatmentId) : undefined;
  const pendingTherapist = pendingTherapistId ? getTherapistById(pendingTherapistId) : undefined;
  const pendingRoom = pendingRoomId ? getRoomById(pendingRoomId) : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiConfirmedSession, setApiConfirmedSession] = useState<BackendSpaSession | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(Boolean(sessionId));
  if (loadingSession) {
    return <div className="spa-confirmation-page"><div className="spa-loading">Loading session...</div></div>;
  }

  useEffect(() => {
    if (sessionId && !isNaN(Number(sessionId))) {
      setLoadingSession(true);
      spaApi.getSession(Number(sessionId))
        .then((s) => setApiConfirmedSession(s))
        .catch((err) => console.warn('Could not load session from API:', err))
        .finally(() => setLoadingSession(false));
    }
  }, [sessionId]);
  const [conflictError, setConflictError] = useState<{
    conflictType: SpaConflictType;
    message: string;
  } | null>(null);

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | { en: string; vi: string } | string | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    const obj = ls as Record<string, string>;
    return obj[currentLang] || obj.en || Object.values(obj)[0] || '';
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
  const handleConfirmReservation = async () => {
    setIsSubmitting(true);
    setConflictError(null);

    const candidate = locationState?.selectedCandidate;
    if (!candidate) {
      setIsSubmitting(false);
      setConflictError({
        conflictType: 'RESOURCE_UNAVAILABLE',
        message: 'Select a current server-generated scheduling candidate before confirming.',
      });
      return;
    }

    try {
      const res = await spaApi.confirmReservation({
        treatmentId: candidate.treatmentId,
        therapistId: candidate.therapistId,
        roomId: candidate.roomId,
        scheduledStartAt: candidate.scheduledStartAt,
        scheduledEndAt: candidate.scheduledEndAt,
        customerNote: locationState?.customerNote,
        bookingSource: 'CUSTOMER',
        rescheduleSessionId: locationState?.rescheduleSessionId,
      });

      setIsSubmitting(false);
      navigate(`/customer/spa/confirmation?session=${res.spaSessionId}`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Scheduling conflict: Therapist or Treatment Room is no longer available.';
      setConflictError({
        conflictType: 'RESOURCE_UNAVAILABLE',
        message: msg,
      });
      return;
    }
  };

  // ── CASE 1: Displaying an already confirmed session ────
  const displaySession = apiConfirmedSession || confirmedSession;
  if (displaySession) {
    const sessionTreatment = 'treatmentName' in displaySession && typeof displaySession.treatmentName === 'string'
      ? { name: { en: displaySession.treatmentName, vi: displaySession.treatmentName }, imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80', durationMinutes: displaySession.durationMinutes }
      : getTreatmentById((displaySession as any).treatmentId);
    const therapistName = 'therapistName' in displaySession ? (displaySession as any).therapistName : getTherapistById((displaySession as any).therapistId)?.name || 'Assigned Therapist';
    const roomName = 'roomName' in displaySession ? (displaySession as any).roomName : getRoomById((displaySession as any).roomId)?.name || 'Treatment Room';
    const displayDate = 'date' in displaySession && displaySession.date ? displaySession.date : ('scheduledStartAt' in displaySession && displaySession.scheduledStartAt ? displaySession.scheduledStartAt.split('T')[0] : '');
    const startTimeStr = 'startTime' in displaySession && displaySession.startTime ? displaySession.startTime : ('scheduledStartAt' in displaySession && displaySession.scheduledStartAt ? displaySession.scheduledStartAt.substring(11, 16) : '');
    const endTimeStr = 'endTime' in displaySession && displaySession.endTime ? displaySession.endTime : ('scheduledEndAt' in displaySession && displaySession.scheduledEndAt ? displaySession.scheduledEndAt.substring(11, 16) : '');
    const isIncludedSession = 'isIncluded' in displaySession ? Boolean(displaySession.isIncluded) : ('chargeType' in displaySession && (displaySession as any).chargeType === 'included');
    const priceVal = 'basePrice' in displaySession ? (displaySession as any).basePrice : ('price' in displaySession ? (displaySession as any).price : 0);
    const sessionStatusBadge = 'sessionStatus' in displaySession ? (displaySession as any).sessionStatus : (displaySession as any).status;
    const confirmStatusBadge = 'confirmationStatus' in displaySession ? (displaySession as any).confirmationStatus : 'CONFIRMED';

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
                  <h2>{typeof sessionTreatment?.name === 'object' ? localize(sessionTreatment.name) : sessionTreatment?.name}</h2>
                  {isIncludedSession ? (
                    <span className="spa-card-included-tag">
                      <Leaf size={12} /> {t('spa.includedInPackage', 'Included in Package')}
                    </span>
                  ) : (
                    <span className="spa-confirmation-price">{formatPrice(priceVal)}</span>
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
                    {new Date(displayDate + 'T00:00:00').toLocaleDateString('en-US', {
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
                    {startTimeStr} — {endTimeStr} ({displaySession.durationMinutes} {t('spa.minutes', 'min')})
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <User size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.therapist', 'Therapist')}</span>
                  <span className="spa-confirmation-value">
                    {therapistName}
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <MapPin size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.room', 'Room')}</span>
                  <span className="spa-confirmation-value">
                    {typeof roomName === 'string' ? roomName : localize(roomName)}
                  </span>
                </div>
              </div>
            </div>

            <div className="spa-confirmation-notice">
              <Bell size={16} />
              <span>{t('spa.calendarReminderNotice', 'Booking confirmed. Notification delivery status is managed by the scheduling service.')}</span>
            </div>

            <div className="spa-confirmation-id" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('spa.sessionId', 'Session ID')}: {'spaSessionId' in displaySession ? (displaySession as any).spaSessionId : ('id' in displaySession ? (displaySession as any).id : sessionId)}</span>
              <span className="spa-status-badge spa-status--confirmed" style={{ fontSize: '0.8rem' }}>{sessionStatusBadge} · {confirmStatusBadge}</span>
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
  const candidate = locationState?.selectedCandidate;
  if (candidate || (pendingTreatment && pendingTherapist && pendingRoom)) {
    const reviewTreatmentName = candidate ? candidate.treatmentName : localize(pendingTreatment?.name);
    const reviewTherapistName = candidate ? candidate.therapistName : pendingTherapist?.name;
    const reviewRoomName = candidate ? candidate.roomName : (pendingRoom ? localize(pendingRoom.name) : '');
    const reviewDate = candidate ? candidate.date : pendingDate;
    const reviewStartTime = candidate ? candidate.startTime : pendingStartTime;
    const reviewEndTime = candidate ? candidate.endTime : calculatedEndTime;
    const reviewDuration = candidate ? candidate.durationMinutes : (pendingTreatment ? pendingTreatment.durationMinutes : 60);
    const reviewPrice = candidate && 'basePrice' in candidate ? (candidate as any).basePrice : (pendingTreatment ? pendingTreatment.price : 0);
    const reviewIsIncluded = candidate && 'isIncluded' in candidate ? Boolean((candidate as any).isIncluded) : Boolean(pendingTreatment?.isIncludedInRetreat);
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
                      navigate(`/customer/spa/alternatives?treatment=${candidate?.treatmentId || pendingTreatment?.id || ''}&date=${reviewDate}`)
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
              <img src={pendingTreatment?.imageUrl || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'} alt={reviewTreatmentName} className="spa-confirmation-img" />
              <div className="spa-confirmation-treatment-info">
                <h2>{reviewTreatmentName}</h2>
                {reviewIsIncluded ? (
                  <span className="spa-card-included-tag">
                    <Leaf size={12} /> {t('spa.includedInPackage', 'Included in Package')}
                  </span>
                ) : (
                  <span className="spa-confirmation-price">{formatPrice(reviewPrice)}</span>
                )}
              </div>
            </div>

            <div className="spa-confirmation-grid">
              <div className="spa-confirmation-item">
                <Calendar size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.date', 'Date')}</span>
                  <span className="spa-confirmation-value">
                    {new Date(reviewDate + 'T00:00:00').toLocaleDateString('en-US', {
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
                    {reviewStartTime} — {reviewEndTime} ({reviewDuration} {t('spa.minutes', 'min')})
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <User size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.therapist', 'Therapist')}</span>
                  <span className="spa-confirmation-value">
                    {reviewTherapistName}
                    
                  </span>
                </div>
              </div>

              <div className="spa-confirmation-item">
                <MapPin size={18} />
                <div>
                  <span className="spa-confirmation-label">{t('spa.room', 'Room')}</span>
                  <span className="spa-confirmation-value">
                    {reviewRoomName}
                    
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
                !locationState?.selectedCandidate
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
