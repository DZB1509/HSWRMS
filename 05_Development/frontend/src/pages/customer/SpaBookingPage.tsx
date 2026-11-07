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
import { useCustomer } from '../../context/CustomerContext';
import { useSpaTreatments } from '../../features/m3-spa/hooks/useSpaFeature';
import { spaApi } from '../../features/m3-spa/api/spaApi';
import { getResortTodayString, getResortDateString } from '../../features/m3-spa/utils/spaDateUtils';
import {
  resolveSpaTreatmentLocalized,
  resolveSpaTreatmentDescriptionLocalized,
} from '../../i18n/dynamicContent';
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
  User,
  MapPin,
  Calendar,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';
import type { SchedulingCandidate } from '../../features/m3-spa/types/spaTypes';

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
  const { activeBooking } = useCustomer();

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
        name: resolveSpaTreatmentLocalized((bt as any).treatmentCode || bt.treatmentName || bt.treatmentId, bt.treatmentName),
        category: bt.category || 'massage',
        durationMinutes: bt.durationMinutes,
        price: bt.basePrice,
        isIncludedInRetreat: bt.isIncluded,
        description: resolveSpaTreatmentDescriptionLocalized((bt as any).treatmentCode || bt.treatmentName || bt.treatmentId, bt.description || ''),
        imageUrl: '/assets/spa/fallback.jpg',
      }));
    }
    return fallbackTreatments.map((ft) => ({
      ...ft,
      treatmentId: Number(ft.id.replace(/\D/g, '')) || 1,
    }));
  }, [backendTreatments, fallbackTreatments]);

  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>(treatmentIdFromQuery || '1');
  const [selectedDate, setSelectedDate] = useState<string>(() => getResortTodayString());
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('ANY');
  const [flexibleWithDate, setFlexibleWithDate] = useState<boolean>(true);
  const [specialRequest, setSpecialRequest] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Automated Optimal Recommendation states (Task 6)
  const [autoCandidate, setAutoCandidate] = useState<SchedulingCandidate | null>(null);
  const [isAutoLoading, setIsAutoLoading] = useState<boolean>(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [showManualSelection, setShowManualSelection] = useState<boolean>(false);
  const [rejectedAutoCandidateIds, setRejectedAutoCandidateIds] = useState<string[]>([]);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(false);

  useEffect(() => {
    if (treatmentIdFromQuery) {
      setSelectedTreatmentId(treatmentIdFromQuery);
    }
  }, [treatmentIdFromQuery]);

  const selectedTreatment = activeTreatments.find(
    (t) => t.id === selectedTreatmentId || String(t.treatmentId) === selectedTreatmentId
  ) || activeTreatments[0];

  // Available dates bounded by active retreat stay if present, otherwise next 7 days
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const todayStr = getResortTodayString();

    if (activeBooking?.startDate && activeBooking?.endDate) {
      const start = activeBooking.startDate > todayStr ? activeBooking.startDate : todayStr;
      const end = activeBooking.endDate;
      const cur = new Date(start + 'T00:00:00');
      const maxDate = new Date(end + 'T00:00:00');

      while (cur <= maxDate && dates.length < 14) {
        dates.push(getResortDateString(cur));
        cur.setDate(cur.getDate() + 1);
      }
    }

    if (dates.length === 0) {
      const base = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        dates.push(getResortDateString(d));
      }
    }
    return dates;
  }, [activeBooking?.startDate, activeBooking?.endDate]);

  useEffect(() => {
    if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Background Automated Candidate Recommendation Evaluation (Task 6)
  useEffect(() => {
    if (!selectedTreatment || rescheduleSessionId) {
      setAutoCandidate(null);
      return;
    }

    let isMounted = true;
    setIsAutoLoading(true);
    setAutoError(null);

    const numericTreatmentId = selectedTreatment.treatmentId || Number(selectedTreatment.id.replace(/\D/g, '')) || 1;
    const targetDate = availableDates[0] || selectedDate || getResortTodayString();

    spaApi
      .generateCandidates({
        treatmentId: numericTreatmentId,
        preferredDate: targetDate,
        flexibleWithDate: true,
        alternativeSearchDays: 5,
      })
      .then((res) => {
        if (!isMounted) return;
        const top =
          res.candidates && res.candidates.length > 0
            ? res.candidates[0]
            : res.alternativeCandidates && res.alternativeCandidates.length > 0
            ? res.alternativeCandidates[0]
            : null;
        setAutoCandidate(top);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Unable to evaluate automated recommendations.';
        setAutoError(msg);
        setAutoCandidate(null);
      })
      .finally(() => {
        if (isMounted) setIsAutoLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTreatment?.id, availableDates, rescheduleSessionId]);

  const handleConfirmAutoRecommendation = () => {
    if (!autoCandidate || !selectedTreatment) return;
    const numericTreatmentId = selectedTreatment.treatmentId || Number(selectedTreatment.id.replace(/\D/g, '')) || 1;
    const treatmentNameStr =
      typeof selectedTreatment.name === 'string'
        ? selectedTreatment.name
        : selectedTreatment.name?.en || selectedTreatment.name?.vi || 'Spa Treatment';

    const retreatBookingId = activeBooking?.id
      ? parseInt(String(activeBooking.id).replace(/\D/g, ''), 10)
      : undefined;

    navigate('/customer/spa/confirmation', {
      state: {
        selectedCandidate: autoCandidate,
        treatmentId: numericTreatmentId,
        treatmentName: treatmentNameStr,
        durationMinutes: selectedTreatment.durationMinutes,
        customerNote: specialRequest,
        rescheduleSessionId,
        retreatBookingId,
        bookingReference: activeBooking?.bookingReference,
      },
    });
  };

  const handleSwitchToManual = () => {
    if (!selectedTreatment) return;
    const numericTreatmentId = selectedTreatment.treatmentId || Number(selectedTreatment.id.replace(/\D/g, '')) || 1;
    const treatmentNameStr =
      typeof selectedTreatment.name === 'string'
        ? selectedTreatment.name
        : selectedTreatment.name?.en || selectedTreatment.name?.vi || 'Spa Treatment';

    const retreatBookingId = activeBooking?.id
      ? parseInt(String(activeBooking.id).replace(/\D/g, ''), 10)
      : undefined;
    const targetDate = availableDates[0] || selectedDate || getResortTodayString();

    navigate(
      `/customer/spa/alternatives?treatment=${numericTreatmentId}&date=${targetDate}`,
      {
        state: {
          treatmentId: numericTreatmentId,
          treatmentName: treatmentNameStr,
          durationMinutes: selectedTreatment.durationMinutes,
          preferredDate: targetDate,
          timeRangePreference: timeRange,
          customerNote: specialRequest,
          rescheduleSessionId,
          retreatBookingId,
          bookingReference: activeBooking?.bookingReference,
        },
      }
    );
  };

  const handleRefreshAutoRecommendation = () => {
    if (!selectedTreatment || !autoCandidate) return;
    const numericTreatmentId = selectedTreatment.treatmentId || Number(selectedTreatment.id.replace(/\D/g, '')) || 1;
    const targetDate = availableDates[0] || selectedDate || getResortTodayString();
    const nextRejected = [...rejectedAutoCandidateIds, autoCandidate.candidateId];
    setRejectedAutoCandidateIds(nextRejected);
    setIsAutoLoading(true);
    spaApi
      .generateCandidates({
        treatmentId: numericTreatmentId,
        preferredDate: targetDate,
        flexibleWithDate: true,
        alternativeSearchDays: 5,
        rejectedCandidateIds: nextRejected,
      })
      .then((res) => {
        const top =
          res.candidates && res.candidates.length > 0
            ? res.candidates[0]
            : res.alternativeCandidates && res.alternativeCandidates.length > 0
            ? res.alternativeCandidates[0]
            : null;
        setAutoCandidate(top);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unable to evaluate alternative recommendations.';
        setAutoError(msg);
      })
      .finally(() => {
        setIsAutoLoading(false);
      });
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

      const treatmentNameStr = typeof selectedTreatment.name === 'string'
        ? selectedTreatment.name
        : (selectedTreatment.name?.en || selectedTreatment.name?.vi || 'Spa Treatment');

      // Navigate to Screen 27 (Candidate Selection)
      navigate('/customer/spa/alternatives', {
        state: {
          result,
          treatmentId: numericTreatmentId,
          treatmentName: treatmentNameStr,
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
          backgroundColor: 'var(--surface-info)',
          border: '1px solid var(--border-info)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--text-info)'
        }}>
          <RotateCcw size={20} />
          <div>
            <strong>{t('spa.rescheduleNoticeTitle', 'Rescheduling Session')} #{rescheduleSessionId}</strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-info)', opacity: 0.85 }}>
              {t('spa.rescheduleNoticeDesc', 'Your existing session remains completely safe and valid while you browse candidates. It will only be updated upon final confirmation.')}
            </p>
          </div>
        </div>
      )}

      {searchError && (
        <div className="spa-error-alert" style={{
          backgroundColor: 'var(--surface-danger)',
          border: '1px solid var(--border-danger)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: 'var(--text-danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{searchError}</span>
        </div>
      )}

      {/* ── NON-STAY INFORMATIONAL BANNER (GRACEFUL EXPLANATION) ── */}
      {(autoError?.includes('No active retreat stay') || autoError?.includes('RESOURCE_UNAVAILABLE')) && (
        <div
          id="spa-no-active-stay-alert"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            color: '#92400e',
          }}
        >
          <AlertCircle size={24} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#92400e' }}>
              {t('spa.noActiveStayTitle', 'Cần có kỳ nghỉ đang lưu trú để đặt lịch Spa')}
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: '13px', lineHeight: 1.5, color: '#78350f' }}>
              {t(
                'spa.noActiveStayDesc',
                'Hệ thống ghi nhận quý khách chưa hoàn tất thủ tục nhận phòng (Checked-in Stay) tại HeavenStay. Để đảm bảo dịch vụ tốt nhất và tích hợp chi phí phòng, lịch hẹn Spa yêu cầu quý khách đang lưu trú tại resort.'
              )}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/customer/stays')}
                style={{
                  backgroundColor: '#d97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('spa.viewMyStays', 'Xem đặt phòng của tôi')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/customer/spa')}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#92400e',
                  border: '1px solid #d97706',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('spa.backToCatalogue', 'Quay lại danh mục Spa')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTOMATED OPTIMAL RECOMMENDATION CARD (TASK 6) ── */}
      {!rescheduleSessionId && (
        <div
          id="spa-automated-recommendation-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #0d9488',
            boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.15), 0 8px 10px -6px rgba(13, 148, 136, 0.1)',
            padding: '24px',
            marginBottom: '28px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top highlight bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #0d9488, #d97706, #0d9488)',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f0fdfa',
                  color: '#0f766e',
                  border: '1px solid #99f6e4',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Sparkles size={14} style={{ color: '#d97706' }} />
                {t('spa.autoRecommendationBadge', 'Đề xuất lịch tối ưu nhất (Automated Recommendation)')}
              </span>
              {autoCandidate?.recommendationScore !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {(() => {
                    const score = autoCandidate.recommendationScore ?? 0;
                    const cat = autoCandidate.qualityCategory || (
                      score >= 90 ? 'EXCELLENT' : score >= 80 ? 'GOOD' : score >= 70 ? 'FAIR' : 'BELOW_THRESHOLD'
                    );
                    const cfg = {
                      EXCELLENT: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', label: t('spa.catExcellent', 'Xuất sắc (90-100)') },
                      GOOD: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', label: t('spa.catGood', 'Tốt (80-89)') },
                      FAIR: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: t('spa.catFair', 'Khá (70-79)') },
                      BELOW_THRESHOLD: { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3', label: t('spa.catBelowThreshold', 'Dưới ngưỡng (<70)') },
                    }[cat] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', label: `${score}/100` };

                    return (
                      <span
                        style={{
                          backgroundColor: cfg.bg,
                          color: cfg.text,
                          border: `1px solid ${cfg.border}`,
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ⭐ {score}/100 · {cfg.label}
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0d9488',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 4px',
                    }}
                  >
                    <span>{showScoreBreakdown ? t('spa.hideBreakdown', 'Ẩn chi tiết') : t('spa.viewBreakdown', 'Xem giải thích điểm số')}</span>
                    {showScoreBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {t('spa.aiScheduledSubtitle', 'Tự động tính toán theo kỳ nghỉ & trị liệu viên phù hợp')}
            </span>
          </div>

          {/* Collapsible Score Breakdown */}
          {showScoreBreakdown && autoCandidate && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={15} style={{ color: '#0d9488' }} />
                <span>{t('spa.scoreFormulaTitle', 'Công thức tính điểm đề xuất (Chuẩn M3 [0 – 100])')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '8px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Điểm Nền tảng (Trị liệu & Phòng)</div>
                  <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '14px' }}>
                    {autoCandidate.baseScore ?? 40} / 40
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Khung giờ mong muốn</div>
                  <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '14px' }}>
                    {autoCandidate.timeMatchScore ?? 30} / 30
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Cân bằng lịch KTV</div>
                  <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '14px' }}>
                    {autoCandidate.workloadScore ?? 20} / 20
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Ưu tiên thời gian sớm</div>
                  <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '14px' }}>
                    {autoCandidate.earlinessScore ?? 5} / 10
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                {t('spa.scoreFormulaDisclaimer', '* Thuật toán phân bổ công bằng đảm bảo chuyên viên đạt tiêu chuẩn, có đủ thời gian chuẩn bị 15 phút và cân đối khối lượng điều trị trong ngày.')}
              </p>
            </div>
          )}

          {isAutoLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              <Sparkles size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#0d9488' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                {t('spa.evaluatingRecommendations', 'Hệ thống đang phân tích lịch trống tối ưu cho bạn...')}
              </p>
            </div>
          ) : autoCandidate ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} style={{ color: '#0d9488' }} />
                    <strong>{t('spa.timeSlot', 'Khung giờ đề xuất')}</strong>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {autoCandidate.date} · {autoCandidate.startTime} – {autoCandidate.endTime}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {autoCandidate.durationMinutes} {t('spa.minutes', 'phút')} · {autoCandidate.treatmentName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} style={{ color: '#0d9488' }} />
                    <strong>{t('spa.therapist', 'Chuyên viên trị liệu')}</strong>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                    {autoCandidate.therapistName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                    ✓ {t('spa.therapistCertified', 'Đạt chứng chỉ chuyên môn & Đang sẵn sàng')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} style={{ color: '#0d9488' }} />
                    <strong>{t('spa.suite', 'Phòng trị liệu')}</strong>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                    {autoCandidate.roomName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>
                    ✓ {t('spa.suiteCompliant', 'Không gian thư giãn đạt chuẩn')}
                  </div>
                </div>
              </div>

              {/* Reason description */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#0f766e',
                  backgroundColor: '#f0fdfa',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ccfbf1',
                  marginBottom: '20px',
                }}
              >
                <Sparkles size={16} style={{ flexShrink: 0, color: '#0d9488' }} />
                <span>
                  <strong>{t('spa.recommendationReasonTitle', 'Lý do đề xuất')}:</strong>{' '}
                  {autoCandidate.recommendationReason ||
                    t('spa.defaultReason', 'Khung giờ tối ưu trong kỳ nghỉ, chuyên viên tay nghề cao và phòng phù hợp tiêu chuẩn')}
                </span>
              </div>

              {/* Actions */}
              {(() => {
                const isAutoEligible =
                  autoCandidate.eligibleForAutoConfirm ?? ((autoCandidate.recommendationScore ?? 0) >= 70);

                return (
                  <div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        id="btn-confirm-auto-recommendation"
                        onClick={handleConfirmAutoRecommendation}
                        disabled={!isAutoEligible || isAutoLoading}
                        style={{
                          backgroundColor: isAutoEligible ? '#0d9488' : '#94a3b8',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontSize: '15px',
                          fontWeight: 700,
                          cursor: isAutoEligible && !isAutoLoading ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: isAutoEligible ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
                          opacity: isAutoEligible ? 1 : 0.7,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <CheckCircle size={18} />
                        <span>{t('spa.confirmRecommendedSlot', 'Xác nhận lịch đề xuất (1-Click)')}</span>
                      </button>

                      <button
                        type="button"
                        id="btn-refresh-auto-recommendation"
                        onClick={handleRefreshAutoRecommendation}
                        disabled={isAutoLoading}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#0d9488',
                          border: '1px solid #0d9488',
                          borderRadius: '8px',
                          padding: '12px 18px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: isAutoLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                        title={t('spa.refreshRecommendationTooltip', 'Tìm kiếm một khung giờ đề xuất phù hợp khác')}
                      >
                        <RefreshCw size={16} className={isAutoLoading ? 'animate-spin' : ''} />
                        <span>{t('spa.refreshRecommendation', 'Đổi gợi ý khác')}</span>
                      </button>

                      <button
                        type="button"
                        id="btn-switch-to-manual-booking"
                        onClick={handleSwitchToManual}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{t('spa.selectManually', 'Thay đổi lịch / Chọn thủ công')}</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {!isAutoEligible && (
                      <div
                        style={{
                          marginTop: '12px',
                          fontSize: '13px',
                          color: '#be123c',
                          backgroundColor: '#fff1f2',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #fecdd3',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>
                          {t(
                            'spa.belowThresholdWarning',
                            'Đề xuất này có điểm số dưới ngưỡng tự động (< 70). Quý khách vui lòng chọn lịch thủ công bên dưới hoặc làm mới đề xuất để tìm phương án tối ưu hơn.'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ padding: '12px 4px', color: '#64748b', fontSize: '13px' }}>
              <p style={{ margin: '0 0 12px', color: '#475569' }}>
                {t(
                  'spa.noAutoSlotAvailable',
                  'Chưa tìm thấy lịch trống phù hợp tự động trong ngày đã chọn. Quý khách có thể duyệt toàn bộ danh sách các khung giờ trống để chọn thủ công.'
                )}
              </p>
              <button
                type="button"
                id="btn-browse-all-slots-empty"
                onClick={handleSwitchToManual}
                style={{
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                }}
              >
                <span>{t('spa.browseAllSlots', 'Duyệt tất cả khung giờ trống (Manual Selection)')}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <button
              type="button"
              id="btn-toggle-advanced-criteria"
              onClick={() => setShowManualSelection(!showManualSelection)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {showManualSelection ? t('spa.hideAdvancedCriteria', 'Ẩn tiêu chí tùy chỉnh') : t('spa.showAdvancedCriteria', 'Tùy chỉnh tiêu chí nâng cao trên trang này')}
            </button>
          </div>
        </div>
      )}

      <div
        className="spa-booking-layout"
        id="spa-manual-form-container"
        style={{
          display: showManualSelection ? 'grid' : 'none',
        }}
      >
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
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>08:00 – 20:00</span>
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
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>08:00 – 12:00</span>
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
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>12:00 – 17:00</span>
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
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>17:00 – 20:00</span>
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

            <div style={{ backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm, 6px)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
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
