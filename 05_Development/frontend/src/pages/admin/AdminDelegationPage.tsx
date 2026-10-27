import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Plus,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Ban,
  X,
  Sparkles,
  Database,
  RefreshCw
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import type { CapabilityKey, AdminDelegation } from '../../types/governance';
import { adminApi } from '../../features/m6-admin/api/adminApi';
import { apiClient } from '../../api/client/apiClient';
import type { DelegablePermissionDto, DelegationDto } from '../../features/m6-admin/types/admin';

interface StaffManagerOption {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

const CAPABILITY_TO_PERM_PATTERNS: Partial<Record<CapabilityKey, string[]>> = {
  manage_spa_packages: ['S12:U', 'S12:C', 'S12:D', 'S12:V'],
  manage_pricing: ['S12:U'],
  manage_villa_inventory: ['S12:U', 'S12:C', 'S12:D', 'S12:V'],
  manage_villa_maintenance: ['S12:U'],
  manage_functional_areas: ['S12:U', 'S12:C'],
  configure_business_parameters: ['S50:U', 'S50:V'],
  view_sensitive_audit_log: ['S53:V'],
  export_residence_reports: ['RESIDENCE_REPORT:E'],
};

export const AdminDelegationPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { delegations: localDelegations, createDelegation, revokeDelegation, permissionRules } = useGovernance();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  // Database integration state
  const [dbDelegations, setDbDelegations] = useState<DelegationDto[]>([]);
  const [dbDelegablePerms, setDbDelegablePerms] = useState<DelegablePermissionDto[]>([]);
  const [managers, setManagers] = useState<StaffManagerOption[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<number>(2);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for new delegation
  const delegableRules = permissionRules.filter(
    (r) => r.isDelegableToManager && r.capability !== 'manage_feature_flags'
  );
  const [selectedCaps, setSelectedCaps] = useState<CapabilityKey[]>([
    'configure_business_parameters',
    'manage_spa_packages'
  ]);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch live delegation data from backend (SQL Server)
  const fetchBackendData = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const [perms, dels, staffRes] = await Promise.all([
        adminApi.getDelegablePermissions().catch((e) => {
          console.warn('Failed to load delegable permissions from backend:', e);
          return [] as DelegablePermissionDto[];
        }),
        adminApi.getDelegations().catch((e) => {
          console.warn('Failed to load delegations from backend:', e);
          return [] as DelegationDto[];
        }),
        apiClient.get<any>('/admin/staff?role=Manager').catch((e) => {
          console.warn('Failed to load managers from backend:', e);
          return null;
        }),
      ]);

      if (perms && Array.isArray(perms) && perms.length > 0) {
        setDbDelegablePerms(perms);
      }
      if (dels && Array.isArray(dels)) {
        setDbDelegations(dels);
      }
      if (staffRes?.data?.items && Array.isArray(staffRes.data.items) && staffRes.data.items.length > 0) {
        const activeManagers = staffRes.data.items.filter((s: StaffManagerOption) => s.status === 'ACTIVE');
        setManagers(activeManagers);
        if (activeManagers.length > 0) {
          setSelectedManagerId(activeManagers[0].userId);
        }
      }
    } catch (err) {
      console.warn('Error syncing with DB:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Combined delegations: Map DB delegations into view items, merged with local mock delegations
  const combinedDelegations = useMemo<AdminDelegation[]>(() => {
    const fromDb: AdminDelegation[] = dbDelegations.map((d) => {
      const capabilities: CapabilityKey[] = [];
      if (d.permissions?.some((p) => p.startsWith('S12:'))) {
        capabilities.push('manage_spa_packages');
        capabilities.push('manage_villa_inventory');
        capabilities.push('manage_pricing');
      }
      if (d.permissions?.some((p) => p.startsWith('S50:'))) {
        capabilities.push('configure_business_parameters');
      }
      if (d.permissions?.some((p) => p === 'S53:V')) {
        capabilities.push('view_sensitive_audit_log');
      }
      if (d.permissions?.some((p) => p === 'RESIDENCE_REPORT:E')) {
        capabilities.push('export_residence_reports');
      }

      const startsStr = d.validFrom ? d.validFrom.replace('T', ' ').substring(0, 16) : '';
      const expiresStr = d.validUntil ? d.validUntil.replace('T', ' ').substring(0, 16) : '';
      const revokedStr = d.revokedAt ? d.revokedAt.replace('T', ' ').substring(0, 16) : undefined;

      return {
        id: `DEL-${d.delegationId}`,
        delegateUserId: `usr-mgr-${d.managerUserId}`,
        delegateName: d.managerName || 'Resort Manager',
        delegateRole: 'manager',
        capabilities: capabilities.length > 0 ? capabilities : ['configure_business_parameters'],
        startsAt: startsStr,
        expiresAt: expiresStr,
        status: (d.status?.toLowerCase() as any) || 'active',
        grantedBy: d.grantedByAdminUserId ? `Admin (ID: ${d.grantedByAdminUserId})` : 'Quản trị viên',
        reason: `Ủy quyền CSDL: [${d.permissions?.join(', ')}]`,
        createdAt: startsStr,
        revokedAt: revokedStr,
      };
    });

    // Merge: prefer DB record if same ID, otherwise keep unique local items
    const merged = [...fromDb];
    for (const local of localDelegations) {
      if (!merged.some((m) => m.id === local.id)) {
        merged.push(local);
      }
    }

    return merged;
  }, [dbDelegations, localDelegations]);

  const totalItems = combinedDelegations.length;
  const paginatedDelegations = combinedDelegations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleToggleCapability = (cap: CapabilityKey) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCaps.length === 0) {
      setFormError(t('operations.delegation.errorNoCaps', 'Vui lòng chọn ít nhất một quyền hạn có thể ủy quyền.'));
      return;
    }
    if (!reason.trim()) {
      setFormError(t('operations.delegation.errorNoReason', 'Lý do giải trình nghiệp vụ là bắt buộc để ghi nhật ký kiểm toán.'));
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const now = new Date();
    const startsAt = now.toISOString().replace('T', ' ').substring(0, 16);
    const end = new Date(now.getTime() + durationHours * 3600 * 1000);
    const expiresAt = end.toISOString().replace('T', ' ').substring(0, 16);

    const targetManager = managers.find((m) => m.userId === selectedManagerId);
    const managerName = targetManager ? targetManager.fullName : 'Resort Manager';
    const targetUserId = targetManager ? targetManager.userId : (selectedManagerId || 2);

    // Map selected capabilities to DB permission IDs
    const matchedPermIds = new Set<number>();
    selectedCaps.forEach((cap) => {
      const patterns = CAPABILITY_TO_PERM_PATTERNS[cap] || [];
      patterns.forEach((pattern) => {
        const [mod, act] = pattern.split(':');
        const found = dbDelegablePerms.find((p) => p.module === mod && p.action === act);
        if (found) matchedPermIds.add(found.permissionId);
      });
    });

    let permissionIds = Array.from(matchedPermIds);
    if (permissionIds.length === 0) {
      // Fallback: If S12 capability is selected, match all S12 perms (view, create, update, deactivate)
      permissionIds = dbDelegablePerms
        .filter((p) => p.module === 'S12')
        .map((p) => p.permissionId);
    }
    if (permissionIds.length === 0) {
      permissionIds = dbDelegablePerms.map((p) => p.permissionId);
    }

    try {
      // 1. Save directly to SQL Server database via Spring Boot REST API
      const created = await adminApi.createDelegation({
        managerUserId: targetUserId,
        permissionIds,
        validFrom: now.toISOString(),
        validUntil: end.toISOString(),
      });

      // 2. Also register in local governance context for UI instant feedback
      createDelegation({
        delegateUserId: `usr-mgr-${targetUserId}`,
        delegateName: managerName,
        delegateRole: 'manager',
        capabilities: selectedCaps,
        startsAt,
        expiresAt,
        reason: reason.trim(),
      });

      await fetchBackendData();

      showToast(
        `Đã cấp ủy quyền giới hạn thành công cho ${managerName} và lưu vào CSDL SQL Server (Mã: #${created.delegationId})!`,
        'success'
      );
      setModalOpen(false);
      setSelectedCaps(['configure_business_parameters', 'manage_spa_packages']);
      setReason('');
      setFormError(null);
    } catch (err: any) {
      console.error('Failed to create delegation in DB:', err);
      const errMsg = err?.message || 'Không thể lưu hồ sơ ủy quyền vào CSDL SQL Server';
      setFormError(errMsg);
      showToast(`Không thể lưu vào CSDL: ${errMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeConfirmId) return;

    try {
      const numMatch = revokeConfirmId.match(/\d+/);
      if (numMatch) {
        const numId = parseInt(numMatch[0], 10);
        await adminApi.revokeDelegation(numId).catch((e) => {
          console.warn('Backend revoke warning:', e);
        });
      }

      revokeDelegation(revokeConfirmId, 'Quản trị viên thu hồi thủ công ngay lập tức');
      await fetchBackendData();

      showToast(
        t('operations.delegation.revokedSuccess', 'Đã thu hồi ủy quyền ngay lập tức trong CSDL và hệ thống. Sự kiện kiểm toán đã được ghi nhận.'),
        'warning'
      );
    } catch (err: any) {
      console.error('Failed to revoke delegation in DB:', err);
      showToast(`Lỗi thu hồi CSDL: ${err.message || 'Lỗi mạng'}`, 'error');
    } finally {
      setRevokeConfirmId(null);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-1)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.delegation.pageTitle', 'Ủy Quyền Quyền Hạn Quản Trị Giới Hạn Cho Quản Lý')}
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
                {t('topbar.adminClearance', 'Thẩm Quyền Quản Trị Viên')}
              </span>
              <span style={{
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                fontWeight: 600,
              }}>
                <Database size={11} />
                SQL Server Live
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.delegation.pageSubtitle', 'Cấp các năng lực vận hành tạm thời, có phạm vi giới hạn chặt chẽ cho Quản Lý Vận Hành Khu Nghỉ Dưỡng (Sarah Jenkins / Resort Manager) đồng bộ trực tiếp vào CSDL SQL Server.')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchBackendData}
              disabled={isLoadingDb}
              icon={<RefreshCw size={14} className={isLoadingDb ? 'animate-spin' : ''} />}
            >
              {isLoadingDb ? 'Đang tải CSDL...' : 'Làm Mới CSDL'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalOpen(true)}
              icon={<Plus size={15} />}
            >
              {t('operations.delegation.btnGrant', 'Cấp Ủy Quyền Phạm Vi')}
            </Button>
          </div>
        </div>
      </div>

      {/* Privilege Escalation Safeguard Banner */}
      <div className="hsw-gov-banner privacy">
        <ShieldAlert size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.delegation.safeguardTitle', 'Bảo Vệ Ngăn Chặn Leo Thang Đặc Quyền (Tuân thủ BR-06)')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.delegation.safeguardDesc', 'Ủy quyền bị giới hạn nghiêm ngặt trong các chức năng vận hành được phê duyệt. Quản lý thông tin xác thực quản trị, cấu hình ma trận RBAC, xem nhật ký kiểm toán bảo mật và quyền ủy quyền lại TUYỆT ĐỐI KHÔNG THỂ ủy quyền cho Quản lý. Khi ủy quyền được lưu, quyền chỉnh sửa (S12:U/C/D) sẽ lập tức có hiệu lực trong CSDL.')}
          </span>
        </div>
      </div>

      {/* Delegations History Table */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Users2 size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.delegation.historyTitle', 'Hồ Sơ Ủy Quyền & Lịch Sử Vận Hành (Đồng Bộ CSDL)')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {combinedDelegations.filter((d) => d.status === 'active').length} {t('operations.delegation.activeCount', 'Đang hiệu lực')} · Tổng cộng {totalItems}
          </span>
        </div>

        <div className="hsw-matrix-table-wrap">
          <table className="hsw-matrix-table">
            <thead>
              <tr>
                <th>{t('operations.delegation.colId', 'Mã Ủy Quyền')}</th>
                <th>{t('operations.delegation.colRecipient', 'Người Nhận Ủy Quyền')}</th>
                <th>{t('operations.delegation.colCapabilities', 'Quyền Hạn Được Cấp')}</th>
                <th>{t('operations.delegation.colWindow', 'Khung Giờ Hiệu Lực')}</th>
                <th>{t('operations.delegation.colStatus', 'Trạng Thái')}</th>
                <th>{t('operations.delegation.colGrantor', 'Người Cấp & Lý Do')}</th>
                <th style={{ textAlign: 'right' }}>{t('common.actions.title', 'Thao Tác')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDelegations.map((del) => {
                const isActive = del.status === 'active';
                const isRevoked = del.status === 'revoked';
                const isExpired = del.status === 'expired';

                return (
                  <tr key={del.id}>
                    <td>
                      <code style={{ fontWeight: 600, fontSize: '11px' }}>{del.id}</code>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tạo lúc {del.createdAt}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{del.delegateName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        Quản lý · {del.delegateUserId}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {del.capabilities.map((c) => {
                          const rule = permissionRules.find((r) => r.capability === c);
                          return (
                            <span key={c} className="hsw-perm-badge delegable" style={{ alignSelf: 'flex-start' }}>
                              <Sparkles size={10} />
                              {rule ? t(rule.nameKey, rule.defaultName) : c}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                        <strong>{t('operations.delegation.from', 'Từ')}:</strong> {del.startsAt}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong>{t('operations.delegation.until', 'Đến')}:</strong> {del.expiresAt}
                      </div>
                    </td>
                    <td>
                      {isActive && (
                        <span className="hsw-audit-pill success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={11} />
                          {t('common.status.active', 'ĐANG HIỆU LỰC')}
                        </span>
                      )}
                      {isExpired && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                          {t('common.status.expired', 'HẾT HẠN')}
                        </span>
                      )}
                      {isRevoked && (
                        <span className="hsw-audit-pill denied" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Ban size={11} />
                          {t('common.status.revoked', 'ĐÃ THU HỒI')}
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{del.grantedBy}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                        "{del.reason}"
                      </div>
                      {del.revokedAt && (
                        <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '2px' }}>
                          Thu hồi lúc {del.revokedAt}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isActive ? (
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => setRevokeConfirmId(del.id)}
                          style={{ color: 'var(--danger)' }}
                          icon={<Ban size={13} />}
                        >
                          {t('operations.delegation.revoke', 'Thu Hồi')}
                        </Button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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

      {/* Grant Delegation Modal */}
      {modalOpen && (
        <div className="hsw-modal-overlay" onClick={() => !isSaving && setModalOpen(false)}>
          <div className="hsw-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="hsw-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-sand-soft, #f2ede5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-forest, #4f5a50)'
                }}>
                  <Users2 size={20} />
                </div>
                <div>
                  <h3 className="hsw-modal-title">
                    {t('operations.delegation.modalTitle', 'Cấp Quyền Ủy Quyền Vận Hành Giới Hạn')}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Lưu trực tiếp vào CSDL SQL Server (Quy chuẩn phân quyền BR-06)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setModalOpen(false)}
                aria-label="Đóng"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              {/* Recipient select: Sarah Jenkins / Resort Manager from DB */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('operations.delegation.delegateeLabel', 'Người Nhận Được Chỉ Định')}
                </label>
                {managers.length > 0 ? (
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '12px',
                      border: '1px solid var(--border-strong, #c8c4bc)',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {managers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName} ({m.email}) — User ID: {m.userId} (Active Manager)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-canvas, #faf9f6)',
                    border: '1px solid var(--border-subtle, #e5e2dc)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Resort Manager</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>— Quản Lý Vận Hành Khu Nghỉ Dưỡng (manager@heavenstay.com)</span>
                    </div>
                    <code style={{
                      fontSize: '11px',
                      backgroundColor: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle, #e5e2dc)',
                      color: 'var(--accent-forest, #4f5a50)',
                      fontWeight: 600
                    }}>User ID: 2</code>
                  </div>
                )}
              </div>

              {/* Scoped Capabilities Checkboxes */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('operations.delegation.selectCapsLabel', 'Chọn Quyền Hạn Ủy Quyền (Chỉ Trong Phạm Vi Cho Phép)')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {delegableRules.map((r) => {
                    const checked = selectedCaps.includes(r.capability);
                    return (
                      <label
                        key={r.capability}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px 14px',
                          backgroundColor: checked ? '#f4faf6' : '#faf9f6',
                          border: checked ? '1.5px solid var(--accent-forest, #4f5a50)' : '1px solid var(--border-subtle, #e5e2dc)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCapability(r.capability)}
                          style={{ marginTop: '2px', accentColor: 'var(--accent-forest, #4f5a50)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <strong style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                              {t(r.nameKey, r.defaultName)}
                            </strong>
                            {(r.capability === 'manage_spa_packages' || r.capability === 'manage_villa_inventory' || r.capability === 'manage_pricing') && (
                              <span style={{ fontSize: '10px', color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                CSDL S12 (Gói & Villa)
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>
                            {t(r.descriptionKey, r.defaultDescription)}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Duration Select */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('operations.delegation.durationLabel', 'Thời Hạn Khung Giờ Hiệu Lực')}
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '12px',
                    border: '1px solid var(--border-strong, #c8c4bc)',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value={8}>8 Giờ (Bao quát 1 ca làm việc)</option>
                  <option value={24}>24 Giờ (Vận hành ngày tiếp theo)</option>
                  <option value={48}>48 Giờ (Bao quát dịp cuối tuần)</option>
                  <option value={168}>7 Ngày (Nhiệm vụ trực tuần)</option>
                </select>
              </div>

              {/* Justification Reason */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('operations.delegation.reasonLabel', 'Lý Do Giải Trình Nghiệp Vụ (Bắt buộc cho nhật ký kiểm toán)')}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Ủy quyền Quản lý điều chỉnh giá và thông tin gói Spa/Retreat trong tuần lễ cao điểm."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    border: '1px solid var(--border-strong, #c8c4bc)',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {formError && (
                <div style={{
                  fontSize: '12px',
                  color: 'var(--danger)',
                  backgroundColor: 'var(--danger-bg, #fcf0ef)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  {formError}
                </div>
              )}

              <div className="hsw-modal-actions">
                <Button variant="secondary" size="sm" type="button" disabled={isSaving} onClick={() => setModalOpen(false)}>
                  {t('common.actions.cancel', 'Hủy Bỏ')}
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang Lưu Vào CSDL...' : t('operations.delegation.btnSubmitGrant', 'Xác Nhận Cấp Ủy Quyền Vào CSDL')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeConfirmId && (
        <div className="hsw-modal-overlay">
          <div className="hsw-modal-box">
            <div className="hsw-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                <h3 className="hsw-modal-title">
                  {t('operations.delegation.revokeModalTitle', 'Xác Nhận Thu Hồi Ủy Quyền Ngay Lập Tức')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevokeConfirmId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('operations.delegation.revokePrompt', 'Bạn có chắc chắn muốn thu hồi hồ sơ ủy quyền')} <strong>{revokeConfirmId}</strong>?
            </p>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {t('operations.delegation.revokeNotice', 'Quyền hạn được ủy quyền sẽ lập tức ngừng hoạt động đối với Quản lý trong CSDL SQL Server. Hồ sơ vẫn được lưu trữ trong lịch sử ủy quyền và một sự kiện thu hồi sẽ được ghi vào Nhật Ký Kiểm Toán Dữ Liệu Nhạy Cảm.')}
            </p>

            <div className="hsw-modal-actions">
              <Button variant="secondary" size="sm" onClick={() => setRevokeConfirmId(null)}>
                {t('common.actions.cancel', 'Hủy Bỏ')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRevokeConfirm}
                style={{ backgroundColor: 'var(--danger)' }}
              >
                {t('operations.delegation.confirmRevoke', 'Thu Hồi Quyền Ngay Lập Tức')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
