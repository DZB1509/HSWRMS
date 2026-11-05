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
import { staffAccountsApi } from '../../features/m6-admin/api/staffAccountsApi';
import {
  ACTION_NAMES,
  getPermissionSpecification,
} from '../../features/m6-admin/api/permissionMatrixApi';

export const AdminDelegationPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const { canView, canCreate, canRevoke } = useMemo(
    () => validateDelegationAuthorization(currentUser),
    [currentUser]
  );

  const [delegations, setDelegations] = useState<DelegationViewDto[]>([]);
  const [delegablePermissions, setDelegablePermissions] = useState<DelegablePermissionViewDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mutation state for creating / revoking delegations
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [managers, setManagers] = useState<{ id: number; name: string; email: string }[]>([
    { id: 16, name: 'Demo Manager', email: 'manager@heavenstay.dev' },
    { id: 2, name: 'Resort Manager (Sarah Jenkins)', email: 'manager@heavenstay.com' },
  ]);
  const [managerUserId, setManagerUserId] = useState<string>('16');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [validFrom, setValidFrom] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [validUntil, setValidUntil] = useState<string>(() => {
    const end = new Date(Date.now() + 24 * 3600 * 1000);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
    return end.toISOString().slice(0, 16);
  });
  const [mutationPending, setMutationPending] = useState<boolean>(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

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
      setDelegations([]);
      setDelegablePermissions([]);
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

      try {
        const staffList = await staffAccountsApi.list({ role: 'manager' });
        if (staffList && staffList.length > 0) {
          setManagers(staffList.map((s) => ({ id: Number(s.id), name: s.name, email: s.email })));
        }
      } catch {
        // fallback
      }
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách ủy quyền từ máy chủ';
      setDelegations([]);
      setDelegablePermissions([]);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [canView, showToast]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate || mutationPending) return;
    const managerId = Number(managerUserId);
    const start = new Date(validFrom);
    const end = new Date(validUntil);
    if (!Number.isInteger(managerId) || managerId <= 0 || selectedPermissionIds.length === 0 ||
        Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setMutationError('Vui lòng nhập ID Quản lý hợp lệ, chọn ít nhất một quyền nghiệp vụ được phép ủy quyền, và thiết lập khoảng thời gian hợp lệ.');
      return;
    }
    setMutationPending(true);
    setMutationError(null);
    try {
      const created = await delegationApi.create({
        managerUserId: managerId,
        permissionIds: selectedPermissionIds,
        validFrom: start.toISOString(),
        validUntil: end.toISOString(),
      });
      setDelegations((previous) => [created, ...previous]);
      setShowCreateForm(false);
      setSelectedPermissionIds([]);
      showToast('Cấp ủy quyền thành công và đã được ghi nhận vào nhật ký kiểm toán.', 'success');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cấp ủy quyền.';
      setMutationError(msg);
      showToast(msg, 'error');
    } finally {
      setMutationPending(false);
    }
  };

  const handleRevoke = async (delegation: DelegationViewDto) => {
    if (!canRevoke || mutationPending) return;
    if (!window.confirm(`Xác nhận thu hồi quyền ủy quyền DEL-${delegation.delegationId}?`)) return;
    setMutationPending(true);
    setMutationError(null);
    try {
      const revoked = await delegationApi.revoke(delegation.delegationId);
      setDelegations((previous) => previous.map((item) => item.delegationId === revoked.delegationId ? revoked : item));
      setSelectedDelegation(revoked);
      showToast('Thu hồi quyền ủy quyền thành công và đã được ghi nhận vào nhật ký kiểm toán.', 'success');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể thu hồi quyền ủy quyền.';
      setMutationError(msg);
      showToast(msg, 'error');
    } finally {
      setMutationPending(false);
    }
  };

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

  // Group delegable permissions into distinct business domains
  const delegableGroups = useMemo(() => {
    const groups: {
      key: string;
      title: string;
      icon: string;
      desc: string;
      permissions: DelegablePermissionViewDto[];
    }[] = [
      {
        key: 'S12',
        title: 'Quản Trị Danh Mục Dịch Vụ & Hạng Biệt Thự (Screen S12)',
        icon: '🏨',
        desc: 'Ủy quyền quản lý toàn bộ danh mục sản phẩm kinh doanh: bảng giá, hạng biệt thự, gói kỳ nghỉ dưỡng và liệu trình Spa.',
        permissions: [],
      },
      {
        key: 'S50',
        title: 'Quy Tắc & Tham Số Nghiệp Vụ Vận Hành (Screen S50)',
        icon: '⚙️',
        desc: 'Ủy quyền điều chỉnh các quy định tài chính và thời hạn vận hành: tỷ lệ đặt cọc bắt buộc, khung giờ hủy phòng và thời hạn hoàn tiền.',
        permissions: [],
      },
      {
        key: 'AUDIT_ANALYTICS',
        title: 'Giám Sát Kiểm Toán & Tiện Ích Điều Hành Nâng Cao (Screen S53, S55)',
        icon: '🛡️',
        desc: 'Ủy quyền truy vết nhật ký kiểm toán thao tác nhân viên và mở khóa các widget phân tích thống kê chuyên sâu trên bảng điều hành S55.',
        permissions: [],
      },
      {
        key: 'RESIDENCE',
        title: 'Báo Cáo Cư Trú & Tuân Thủ Pháp Lý (RESIDENCE_REPORT)',
        icon: '📋',
        desc: 'Ủy quyền kết xuất báo cáo danh sách khách lưu trú kèm giấy tờ định danh (CCCD/Hộ chiếu) để nộp cơ quan Công an.',
        permissions: [],
      },
      {
        key: 'OTHER',
        title: 'Quyền Nghiệp Vụ Khác Được Phép Ủy Quyền',
        icon: '✨',
        desc: 'Các quyền nghiệp vụ khác được cấu hình cho phép ủy quyền trong hệ thống.',
        permissions: [],
      },
    ];

    delegablePermissions.forEach((p) => {
      if (p.module === 'S12') {
        groups[0].permissions.push(p);
      } else if (p.module === 'S50') {
        groups[1].permissions.push(p);
      } else if (p.module === 'S53' || p.module === 'S55_ADMIN_WIDGETS') {
        groups[2].permissions.push(p);
      } else if (p.module === 'RESIDENCE_REPORT') {
        groups[3].permissions.push(p);
      } else {
        groups[4].permissions.push(p);
      }
    });

    return groups.filter((g) => g.permissions.length > 0);
  }, [delegablePermissions]);

  // Permission label helper with rich granular specification
  const renderPermissionBadge = (permCode: string) => {
    const spec = getPermissionSpecification(permCode);
    const riskColor = spec.risk === 'HIGH' ? '#dc2626' : spec.risk === 'MEDIUM' ? '#d97706' : '#15803d';
    const riskBg = spec.risk === 'HIGH' ? '#fef2f2' : spec.risk === 'MEDIUM' ? '#fffbeb' : '#f0fdf4';
    const riskBorder = spec.risk === 'HIGH' ? '#fecaca' : spec.risk === 'MEDIUM' ? '#fde68a' : '#bbf7d0';

    return (
      <span
        key={permCode}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
        title={`[${permCode}] ${spec.title}\nPhạm vi tác vụ: ${spec.scope}\nẢnh hưởng: ${spec.impact}`}
      >
        <code style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#f2f0ea', padding: '1px 5px', borderRadius: '3px' }}>
          {permCode}
        </code>
        <strong style={{ color: 'var(--text-primary)' }}>{spec.title}</strong>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '1px 5px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: riskBg,
            color: riskColor,
            border: `1px solid ${riskBorder}`,
          }}
        >
          {spec.risk === 'HIGH' ? 'Cao' : spec.risk === 'MEDIUM' ? 'Vừa' : 'Thấp'}
        </span>
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
                Phân Hệ S52 (Tra Cứu & Quản Lý Ủy Quyền)
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

            <Button
              variant="primary"
              size="sm"
              disabled={!canCreate || loading || mutationPending}
              onClick={() => { setMutationError(null); setShowCreateForm((shown) => !shown); }}
              icon={<Plus size={15} />}
              title={!canCreate ? 'Yêu cầu quyền S52:C để cấp ủy quyền.' : 'Cấp quyền ủy quyền có thời hạn cho Quản lý.'}
            >
              {showCreateForm ? 'Đóng Biểu Mẫu' : 'Cấp Ủy Quyền'}
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
            Ủy quyền chỉ áp dụng đối với các quyền nghiệp vụ có cờ <code>is_delegable = true</code> ({delegablePermissions.length > 0 ? delegablePermissions.length : '9'} quyền cho phép: S50 Tham số kinh doanh, S53 Xem nhật ký kiểm toán, S12 Dữ liệu gốc, v.v.). Quyền quản lý tài khoản nhân viên (S10–S11), cấu hình ma trận phân quyền (S51), và bản thân chức năng ủy quyền (S52) là <strong>bất biến và KHÔNG THỂ ủy quyền cho Quản lý</strong>.
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

      {/* Mutation Error */}
      {mutationError && (
        <div className="hsw-gov-banner" role="alert" style={{ backgroundColor: '#fbeeed', borderColor: 'var(--danger)', marginBottom: 'var(--space-4)' }}>
          <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--danger)' }}>Thao tác ủy quyền thất bại</strong>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '2px', color: 'var(--text-secondary)' }}>{mutationError}</div>
          </div>
        </div>
      )}

      {/* Create Delegation Form Modal / Card */}
      {showCreateForm && canCreate && (
        <form className="hsw-gov-card" onSubmit={handleCreate} style={{ marginBottom: 'var(--space-4)', border: '1px solid var(--accent-forest)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <h2 className="hsw-gov-card-title" style={{ margin: 0 }}>
              <Users2 size={18} style={{ color: 'var(--accent-forest)' }} />
              Cấp Ủy Quyền Quyền Hạn Quản Trị Có Thời Hạn Cho Quản Lý
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
            >
              ✕ Đóng
            </button>
          </div>
          <p className="hsw-gov-subtitle" style={{ marginBottom: 'var(--space-4)' }}>
            Máy chủ sẽ xác thực tài khoản nhận quyền phải là Quản lý (Manager) đang hoạt động, các quyền được chọn phải có cờ <code>is_delegable = true</code>, và khoảng thời gian hiệu lực phải hợp lệ trước khi cấp quyền.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Quản Lý Nhận Ủy Quyền (Manager):
              </label>
              <select
                value={managerUserId}
                onChange={(e) => setManagerUserId(e.target.value)}
                required
                disabled={mutationPending}
                style={{ width: '100%', padding: 'var(--space-2)', fontSize: 'var(--text-xs)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff' }}
              >
                {managers.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name} ({m.email}) - ID #{m.id}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                Chọn đúng tài khoản Quản lý nhận quyền ủy quyền hành chính.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Thời Gian Bắt Đầu Hiệu Lực:
              </label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
                disabled={mutationPending}
                style={{ width: '100%', padding: 'var(--space-2)', fontSize: 'var(--text-xs)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Thời Gian Kết Thúc Hiệu Lực:
              </label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
                disabled={mutationPending}
                style={{ width: '100%', padding: 'var(--space-2)', fontSize: 'var(--text-xs)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', backgroundColor: '#fbfaf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <div>
                <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  Danh Mục Quyền Nghiệp Vụ Cho Phép Ủy Quyền ({delegablePermissions.length} quyền khả dụng từ máy chủ):
                </strong>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Đã chọn: <strong style={{ color: 'var(--accent-forest)' }}>{selectedPermissionIds.length}</strong> / {delegablePermissions.length} quyền
                </span>
              </div>

              {/* Quick Select Helpers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={mutationPending}
                  onClick={() => setSelectedPermissionIds(delegablePermissions.map((p) => p.permissionId))}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--accent-forest)',
                    fontWeight: 600,
                  }}
                >
                  ✓ Chọn Tất Cả ({delegablePermissions.length})
                </button>

                <button
                  type="button"
                  disabled={mutationPending || selectedPermissionIds.length === 0}
                  onClick={() => setSelectedPermissionIds([])}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  ✕ Bỏ Chọn
                </button>

                <button
                  type="button"
                  disabled={mutationPending}
                  onClick={() => {
                    const safeIds = delegablePermissions
                      .filter((p) => p.action === 'V' || p.action === 'E')
                      .map((p) => p.permissionId);
                    setSelectedPermissionIds(safeIds);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: '#15803d',
                    fontWeight: 600,
                  }}
                  title="Chỉ chọn các quyền xem, tra cứu và xuất báo cáo (rủi ro thấp)"
                >
                  🛡️ Chỉ Quyền Xem / Tra Cứu (An Toàn)
                </button>

                <button
                  type="button"
                  disabled={mutationPending}
                  onClick={() => {
                    const s12Ids = delegablePermissions
                      .filter((p) => p.module === 'S12')
                      .map((p) => p.permissionId);
                    setSelectedPermissionIds(s12Ids);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                  title="Chỉ chọn nhóm quyền quản trị danh mục sản phẩm S12"
                >
                  🏨 Chỉ Danh Mục Dịch Vụ (S12)
                </button>
              </div>
            </div>

            {delegablePermissions.length === 0 ? (
              <p role="status" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 'var(--space-2) 0' }}>
                Đang tải hoặc không có quyền ủy quyền khả dụng từ máy chủ.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {delegableGroups.map((group) => {
                  const selectedInGroup = group.permissions.filter((p) =>
                    selectedPermissionIds.includes(p.permissionId)
                  ).length;

                  return (
                    <div
                      key={group.key}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3) var(--space-4)',
                      }}
                    >
                      {/* Group Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>{group.icon}</span>
                          <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                            {group.title}
                          </strong>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: selectedInGroup > 0 ? '#eaf3ed' : '#f3f4f6',
                            color: selectedInGroup > 0 ? 'var(--accent-forest)' : 'var(--text-muted)',
                            border: `1px solid ${selectedInGroup > 0 ? '#bbf7d0' : 'var(--border-subtle)'}`,
                          }}
                        >
                          {selectedInGroup} / {group.permissions.length} quyền được chọn
                        </span>
                      </div>
                      <p style={{ margin: '0 0 var(--space-3) 0', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                        {group.desc}
                      </p>

                      {/* Permission Cards Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
                        {group.permissions.map((permission) => {
                          const isChecked = selectedPermissionIds.includes(permission.permissionId);
                          const permCode = `${permission.module}:${permission.action}`;
                          const spec = getPermissionSpecification(permCode);
                          const actMeta = ACTION_NAMES[permission.action];
                          const actionLabel = actMeta?.label || permission.action;

                          const riskColor = spec.risk === 'HIGH' ? '#dc2626' : spec.risk === 'MEDIUM' ? '#d97706' : '#15803d';
                          const riskBg = spec.risk === 'HIGH' ? '#fef2f2' : spec.risk === 'MEDIUM' ? '#fffbeb' : '#f0fdf4';
                          const riskBorder = spec.risk === 'HIGH' ? '#fecaca' : spec.risk === 'MEDIUM' ? '#fde68a' : '#bbf7d0';

                          return (
                            <label
                              key={permission.permissionId}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '10px 12px',
                                backgroundColor: isChecked ? '#f4faf6' : '#faf9f6',
                                border: isChecked ? '1.5px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setSelectedPermissionIds((previous) =>
                                    e.target.checked
                                      ? [...new Set([...previous, permission.permissionId])]
                                      : previous.filter((id) => id !== permission.permissionId)
                                  )
                                }
                                style={{ marginTop: '3px', cursor: 'pointer', transform: 'scale(1.15)' }}
                              />
                              <div style={{ flex: 1 }}>
                                {/* Header: Code + Specific Title + Action & Risk Badges */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <code style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#f2f0ea', padding: '1px 5px', borderRadius: '3px' }}>
                                      {permCode}
                                    </code>
                                    <strong style={{ fontSize: 'var(--text-xs)', color: isChecked ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                                      {spec.title}
                                    </strong>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', backgroundColor: '#ffffff', padding: '1px 5px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
                                      {actionLabel}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        padding: '1px 5px',
                                        borderRadius: 'var(--radius-pill)',
                                        backgroundColor: riskBg,
                                        color: riskColor,
                                        border: `1px solid ${riskBorder}`,
                                      }}
                                    >
                                      {spec.risk === 'HIGH' ? '🔴 Cao' : spec.risk === 'MEDIUM' ? '🟡 Vừa' : '🟢 Thấp'}
                                    </span>
                                  </div>
                                </div>

                                {/* Granular Scope */}
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.35, marginBottom: '3px' }}>
                                  <strong>Phạm vi tác vụ:</strong> {spec.scope}
                                </div>

                                {/* Operational Impact */}
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                  <strong>Ảnh hưởng:</strong> {spec.impact}
                                </div>

                                {/* Legal Compliance if applicable */}
                                {spec.compliance && (
                                  <div style={{ fontSize: '10px', color: 'var(--accent-terracotta)', fontWeight: 600, marginTop: '3px' }}>
                                    ⚖️ Căn cứ: {spec.compliance}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateForm(false)}
              disabled={mutationPending}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={mutationPending || !canCreate || selectedPermissionIds.length === 0}
            >
              {mutationPending ? 'Đang Xử Lý…' : `Xác Nhận Cấp Ủy Quyền (${selectedPermissionIds.length} quyền)`}
            </Button>
          </div>
        </form>
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

                          <Button
                            variant="tertiary"
                            size="sm"
                            disabled={!canRevoke || mutationPending || (!isActive && !isPending)}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleRevoke(del);
                            }}
                            style={{ color: 'var(--danger)' }}
                            icon={<Lock size={12} />}
                            title={!canRevoke ? 'Yêu cầu quyền S52:D để thu hồi.' : 'Thu hồi ủy quyền đang hiệu lực hoặc chờ kích hoạt.'}
                          >
                            Thu Hồi
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

              <div style={{ marginTop: 'var(--space-4)' }}>
                <strong style={{ fontSize: 'var(--text-xs)', display: 'block', marginBottom: '8px' }}>
                  Danh Sách Quyền Hạn Chi Tiết Được Cấp ({selectedDelegation.permissions.length} quyền):
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
                  {selectedDelegation.permissions.map((p) => {
                    const spec = getPermissionSpecification(p);
                    const riskColor = spec.risk === 'HIGH' ? '#dc2626' : spec.risk === 'MEDIUM' ? '#d97706' : '#15803d';
                    const riskBg = spec.risk === 'HIGH' ? '#fef2f2' : spec.risk === 'MEDIUM' ? '#fffbeb' : '#f0fdf4';
                    const riskBorder = spec.risk === 'HIGH' ? '#fecaca' : spec.risk === 'MEDIUM' ? '#fde68a' : '#bbf7d0';

                    return (
                      <div
                        key={p}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#f2f0ea', padding: '1px 5px', borderRadius: '3px' }}>
                              {p}
                            </code>
                            <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{spec.title}</strong>
                          </div>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 5px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: riskBg,
                              color: riskColor,
                              border: `1px solid ${riskBorder}`,
                            }}
                          >
                            {spec.risk === 'HIGH' ? '🔴 Cao' : spec.risk === 'MEDIUM' ? '🟡 Vừa' : '🟢 Thấp'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                          <strong>Phạm vi tác vụ:</strong> {spec.scope}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <strong>Ảnh hưởng:</strong> {spec.impact}
                        </div>
                        {spec.compliance && (
                          <div style={{ fontSize: '10px', color: 'var(--accent-terracotta)', fontWeight: 600, marginTop: '3px' }}>
                            ⚖️ {spec.compliance}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
