import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

export const BusinessParametersPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { parameters, updateParameter, resetParameterToDefault } = useGovernance();
  const { showToast } = useToast();

  // Local draft state for parameter inputs
  const [draftValues, setDraftValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    parameters.forEach((p) => {
      initial[p.key] = p.currentValue;
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = (key: string) => {
    const rawVal = draftValues[key];
    const res = updateParameter(key, rawVal);

    if (!res.success) {
      setErrors((prev) => ({ ...prev, [key]: res.error || 'Invalid value' }));
      showToast(res.error || 'Failed to update parameter', 'error');
    } else {
      showToast(t('operations.params.savedToast', 'Parameter successfully updated and logged to audit trail'), 'success');
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleReset = (key: string, defaultValue: number | string) => {
    resetParameterToDefault(key);
    setDraftValues((prev) => ({ ...prev, [key]: defaultValue }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast(t('operations.params.resetToast', 'Parameter restored to system default'), 'info');
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.params.pageTitle', 'Business Parameters & Operational Thresholds')}
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
            {t('operations.params.scopeBadge', 'Configurable Rules')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.params.pageSubtitle', 'Configure operational limits, deposit requirements, cancellation cutoff windows, and statutory batch export timing.')}
        </p>
      </div>

      {/* Non-Bypassable Invariants Banner */}
      <div className="hsw-gov-banner warning">
        <ShieldAlert size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.params.safetyNoticeTitle', 'Strict Business Rule Invariance (Non-Bypassable)')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.params.safetyNoticeDesc', 'Core wellness resort safety controls—including 2D Spa resource matching (Therapist + Room), checkout settlement blocks on unpaid charges, and sensitive health data minimization—are hard-coded architectural invariants and cannot be overridden by parameter modifications.')}
          </span>
        </div>
      </div>

      {/* Parameter Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {parameters.map((param) => {
          const isDirty = String(draftValues[param.key]) !== String(param.currentValue);
          const hasError = !!errors[param.key];

          return (
            <div
              key={param.key}
              className="hsw-gov-card"
              style={{
                marginBottom: 0,
                borderLeft: isDirty ? '3px solid var(--accent-forest)' : '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                {/* Left: Metadata & Description */}
                <div style={{ flex: '1 1 450px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {t(param.labelKey, param.defaultLabel)}
                    </h3>
                    <code style={{ fontSize: '11px', backgroundColor: '#f2f0ea', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                      {param.key}
                    </code>
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-3) 0', lineHeight: 1.5 }}>
                    {t(param.descriptionKey, param.defaultDescription)}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>
                      <strong>{t('operations.params.category', 'Category')}:</strong> {param.category.toUpperCase()}
                    </span>
                    <span>
                      <strong>{t('operations.params.defaultVal', 'Default')}:</strong> {param.defaultValue}{param.unit || ''}
                    </span>
                    {param.min !== undefined && param.max !== undefined && (
                      <span>
                        <strong>{t('operations.params.allowedRange', 'Allowed')}:</strong> {param.min} – {param.max}{param.unit || ''}
                      </span>
                    )}
                    <span>
                      <strong>{t('operations.params.lastUpdated', 'Updated')}:</strong> {param.lastUpdatedAt} by {param.lastUpdatedBy}
                    </span>
                  </div>
                </div>

                {/* Right: Value Input & Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={param.type === 'time' ? 'text' : 'number'}
                      value={draftValues[param.key] ?? ''}
                      onChange={(e) => handleInputChange(param.key, e.target.value)}
                      placeholder={String(param.defaultValue)}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        border: hasError ? '1px solid var(--danger)' : isDirty ? '1px solid var(--accent-forest)' : '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#ffffff',
                        color: 'var(--text-primary)',
                        width: '130px',
                        textAlign: 'right'
                      }}
                      aria-label={t(param.labelKey, param.defaultLabel)}
                    />
                    {param.unit && (
                      <span style={{ marginLeft: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {param.unit}
                      </span>
                    )}
                    {hasError && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', fontSize: '11px', color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                        {errors[param.key]}
                      </div>
                    )}
                  </div>

                  <Button
                    variant={isDirty ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={!isDirty}
                    onClick={() => handleSave(param.key)}
                    icon={<Check size={14} />}
                  >
                    {t('common.actions.save', 'Save')}
                  </Button>

                  <Button
                    variant="tertiary"
                    size="sm"
                    disabled={draftValues[param.key] === param.defaultValue && param.currentValue === param.defaultValue}
                    onClick={() => handleReset(param.key, param.defaultValue)}
                    title={t('operations.params.resetTitle', 'Reset to system default')}
                    icon={<RotateCcw size={13} />}
                  >
                    {t('common.actions.reset', 'Reset')}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
