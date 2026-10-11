import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Home,
  ShieldCheck,
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

export const OccupancyReportPage: React.FC = () => {
  const { t } = useTranslation();
  const { getOccupancyAnalytics } = useFolio();

  const analytics = getOccupancyAnalytics();

  // Status Filter & Pagination
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredVillas = analytics.villaDetails.filter((v) => {
    if (filterStatus === 'all') return true;
    return v.status === filterStatus;
  });

  const totalItems = filteredVillas.length;
  const paginatedVillas = filteredVillas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pieData = [
    { name: t('manager.occupancy.occupied', 'Đang Có Khách'), value: analytics.occupiedCount, color: '#3b82f6' },
    { name: t('manager.occupancy.reserved', 'Đã Đặt Trước'), value: analytics.reservedCount, color: '#8b5cf6' },
    { name: t('manager.occupancy.available', 'Sẵn Sàng / Trống'), value: analytics.readyCount, color: '#10b981' },
    { name: t('manager.occupancy.cleaning', 'Đang Dọn Dẹp / Khử Khuẩn'), value: analytics.cleaningCount, color: '#f59e0b' },
    { name: t('manager.occupancy.maintenance', 'Đang Bảo Trì'), value: analytics.maintenanceCount, color: '#6b7280' },
  ].filter((d) => d.value > 0);

  const getVillaStatusLabel = (status: string) => {
    switch (status) {
      case 'occupied': return t('status.occupied', t('common.status.occupied', 'Đang Có Khách'));
      case 'reserved': return t('status.reserved', t('common.status.reserved', 'Đã Đặt Trước'));
      case 'ready': return t('status.ready', t('common.status.ready', 'Sẵn Sàng / Trống'));
      case 'cleaning': return t('status.cleaning', t('common.status.cleaning', 'Đang Dọn Dẹp'));
      case 'maintenance': return t('status.maintenance', t('common.status.maintenance', 'Đang Bảo Trì'));
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
              {t('manager.occupancy.title', 'Báo Cáo Công Suất & Trạng Thái Villa')}
            </h1>
          </div>

          <div className="hsw-manager-privacy-notice">
            <ShieldCheck size={14} />
            <span>{t('manager.occupancy.privacyNotice', 'Thẩm Quyền Quản Lý · Chỉ Xem Phân Bổ Villa · Ẩn Dữ Liệu Định Danh Cá Nhân')}</span>
          </div>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {t(
            'manager.occupancy.subtitle',
            'Trạng thái quỹ phòng theo thời gian thực, tỷ lệ luân chuyển phòng và phân tích độ sẵn sàng của villa.'
          )}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="hsw-manager-kpi-grid">
        {/* Total Villas */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid var(--accent-forest)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.totalVillas', 'Tổng Số Villa Khu Nghỉ Dưỡng')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {analytics.totalVillas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.occupancy.activeInventory', 'Toàn bộ danh mục phòng đã đăng ký trong vận hành')}
          </div>
        </div>

        {/* Occupied Villas */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.occupiedCount', 'Hiện Đang Có Khách')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#1d4ed8' }}>
            {analytics.occupiedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.occupancy.inHouseGuests', 'Khách đang lưu trú tại resort')}
          </div>
        </div>

        {/* Ready / Available */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.readyCount', 'Sẵn Sàng Đón Khách')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#047857' }}>
            {analytics.readyCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('manager.occupancy.inspectedReady', 'Đã vệ sinh & kiểm tra đạt chuẩn')}
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="hsw-manager-kpi-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {t('manager.occupancy.rate', 'Công Suất Phòng')}
          </div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: '#b45309' }}>
            {analytics.occupancyRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {analytics.reservedCount} {t('manager.occupancy.inReserved', 'đặt trước')} · {analytics.cleaningCount} {t('manager.occupancy.inCleaning', 'đang dọn')} · {analytics.maintenanceCount} {t('manager.occupancy.inMaintenance', 'bảo trì')}
          </div>
        </div>
      </div>

      {/* Chart + Distribution Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="hsw-manager-chart-card">
          <div className="hsw-manager-chart-title">
            <span>{t('manager.occupancy.chartTitle', 'Tỷ Lệ Trạng Thái Vận Hành Của Villa')}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{analytics.totalVillas} Villa</span>
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
                <Tooltip formatter={(value: any) => [`${value} Villa`, 'Số Lượng']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Status Breakdown */}
        <div className="hsw-manager-chart-card">
          <div className="hsw-manager-chart-title">
            <span>{t('manager.occupancy.breakdownTitle', 'Chi Tiết Công Suất Vận Hành')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#1e40af' }}>
                {t('manager.occupancy.occupied', 'Đang Có Khách')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#1e40af' }}>
                {analytics.occupiedCount} / {analytics.totalVillas} ({analytics.occupancyRate.toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#f5f3ff', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#6d28d9' }}>
                {t('manager.occupancy.reserved', 'Đã Đặt Trước')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#6d28d9' }}>
                {analytics.reservedCount} / {analytics.totalVillas} ({((analytics.reservedCount / analytics.totalVillas) * 100).toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#065f46' }}>
                {t('manager.occupancy.available', 'Sẵn Sàng Đón Khách')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#065f46' }}>
                {analytics.readyCount} / {analytics.totalVillas} ({((analytics.readyCount / analytics.totalVillas) * 100).toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#fefce8', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#854d0e' }}>
                {t('manager.occupancy.cleaning', 'Đang Dọn Dẹp / Khử Khuẩn')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#854d0e' }}>
                {analytics.cleaningCount} / {analytics.totalVillas} ({((analytics.cleaningCount / analytics.totalVillas) * 100).toFixed(1)}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#4b5563' }}>
                {t('manager.occupancy.maintenance', 'Đang Bảo Trì')}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#4b5563' }}>
                {analytics.maintenanceCount} / {analytics.totalVillas} ({((analytics.maintenanceCount / analytics.totalVillas) * 100).toFixed(1)}%)
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
            <span>{t('manager.occupancy.tableTitle', 'Danh Sách Trạng Thái Quỹ Phòng Villa')}</span>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {t('manager.occupancy.filter', 'Lọc')}:
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
              <option value="reserved">{t('manager.occupancy.reserved', 'Đã Đặt Trước')}</option>
              <option value="ready">{t('manager.occupancy.ready', 'Sẵn Sàng / Trống')}</option>
              <option value="cleaning">{t('manager.occupancy.cleaning', 'Đang Dọn Dẹp')}</option>
              <option value="maintenance">{t('manager.occupancy.maintenance', 'Đang Bảo Trì')}</option>
            </select>
          </div>
        </div>

        <div className="hsw-folio-table-wrapper">
          <table className="hsw-folio-table">
            <thead>
              <tr>
                <th>{t('manager.occupancy.colVilla', 'Số Villa')}</th>
                <th>{t('manager.occupancy.colCategory', 'Hạng Villa')}</th>
                <th>{t('manager.occupancy.colStatus', 'Trạng Thái Vận Hành')}</th>
                <th>{t('manager.occupancy.colBookingRef', 'Mã Đặt Chỗ')}</th>
                <th>{t('manager.occupancy.colCustomer', 'Khách Lưu Trú / Phân Bổ Hiện Tại')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVillas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                    {t('manager.occupancy.noVillasForFilter', 'Không có villa nào phù hợp với bộ lọc trạng thái đã chọn.')}
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
                        <span className="hsw-source-badge" style={{ opacity: 0.75, fontStyle: 'italic' }} title={t('manager.occupancy.priorStay', 'Lần Lưu Trú Trước')}>
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
                            {t('manager.occupancy.inHouseBadge', 'Đang Lưu Trú')}
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
                          <span style={{ color: 'var(--text-muted)' }}>{t('manager.occupancy.departedGuest', 'Đã Trả Phòng (Khách trước)')}: </span>
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
