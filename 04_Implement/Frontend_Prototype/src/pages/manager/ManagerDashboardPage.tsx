import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Users2,
  Activity,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { useFolio } from '../../context/FolioContext';
import { useGovernance } from '../../hooks/useGovernance';
import { formatVND } from '../../i18n';

export const ManagerDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation(['operations', 'common']);
  const { getRevenueAnalytics, getOccupancyAnalytics, getTherapistUtilizationAnalytics } = useFolio();
  const { activeDelegations, permissionRules } = useGovernance();

  // M5 Validated Single Source of Truth selectors
  const revenue = getRevenueAnalytics();
  const occupancy = getOccupancyAnalytics();
  const therapists = getTherapistUtilizationAnalytics();

  // Find active delegation for Manager
  const activeManagerDelegation = activeDelegations.find((d) => d.delegateRole === 'manager');

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.managerDashboard.title', 'Executive Management Oversight Cockpit')}
          </h1>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '3px 8px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--actor-manager)',
            color: 'var(--actor-manager-text)'
          }}>
            {t('topbar.managerScope', 'Manager Limited Scope')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.managerDashboard.subtitle', 'High-level operational overview summarizing revenue realization, sanctuary villa occupancy, and therapy practitioner workload.')}
        </p>
      </div>

      {/* Temporary Delegated Authority Banner (If Active) */}
      {activeManagerDelegation && (
        <div className="hsw-gov-banner" style={{ borderLeftColor: '#1a6b68', backgroundColor: '#f0f9f8' }}>
          <Sparkles size={18} style={{ color: '#1a6b68', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <strong style={{ color: '#1a6b68', fontSize: 'var(--text-sm)' }}>
                {t('operations.managerDashboard.delegationActiveTitle', 'Temporary Delegated Authority Active')}
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {t('operations.managerDashboard.expires', 'Expires')}: <strong>{activeManagerDelegation.expiresAt}</strong>
              </span>
            </div>
            <p style={{ margin: '4px 0 var(--space-2) 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {t('operations.managerDashboard.delegationDesc', 'Administrator Alexander Wright has temporarily authorized you with the following scoped operational capabilities:')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {activeManagerDelegation.capabilities.map((c) => {
                const rule = permissionRules.find((r) => r.capability === c);
                const linkPath = c === 'configure_business_parameters' ? '/admin/business-params'
                  : c === 'manage_feature_flags' ? '/admin/feature-flags'
                  : '/manager/system-overview';

                return (
                  <Link
                    key={c}
                    to={linkPath}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #7fc1be',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#1a6b68',
                      textDecoration: 'none'
                    }}
                  >
                    <Sparkles size={11} />
                    {rule ? t(rule.nameKey, rule.defaultName) : c}
                    <ArrowRight size={11} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Validated Executive KPI Summary (Single Source of Truth) */}
      <div className="hsw-gov-grid">
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('manager.revenue.totalRevenue', 'Total Revenue')}
          </span>
          <span className="hsw-gov-kpi-val" style={{ fontSize: 'var(--text-2xl)', color: 'var(--accent-forest)' }}>
            {formatVND(revenue.totalRevenue, i18n.language)}
          </span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.managerDashboard.revenueSub', 'Consolidated across Package, Spa & Dining')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('manager.occupancy.rate', 'Occupancy Rate')}
          </span>
          <span className="hsw-gov-kpi-val">{occupancy.occupancyRate}%</span>
          <span className="hsw-gov-kpi-sub">
            {occupancy.occupiedCount} / {occupancy.totalVillas} {t('operations.managerDashboard.villasOccupied', 'villas occupied')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('manager.therapists.totalPractitioners', 'Active Practitioners')}
          </span>
          <span className="hsw-gov-kpi-val">{therapists.totalTherapists}</span>
          <span className="hsw-gov-kpi-sub">
            {therapists.totalBookedMinutes} {t('manager.therapists.axisMinutes', 'minutes booked')} ({therapists.totalScheduledSessions} sessions)
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.managerDashboard.activeStays', 'In-House Stays')}
          </span>
          <span className="hsw-gov-kpi-val">{occupancy.occupiedCount}</span>
          <span className="hsw-gov-kpi-sub">
            {occupancy.reservedCount} {t('manager.occupancy.reserved', 'reserved for arrival')}
          </span>
        </div>
      </div>

      {/* Authorized Management Reports Navigation */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <LayoutDashboard size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.managerDashboard.authorizedReports', 'Authorized Management Reporting & Analytics')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('operations.managerDashboard.readOnlyOversight', 'Executive Oversight · Read-Only Access')}
          </span>
        </div>

        <div className="hsw-quicknav-grid">
          <Link to="/manager/revenue" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <BarChart3 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.revenueAnalytics', 'Revenue Analytics')}</h4>
              <p>{t('operations.managerDashboard.descRevenue', 'Inspect revenue distribution between Retreat Packages, Spa Therapies, and Dietary F&B with settlement pagination.')}</p>
            </div>
          </Link>

          <Link to="/manager/occupancy" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <TrendingUp size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.occupancyReports', 'Occupancy Reports')}</h4>
              <p>{t('operations.managerDashboard.descOccupancy', 'Review sanctuary villa inventory status, occupancy percentages, and maintenance ratios across villa categories.')}</p>
            </div>
          </Link>

          <Link to="/manager/therapist-utilization" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Users2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.therapistUtilization', 'Therapist Utilization')}</h4>
              <p>{t('operations.managerDashboard.descTherapists', 'Monitor therapist and yoga practitioner workload indicators, scheduled treatment minutes, and session completion.')}</p>
            </div>
          </Link>

          <Link to="/manager/system-overview" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Activity size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.systemOverviewPoliceExport', 'System Overview & Police Export')}</h4>
              <p>{t('operations.managerDashboard.descSystem', 'Cross-module resort health rollup and daily temporary residence declaration batch export (Law on Residence 2020).')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Role Boundaries & Privacy Guardrail Notice */}
      <div className="hsw-gov-card" style={{ marginBottom: 0, backgroundColor: '#faf9f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <Lock size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('operations.managerDashboard.privacyBoundaryTitle', 'Manager Role Boundaries & Sensitive Data Minimization')}
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('operations.managerDashboard.privacyBoundaryDesc', 'As Resort Operations Manager, your access clearance is focused exclusively on aggregated analytics and operational monitoring. Individual customer clinical notes, personal medical histories, identity document contents, and payment secrets are strictly excluded from all manager dashboards modeled around Decree 13 requirements and BR-03.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
