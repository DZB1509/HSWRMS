/**
 * Screen #32 — Therapist Daily Schedule
 * Displays spa/therapy sessions assigned to the logged-in Therapist
 * for the selected working day, in a timeline layout.
 */

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
  Sparkles,
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
        <CalendarCheck size={28} />
        <div>
          <h1>{t('therapist.dailySchedule', 'Daily Work Schedule')}</h1>
          {therapist && (
            <p className="ops-page-subtitle">{therapist.name} · {localize(therapist.title)}</p>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="therapist-date-nav">
        {availableDates.map((d) => {
          const dt = new Date(d + 'T00:00:00');
          const isToday = d === '2026-09-26';
          return (
            <button
              key={d}
              className={`therapist-date-btn ${selectedDate === d ? 'therapist-date-btn--active' : ''}`}
              onClick={() => setSelectedDate(d)}
            >
              <span className="therapist-date-weekday">
                {dt.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="therapist-date-number">{dt.getDate()}</span>
              {isToday && <span className="therapist-date-today">{t('therapist.today', 'Today')}</span>}
            </button>
          );
        })}
      </div>

      {/* Summary Bar */}
      <div className="therapist-summary-bar">
        <span>
          <Sparkles size={14} />
          {daySessions.length} {t('therapist.sessionsToday', 'sessions scheduled')}
        </span>
        <span className="therapist-summary-date">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Timeline View */}
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
                <span>{time}</span>
              </div>
              <div className="therapist-timeline-content">
                {hourSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`therapist-session-block therapist-session-block--${session.status}`}
                    onClick={() => navigate(`/therapist/sessions/${session.id}`)}
                    id={`therapist-session-${session.id}`}
                  >
                    <div className="therapist-session-top">
                      <h4>{localize(session.treatmentName)}</h4>
                      <span className={`spa-status-badge spa-status--${session.status}`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="therapist-session-meta">
                      <span><Clock size={12} /> {session.startTime} — {session.endTime}</span>
                      <span><User size={12} /> {session.customerName}</span>
                      <span><MapPin size={12} /> {localize(session.roomName)}</span>
                    </div>
                    {session.status === 'confirmed' && (
                      <button
                        className="therapist-start-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartSession(session.id);
                        }}
                        id={`therapist-start-${session.id}`}
                      >
                        <Play size={14} />
                        {t('therapist.startSession', 'Start Session')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {daySessions.length === 0 && (
        <div className="therapist-no-sessions">
          <CheckCircle size={48} />
          <h3>{t('therapist.noSessionsDay', 'No sessions scheduled for this day')}</h3>
          <p>{t('therapist.freeDay', 'You have no assigned sessions. Enjoy your time off!')}</p>
        </div>
      )}
    </div>
  );
};
