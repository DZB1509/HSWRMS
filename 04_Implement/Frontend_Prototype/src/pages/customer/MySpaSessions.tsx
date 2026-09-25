/**
 * Screen #29 — My Spa Sessions
 * Displays upcoming and historical spa/therapy sessions for the Customer.
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
  ChevronRight,
  Filter,
  Leaf,
  Ban,
  Bell,
  LayoutDashboard,
} from 'lucide-react';
import type { LocalizedString, SpaSession, SpaSessionStatus } from '../../types/spa';

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

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
  const { t } = useTranslation('customer');
  const navigate = useNavigate();
  const { sessions, cancelSession } = useSpa();
  const { activeBooking } = useCustomer();

  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const localize = (ls: LocalizedString) => useLocalized(ls);

  // Filter sessions for current booking
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

  const filteredSessions = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return bookingSessions.filter((s) => ['booked', 'confirmed', 'in_progress'].includes(s.status));
      case 'completed':
        return bookingSessions.filter((s) => ['completed', 'no_show', 'cancelled'].includes(s.status));
      default:
        return bookingSessions;
    }
  }, [bookingSessions, activeTab]);

  const upcomingCount = bookingSessions.filter((s) => ['booked', 'confirmed', 'in_progress'].includes(s.status)).length;
  const completedCount = bookingSessions.filter((s) => ['completed', 'no_show', 'cancelled'].includes(s.status)).length;

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

  const renderSession = (session: SpaSession) => {
    const statusConfig = STATUS_CONFIG[session.status];
    const isUpcoming = ['booked', 'confirmed'].includes(session.status);
    const isCancelling = cancellingId === session.id;

    return (
      <div key={session.id} className={`spa-session-card ${statusConfig.className}`} id={`spa-session-${session.id}`}>
        <div className="spa-session-header">
          <div className="spa-session-treatment">
            <h3>{localize(session.treatmentName)}</h3>
            <span className={`spa-status-badge ${statusConfig.className}`}>
              {statusConfig.icon}
              {t(statusConfig.labelKey, statusConfig.defaultLabel)}
            </span>
          </div>
          {session.chargeType === 'included' ? (
            <span className="spa-session-charge spa-session-charge--included">
              <Leaf size={12} /> {t('spa.included', 'Included')}
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
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="spa-session-detail">
            <Clock size={14} />
            <span>{session.startTime} — {session.endTime} ({session.durationMinutes} {t('spa.minutes', 'min')})</span>
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

        {session.calendarSyncStatus === 'synced' && (
          <div
            className="spa-session-reminder-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: 'var(--accent-gold, #c4af82)',
              background: 'rgba(196, 175, 130, 0.08)',
              padding: '0.3rem 0.6rem',
              borderRadius: '0.35rem',
              marginTop: '0.5rem',
            }}
          >
            <Bell size={12} />
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
              {isCancelling ? t('spa.cancelling', 'Cancelling...') : t('spa.cancelSession', 'Cancel Session')}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="spa-sessions-page" id="screen-29-my-spa-sessions">
      <div className="spa-sessions-header">
        <h1>
          <Sparkles size={24} />
          {t('spa.mySessions', 'My Spa Sessions')}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="spa-secondary-btn"
            onClick={() => navigate('/customer/dashboard')}
            id="spa-return-dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <LayoutDashboard size={16} />
            <span>{t('spa.returnToDashboard', 'Dashboard')}</span>
          </button>
          <button
            className="spa-confirm-btn"
            onClick={() => navigate('/customer/spa')}
            id="spa-book-new"
          >
            {t('spa.bookNewSession', 'Book New Session')}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="spa-sessions-tabs">
        <button
          className={`spa-tab ${activeTab === 'upcoming' ? 'spa-tab--active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Calendar size={16} />
          {t('spa.upcoming', 'Upcoming')}
          {upcomingCount > 0 && <span className="spa-tab-count">{upcomingCount}</span>}
        </button>
        <button
          className={`spa-tab ${activeTab === 'completed' ? 'spa-tab--active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle size={16} />
          {t('spa.history', 'History')}
          {completedCount > 0 && <span className="spa-tab-count">{completedCount}</span>}
        </button>
        <button
          className={`spa-tab ${activeTab === 'all' ? 'spa-tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Filter size={16} />
          {t('spa.allSessions', 'All')}
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="spa-sessions-list">
          {filteredSessions.map(renderSession)}
        </div>
      ) : (
        <div className="spa-sessions-empty">
          <Sparkles size={48} />
          <h3>{t('spa.noSessions', 'No sessions found')}</h3>
          <p>{t('spa.noSessionsDesc', 'Book a spa treatment to see your sessions here.')}</p>
          <button className="spa-confirm-btn" onClick={() => navigate('/customer/spa')}>
            {t('spa.browseTreatments', 'Browse Treatments')}
          </button>
        </div>
      )}
    </div>
  );
};
