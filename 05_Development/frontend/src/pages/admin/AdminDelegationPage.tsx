import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Plus,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Ban,
  X,
  Sparkles
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import type { CapabilityKey } from '../../types/governance';

export const AdminDelegationPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { delegations, createDelegation, revokeDelegation, permissionRules } = useGovernance();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  // Form states for new delegation
  const delegableRules = permissionRules.filter((r) => r.isDelegableToManager);
  const [selectedCaps, setSelectedCaps] = useState<CapabilityKey[]>(['configure_business_parameters']);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = delegations.length;
  const paginatedDelegations = delegations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleToggleCapability = (cap: CapabilityKey) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCaps.length === 0) {
      setFormError(t('operations.delegation.errorNoCaps', 'Vui lòng chọn ít nhất một quyền hạn có thể ủy quyền.'));
      return;
    }
    if (!reason.trim()) {
      setFormError(t('operations.delegation.errorNoReason', 'Lý do giải trình nghiệp vụ là bắt buộc để ghi nhật ký kiểm toán.'));
      return;
    }

    const now = new Date();
    const startsAt = now.toISOString().replace('T', ' ').substring(0, 16);
    const end = new Date(now.getTime() + durationHours * 3600 * 1000);
    const expiresAt = end.toISOString().replace('T', ' ').substring(0, 16);

    const res = createDelegation({
      delegateUserId: 'usr-mgr-01',
      delegateName: 'Sarah Jenkins',
      delegateRole: 'manager',
      capabilities: selectedCaps,
      startsAt,
      expiresAt,
      reason: reason.trim()
    });

    if (!res.success) {
      setFormError(res.error || 'Cấp ủy quyền thất bại');
      showToast(res.error || 'Không thể cấp quyền ủy quyền', 'error');
    } else {
      showToast(t('operations.delegation.createdSuccess', 'Đã cấp ủy quyền giới hạn thành công cho Sarah Jenkins (Quản lý)'), 'success');
      setModalOpen(false);
      setSelectedCaps(['configure_business_parameters']);
      setReason('');
      setFormError(null);
    }
  };

  const handleRevokeConfirm = () => {
    if (!revokeConfirmId) return;
    revokeDelegation(revokeConfirmId, 'Quản trị viên thu hồi thủ công ngay lập tức');
    showToast(t('operations.delegation.revokedSuccess', 'Đã thu hồi ủy quyền ngay lập tức. Sự kiện kiểm toán đã được ghi nhận.'), 'warning');
    setRevokeConfirmId(null);
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
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.delegation.pageSubtitle', 'Cấp các năng lực vận hành tạm thời, có phạm vi giới hạn chặt chẽ cho Quản Lý Vận Hành Khu Nghỉ Dưỡng (Sarah Jenkins) mà không cấp toàn quyền Quản Trị Viên.')}
            </p>
          </div>

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

      {/* Privilege Escalation Safeguard Banner */}
      <div className="hsw-gov-banner privacy">
        <ShieldAlert size={18} style={{ color: 'var(--accent-terracotta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.delegation.safeguardTitle', 'Bảo Vệ Ngăn Chặn Leo Thang Đặc Quyền (Tuân thủ BR-06)')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.delegation.safeguardDesc', 'Ủy quyền bị giới hạn nghiêm ngặt trong các chức năng vận hành được phê duyệt. Quản lý thông tin xác thực quản trị, cấu hình ma trận RBAC, xem nhật ký kiểm toán bảo mật và quyền ủy quyền lại TUYỆT ĐỐI KHÔNG THỂ ủy quyền cho Quản lý.')}
          </span>
        </div>
      </div>

      {/* Delegations History Table */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Users2 size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.delegation.historyTitle', 'Hồ Sơ Ủy Quyền & Lịch Sử Vận Hành')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {delegations.filter((d) => d.status === 'active').length} {t('operations.delegation.activeCount', 'Đang hiệu lực')} · Tổng cộng {totalItems}
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
        <div className="hsw-modal-overlay">
          <div className="hsw-modal-box">
            <div className="hsw-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Users2 size={20} style={{ color: 'var(--accent-forest)' }} />
                <h3 className="hsw-modal-title">
                  {t('operations.delegation.modalTitle', 'Cấp Quyền Ủy Quyền Vận Hành Giới Hạn')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              {/* Recipient fixed to Sarah Jenkins (Manager) */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('operations.delegation.delegateeLabel', 'Người Nhận Được Chỉ Định')}
                </label>
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                  <strong>Sarah Jenkins</strong> — Quản Lý Vận Hành Khu Nghỉ Dưỡng (<code>usr-mgr-01</code>)
                </div>
              </div>

              {/* Scoped Capabilities Checkboxes */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('operations.delegation.selectCapsLabel', 'Chọn Quyền Hạn Ủy Quyền (Chỉ Trong Phạm Vi Cho Phép)')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {delegableRules.map((r) => {
                    const checked = selectedCaps.includes(r.capability);
                    return (
                      <label
                        key={r.capability}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--space-2)',
                          padding: 'var(--space-2)',
                          backgroundColor: checked ? '#f4faf6' : '#faf9f6',
                          border: checked ? '1px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCapability(r.capability)}
                          style={{ marginTop: '2px' }}
                        />
                        <div>
                          <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', display: 'block' }}>
                            {t(r.nameKey, r.defaultName)}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {t(r.descriptionKey, r.defaultDescription)}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Duration Select */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('operations.delegation.durationLabel', 'Thời Hạn Khung Giờ Hiệu Lực')}
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  style={{ width: '100%', padding: 'var(--space-2)', fontSize: 'var(--text-xs)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value={8}>8 Giờ (Bao quát 1 ca làm việc)</option>
                  <option value={24}>24 Giờ (Vận hành ngày tiếp theo)</option>
                  <option value={48}>48 Giờ (Bao quát dịp cuối tuần)</option>
                  <option value={168}>7 Ngày (Nhiệm vụ trực tuần)</option>
                </select>
              </div>

              {/* Justification Reason */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {t('operations.delegation.reasonLabel', 'Lý Do Giải Trình Nghiệp Vụ (Bắt buộc cho nhật ký kiểm toán)')}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Thông báo thời tiết biển yêu cầu quyền quản lý để điều chỉnh khung giờ hủy phòng trong ca cuối tuần."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {formError && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginBottom: 'var(--space-3)' }}>
                  {formError}
                </div>
              )}

              <div className="hsw-modal-actions">
                <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  {t('common.actions.cancel', 'Hủy Bỏ')}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {t('operations.delegation.btnSubmitGrant', 'Xác Nhận Cấp Ủy Quyền')}
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
              {t('operations.delegation.revokeNotice', 'Quyền hạn được ủy quyền sẽ lập tức ngừng hoạt động đối với Sarah Jenkins. Hồ sơ vẫn được lưu trữ trong lịch sử ủy quyền và một sự kiện thu hồi sẽ được ghi vào Nhật Ký Kiểm Toán Dữ Liệu Nhạy Cảm.')}
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
