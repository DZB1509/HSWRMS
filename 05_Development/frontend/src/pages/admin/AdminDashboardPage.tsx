import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Settings2,
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
import { INITIAL_STAFF_ACCOUNTS } from '../../data/mockStaff';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { parameters, delegations, auditEvents } = useGovernance();

  const activeDelegationsCount = delegations.filter((d) => d.status === 'active').length;
  const recentAuditEvents = auditEvents.slice(0, 5);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Page Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.adminDashboard.title', 'Bảng Quản Trị & Điều Hành Hệ Thống')}
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
            {t('topbar.adminClearance', 'Quyền Quản Trị Hệ Thống')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.adminDashboard.subtitle', 'Quản trị tập trung, cấu hình tham số vận hành, ủy quyền truy cập và kiểm toán an ninh hệ thống.')}
        </p>
      </div>

      {/* Prototype Honesty Notice */}
      <div className="hsw-gov-banner">
        <Info size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.adminDashboard.bannerTitle', 'Mô Hình Quản Trị Mẫu Giao Diện')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.adminDashboard.bannerNotice', 'Các tham số cấu hình và quy tắc phân quyền trong bản thử nghiệm này được quản lý ở trạng thái giao diện nhằm phục vụ đánh giá quy trình. Trong môi trường thực tế, chính sách xác thực và lưu vết bất biến được thực thi bởi máy chủ ứng dụng.')}
          </span>
        </div>
      </div>

      {/* Governance KPI Summary */}
      <div className="hsw-gov-grid">
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiParams', 'Tham Số Vận Hành')}
          </span>
          <span className="hsw-gov-kpi-val">{parameters.length}</span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiParamsSub', 'Định mức vận hành đang áp dụng')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiStaff', 'Tài Khoản Nhân Viên')}
          </span>
          <span className="hsw-gov-kpi-val">{INITIAL_STAFF_ACCOUNTS.length}</span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiStaffSub', 'Nhân sự vận hành đang hoạt động')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiDelegations', 'Ủy Quyền Quản Lý')}
          </span>
          <span className="hsw-gov-kpi-val" style={{ color: activeDelegationsCount > 0 ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
            {activeDelegationsCount}
          </span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiDelegationsSub', 'Ủy quyền giới hạn đang hiệu lực cho Quản lý')}
          </span>
        </div>

        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiAudit', 'Nhật Ký Kiểm Toán')}
          </span>
          <span className="hsw-gov-kpi-val">{auditEvents.length}</span>
          <span className="hsw-gov-kpi-sub">
            {t('operations.adminDashboard.kpiAuditSub', 'Lượt truy cập siêu dữ liệu nhạy cảm được ghi nhận')}
          </span>
        </div>
      </div>

      {/* Governance Navigation Tiles */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Settings2 size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.adminDashboard.navTitle', 'Chức Năng Quản Trị & Mô-đun Điều Hành')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('operations.adminDashboard.screensScope', 'Phạm vi quản trị viên chính thức: Màn hình 10–12 & 50–54, 56')}
          </span>
        </div>

        <div className="hsw-quicknav-grid">
          <Link to="/admin/staff" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-staff">
              <UserPlus size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.staffAccounts', 'Tài Khoản Nhân Viên')}</h4>
              <p>{t('operations.adminDashboard.descStaff', 'Quản lý tài khoản nhân viên, quyền hạn vai trò, trạng thái làm việc và ranh giới bảo mật RBAC (Màn hình 10 & 11).')}</p>
            </div>
          </Link>

          <Link to="/admin/master-data" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-master-data">
              <Database size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.masterDataManagement', 'Quản Lý Dữ Liệu Gốc')}</h4>
              <p>{t('operations.adminDashboard.descMasterData', 'Quản trị danh mục gói nghỉ dưỡng, dịch vụ spa trị liệu và phân loại biệt thự nghỉ dưỡng theo chuẩn wellness (Màn hình 12).')}</p>
            </div>
          </Link>

          <Link to="/admin/business-params" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-params">
              <Settings2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.businessParameters', 'Tham Số Nghiệp Vụ')}</h4>
              <p>{t('operations.adminDashboard.descParams', 'Cấu hình hạn chót hủy phòng, tỷ lệ hoàn cọc, tỷ lệ đặt cọc bắt buộc và thời hạn chọn thực đơn.')}</p>
            </div>
          </Link>

          <Link to="/admin/permissions" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-matrix">
              <Shield size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.permissionMatrix', 'Ma Trận Phân Quyền')}</h4>
              <p>{t('operations.adminDashboard.descMatrix', 'Kiểm tra phân bổ quyền hạn theo vai trò và thực thi các giới hạn bảo mật bất biến theo chuẩn tối thiểu hóa dữ liệu.')}</p>
            </div>
          </Link>

          <Link to="/admin/delegation" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-delegation">
              <Users2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.managerDelegation', 'Ủy Quyền Quản Lý')}</h4>
              <p>{t('operations.adminDashboard.descDelegation', 'Cấp phát quyền hạn vận hành giới hạn, có thời hạn cho Quản lý Khu nghỉ dưỡng (Sarah Jenkins).')}</p>
            </div>
          </Link>

          <Link to="/admin/audit-log" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-audit">
              <History size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.sensitiveDataAuditLog', 'Nhật Ký Kiểm Toán Nhạy Cảm')}</h4>
              <p>{t('operations.adminDashboard.descAudit', 'Xem xét siêu dữ liệu ghi nhận lượt truy cập hồ sơ sức khỏe, thông tin cư trú và giao dịch tài chính.')}</p>
            </div>
          </Link>

          <Link to="/admin/system-overview" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-overview">
              <Activity size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.systemOverviewDashboard', 'Tổng Quan Tình Trạng Hệ Thống')}</h4>
              <p>{t('operations.adminDashboard.descOverview', 'Tổng quan vận hành toàn diện và kết xuất danh sách khai báo tạm trú theo Luật Cư trú 2020.')}</p>
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
              {t('operations.adminDashboard.recentAuditTitle', 'Lượt Truy Cập Nhạy Cảm Gần Đây')}
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
              {t('operations.adminDashboard.viewFullLog', 'Xem Toàn Bộ Nhật Ký')}
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
                      {evt.result === 'SUCCESS' ? 'THÀNH CÔNG' : 'BỊ TỪ CHỐI'}
                    </span>
                    <span className="hsw-audit-cat">{evt.dataCategory}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{evt.timestamp}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {evt.actorName} ({evt.actorRole}): {t(evt.detailsKey, evt.detailsFallback)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Mã Tham Chiếu: <code>{evt.targetRef}</code> · Thao Tác: {evt.action}
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
              {t('operations.adminDashboard.immutableGuaranteesTitle', 'Nguyên Tắc An Toàn & Bảo Mật Bắt Buộc (BR-01, BR-02, BR-03, BR-06)')}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-forest)', fontWeight: 600 }}>
              {t('operations.adminDashboard.nonConfigurable', 'BẢO VỆ BẤT BIẾN')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr01Title', 'BR-01: Kiểm Soát Tài Nguyên 2 Chiều Cho Dịch Vụ Spa')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr01Desc', 'Mỗi buổi trị liệu spa bắt buộc phải có sẵn đồng thời cả Chuyên viên trị liệu và Phòng trị liệu. Không thể bỏ qua bằng tham số cấu hình.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr02Title', 'BR-02: Chặn Trả Phòng Khi Còn Khoản Chưa Thanh Toán')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr02Desc', 'Lễ tân không thể hoàn tất thủ tục trả phòng nếu hóa đơn biệt thự còn bất kỳ khoản phí spa hoặc ẩm thực phụ trội chưa thanh toán.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr03Title', 'BR-03: Tối Thiểu Hóa Dữ Liệu Sức Khỏe & Dinh Dưỡng')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr03Desc', 'Kỹ thuật viên chỉ thấy ghi chú thể chất; Đầu bếp chỉ thấy cảnh báo dị ứng thực phẩm; Lễ tân và Quản lý bị chặn xem bệnh án cá nhân.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr06Title', 'BR-06: Giới Hạn Quyền Tối Thiểu Cho Quản Lý')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr06Desc', 'Quản lý chỉ có quyền xem báo cáo phân tích tổng hợp. Quản lý không bao giờ tự động nhận toàn quyền Quản trị viên trừ khi được ủy quyền có giới hạn.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
