import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  RotateCcw,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import {
  parametersApi,
  validateParameterValue,
  canEditParameter,
  type ParameterViewDto,
} from '../../features/m6-admin/api/parametersApi';

const PARAMETER_LOCALIZED_INFO: Record<string, { label: string; desc: string; category: string }> = {
  cancellation_window_hours: {
    label: 'Khung Giờ Hủy Đặt Phòng',
    desc: 'Thời hạn tối đa trước giờ nhận phòng để khách được hủy phòng kèm chính sách hoàn tiền.',
    category: 'Vận hành đặt phòng',
  },
  refund_percentage: {
    label: 'Tỷ Lệ Hoàn Tiền Khi Hủy Hợp Lệ',
    desc: 'Phần trăm tiền cọc được hoàn trả cho khách hàng khi hủy đặt phòng trong khung giờ cho phép.',
    category: 'Tài chính & Hoàn tiền',
  },
  deposit_percentage: {
    label: 'Tỷ Lệ Đặt Cọc Gói Nghỉ Dưỡng',
    desc: 'Tỷ lệ phần trăm tổng giá trị gói dịch vụ bắt buộc thanh toán trước để xác nhận giữ chỗ.',
    category: 'Tài chính & Hoàn tiền',
  },
  max_failed_login_attempts: {
    label: 'Số Lần Đăng Nhập Sai Tối Đa',
    desc: 'Số lần đăng nhập sai mật khẩu liên tiếp trước khi tài khoản bị tự động khóa an toàn.',
    category: 'An toàn & Bảo mật',
  },
  lockout_duration_minutes: {
    label: 'Thời Gian Khóa Tài Khoản Tự Động',
    desc: 'Thời gian tài khoản tạm thời bị khóa sau khi vượt quá số lần thử đăng nhập thất bại.',
    category: 'An toàn & Bảo mật',
  },
  audit_log_retention_days: {
    label: 'Thời Gian Lưu Trữ Nhật Ký Kiểm Toán',
    desc: 'Số ngày lưu trữ bắt buộc các bản ghi nhật ký kiểm toán hệ thống trước khi tự động dọn dẹp.',
    category: 'Quản trị hệ thống',
  },
};

export const BusinessParametersPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'common']);
  const { currentUser, role, hasPermission } = useAuth();
  const { showToast } = useToast();

  const canView = hasPermission('S50:V');
  const canUpdate = hasPermission('S50:U');

  const [parameters, setParameters] = useState<ParameterViewDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Local draft inputs and per-parameter states
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadParameters = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError('Bạn không có quyền xem cấu hình tham số kinh doanh (Yêu cầu quyền S50:V).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await parametersApi.list();
      setParameters(data);

      const initialDrafts: Record<string, string> = {};
      data.forEach((p) => {
        initialDrafts[p.key] = p.value;
      });
      setDraftValues(initialDrafts);
      setFieldErrors({});
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách tham số từ máy chủ';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [canView, showToast]);

  useEffect(() => {
    loadParameters();
  }, [loadParameters]);

  const handleInputChange = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = async (param: ParameterViewDto) => {
    const rawVal = draftValues[param.key] ?? param.value;

    // Check authorization for this parameter
    if (!canUpdate || !canEditParameter(param, currentUser)) {
      const deniedMsg =
        role === 'manager' && !param.managerEditable
          ? 'Tham số này thuộc danh mục bảo mật cốt lõi, chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa.'
          : 'Bạn không có quyền cập nhật tham số này (Yêu cầu quyền S50:U).';
      showToast(deniedMsg, 'error');
      setFieldErrors((prev) => ({ ...prev, [param.key]: deniedMsg }));
      return;
    }

    // Client-side validation
    const validation = validateParameterValue(param, rawVal);
    if (!validation.isValid) {
      const validationError = validation.error || 'Giá trị tham số không hợp lệ';
      setFieldErrors((prev) => ({ ...prev, [param.key]: validationError }));
      showToast(validationError, 'error');
      return;
    }

    setSavingKeys((prev) => ({ ...prev, [param.key]: true }));
    try {
      const updated = await parametersApi.update(param.key, rawVal.trim());

      // Update state with server authoritative result
      setParameters((prev) => prev.map((p) => (p.key === updated.key ? updated : p)));
      setDraftValues((prev) => ({ ...prev, [updated.key]: updated.value }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[param.key];
        return next;
      });

      const label = PARAMETER_LOCALIZED_INFO[param.key]?.label || param.key;
      showToast(
        t('operations.params.savedToast', `Tham số "${label}" đã được cập nhật thành công và ghi nhận nhật ký kiểm toán`),
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Cập nhật tham số thất bại';
      setFieldErrors((prev) => ({ ...prev, [param.key]: msg }));
      showToast(msg, 'error');
    } finally {
      setSavingKeys((prev) => ({ ...prev, [param.key]: false }));
    }
  };

  const handleReset = (param: ParameterViewDto) => {
    setDraftValues((prev) => ({ ...prev, [param.key]: param.value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[param.key];
      return next;
    });
    showToast(t('operations.params.resetToast', 'Đã khôi phục về giá trị hiện hành trên máy chủ'), 'info');
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
      {/* Header */}
      <div className="hsw-gov-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
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
                {t('operations.params.scopeBadge', 'Quy Tắc Cấu Hình (S50)')}
              </span>
            </div>
            <p className="hsw-gov-subtitle">
              {t('operations.params.pageSubtitle', 'Cấu hình các giới hạn vận hành, yêu cầu tiền cọc, khung giờ hủy phòng và thời gian kết xuất báo cáo theo luật định.')}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadParameters}
            disabled={loading}
            icon={<RefreshCw size={14} className={loading ? 'hsw-spin' : ''} />}
          >
            {t('common.actions.refresh', 'Làm Mới')}
          </Button>
        </div>
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

      {/* Role Notice Banner for Delegated Manager */}
      {role === 'manager' && (
        <div className="hsw-gov-banner" style={{ backgroundColor: '#f0f7f3', borderColor: 'var(--accent-forest)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>
              Phân Quyền Ủy Quyền Quản Lý (Manager Delegation)
            </strong>
            <span style={{ display: 'block', marginTop: '2px' }}>
              Bạn đang thao tác với vai trò Quản lý được ủy quyền. Bạn được phép chỉnh sửa các tham số vận hành được phân cấp (Tỷ lệ cọc, khung giờ hủy, hoàn tiền). Các tham số an toàn và bảo mật hệ thống được khóa cố định đối với tài khoản Quản lý.
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="hsw-gov-banner" style={{ backgroundColor: '#fbeeed', borderColor: 'var(--danger)', marginBottom: 'var(--space-4)' }}>
          <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--danger)' }}>Không thể tải dữ liệu cấu hình</strong>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: '2px', color: 'var(--text-secondary)' }}>{error}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={loadParameters}>Thử lại</Button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="hsw-spin" style={{ margin: '0 auto var(--space-3) auto', display: 'block' }} />
          <span>Đang tải danh sách tham số nghiệp vụ từ máy chủ...</span>
        </div>
      ) : parameters.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          Không tìm thấy tham số nghiệp vụ nào trên hệ thống.
        </div>
      ) : (
        /* Parameter Cards List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {parameters.map((param) => {
            const draftVal = draftValues[param.key] ?? param.value;
            const isDirty = String(draftVal) !== String(param.value);
            const isSaving = !!savingKeys[param.key];
            const paramError = fieldErrors[param.key];
            const canEditThisParam = canEditParameter(param, currentUser);
            const localized = PARAMETER_LOCALIZED_INFO[param.key];

            return (
              <div
                key={param.key}
                className="hsw-gov-card"
                style={{
                  marginBottom: 0,
                  borderLeft: isDirty ? '3px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                  opacity: canEditThisParam ? 1 : 0.88,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  {/* Left: Metadata & Description */}
                  <div style={{ flex: '1 1 450px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {localized?.label || param.key}
                      </h3>
                      <code style={{ fontSize: '11px', backgroundColor: '#f2f0ea', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-secondary)' }}>
                        {param.key}
                      </code>

                      {/* Delegation Badge */}
                      {param.managerEditable ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#eaf3ed',
                          color: 'var(--accent-forest)'
                        }}>
                          <ShieldCheck size={11} />
                          Quản lý được phép sửa
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#f2f0ea',
                          color: 'var(--text-muted)'
                        }}>
                          <Lock size={11} />
                          Chỉ Quản trị viên
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-3) 0', lineHeight: 1.5 }}>
                      {param.description || localized?.desc || 'Không có mô tả chi tiết.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>
                        <strong>Danh mục:</strong> {localized?.category || 'Cấu hình chung'}
                      </span>
                      <span>
                        <strong>Kiểu dữ liệu:</strong> {param.valueType}
                      </span>
                      {param.minValue !== undefined && param.minValue !== null && param.maxValue !== undefined && param.maxValue !== null && (
                        <span>
                          <strong>Phạm vi cho phép:</strong> {param.minValue} – {param.maxValue} {param.unit ? `(${param.unit})` : ''}
                        </span>
                      )}
                      {param.updatedAt && (
                        <span>
                          <strong>Cập nhật:</strong> {new Date(param.updatedAt).toLocaleString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Value Input & Action Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={param.valueType === 'INT' ? 'number' : 'text'}
                        value={draftVal}
                        disabled={!canEditThisParam || isSaving}
                        onChange={(e) => handleInputChange(param.key, e.target.value)}
                        placeholder={param.value}
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 600,
                          border: paramError
                            ? '1px solid var(--danger)'
                            : isDirty
                            ? '1px solid var(--accent-forest)'
                            : '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: canEditThisParam ? '#ffffff' : '#f9f8f5',
                          color: canEditThisParam ? 'var(--text-primary)' : 'var(--text-muted)',
                          width: '130px',
                          textAlign: 'right',
                          cursor: canEditThisParam ? 'text' : 'not-allowed',
                        }}
                        aria-label={localized?.label || param.key}
                      />
                      {param.unit && (
                        <span style={{ marginLeft: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {param.unit}
                        </span>
                      )}
                      {paramError && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', fontSize: '11px', color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                          {paramError}
                        </div>
                      )}
                    </div>

                    <Button
                      variant={isDirty ? 'primary' : 'secondary'}
                      size="sm"
                      disabled={!isDirty || isSaving || !canEditThisParam}
                      onClick={() => handleSave(param)}
                      icon={<Check size={14} className={isSaving ? 'hsw-spin' : ''} />}
                    >
                      {isSaving ? 'Đang lưu...' : t('common.actions.save', 'Lưu thay đổi')}
                    </Button>

                    <Button
                      variant="tertiary"
                      size="sm"
                      disabled={!isDirty || isSaving}
                      onClick={() => handleReset(param)}
                      title={t('operations.params.resetTitle', 'Khôi phục về giá trị hiện hành trên máy chủ')}
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
      )}
    </div>
  );
};
