import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ToggleLeft,
  AlertTriangle,
  ShieldCheck,
  Lock,
  X
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

export const FeatureFlagsPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { featureFlags, toggleFeatureFlag } = useGovernance();
  const { showToast } = useToast();

  const [confirmFlagKey, setConfirmFlagKey] = useState<string | null>(null);

  const flagToConfirm = featureFlags.find((f) => f.key === confirmFlagKey);

  const handleToggleClick = (key: string, impactLevel: 'low' | 'medium' | 'high') => {
    // Show confirmation for high-impact flags
    if (impactLevel === 'high') {
      setConfirmFlagKey(key);
    } else {
      executeToggle(key);
    }
  };

  const executeToggle = (key: string) => {
    toggleFeatureFlag(key);
    const flag = featureFlags.find((f) => f.key === key);
    const willBeEnabled = !flag?.enabled;
    showToast(
      `${t(flag?.nameKey || '', flag?.defaultName || '')}: ${willBeEnabled ? t('common.status.enabled', 'Đã kích hoạt') : t('common.status.disabled', 'Đã vô hiệu')}`,
      'info'
    );
    setConfirmFlagKey(null);
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.flags.pageTitle', 'Cờ Tính Năng Phân Hệ & Bật Tắt Vận Hành')}
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
            {t('operations.flags.systemScope', 'Phân Hệ Hệ Thống')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.flags.pageSubtitle', 'Kích hoạt hoặc tạm dừng an toàn các phân hệ tự phục vụ của khách hàng và các tác vụ xuất dữ liệu tuân thủ pháp lý.')}
        </p>
      </div>

      {/* Safety Invariants Callout */}
      <div className="hsw-gov-banner">
        <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.flags.safetyTitle', 'Ranh Giới An Toàn & Bảo Mật Là Bất Biến (Không Thể Bật/Tắt)')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.flags.safetyDesc', 'Các ràng buộc bảo mật cốt lõi (như giảm thiểu dữ liệu RBAC, kiểm tra 2 chiều trị liệu viên + phòng spa, và kiểm tra thanh toán folio) là các kiểm soát kiến trúc thiết yếu và không thể bị tắt bỏ.')}
          </span>
        </div>
      </div>

      {/* Configurable Feature Flags List */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <ToggleLeft size={18} style={{ color: 'var(--accent-forest)' }} />
            {t('operations.flags.modularTitle', 'Các Phân Hệ Chức Năng Có Thể Cấu Hình')}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {featureFlags.filter((f) => f.enabled).length} / {featureFlags.length} {t('operations.flags.activeCount', 'Đang Hoạt Động')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {featureFlags.map((flag) => {
            const isHighImpact = flag.impactLevel === 'high';

            return (
              <div
                key={flag.key}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: '#faf9f6',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)'
                }}
              >
                {/* Flag Info */}
                <div style={{ flex: '1 1 450px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {t(flag.nameKey, flag.defaultName)}
                    </h3>
                    <code style={{ fontSize: '11px', backgroundColor: '#eeebe3', padding: '1px 5px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                      {flag.key}
                    </code>
                    {isHighImpact && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#fef3e2',
                        color: 'var(--warning)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        textTransform: 'uppercase'
                      }}>
                        {t('operations.flags.highImpact', 'Ảnh Hưởng Cao')}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2) 0', lineHeight: 1.4 }}>
                    {t(flag.descriptionKey, flag.defaultDescription)}
                  </p>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {t('operations.flags.scope', 'Phạm Vi')}: <strong style={{ textTransform: 'capitalize' }}>{flag.scope}</strong> · {t('operations.flags.lastModified', 'Chỉnh sửa lần cuối')}: {flag.lastChangedAt} bởi {flag.lastChangedBy}
                  </div>
                </div>

                {/* Accessible Switch Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    aria-label={`${t(flag.nameKey, flag.defaultName)}: ${flag.enabled ? t('common.status.enabled', 'Đã bật') : t('common.status.disabled', 'Đã tắt')}`}
                    onClick={() => handleToggleClick(flag.key, flag.impactLevel)}
                    className="hsw-switch-container"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    <div className={`hsw-switch-track ${flag.enabled ? 'is-on' : ''}`}>
                      <div className="hsw-switch-thumb" />
                    </div>
                    <span className={`hsw-switch-label ${flag.enabled ? 'is-on' : ''}`}>
                      {flag.enabled ? t('common.status.enabled', 'ĐÃ BẬT') : t('common.status.disabled', 'ĐÃ TẮT')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Architectural Controls Section */}
      <div className="hsw-gov-card">
        <div className="hsw-gov-card-header">
          <h2 className="hsw-gov-card-title">
            <Lock size={18} style={{ color: 'var(--accent-terracotta)' }} />
            {t('operations.flags.immutableTitle', 'Các Kiểm Soát Cốt Lõi Bất Biến (Kiến Trúc Được Bảo Vệ)')}
          </h2>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-forest)' }}>
            {t('operations.flags.alwaysEnforced', 'LUÔN ĐƯỢC THI HÀNH')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-01: Phân Bổ Spa Hai Chiều</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Ngăn ngừa trùng lịch bằng việc yêu cầu cả Kỹ thuật viên và Phòng trị liệu phải đồng thời sẵn sàng.
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-02: Kiểm Soát Quyết Toán Hóa Đơn</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Chặn hoàn tất trả phòng khi còn bất kỳ chi phí spa hoặc ăn uống nào chưa thanh toán.
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-03: Giảm Thiểu Dữ Liệu Nhạy Cảm & RBAC</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Thực thi lọc thông tin bệnh án và dị ứng theo đúng vai trò nghiệp vụ.
            </p>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Lock size={13} style={{ color: 'var(--accent-terracotta)' }} />
              <strong style={{ fontSize: 'var(--text-xs)' }}>BR-06: Tách Biệt Đặc Quyền Quản Lý</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
              Giới hạn Quản lý ở mức giám sát điều hành; các thao tác quản trị yêu cầu ủy quyền rõ ràng.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for High-Impact Toggles */}
      {confirmFlagKey && flagToConfirm && (
        <div className="hsw-modal-overlay">
          <div className="hsw-modal-box">
            <div className="hsw-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                <h3 className="hsw-modal-title">
                  {t('operations.flags.confirmTitle', 'Xác Nhận Thay Đổi Tính Năng Có Tác Động Lớn')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmFlagKey(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label={t('common.actions.close', 'Đóng')}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('operations.flags.confirmPrompt', 'Bạn sắp thay đổi trạng thái vận hành của:')}
            </p>

            <div style={{ padding: 'var(--space-3)', backgroundColor: '#faf9f6', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', margin: 'var(--space-3) 0' }}>
              <strong style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                {t(flagToConfirm.nameKey, flagToConfirm.defaultName)}
              </strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {flagToConfirm.key} · Hiện tại: <strong>{flagToConfirm.enabled ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}</strong> → Đích: <strong>{flagToConfirm.enabled ? 'ĐÃ TẮT' : 'ĐÃ BẬT'}</strong>
              </span>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {t('operations.flags.confirmAuditNote', 'Thay đổi trạng thái này sẽ có hiệu lực ngay lập tức và ghi một bản ghi thời gian vào Nhật Ký Kiểm Toán Quản Trị.')}
            </p>

            <div className="hsw-modal-actions">
              <Button variant="secondary" size="sm" onClick={() => setConfirmFlagKey(null)}>
                {t('common.actions.cancel', 'Hủy')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => executeToggle(confirmFlagKey)}>
                {t('operations.flags.applyToggle', 'Áp Dụng Thay Đổi')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
