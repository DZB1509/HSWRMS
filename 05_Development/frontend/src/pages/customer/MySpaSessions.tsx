/**
 * Screen #29 — My Spa Sessions
 * Displays upcoming and historical spa/therapy sessions for the Customer.
 *
 * AUTHORITATIVE M3 STATUS MODEL:
 * 1. Two separate status concepts:
 *    - session_status: SCHEDULED, RESCHEDULING, CANCELLED, COMPLETED, NO_SHOW
 *    - confirmation_status: PENDING, CONFIRMED, DECLINED, EXPIRED
 * 2. Separate badges displayed for session_status and confirmation_status.
 * 3. Customer Attendance Confirmation action (PENDING -> CONFIRMED).
 * 4. Customer Reschedule action (entry point to Screen 26 -> Screen 27 -> Screen 28).
 * 5. Real API-backed session listing via spaApi.getMySpaSessions().
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomerSpaSessions } from '../../features/m3-spa/hooks/useSpaFeature';
import { useSpa } from '../../context/SpaContext';
import type {
  BackendSpaSession,
  BackendSpaSessionStatus,
  BackendSpaConfirmationStatus,
} from '../../features/m3-spa/types/spaTypes';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Sparkles,
  CheckCircle,
  RotateCcw,
  Ban,
  LayoutDashboard,
  Check,
  Leaf,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';

type TabFilter = 'upcoming' | 'completed' | 'all';

export const MySpaSessions: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const navigate = useNavigate();

  const {
    sessions: backendSessions,
    confirmAttendance,
    cancelSession: cancelBackendSession,
  } = useCustomerSpaSessions();

  const { sessions: fallbackSessions } = useSpa();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
  const [actionSessionId, setActionSessionId] = useState<number | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Normalize sessions
  const normalizedSessions: BackendSpaSession[] = useMemo(() => {
    if (backendSessions && backendSessions.length > 0) {
      return backendSessions;
    }
    // Fallback adapter for mock sessions
    return fallbackSessions.map((fs, idx) => ({
      spaSessionId: Number(fs.id.replace(/\D/g, '')) || 300 + idx,
      retreatBookingId: 101,
      bookingReference: fs.bookingReference,
      customerName: fs.customerName,
      treatmentId: Number(fs.treatmentId.replace(/\D/g, '')) || 1,
      treatmentName: localize(fs.treatmentName),
      durationMinutes: fs.durationMinutes,
      basePrice: fs.price,
      isIncluded: fs.chargeType === 'included',
      therapistId: Number(fs.therapistId.replace(/\D/g, '')) || 1,
      therapistName: fs.therapistName,
      roomId: Number(fs.roomId.replace(/\D/g, '')) || 1,
      roomName: localize(fs.roomName),
      scheduledStartAt: `${fs.date}T${fs.startTime}:00`,
      scheduledEndAt: `${fs.date}T${fs.endTime}:00`,
      date: fs.date,
      startTime: fs.startTime,
      endTime: fs.endTime,
      bookingSource: 'CUSTOMER',
      sessionStatus: (fs.status.toUpperCase() === 'IN_PROGRESS' || fs.status.toUpperCase() === 'BOOKED'
        ? 'SCHEDULED'
        : fs.status.toUpperCase()) as BackendSpaSessionStatus,
      confirmationStatus: (fs.status === 'confirmed' ? 'CONFIRMED' : 'PENDING') as BackendSpaConfirmationStatus,
      customerNote: fs.customerSpecialRequest,
    }));
  }, [backendSessions, fallbackSessions, currentLang]);

  // Filter sessions by active tab
  const filteredSessions = useMemo(() => {
    return normalizedSessions
      .filter((s) => {
        if (activeTab === 'upcoming') {
          return s.sessionStatus === 'SCHEDULED' || s.sessionStatus === 'RESCHEDULING';
        }
        if (activeTab === 'completed') {
          return s.sessionStatus === 'COMPLETED' || s.sessionStatus === 'NO_SHOW' || s.sessionStatus === 'CANCELLED';
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [normalizedSessions, activeTab]);

  const handleConfirmAttendance = async (sessionId: number) => {
    setActionSessionId(sessionId);
    setActionSuccessMsg(null);
    try {
      await confirmAttendance(sessionId);
      setActionSuccessMsg('Attendance confirmed successfully! Your therapist has been notified.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error('Failed to confirm attendance', err);
    } finally {
      setActionSessionId(null);
    }
  };

  const handleCancelSession = async (sessionId: number) => {
    setActionSessionId(sessionId);
    try {
      await cancelBackendSession(sessionId);
      setActionSuccessMsg('Session cancelled.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error('Failed to cancel session', err);
    } finally {
      setActionSessionId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="spa-sessions-page" id="screen-29-my-spa-sessions">
      {/* Top Header */}
      <div className="spa-sessions-header">
        <div>
          <h1>
            <Sparkles size={24} />
            {t('spa.mySessions', 'My Spa Sessions')}
          </h1>
          <p className="spa-sessions-subtitle">
            {t('spa.mySessionsSubtitle', 'Manage your holistic treatments, view therapist appointments, and calendar reminders.')}
          </p>
        </div>
        <div className="spa-header-actions">
          <button
            className="spa-secondary-btn"
            onClick={() => navigate('/customer/dashboard')}
            id="spa-return-dashboard"
          >
            <LayoutDashboard size={16} />
            <span>{t('spa.returnToDashboard', 'Dashboard')}</span>
          </button>
          <button
            className="spa-confirm-btn"
            onClick={() => navigate('/customer/spa')}
            id="spa-book-new"
          >
            <Sparkles size={16} />
            <span>{t('spa.bookNewTreatment', 'Book New Treatment')}</span>
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#15803d',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="spa-sessions-tabs">
        <button
          className={`spa-tab ${activeTab === 'upcoming' ? 'spa-tab--active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
          id="tab-upcoming-sessions"
        >
          {t('spa.tabUpcoming', 'Upcoming')}
        </button>
        <button
          className={`spa-tab ${activeTab === 'completed' ? 'spa-tab--active' : ''}`}
          onClick={() => setActiveTab('completed')}
          id="tab-history-sessions"
        >
          {t('spa.tabCompleted', 'History')}
        </button>
        <button
          className={`spa-tab ${activeTab === 'all' ? 'spa-tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
          id="tab-all-sessions"
        >
          {t('spa.tabAll', 'All Sessions')} ({normalizedSessions.length})
        </button>
      </div>

      {/* Sessions Grid */}
      <div className="spa-sessions-content">
        {filteredSessions.length === 0 ? (
          <div className="spa-empty-sessions">
            <Calendar size={48} />
            <h3>{t('spa.noSessionsFound', 'No Spa Sessions Found')}</h3>
            <p>{t('spa.noSessionsDesc', 'You have no treatments in this view. Browse our catalogue to book healing sessions.')}</p>
            <button
              className="hsw-btn hsw-btn-primary"
              onClick={() => navigate('/customer/spa')}
              style={{ marginTop: '16px' }}
            >
              {t('spa.exploreTreatments', 'Explore Treatments')}
            </button>
          </div>
        ) : (
          <div className="spa-sessions-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredSessions.map((session) => {
              const isPendingAttendance = session.confirmationStatus === 'PENDING';
              const isScheduled = session.sessionStatus === 'SCHEDULED' || session.sessionStatus === 'RESCHEDULING';

              return (
                <div
                  key={session.spaSessionId}
                  className="spa-session-card"
                  id={`spa-session-${session.spaSessionId}`}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 600 }}>{session.treatmentName}</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Session Status Badge */}
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor:
                              session.sessionStatus === 'SCHEDULED'
                                ? '#ecfeff'
                                : session.sessionStatus === 'RESCHEDULING'
                                ? '#fffbeb'
                                : session.sessionStatus === 'COMPLETED'
                                ? '#f0fdf4'
                                : session.sessionStatus === 'NO_SHOW'
                                ? '#faf5ff'
                                : '#fef2f2',
                            color:
                              session.sessionStatus === 'SCHEDULED'
                                ? '#0e7490'
                                : session.sessionStatus === 'RESCHEDULING'
                                ? '#b45309'
                                : session.sessionStatus === 'COMPLETED'
                                ? '#15803d'
                                : session.sessionStatus === 'NO_SHOW'
                                ? '#7e22ce'
                                : '#b91c1c',
                            border: '1px solid currentColor',
                          }}
                        >
                          Status: {session.sessionStatus}
                        </span>

                        {/* Confirmation Status Badge (SEPARATE) */}
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor:
                              session.confirmationStatus === 'CONFIRMED'
                                ? '#f0fdf4'
                                : session.confirmationStatus === 'PENDING'
                                ? '#fefce8'
                                : session.confirmationStatus === 'EXPIRED'
                                ? '#fff7ed'
                                : '#fef2f2',
                            color:
                              session.confirmationStatus === 'CONFIRMED'
                                ? '#166534'
                                : session.confirmationStatus === 'PENDING'
                                ? '#a16207'
                                : session.confirmationStatus === 'EXPIRED'
                                ? '#c2410c'
                                : '#991b1b',
                            border: '1px solid currentColor',
                          }}
                        >
                          Attendance: {session.confirmationStatus}
                        </span>
                      </div>
                    </div>

                    <div>
                      {session.isIncluded ? (
                        <span style={{ color: '#0d9488', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Leaf size={14} /> {t('spa.includedInPackage', 'Package Inclusive')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                          {formatPrice(session.basePrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} style={{ color: '#0d9488' }} />
                      <span>{session.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} style={{ color: '#0d9488' }} />
                      <span>{session.startTime} – {session.endTime} ({session.durationMinutes} min)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={15} style={{ color: '#0d9488' }} />
                      <span>Therapist: <strong>{session.therapistName}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} style={{ color: '#0d9488' }} />
                      <span>Suite: <strong>{session.roomName}</strong></span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {isScheduled && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                      {/* Attendance Confirmation Action */}
                      {isPendingAttendance && (
                        <button
                          type="button"
                          className="hsw-btn hsw-btn-primary"
                          disabled={actionSessionId === session.spaSessionId}
                          onClick={() => handleConfirmAttendance(session.spaSessionId)}
                          id={`btn-confirm-attendance-${session.spaSessionId}`}
                          style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Check size={14} />
                          <span>{t('spa.confirmAttendanceBtn', 'Confirm Attendance')}</span>
                        </button>
                      )}

                      {/* Reschedule Entry Point (Customer-Initiated) */}
                      <button
                        type="button"
                        className="hsw-btn hsw-btn-secondary"
                        onClick={() =>
                          navigate(
                            `/customer/spa/book?treatment=${session.treatmentId}&reschedule=${session.spaSessionId}`
                          )
                        }
                        id={`btn-reschedule-${session.spaSessionId}`}
                        style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RotateCcw size={14} />
                        <span>{t('spa.rescheduleBtn', 'Reschedule Session')}</span>
                      </button>

                      {/* Cancel Session */}
                      <button
                        type="button"
                        className="spa-cancel-btn"
                        disabled={actionSessionId === session.spaSessionId}
                        onClick={() => handleCancelSession(session.spaSessionId)}
                        id={`btn-cancel-${session.spaSessionId}`}
                        style={{ padding: '8px 14px', fontSize: '13px', marginLeft: 'auto' }}
                      >
                        <Ban size={14} />
                        <span>{t('spa.cancelBtn', 'Cancel')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
