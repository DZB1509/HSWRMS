import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client/apiClient';
import { useAuth } from '../../hooks/useAuth';

interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  message: string;
  data: T;
}

interface HealthReadinessData {
  totalProfiles: number;
  completedProfiles: number;
  incompleteProfiles: number;
  activeConsents: number;
  pendingConsents: number;
  completionRate: number;
}

type KpiKey =
  | 'totalHealthProfiles'
  | 'completedProfiles'
  | 'incompleteProfiles'
  | 'activeConsents'
  | 'pendingConsents'
  | 'completionRate';

const KPI_KEYS: KpiKey[] = [
  'totalHealthProfiles',
  'completedProfiles',
  'incompleteProfiles',
  'activeConsents',
  'pendingConsents',
  'completionRate',
];

const TITLE_KEY = 'operations.sidebar.managerHealthReadiness.title';
const SUBTITLE_KEY = 'operations.sidebar.managerHealthReadiness.subtitle';
const SECTION_KEY = 'operations.sidebar.managerHealthReadiness.sections';

export const ManagerHealthReadinessPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HealthReadinessData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHealthReadiness = async () => {
      if (!currentUser) {
        setError('You do not have permission to view this report.');
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get<ApiResponse<HealthReadinessData>>('/manager/health-readiness');
        if (cancelled) return;

        if (!res.success) {
          throw new Error(res.message || 'Unknown error');
        }

        setData(res.data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load health-readiness report:', err);
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Unable to load the health readiness report.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHealthReadiness();

    return () => {
      cancelled = true;
    };
    // Reload only when the signed-in user changes; t() is evaluated at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const pageStyle: React.CSSProperties = { padding: 'var(--space-6) var(--space-8)' };
  const kpiValueStyle: React.CSSProperties = { fontSize: 'var(--text-2xl)', color: 'var(--accent-forest)' };
  const backLinkStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--actor-manager)',
    color: 'var(--actor-manager-text)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    textDecoration: 'none',
  };

  const kpiValue = (key: KpiKey): string => {
    const values: Record<KpiKey, number> = {
      totalHealthProfiles: data?.totalProfiles ?? 0,
      completedProfiles: data?.completedProfiles ?? 0,
      incompleteProfiles: data?.incompleteProfiles ?? 0,
      activeConsents: data?.activeConsents ?? 0,
      pendingConsents: data?.pendingConsents ?? 0,
      completionRate: data?.completionRate ?? 0,
    };
    return key === 'completionRate' ? `${values[key].toFixed(1)}%` : String(values[key]);
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div className="hsw-gov-header">
          <h1 className="hsw-gov-title">
            {t(TITLE_KEY, 'Health & Wellness Readiness')}
          </h1>
          <p className="hsw-gov-subtitle">
            {t(SUBTITLE_KEY, 'Monitor customer health-profile completion and consent readiness across the resort.')}
          </p>
        </div>
        <div className="hsw-gov-grid">
          {KPI_KEYS.map((key) => (
            <div className="hsw-gov-kpi" key={`loading-kpi-${key}`}>
              <span className="hsw-gov-kpi-label">{t('loading', 'Loading...')}</span>
              <span className="hsw-gov-kpi-val" style={kpiValueStyle}>
                {t('loading', 'Loading...')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div className="hsw-gov-header">
          <h1 className="hsw-gov-title">
            {t(TITLE_KEY, 'Health & Wellness Readiness')}
          </h1>
          <p className="hsw-gov-subtitle">
            {t(SUBTITLE_KEY, 'Monitor customer health-profile completion and consent readiness across the resort.')}
          </p>
        </div>
        <div className="hsw-gov-card">
          <p style={{ margin: 0, color: 'var(--danger, #b91c1c)', fontWeight: 600 }}>
            {error}
          </p>
          <Link to="/manager/dashboard" style={{ ...backLinkStyle, marginTop: 'var(--space-3)' }}>
            {t('actions.back', 'Back to Dashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div className="hsw-gov-header">
        <h1 className="hsw-gov-title">
          {t(TITLE_KEY, 'Health & Wellness Readiness')}
        </h1>
        <p className="hsw-gov-subtitle">
          {t(SUBTITLE_KEY, 'Monitor customer health-profile completion and consent readiness across the resort.')}
        </p>
      </div>

      <div className="hsw-gov-grid">
        {KPI_KEYS.map((key) => (
          <div className="hsw-gov-kpi" key={key}>
            <span className="hsw-gov-kpi-label">
              {t(`operations.sidebar.managerHealthReadiness.kpi.${key}`)}
            </span>
            <span className="hsw-gov-kpi-val" style={kpiValueStyle}>
              {kpiValue(key)}
            </span>
          </div>
        ))}
      </div>

      <div className="hsw-gov-card" style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="hsw-gov-card-title">
          {t(`${SECTION_KEY}.profileReadinessOverview`, 'Profile Readiness Overview')}
        </h2>
        <h3 style={{ marginBottom: 'var(--space-3)', marginTop: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>
          {t('operations.sidebar.managerHealthReadiness.overview', 'Profile readiness overview')}
        </h3>
        <ul style={{ margin: 0, paddingLeft: 'var(--space-3)' }}>
          <li>
            {t('operations.sidebar.managerHealthReadiness.criteria.consentConfirmed', 'Customer has confirmed consent for health data processing')}
          </li>
          <li>
            {t('operations.sidebar.managerHealthReadiness.criteria.allergiesDeclared', 'Allergies declared, or confirmed none')}
          </li>
          <li>
            {t('operations.sidebar.managerHealthReadiness.criteria.dietaryDeclared', 'Dietary needs declared, or confirmed none')}
          </li>
        </ul>
      </div>

      <div className="hsw-gov-card" style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="hsw-gov-card-title">
          {t(`${SECTION_KEY}.operationalExplanation`, 'Operational Explanation')}
        </h2>
        <p style={{ margin: 'var(--space-3) 0', lineHeight: 1.5 }}>
          {t('operations.sidebar.managerHealthReadiness.explanation', 'Operational explanation')}
        </p>
      </div>

      <div className="hsw-gov-card" style={{ marginTop: 'var(--space-4)', textAlign: 'right' }}>
        <Link to="/manager/dashboard" style={backLinkStyle}>
          {t('actions.back', 'Back to Dashboard')}
        </Link>
      </div>
    </div>
  );
};
