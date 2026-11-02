import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Settings2,
  ToggleLeft,
  Shield,
  Users2,
  UserPlus,
  Database,
  History,
  Activity,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { parameters, featureFlags, delegations, auditEvents } = useGovernance();

  const enabledFlagsCount = featureFlags.filter((f) => f.enabled).length;
  const activeDelegationsCount = delegations.filter((d) => d.status === 'active').length;
  const recentAuditEvents = auditEvents.slice(0, 5);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Page Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.adminDashboard.title', 'System Administration & Governance Cockpit')}
          </h1>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '3px 8px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--actor-admin)',
            color: 'var(--actor-admin-text)'
          }}>
            {t('topbar.adminClearance', 'Administrator Clearance')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.adminDashboard.subtitle', 'Centralized governance, business parameter configuration, access delegation, and security audit monitoring.')}
        </p>
      </div>

      {/* Prototype Honesty Notice */}
      <div className="hsw-gov-banner">
        <Info size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.adminDashboard.bannerTitle', 'Frontend Governance Prototype')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.adminDashboard.bannerNotice', 'Configuration parameters and permission rules in this prototype are managed in client state for operational demonstration. In production, authorization policies and append-only audit histories are enforced by server-side policy engines.')}
          </span>
        </div>
      </div>

      {/* Governance KPI Summary */}
      <div className="hsw-gov-grid">
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiParams', 'Business Parameters')}
          </span>
          <span className="hsw-gov-kpi-val">{parameters.length}</span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiParamsSub', 'Operational thresholds configured')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiFlags', 'Feature Flags')}
          </span>
          <span className="hsw-gov-kpi-val">{enabledFlagsCount} / {featureFlags.length}</span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiFlagsSub', 'Optional modules currently active')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiDelegations', 'Manager Delegations')}
          </span>
          <span className="hsw-gov-kpi-val" style={{ color: activeDelegationsCount > 0 ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
            {activeDelegationsCount}
          </span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiDelegationsSub', 'Active scoped delegations to Manager')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiAudit', 'Audit Trail Activity')}
          </span>
          <span className="hsw-gov-kpi-val">{auditEvents.length}</span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiAuditSub', 'Sensitive metadata access events logged')}
          </span>
        </div>
      </div>

      {/* Governance Navigation Tiles */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Settings2 size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.adminDashboard.navTitle', 'Administrative Functions & Governance Modules')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('operations.adminDashboard.screensScope', 'Official Administrator Scope: Screens 10–12 & 50–54, 56')}
          </span>
        </div>

        <div className="hsw-quicknav-grid">
          <Link to="/admin/staff" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-staff">
              <UserPlus size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.staffAccounts', 'Staff Accounts')}</h4>
              <p>{t('operations.adminDashboard.descStaff', 'Manage staff accounts, clearance roles, active work status, and RBAC security boundaries (Screens 10 & 11).')}</p>
            </div>
          </Link>

          <Link to="/admin/master-data" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-master-data">
              <Database size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.masterDataManagement', 'Master Data Management')}</h4>
              <p>{t('operations.adminDashboard.descMasterData', 'Administer retreat packages, spa therapy services, and villa categories with wellness taxonomy (Screen 12).')}</p>
            </div>
          </Link>

          <Link to="/admin/business-params" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-params">
              <Settings2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.businessParameters', 'Business Parameters')}</h4>
              <p>{t('operations.adminDashboard.descParams', 'Configure cancellation windows, refund rates, deposit percentages, and dietary cutoff rules.')}</p>
            </div>
          </Link>

          <Link to="/admin/feature-flags" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-params">
              <ToggleLeft size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.featureFlags', 'Feature Flags')}</h4>
              <p>{t('operations.adminDashboard.descFlags', 'Safely toggle modular services including extra dining, extra spa, and statutory export routines.')}</p>
            </div>
          </Link>

          <Link to="/admin/permissions" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-matrix">
              <Shield size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.permissionMatrix', 'Permission Matrix')}</h4>
              <p>{t('operations.adminDashboard.descMatrix', 'Inspect cross-role capability assignments and enforce privacy & least-privilege boundaries.')}</p>
            </div>
          </Link>

          <Link to="/admin/delegation" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-delegation">
              <Users2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.managerDelegation', 'Manager Delegation')}</h4>
              <p>{t('operations.adminDashboard.descDelegation', 'Grant strictly scoped, time-bounded administrative capabilities to Resort Operations Manager.')}</p>
            </div>
          </Link>

          <Link to="/admin/audit-log" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-audit">
              <History size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.sensitiveDataAuditLog', 'Sensitive Data Audit Log')}</h4>
              <p>{t('operations.adminDashboard.descAudit', 'Review chronological metadata of access events involving health, identity, and financial records.')}</p>
            </div>
          </Link>

          <Link to="/admin/system-overview" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-overview">
              <Activity size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.systemOverviewDashboard', 'System Overview Dashboard')}</h4>
              <p>{t('operations.adminDashboard.descOverview', 'High-level cross-module operational health and statutory residence declaration status monitoring.')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Audit Activity + Immutable Safety Guarantees */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Recent Audit Log Preview */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h3 className="hsw-gov-card-title">
              <History size={16} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.adminDashboard.recentAuditTitle', 'Recent Sensitive Access Audit Activity')}
            </h3>
            <Link
              to="/admin/audit-log"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent-forest)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {t('operations.adminDashboard.viewFullLog', 'View Full Audit Trail')}
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {recentAuditEvents.map((evt) => (
              <div
                key={evt.id}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: '#faf9f6',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                    <span className={`hsw-audit-pill ${evt.result === 'SUCCESS' ? 'success' : 'denied'}`}>
                      {evt.result}
                    </span>
                    <span className="hsw-audit-cat">{evt.dataCategory}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{evt.timestamp}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {evt.actorName} ({evt.actorRole}): {t(evt.detailsKey, evt.detailsFallback)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Target Ref: <code>{evt.targetRef}</code> · Action: {evt.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Immutable Architectural Constraints */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h3 className="hsw-gov-card-title">
              <ShieldAlert size={16} style={{ color: 'var(--accent-terracotta)' }} />
              {t('operations.adminDashboard.immutableGuaranteesTitle', 'Enforced Safety & Privacy Safeguards (BR-01, BR-02, BR-03, BR-06)')}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-forest)', fontWeight: 600 }}>
              {t('operations.adminDashboard.nonConfigurable', 'PROTOTYPE SAFEGUARDS')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr01Title', 'BR-01: Two-Dimensional Spa Booking Integrity')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr01Desc', 'A spa session requires concurrent availability of both an eligible Therapist and an assigned Treatment Room. Cannot be bypassed by parameters or feature flags.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr02Title', 'BR-02: Consolidated Folio Settlement Before Checkout')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr02Desc', 'Front Desk checkout cannot be finalized while any unpaid extra Spa or F&B charges remain on the villa folio. Unpaid balance check is non-bypassable.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr03Title', 'BR-03: Sensitive Health & Dietary Data Minimization')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr03Desc', 'Therapists see only physical contraindications; Chefs see only culinary allergen tags; Receptionists and Managers are blocked from medical records.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr06Title', 'BR-06: Manager Least Privilege & Role Separation')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr06Desc', 'Manager is strictly executive reporting. Manager never inherits full Admin rights and receives only explicitly delegated, time-bounded capabilities.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
