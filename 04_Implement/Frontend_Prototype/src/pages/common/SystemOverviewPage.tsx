import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Receipt,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFolio } from '../../context/FolioContext';
import { useGovernance } from '../../hooks/useGovernance';
import { formatVND } from '../../i18n';

export const SystemOverviewPage: React.FC = () => {
  const { role } = useAuth();
  const { t, i18n } = useTranslation(['operations', 'common']);
  const { getRevenueAnalytics, getOccupancyAnalytics, getTherapistUtilizationAnalytics } = useFolio();
  const { policeExportSummary } = useGovernance();

  // Cross-module single source of truth analytics
  const revenue = getRevenueAnalytics();
  const occupancy = getOccupancyAnalytics();
  const therapists = getTherapistUtilizationAnalytics();

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.systemOverview.pageTitle', 'System Overview & Operational Health Dashboard')}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: role === 'admin' ? 'var(--actor-admin)' : 'var(--actor-manager)',
                color: role === 'admin' ? 'var(--actor-admin-text)' : 'var(--actor-manager-text)'
              }}>
                {role === 'admin' ? t('topbar.adminClearance', 'Administrator Clearance') : t('topbar.managerScope', 'Manager Limited Scope')}
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.systemOverview.pageSubtitle', 'Cross-module operational summary tracking accommodation, therapy fulfillment, culinary readiness, folio settlement, and statutory residence compliance.')}
            </p>
          </div>
        </div>
      </div>

      {/* Honest Operational Status Banner */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.systemOverview.statusHonestyTitle', 'Application Operational Health')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.systemOverview.statusHonestyDesc', 'All operational indicators shown below reflect factual cross-module application state calculated from active bookings, scheduled treatments, dining orders, and settled folio items.')}
          </span>
        </div>
      </div>

      {/* Module 1 & 2: Accommodation Health */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Building size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.systemOverview.accommodationTitle', 'Accommodation & Sanctuary Villa Health (Module 2)')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {occupancy.totalVillas} {t('operations.systemOverview.totalVillas', 'Total Physical Villas')}
          </span>
        </div>

        <div className="hsw-gov-grid" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-kpi hsw-kpi-occupied">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.occupied', 'Occupied')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--accent-forest)' }}>{occupancy.occupiedCount}</span>
            <span className="hsw-gov-kpi-sub">{occupancy.occupancyRate}% {t('manager.occupancy.rate', 'occupancy')}</span>
          </div>

          <div className="hsw-gov-kpi hsw-kpi-ready">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.available', 'Ready / Available')}</span>
            <span className="hsw-gov-kpi-val">{occupancy.readyCount}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.inspectedReady', 'Cleaned & inspected')}</span>
          </div>

          <div className="hsw-gov-kpi hsw-kpi-cleaning">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.cleaning', 'In Cleaning')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--warning)' }}>{occupancy.cleaningCount}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.turnoverQueue', 'Housekeeping queue')}</span>
          </div>

          <div className="hsw-gov-kpi hsw-kpi-maintenance">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.maintenance', 'Maintenance')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--text-muted)' }}>{occupancy.maintenanceCount}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.outOfOrder', 'Scheduled maintenance')}</span>
          </div>
        </div>
      </div>

      {/* Module 3 & 4: Wellness Therapy & Culinary Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Spa & Therapy Health */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <Sparkles size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.systemOverview.therapyTitle', 'Therapy Scheduling & Fulfillment (Module 3)')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="hsw-overview-subcard hsw-card-spa-sessions">
              <div className="subcard-label">{t('manager.therapists.totalSessions', 'Lịch Hẹn Đã Đặt')}</div>
              <div className="subcard-val">
                {therapists.totalScheduledSessions}
              </div>
              <div className="subcard-sub">
                {therapists.completedSessions} hoàn thành · {therapists.noShowSessions} vắng mặt
              </div>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('manager.therapists.totalMinutes', 'Booked Treatment Time')}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {therapists.totalBookedMinutes} min
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {therapists.totalBookedHours} hrs hands-on care
              </div>
            </div>
          </div>
        </div>

        {/* Financial Folio Health */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <Receipt size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.systemOverview.billingTitle', 'Consolidated Billing & Folio (Module 5)')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="hsw-overview-subcard hsw-card-revenue">
              <div className="subcard-label">{t('manager.revenue.totalRevenue', 'Tổng Doanh Thu')}</div>
              <div className="subcard-val">
                {formatVND(revenue.totalRevenue, i18n.language)}
              </div>
              <div className="subcard-sub">
                Doanh thu đã quyết toán tổng hợp
              </div>
            </div>

            <div className="hsw-overview-subcard hsw-card-guard">
              <div className="subcard-label">{t('operations.systemOverview.unsettledGuard', 'Kiểm Soát Trả Phòng')}</div>
              <div className="subcard-val">
                {t('operations.systemOverview.guardActive', 'Đang Bật')}
              </div>
              <div className="subcard-sub">
                Quy tắc BR-02 chặn check-out khi còn phí chưa thanh toán đang bật
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Police Residence Declaration Compliance Section (Law on Residence 2020) */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-forest)' }} />
            <h2 className="hsw-gov-card-title" style={{ margin: 0 }}>
              {t('operations.systemOverview.policeComplianceTitle', 'Police Temporary Residence Declaration Compliance')}
            </h2>
          </div>
          <span className={`hsw-audit-pill ${policeExportSummary.status === 'SUBMITTED' ? 'success' : policeExportSummary.status === 'READY' ? 'ready' : 'denied'}`} style={{ fontSize: '11px' }}>
            {policeExportSummary.status}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div className="hsw-compliance-box" style={{ flex: '1 1 100%' }}>
            <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('operations.systemOverview.policeComplianceDesc', 'Operational safeguards modeled around Vietnam Law on Residence 2020 and Decree 13/2023/ND-CP requirements. HSWRMS compiles daily temporary residence records for domestic and foreign customers registered during physical check-in.')}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>
                <strong>{t('operations.systemOverview.batchId', 'Active Batch ID')}:</strong> <code>{policeExportSummary.batchId}</code>
              </span>
              <span>
                <strong>{t('operations.systemOverview.totalResidents', 'Registered In-House Customers')}:</strong> {policeExportSummary.totalRecords}
              </span>
              <span>
                <strong>{t('operations.systemOverview.domestic', 'Domestic (CCCD)')}:</strong> {policeExportSummary.domesticCount} · <strong>{t('operations.systemOverview.foreign', 'Foreign (Passport)')}:</strong> {policeExportSummary.foreignCount}
              </span>
              <span>
                <strong>{t('operations.systemOverview.batchSchedule', 'Batch Cutoff')}:</strong> 22:00 Daily Schedule
              </span>
              <span>
                <strong>{t('operations.systemOverview.generatedAt', 'Compiled At')}:</strong> {policeExportSummary.generatedAt}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
