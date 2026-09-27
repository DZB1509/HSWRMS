import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useFolio } from '../../context/FolioContext';
import { formatVND } from '../../i18n';
import { OperationalPagination } from '../../components/operations/OperationalPagination';

export const RevenueDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { getRevenueAnalytics, activeFolio } = useFolio();

  const analytics = getRevenueAnalytics();

  // Pagination for settlement items
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Derive settled and pending items for analytical table
  const allFolioItems = activeFolio.lineItems;
  const totalItems = allFolioItems.length;
  const paginatedItems = allFolioItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const barData = [
    {
      category: t('manager.revenue.retreatPkg', 'Retreat Packages'),
      amount: analytics.retreatRevenue,
    },
    {
      category: t('manager.revenue.spaTherapies', 'Spa Therapies'),
      amount: analytics.spaRevenue,
    },
    {
      category: t('manager.revenue.fnbDining', 'F&B Dining'),
      amount: analytics.fnbRevenue,
    },
  ];

  return (
    <div className="hsw-manager-page" style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="hsw-manager-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <BarChart3 size={24} style={{ color: 'var(--actor-manager)' }} />
            <h1 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('manager.revenue.title', 'Revenue Analytics & Settlement Dashboard')}
            </h1>
          </div>

          {/* Privacy & Clearance Tag */}
          <div className="hsw-manager-privacy-notice">
            <ShieldCheck size={14} />
            <span>{t('manager.revenue.privacyNotice', 'Manager Clearance · Financial Aggregates Only · Personal Data Masked')}</span>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t(
            'manager.revenue.subtitle',
            'Real-time consolidated revenue reporting derived from retreat bookings, extra spa sessions, and a-la-carte dining.'
          )}
        </p>
      </div>

      {/* KPI Cards Row (Rule 37: No fabricated comparison metrics) */}
      <div className="hsw-manager-kpi-grid">
        {/* Total Settled Revenue */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid var(--accent-forest)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.revenue.totalSettled', 'Total Settled Revenue')}
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-forest)' }}>
            {formatVND(analytics.totalRevenue)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.revenue.settledSub', 'Deposits & settled folios')}
          </div>
        </div>

        {/* Retreat Revenue */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.revenue.retreatRevenue', 'Retreat Packages')}
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#1e40af' }}>
            {formatVND(analytics.retreatRevenue)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.revenue.retreatSub', 'Core sanctuary stays')}
          </div>
        </div>

        {/* Spa & F&B Extras Combined */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.revenue.ancillaryExtras', 'Spa & Dining Extras')}
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#b45309' }}>
            {formatVND(analytics.spaRevenue + analytics.fnbRevenue)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Spa: {formatVND(analytics.spaRevenue)} · F&B: {formatVND(analytics.fnbRevenue)}
          </div>
        </div>

        {/* Outstanding / Pending Settlement */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.revenue.outstandingRevenue', 'Outstanding / Pending')}
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#dc2626' }}>
            {formatVND(analytics.outstandingRevenue)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.revenue.outstandingSub', 'Due upon checkout handover')}
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid (Recharts) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Chart 1: Category Distribution */}
        <div className="hsw-manager-chart-card">
          <div className="hsw-manager-chart-title">
            <span>{t('manager.revenue.chartComposition', 'Revenue Share by Department')}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>VND Currency</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {analytics.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatVND(Number(value) || 0), 'Revenue']}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Volume Comparison */}
        <div className="hsw-manager-chart-card">
          <div className="hsw-manager-chart-title">
            <span>{t('manager.revenue.chartVolume', 'Settled Revenue by Stream')}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Consolidated Total</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any) => [formatVND(Number(value) || 0), 'Amount']}
                />
                <Bar dataKey="amount" fill="var(--accent-forest)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Settled Line Items Analytical Table with Pagination */}
      <div className="hsw-folio-section">
        <div className="hsw-folio-section-header">
          <div className="hsw-folio-section-title">
            <Receipt size={18} style={{ color: 'var(--actor-manager)' }} />
            <span>{t('manager.revenue.tableTitle', 'Current Operations Settlement Audit Log')}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('manager.revenue.itemCount', 'Showing {{count}} traceable line items', { count: totalItems })}
          </div>
        </div>

        <div className="hsw-folio-table-wrapper">
          <table className="hsw-folio-table">
            <thead>
              <tr>
                <th>{t('manager.revenue.colRef', 'Source ID')}</th>
                <th>{t('manager.revenue.colType', 'Stream')}</th>
                <th>{t('manager.revenue.colDesc', 'Item Summary')}</th>
                <th style={{ textAlign: 'center' }}>{t('manager.revenue.colQty', 'Qty')}</th>
                <th style={{ textAlign: 'right' }}>{t('manager.revenue.colAmount', 'Total (VND)')}</th>
                <th>{t('manager.revenue.colStatus', 'Settlement State')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="hsw-source-badge">{item.sourceId}</span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {item.sourceType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.title?.en || item.title?.vi}</div>
                    {item.subtitle && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.subtitle}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {item.totalAmount === 0 ? '0 VND (Included)' : formatVND(item.totalAmount)}
                  </td>
                  <td>
                    <span className={`hsw-status-pill ${item.status}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalItems > pageSize && (
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
            <OperationalPagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueDashboardPage;
