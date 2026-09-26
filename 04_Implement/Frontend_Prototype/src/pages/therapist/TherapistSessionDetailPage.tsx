/**
 * Screen #33 — Therapist Session Detail
 * Displays assigned session details and ONLY treatment-relevant health notes.
 * Allows Therapist to mark session as Completed or No-Show.
 *
 * PRIVACY RULE: Therapist sees ONLY treatment-relevant wellness data
 * via getTherapistRelevantWellnessInfo(). No full medical records,
 * no food allergies, no dietary data, no PII beyond first name.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import {
  ChevronLeft,
  Clock,
  User,
  MapPin,
  Calendar,
  HeartHandshake,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Play,
  FileText,
  Sparkles,
  Activity,
  Heart,
  ShieldAlert,
} from 'lucide-react';
import type { LocalizedString } from '../../types/spa';

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

export const TherapistSessionDetailPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const {
    getSessionById,
    getTreatmentById,
    getRoomById,
    startSession,
    completeSession,
    markNoShow,
    getTherapistRelevantWellnessInfo,
  } = useSpa();

  const session = id ? getSessionById(id) : undefined;
  const treatment = session ? getTreatmentById(session.treatmentId) : undefined;
  const room = session ? getRoomById(session.roomId) : undefined;
  const wellnessView = session
    ? getTherapistRelevantWellnessInfo(session.customerId, session.treatmentId)
    : null;

  const localize = (ls: LocalizedString) => useLocalized(ls);

  const [therapistNotes, setTherapistNotes] = useState(session?.therapistNotes || '');
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action: 'start' | 'complete' | 'no_show') => {
    if (!session) return;
    setIsProcessing(true);
    setTimeout(() => {
      let result: { success: boolean; message: string };
      switch (action) {
        case 'start':
          result = startSession(session.id);
          break;
        case 'complete':
          result = completeSession(session.id, therapistNotes || undefined);
          break;
        case 'no_show':
          result = markNoShow(session.id);
          break;
      }
      setActionResult(result);
      setIsProcessing(false);
    }, 500);
  };

  if (!session) {
    return (
      <div className="therapist-session-detail" id="screen-33-therapist-session-detail">
        <div className="therapist-session-empty">
          <HeartHandshake size={48} />
          <h2>{t('therapist.sessionNotFound', 'Session not found')}</h2>
          <button className="hsw-btn hsw-btn-primary" onClick={() => navigate('/therapist/schedule')}>
            {t('therapist.backToSchedule', 'Back to Schedule')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="therapist-session-detail" id="screen-33-therapist-session-detail">
      {/* Back Link */}
      <button className="spa-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
        <ChevronLeft size={18} />
        <span>{t('therapist.back', 'Back')}</span>
      </button>

      {/* Top Header Section */}
      <header className="therapist-detail-top-header">
        <div className="therapist-detail-title-row">
          <div className="therapist-detail-title-left">
            <h1>{localize(session.treatmentName)}</h1>
            <div className="therapist-detail-subtitle">
              <span><Clock size={14} /> {session.startTime} — {session.endTime} ({session.durationMinutes} min)</span>
              <span>·</span>
              <span><MapPin size={14} /> {localize(session.roomName)}{room ? ` (${room.type})` : ''}</span>
              <span>·</span>
              <span><User size={14} /> {session.customerName}</span>
            </div>
          </div>
          <div className="therapist-detail-title-right">
            <span className={`spa-status-badge spa-status--${session.status}`}>
              {session.status === 'confirmed' && <CheckCircle size={14} />}
              {session.status === 'in_progress' && <Activity size={14} />}
              {session.status === 'completed' && <CheckCircle size={14} />}
              {session.status === 'no_show' && <XCircle size={14} />}
              {session.status === 'confirmed' ? t('therapist.confirmed', 'Confirmed') :
               session.status === 'in_progress' ? t('therapist.inProgress', 'In Progress') :
               session.status === 'completed' ? t('therapist.done', 'Done') :
               session.status === 'no_show' ? t('therapist.noShow', 'No-Show') :
               session.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid: 70% Left / 30% Right */}
      <div className="therapist-detail-layout">
        {/* Left Column: Information (~70%) */}
        <div className="therapist-detail-main">
          {/* 1. Session Essentials (Clean section with dividers, label/value rows — no nested cards) */}
          <section className="therapist-clean-section" aria-labelledby="session-summary-title">
            <div className="therapist-clean-section-header">
              <h2 id="session-summary-title" className="therapist-clean-title">
                <Calendar size={18} />
                <span>{t('therapist.sessionSummary', 'Session Information')}</span>
              </h2>
            </div>
            <div className="therapist-kv-list">
              <div className="therapist-kv-row">
                <span className="therapist-kv-label">
                  <Calendar size={15} />
                  <span>{t('therapist.date', 'Date')}</span>
                </span>
                <span className="therapist-kv-value">
                  {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="therapist-kv-divider" />
              <div className="therapist-kv-row">
                <span className="therapist-kv-label">
                  <Clock size={15} />
                  <span>{t('therapist.time', 'Time & Duration')}</span>
                </span>
                <span className="therapist-kv-value">
                  {session.startTime} — {session.endTime} ({session.durationMinutes} min)
                </span>
              </div>
              <div className="therapist-kv-divider" />
              <div className="therapist-kv-row">
                <span className="therapist-kv-label">
                  <User size={15} />
                  <span>{t('therapist.customer', 'Customer')}</span>
                </span>
                <span className="therapist-kv-value">{session.customerName}</span>
              </div>
              <div className="therapist-kv-divider" />
              <div className="therapist-kv-row">
                <span className="therapist-kv-label">
                  <MapPin size={15} />
                  <span>{t('therapist.room', 'Treatment Suite')}</span>
                </span>
                <span className="therapist-kv-value">
                  {localize(session.roomName)}
                  {room && <span className="therapist-info-sub"> · {room.type}</span>}
                </span>
              </div>
            </div>
          </section>

          {/* 2. Customer Treatment Request (Emphasized Container) */}
          {session.customerSpecialRequest && (
            <section className="therapist-card therapist-card--attention" aria-labelledby="customer-request-title">
              <div className="therapist-alert-header">
                <Heart size={18} />
                <h2 id="customer-request-title" className="therapist-alert-title">
                  {t('therapist.customerRequest', 'Customer Special Request')}
                </h2>
              </div>
              <div className="therapist-alert-body">
                <p>{session.customerSpecialRequest}</p>
              </div>
            </section>
          )}

          {/* 3. Relevant Treatment Considerations (Privacy-Filtered) */}
          {wellnessView && (
            <div className="therapist-wellness-container">
              {/* 3a. Important Health Consideration / Medical Flag (Emphasized Container) */}
              {wellnessView.relevantMedicalConditions.length > 0 && (
                <section className="therapist-card therapist-card--attention" aria-labelledby="medical-conditions-title">
                  <div className="therapist-alert-header">
                    <ShieldAlert size={18} />
                    <h2 id="medical-conditions-title" className="therapist-alert-title">
                      {t('therapist.medicalConditions', 'Relevant Medical Considerations')}
                    </h2>
                  </div>
                  <div className="therapist-alert-body">
                    <ul className="therapist-attention-list">
                      {wellnessView.relevantMedicalConditions.map((condition, i) => (
                        <li key={i}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* 3b. Normal Considerations (Clean section, dividers, label/value rows — no nested cards) */}
              <section className="therapist-clean-section" aria-labelledby="wellness-profile-title">
                <div className="therapist-clean-section-header">
                  <h2 id="wellness-profile-title" className="therapist-clean-title">
                    <Shield size={18} />
                    <span>{t('therapist.treatmentHealthNotes', 'Treatment-Relevant Wellness Notes')}</span>
                  </h2>
                  <span className="therapist-privacy-chip">
                    <Shield size={12} />
                    {t('therapist.privacyFiltered', 'Privacy-Filtered View')}
                  </span>
                </div>

                <div className="therapist-kv-list">
                  {/* Mobility Considerations */}
                  {wellnessView.mobilityConsiderations && (
                    <>
                      <div className="therapist-kv-row">
                        <span className="therapist-kv-label">
                          <Activity size={15} />
                          <span>{t('therapist.mobility', 'Mobility Considerations')}</span>
                        </span>
                        <span className="therapist-kv-value">{wellnessView.mobilityConsiderations}</span>
                      </div>
                      <div className="therapist-kv-divider" />
                    </>
                  )}

                  {/* Treatment Preferences */}
                  {wellnessView.treatmentPreferences.length > 0 && (
                    <>
                      <div className="therapist-kv-row">
                        <span className="therapist-kv-label">
                          <Sparkles size={15} />
                          <span>{t('therapist.preferences', 'Preferences')}</span>
                        </span>
                        <span className="therapist-kv-value">
                          {wellnessView.treatmentPreferences.join(', ')}
                        </span>
                      </div>
                      <div className="therapist-kv-divider" />
                    </>
                  )}

                  {/* Stress Level */}
                  <div className="therapist-kv-row">
                    <span className="therapist-kv-label">
                      <Heart size={15} />
                      <span>{t('therapist.stressLevel', 'Stress Level')}</span>
                    </span>
                    <span className="therapist-kv-value">
                      <span className={`therapist-stress-badge therapist-stress--${wellnessView.stressLevel}`}>
                        {wellnessView.stressLevel}
                      </span>
                    </span>
                  </div>

                  {/* Prior Therapist Notes */}
                  {wellnessView.therapistNotes && (
                    <>
                      <div className="therapist-kv-divider" />
                      <div className="therapist-kv-row therapist-kv-row--vertical">
                        <span className="therapist-kv-label">
                          <FileText size={15} />
                          <span>{t('therapist.priorNotes', 'Prior Therapist Notes')}</span>
                        </span>
                        <p className="therapist-prior-notes-text">
                          "{wellnessView.therapistNotes}"
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Privacy Safeguard Notice */}
                <div className="therapist-privacy-notice">
                  <Shield size={14} />
                  <span>
                    {t(
                      'therapist.privacyNotice',
                      'Only treatment-relevant health information is displayed. Full medical records, dietary data and personal identifiers are restricted.'
                    )}
                  </span>
                </div>
              </section>
            </div>
          )}

          {/* 4. Contraindications / Safety Notes (Emphasized Container) */}
          {treatment && treatment.contraindications.length > 0 && (
            <section className="therapist-card therapist-card--warning" aria-labelledby="contraindications-title">
              <div className="therapist-alert-header">
                <AlertTriangle size={18} />
                <h2 id="contraindications-title" className="therapist-alert-title">
                  {t('therapist.contraindications', 'Treatment Contraindications & Safety Alerts')}
                </h2>
              </div>
              <div className="therapist-alert-body">
                <ul className="therapist-contraindication-list">
                  {treatment.contraindications.map((contraindication, i) => (
                    <li key={i}>{contraindication}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* 5. Therapist Session Notes */}
          {['confirmed', 'in_progress'].includes(session.status) && (
            <section className="therapist-clean-section therapist-notes-section" aria-labelledby="session-notes-title">
              <h2 id="session-notes-title" className="therapist-clean-title">
                <FileText size={18} />
                <span>{t('therapist.sessionNotes', 'Therapist Session Notes')}</span>
              </h2>
              <p className="therapist-notes-hint">
                {t('therapist.notesHint', 'Record observations, customer response, and post-session recommendations.')}
              </p>
              <textarea
                value={therapistNotes}
                onChange={(e) => setTherapistNotes(e.target.value)}
                placeholder={t('therapist.notesPlaceholder', 'Add your session notes, observations, and recommendations...')}
                rows={4}
                className="therapist-notes-input"
                id="therapist-notes"
              />
            </section>
          )}

          {/* Existing Read-only Notes (for completed sessions) */}
          {session.status === 'completed' && session.therapistNotes && (
            <section className="therapist-clean-section therapist-notes-section" aria-labelledby="readonly-notes-title">
              <h2 id="readonly-notes-title" className="therapist-clean-title">
                <FileText size={18} />
                <span>{t('therapist.sessionNotes', 'Recorded Session Notes')}</span>
              </h2>
              <div className="therapist-notes-readonly">
                <p>{session.therapistNotes}</p>
              </div>
            </section>
          )}

          {/* Action Result Notification */}
          {actionResult && (
            <div
              className={`ops-booking-result ${
                actionResult.success ? 'ops-booking-result--success' : 'ops-booking-result--error'
              }`}
            >
              {actionResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
              <span>{actionResult.message}</span>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Operational Action Panel (~30%) */}
        <aside className="therapist-detail-sidebar" aria-labelledby="action-panel-title">
          <div className="therapist-action-panel">
            <h2 id="action-panel-title" className="therapist-action-panel-title">
              {t('therapist.actions', 'Session Controls')}
            </h2>

            <div className="therapist-action-status-block">
              <span className="therapist-action-status-label">{t('therapist.statusLabel', 'Current Status')}</span>
              <span className={`spa-status-badge spa-status--${session.status}`}>
                {session.status === 'confirmed' && <CheckCircle size={13} />}
                {session.status === 'in_progress' && <Activity size={13} />}
                {session.status === 'completed' && <CheckCircle size={13} />}
                {session.status === 'no_show' && <XCircle size={13} />}
                {session.status === 'confirmed' ? t('therapist.confirmed', 'Confirmed') :
                 session.status === 'in_progress' ? t('therapist.inProgress', 'In Progress') :
                 session.status === 'completed' ? t('therapist.done', 'Done') :
                 session.status === 'no_show' ? t('therapist.noShow', 'No-Show') :
                 session.status}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="therapist-action-buttons">
              {session.status === 'confirmed' && (
                <button
                  className="therapist-btn-primary"
                  onClick={() => handleAction('start')}
                  disabled={isProcessing}
                  id="therapist-start-session"
                >
                  <Play size={16} />
                  <span>{isProcessing ? t('therapist.processing', 'Processing...') : t('therapist.startSession', 'Start Session')}</span>
                </button>
              )}

              {session.status === 'in_progress' && (
                <button
                  className="therapist-btn-primary"
                  onClick={() => handleAction('complete')}
                  disabled={isProcessing}
                  id="therapist-complete-session"
                >
                  <CheckCircle size={16} />
                  <span>{isProcessing ? t('therapist.processing', 'Processing...') : t('therapist.markCompleted', 'Mark Completed')}</span>
                </button>
              )}

              {['confirmed', 'in_progress'].includes(session.status) && (
                <button
                  className="therapist-btn-destructive"
                  onClick={() => handleAction('no_show')}
                  disabled={isProcessing}
                  id="therapist-mark-noshow"
                >
                  <XCircle size={16} />
                  <span>{t('therapist.markNoShow', 'Mark No-Show')}</span>
                </button>
              )}

              {session.status === 'completed' && (
                <div className="therapist-completed-badge">
                  <CheckCircle size={28} />
                  <span>{t('therapist.sessionCompleted', 'Session Completed')}</span>
                  {session.completedAt && (
                    <span className="therapist-completed-time">
                      {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

