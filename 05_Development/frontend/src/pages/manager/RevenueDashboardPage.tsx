import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Receipt,
  ShieldCheck,
  FileSpreadsheet,
  RotateCw,
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
import { billingApi } from '../../features/m5-billing/api/billingApi';
import type { RevenueAnalytics } from '../../features/m5-billing/types';

export const RevenueDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { getRevenueAnalytics, activeFolio } = useFolio();

  const localAnalytics = getRevenueAnalytics();

  // Date range filter
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'ytd'>('30d');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [liveAnalytics, setLiveAnalytics] = useState<RevenueAnalytics | null>(null);

  // Derive date bounds
  const getDates = () => {
    const to = new Date().toISOString().slice(0, 10);
    const d = new Date();
    if (dateRange === '7d') d.setDate(d.getDate() - 7);
    else if (dateRange === '30d') d.setDate(d.getDate() - 30);
    else d.setFullYear(d.getFullYear(), 0, 1);
    const from = d.toISOString().slice(0, 10);
    return { from, to };
  };

  useEffect(() => {
    const { from, to } = getDates();
    billingApi.getRevenueAnalytics(from, to)
      .then(setLiveAnalytics)
      .catch(() => {
        // Fallback to local context
      });
  }, [dateRange]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getDates();
      await billingApi.downloadExcelReport('revenue', from, to);
    } catch (err) {
      console.error('Failed to export revenue excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const currentTotal = liveAnalytics?.totalRevenue ?? localAnalytics.totalRevenue;
  const currentRetreat = liveAnalytics?.packageRevenue ?? localAnalytics.retreatRevenue;
  const currentSpa = liveAnalytics?.spaRevenue ?? localAnalytics.spaRevenue;
  const currentFnb = liveAnalytics?.fnbRevenue ?? localAnalytics.fnbRevenue;
  const currentOutstanding = liveAnalytics?.outstandingBalance ?? localAnalytics.outstandingRevenue;

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
      amount: currentRetreat,
    },
    {
      category: t('manager.revenue.spaTherapies', 'Spa Therapies'),
      amount: currentSpa,
    },
    {
      category: t('manager.revenue.fnbDining', 'F&B Dining'),
      amount: currentFnb,
    },
  ];

  const getStreamLabel = (type: string) => {
    switch (type) {
      case 'retreat':
        return t('manager.revenue.retreatStream', 'Retreat Package');
      case 'spa':
        return t('manager.revenue.spaStream', 'Spa Therapy');
      case 'fnb':
        return t('manager.revenue.fnbStream', 'Dining');
      default:
        return type.toUpperCase();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'settled':
        return t('status.settled', t('common.status.settled', 'Settled'));
      case 'pending_settlement':
        return t('status.pendingSettlement', t('common.status.pendingSettlement', 'Pending Settlement'));
      case 'included':
        return t('status.included', t('common.status.included', 'Included'));
      default:
        return status.replace('_', ' ');
    }
  };

  const localizedBreakdown = (liveAnalytics?.categoryBreakdown || localAnalytics.categoryBreakdown).map((item) => {
    let name = item.name;
    if (item.name === 'Retreat Packages') name = t('manager.revenue.retreatPkg', 'Retreat Packages');
    else if (item.name === 'Spa & Therapies') name = t('manager.revenue.spaTherapies', 'Spa & Therapies');
    else if (item.name === 'Nourishing Dining') name = t('manager.revenue.fnbDining', 'Nourishing Dining');
    return {
      ...item,
      name,
    };
  });

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

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {/* Date Range Selector */}
            <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setDateRange('7d')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: dateRange === '7d' ? '#fff' : 'transparent',
                  fontWeight: dateRange === '7d' ? 600 : 400,
                  cursor: 'pointer',
                  boxShadow: dateRange === '7d' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('30d')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: dateRange === '30d' ? '#fff' : 'transparent',
                  fontWeight: dateRange === '30d' ? 600 : 400,
                  cursor: 'pointer',
                  boxShadow: dateRange === '30d' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('ytd')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: dateRange === 'ytd' ? '#fff' : 'transparent',
                  fontWeight: dateRange === 'ytd' ? 600 : 400,
                  cursor: 'pointer',
                  boxShadow: dateRange === 'ytd' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Year-to-Date
              </button>
            </div>

            {/* Export to Excel Button */}
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={handleExportExcel}
              disabled={isExporting}
              id="btn-export-revenue-excel"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isExporting ? <RotateCw size={15} className="animate-spin" /> : <FileSpreadsheet size={15} style={{ color: '#16a34a' }} />}
              <span>{isExporting ? 'Exporting...' : 'Export to Excel (.xlsx)'}</span>
            </button>

            {/* Privacy & Clearance Tag */}
            <div className="hsw-manager-privacy-notice">
              <ShieldCheck size={14} />
              <span>{t('manager.revenue.privacyNotice', 'Manager Clearance · Financial Aggregates Only')}</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t(
            'manager.revenue.subtitle',
            'Real-time consolidated revenue reporting derived from retreat bookings, extra spa sessions, and a-la-carte dining.'
          )}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="hsw-manager-kpi-grid">
        {/* Total Settled Revenue */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid var(--accent-forest)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.revenue.totalSettled', 'Total Settled Revenue')}
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-forest)' }}>
            {formatVND(currentTotal)}
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
            {formatVND(currentRetreat)}
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
            {formatVND(currentSpa + currentFnb)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Spa: {formatVND(currentSpa)} · F&B: {formatVND(currentFnb)}
          </div>
        </div>

        {/* Outstanding / Pending Settlement */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.revenue.outstandingRevenue', 'Outstanding / Pending')}
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#dc2626' }}>
            {formatVND(currentOutstanding)}
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
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('manager.revenue.currencyVnd', 'VND Currency')}</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={localizedBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {localizedBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatVND(Number(value) || 0), t('manager.revenue.revenueLabel', 'Revenue')]}
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
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('manager.revenue.consolidatedTotal', 'Consolidated Total')}</span>
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
                  formatter={(value: any) => [formatVND(Number(value) || 0), t('manager.revenue.amountLabel', 'Amount')]}
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
            <span>{t('manager.revenue.tableTitle', 'Revenue Settlement Audit Log')}</span>
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
              {paginatedItems.map((item) => {
                const localizedTitle =
                  (item.title as any)?.[i18n.language] ||
                  item.title?.vi ||
                  item.title?.en ||
                  '';
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="hsw-source-badge">{item.sourceId}</span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {getStreamLabel(item.sourceType)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{localizedTitle}</div>
                      {item.subtitle && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.subtitle}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {item.totalAmount === 0 ? `0 VND (${t('status.included', t('common.status.included', 'Included'))})` : formatVND(item.totalAmount)}
                    </td>
                    <td>
                      <span className={`hsw-status-pill ${item.status}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
