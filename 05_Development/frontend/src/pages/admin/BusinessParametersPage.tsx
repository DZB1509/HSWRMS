import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { useGovernance } from '../../hooks/useGovernance';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

export const BusinessParametersPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { parameters, updateParameter, resetParameterToDefault } = useGovernance();
  const { showToast } = useToast();

  // Local draft state for parameter inputs
  const [draftValues, setDraftValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    parameters.forEach((p) => {
      initial[p.key] = p.currentValue;
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = (key: string) => {
    const rawVal = draftValues[key];
    const res = updateParameter(key, rawVal);

    if (!res.success) {
      setErrors((prev) => ({ ...prev, [key]: res.error || 'Giá trị không hợp lệ' }));
      showToast(res.error || 'Cập nhật tham số thất bại', 'error');
    } else {
      showToast(t('operations.params.savedToast', 'Đã cập nhật tham số thành công và ghi nhận vào nhật ký kiểm toán'), 'success');
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleReset = (key: string, defaultValue: number | string) => {
    resetParameterToDefault(key);
    setDraftValues((prev) => ({ ...prev, [key]: defaultValue }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    showToast(t('operations.params.resetToast', 'Đã khôi phục tham số về giá trị mặc định của hệ thống'), 'info');
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
          <h1 className="hsw-gov-title">
            {t('operations.params.pageTitle', 'Tham Số Nghiệp Vụ & Ngưỡng Vận Hành')}
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
            {t('operations.params.scopeBadge', 'Quy Tắc Cấu Hình')}
          </span>
        </div>
        <p className="hsw-gov-subtitle">
          {t('operations.params.pageSubtitle', 'Cấu hình các giới hạn vận hành, yêu cầu tiền cọc, khung giờ hủy phòng và thời gian kết xuất báo cáo theo luật định.')}
        </p>
      </div>

      {/* Non-Bypassable Invariants Banner */}
      <div className="hsw-gov-banner warning">
        <ShieldAlert size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>
            {t('operations.params.safetyNoticeTitle', 'Ràng Buộc Nghiệp Vụ An Toàn Tuyệt Đối (Không Thể Ghi Đè)')}
          </strong>
          <span style={{ display: 'block', marginTop: '2px' }}>
            {t('operations.params.safetyNoticeDesc', 'Các kiểm soát an toàn cốt lõi của khu nghỉ dưỡng—bao gồm ràng buộc tài nguyên Spa 2 chiều (Kỹ thuật viên + Phòng trị liệu), chặn check-out khi còn phí chưa thanh toán, và tối thiểu hóa dữ liệu sức khỏe nhạy cảm—là bất biến kiến trúc và không thể bị ghi đè bởi tham số.')}
          </span>
        </div>
      </div>

      {/* Parameter Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {parameters.map((param) => {
          const isDirty = String(draftValues[param.key]) !== String(param.currentValue);
          const hasError = !!errors[param.key];

          return (
            <div
              key={param.key}
              className="hsw-gov-card"
              style={{
                marginBottom: 0,
                borderLeft: isDirty ? '3px solid var(--accent-forest)' : '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                {/* Left: Metadata & Description */}
                <div style={{ flex: '1 1 450px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {t(param.labelKey, param.defaultLabel)}
                    </h3>
                    <code style={{ fontSize: '11px', backgroundColor: '#f2f0ea', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                      {param.key}
                    </code>
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-3) 0', lineHeight: 1.5 }}>
                    {t(param.descriptionKey, param.defaultDescription)}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>
                      <strong>{t('operations.params.category', 'Danh mục')}:</strong> {param.category.toUpperCase()}
                    </span>
                    <span>
                      <strong>{t('operations.params.defaultVal', 'Mặc định')}:</strong> {param.defaultValue}{param.unit ? ` ${param.unit}` : ''}
                    </span>
                    {param.min !== undefined && param.max !== undefined && (
                      <span>
                        <strong>{t('operations.params.allowedRange', 'Phạm vi cho phép')}:</strong> {param.min} – {param.max}{param.unit ? ` ${param.unit}` : ''}
                      </span>
                    )}
                    <span>
                      <strong>{t('operations.params.lastUpdated', 'Cập nhật')}:</strong> {param.lastUpdatedAt} bởi {param.lastUpdatedBy}
                    </span>
                  </div>
                </div>

                {/* Right: Value Input & Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={param.type === 'time' ? 'text' : 'number'}
                      value={draftValues[param.key] ?? ''}
                      onChange={(e) => handleInputChange(param.key, e.target.value)}
                      placeholder={String(param.defaultValue)}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        border: hasError ? '1px solid var(--danger)' : isDirty ? '1px solid var(--accent-forest)' : '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#ffffff',
                        color: 'var(--text-primary)',
                        width: '130px',
                        textAlign: 'right'
                      }}
                      aria-label={t(param.labelKey, param.defaultLabel)}
                    />
                    {param.unit && (
                      <span style={{ marginLeft: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {param.unit}
                      </span>
                    )}
                    {hasError && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', fontSize: '11px', color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                        {errors[param.key]}
                      </div>
                    )}
                  </div>

                  <Button
                    variant={isDirty ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={!isDirty}
                    onClick={() => handleSave(param.key)}
                    icon={<Check size={14} />}
                  >
                    {t('common.actions.save', 'Lưu thay đổi')}
                  </Button>

                  <Button
                    variant="tertiary"
                    size="sm"
                    disabled={draftValues[param.key] === param.defaultValue && param.currentValue === param.defaultValue}
                    onClick={() => handleReset(param.key, param.defaultValue)}
                    title={t('operations.params.resetTitle', 'Khôi phục về giá trị mặc định')}
                    icon={<RotateCcw size={13} />}
                  >
                    {t('common.actions.reset', 'Đặt lại')}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
