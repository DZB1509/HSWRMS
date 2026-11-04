import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { useToast } from '../../components/common/Toast';
import { grantConsent, listMyConsents } from '../../api/health/consentApi';
import { AppApiError } from '../../api/errors/apiError';
import { useAuth } from '../../app/providers/AuthProvider';
import { ShieldCheck, ArrowLeft, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

interface ConsentSection {
  title: string;
  items: string[];
}

const formatDateTime = (iso: string | null): string => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

export const HealthConsentPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [params] = useSearchParams();
  const reviewMode = params.get('mode') === 'review';

  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedVersion, setConfirmedVersion] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [consentPhase, setConsentPhase] = useState<'loading' | 'active' | 'none' | 'error'>('loading');
  const [reloadSeq, setReloadSeq] = useState(0);
  const submittingRef = useRef(false);

  const sectionsRaw = t('customer.healthProfile.consentPageSections', { returnObjects: true }) as unknown;
  const sections: ConsentSection[] = Array.isArray(sectionsRaw) ? (sectionsRaw as ConsentSection[]) : [];

  useEffect(() => {
    let cancelled = false;
    setConsentPhase('loading');
    listMyConsents().then((r) => {
      if (cancelled) return;
      const rec = r.data.find((c) => c.consentType === 'HEALTH_DATA_PROCESSING' && c.active);
      if (rec) { setConfirmedVersion(rec.policyVersion); setConfirmedAt(rec.grantedAt); setConsentPhase('active'); }
      else { setConsentPhase('none'); }
    }).catch(() => { if (!cancelled) setConsentPhase('error'); });
    return () => { cancelled = true; };
  }, [reloadSeq]);

  const displayVersion = confirmedVersion ?? 'v1.2';
  const goBack = (): void => { navigate('/customer/health-profile'); };

  const handleAgree = async (): Promise<void> => {
    if (!checked || isSubmitting || submittingRef.current) return;
    if (consentPhase === 'active') return; // already consented - never re-confirm
    if (consentPhase !== 'none') return; // only allow when there is no active consent
    if (!currentUser?.id) { setError(t('customer.healthProfile.consentPageNotLoggedIn', 'You must be signed in to confirm consent.')); return; }
    submittingRef.current = true;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await grantConsent({ consentType: 'HEALTH_DATA_PROCESSING' });
      if (res && res.data && res.data.active === true && res.data.granted === true) {
        showToast(t('customer.healthProfile.consentPageSuccess', 'Health data consent recorded.'), 'success');
        navigate('/customer/health-profile', { replace: true });
      } else {
        const msg = t('customer.healthProfile.consentPageInvalidResponse', 'The server did not confirm consent. Please try again.');
        setError(msg); showToast(msg, 'error');
      }
    } catch (e) {
      const msg = e instanceof AppApiError ? e.message : t('customer.healthProfile.consentPageError', 'Could not record consent. Please try again.');
      setError(msg); showToast(msg, 'error');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hsw-health-consent-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.healthProfile.consentPageBadge', 'Privacy & Data Protection')}
          title={t('customer.healthProfile.consentPageTitle', 'Health Data Processing Consent Agreement')}
          subtitle={t('customer.healthProfile.consentPageSubtitle', 'HEALTH DATA PROCESSING & CONSENT AGREEMENT')}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-4)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-forest)', backgroundColor: 'var(--accent-sand-soft)', border: '1px solid var(--accent-sand)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
            <Lock size={13} />
            {t('customer.healthProfile.consentPageVersionTemplate', 'Consent Agreement - {{version}}', { version: displayVersion })}
          </span>
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={15} />} onClick={goBack}>
            {t('customer.healthProfile.consentPageBack', 'Back to Health Profile')}
          </Button>
        </div>

        <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-warning)', border: '1px solid var(--border-warning)', color: 'var(--text-warning)', fontSize: 'var(--text-xs)', lineHeight: 1.6, marginBottom: 'var(--space-5)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{t('customer.healthProfile.consentPageDisclaimer', 'This is a business draft for the team to confirm; it is not a legally approved document.')}</span>
        </div>

        {consentPhase === 'loading' ? (
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-muted, var(--surface))', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
            {t('customer.healthProfile.consentPageLoading', 'Loading consent status...')}
          </div>
        ) : null}

        {consentPhase === 'error' ? (
          <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-bg, var(--surface-warning))', border: '1px solid var(--border-warning)', color: 'var(--danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
            <div>{t('customer.healthProfile.consentPageLoadError', 'Could not load your consent status. Please try again.')}</div>
            <Button variant="secondary" size="sm" onClick={() => setReloadSeq((s) => s + 1)} style={{ marginTop: '8px' }}>
              {t('customer.healthProfile.consentPageRetry', 'Retry')}
            </Button>
          </div>
        ) : null}

        {consentPhase === 'active' ? (
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-sand-soft)', border: '1px solid var(--accent-sand)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--accent-forest)', flexShrink: 0 }} />
            <span>{t('customer.healthProfile.consentPageReviewBanner', 'You confirmed consent version {{version}} on {{when}}.', { version: confirmedVersion ?? 'v1.2', when: formatDateTime(confirmedAt) || '-' })}</span>
          </div>
        ) : null}

        {consentPhase === 'none' && reviewMode ? (
          <div role="alert" style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-warning)', border: '1px solid var(--border-warning)', color: 'var(--text-warning)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{t('customer.healthProfile.consentPageReviewNotFound', 'No active health-data consent was found.')}</span>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {sections.map((sec, idx) => (
            <section key={idx} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md, 1.05rem)', fontWeight: 600, margin: '0 0 var(--space-3) 0', color: 'var(--text-primary)' }}>
                {sec.title}
              </h2>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(Array.isArray(sec.items) ? sec.items : []).map((item, i) => (
                  <li key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {(consentPhase === 'none' && !reviewMode) ? (
          <div style={{ marginTop: 'var(--space-6)', backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-card)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: '3px' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {t('customer.healthProfile.consentPageCheckbox', 'I confirm that I have read, understood, and voluntarily agree to this Health Data Processing Agreement.')}
              </span>
            </label>
            {error ? (
              <div role="alert" style={{ marginTop: 'var(--space-3)', color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</div>
            ) : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="primary" size="lg" icon={<ShieldCheck size={16} />} isLoading={isSubmitting} disabled={!checked || isSubmitting} onClick={handleAgree}>
                {isSubmitting ? t('customer.healthProfile.consentPageSubmitting', 'Recording...') : t('customer.healthProfile.consentPageAgree', 'Agree and confirm')}
              </Button>
              <Button type="button" variant="secondary" size="lg" disabled={isSubmitting} onClick={goBack}>
                {t('customer.healthProfile.consentPageDecline', 'Decline')}
              </Button>
            </div>
            {!checked ? (
              <p style={{ margin: 'var(--space-3) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {t('customer.healthProfile.consentPageAgreeHint', 'Please read the agreement and tick the confirmation box to enable the Agree button.')}
              </p>
            ) : null}
          </div>
        ) : null}
      </Container>
    </div>
  );
};


