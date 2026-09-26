/**
 * Screen #29 — My Spa Sessions
 * Displays upcoming and historical spa/therapy sessions for the Customer.
 * Highlights the NEXT upcoming session prominently first.
 * Provides compact empty states and calendar/reminder mock indicators.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useCustomer } from '../../context/CustomerContext';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Filter,
  Leaf,
  Ban,
  Bell,
  LayoutDashboard,
  CalendarCheck,
} from 'lucide-react';
import type { LocalizedString, SpaSession, SpaSessionStatus } from '../../types/spa';

const STATUS_CONFIG: Record<SpaSessionStatus, { icon: React.ReactNode; className: string; labelKey: string; defaultLabel: string }> = {
  booked: { icon: <Calendar size={14} />, className: 'spa-status--booked', labelKey: 'spa.status.booked', defaultLabel: 'Booked' },
  confirmed: { icon: <CheckCircle size={14} />, className: 'spa-status--confirmed', labelKey: 'spa.status.confirmed', defaultLabel: 'Confirmed' },
  in_progress: { icon: <Play size={14} />, className: 'spa-status--progress', labelKey: 'spa.status.inProgress', defaultLabel: 'In Progress' },
  completed: { icon: <CheckCircle size={14} />, className: 'spa-status--completed', labelKey: 'spa.status.completed', defaultLabel: 'Completed' },
  no_show: { icon: <AlertCircle size={14} />, className: 'spa-status--noshow', labelKey: 'spa.status.noShow', defaultLabel: 'No Show' },
  cancelled: { icon: <XCircle size={14} />, className: 'spa-status--cancelled', labelKey: 'spa.status.cancelled', defaultLabel: 'Cancelled' },
};

type TabFilter = 'upcoming' | 'completed' | 'all';

export const MySpaSessions: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const navigate = useNavigate();
  const { sessions, cancelSession } = useSpa();
  const { activeBooking } = useCustomer();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filter sessions for current retreat booking, sorted chronologically
  const bookingSessions = useMemo(() => {
    if (!activeBooking) return [];
    return sessions
      .filter((s) => s.bookingReference === activeBooking.bookingReference)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [sessions, activeBooking]);

  const upcomingSessions = useMemo(
    () => bookingSessions.filter((s) => ['booked', 'confirmed', 'in_progress'].includes(s.status)),
    [bookingSessions]
  );

  const historySessions = useMemo(
    () => bookingSessions.filter((s) => ['completed', 'no_show', 'cancelled'].includes(s.status)),
    [bookingSessions]
  );

  // Next upcoming session is the first active or upcoming session
  const nextUpcomingSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  // The rest of the upcoming sessions
  const subsequentUpcomingSessions = nextUpcomingSession
    ? upcomingSessions.filter((s) => s.id !== nextUpcomingSession.id)
    : [];

  const handleCancel = (sessionId: string) => {
    setCancellingId(sessionId);
    setTimeout(() => {
      cancelSession(sessionId);
      setCancellingId(null);
    }, 500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const renderSessionCard = (session: SpaSession, isProminentNext: boolean = false) => {
    const statusConfig = STATUS_CONFIG[session.status];
    const isUpcoming = ['booked', 'confirmed'].includes(session.status);
    const isCancelling = cancellingId === session.id;

    return (
      <div
        key={session.id}
        className={`spa-session-card ${isProminentNext ? 'spa-session-card--prominent' : ''} ${statusConfig.className}`}
        id={`spa-session-${session.id}`}
      >
        {isProminentNext && (
          <div className="spa-prominent-badge">
            <Sparkles size={14} />
            <span>{t('spa.nextUpcomingBadge', 'Next Upcoming Therapy Session')}</span>
          </div>
        )}

        <div className="spa-session-header">
          <div className="spa-session-treatment">
            <h3 className="spa-session-title">{localize(session.treatmentName)}</h3>
            <span className={`spa-status-badge ${statusConfig.className}`}>
              {statusConfig.icon}
              {t(statusConfig.labelKey, statusConfig.defaultLabel)}
            </span>
          </div>
          {session.chargeType === 'included' ? (
            <span className="spa-session-charge spa-session-charge--included">
              <Leaf size={12} /> {t('spa.included', 'Included in Retreat')}
            </span>
          ) : (
            <span className="spa-session-charge">{formatPrice(session.price)}</span>
          )}
        </div>

        <div className="spa-session-details">
          <div className="spa-session-detail">
            <Calendar size={14} />
            <span>
              {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="spa-session-detail">
            <Clock size={14} />
            <span>
              {session.startTime} — {session.endTime} ({session.durationMinutes} {t('spa.minutes', 'min')})
            </span>
          </div>
          <div className="spa-session-detail">
            <User size={14} />
            <span>{session.therapistName}</span>
          </div>
          <div className="spa-session-detail">
            <MapPin size={14} />
            <span>{localize(session.roomName)}</span>
          </div>
        </div>

        {session.therapistNotes && (
          <div className="spa-session-notes">
            <Sparkles size={14} />
            <p>{session.therapistNotes}</p>
          </div>
        )}

        {/* Prototype calendar sync and reminder metadata */}
        {session.calendarSyncStatus === 'synced' && (
          <div className="spa-session-reminder-badge">
            <Bell size={13} />
            <span>{t('spa.calendarSyncedNote', 'Calendar Synced · 1h Reminder Active (Simulation)')}</span>
          </div>
        )}

        {isUpcoming && (
          <div className="spa-session-actions">
            <button
              className="spa-cancel-btn"
              onClick={() => handleCancel(session.id)}
              disabled={isCancelling}
              id={`spa-cancel-${session.id}`}
            >
              <Ban size={14} />
              <span>{isCancelling ? t('spa.cancelling', 'Cancelling...') : t('spa.cancelSession', 'Cancel Session')}</span>
            </button>
          </div>
        )}
      </div>
    );
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
            <Leaf size={16} />
            <span>{t('spa.bookNewSession', 'Book Treatment')}</span>
          </button>
        </div>
      </div>

      {/* Section Navigation Tabs: Treatment Catalogue | My Spa Sessions */}
      <div className="spa-section-nav" role="tablist" aria-label="Spa Navigation">
        <button
          type="button"
          className="spa-section-nav-tab"
          onClick={() => navigate('/customer/spa')}
          id="btn-nav-catalogue-tab"
          role="tab"
          aria-selected="false"
        >
          <Sparkles size={16} />
          <span>{t('spa.navCatalogue', 'Treatment Catalogue')}</span>
        </button>
        <button
          type="button"
          className="spa-section-nav-tab spa-section-nav-tab--active"
          onClick={() => navigate('/customer/spa/sessions')}
          role="tab"
          aria-selected="true"
        >
          <CalendarCheck size={16} />
          <span>{t('spa.mySessions', 'My Spa Sessions')}</span>
        </button>
      </div>

      {bookingSessions.length > 0 ? (
        <div className="spa-sessions-content">
          {/* 1. Visually Dominant Next Session (Requirement 5) */}
          {nextUpcomingSession && (
            <section className="spa-prominent-next-section" aria-labelledby="next-session-heading">
              <h2 id="next-session-heading" className="spa-section-title">
                <CalendarCheck size={18} />
                <span>{t('spa.nextSessionTitle', 'Next Upcoming Session')}</span>
              </h2>
              {renderSessionCard(nextUpcomingSession, true)}
            </section>
          )}

          {/* 2. Subsequent Upcoming & History Tabs */}
          <div className="spa-sessions-tabs-container">
            <div className="spa-sessions-tabs" role="tablist">
              <button
                className={`spa-tab ${activeTab === 'upcoming' ? 'spa-tab--active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
                role="tab"
                aria-selected={activeTab === 'upcoming'}
              >
                <Calendar size={15} />
                <span>{t('spa.upcoming', 'Upcoming')}</span>
                {upcomingSessions.length > 0 && (
                  <span className="spa-tab-count">{upcomingSessions.length}</span>
                )}
              </button>
              <button
                className={`spa-tab ${activeTab === 'completed' ? 'spa-tab--active' : ''}`}
                onClick={() => setActiveTab('completed')}
                role="tab"
                aria-selected={activeTab === 'completed'}
              >
                <CheckCircle size={15} />
                <span>{t('spa.history', 'History')}</span>
                {historySessions.length > 0 && (
                  <span className="spa-tab-count">{historySessions.length}</span>
                )}
              </button>
              <button
                className={`spa-tab ${activeTab === 'all' ? 'spa-tab--active' : ''}`}
                onClick={() => setActiveTab('all')}
                role="tab"
                aria-selected={activeTab === 'all'}
              >
                <Filter size={15} />
                <span>{t('spa.allSessions', 'All')}</span>
                <span className="spa-tab-count">{bookingSessions.length}</span>
              </button>
            </div>

            {/* Tab Panel Content */}
            <div className="spa-sessions-tab-panel">
              {activeTab === 'upcoming' ? (
                subsequentUpcomingSessions.length > 0 ? (
                  <div className="spa-sessions-list">
                    {subsequentUpcomingSessions.map((s) => renderSessionCard(s, false))}
                  </div>
                ) : nextUpcomingSession ? (
                  <div className="spa-quiet-notice">
                    <CheckCircle size={16} />
                    <span>{t('spa.noMoreUpcoming', 'No further upcoming sessions scheduled after your next session.')}</span>
                  </div>
                ) : (
                  <div className="spa-quiet-notice">
                    <Calendar size={16} />
                    <span>{t('spa.noUpcomingSessions', 'No upcoming sessions currently scheduled.')}</span>
                  </div>
                )
              ) : activeTab === 'completed' ? (
                historySessions.length > 0 ? (
                  <div className="spa-sessions-list">
                    {historySessions.map((s) => renderSessionCard(s, false))}
                  </div>
                ) : (
                  <div className="spa-quiet-notice">
                    <CheckCircle size={16} />
                    <span>{t('spa.noCompletedYet', 'No completed or historical treatments on file for this stay.')}</span>
                  </div>
                )
              ) : (
                <div className="spa-sessions-list">
                  {bookingSessions.map((s) => renderSessionCard(s, s.id === nextUpcomingSession?.id))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Compact, Helpful Empty State (Requirement 4 & 5) */
        <div className="spa-empty-card" id="screen-29-empty-state">
          <div className="spa-empty-icon-box">
            <Sparkles size={32} />
          </div>
          <h3>{t('spa.noSessions', 'No Spa Sessions Scheduled')}</h3>
          <p>
            {t(
              'spa.noSessionsDesc',
              'You have not reserved any therapy or wellness treatments for your current retreat stay yet.'
            )}
          </p>
          <div className="spa-empty-actions">
            <button
              className="spa-confirm-btn"
              onClick={() => navigate('/customer/spa')}
              id="spa-empty-explore-btn"
            >
              <Leaf size={16} />
              <span>{t('spa.browseTreatments', 'Explore Treatments')}</span>
            </button>
            <button
              className="spa-secondary-btn"
              onClick={() => navigate('/customer/dashboard')}
              id="spa-empty-dashboard-btn"
            >
              <LayoutDashboard size={16} />
              <span>{t('spa.returnToDashboard', 'Dashboard')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
