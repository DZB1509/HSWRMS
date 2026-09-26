import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import {
  CalendarCheck,
  Clock,
  User,
  MapPin,
  Play,
  CheckCircle,
  Activity,
  Sparkles,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';

const CURRENT_THERAPIST_ID = 'THER-01';

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

export const TherapistSchedulePage: React.FC = () => {
  const { t } = useTranslation('operations');
  const navigate = useNavigate();
  const { getSessionsByTherapist, getTherapistById, startSession } = useSpa();

  const localize = (ls: LocalizedString) => useLocalized(ls);
  const therapist = getTherapistById(CURRENT_THERAPIST_ID);

  const [selectedDate, setSelectedDate] = useState('2026-09-26');

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

  const daySessions = useMemo(
    () => getSessionsByTherapist(CURRENT_THERAPIST_ID, selectedDate),
    [getSessionsByTherapist, selectedDate]
  );

  // Time grid: 7am to 7pm
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 7 + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const handleStartSession = (sessionId: string) => {
    startSession(sessionId);
  };

  return (
    <div className="therapist-schedule" id="screen-32-therapist-daily-schedule">
      <div className="ops-page-header">
        <div className="ops-header-icon-box">
          <CalendarCheck size={22} />
        </div>
        <div className="ops-header-text">
          <h1>{t('therapist.dailySchedule', 'Daily Work Schedule')}</h1>
          {therapist && (
            <p className="ops-page-subtitle">
              {therapist.name} · {localize(therapist.title)}
            </p>
          )}
        </div>
      </div>

      {/* Date Navigation Carousel */}
      <div className="therapist-date-nav" role="tablist" aria-label="Select Date">
        {availableDates.map((d) => {
          const dt = new Date(d + 'T00:00:00');
          const isToday = d === '2026-09-26';
          const isActive = selectedDate === d;
          return (
            <button
              key={d}
              role="tab"
              aria-selected={isActive}
              className={`therapist-date-btn ${isActive ? 'therapist-date-btn--active' : ''}`}
              onClick={() => setSelectedDate(d)}
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

      {/* Summary Bar */}
      <div className="therapist-summary-bar">
        <div className="therapist-summary-left">
          <Sparkles size={15} />
          <strong>{daySessions.length}</strong> {t('therapist.sessionsScheduled', 'sessions scheduled')}
        </div>
        <div className="therapist-summary-date">
          <Calendar size={14} />
          <span>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Timeline / Table-Hybrid View */}
      <div className="therapist-timeline">
        {timeSlots.map((time) => {
          const hourSessions = daySessions.filter((s) => {
            const sStart = s.startTime;
            const slotH = parseInt(time.split(':')[0]);
            const startH = parseInt(sStart.split(':')[0]);
            const startM = parseInt(sStart.split(':')[1]);
            // Show session at its start hour
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
                      id={`therapist-session-${session.id}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/therapist/sessions/${session.id}`);
                        }
                      }}
                    >
                      {/* Priority order: TIME -> CUSTOMER -> TREATMENT -> ROOM -> STATUS -> ACTION */}
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
                        {session.status === 'confirmed' ? (
                          <button
                            className="therapist-start-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSession(session.id);
                            }}
                            id={`therapist-start-${session.id}`}
                          >
                            <Play size={13} />
                            <span>{t('therapist.startSession', 'Start Session')}</span>
                          </button>
                        ) : (
                          <span className="therapist-details-link">
                            <span>{t('therapist.viewDetails', 'Details')}</span>
                            <ChevronRight size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="therapist-timeline-empty-slot">
                    <span className="therapist-empty-slot-text">{t('therapist.availableSlot', 'Available slot')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {daySessions.length === 0 && (
        <div className="therapist-no-sessions">
          <CheckCircle size={36} />
          <h3>{t('therapist.noSessionsDay', 'No sessions scheduled for this day')}</h3>
          <p>{t('therapist.freeDay', 'You have no assigned sessions on this date.')}</p>
        </div>
      )}
    </div>
  );
};

