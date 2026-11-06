import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Home,
  ShieldCheck,
  FileSpreadsheet,
  RotateCw,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useFolio } from '../../context/FolioContext';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import { billingApi } from '../../features/m5-billing/api/billingApi';
import type { OccupancyAnalytics } from '../../features/m5-billing/types';

export const OccupancyReportPage: React.FC = () => {
  const { t } = useTranslation();
  const { getOccupancyAnalytics } = useFolio();

  const localAnalytics = getOccupancyAnalytics();

  // Date range filter
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'ytd'>('30d');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [liveAnalytics, setLiveAnalytics] = useState<OccupancyAnalytics | null>(null);

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
    billingApi.getOccupancyAnalytics(from, to)
      .then(setLiveAnalytics)
      .catch(() => {
        // Fallback to local context
      });
  }, [dateRange]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getDates();
      await billingApi.downloadExcelReport('occupancy', from, to);
    } catch (err) {
      console.error('Failed to export occupancy excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalVillas = Number.isFinite(liveAnalytics?.totalVillas) ? liveAnalytics!.totalVillas : (Number.isFinite(localAnalytics.totalVillas) ? localAnalytics.totalVillas : 0);
  const occupiedCount = Number.isFinite(liveAnalytics?.occupiedCount) ? liveAnalytics!.occupiedCount : (Number.isFinite(localAnalytics.occupiedCount) ? localAnalytics.occupiedCount : 0);
  const reservedCount = Number.isFinite(liveAnalytics?.reservedCount) ? liveAnalytics!.reservedCount : (Number.isFinite(localAnalytics.reservedCount) ? localAnalytics.reservedCount : 0);
  const readyCount = Number.isFinite(liveAnalytics?.readyCount) ? liveAnalytics!.readyCount : (Number.isFinite(localAnalytics.readyCount) ? localAnalytics.readyCount : 0);
  const cleaningCount = Number.isFinite(liveAnalytics?.cleaningCount) ? liveAnalytics!.cleaningCount : (Number.isFinite(localAnalytics.cleaningCount) ? localAnalytics.cleaningCount : 0);
  const maintenanceCount = Number.isFinite(localAnalytics.maintenanceCount) ? localAnalytics.maintenanceCount : 0;
  const occupancyRate = Number.isFinite(liveAnalytics?.occupancyRate) ? liveAnalytics!.occupancyRate : (Number.isFinite(localAnalytics.occupancyRate) ? localAnalytics.occupancyRate : 0);

  // Status Filter & Pagination
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  type VillaDetailItem = {
    id: string;
    code: string;
    category: string;
    status: string;
    customerName?: string;
    bookingRef?: string;
    activeCustomerName?: string;
    activeBookingRef?: string;
    previousCustomerName?: string;
    previousBookingRef?: string;
  };

  const allVillas: VillaDetailItem[] = (liveAnalytics?.villaDetails && liveAnalytics.villaDetails.length > 0)
    ? liveAnalytics.villaDetails.map((vd): VillaDetailItem => ({
        id: `villa-${vd.villaId}`,
        code: vd.villaNumber,
        category: vd.category,
        status: vd.status.toLowerCase(),
        activeBookingRef: vd.status.toUpperCase() === 'OCCUPIED' ? (vd.bookingReference || undefined) : undefined,
        bookingRef: vd.status.toUpperCase() === 'RESERVED' ? (vd.bookingReference || undefined) : undefined,
        previousBookingRef: vd.status.toUpperCase() === 'CLEANING' ? (vd.bookingReference || undefined) : undefined,
        customerName: vd.customerName || undefined,
        activeCustomerName: vd.status.toUpperCase() === 'OCCUPIED' ? (vd.customerName || undefined) : undefined,
        previousCustomerName: vd.status.toUpperCase() === 'CLEANING' ? (vd.customerName || undefined) : undefined,
      }))
    : localAnalytics.villaDetails;

  const filteredVillas = allVillas.filter((v) => {
    if (filterStatus === 'all') return true;
    return v.status === filterStatus;
  });

  const totalItems = filteredVillas.length;
  const paginatedVillas = filteredVillas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pieData = [
    { name: t('manager.occupancy.occupied', 'Đang Có Khách'), value: occupiedCount, color: '#3b82f6' },
    { name: t('manager.occupancy.reserved', 'Đã Đặt'), value: reservedCount, color: '#8b5cf6' },
    { name: t('manager.occupancy.available', 'Sẵn Sàng'), value: readyCount, color: '#10b981' },
    { name: t('manager.occupancy.cleaning', 'Đang Dọn'), value: cleaningCount, color: '#f59e0b' },
    { name: t('manager.occupancy.maintenance', 'Bảo Trì'), value: maintenanceCount, color: '#6b7280' },
  ].filter((d) => d.value > 0);

  const getVillaStatusLabel = (status: string) => {
    switch (status) {
      case 'occupied': return t('status.occupied', t('common.status.occupied', 'Đang Có Khách'));
      case 'reserved': return t('status.reserved', t('common.status.reserved', 'Đã Đặt'));
      case 'ready': return t('status.ready', t('common.status.ready', 'Sẵn Sàng'));
      case 'cleaning': return t('status.cleaning', t('common.status.cleaning', 'Đang Dọn'));
      case 'maintenance': return t('status.maintenance', t('common.status.maintenance', 'Bảo Trì'));
      default: return status.toUpperCase();
    }
  };

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'occupied': return 'deposit_paid';
      case 'reserved': return 'included';
      case 'ready': return 'settled';
      case 'cleaning': return 'pending_settlement';
      case 'maintenance': return 'refunded';
      default: return 'settled';
    }
  };

  return (
    <div className="hsw-manager-page" style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="hsw-manager-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <TrendingUp size={24} style={{ color: 'var(--actor-manager)' }} />
            <h1 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('manager.occupancy.title', 'Báo Cáo Tỷ Lệ Lấp Đầy & Công Suất Biệt Thự')}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {/* Date Range Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--surface-sunken)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['7d', '30d', 'ytd'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDateRange(r)}
                    style={{
                      border: 'none',
                      background: dateRange === r ? 'var(--accent-forest)' : 'transparent',
                      color: dateRange === r ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Excel Button */}
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={handleExportExcel}
              disabled={isExporting}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              id="btn-export-occupancy-excel"
            >
              {isExporting ? (
                <RotateCw size={14} className="hsw-spin" />
              ) : (
                <FileSpreadsheet size={14} style={{ color: '#047857' }} />
              )}
              <span>{isExporting ? t('common.exporting', 'Đang xuất...') : t('manager.revenue.exportExcel', 'Xuất Excel (.xlsx)')}</span>
            </button>

            <div className="hsw-manager-privacy-notice">
              <ShieldCheck size={14} />
              <span>{t('manager.occupancy.privacyNotice', 'Phạm Vi Quản Lý · Tình Trạng Biệt Thự · Đã Ẩn Giấy Tờ & Khai Báo Tạm Trú')}</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t(
            'manager.occupancy.subtitle',
            'Báo cáo trạng thái biệt thự thời gian thực, vòng quay buồng phòng và phân tích năng lực phục vụ của khu nghỉ dưỡng.'
          )}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="hsw-manager-kpi-grid">
        {/* Total Villas */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid var(--accent-forest)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.totalVillas', 'Tổng Số Biệt Thự')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalVillas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.occupancy.activeInventory', 'Tất cả biệt thự đã đăng ký trong hệ thống')}
          </div>
        </div>

        {/* Occupied Villas */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.occupiedCount', 'Đang Có Khách Ở')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#1d4ed8' }}>
            {occupiedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.occupancy.inHouseGuests', 'Khách đang lưu trú tại khu nghỉ')}
          </div>
        </div>

        {/* Ready / Available */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.readyCount', 'Sẵn Sàng Đón Khách')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#047857' }}>
            {readyCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.occupancy.inspectedReady', 'Đã vệ sinh & kiểm tra tiêu chuẩn')}
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.rate', 'Tỷ Lệ Lấp Đầy')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#b45309' }}>
            {occupancyRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {reservedCount} {t('manager.occupancy.inReserved', 'đã đặt')} · {cleaningCount} {t('manager.occupancy.inCleaning', 'đang dọn')} · {maintenanceCount} {t('manager.occupancy.inMaintenance', 'bảo trì')}
          </div>
        </div>
      </div>

      {/* Chart + Distribution Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="hsw-manager-chart-card">
          <div className="hsw-manager-chart-title">
            <span>{t('manager.occupancy.chartTitle', 'Tỷ Lệ Tình Trạng Vận Hành Biệt Thự')}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{totalVillas} biệt thự</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} Biệt Thự`, 'Số Lượng']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Status Breakdown */}
        <div className="hsw-manager-chart-card">
          <div className="hsw-manager-chart-title">
            <span>{t('manager.occupancy.breakdownTitle', 'Phân Bổ Chi Tiết Công Suất Vận Hành')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#1e40af' }}>
                {t('manager.occupancy.occupied', 'Đang Có Khách')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#1e40af' }}>
                {occupiedCount} / {totalVillas} ({occupancyRate.toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#f5f3ff', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#6d28d9' }}>
                {t('manager.occupancy.reserved', 'Đã Đặt Trước')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#6d28d9' }}>
                {reservedCount} / {totalVillas} ({((reservedCount / totalVillas) * 100).toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#065f46' }}>
                {t('manager.occupancy.available', 'Sẵn Sàng Đón Khách')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#065f46' }}>
                {readyCount} / {totalVillas} ({((readyCount / totalVillas) * 100).toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#fefce8', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#854d0e' }}>
                {t('manager.occupancy.cleaning', 'Đang Vệ Sinh & Khử Khuẩn')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#854d0e' }}>
                {cleaningCount} / {totalVillas} ({((cleaningCount / totalVillas) * 100).toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#4b5563' }}>
                {t('manager.occupancy.maintenance', 'Bảo Trì Định Kỳ')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#4b5563' }}>
                {maintenanceCount} / {totalVillas} ({((maintenanceCount / totalVillas) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Villa Inventory Detail Table with Pagination */}
      <div className="hsw-folio-section">
        <div className="hsw-folio-section-header">
          <div className="hsw-folio-section-title">
            <Home size={18} style={{ color: 'var(--actor-manager)' }} />
            <span>{t('manager.occupancy.tableTitle', 'Bảng Trạng Thái Biệt Thự Nghỉ Dưỡng')}</span>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('manager.occupancy.filter', 'Lọc theo')}:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#ffffff',
              }}
              id="select-occupancy-status"
            >
              <option value="all">{t('manager.occupancy.allStatuses', 'Tất Cả Trạng Thái')}</option>
              <option value="occupied">{t('manager.occupancy.occupied', 'Đang Có Khách')}</option>
              <option value="reserved">{t('manager.occupancy.reserved', 'Đã Đặt')}</option>
              <option value="ready">{t('manager.occupancy.ready', 'Sẵn Sàng Đón Khách')}</option>
              <option value="cleaning">{t('manager.occupancy.cleaning', 'Đang Dọn')}</option>
              <option value="maintenance">{t('manager.occupancy.maintenance', 'Bảo Trì')}</option>
            </select>
          </div>
        </div>

        <div className="hsw-folio-table-wrapper">
          <table className="hsw-folio-table">
            <thead>
              <tr>
                <th>{t('manager.occupancy.colVilla', 'Số Biệt Thự')}</th>
                <th>{t('manager.occupancy.colCategory', 'Hạng Biệt Thự')}</th>
                <th>{t('manager.occupancy.colStatus', 'Trạng Thái Vận Hành')}</th>
                <th>{t('manager.occupancy.colBookingRef', 'Mã Lưu Trú')}</th>
                <th>{t('manager.occupancy.colCustomer', 'Khách Đang Lưu Trú / Phân Bổ')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVillas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                    {t('manager.occupancy.noVillasForFilter', 'Không có biệt thự nào phù hợp với bộ lọc trạng thái đã chọn.')}
                  </td>
                </tr>
              ) : (
                paginatedVillas.map((villa) => (
                  <tr key={villa.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        Villa {villa.code}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {villa.category}
                      </span>
                    </td>
                    <td>
                      <span className={`hsw-status-pill ${getStatusPillClass(villa.status)}`}>
                        {getVillaStatusLabel(villa.status)}
                      </span>
                    </td>
                    <td>
                      {villa.status === 'occupied' && villa.activeBookingRef ? (
                        <span className="hsw-source-badge">{villa.activeBookingRef}</span>
                      ) : villa.status === 'reserved' && villa.bookingRef ? (
                        <span className="hsw-source-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#6d28d9', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                          {villa.bookingRef}
                        </span>
                      ) : villa.previousBookingRef ? (
                        <span className="hsw-source-badge" style={{ opacity: 0.75, fontStyle: 'italic' }} title={t('manager.occupancy.priorStay', 'Lưu Trú Trước')}>
                          {villa.previousBookingRef} <span style={{ fontSize: '10px' }}>({t('manager.occupancy.prior', 'Trước')})</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {villa.status === 'occupied' && villa.activeCustomerName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{villa.activeCustomerName}</span>
                          <span className="hsw-status-pill deposit_paid" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {t('manager.occupancy.inHouseBadge', 'Đang Ở')}
                          </span>
                        </div>
                      ) : villa.status === 'reserved' && villa.customerName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 500, color: '#6d28d9' }}>{villa.customerName}</span>
                          <span className="hsw-status-pill included" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {t('manager.occupancy.reservedBadge', 'Sắp Đến')}
                          </span>
                        </div>
                      ) : villa.status === 'cleaning' && villa.previousCustomerName ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{t('manager.occupancy.departedGuest', 'Khách vừa trả phòng')}: </span>
                          <span style={{ fontStyle: 'italic' }}>{villa.previousCustomerName}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {villa.status === 'maintenance'
                            ? t('manager.occupancy.vacantMaintenance', 'Trống · Đang Bảo Trì')
                            : t('manager.occupancy.unoccupied', 'Chưa Có Khách')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
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

export default OccupancyReportPage;
