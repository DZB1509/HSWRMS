import React, { useState, useEffect, useCallback } from 'react';
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
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  adminDashboardApi,
  validateDashboardAuthorization,
  type AdminDashboardData
} from '../../features/m6-admin/api/adminDashboardApi';
import { formatAuditTimestamp } from '../../features/m6-admin/api/auditLogApi';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { currentUser } = useAuth();

  // Fail-closed Authorization check
  const authStatus = validateDashboardAuthorization(currentUser);

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!authStatus.canView) {
      setLoading(false);
      setError('Tài khoản không có thẩm quyền Administrator để xem Bảng Điều Khiển Quản Trị.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const summary = await adminDashboardApi.getDashboardSummary();
      setData(summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu bảng điều khiển từ máy chủ.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [authStatus.canView]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Page Header */}
      <div className="hsw-gov-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="hsw-gov-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                {t('operations.adminDashboard.title', 'System Administration & Governance Cockpit')}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--actor-admin, #8b5cf6)',
                  color: '#ffffff'
                }}
              >
                {t('topbar.adminClearance', 'Administrator Clearance')}
              </span>
            </div>
            <p className="hsw-gov-subtitle" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('operations.adminDashboard.subtitle', 'Trung tâm quản trị tập trung, giám sát tham số nghiệp vụ, ủy quyền vận hành và kiểm toán dữ liệu nhạy cảm.')}
            </p>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="hsw-gov-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #e5e7eb)',
              backgroundColor: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            title="Làm mới chỉ số quản trị (Không tự động polling để tránh spam Audit Log)"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {t('common.refresh', 'Làm mới chỉ số')}
          </button>
        </div>
      </div>

      {/* Prototype Honesty Notice */}
      <div
        className="hsw-gov-banner"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: 'var(--space-4)'
        }}
      >
        <Info size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#1e40af', fontSize: '13px', display: 'block' }}>
            {t('operations.adminDashboard.bannerTitle', 'Tích Hợp Dữ Liệu Thời Gian Thực & Tính Minh Bạch Kiến Trúc')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px', fontSize: '12px', color: '#1e3a8a', lineHeight: 1.4 }}>
            {t('operations.adminDashboard.bannerNotice', 'Các chỉ số Tham Số Nghiệp Vụ, Ủy Quyền, Nhật Ký Kiểm Toán và Nhân Viên được tải trực tiếp từ các API Backend đã xác minh. Các tính năng chưa có API server (như Feature Flags và System Overview Widgets) được đánh dấu minh bạch là chế độ nguyên mẫu để tránh ngộ nhận.')}
          </span>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: 'var(--space-4)',
            fontSize: '13px'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Governance KPI Summary Cards */}
      <div className="hsw-gov-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {/* KPI 1: Business Parameters */}
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiParams', 'Business Parameters')}
          </span>
          <span className="hsw-gov-kpi-val">
            {loading ? '...' : data?.businessParameters.status === 'loaded' ? data.businessParameters.value?.count : '—'}
          </span>
          <span className="hsw-gov-kpi-sub">
            {data?.businessParameters.status === 'error' ? (
              <span style={{ color: '#ef4444' }}>Lỗi tải tham số</span>
            ) : (
              t('operations.adminDashboard.kpiParamsSub', 'Quy tắc ngưỡng vận hành thực tế')
            )}
          </span>
        </div>

        {/* KPI 2: Manager Delegations */}
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiDelegations', 'Manager Delegations')}
          </span>
          <span
            className="hsw-gov-kpi-val"
            style={{
              color:
                !loading && (data?.managerDelegations.value?.activeCount ?? 0) > 0
                  ? 'var(--accent-forest, #059669)'
                  : 'var(--text-primary)'
            }}
          >
            {loading
              ? '...'
              : data?.managerDelegations.status === 'loaded'
              ? `${data.managerDelegations.value?.activeCount} / ${data.managerDelegations.value?.totalCount}`
              : '—'}
          </span>
          <span className="hsw-gov-kpi-sub">
            {data?.managerDelegations.status === 'error' ? (
              <span style={{ color: '#ef4444' }}>Lỗi tải ủy quyền</span>
            ) : (
              t('operations.adminDashboard.kpiDelegationsSub', 'Đang hoạt động / Tổng ủy quyền')
            )}
          </span>
        </div>

        {/* KPI 3: Total Audit Records (Total historical audit records in database, not 24h events) */}
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiTotalAuditRecords', 'Total Audit Records')}
          </span>
          <span className="hsw-gov-kpi-val">
            {loading ? '...' : data?.auditActivity.status === 'loaded' ? (data.auditActivity.value?.totalRecords ?? data.auditActivity.value?.totalEvents) : '—'}
          </span>
          <span className="hsw-gov-kpi-sub">
            {data?.auditActivity.status === 'error' ? (
              <span style={{ color: '#ef4444' }}>Lỗi tải kiểm toán</span>
            ) : (
              t('operations.adminDashboard.kpiTotalAuditRecordsSub', 'Tổng bản ghi kiểm toán trong lịch sử (Server-side)')
            )}
          </span>
        </div>

        {/* KPI 4: Staff Accounts */}
        <div className="hsw-gov-kpi">
          <span className="hsw-gov-kpi-label">
            {t('operations.adminDashboard.kpiStaff', 'Staff Accounts')}
          </span>
          <span className="hsw-gov-kpi-val">
            {loading
              ? '...'
              : data?.staffAccounts.status === 'loaded'
              ? `${data.staffAccounts.value?.activeCount} / ${data.staffAccounts.value?.totalCount}`
              : '—'}
          </span>
          <span className="hsw-gov-kpi-sub">
            {data?.staffAccounts.status === 'error' ? (
              <span style={{ color: '#ef4444' }}>Lỗi tải nhân viên</span>
            ) : (
              'Tài khoản đang hoạt động / Tổng số'
            )}
          </span>
        </div>

        {/* KPI 5: Feature Flags (Unintegrated / Prototype) */}
        <div className="hsw-gov-kpi" style={{ borderStyle: 'dashed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="hsw-gov-kpi-label">
              {t('operations.adminDashboard.kpiFlags', 'Feature Flags')}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px' }}>
              PROTOTYPE
            </span>
          </div>
          <span className="hsw-gov-kpi-val" style={{ color: '#6b7280' }}>
            4 / 6
          </span>
          <span className="hsw-gov-kpi-sub" style={{ color: '#9ca3af' }}>
            Chưa có API Backend (Chế độ mô phỏng)
          </span>
        </div>
      </div>

      {/* Governance Navigation Tiles */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Settings2 size={18} style={{ color: 'var(--accent-forest, #059669)' }} />
            {t('operations.adminDashboard.navTitle', 'Administrative Functions & Governance Modules')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {t('operations.adminDashboard.screensScope', 'Phạm vi quản trị chính thức: Màn hình 10–12 & 50–53')}
          </span>
        </div>

        <div className="hsw-quicknav-grid">
          <Link to="/admin/staff" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <UserPlus size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.staffAccounts', 'Staff Accounts')}</h4>
              <p>{t('operations.adminDashboard.descStaff', 'Quản lý tài khoản nhân viên, phân quyền vai trò, trạng thái làm việc và ranh giới RBAC (Màn 10 & 11).')}</p>
            </div>
          </Link>

          <Link to="/admin/master-data" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Database size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.masterDataManagement', 'Master Data Management')}</h4>
              <p>{t('operations.adminDashboard.descMasterData', 'Quản trị gói nghỉ dưỡng, liệu trình spa và danh mục biệt thự (Màn hình 12).')}</p>
            </div>
          </Link>

          <Link to="/admin/business-params" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Settings2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.businessParameters', 'Business Parameters')}</h4>
              <p>{t('operations.adminDashboard.descParams', 'Cấu hình thời hạn hủy, tỷ lệ hoàn cọc, tỷ lệ đặt cọc và hạn giờ chốt thực đơn (Màn hình 50).')}</p>
            </div>
          </Link>

          <Link to="/admin/feature-flags" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <ToggleLeft size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.featureFlags', 'Feature Flags')}</h4>
              <p>{t('operations.adminDashboard.descFlags', 'Bật/tắt các phân hệ dịch vụ tùy chọn bao gồm gọi món thêm, spa phụ và xuất báo cáo (Prototype).')}</p>
            </div>
          </Link>

          <Link to="/admin/permissions" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Shield size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.permissionMatrix', 'Permission Matrix')}</h4>
              <p>{t('operations.adminDashboard.descMatrix', 'Kiểm tra ma trận phân quyền theo vai trò, ranh giới quyền Admin bất biến và bảo vệ quyền riêng tư (Màn hình 51).')}</p>
            </div>
          </Link>

          <Link to="/admin/delegation" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Users2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.managerDelegation', 'Manager Delegation')}</h4>
              <p>{t('operations.adminDashboard.descDelegation', 'Cấp ủy quyền tạm thời có giới hạn phạm vi cho Giám đốc vận hành Resort (Màn hình 52).')}</p>
            </div>
          </Link>

          <Link to="/admin/audit-log" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <History size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.sensitiveDataAuditLog', 'Sensitive Data Audit Log')}</h4>
              <p>{t('operations.adminDashboard.descAudit', 'Xem xét lịch sử truy cập dữ liệu sức khỏe, hồ sơ cư trú và giao dịch tài chính (Màn hình 53).')}</p>
            </div>
          </Link>

          <Link to="/admin/system-overview" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon">
              <Activity size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <h4>{t('operations.sidebar.systemOverviewDashboard', 'System Overview Dashboard')}</h4>
              <p>{t('operations.adminDashboard.descOverview', 'Tổng quan vận hành đa phân hệ và trạng thái khai báo lưu trú theo quy định pháp luật.')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Audit Activity + Immutable Safety Guarantees */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Recent Audit Log Preview (Live Data) */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h3 className="hsw-gov-card-title">
              <History size={16} style={{ color: 'var(--accent-forest, #059669)' }} />
              {t('operations.adminDashboard.recentAuditTitle', 'Hoạt Động Kiểm Toán Nhạy Cảm Gần Đây')}
            </h3>
            <Link
              to="/admin/audit-log"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent-forest, #059669)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {t('operations.adminDashboard.viewFullLog', 'Xem toàn bộ')}
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
                <span style={{ fontSize: '12px' }}>Đang tải nhật ký kiểm toán gần đây...</span>
              </div>
            ) : data?.auditActivity.status === 'error' ? (
              <div style={{ padding: 'var(--space-4)', backgroundColor: '#fee2e2', borderRadius: '6px', color: '#b91c1c', fontSize: '12px' }}>
                <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                {data.auditActivity.error}
              </div>
            ) : !data?.auditActivity.value?.recentEvents.length ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)', fontSize: '12px' }}>
                Chưa có bản ghi kiểm toán nào được ghi nhận gần đây.
              </div>
            ) : (
              data.auditActivity.value.recentEvents.map((evt) => {
                const isSuccess = evt.accessStatus.toUpperCase() === 'SUCCESS';
                return (
                  <div
                    key={evt.auditLogId}
                    style={{
                      padding: 'var(--space-3)',
                      backgroundColor: '#faf9f6',
                      borderRadius: 'var(--radius-sm, 6px)',
                      border: '1px solid var(--border-subtle, #e5e7eb)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            backgroundColor: isSuccess ? '#dcfce7' : '#fee2e2',
                            color: isSuccess ? '#15803d' : '#b91c1c'
                          }}
                        >
                          {evt.accessStatus}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#eef2ff', padding: '1px 5px', borderRadius: '3px', color: '#4338ca' }}>
                          {evt.targetDataType || 'Audit'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)' }}>
                          {formatAuditTimestamp(evt.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {evt.actorRole || 'SYSTEM'} (ID: {evt.actorUserId ?? 'N/A'}): {evt.action}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Target Ref: <code>{evt.targetRefId || '—'}</code>
                        {evt.delegationId ? ` · Ủy quyền #${evt.delegationId}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Immutable Architectural Constraints */}
        <div className="hsw-gov-card" style={{ marginBottom: 0 }}>
          <div className="hsw-gov-card-header">
            <h3 className="hsw-gov-card-title">
              <ShieldAlert size={16} style={{ color: 'var(--accent-terracotta, #c2410c)' }} />
              {t('operations.adminDashboard.immutableGuaranteesTitle', 'Quy Tắc An Toàn & Bảo Mật Bất Biến (BR-01, BR-02, BR-03, BR-06)')}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--accent-forest, #059669)', fontWeight: 600 }}>
              SERVER-ENFORCED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-subtle, #e5e7eb)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest, #059669)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr01Title', 'BR-01: Ràng Buộc Đặt Lịch Spa 2 Chiều')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr01Desc', 'Buổi trị liệu yêu cầu sự sẵn sàng đồng thời của Kỹ thuật viên đạt chuẩn và Phòng trị liệu được phân bổ. Không thể bị ghi đè bởi tham số.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-subtle, #e5e7eb)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest, #059669)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr02Title', 'BR-02: Quyết Toán Folio Trước Khi Trả Phòng')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr02Desc', 'Lễ tân không thể hoàn tất Check-out nếu còn bất kỳ khoản phí Spa hoặc F&B chưa thanh toán trên hóa đơn Folio.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-subtle, #e5e7eb)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest, #059669)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr03Title', 'BR-03: Giảm Thiểu Dữ Liệu Sức Khỏe & Dị Ứng')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr03Desc', 'Kỹ thuật viên chỉ thấy chống chỉ định vật lý; Bếp chỉ thấy thẻ dị ứng món; Lễ tân và Quản lý bị chặn khỏi bệnh án y tế chi tiết.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-subtle, #e5e7eb)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-forest, #059669)' }} />
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {t('operations.adminDashboard.ruleBr06Title', 'BR-06: Nguyên Tắc Đặc Quyền Tối Thiểu Của Quản Lý')}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t('operations.adminDashboard.ruleBr06Desc', 'Vai trò Quản lý chỉ được báo cáo tổng hợp. Quản lý không kế thừa quyền Admin và chỉ nhận các quyền ủy quyền có thời hạn cụ thể.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
