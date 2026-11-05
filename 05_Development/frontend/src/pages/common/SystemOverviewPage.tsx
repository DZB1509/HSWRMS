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
import { formatVND } from '../../i18n';

export const SystemOverviewPage: React.FC = () => {
  const { role } = useAuth();
  const { t, i18n } = useTranslation(['operations', 'common']);
  const { getRevenueAnalytics, getOccupancyAnalytics, getTherapistUtilizationAnalytics } = useFolio();

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
                {t('operations.systemOverview.pageTitle', 'Tổng Quan Vận Hành & Bảng Sức Khỏe Toàn Hệ Thống')}
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
                {role === 'admin' ? t('topbar.adminClearance', 'Thẩm Quyền Quản Trị Viên') : t('topbar.managerScope', 'Phạm Vi Giới Hạn Của Quản Lý')}
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.systemOverview.pageSubtitle', 'Báo cáo vận hành liên mô-đun theo dõi lưu trú, thực hiện trị liệu, chuẩn bị ẩm thực, quyết toán hóa đơn và tuân thủ khai báo cư trú theo luật định.')}
            </p>
          </div>
        </div>
      </div>

      {/* Honest Operational Status Banner */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: '#2d6a4f', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#1b4332' }}>
            {t('operations.systemOverview.statusHonestyTitle', 'Tình Trạng Sức Khỏe Vận Hành Ứng Dụng')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.systemOverview.statusHonestyDesc', 'Toàn bộ chỉ số vận hành bên dưới phản ánh trạng thái thực tế của ứng dụng được tính toán trực tiếp từ các lượt đặt phòng, lịch hẹn spa, đơn bếp và bảng kê chi phí đã quyết toán.')}
          </span>
        </div>
      </div>

      {/* Module 1 & 2: Accommodation Health */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Building size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.systemOverview.accommodationTitle', 'Tình Trạng Lưu Trú & Biệt Thự Nghỉ Dưỡng (Mô-đun 2)')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {Number.isFinite(occupancy.totalVillas) ? occupancy.totalVillas : 0} {t('operations.systemOverview.totalVillas', 'Tổng số căn biệt thự thực tế')}
          </span>
        </div>

        <div className="hsw-gov-grid" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-kpi hsw-kpi-occupied">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.occupied', 'Đang có khách')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--accent-forest)' }}>{Number.isFinite(occupancy.occupiedCount) ? occupancy.occupiedCount : 0}</span>
            <span className="hsw-gov-kpi-sub">{Number.isFinite(occupancy.occupancyRate) ? occupancy.occupancyRate : 0}% {t('manager.occupancy.rate', 'công suất')}</span>
          </div>

          <div className="hsw-gov-kpi hsw-kpi-ready">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.available', 'Sẵn sàng đón khách')}</span>
            <span className="hsw-gov-kpi-val">{Number.isFinite(occupancy.readyCount) ? occupancy.readyCount : 0}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.inspectedReady', 'Đã dọn dẹp & kiểm tra')}</span>
          </div>

          <div className="hsw-gov-kpi hsw-kpi-cleaning">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.cleaning', 'Đang dọn dẹp')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--warning)' }}>{Number.isFinite(occupancy.cleaningCount) ? occupancy.cleaningCount : 0}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.turnoverQueue', 'Hàng đợi buồng phòng')}</span>
          </div>

          <div className="hsw-gov-kpi hsw-kpi-maintenance">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.maintenance', 'Bảo trì')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--text-muted)' }}>{Number.isFinite(occupancy.maintenanceCount) ? occupancy.maintenanceCount : 0}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.outOfOrder', 'Bảo trì theo lịch')}</span>
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
              {t('operations.systemOverview.therapyTitle', 'Lịch Trình Trị Liệu & Hoàn Tất Buổi Hẹn (Mô-đun 3)')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="hsw-overview-subcard hsw-card-spa-sessions">
              <div className="subcard-label">{t('manager.therapists.totalSessions', 'Lịch Hẹn Đã Đặt')}</div>
              <div className="subcard-val">
                {Number.isFinite(therapists.totalScheduledSessions) ? therapists.totalScheduledSessions : 0}
              </div>
              <div className="subcard-sub">
                {Number.isFinite(therapists.completedSessions) ? therapists.completedSessions : 0} hoàn thành · {Number.isFinite(therapists.noShowSessions) ? therapists.noShowSessions : 0} vắng mặt
              </div>
            </div>

            <div className="hsw-overview-subcard hsw-card-spa-time">
              <div className="subcard-label">{t('manager.therapists.totalMinutes', 'Thời Lượng Trị Liệu Đã Đặt')}</div>
              <div className="subcard-val">
                {Number.isFinite(therapists.totalBookedMinutes) ? therapists.totalBookedMinutes : 0} phút
              </div>
              <div className="subcard-sub">
                {Number.isFinite(therapists.totalBookedHours) ? therapists.totalBookedHours : 0} giờ chăm sóc trực tiếp
              </div>
            </div>
          </div>
        </div>

        {/* Financial Folio Health */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h2 className="hsw-gov-card-title">
              <Receipt size={18} style={{ color: 'var(--accent-forest)' }} />
              {t('operations.systemOverview.billingTitle', 'Tổng Hợp Quyết Toán & Hóa Đơn Folio (Mô-đun 5)')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="hsw-overview-subcard hsw-card-revenue">
              <div className="subcard-label">{t('manager.revenue.totalRevenue', 'Tổng Doanh Thu')}</div>
              <div className="subcard-val">
                {(Number.isFinite(revenue.totalRevenue) ? formatVND(revenue.totalRevenue, i18n.language) : formatVND(0, i18n.language))}
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

      <div className="hsw-gov-card" role="status">
        <h2 className="hsw-gov-card-title">{t('operations.systemOverview.policeComplianceTitle', 'Khai Báo Tạm Trú Với Cơ Quan Công An')}</h2>
        <p>{t('operations.systemOverview.policeComplianceDesc', 'Chỉ số tuân thủ khai báo cư trú tự động đồng bộ khi có lượt nhận phòng hoặc xuất tệp hồ sơ lưu trú hàng ngày theo quy định.')}</p>
      </div>
    </div>
  );
};
