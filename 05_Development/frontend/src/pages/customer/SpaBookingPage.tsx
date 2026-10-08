/**
 * Screen #26 — Spa Session Booking
 * Customer inputs: Treatment, Date, Preferred Time Range, Flexibility, and Note.
 *
 * AUTHORITATIVE M3 SCHEDULING MODEL:
 * - System-Driven candidate generation: Customer MUST NOT pick Therapist or Treatment Room.
 * - Submitting calls POST /api/v1/spa/candidates.
 * - Pure READ-ONLY: no Therapist, Room, or SpaSession is reserved at this stage.
 * - Reusable when Customer starts a reschedule flow from Screen 29 (?reschedule={id}).
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useSpaTreatments } from '../../features/m3-spa/hooks/useSpaFeature';
import { spaApi } from '../../features/m3-spa/api/spaApi';
import {
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  Info,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';

type TimeRangeOption = 'ANY' | 'MORNING' | 'AFTERNOON' | 'EVENING';

export const SpaBookingPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const treatmentIdFromQuery = searchParams.get('treatment');
  const rescheduleParam = searchParams.get('reschedule');
  const rescheduleSessionId = rescheduleParam ? Number(rescheduleParam) : null;

  const { treatments: fallbackTreatments } = useSpa();
  const { treatments: backendTreatments } = useSpaTreatments();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const activeTreatments = useMemo(() => {
    if (backendTreatments && backendTreatments.length > 0) {
      return backendTreatments.map((bt) => ({
        id: String(bt.treatmentId),
        treatmentId: bt.treatmentId,
        name: { en: bt.treatmentName, vi: bt.treatmentName, 'zh-CN': bt.treatmentName, ja: bt.treatmentName, fr: bt.treatmentName },
        category: bt.category || 'massage',
        durationMinutes: bt.durationMinutes,
        price: bt.basePrice,
        isIncludedInRetreat: bt.isIncluded,
        description: { en: bt.description || '', vi: bt.description || '', 'zh-CN': bt.description || '', ja: bt.description || '', fr: bt.description || '' },
        imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      }));
    }
    return fallbackTreatments.map((ft) => ({
      ...ft,
      treatmentId: Number(ft.id.replace(/\D/g, '')) || 1,
    }));
  }, [backendTreatments, fallbackTreatments]);

  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(treatmentIdFromQuery || '1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-26');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('ANY');
  const [flexibleWithDate, setFlexibleWithDate] = useState<boolean>(true);
  const [specialRequest, setSpecialRequest] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (treatmentIdFromQuery) {
      setSelectedTreatmentId(treatmentIdFromQuery);
    }
  }, [treatmentIdFromQuery]);

  const selectedTreatment = activeTreatments.find(
    (t) => t.id === selectedTreatmentId || String(t.treatmentId) === selectedTreatmentId
  ) || activeTreatments[0];

  // Available dates (next 7 days)
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const base = new Date('2026-09-25');
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  /**
   * System-Driven Candidate Search:
   * Calls POST /api/v1/spa/candidates.
   * Pure READ-ONLY: generates indivisible candidate bundles (Time + Qualified Therapist + Compatible Room).
   */
  const handleFindCandidates = async () => {
    if (!selectedTreatment) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const numericTreatmentId = selectedTreatment.treatmentId || Number(selectedTreatment.id.replace(/\D/g, '')) || 1;
      const result = await spaApi.generateCandidates({
        treatmentId: numericTreatmentId,
        preferredDate: selectedDate,
        timeRangePreference: timeRange,
        flexibleWithDate,
      });

      // Navigate to Screen 27 (Candidate Selection)
      navigate('/customer/spa/alternatives', {
        state: {
          result,
          treatmentId: numericTreatmentId,
          treatmentName: selectedTreatment.name.en,
          durationMinutes: selectedTreatment.durationMinutes,
          preferredDate: selectedDate,
          timeRangePreference: timeRange,
          flexibleWithDate,
          customerNote: specialRequest,
          rescheduleSessionId,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search available slots.';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="spa-booking-page" id="screen-26-spa-booking">
      {/* Header */}
      <div className="spa-booking-header">
        <button
          className="spa-back-btn"
          onClick={() => navigate(rescheduleSessionId ? '/customer/spa/sessions' : '/customer/spa')}
          id="btn-back-to-treatments"
        >
          <ChevronLeft size={18} />
          <span>{rescheduleSessionId ? t('spa.backToSessions', 'Back to My Sessions') : t('spa.backToCatalogue', 'Back to Catalogue')}</span>
        </button>
        <h1>{rescheduleSessionId ? t('spa.rescheduleTitle', 'Reschedule Spa Session') : t('spa.bookTitle', 'Book Spa Session')}</h1>
        <p className="spa-booking-subtitle">
          {t('spa.systemDrivenSubtitle', 'Select your treatment and preferred time window. Our intelligent scheduling engine will match qualified therapists and compatible suites.')}
        </p>
      </div>

      {/* Reschedule Active Notice */}
      {rescheduleSessionId && (
        <div className="spa-reschedule-notice" style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#1e40af'
        }}>
          <RotateCcw size={20} />
          <div>
            <strong>{t('spa.rescheduleNoticeTitle', 'Rescheduling Session')} #{rescheduleSessionId}</strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#3b82f6' }}>
              {t('spa.rescheduleNoticeDesc', 'Your existing session remains completely safe and valid while you browse candidates. It will only be updated upon final confirmation.')}
            </p>
          </div>
        </div>
      )}

      {searchError && (
        <div className="spa-error-alert" style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{searchError}</span>
        </div>
      )}

      <div className="spa-booking-layout">
        {/* Left Column: Form Steps */}
        <div className="spa-booking-form">
          {/* Step 1: Treatment */}
          <div className="spa-booking-step" id="spa-step-1">
            <div className="spa-step-header">
              <span className="spa-step-number spa-step-number--done">
                <Check size={14} />
              </span>
              <div className="spa-step-header-text">
                <h2>{t('spa.selectedTreatment', '1. Treatment')}</h2>
                <span className="spa-step-completed-badge">
                  {selectedTreatment ? localize(selectedTreatment.name) : ''}
                </span>
              </div>
            </div>

            <div className="spa-treatment-select-grid">
              {activeTreatments.map((tr) => (
                <button
                  key={tr.id}
                  className={`spa-treatment-option ${selectedTreatment?.id === tr.id ? 'spa-treatment-option--active' : ''}`}
                  onClick={() => setSelectedTreatmentId(tr.id)}
                  id={`spa-select-treatment-${tr.id}`}
                  type="button"
                >
                  <div className="spa-option-info">
                    <span className="spa-option-name">{localize(tr.name)}</span>
                    <span className="spa-option-meta">
                      <Clock size={12} /> {tr.durationMinutes} {t('spa.minutes', 'min')}
                      {tr.isIncludedInRetreat ? (
                        <span className="spa-option-included">{t('spa.included', 'Included')}</span>
                      ) : (
                        <span className="spa-option-price">{formatPrice(tr.price)}</span>
                      )}
                    </span>
                  </div>
                  {selectedTreatment?.id === tr.id && <Check size={18} className="spa-option-check" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Preferred Date */}
          <div className="spa-booking-step" id="spa-step-2">
            <div className="spa-step-header">
              <span className="spa-step-number spa-step-number--done">
                <Check size={14} />
              </span>
              <div className="spa-step-header-text">
                <h2>{t('spa.selectDate', '2. Preferred Date')}</h2>
                <span className="spa-step-completed-badge">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="spa-date-picker">
              {availableDates.map((date) => {
                const d = new Date(date + 'T00:00:00');
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = d.getDate();
                const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                return (
                  <button
                    key={date}
                    className={`spa-date-btn ${selectedDate === date ? 'spa-date-btn--active' : ''}`}
                    onClick={() => setSelectedDate(date)}
                    id={`spa-date-${date}`}
                    type="button"
                  >
                    <span className="spa-date-day">{dayName}</span>
                    <span className="spa-date-num">{dayNum}</span>
                    <span className="spa-date-month">{monthName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Preferred Time Range (SYSTEM-DRIVEN) */}
          <div className="spa-booking-step" id="spa-step-3">
            <div className="spa-step-header">
              <span className="spa-step-number spa-step-number--done">
                <Check size={14} />
              </span>
              <div className="spa-step-header-text">
                <h2>{t('spa.timeWindow', '3. Preferred Time Window')}</h2>
                <span className="spa-step-subtext">
                  {t('spa.systemSchedulingNotice', 'The scheduling engine will bundle qualified therapists and compatible suites.')}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <button
                type="button"
                className={`spa-slot-btn ${timeRange === 'ANY' ? 'spa-slot-btn--active' : ''}`}
                onClick={() => setTimeRange('ANY')}
                id="time-range-any"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} />
                  <strong>{t('spa.rangeAny', 'Any Time')}</strong>
                </div>
                <span style={{ fontSize: '11px', color: '#666' }}>08:00 – 20:00</span>
              </button>

              <button
                type="button"
                className={`spa-slot-btn ${timeRange === 'MORNING' ? 'spa-slot-btn--active' : ''}`}
                onClick={() => setTimeRange('MORNING')}
                id="time-range-morning"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sun size={16} />
                  <strong>{t('spa.rangeMorning', 'Morning')}</strong>
                </div>
                <span style={{ fontSize: '11px', color: '#666' }}>08:00 – 12:00</span>
              </button>

              <button
                type="button"
                className={`spa-slot-btn ${timeRange === 'AFTERNOON' ? 'spa-slot-btn--active' : ''}`}
                onClick={() => setTimeRange('AFTERNOON')}
                id="time-range-afternoon"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sunset size={16} />
                  <strong>{t('spa.rangeAfternoon', 'Afternoon')}</strong>
                </div>
                <span style={{ fontSize: '11px', color: '#666' }}>12:00 – 17:00</span>
              </button>

              <button
                type="button"
                className={`spa-slot-btn ${timeRange === 'EVENING' ? 'spa-slot-btn--active' : ''}`}
                onClick={() => setTimeRange('EVENING')}
                id="time-range-evening"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Moon size={16} />
                  <strong>{t('spa.rangeEvening', 'Evening')}</strong>
                </div>
                <span style={{ fontSize: '11px', color: '#666' }}>17:00 – 20:00</span>
              </button>
            </div>
          </div>

          {/* Step 4: Flexibility & Notes */}
          <div className="spa-booking-step" id="spa-step-4">
            <div className="spa-step-header">
              <span className="spa-step-number spa-step-number--done">
                <Check size={14} />
              </span>
              <div className="spa-step-header-text">
                <h2>{t('spa.flexibilityAndNotes', '4. Flexibility & Notes')}</h2>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={flexibleWithDate}
                  onChange={(e) => setFlexibleWithDate(e.target.checked)}
                  id="chk-flexible-date"
                />
                <span>{t('spa.flexibleDatesDesc', 'Show alternative days if preferred time has no openings')}</span>
              </label>
            </div>

            <div className="spa-request-container">
              <label htmlFor="spa-special-request" className="spa-request-label">
                {t('spa.specialRequest', 'Special Health / Comfort Notes (Optional)')}
              </label>
              <textarea
                className="spa-special-request"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder={t('spa.specialRequestPlaceholder', 'Focus areas, pressure preferences, or health observations...')}
                rows={3}
                id="spa-special-request"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Summary & CTA */}
        <div className="spa-booking-summary">
          <div className="spa-summary-card">
            <h3>{t('spa.bookingSummary', 'Scheduling Criteria')}</h3>

            <div className="spa-summary-treatment">
              <span className="spa-summary-label">{t('spa.treatment', 'Treatment')}</span>
              <span className="spa-summary-value">{selectedTreatment ? localize(selectedTreatment.name) : '—'}</span>
              <span className="spa-summary-sub">
                {selectedTreatment?.durationMinutes} {t('spa.minutes', 'min')} · {selectedTreatment?.category}
              </span>
            </div>

            <div className="spa-summary-row">
              <span className="spa-summary-label">{t('spa.date', 'Preferred Date')}</span>
              <span className="spa-summary-value">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="spa-summary-row">
              <span className="spa-summary-label">{t('spa.window', 'Window')}</span>
              <span className="spa-summary-value">{timeRange}</span>
            </div>

            <div className="spa-summary-row">
              <span className="spa-summary-label">{t('spa.pricingType', 'Charge Type')}</span>
              <span className={`spa-summary-charge ${selectedTreatment?.isIncludedInRetreat ? 'spa-summary-charge--included' : 'spa-summary-charge--extra'}`}>
                {selectedTreatment?.isIncludedInRetreat
                  ? t('spa.includedInPackage', 'Package Inclusive')
                  : formatPrice(selectedTreatment?.price || 0)}
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
              <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {t('spa.candidateBundleNotice', 'System matches qualified practitioners and compatible treatment rooms into indivisible candidates.')}
            </div>

            <button
              className="spa-submit-booking-btn"
              disabled={!selectedTreatment || isSearching}
              onClick={handleFindCandidates}
              id="btn-find-candidates"
              style={{ marginTop: '16px' }}
            >
              {isSearching ? (
                <span>{t('spa.generatingCandidates', 'Generating Candidates...')}</span>
              ) : (
                <>
                  <span>{t('spa.findCandidates', 'Find Available Candidates')}</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
