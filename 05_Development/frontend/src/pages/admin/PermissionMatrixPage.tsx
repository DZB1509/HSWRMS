import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Check,
  Minus,
  Lock,
  Filter,
  RefreshCw,
  AlertCircle,
  Eye,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import {
  permissionMatrixApi,
  validateMatrixAuthorization,
  isCellLocked,
  getLockReason,
  computePendingChanges,
  MODULE_DESCRIPTIONS,
  ACTION_NAMES,
  type MatrixViewDto,
  type MatrixRowDto,
  type MatrixDiffEntryDto,
} from '../../features/m6-admin/api/permissionMatrixApi';

export const PermissionMatrixPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const { canView, canPreview } = useMemo(
    () => validateMatrixAuthorization(currentUser),
    [currentUser]
  );

  const [matrix, setMatrix] = useState<MatrixViewDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Draft changes state: map from "module:action" -> Record<roleName, boolean>
  const [draftGrants, setDraftGrants] = useState<Record<string, Record<string, boolean>>>({});

  // Preview state
  const [previewDiff, setPreviewDiff] = useState<MatrixDiffEntryDto[] | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Inspector state
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    row: MatrixRowDto;
    roleName: string;
    isGranted: boolean;
    isLocked: boolean;
    lockReason: string | null;
  } | null>(null);

  const loadMatrix = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError('Bạn không có quyền xem Ma Trận Phân Quyền (Yêu cầu quyền S51:V).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await permissionMatrixApi.getMatrix();
      setMatrix(data);

      // Initialize draft grants from authoritative backend rows
      const initialDraft: Record<string, Record<string, boolean>> = {};
      data.rows.forEach((row) => {
        const key = `${row.module}:${row.action}`;
        initialDraft[key] = { ...row.grants };
      });
      setDraftGrants(initialDraft);
      setPreviewDiff(null);
      setPreviewError(null);
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải Ma Trận Phân Quyền từ máy chủ';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [canView, showToast]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  // Compute pending changes between original matrix and draft grants
  const pendingChanges = useMemo(() => {
    if (!matrix) return [];
    return computePendingChanges(matrix.rows, draftGrants);
  }, [matrix, draftGrants]);

  // Available functional domains for filtering
  const availableDomains = useMemo(() => {
    if (!matrix) return [];
    const domains = new Set<string>();
    matrix.rows.forEach((r) => {
      const meta = MODULE_DESCRIPTIONS[r.module];
      domains.add(meta?.domain || 'Khác');
    });
    return Array.from(domains).sort();
  }, [matrix]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!matrix) return [];
    return matrix.rows.filter((row) => {
      const meta = MODULE_DESCRIPTIONS[row.module];
      const domain = meta?.domain || 'Khác';
      const matchesDomain = filterDomain === 'all' || domain === filterDomain;

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        row.module.toLowerCase().includes(q) ||
        row.action.toLowerCase().includes(q) ||
        (meta?.name && meta.name.toLowerCase().includes(q)) ||
        (meta?.desc && meta.desc.toLowerCase().includes(q));

      return matchesDomain && matchesQuery;
    });
  }, [matrix, filterDomain, searchQuery]);

  // Cell toggle handler (draft only)
  const handleCellToggle = (row: MatrixRowDto, roleName: string) => {
    if (isCellLocked(row, roleName)) {
      const reason = getLockReason(row, roleName);
      if (reason) {
        showToast(reason, 'info');
      }
      return;
    }

    const key = `${row.module}:${row.action}`;
    const currentVal = draftGrants[key]?.[roleName] ?? row.grants[roleName] ?? false;
    const nextVal = !currentVal;

    setDraftGrants((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [roleName]: nextVal,
      },
    }));

    // Invalidate stale preview when draft changes
    if (previewDiff) {
      setPreviewDiff(null);
    }
  };

  // Preview changes handler (calls read-only backend endpoint)
  const handlePreview = async () => {
    if (!canPreview) {
      const msg = 'Bạn không có quyền thực hiện Xem Trước thay đổi ma trận (Yêu cầu quyền S51:G).';
      setPreviewError(msg);
      showToast(msg, 'error');
      return;
    }

    if (pendingChanges.length === 0) {
      showToast('Không có thay đổi nào để xem trước.', 'info');
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);

    try {
      const diff = await permissionMatrixApi.previewChanges(pendingChanges);
      setPreviewDiff(diff);
      showToast(`Đã tạo bản xem trước cho ${diff.length} thay đổi quyền.`, 'info');
    } catch (err: any) {
      const msg = err?.message || 'Không thể tạo bản xem trước thay đổi từ máy chủ';
      setPreviewError(msg);
      setPreviewDiff(null);
      showToast(msg, 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Reset drafts back to original backend state
  const handleReset = () => {
    if (!matrix) return;
    const resetDraft: Record<string, Record<string, boolean>> = {};
    matrix.rows.forEach((row) => {
      const key = `${row.module}:${row.action}`;
      resetDraft[key] = { ...row.grants };
    });
    setDraftGrants(resetDraft);
    setPreviewDiff(null);
    setPreviewError(null);
    showToast('Đã khôi phục ma trận về trạng thái hiện hành trên máy chủ.', 'info');
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <h1 className="hsw-gov-title">
                {t('operations.matrix.pageTitle', 'Ma Trận Phân Quyền (RBAC Permission Matrix)')}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-sand)',
                color: 'var(--text-primary)'
              }}>
                Phân Hệ S51 (Chỉ Đọc & Preview)
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.matrix.pageSubtitle', 'Cấu hình quyền hạn theo vai trò (Role-Based Access Control), kiểm soát ranh giới bảo mật bất biến và xem trước tác động.')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadMatrix}
              disabled={loading}
              icon={<RefreshCw size={14} className={loading ? 'hsw-spin' : ''} />}
            >
              {t('common.actions.refresh', 'Làm Mới')}
            </Button>
          </div>
        </div>
      </div>

      {/* Security & Statutory Invariants Banner */}
      <div className="hsw-gov-banner privacy" style={{ marginBottom: 'var(--space-4)' }}>
        <Shield size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            Ranh Giới Bảo Mật Bất Biến & Tối Thiểu Hóa Dữ Liệu Pháp Lý
          </strong>
          <span style={{ display: 'block', marginTop: '2px', fontSize: 'var(--text-xs)' }}>
            Các ô có biểu tượng khóa (<Lock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />) đại diện cho các ranh giới bảo mật tuyệt đối theo Nghị định 13/2023/NĐ-CP, Luật Cư trú 2020 và kiểm soát an toàn hệ thống. Quản trị viên (Admin) bắt buộc phải duy trì quyền trên các phân hệ cốt lõi (S10–S12, S49–S53) để ngăn ngừa tình trạng mất quyền quản trị.
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="hsw-gov-banner" style={{ backgroundColor: '#fbeeed', borderColor: 'var(--danger)', marginBottom: 'var(--space-4)' }}>
          <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--danger)' }}>Không thể tải Ma Trận Phân Quyền</strong>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '2px', color: 'var(--text-secondary)' }}>{error}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={loadMatrix}>Thử lại</Button>
        </div>
      )}

      {/* Toolbar: Category Filter, Search & Preview Actions */}
      <div className="hsw-gov-card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {/* Left: Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Lĩnh vực:
              </span>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="hsw-filter-select"
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="all">Tất cả lĩnh vực ({matrix?.rows.length || 0})</option>
                {availableDomains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Tìm theo mã phân hệ, chức năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                width: '220px',
              }}
            />
          </div>

          {/* Right: Preview & Reset Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {pendingChanges.length > 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-forest)',
                backgroundColor: '#eaf3ed',
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
              }}>
                {pendingChanges.length} thay đổi đang soạn thảo
              </span>
            )}

            <Button
              variant="primary"
              size="sm"
              disabled={pendingChanges.length === 0 || isPreviewing || !canPreview}
              onClick={handlePreview}
              icon={<Eye size={14} className={isPreviewing ? 'hsw-spin' : ''} />}
            >
              {isPreviewing ? 'Đang kiểm tra...' : 'Xem Trước Thay Đổi (Preview)'}
            </Button>

            <Button
              variant="tertiary"
              size="sm"
              disabled={pendingChanges.length === 0 || isPreviewing}
              onClick={handleReset}
              icon={<RotateCcw size={13} />}
              title="Đặt lại các ô về giá trị hiện hành trên máy chủ"
            >
              Đặt Lại
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Diff Panel (Read-Only) */}
      {previewDiff && previewDiff.length > 0 && (
        <div
          className="hsw-gov-card"
          style={{
            marginBottom: 'var(--space-4)',
            borderLeft: '4px solid var(--accent-forest)',
            backgroundColor: '#f7faf8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Eye size={18} style={{ color: 'var(--accent-forest)' }} />
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Bản Xem Trước Thay Đổi Quyền (Preview Diff)
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: '#dcf4f2',
                color: '#0e7490',
              }}>
                Chỉ Đọc — Chưa Lưu Vào DB
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPreviewDiff(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
            >
              Đóng xem trước
            </button>
          </div>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            Dưới đây là danh sách {previewDiff.length} thay đổi quyền được máy chủ xác nhận hợp lệ qua endpoint kiểm toán chỉ đọc <code>POST /api/v1/admin/permissions/matrix/preview</code>.
          </p>

          <div style={{ overflowX: 'auto', marginBottom: 'var(--space-3)' }}>
            <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f0ea', textAlign: 'left', borderBottom: '1px solid var(--border-medium)' }}>
                  <th style={{ padding: '6px 12px' }}>Vai Trò</th>
                  <th style={{ padding: '6px 12px' }}>Phân Hệ (Screen)</th>
                  <th style={{ padding: '6px 12px' }}>Thao Tác</th>
                  <th style={{ padding: '6px 12px' }}>Trạng Thái Hiện Tại</th>
                  <th style={{ padding: '6px 12px' }}></th>
                  <th style={{ padding: '6px 12px' }}>Trạng Thái Đề Xuất</th>
                </tr>
              </thead>
              <tbody>
                {previewDiff.map((diff, idx) => (
                  <tr key={`${diff.role}-${diff.module}-${diff.action}-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '6px 12px', fontWeight: 600 }}>{diff.role}</td>
                    <td style={{ padding: '6px 12px' }}>
                      <code>{diff.module}</code> ({MODULE_DESCRIPTIONS[diff.module]?.name || diff.module})
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <code>{diff.action}</code> ({ACTION_NAMES[diff.action]?.label || diff.action})
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <span className={`hsw-perm-badge ${diff.from ? 'granted' : 'denied'}`}>
                        {diff.from ? <Check size={11} /> : <Minus size={11} />}
                        {diff.from ? 'Được Cấp' : 'Bị Từ Chối'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <ArrowRight size={14} />
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <span className={`hsw-perm-badge ${diff.to ? 'granted' : 'denied'}`} style={{ fontWeight: 700 }}>
                        {diff.to ? <Check size={11} /> : <Minus size={11} />}
                        {diff.to ? 'Được Cấp' : 'Bị Từ Chối'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phase 5.3 Invariant: Save is deliberately disabled */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-terracotta)' }}>
              <ShieldAlert size={14} />
              <span>
                <strong>Khóa an toàn Phase 5.3:</strong> Thao tác ghi trực tiếp (PUT) được DEFER. Nút lưu bên dưới bị vô hiệu hóa cho đến khi hoàn tất kiểm tra an toàn quản trị.
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              disabled={true}
              title="Thao tác lưu quyền bị khóa trong Phase 5.3"
            >
              Lưu Thay Đổi (PUT - Đang Khóa)
            </Button>
          </div>
        </div>
      )}

      {/* Preview Error Banner */}
      {previewError && (
        <div className="hsw-gov-banner" style={{ backgroundColor: '#fbeeed', borderColor: 'var(--danger)', marginBottom: 'var(--space-4)' }}>
          <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--danger)' }}>Kiểm tra xem trước thất bại</strong>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '2px', color: 'var(--text-secondary)' }}>{previewError}</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="hsw-spin" style={{ margin: '0 auto var(--space-3) auto', display: 'block' }} />
          <span>Đang tải Ma Trận Phân Quyền từ máy chủ...</span>
        </div>
      ) : !matrix || matrix.rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          Không tìm thấy dữ liệu phân quyền nào trên hệ thống.
        </div>
      ) : (
        /* Matrix Table */
        <div className="hsw-matrix-table-wrap">
          <table className="hsw-matrix-table">
            <thead>
              <tr>
                <th style={{ minWidth: '320px' }}>
                  Phân Hệ & Thao Tác (Module × Action)
                </th>
                {matrix.roles.map((r) => (
                  <th key={r.roleId} className="role-col" style={{ minWidth: '120px' }} title={r.description}>
                    {r.roleName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const rowKey = `${row.module}:${row.action}`;
                const meta = MODULE_DESCRIPTIONS[row.module];
                const actionMeta = ACTION_NAMES[row.action];

                return (
                  <tr key={row.permissionId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <code style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f2f0ea', padding: '2px 6px', borderRadius: '3px' }}>
                              {row.module}:{row.action}
                            </code>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-xs)' }}>
                              {meta?.name || row.module}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              ({actionMeta?.label || row.action})
                            </span>

                            {row.adminOnly && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: '#f2f0ea',
                                color: 'var(--text-muted)',
                              }}>
                                Admin-Only
                              </span>
                            )}

                            {row.delegable && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: '#eaf3ed',
                                color: 'var(--accent-forest)',
                              }}>
                                Có thể ủy quyền
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                            {meta?.desc || 'Không có mô tả chi tiết.'}
                          </div>

                          {meta?.compliance && (
                            <div style={{ fontSize: '10px', color: 'var(--accent-terracotta)', fontWeight: 500, marginTop: '2px' }}>
                              Pháp lý: {meta.compliance}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {matrix.roles.map((role) => {
                      const origGrant = Boolean(row.grants[role.roleName]);
                      const currentGrant = draftGrants[rowKey]?.[role.roleName] ?? origGrant;
                      const isDirty = currentGrant !== origGrant;
                      const cellLocked = isCellLocked(row, role.roleName);
                      const lockReason = getLockReason(row, role.roleName);

                      return (
                        <td
                          key={role.roleId}
                          className="role-col"
                          style={{
                            cursor: cellLocked ? 'not-allowed' : 'pointer',
                            backgroundColor: isDirty ? '#f0fdf4' : undefined,
                            border: isDirty ? '1px dashed var(--accent-forest)' : undefined,
                          }}
                          onClick={() => {
                            setSelectedCellInfo({
                              row,
                              roleName: role.roleName,
                              isGranted: currentGrant,
                              isLocked: cellLocked,
                              lockReason,
                            });
                            if (!cellLocked) {
                              handleCellToggle(row, role.roleName);
                            }
                          }}
                          title={cellLocked ? (lockReason || 'Khóa cố định') : 'Nhấp để thay đổi trạng thái (Soạn thảo)'}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {cellLocked ? (
                              <span className={`hsw-perm-badge ${currentGrant ? 'granted' : 'denied'}`} style={{ opacity: 0.85 }}>
                                <Lock size={10} style={{ marginRight: '2px', color: 'var(--accent-terracotta)' }} />
                                {currentGrant ? 'Cấp' : 'Khóa'}
                              </span>
                            ) : currentGrant ? (
                              <span className="hsw-perm-badge granted">
                                <Check size={11} />
                                {isDirty ? <strong>Cấp *</strong> : 'Cấp'}
                              </span>
                            ) : (
                              <span className="hsw-perm-badge denied">
                                <Minus size={11} />
                                {isDirty ? <strong>Chặn *</strong> : 'Chặn'}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Cell Inspector Drawer / Card */}
      {selectedCellInfo && (
        <div className="hsw-gov-card" style={{ marginTop: 'var(--space-4)', backgroundColor: '#faf9f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                {selectedCellInfo.isLocked ? (
                  <Lock size={16} style={{ color: 'var(--accent-terracotta)' }} />
                ) : (
                  <Shield size={16} style={{ color: 'var(--accent-forest)' }} />
                )}
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {MODULE_DESCRIPTIONS[selectedCellInfo.row.module]?.name || selectedCellInfo.row.module} ({selectedCellInfo.row.module}:{selectedCellInfo.row.action}) ↔ Vai trò: {selectedCellInfo.roleName}
                </h4>
                <span className={`hsw-perm-badge ${selectedCellInfo.isGranted ? 'granted' : 'denied'}`}>
                  {selectedCellInfo.isGranted ? 'Được Cấp Quyền' : 'Bị Từ Chối'}
                </span>
                {selectedCellInfo.isLocked && (
                  <span style={{ fontSize: '10px', color: 'var(--accent-terracotta)', fontWeight: 600 }}>
                    [Ranh Giới Bất Biến]
                  </span>
                )}
              </div>

              {selectedCellInfo.lockReason && (
                <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--accent-terracotta)', fontWeight: 500 }}>
                  {selectedCellInfo.lockReason}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>
                  Admin-Only: <strong>{selectedCellInfo.row.adminOnly ? 'Đúng' : 'Không'}</strong>
                </span>
                <span>
                  Ủy quyền cho Quản lý (S52): <strong>{selectedCellInfo.row.delegable ? 'Cho phép' : 'Không'}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCellInfo(null)}
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
