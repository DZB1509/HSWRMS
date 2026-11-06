import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { spaApi } from '../../features/m3-spa/api/spaApi';
import type { BackendSpaSession } from '../../features/m3-spa/types/spaTypes';
import {
  CalendarCheck,
  XCircle,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Activity,
  MapPin,
  Calendar,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';


const TODAY = new Date().toISOString().split('T')[0];

export const TherapistDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation('operations');
  const navigate = useNavigate();
  const [sessions, setSessions] = React.useState<BackendSpaSession[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    spaApi.getTherapistDashboard()
      .then((data) => setSessions(data))
      .catch((err) => console.error('Failed to load therapist dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | string | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === TODAY),
    [sessions]
  );

  const confirmedCount = todaySessions.filter((s) => s.sessionStatus === 'SCHEDULED').length;
  const completedCount = todaySessions.filter((s) => s.sessionStatus === 'COMPLETED').length;
  
  const nextSession = useMemo(
    () => todaySessions.find((s) => s.sessionStatus === 'SCHEDULED'),
    [todaySessions]
  );

  const therapistDisplayName = sessions[0]?.therapistName || t('therapist.title', 'Therapist');
  const hasHealthFlags = false;
  const weekSessions = sessions.filter((s) => s.sessionStatus !== 'CANCELLED');

  const formattedTodayDate = new Date(TODAY + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) {
    return <div className="therapist-dashboard"><p style={{ padding: '2rem' }}>Loading schedule...</p></div>;
  }

  return (
    <div className="therapist-dashboard" id="screen-31-therapist-dashboard" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* A. Compact Page Header */}
      <OperationalPageHeader
        title={t('therapist.dashboard', 'Therapist Dashboard')}
        subtitle={`${t('therapist.welcome', 'Welcome')}, ${therapistDisplayName}`}
        badge="Screen #31"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', padding: '6px 12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={14} />
            <span>{formattedTodayDate}</span>
          </div>
        }
      />

      {/* B. Shift Summary (4 Compact Operational Cards) */}
      <div className="therapist-stats-row">
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--pending">
            <CalendarCheck size={20} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{confirmedCount}</span>
            <span className="therapist-stat-label">{t('therapist.upcoming', 'Upcoming')}</span>
          </div>
        </div>
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--active">
            <Clock size={20} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{confirmedCount}</span>
            <span className="therapist-stat-label">{t('therapist.scheduled', 'Scheduled')}</span>
          </div>
        </div>
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--done">
            <CheckCircle size={20} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{completedCount}</span>
            <span className="therapist-stat-label">{t('therapist.completed', 'Completed')}</span>
          </div>
        </div>
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--total">
            <Sparkles size={20} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{weekSessions.length}</span>
            <span className="therapist-stat-label">{t('therapist.totalAssigned', 'Total Assigned')}</span>
          </div>
        </div>
      </div>

      {/* C. NEXT SESSION (Primary Content) */}
      {nextSession ? (
        <section className="therapist-next-session" aria-labelledby="next-session-title">
          <div className="therapist-next-header">
            <div className="therapist-next-tag">
              <Sparkles size={14} />
              <span id="next-session-title">{t('therapist.nextSession', 'Next Session')}</span>
            </div>
            <span className="spa-status-badge spa-status--confirmed">
              <Clock size={13} /> {t('therapist.scheduled', 'Scheduled')}
            </span>
          </div>
          <div className="therapist-next-card ops-card">
            <div className="therapist-next-main">
              <div className="therapist-next-title-row">
                <h3>{localize(nextSession.treatmentName)}</h3>
                <span className="therapist-duration-chip">
                  <Clock size={13} />
                  {nextSession.durationMinutes} min
                </span>
              </div>
              <div className="therapist-next-meta-grid">
                <div className="therapist-meta-item">
                  <span className="therapist-meta-label">{t('therapist.time', 'Time')}</span>
                  <strong className="therapist-meta-val"><Clock size={13} /> {nextSession.startTime} — {nextSession.endTime}</strong>
                </div>
                <div className="therapist-meta-item">
                  <span className="therapist-meta-label">{t('therapist.customer', 'Customer')}</span>
                  <strong className="therapist-meta-val"><User size={13} /> {nextSession.customerName}</strong>
                </div>
                <div className="therapist-meta-item">
                  <span className="therapist-meta-label">{t('therapist.room', 'Room')}</span>
                  <strong className="therapist-meta-val"><MapPin size={13} /> {localize(nextSession.roomName)}</strong>
                </div>
              </div>

              {/* Treatment Consideration Flags */}
              <div className="therapist-next-flags">
                {hasHealthFlags && (
                  <div className="therapist-flag therapist-flag--attention">
                    <ShieldAlert size={14} />
                    <span>{t('therapist.healthConsiderationFlag', 'Treatment Health Considerations On File')}</span>
                  </div>
                )}
                {nextSession.customerNote && (
                  <div className="therapist-flag therapist-flag--request">
                    <AlertCircle size={14} />
                    <span>{t('therapist.customerRequestLabel', 'Request')}: {nextSession.customerNote}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="therapist-next-action-col">
              <button
                className="therapist-primary-action-btn"
                onClick={() => navigate(`/therapist/sessions/${nextSession.spaSessionId}`)}
                id="therapist-view-next"
              >
                <span>{t('therapist.viewSession', 'View Session Details')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="therapist-next-session">
          <div className="therapist-next-card therapist-next-card--empty">
            <CheckCircle size={24} style={{ color: 'var(--success)' }} />
            <div>
              <h3>{t('therapist.allClear', 'All Clear for Now')}</h3>
              <p>{t('therapist.noUpcomingToday', 'No upcoming sessions remaining on your shift today.')}</p>
            </div>
          </div>
        </section>
      )}

      {/* D. Today's Schedule Preview (Chronological & Scannable) */}
      <section className="therapist-today-preview" aria-labelledby="today-schedule-title">
        <div className="therapist-preview-header">
          <h2 id="today-schedule-title">{t('therapist.todaySchedule', "Today's Schedule")}</h2>
          <button className="ops-link-btn" onClick={() => navigate('/therapist/schedule')}>
            {t('therapist.viewFull', 'View Full Schedule')} <ArrowRight size={14} />
          </button>
        </div>
        {todaySessions.length > 0 ? (
          <div className="therapist-preview-list ops-card">
            {todaySessions.map((session) => (
              <div
                key={session.spaSessionId}
                className={`therapist-preview-item therapist-preview-item--${session.sessionStatus}`}
                onClick={() => navigate(`/therapist/sessions/${session.spaSessionId}`)}
                id={`therapist-preview-${session.spaSessionId}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/therapist/sessions/${session.spaSessionId}`);
                  }
                }}
              >
                <div className="therapist-preview-time-col">
                  <span className="therapist-preview-start">{session.startTime}</span>
                  <span className="therapist-preview-end">{session.endTime}</span>
                </div>
                <div className="therapist-preview-info-col">
                  <span className="therapist-preview-treatment">{localize(session.treatmentName)}</span>
                  <span className="therapist-preview-meta">
                    <User size={12} /> {session.customerName} · <MapPin size={12} /> {localize(session.roomName)}
                  </span>
                </div>
                <div className="therapist-preview-status-col">
                  <span className={`spa-status-badge spa-status--${session.sessionStatus}`}>
                    {session.sessionStatus === 'COMPLETED' ? (
                      <><CheckCircle size={12} /> {t('therapist.done', 'Done')}</>
                    ) : session.sessionStatus === 'NO_SHOW' ? (
                      <><XCircle size={12} /> {t('therapist.noShow', 'No-Show')}</>
                    ) : (
                      <><CheckCircle size={12} /> {session.confirmationStatus}</>
                    )}
                  </span>
                  <ChevronRight size={16} className="therapist-preview-chevron" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="therapist-preview-empty">
            <CheckCircle size={28} />
            <p>{t('therapist.noSessions', 'No sessions scheduled for today.')}</p>
          </div>
        )}
      </section>

      {/* E. Quick Actions (Compact, Operational) */}
      <section className="therapist-quick-actions" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title">{t('therapist.quickActions', 'Operational Shortlinks')}</h2>
        <div className="therapist-actions-grid">
          <button
            className="therapist-action-card ops-card"
            onClick={() => navigate('/therapist/schedule')}
            id="therapist-go-schedule"
          >
            <div className="therapist-action-card-left">
              <CalendarCheck size={18} />
              <span>{t('therapist.dailySchedule', 'Daily Work Schedule')}</span>
            </div>
            <ChevronRight size={16} />
          </button>
          {todaySessions.length > 0 && (
            <button
              className="therapist-action-card ops-card"
              onClick={() => navigate(`/therapist/sessions/${todaySessions[0].spaSessionId}`)}
              id="therapist-go-session"
            >
              <div className="therapist-action-card-left">
                <Activity size={18} />
                <span>{t('therapist.sessionNotes', 'Current Session & Notes')}</span>
              </div>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

