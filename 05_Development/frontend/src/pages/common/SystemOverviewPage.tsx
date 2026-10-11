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
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.systemOverview.statusHonestyTitle', 'Tình Trạng Sức Khỏe Vận Hành Ứng Dụng')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.systemOverview.statusHonestyDesc', 'Tất cả các chỉ số vận hành bên dưới phản ánh trung thực trạng thái liên mô-đun được tính toán từ các lượt đặt phòng đang hoạt động, lịch trị liệu, đơn món ăn và các khoản phí folio đã quyết toán.')}
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
            {occupancy.totalVillas} {t('operations.systemOverview.totalVillas', 'Tổng số căn biệt thự thực tế')}
          </span>
        </div>

        <div className="hsw-gov-grid" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-kpi">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.occupied', 'Đang có khách')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--accent-forest)' }}>{occupancy.occupiedCount}</span>
            <span className="hsw-gov-kpi-sub">{occupancy.occupancyRate}% {t('manager.occupancy.rate', 'công suất')}</span>
          </div>

          <div className="hsw-gov-kpi">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.available', 'Sẵn sàng đón khách')}</span>
            <span className="hsw-gov-kpi-val">{occupancy.readyCount}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.inspectedReady', 'Đã dọn dẹp & kiểm tra')}</span>
          </div>

          <div className="hsw-gov-kpi">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.cleaning', 'Đang dọn dẹp')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--warning)' }}>{occupancy.cleaningCount}</span>
            <span className="hsw-gov-kpi-sub">{t('operations.systemOverview.turnoverQueue', 'Hàng đợi buồng phòng')}</span>
          </div>

          <div className="hsw-gov-kpi">
            <span className="hsw-gov-kpi-label">{t('manager.occupancy.maintenance', 'Bảo trì')}</span>
            <span className="hsw-gov-kpi-val" style={{ color: 'var(--text-muted)' }}>{occupancy.maintenanceCount}</span>
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
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('manager.therapists.totalSessions', 'Lịch Hẹn Đã Đặt')}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {therapists.totalScheduledSessions}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {therapists.completedSessions} hoàn thành · {therapists.noShowSessions} vắng mặt
              </div>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('manager.therapists.totalMinutes', 'Thời Lượng Trị Liệu Đã Đặt')}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {therapists.totalBookedMinutes} phút
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {therapists.totalBookedHours} giờ chăm sóc trực tiếp
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
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('manager.revenue.totalRevenue', 'Tổng Doanh Thu')}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--accent-forest)', marginTop: '2px' }}>
                {formatVND(revenue.totalRevenue, i18n.language)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Doanh thu đã quyết toán tổng hợp
              </div>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('operations.systemOverview.unsettledGuard', 'Kiểm Soát Trả Phòng')}</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--accent-forest)', marginTop: '2px' }}>
                {t('operations.systemOverview.guardActive', 'Đang Bật')}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
              {t('operations.systemOverview.policeComplianceTitle', 'Tuân Thủ Khai Báo Tạm Trú Với Cơ Quan Công An')}
            </h2>
          </div>
          <span className={`hsw-audit-pill ${policeExportSummary.status === 'SUBMITTED' ? 'success' : 'denied'}`} style={{ fontSize: '11px' }}>
            {policeExportSummary.status === 'READY' ? 'SẴN SÀNG' : policeExportSummary.status === 'SUBMITTED' ? 'ĐÃ NỘP' : 'CHỜ XỬ LÝ'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ flex: '1 1 100%' }}>
            <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('operations.systemOverview.policeComplianceDesc', 'Các biện pháp bảo vệ vận hành theo Luật Cư trú 2020 và Nghị định 13/2023/NĐ-CP. HSWRMS tự động tổng hợp danh sách tạm trú hàng ngày cho khách nội địa và quốc tế được đăng ký khi làm thủ tục check-in.')}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>
                <strong>{t('operations.systemOverview.batchId', 'Mã Lô Khai Báo')}:</strong> <code>{policeExportSummary.batchId}</code>
              </span>
              <span>
                <strong>{t('operations.systemOverview.totalResidents', 'Khách Đang Lưu Trú Đã Đăng Ký')}:</strong> {policeExportSummary.totalRecords}
              </span>
              <span>
                <strong>{t('operations.systemOverview.domestic', 'Khách Trong Nước (CCCD)')}:</strong> {policeExportSummary.domesticCount} · <strong>{t('operations.systemOverview.foreign', 'Khách Quốc Tế (Hộ Chiếu)')}:</strong> {policeExportSummary.foreignCount}
              </span>
              <span>
                <strong>{t('operations.systemOverview.batchSchedule', 'Khung Giờ Chốt Lô')}:</strong> 22:00 Hàng Ngày
              </span>
              <span>
                <strong>{t('operations.systemOverview.generatedAt', 'Thời Gian Lập Lô')}:</strong> {policeExportSummary.generatedAt}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
