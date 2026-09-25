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
          <button className="ops-confirm-btn" onClick={() => navigate('/therapist/schedule')}>
            {t('therapist.backToSchedule', 'Back to Schedule')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="therapist-session-detail" id="screen-33-therapist-session-detail">
      <button className="spa-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} />
        <span>{t('therapist.back', 'Back')}</span>
      </button>

      <div className="therapist-detail-layout">
        {/* Main Content */}
        <div className="therapist-detail-main">
          {/* Session Header */}
          <div className="therapist-detail-header">
            <div className="therapist-detail-title">
              <HeartHandshake size={28} />
              <div>
                <h1>{localize(session.treatmentName)}</h1>
                <span className={`spa-status-badge spa-status--${session.status}`}>
                  {session.status === 'confirmed' && <CheckCircle size={14} />}
                  {session.status === 'in_progress' && <Play size={14} />}
                  {session.status === 'completed' && <CheckCircle size={14} />}
                  {session.status}
                </span>
              </div>
            </div>
          </div>

          {/* Session Info Grid */}
          <div className="therapist-info-grid">
            <div className="therapist-info-card">
              <Calendar size={18} />
              <div>
                <span className="therapist-info-label">{t('therapist.date', 'Date')}</span>
                <span className="therapist-info-value">
                  {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="therapist-info-card">
              <Clock size={18} />
              <div>
                <span className="therapist-info-label">{t('therapist.time', 'Time')}</span>
                <span className="therapist-info-value">
                  {session.startTime} — {session.endTime} ({session.durationMinutes} min)
                </span>
              </div>
            </div>
            <div className="therapist-info-card">
              <User size={18} />
              <div>
                <span className="therapist-info-label">{t('therapist.customer', 'Customer')}</span>
                <span className="therapist-info-value">{session.customerName}</span>
              </div>
            </div>
            <div className="therapist-info-card">
              <MapPin size={18} />
              <div>
                <span className="therapist-info-label">{t('therapist.room', 'Treatment Room')}</span>
                <span className="therapist-info-value">
                  {localize(session.roomName)}
                  {room && <span className="therapist-info-sub"> · {room.type}</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Special Request */}
          {session.customerSpecialRequest && (
            <div className="therapist-special-request">
              <Heart size={18} />
              <div>
                <h3>{t('therapist.customerRequest', 'Customer Special Request')}</h3>
                <p>{session.customerSpecialRequest}</p>
              </div>
            </div>
          )}

          {/* PRIVACY-FIRST: Treatment-Relevant Health Notes */}
          {wellnessView && (
            <div className="therapist-wellness-section">
              <div className="therapist-wellness-header">
                <Shield size={18} />
                <h3>{t('therapist.treatmentHealthNotes', 'Treatment-Relevant Health Notes')}</h3>
                <span className="therapist-privacy-badge">
                  {t('therapist.privacyFiltered', 'Privacy-Filtered View')}
                </span>
              </div>
              <div className="therapist-wellness-grid">
                {wellnessView.relevantMedicalConditions.length > 0 && (
                  <div className="therapist-wellness-item">
                    <AlertTriangle size={16} />
                    <div>
                      <span className="therapist-wellness-label">{t('therapist.medicalConditions', 'Relevant Medical Conditions')}</span>
                      <ul>
                        {wellnessView.relevantMedicalConditions.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {wellnessView.mobilityConsiderations && (
                  <div className="therapist-wellness-item">
                    <Activity size={16} />
                    <div>
                      <span className="therapist-wellness-label">{t('therapist.mobility', 'Mobility Considerations')}</span>
                      <p>{wellnessView.mobilityConsiderations}</p>
                    </div>
                  </div>
                )}
                {wellnessView.treatmentPreferences.length > 0 && (
                  <div className="therapist-wellness-item">
                    <Sparkles size={16} />
                    <div>
                      <span className="therapist-wellness-label">{t('therapist.preferences', 'Treatment Preferences')}</span>
                      <ul>
                        {wellnessView.treatmentPreferences.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                <div className="therapist-wellness-item">
                  <Heart size={16} />
                  <div>
                    <span className="therapist-wellness-label">{t('therapist.stressLevel', 'Stress Level')}</span>
                    <span className={`therapist-stress-badge therapist-stress--${wellnessView.stressLevel}`}>
                      {wellnessView.stressLevel}
                    </span>
                  </div>
                </div>
                {wellnessView.therapistNotes && (
                  <div className="therapist-wellness-item therapist-wellness-item--notes">
                    <FileText size={16} />
                    <div>
                      <span className="therapist-wellness-label">{t('therapist.priorNotes', 'Prior Therapist Notes')}</span>
                      <p>{wellnessView.therapistNotes}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="therapist-privacy-notice">
                <Shield size={14} />
                <span>{t('therapist.privacyNotice', 'Only treatment-relevant health information is displayed. Full medical records, dietary data and personal identifiers are restricted.')}</span>
              </div>
            </div>
          )}

          {/* Treatment Contraindications */}
          {treatment && treatment.contraindications.length > 0 && (
            <div className="therapist-contraindications">
              <AlertTriangle size={18} />
              <div>
                <h3>{t('therapist.contraindications', 'Treatment Contraindications')}</h3>
                <ul>
                  {treatment.contraindications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Therapist Notes */}
          {['confirmed', 'in_progress'].includes(session.status) && (
            <div className="therapist-notes-section">
              <h3>
                <FileText size={18} />
                {t('therapist.sessionNotes', 'Session Notes')}
              </h3>
              <textarea
                value={therapistNotes}
                onChange={(e) => setTherapistNotes(e.target.value)}
                placeholder={t('therapist.notesPlaceholder', 'Add your session notes, observations, and recommendations...')}
                rows={4}
                className="therapist-notes-input"
                id="therapist-notes"
              />
            </div>
          )}

          {/* Existing Notes (for completed sessions) */}
          {session.status === 'completed' && session.therapistNotes && (
            <div className="therapist-notes-section therapist-notes-section--readonly">
              <h3>
                <FileText size={18} />
                {t('therapist.sessionNotes', 'Session Notes')}
              </h3>
              <div className="therapist-notes-readonly">{session.therapistNotes}</div>
            </div>
          )}

          {/* Action Result */}
          {actionResult && (
            <div className={`ops-booking-result ${actionResult.success ? 'ops-booking-result--success' : 'ops-booking-result--error'}`}>
              {actionResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
              <span>{actionResult.message}</span>
            </div>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="therapist-detail-sidebar">
          <div className="therapist-action-panel">
            <h3>{t('therapist.actions', 'Actions')}</h3>

            {session.status === 'confirmed' && (
              <button
                className="ops-confirm-btn ops-confirm-btn--full"
                onClick={() => handleAction('start')}
                disabled={isProcessing}
                id="therapist-start-session"
              >
                <Play size={18} />
                {isProcessing ? t('therapist.processing', 'Processing...') : t('therapist.startSession', 'Start Session')}
              </button>
            )}

            {session.status === 'in_progress' && (
              <button
                className="ops-confirm-btn ops-confirm-btn--full ops-confirm-btn--success"
                onClick={() => handleAction('complete')}
                disabled={isProcessing}
                id="therapist-complete-session"
              >
                <CheckCircle size={18} />
                {isProcessing ? t('therapist.processing', 'Processing...') : t('therapist.markCompleted', 'Mark Completed')}
              </button>
            )}

            {['confirmed', 'in_progress'].includes(session.status) && (
              <button
                className="ops-cancel-btn ops-cancel-btn--full"
                onClick={() => handleAction('no_show')}
                disabled={isProcessing}
                id="therapist-mark-noshow"
              >
                <XCircle size={18} />
                {t('therapist.markNoShow', 'Mark No-Show')}
              </button>
            )}

            {session.status === 'completed' && (
              <div className="therapist-completed-badge">
                <CheckCircle size={24} />
                <span>{t('therapist.sessionCompleted', 'Session Completed')}</span>
                {session.completedAt && (
                  <span className="therapist-completed-time">
                    {new Date(session.completedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
