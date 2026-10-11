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
            {t('operations.managerDashboard.title', 'Bảng Điều Khiển Giám Sát Quản Lý Vận Hành')}
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
            {t('topbar.managerScope', 'Phạm Vi Giới Hạn Của Quản Lý')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.managerDashboard.subtitle', 'Tổng quan vận hành cấp cao tổng hợp doanh thu thực tế, tỷ lệ lấp đầy biệt thự và khối lượng công việc của kỹ thuật viên trị liệu.')}
        </p>
      </div>

      {/* Temporary Delegated Authority Banner (If Active) */}
      {activeManagerDelegation && (
        <div className="hsw-gov-banner" style={{ borderLeftColor: '#1a6b68', backgroundColor: '#f0f9f8' }}>
          <Sparkles size={18} style={{ color: '#1a6b68', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <strong style={{ color: '#1a6b68', fontSize: 'var(--text-sm)' }}>
                {t('operations.managerDashboard.delegationActiveTitle', 'Quyền Hạn Ủy Quyền Tạm Thời Đang Hiệu Lực')}
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {t('operations.managerDashboard.expires', 'Hết hạn lúc')}: <strong>{activeManagerDelegation.expiresAt}</strong>
              </span>
            </div>
            <p style={{ margin: '4px 0 var(--space-2) 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {t('operations.managerDashboard.delegationDesc', 'Quản trị viên Alexander Wright đã tạm thời ủy quyền cho bạn các năng lực vận hành sau:')}
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
            {t('manager.revenue.totalRevenue', 'Tổng Doanh Thu')}
          </span>
          <span className="hsw-gov-kpi-val" style={{ fontSize: 'var(--text-2xl)', color: 'var(--accent-forest)' }}>
            {formatVND(revenue.totalRevenue, i18n.language)}
          </span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.managerDashboard.revenueSub', 'Tổng hợp từ Gói nghỉ dưỡng, Spa & Ẩm thực')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('manager.occupancy.rate', 'Tỷ Lệ Lấp Đầy')}
          </span>
          <span className="hsw-gov-kpi-val">{occupancy.occupancyRate}%</span>
          <span className="hsw-gov-kpi-sub">
            {occupancy.occupiedCount} / {occupancy.totalVillas} {t('operations.managerDashboard.villasOccupied', 'biệt thự đang có khách')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('manager.therapists.totalPractitioners', 'Kỹ Thuật Viên Đang Làm Việc')}
          </span>
          <span className="hsw-gov-kpi-val">{therapists.totalTherapists}</span>
          <span className="hsw-gov-kpi-sub">
            {therapists.totalBookedMinutes} {t('manager.therapists.axisMinutes', 'phút đã đặt')} ({therapists.totalScheduledSessions} buổi)
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.managerDashboard.activeStays', 'Lượt Lưu Trú Hiện Tại')}
          </span>
          <span className="hsw-gov-kpi-val">{occupancy.occupiedCount}</span>
          <span className="hsw-gov-kpi-sub">
            {occupancy.reservedCount} {t('manager.occupancy.reserved', 'lượt đặt trước sắp đến')}
          </span>
        </div>
      </div>

      {/* Authorized Management Reports Navigation */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <LayoutDashboard size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.managerDashboard.authorizedReports', 'Báo Cáo Phân Tích & Giám Sát Được Ủy Quyền')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('operations.managerDashboard.readOnlyOversight', 'Giám Sát Điều Hành · Quyền Chỉ Đọc')}
          </span>
        </div>

        <div className="hsw-quicknav-grid">
          <Link to="/manager/revenue" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <BarChart3 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.revenueAnalytics', 'Phân Tích Doanh Thu')}</h4>
              <p>{t('operations.managerDashboard.descRevenue', 'Xem phân bổ doanh thu giữa Gói nghỉ dưỡng, Trị liệu Spa và Ẩm thực F&B kèm phân trang đối soát.')}</p>
            </div>
          </Link>

          <Link to="/manager/occupancy" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <TrendingUp size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.occupancyReports', 'Báo Cáo Công Suất Phòng')}</h4>
              <p>{t('operations.managerDashboard.descOccupancy', 'Đánh giá tình trạng phòng biệt thự, tỷ lệ lấp đầy và tỷ lệ bảo trì theo từng hạng biệt thự.')}</p>
            </div>
          </Link>

          <Link to="/manager/therapist-utilization" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Users2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.therapistUtilization', 'Hiệu Suất Kỹ Thuật Viên')}</h4>
              <p>{t('operations.managerDashboard.descTherapists', 'Giám sát chỉ số tải công việc của kỹ thuật viên và huấn luyện viên yoga, số phút trị liệu và tỷ lệ hoàn thành.')}</p>
            </div>
          </Link>

          <Link to="/manager/system-overview" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Activity size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.systemOverviewPoliceExport', 'Tổng Quan Vận Hành & Khai Báo Tạm Trú')}</h4>
              <p>{t('operations.managerDashboard.descSystem', 'Tổng hợp sức khỏe vận hành liên mô-đun và xuất lô khai báo tạm trú hàng ngày (Luật Cư trú 2020).')}</p>
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
              {t('operations.managerDashboard.privacyBoundaryTitle', 'Ranh Giới Vai Trò Quản Lý & Tối Thiểu Hóa Dữ Liệu Nhạy Cảm')}
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('operations.managerDashboard.privacyBoundaryDesc', 'Với vai trò Quản Lý Vận Hành Khu Nghỉ Dưỡng, quyền truy cập của bạn chỉ tập trung vào phân tích tổng hợp và giám sát vận hành. Ghi chú lâm sàng cá nhân của khách hàng, tiền sử bệnh án y tế, chi tiết giấy tờ tùy thân và bảo mật thanh toán TUYỆT ĐỐI BỊ LOẠI TRỪ khỏi các bảng điều khiển của quản lý theo Nghị định 13 và BR-03.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
