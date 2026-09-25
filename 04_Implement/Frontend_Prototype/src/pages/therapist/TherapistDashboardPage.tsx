/**
 * Screen #31 — Therapist Dashboard
 * Main screen showing assigned work summary and access to the daily schedule.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Activity,
  MapPin,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';

const CURRENT_THERAPIST_ID = 'THER-01'; // Demo: logged-in therapist
const TODAY = '2026-09-26';

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

export const TherapistDashboardPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const navigate = useNavigate();
  const { getSessionsByTherapist, getTherapistById, sessions } = useSpa();

  const localize = (ls: LocalizedString) => useLocalized(ls);

  const therapist = getTherapistById(CURRENT_THERAPIST_ID);
  const todaySessions = useMemo(
    () => getSessionsByTherapist(CURRENT_THERAPIST_ID, TODAY),
    [getSessionsByTherapist]
  );

  const confirmedCount = todaySessions.filter((s) => s.status === 'confirmed').length;
  const inProgressCount = todaySessions.filter((s) => s.status === 'in_progress').length;
  const completedCount = todaySessions.filter((s) => s.status === 'completed').length;
  const nextSession = todaySessions.find((s) => s.status === 'confirmed');

  // Weekly stats
  const weekSessions = useMemo(
    () => sessions.filter(
      (s) => s.therapistId === CURRENT_THERAPIST_ID && !['cancelled', 'no_show'].includes(s.status)
    ),
    [sessions]
  );

  return (
    <div className="therapist-dashboard" id="screen-31-therapist-dashboard">
      <div className="ops-page-header">
        <LayoutDashboard size={28} />
        <div>
          <h1>{t('therapist.dashboard', 'Therapist Dashboard')}</h1>
          {therapist && (
            <p className="ops-page-subtitle">
              {t('therapist.welcome', 'Welcome')}, {therapist.name} · {localize(therapist.title)}
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="therapist-stats-row">
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--pending">
            <CalendarCheck size={24} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{confirmedCount}</span>
            <span className="therapist-stat-label">{t('therapist.upcoming', 'Upcoming')}</span>
          </div>
        </div>
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--active">
            <Activity size={24} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{inProgressCount}</span>
            <span className="therapist-stat-label">{t('therapist.inProgress', 'In Progress')}</span>
          </div>
        </div>
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--done">
            <CheckCircle size={24} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{completedCount}</span>
            <span className="therapist-stat-label">{t('therapist.completed', 'Completed')}</span>
          </div>
        </div>
        <div className="therapist-stat-card">
          <div className="therapist-stat-icon therapist-stat-icon--total">
            <Sparkles size={24} />
          </div>
          <div className="therapist-stat-info">
            <span className="therapist-stat-value">{weekSessions.length}</span>
            <span className="therapist-stat-label">{t('therapist.totalAssigned', 'Total Assigned')}</span>
          </div>
        </div>
      </div>

      {/* Next Session Card */}
      {nextSession && (
        <div className="therapist-next-session">
          <div className="therapist-next-header">
            <Sparkles size={18} />
            <h2>{t('therapist.nextSession', 'Next Session')}</h2>
          </div>
          <div className="therapist-next-card">
            <div className="therapist-next-info">
              <h3>{localize(nextSession.treatmentName)}</h3>
              <div className="therapist-next-meta">
                <span><Clock size={14} /> {nextSession.startTime} — {nextSession.endTime}</span>
                <span><User size={14} /> {nextSession.customerName}</span>
                <span><MapPin size={14} /> {localize(nextSession.roomName)}</span>
              </div>
              {nextSession.customerSpecialRequest && (
                <div className="therapist-next-request">
                  <AlertCircle size={14} />
                  <span>{nextSession.customerSpecialRequest}</span>
                </div>
              )}
            </div>
            <button
              className="ops-confirm-btn"
              onClick={() => navigate(`/therapist/sessions/${nextSession.id}`)}
              id="therapist-view-next"
            >
              {t('therapist.viewDetails', 'View Details')}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="therapist-quick-actions">
        <h2>{t('therapist.quickActions', 'Quick Actions')}</h2>
        <div className="therapist-actions-grid">
          <button
            className="therapist-action-card"
            onClick={() => navigate('/therapist/schedule')}
            id="therapist-go-schedule"
          >
            <CalendarCheck size={24} />
            <span>{t('therapist.dailySchedule', 'Daily Schedule')}</span>
            <ChevronRight size={16} />
          </button>
          {todaySessions.length > 0 && (
            <button
              className="therapist-action-card"
              onClick={() => navigate(`/therapist/sessions/${todaySessions[0].id}`)}
              id="therapist-go-session"
            >
              <Activity size={24} />
              <span>{t('therapist.sessionNotes', 'Session Details & Notes')}</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Today's Schedule Preview */}
      <div className="therapist-today-preview">
        <div className="therapist-preview-header">
          <h2>{t('therapist.todaySchedule', "Today's Schedule")}</h2>
          <button className="ops-link-btn" onClick={() => navigate('/therapist/schedule')}>
            {t('therapist.viewFull', 'View Full Schedule')} <ChevronRight size={14} />
          </button>
        </div>
        {todaySessions.length > 0 ? (
          <div className="therapist-preview-list">
            {todaySessions.map((session) => (
              <div
                key={session.id}
                className={`therapist-preview-item therapist-preview-item--${session.status}`}
                onClick={() => navigate(`/therapist/sessions/${session.id}`)}
                id={`therapist-preview-${session.id}`}
              >
                <div className="therapist-preview-time">
                  <span>{session.startTime}</span>
                  <span className="therapist-preview-end">{session.endTime}</span>
                </div>
                <div className="therapist-preview-info">
                  <span className="therapist-preview-treatment">{localize(session.treatmentName)}</span>
                  <span className="therapist-preview-customer">{session.customerName} · {localize(session.roomName)}</span>
                </div>
                <span className={`spa-status-badge spa-status--${session.status}`}>
                  {session.status === 'confirmed' ? t('therapist.confirmed', 'Confirmed') :
                   session.status === 'completed' ? t('therapist.done', 'Done') :
                   session.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="therapist-preview-empty">
            <CheckCircle size={32} />
            <p>{t('therapist.noSessions', 'No sessions scheduled for today.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
