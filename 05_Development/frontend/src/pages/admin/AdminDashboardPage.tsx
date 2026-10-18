import React, { useState, useEffect, useCallback } from 'react';
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
  Info,
  RotateCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { getStoredStaffAccounts, getStaffStatistics } from '../../data/mockStaff';
import { staffAccountsApi } from '../../features/m6-admin/api/staffAccountsApi';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

export const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { showToast } = useToast();
  const { parameters, delegations, auditEvents, activeDelegations, refreshGovernanceData } = useGovernance();

  // Real-time Staff Statistics State
  const [staffStats, setStaffStats] = useState<{ total: number; active: number; suspended: number }>(() =>
    getStaffStatistics()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Load and refresh live staff statistics from backend or local storage
  const syncStaffAccounts = useCallback(async () => {
    try {
      const liveList = await staffAccountsApi.list();
      const active = liveList.filter((s) => s.status === 'active').length;
      setStaffStats({
        total: liveList.length,
        active,
        suspended: liveList.length - active
      });
    } catch {
      setStaffStats(getStaffStatistics());
    }
  }, []);

  // Full synchronization routine across all governance & staff modules
  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      refreshGovernanceData();
      await syncStaffAccounts();
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(nowStr);
      showToast('Toàn bộ số liệu vận hành, tài khoản nhân viên, ủy quyền và nhật ký kiểm toán đã được đồng bộ chính xác!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Có lỗi khi đồng bộ dữ liệu', 'error');
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  }, [refreshGovernanceData, syncStaffAccounts, showToast]);

  // Reactive listeners for changes occurring anywhere in the system
  useEffect(() => {
    syncStaffAccounts();

    const handleStaffUpdate = () => {
      syncStaffAccounts();
    };

    const handleGovernanceUpdate = () => {
      refreshGovernanceData();
      syncStaffAccounts();
    };

    const handleAuditUpdate = () => {
      refreshGovernanceData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'hswrms_staff_accounts' ||
        e.key === 'hswrms_business_parameters' ||
        e.key === 'hswrms_admin_delegations' ||
        e.key === 'hswrms_audit_events'
      ) {
        refreshGovernanceData();
        syncStaffAccounts();
      }
    };

    window.addEventListener('hswrms_staff_accounts_updated', handleStaffUpdate);
    window.addEventListener('hswrms_governance_updated', handleGovernanceUpdate);
    window.addEventListener('hswrms_audit_events_updated', handleAuditUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('hswrms_staff_accounts_updated', handleStaffUpdate);
      window.removeEventListener('hswrms_governance_updated', handleGovernanceUpdate);
      window.removeEventListener('hswrms_audit_events_updated', handleAuditUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncStaffAccounts, refreshGovernanceData]);

  // Computed metrics for governance board
  const customizedParamsCount = parameters.filter((p) => p.currentValue !== p.defaultValue).length;
  const activeDelegationsCount = activeDelegations.length;
  const expiredOrRevokedDelegationsCount = Math.max(0, delegations.length - activeDelegationsCount);

  // Recent 24h audit events count
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const auditEvents24hCount = auditEvents.filter((e) => {
    try {
      return new Date(e.timestamp).getTime() >= oneDayAgo;
    } catch {
      return true;
    }
  }).length;

  const recentAuditEvents = auditEvents.slice(0, 5);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Page Header with Real-Time Synchronization Bar */}
      <div className="hsw-gov-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <h1 className="hsw-gov-title" style={{ margin: 0 }}>
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
          <p className="hsw-gov-subtitle" style={{ margin: 0 }}>
            {t('operations.adminDashboard.subtitle', 'Quản trị tập trung, cấu hình tham số vận hành, ủy quyền truy cập và kiểm toán an ninh hệ thống.')}
          </p>
        </div>

        {/* Real-Time Sync Indicator & Manual Sync Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: '#edf7ee',
            border: '1px solid #c8e6cb',
            fontSize: '12px',
            color: '#1b5e20',
            fontWeight: 600
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#2e7d32',
              boxShadow: '0 0 6px rgba(46, 125, 50, 0.8)',
              display: 'inline-block'
            }} />
            <span>Tự Động Đồng Bộ Dữ Liệu</span>
            <span style={{ fontSize: '11px', color: '#4a754e', fontWeight: 400 }}>
              (Lúc {lastSyncTime})
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing}
            icon={<RotateCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />}
          >
            {isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Dữ Liệu'}
          </Button>
        </div>
      </div>

      {/* Prototype Honesty Notice */}
      <div className="hsw-gov-banner" style={{ marginBottom: 'var(--space-6)' }}>
        <Info size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.adminDashboard.bannerTitle', 'Mô Hình Quản Trị Mẫu Giao Diện')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.adminDashboard.bannerNotice', 'Các tham số cấu hình và quy tắc phân quyền trong bản thử nghiệm này được quản lý ở trạng thái giao diện nhằm phục vụ đánh giá quy trình. Mọi thay đổi ở tham số, tài khoản nhân viên, ủy quyền và kiểm toán được tự động đồng bộ hóa trên toàn bộ hệ thống.')}
          </span>
        </div>
      </div>

      {/* Synchronized Governance KPI Summary */}
      <div className="hsw-gov-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {/* KPI 1: Tham Số Vận Hành */}
        <Link to="/admin/business-params" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="hsw-gov-kpi" style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hsw-gov-kpi-label">
                {t('operations.adminDashboard.kpiParams', 'Tham Số Vận Hành')}
              </span>
              <Settings2 size={16} style={{ color: 'var(--accent-forest)', opacity: 0.8 }} />
            </div>
            <span className="hsw-gov-kpi-val">{parameters.length}</span>
            <span className="hsw-gov-kpi-sub">
              {t('operations.adminDashboard.kpiParamsSub', 'Định mức vận hành đang áp dụng')}
            </span>
            <div style={{ marginTop: 'var(--space-2)', fontSize: '11px', color: customizedParamsCount > 0 ? 'var(--accent-terracotta)' : 'var(--accent-forest)', fontWeight: 600 }}>
              {customizedParamsCount > 0
                ? `● ${customizedParamsCount} tham số đã tùy chỉnh`
                : '✓ Toàn bộ tham số theo chuẩn'}
            </div>
          </div>
        </Link>

        {/* KPI 2: Tài Khoản Nhân Viên */}
        <Link to="/admin/staff" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="hsw-gov-kpi" style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hsw-gov-kpi-label">
                {t('operations.adminDashboard.kpiStaff', 'Tài Khoản Nhân Viên')}
              </span>
              <UserPlus size={16} style={{ color: 'var(--accent-forest)', opacity: 0.8 }} />
            </div>
            <span className="hsw-gov-kpi-val">{staffStats.active} / {staffStats.total}</span>
            <span className="hsw-gov-kpi-sub">
              {t('operations.adminDashboard.kpiStaffSub', 'Đang hoạt động / Tổng biên chế')}
            </span>
            <div style={{ marginTop: 'var(--space-2)', fontSize: '11px', color: staffStats.suspended > 0 ? 'var(--accent-terracotta)' : 'var(--accent-forest)', fontWeight: 600 }}>
              {staffStats.suspended > 0
                ? `● ${staffStats.suspended} tài khoản đang tạm khóa`
                : '✓ 100% nhân sự đang kích hoạt'}
            </div>
          </div>
        </Link>

        {/* KPI 3: Ủy Quyền Quản Lý */}
        <Link to="/admin/delegation" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="hsw-gov-kpi" style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hsw-gov-kpi-label">
                {t('operations.adminDashboard.kpiDelegations', 'Ủy Quyền Quản Lý')}
              </span>
              <Users2 size={16} style={{ color: 'var(--accent-forest)', opacity: 0.8 }} />
            </div>
            <span className="hsw-gov-kpi-val" style={{ color: activeDelegationsCount > 0 ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
              {activeDelegationsCount}
            </span>
            <span className="hsw-gov-kpi-sub">
              {t('operations.adminDashboard.kpiDelegationsSub', 'Ủy quyền giới hạn đang hiệu lực cho Quản lý')}
            </span>
            <div style={{ marginTop: 'var(--space-2)', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {expiredOrRevokedDelegationsCount > 0
                ? `${expiredOrRevokedDelegationsCount} ủy quyền đã thu hồi / hết hạn`
                : 'Không có ủy quyền quá hạn'}
            </div>
          </div>
        </Link>

        {/* KPI 4: Nhật Ký Kiểm Toán */}
        <Link to="/admin/audit-log" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="hsw-gov-kpi" style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hsw-gov-kpi-label">
                {t('operations.adminDashboard.kpiAudit', 'Nhật Ký Kiểm Toán')}
              </span>
              <History size={16} style={{ color: 'var(--accent-forest)', opacity: 0.8 }} />
            </div>
            <span className="hsw-gov-kpi-val">{auditEvents.length}</span>
            <span className="hsw-gov-kpi-sub">
              {t('operations.adminDashboard.kpiAuditSub', 'Lượt truy cập siêu dữ liệu nhạy cảm được ghi nhận')}
            </span>
            <div style={{ marginTop: 'var(--space-2)', fontSize: '11px', color: 'var(--accent-forest)', fontWeight: 600 }}>
              {`+${auditEvents24hCount} lượt ghi nhận trong 24 giờ qua`}
            </div>
          </div>
        </Link>
      </div>

      {/* Governance Navigation Tiles with Dynamic Metric Badges */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-6)' }}>
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
          {/* Tile 1: Staff */}
          <Link to="/admin/staff" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-staff">
              <UserPlus size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>{t('operations.sidebar.staffAccounts', 'Tài Khoản Nhân Viên')}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#eef2f6', color: '#1a365d' }}>
                  {staffStats.active}/{staffStats.total}
                </span>
              </div>
              <p>{t('operations.adminDashboard.descStaff', 'Quản lý tài khoản nhân viên, quyền hạn vai trò, trạng thái làm việc và ranh giới bảo mật RBAC (Màn hình 10 & 11).')}</p>
            </div>
          </Link>

          {/* Tile 2: Master Data */}
          <Link to="/admin/master-data" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-master-data">
              <Database size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>{t('operations.sidebar.masterDataManagement', 'Quản Lý Dữ Liệu Gốc')}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#edf7ee', color: '#1b5e20' }}>
                  Chuẩn Wellness
                </span>
              </div>
              <p>{t('operations.adminDashboard.descMasterData', 'Quản trị danh mục gói nghỉ dưỡng, dịch vụ spa trị liệu và phân loại biệt thự nghỉ dưỡng theo chuẩn wellness (Màn hình 12).')}</p>
            </div>
          </Link>

          {/* Tile 3: Business Params */}
          <Link to="/admin/business-params" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-params">
              <Settings2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>{t('operations.sidebar.businessParameters', 'Tham Số Nghiệp Vụ')}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fff3e0', color: '#e65100' }}>
                  {parameters.length} định mức
                </span>
              </div>
              <p>{t('operations.adminDashboard.descParams', 'Cấu hình hạn chót hủy phòng, tỷ lệ hoàn cọc, tỷ lệ đặt cọc bắt buộc và thời hạn chọn thực đơn.')}</p>
            </div>
          </Link>

          {/* Tile 4: Permission Matrix */}
          <Link to="/admin/permissions" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-matrix">
              <Shield size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>{t('operations.sidebar.permissionMatrix', 'Ma Trận Phân Quyền')}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
                  RBAC
                </span>
              </div>
              <p>{t('operations.adminDashboard.descMatrix', 'Kiểm tra phân bổ quyền hạn theo vai trò và thực thi các giới hạn bảo mật bất biến theo chuẩn tối thiểu hóa dữ liệu.')}</p>
            </div>
          </Link>

          {/* Tile 5: Manager Delegation */}
          <Link to="/admin/delegation" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-delegation">
              <Users2 size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>{t('operations.sidebar.managerDelegation', 'Ủy Quyền Quản Lý')}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: activeDelegationsCount > 0 ? '#edf7ee' : '#f5f5f5', color: activeDelegationsCount > 0 ? '#1b5e20' : '#616161' }}>
                  {activeDelegationsCount} hiệu lực
                </span>
              </div>
              <p>{t('operations.adminDashboard.descDelegation', 'Cấp phát quyền hạn vận hành giới hạn, có thời hạn cho Quản lý Khu nghỉ dưỡng (Sarah Jenkins).')}</p>
            </div>
          </Link>

          {/* Tile 6: Audit Log */}
          <Link to="/admin/audit-log" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-audit">
              <History size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>{t('operations.sidebar.sensitiveDataAuditLog', 'Nhật Ký Kiểm Toán Nhạy Cảm')}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                  {auditEvents.length} bản ghi
                </span>
              </div>
              <p>{t('operations.adminDashboard.descAudit', 'Xem xét siêu dữ liệu ghi nhận lượt truy cập hồ sơ sức khỏe, thông tin cư trú và giao dịch tài chính.')}</p>
            </div>
          </Link>

          {/* Tile 7: System Overview */}
          <Link to="/admin/system-overview" className="hsw-quicknav-tile">
            <div className="hsw-quicknav-tile-icon icon-overview">
              <Activity size={20} />
            </div>
            <div className="hsw-quicknav-tile-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>{t('operations.sidebar.systemOverviewDashboard', 'Tổng Quan Tình Trạng Hệ Thống')}</h4>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                  Nghị Định 13
                </span>
              </div>
              <p>{t('operations.adminDashboard.descOverview', 'Tổng quan vận hành toàn diện và kết xuất danh sách khai báo tạm trú theo Luật Cư trú 2020.')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Synchronized Audit Activity + Immutable Safety Guarantees */}
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
            {recentAuditEvents.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Chưa có sự kiện kiểm toán nào được ghi nhận.
              </div>
            ) : (
              recentAuditEvents.map((evt) => (
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
                    gap: 'var(--space-3)',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
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
              ))
            )}
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
