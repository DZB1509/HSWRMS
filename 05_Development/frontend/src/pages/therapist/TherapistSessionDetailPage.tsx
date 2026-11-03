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
import { useTherapistSessionDetail } from '../../features/m3-spa/hooks/useSpaFeature';
import {
  ChevronLeft,
  Clock,
  User,
  MapPin,
  Calendar,
  HeartHandshake,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  Heart,
  ShieldAlert,
} from 'lucide-react';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';

export const TherapistSessionDetailPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();



  const numericSessionId = id ? Number(id) : null;
  const { detail: session, loading, error, recordOutcome } = useTherapistSessionDetail(numericSessionId);
  if (loading) {
    return <div className="therapist-session-detail"><p style={{ padding: '2rem' }}>Loading session...</p></div>;
  }
  if (error) {
    return <div className="therapist-session-detail"><p style={{ padding: '2rem', color: 'red' }}>Error: {error}</p></div>;
  }

  const [therapistNotes, setTherapistNotes] = useState('');
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);



  const handleAction = async (action: 'complete' | 'no_show') => {
    if (!numericSessionId) return;
    setIsProcessing(true);
    setActionResult(null);

    try {
      const outcome = action === 'complete' ? 'COMPLETED' : 'NO_SHOW';
      await recordOutcome(outcome, therapistNotes || undefined);
      setActionResult({ success: true, message: `Session recorded as ${outcome}` });
    } catch (err: unknown) {
      setActionResult({ success: false, message: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setIsProcessing(false);
    }
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
    <div className="therapist-session-detail" id="screen-33-therapist-session-detail" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <OperationalPageHeader
        title={session.treatmentName}
        subtitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {session.scheduledStartAt ? session.scheduledStartAt.substring(11, 16) : ''} — {session.scheduledEndAt ? session.scheduledEndAt.substring(11, 16) : ''} ({session.durationMinutes} min)</span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {session.roomName}</span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {session.customerFirstName}</span>
          </div>
        }
        badge="Screen #33"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span className={`spa-status-badge spa-status--${session.sessionStatus}`}>
              {session.sessionStatus === 'COMPLETED' && <CheckCircle size={14} />}
              {session.sessionStatus === 'NO_SHOW' && <XCircle size={14} />}
              {session.sessionStatus === 'COMPLETED' ? t('therapist.done', 'Done') :
               session.sessionStatus === 'NO_SHOW' ? t('therapist.noShow', 'No-Show') :
               session.confirmationStatus === 'CONFIRMED' ? t('therapist.confirmed', 'Confirmed') :
               session.sessionStatus}
            </span>
            <button className="hsw-btn hsw-btn-secondary" onClick={() => navigate(-1)} style={{ fontSize: 'var(--text-xs)', minHeight: '36px' }}>
              <ChevronLeft size={14} />
              <span>{t('therapist.back', 'Back')}</span>
            </button>
          </div>
        }
      />

      {/* Main Grid: 70% Left / 30% Right */}
      <div className="therapist-detail-layout">
        {/* Left Column: Information (~70%) */}
        <div className="therapist-detail-main">
          {/* 1. Session Essentials */}
          <section className="therapist-clean-section ops-card" aria-labelledby="session-summary-title" style={{ padding: 'var(--space-5)' }}>
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
                  {new Date(session.scheduledStartAt ? session.scheduledStartAt.substring(0, 10) + 'T00:00:00' : Date.now()).toLocaleDateString('en-US', {
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
                  {session.scheduledStartAt ? session.scheduledStartAt.substring(11, 16) : ''} — {session.scheduledEndAt ? session.scheduledEndAt.substring(11, 16) : ''} ({session.durationMinutes} min)
                </span>
              </div>
              <div className="therapist-kv-divider" />
              <div className="therapist-kv-row">
                <span className="therapist-kv-label">
                  <User size={15} />
                  <span>{t('therapist.customer', 'Customer')}</span>
                </span>
                <span className="therapist-kv-value">{session.customerFirstName}</span>
              </div>
              <div className="therapist-kv-divider" />
              <div className="therapist-kv-row">
                <span className="therapist-kv-label">
                  <MapPin size={15} />
                  <span>{t('therapist.room', 'Treatment Suite')}</span>
                </span>
                <span className="therapist-kv-value">
                  {session.roomName}
                  
                </span>
              </div>
            </div>
          </section>

          {session.customerNote && (
            <section className="therapist-card therapist-card--attention ops-card" aria-labelledby="customer-request-title" style={{ padding: 'var(--space-4)' }}>
              <div className="therapist-alert-header">
                <Heart size={18} />
                <h2 id="customer-request-title" className="therapist-alert-title">
                  {t('therapist.customerRequest', 'Customer Special Request')}
                </h2>
              </div>
              <div className="therapist-alert-body">
                <p>{session.customerNote}</p>
              </div>
            </section>
          )}

          {/* 3. Relevant Treatment Considerations (Privacy-Filtered) */}
          <div className="therapist-wellness-container">
            {/* 3a. Mobility / Movement Considerations */}
            {session.relevantPrecautions && session.relevantPrecautions.length > 0 && (
              <section className="therapist-card therapist-card--attention ops-card" aria-labelledby="mobility-considerations-title" style={{ padding: 'var(--space-4)' }}>
                <div className="therapist-alert-header">
                  <ShieldAlert size={18} />
                  <h2 id="mobility-considerations-title" className="therapist-alert-title">
                    {t('therapist.mobility', 'Mobility Considerations')}
                  </h2>
                </div>
                <div className="therapist-alert-body">
                  <ul className="therapist-attention-list">
                    {session.relevantPrecautions.map((precaution, i) => (
                      <li key={i}>{precaution}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* 3b. Treatment-Relevant Safety Notes */}
            {session.treatmentSafetyNotes && (
              <section className="therapist-clean-section ops-card" aria-labelledby="wellness-profile-title" style={{ padding: 'var(--space-5)' }}>
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

                <div className="therapist-kv-list" style={{ marginTop: 'var(--space-3)' }}>
                  <p style={{ margin: 0, color: 'var(--ops-text-primary)' }}>{session.treatmentSafetyNotes}</p>
                </div>

                {/* Privacy Safeguard Notice */}
                <div className="therapist-privacy-notice" style={{ marginTop: 'var(--space-4)' }}>
                  <Shield size={14} />
                  <span>
                    {t(
                      'therapist.privacyNotice',
                      'Only treatment-relevant health information is displayed. Full medical records, dietary data and personal identifiers are restricted.'
                    )}
                  </span>
                </div>
              </section>
            )}
          </div>

          {/* 5. Therapist Session Notes */}
          {['confirmed', 'in_progress'].includes(session.sessionStatus) && (
            <section className="therapist-clean-section therapist-notes-section ops-card" aria-labelledby="session-notes-title" style={{ padding: 'var(--space-5)' }}>
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
          <div className="therapist-action-panel ops-card" style={{ padding: 'var(--space-5)', position: 'sticky', top: 'calc(var(--space-6) + 60px)' }}>
            <h2 id="action-panel-title" className="therapist-action-panel-title">
              {t('therapist.actions', 'Session Controls')}
            </h2>

            <div className="therapist-action-status-block">
              <span className="therapist-action-status-label">{t('therapist.statusLabel', 'Current Status')}</span>
              <span className={`spa-status-badge spa-status--${session.sessionStatus}`}>
                {session.sessionStatus === 'COMPLETED' && <CheckCircle size={13} />}
                {session.sessionStatus === 'NO_SHOW' && <XCircle size={13} />}
                {session.sessionStatus === 'COMPLETED' ? t('therapist.done', 'Done') :
                 session.sessionStatus === 'NO_SHOW' ? t('therapist.noShow', 'No-Show') :
                 session.confirmationStatus === 'CONFIRMED' ? t('therapist.confirmed', 'Confirmed') :
                 session.sessionStatus}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="therapist-action-buttons">
              {!['COMPLETED', 'NO_SHOW', 'completed', 'no_show'].includes(session.sessionStatus) && (
                <>
                  <button
                    className="therapist-btn-primary"
                    onClick={() => handleAction('complete')}
                    disabled={isProcessing}
                    id="therapist-complete-session"
                  >
                    <CheckCircle size={16} />
                    <span>{isProcessing ? t('therapist.processing', 'Processing...') : t('therapist.markCompleted', 'Mark Completed')}</span>
                  </button>

                  <button
                    className="therapist-btn-destructive"
                    onClick={() => handleAction('no_show')}
                    disabled={isProcessing}
                    id="therapist-mark-noshow"
                  >
                    <XCircle size={16} />
                    <span>{t('therapist.markNoShow', 'Mark No-Show')}</span>
                  </button>
                </>
              )}

              {session.sessionStatus === 'COMPLETED' && (
                <div className="therapist-completed-badge">
                  <CheckCircle size={28} />
                  <span>{t('therapist.sessionCompleted', 'Session Completed')}</span>
                </div>
              )}

              {session.sessionStatus === 'NO_SHOW' && (
                <div className="therapist-completed-badge" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}>
                  <XCircle size={28} />
                  <span>{t('therapist.sessionNoShow', 'Recorded as No-Show')}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

