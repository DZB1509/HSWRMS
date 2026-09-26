/**
 * Screen #32 — Therapist Daily Schedule
 * Operational view for assigned Therapist shifts.
 * Default view: COMPACT AGENDA-FIRST (chronological sessions with subtle gap indicators).
 * Secondary view: Hourly Timeline.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import {
  Clock,
  User,
  MapPin,
  Play,
  CheckCircle,
  Activity,
  Sparkles,
  ChevronRight,
  List,
  Columns,
  Coffee,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';

const CURRENT_THERAPIST_ID = 'THER-01';

// Helper: minutes between "HH:MM" strings
const timeDiffMinutes = (startStr: string, endStr: string): number => {
  const [h1, m1] = startStr.split(':').map(Number);
  const [h2, m2] = endStr.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

export const TherapistSchedulePage: React.FC = () => {
  const { t, i18n } = useTranslation('operations');
  const navigate = useNavigate();
  const { getSessionsByTherapist, getTherapistById, startSession } = useSpa();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };
  const therapist = getTherapistById(CURRENT_THERAPIST_ID);

  const [selectedDate, setSelectedDate] = useState('2026-09-26');
  // Default to COMPACT AGENDA-FIRST view per Requirement 8
  const [viewMode, setViewMode] = useState<'agenda' | 'timeline'>('agenda');

  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const base = new Date('2026-09-25');
    for (let i = 0; i < 5; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Sorted chronologically by start time
  const daySessions = useMemo(() => {
    const s = getSessionsByTherapist(CURRENT_THERAPIST_ID, selectedDate);
    return [...s].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [getSessionsByTherapist, selectedDate]);

  // Hourly timeline slots: 08:00 to 18:00
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const handleStartSession = (sessionId: string) => {
    startSession(sessionId);
  };

  const formattedDateTitle = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="therapist-schedule" id="screen-32-therapist-daily-schedule" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <OperationalPageHeader
        title={t('therapist.dailySchedule', 'Daily Work Schedule')}
        subtitle={therapist ? `${therapist.name} · ${localize(therapist.title)}` : ''}
        badge="Screen #32"
      />

      {/* Date Navigation Bar */}
      <div className="therapist-date-nav" role="tablist" aria-label="Select Date">
        {availableDates.map((d) => {
          const dt = new Date(d + 'T00:00:00');
          const isToday = d === '2026-09-26';
          const isActive = selectedDate === d;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`therapist-date-btn ${isActive ? 'therapist-date-btn--active' : ''}`}
              onClick={() => setSelectedDate(d)}
              id={`therapist-date-${dt.getDate()}`}
            >
              <span className="therapist-date-weekday">
                {dt.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="therapist-date-number">{dt.getDate()}</span>
              {isToday ? (
                <span className="therapist-date-today-badge">{t('therapist.today', 'Today')}</span>
              ) : (
                <span className="therapist-date-spacer" />
              )}
            </button>
          );
        })}
      </div>

      {/* Operational Summary Bar with Agenda | Timeline View Toggle */}
      <div className="therapist-summary-bar">
        <div className="therapist-summary-left">
          <Sparkles size={15} />
          <strong>{daySessions.length}</strong> {t('therapist.sessionsScheduled', 'sessions scheduled')} ·{' '}
          <span>{formattedDateTitle}</span>
        </div>

        {/* View Toggle: Agenda (Default) | Timeline */}
        <div className="therapist-view-toggle">
          <button
            type="button"
            className={`therapist-toggle-btn ${viewMode === 'agenda' ? 'therapist-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('agenda')}
            id="btn-schedule-agenda-view"
          >
            <List size={14} />
            <span>{t('therapist.viewAgenda', 'Agenda')}</span>
          </button>
          <button
            type="button"
            className={`therapist-toggle-btn ${viewMode === 'timeline' ? 'therapist-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('timeline')}
            id="btn-schedule-timeline-view"
          >
            <Columns size={14} />
            <span>{t('therapist.viewTimeline', 'Timeline')}</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW: Agenda or Timeline */}
      {viewMode === 'agenda' ? (
        /* COMPACT AGENDA-FIRST VIEW (Requirement 8) */
        <div className="therapist-agenda-view" id="therapist-agenda-container">
          {daySessions.length > 0 ? (
            <div className="therapist-agenda-table ops-card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Agenda Header Row */}
              <div className="therapist-agenda-header-row">
                <span className="th-col-time">{t('therapist.colTime', 'TIME')}</span>
                <span className="th-col-customer">{t('therapist.colCustomer', 'CUSTOMER')}</span>
                <span className="th-col-treatment">{t('therapist.colTreatment', 'TREATMENT')}</span>
                <span className="th-col-room">{t('therapist.colRoom', 'SUITE / ROOM')}</span>
                <span className="th-col-status">{t('therapist.colStatus', 'STATUS')}</span>
                <span className="th-col-action">{t('therapist.colAction', 'ACTION')}</span>
              </div>

              {/* Agenda Session Rows with Subtle Gap Indicators */}
              {daySessions.map((session, index) => {
                const prevSession = index > 0 ? daySessions[index - 1] : null;
                const gapMins = prevSession ? timeDiffMinutes(prevSession.endTime, session.startTime) : 0;
                const hasSubtleGap = gapMins >= 15;

                return (
                  <React.Fragment key={session.id}>
                    {/* Subtle Free Gap Indicator (Requirement 8) */}
                    {hasSubtleGap && (
                      <div className="therapist-agenda-gap-row">
                        <span className="therapist-agenda-gap-line" />
                        <span className="therapist-agenda-gap-pill">
                          <Coffee size={12} />
                          <span>
                            {prevSession?.endTime} — {session.startTime} ({gapMins} min preparation & rest window)
                          </span>
                        </span>
                        <span className="therapist-agenda-gap-line" />
                      </div>
                    )}

                    {/* Operational Session Row */}
                    <div
                      className={`therapist-agenda-row therapist-agenda-row--${session.status}`}
                      onClick={() => navigate(`/therapist/sessions/${session.id}`)}
                      id={`therapist-agenda-row-${session.id}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/therapist/sessions/${session.id}`);
                        }
                      }}
                    >
                      {/* TIME */}
                      <div className="th-col-time">
                        <span className="therapist-agenda-time">
                          <Clock size={13} />
                          <span>{session.startTime} — {session.endTime}</span>
                        </span>
                        <span className="therapist-agenda-duration">
                          {session.durationMinutes} min
                        </span>
                      </div>

                      {/* CUSTOMER */}
                      <div className="th-col-customer">
                        <span className="therapist-agenda-customer">
                          <User size={13} />
                          <span>{session.customerName}</span>
                        </span>
                      </div>

                      {/* TREATMENT */}
                      <div className="th-col-treatment">
                        <span className="therapist-agenda-treatment">
                          {localize(session.treatmentName)}
                        </span>
                      </div>

                      {/* ROOM */}
                      <div className="th-col-room">
                        <span className="therapist-agenda-room">
                          <MapPin size={13} />
                          <span>{localize(session.roomName)}</span>
                        </span>
                      </div>

                      {/* STATUS */}
                      <div className="th-col-status">
                        <span className={`spa-status-badge spa-status--${session.status}`}>
                          {session.status === 'confirmed' ? (
                            <><CheckCircle size={12} /> {t('therapist.confirmed', 'Confirmed')}</>
                          ) : session.status === 'in_progress' ? (
                            <><Activity size={12} /> {t('therapist.inProgress', 'In Progress')}</>
                          ) : session.status === 'completed' ? (
                            <><CheckCircle size={12} /> {t('therapist.done', 'Done')}</>
                          ) : (
                            session.status
                          )}
                        </span>
                      </div>

                      {/* ACTION */}
                      <div className="th-col-action">
                        <button
                          type="button"
                          className="therapist-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/therapist/sessions/${session.id}`);
                          }}
                          id={`therapist-details-${session.id}`}
                        >
                          <span>{t('therapist.viewDetails', 'View Details')}</span>
                          <ChevronRight size={13} />
                        </button>
                        {session.status === 'confirmed' && (
                          <button
                            type="button"
                            className="therapist-start-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSession(session.id);
                            }}
                            id={`therapist-start-${session.id}`}
                            title={t('therapist.startSession', 'Start Session')}
                          >
                            <Play size={12} />
                            <span>{t('therapist.start', 'Start')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="therapist-no-sessions">
              <CheckCircle size={32} />
              <h3>{t('therapist.noSessionsDay', 'No sessions scheduled for this day')}</h3>
              <p>{t('therapist.freeDay', 'You have no assigned therapy appointments on this date.')}</p>
            </div>
          )}
        </div>
      ) : (
        /* SECONDARY VIEW: Hourly Timeline */
        <div className="therapist-timeline ops-card" style={{ padding: '0', overflow: 'hidden' }}>
          {timeSlots.map((time) => {
            const hourSessions = daySessions.filter((s) => {
              const slotH = parseInt(time.split(':')[0]);
              const startH = parseInt(s.startTime.split(':')[0]);
              const startM = parseInt(s.startTime.split(':')[1]);
              return startH === slotH || (startH === slotH - 1 && startM >= 30);
            });

            return (
              <div key={time} className="therapist-timeline-row">
                <div className="therapist-timeline-time">
                  <span className="therapist-hour-marker">{time}</span>
                </div>
                <div className="therapist-timeline-content">
                  {hourSessions.length > 0 ? (
                    hourSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`therapist-session-card therapist-session-card--${session.status}`}
                        onClick={() => navigate(`/therapist/sessions/${session.id}`)}
                        id={`therapist-timeline-${session.id}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            navigate(`/therapist/sessions/${session.id}`);
                          }
                        }}
                      >
                        <div className="therapist-session-col therapist-session-col--time">
                          <span className="therapist-time-range">
                            <Clock size={13} />
                            {session.startTime} — {session.endTime}
                          </span>
                          <span className="therapist-duration-label">
                            {session.durationMinutes} min
                          </span>
                        </div>

                        <div className="therapist-session-col therapist-session-col--customer">
                          <span className="therapist-customer-name">
                            <User size={13} />
                            {session.customerName}
                          </span>
                        </div>

                        <div className="therapist-session-col therapist-session-col--treatment">
                          <span className="therapist-treatment-title">
                            {localize(session.treatmentName)}
                          </span>
                        </div>

                        <div className="therapist-session-col therapist-session-col--room">
                          <span className="therapist-room-label">
                            <MapPin size={13} />
                            {localize(session.roomName)}
                          </span>
                        </div>

                        <div className="therapist-session-col therapist-session-col--status">
                          <span className={`spa-status-badge spa-status--${session.status}`}>
                            {session.status === 'confirmed' ? (
                              <><CheckCircle size={12} /> {t('therapist.confirmed', 'Confirmed')}</>
                            ) : session.status === 'in_progress' ? (
                              <><Activity size={12} /> {t('therapist.inProgress', 'In Progress')}</>
                            ) : session.status === 'completed' ? (
                              <><CheckCircle size={12} /> {t('therapist.done', 'Done')}</>
                            ) : (
                              session.status
                            )}
                          </span>
                        </div>

                        <div className="therapist-session-col therapist-session-col--action">
                          <button
                            type="button"
                            className="therapist-details-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/therapist/sessions/${session.id}`);
                            }}
                            id={`therapist-timeline-details-${session.id}`}
                          >
                            <span>{t('therapist.viewDetails', 'View Details')}</span>
                            <ChevronRight size={13} />
                          </button>
                          {session.status === 'confirmed' && (
                            <button
                              type="button"
                              className="therapist-start-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartSession(session.id);
                              }}
                              id={`therapist-timeline-start-${session.id}`}
                              title={t('therapist.startSession', 'Start Session')}
                            >
                              <Play size={12} />
                              <span>{t('therapist.start', 'Start')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="therapist-timeline-empty-slot">
                      <span className="therapist-empty-slot-text">{t('therapist.availableSlot', 'Available window')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
