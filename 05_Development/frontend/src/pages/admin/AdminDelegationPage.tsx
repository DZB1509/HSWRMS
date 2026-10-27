import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Clock,
  RefreshCw,
  AlertCircle,
  Eye,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import {
  delegationApi,
  formatDelegationTime,
  normalizeDelegationStatus,
  validateDelegationAuthorization,
  type DelegationViewDto,
  type DelegablePermissionViewDto,
} from '../../features/m6-admin/api/delegationApi';
import {
  MODULE_DESCRIPTIONS,
  ACTION_NAMES,
} from '../../features/m6-admin/api/permissionMatrixApi';

export const AdminDelegationPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const { canView } = useMemo(
    () => validateDelegationAuthorization(currentUser),
    [currentUser]
  );

  const [delegations, setDelegations] = useState<DelegationViewDto[]>([]);
  const [delegablePermissions, setDelegablePermissions] = useState<DelegablePermissionViewDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Inspector state
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationViewDto | null>(null);

  const loadData = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError('Bạn không có quyền truy cập Ủy Quyền Quản Lý (Yêu cầu quyền S52:V).');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [delegationList, delegables] = await Promise.all([
        delegationApi.list(),
        delegationApi.listDelegablePermissions(),
      ]);

      setDelegations(delegationList);
      setDelegablePermissions(delegables);
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách ủy quyền từ máy chủ';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [canView, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered delegations
  const filteredDelegations = useMemo(() => {
    return delegations.filter((del) => {
      const status = normalizeDelegationStatus(del.status);
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        del.managerName.toLowerCase().includes(q) ||
        String(del.delegationId).includes(q) ||
        del.permissions.some((p) => p.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [delegations, statusFilter, searchQuery]);

  const totalItems = filteredDelegations.length;
  const paginatedDelegations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDelegations.slice(start, start + pageSize);
  }, [filteredDelegations, currentPage, pageSize]);

  // Permission label helper
  const renderPermissionBadge = (permCode: string) => {
    const parts = permCode.split(':');
    const mod = parts[0] || permCode;
    const act = parts[1] || '';
    const modName = MODULE_DESCRIPTIONS[mod]?.name || mod;
    const actName = ACTION_NAMES[act]?.label || act;

    return (
      <span
        key={permCode}
        className="hsw-perm-badge delegable"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
        }}
        title={`${modName} (${actName})`}
      >
        <Sparkles size={10} />
        <code>{permCode}</code> {modName}
      </span>
    );
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.delegation.pageTitle', 'Ủy Quyền Quản Lý (Admin Rights Delegation)')}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-sand)',
                color: 'var(--text-primary)',
              }}>
                Phân Hệ S52 (Chỉ Đọc & Tra Cứu)
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.delegation.pageSubtitle', 'Cấp quyền ủy quyền có thời hạn cho Quản lý vận hành (Manager) trong phạm vi cho phép, không chuyển giao toàn bộ quyền Quản trị.')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              disabled={loading}
              icon={<RefreshCw size={14} className={loading ? 'hsw-spin' : ''} />}
            >
              {t('common.actions.refresh', 'Làm Mới')}
            </Button>

            {/* Mutation button disabled in Phase 5.4 */}
            <Button
              variant="primary"
              size="sm"
              disabled={true}
              icon={<Plus size={15} />}
              title="Tính năng Cấp quyền ủy quyền mới (POST) tạm thời bị khóa trong Phase 5.4 (Read-Only Audit)"
            >
              Cấp Ủy Quyền (Đang Khóa)
            </Button>
          </div>
        </div>
      </div>

      {/* Privilege Escalation Safeguard Banner */}
      <div className="hsw-gov-banner privacy" style={{ marginBottom: 'var(--space-4)' }}>
        <ShieldAlert size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.delegation.safeguardTitle', 'Ranh Giới Kiểm Soát Leo Thang Đặc Quyền (Tuân Thủ Quy Tắc BR-06)')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px', fontSize: 'var(--text-xs)' }}>
            Ủy quyền chỉ áp dụng đối với các quyền nghiệp vụ có cờ <code>is_delegable = true</code> ({delegablePermissions.length} quyền cho phép: S50 Tham số kinh doanh, S53 Xem nhật ký kiểm toán, v.v.). Quyền quản lý tài khoản nhân viên (S10–S11), cấu hình ma trận phân quyền (S51), và bản thân chức năng ủy quyền (S52) là <strong>bất biến và KHÔNG THỂ ủy quyền cho Quản lý</strong>.
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="hsw-gov-banner" style={{ backgroundColor: '#fbeeed', borderColor: 'var(--danger)', marginBottom: 'var(--space-4)' }}>
          <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--danger)' }}>Không thể tải dữ liệu ủy quyền</strong>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '2px', color: 'var(--text-secondary)' }}>{error}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={loadData}>Thử lại</Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Trạng thái:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="hsw-filter-select"
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="ALL">Tất cả trạng thái ({delegations.length})</option>
                <option value="ACTIVE">ACTIVE (Đang hiệu lực)</option>
                <option value="PENDING">PENDING (Chờ kích hoạt)</option>
                <option value="EXPIRED">EXPIRED (Hết hạn)</option>
                <option value="REVOKED">REVOKED (Đã thu hồi)</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Tìm theo tên Quản lý, ID, mã quyền..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                width: '240px',
              }}
            />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Đang hiển thị <strong>{filteredDelegations.length}</strong> / {delegations.length} bản ghi ủy quyền
          </div>
        </div>
      </div>

      {/* Delegations History Table */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Users2 size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.delegation.historyTitle', 'Lịch Sử Ủy Quyền Quản Trị Hệ Thống')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {delegations.filter((d) => normalizeDelegationStatus(d.status) === 'ACTIVE').length} Đang hiệu lực · {delegations.length} Tổng số
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="hsw-spin" style={{ margin: '0 auto var(--space-3) auto', display: 'block' }} />
            <span>Đang tải danh sách ủy quyền từ máy chủ...</span>
          </div>
        ) : paginatedDelegations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
            Không tìm thấy bản ghi ủy quyền nào phù hợp.
          </div>
        ) : (
          <div className="hsw-matrix-table-wrap">
            <table className="hsw-matrix-table">
              <thead>
                <tr>
                  <th>Mã Ủy Quyền</th>
                  <th>Quản Lý Nhận Quyền</th>
                  <th>Danh Mục Quyền Được Ủy Quyền</th>
                  <th>Thời Gian Hiệu Lực</th>
                  <th>Trạng Thái</th>
                  <th>Người Cấp</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDelegations.map((del) => {
                  const status = normalizeDelegationStatus(del.status);
                  const isActive = status === 'ACTIVE';
                  const isPending = status === 'PENDING';
                  const isExpired = status === 'EXPIRED';
                  const isRevoked = status === 'REVOKED';

                  return (
                    <tr
                      key={del.delegationId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDelegation(del)}
                    >
                      <td>
                        <code style={{ fontWeight: 700, fontSize: '11px', backgroundColor: '#f2f0ea', padding: '2px 6px', borderRadius: '3px' }}>
                          DEL-{del.delegationId}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{del.managerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Manager · ID: {del.managerUserId}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {del.permissions && del.permissions.length > 0 ? (
                            del.permissions.map((p) => renderPermissionBadge(p))
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Không có quyền nào</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                          <strong>Từ:</strong> {formatDelegationTime(del.validFrom)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <strong>Đến:</strong> {formatDelegationTime(del.validUntil)}
                        </div>
                      </td>
                      <td>
                        {isActive && (
                          <span className="hsw-audit-pill success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} />
                            ACTIVE
                          </span>
                        )}
                        {isPending && (
                          <span className="hsw-audit-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                            <Clock size={11} />
                            PENDING
                          </span>
                        )}
                        {isExpired && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            EXPIRED
                          </span>
                        )}
                        {isRevoked && (
                          <div>
                            <span className="hsw-audit-pill denied" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Ban size={11} />
                              REVOKED
                            </span>
                            {del.revokedAt && (
                              <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '2px' }}>
                                Thu hồi lúc: {formatDelegationTime(del.revokedAt)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                          Admin ID: {del.grantedByAdminUserId}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDelegation(del);
                            }}
                            icon={<Eye size={13} />}
                            title="Xem chi tiết ủy quyền"
                          >
                            Chi Tiết
                          </Button>

                          {/* Revoke button disabled in Phase 5.4 */}
                          <Button
                            variant="tertiary"
                            size="sm"
                            disabled={true}
                            style={{ color: 'var(--danger)' }}
                            icon={<Lock size={12} />}
                            title="Tính năng Thu hồi ủy quyền (POST /revoke) tạm thời bị khóa trong Phase 5.4 (Read-Only Audit)"
                          >
                            Thu Hồi (Khóa)
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalItems > pageSize && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <OperationalPagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        )}
      </div>

      {/* Selected Delegation Inspector Drawer / Card */}
      {selectedDelegation && (
        <div className="hsw-gov-card" style={{ marginTop: 'var(--space-4)', backgroundColor: '#faf9f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <Users2 size={16} style={{ color: 'var(--accent-forest)' }} />
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  Chi Tiết Bản Ghi Ủy Quyền DEL-{selectedDelegation.delegationId} ↔ {selectedDelegation.managerName}
                </h4>
                <span className={`hsw-audit-pill ${normalizeDelegationStatus(selectedDelegation.status) === 'ACTIVE' ? 'success' : 'denied'}`}>
                  {selectedDelegation.status}
                </span>
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                <div><strong>Quản lý nhận quyền:</strong> {selectedDelegation.managerName} (User ID: {selectedDelegation.managerUserId})</div>
                <div><strong>Quản trị viên cấp quyền:</strong> Admin ID {selectedDelegation.grantedByAdminUserId}</div>
                <div><strong>Khoảng thời gian hiệu lực:</strong> {formatDelegationTime(selectedDelegation.validFrom)} đến {formatDelegationTime(selectedDelegation.validUntil)}</div>
                {selectedDelegation.revokedAt && (
                  <div style={{ color: 'var(--danger)' }}><strong>Thời điểm thu hồi:</strong> {formatDelegationTime(selectedDelegation.revokedAt)}</div>
                )}
              </div>

              <div style={{ marginTop: 'var(--space-3)' }}>
                <strong style={{ fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' }}>
                  Danh sách quyền được ủy quyền ({selectedDelegation.permissions.length}):
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedDelegation.permissions.map((p) => renderPermissionBadge(p))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDelegation(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
