import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Send } from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { useToast } from '../common/Toast';

interface ResidenceDeclarationSummaryProps {
  onSubmitted?: () => void;
}

export const ResidenceDeclarationSummary: React.FC<ResidenceDeclarationSummaryProps> = ({
  onSubmitted,
}) => {
  const { t } = useTranslation();
  const { arrivals, submitDailyResidenceDeclarations } = useOperations();
  const { showToast } = useToast();

  const checkedInOrArrived = arrivals.filter(
    (a) => a.arrivalStatus === 'checked_in' || a.arrivalStatus === 'arrived'
  );

  const readyCount = checkedInOrArrived.filter((a) => a.residenceDeclarationStatus === 'ready').length;
  const pendingCount = checkedInOrArrived.filter((a) => a.residenceDeclarationStatus === 'pending').length;
  const submittedCount = checkedInOrArrived.filter((a) => a.residenceDeclarationStatus === 'submitted').length;

  const handleSubmitBatch = () => {
    if (readyCount === 0) {
      showToast(t('operations.residenceSummary.noDeclarationsReady', 'No declarations are currently marked ready for submission.'), 'info');
      return;
    }

    const res = submitDailyResidenceDeclarations();
    showToast(res.message, 'success');
    if (onSubmitted) onSubmitted();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) var(--space-5)',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--accent-sand-soft)',
            color: 'var(--accent-forest)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldCheck size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('operations.arrivals.residenceSummary', 'Daily Residence Reporting')}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--bg-soft)',
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
              }}
            >
              {t('operations.residenceSummary.prototypeMock', 'Prototype Operational Mock')}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {t('operations.residenceSummary.complianceNotice', 'Daily customer accommodation reporting required for immigration compliance (Law on Foreigners 2014 & Decree 13).')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#E8F5E9',
              color: '#1B5E20',
              fontWeight: 600,
              border: '1px solid #C8E6C9',
            }}
          >
            {t('operations.residenceSummary.readyPill', { count: readyCount, defaultValue: `${readyCount} Ready` })}
          </span>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#FFF8E1',
              color: '#8C5400',
              fontWeight: 600,
              border: '1px solid #FFE082',
            }}
          >
            {t('operations.residenceSummary.pendingInfoPill', { count: pendingCount, defaultValue: `${pendingCount} Pending Info` })}
          </span>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#F3E5F5',
              color: '#4A148C',
              fontWeight: 600,
              border: '1px solid #E1BEE7',
            }}
          >
            {t('operations.residenceSummary.submittedPill', { count: submittedCount, defaultValue: `${submittedCount} Submitted` })}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmitBatch}
          disabled={readyCount === 0}
          className="hsw-btn hsw-btn-secondary"
          style={{
            fontSize: 'var(--text-xs)',
            minHeight: '36px',
            padding: '0 var(--space-3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title={readyCount === 0 ? 'No declarations currently ready' : 'Submit all completed declarations'}
        >
          <Send size={13} />
          <span>{t('operations.arrivals.submitAllReady', 'Submit Ready Declarations (Batch)')}</span>
        </button>
      </div>
    </div>
  );
};
