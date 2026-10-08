import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ToggleLeft,
  AlertTriangle,
  ShieldCheck,
  Lock,
  X
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

export const FeatureFlagsPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { featureFlags, toggleFeatureFlag } = useGovernance();
  const { showToast } = useToast();

  const [confirmFlagKey, setConfirmFlagKey] = useState<string | null>(null);

  const flagToConfirm = featureFlags.find((f) => f.key === confirmFlagKey);

  const handleToggleClick = (key: string, impactLevel: 'low' | 'medium' | 'high') => {
    // Show confirmation for high-impact flags
    if (impactLevel === 'high') {
      setConfirmFlagKey(key);
    } else {
      executeToggle(key);
    }
  };

  const executeToggle = (key: string) => {
    toggleFeatureFlag(key);
    const flag = featureFlags.find((f) => f.key === key);
    const willBeEnabled = !flag?.enabled;
    showToast(
      `${t(flag?.nameKey || '', flag?.defaultName || '')}: ${willBeEnabled ? t('common.status.enabled', 'Enabled') : t('common.status.disabled', 'Disabled')}`,
      'info'
    );
    setConfirmFlagKey(null);
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.flags.pageTitle', 'Modular Feature Flags & Operational Toggles')}
          </h1>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '3px 8px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-sand)',
            color: 'var(--text-primary)'
          }}>
            {t('operations.flags.systemScope', 'System Modules')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.flags.pageSubtitle', 'Safely activate or deactivate supported customer self-service modules and automated regulatory compliance export routines.')}
        </p>
      </div>

      {/* Safety Invariants Callout */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.flags.safetyTitle', 'Safety & Privacy Boundaries are Non-Toggleable')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.flags.safetyDesc', 'Core security invariants (such as RBAC data minimization, 2D therapist+room booking validations, and folio settlement checks) are essential architecture controls and are deliberately excluded from feature flag toggles.')}
          </span>
        </div>
      </div>

      {/* Configurable Feature Flags List */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <ToggleLeft size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.flags.modularTitle', 'Configurable Functional Modules')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {featureFlags.filter((f) => f.enabled).length} / {featureFlags.length} {t('operations.flags.activeCount', 'Active')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {featureFlags.map((flag) => {
            const isHighImpact = flag.impactLevel === 'high';

            return (
              <div
                key={flag.key}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: '#faf9f6',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)'
                }}
              >
                {/* Flag Info */}
                <div style={{ flex: '1 1 450px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {t(flag.nameKey, flag.defaultName)}
                    </h3>
                    <code style={{ fontSize: '11px', backgroundColor: '#eeebe3', padding: '1px 5px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                      {flag.key}
                    </code>
                    {isHighImpact && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#fef3e2',
                        color: 'var(--warning)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        textTransform: 'uppercase'
                      }}>
                        {t('operations.flags.highImpact', 'High Impact')}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2) 0', lineHeight: 1.4 }}>
                    {t(flag.descriptionKey, flag.defaultDescription)}
                  </p>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {t('operations.flags.scope', 'Scope')}: <strong style={{ textTransform: 'capitalize' }}>{flag.scope}</strong> · {t('operations.flags.lastModified', 'Modified')}: {flag.lastChangedAt} by {flag.lastChangedBy}
                  </div>
                </div>

                {/* Accessible Switch Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    aria-label={`${t(flag.nameKey, flag.defaultName)}: ${flag.enabled ? t('common.status.enabled', 'Enabled') : t('common.status.disabled', 'Disabled')}`}
                    onClick={() => handleToggleClick(flag.key, flag.impactLevel)}
                    className="hsw-switch-container"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    <div className={`hsw-switch-track ${flag.enabled ? 'is-on' : ''}`}>
                      <div className="hsw-switch-thumb" />
                    </div>
                    <span className={`hsw-switch-label ${flag.enabled ? 'is-on' : ''}`}>
                      {flag.enabled ? t('common.status.enabled', 'ENABLED') : t('common.status.disabled', 'DISABLED')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Architectural Controls Section */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Lock size={18} style={{ color: 'var(--accent-terracotta)' }} />
            {t('operations.flags.immutableTitle', 'Immutable Core Controls (Protected Architecture)')}
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-forest)' }}>
            {t('operations.flags.alwaysEnforced', 'ALWAYS ENFORCED')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-01: Two-Dimensional Spa Allocation</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Prevents double-booking by requiring concurrent availability of both Therapist and Treatment Room.
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-02: Consolidated Folio Settlement Guard</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Blocks checkout finalization while any unpaid extra spa or dining charges remain outstanding.
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-03: Sensitive Data Minimization & RBAC</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Enforces role-based clinical note and dietary tag filtering across all operational personas.
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-06: Manager Least Privilege Separation</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Restricts Manager to executive oversight; administrative actions require explicit scoped delegation.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for High-Impact Toggles */}
      {confirmFlagKey && flagToConfirm && (
        <div className="hsw-modal-overlay">
          <div className="hsw-modal-box">
            <div className="hsw-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                <h3 className="hsw-modal-title">
                  {t('operations.flags.confirmTitle', 'Confirm High-Impact Feature Change')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmFlagKey(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label={t('common.actions.close', 'Close')}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('operations.flags.confirmPrompt', 'You are about to change the operational state of:')}
            </p>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', margin: 'var(--space-3) 0' }}>
              <strong style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                {t(flagToConfirm.nameKey, flagToConfirm.defaultName)}
              </strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {flagToConfirm.key} · Current: <strong>{flagToConfirm.enabled ? 'ENABLED' : 'DISABLED'}</strong> → Target: <strong>{flagToConfirm.enabled ? 'DISABLED' : 'ENABLED'}</strong>
              </span>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {t('operations.flags.confirmAuditNote', 'This state transition will take effect immediately in the prototype and append a timestamped event to the Sensitive Governance Audit Log.')}
            </p>

            <div className="hsw-modal-actions">
              <Button variant="secondary" size="sm" onClick={() => setConfirmFlagKey(null)}>
                {t('common.actions.cancel', 'Cancel')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => executeToggle(confirmFlagKey)}>
                {t('operations.flags.applyToggle', 'Apply State Transition')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
