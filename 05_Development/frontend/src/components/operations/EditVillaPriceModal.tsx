import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import type { PhysicalVillaItem } from '../../types/villaManagement';
import { Button } from '../common/Button';
import { formatVND } from '../../i18n';

interface EditVillaPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  villa: PhysicalVillaItem | null;
  canManagePricing: boolean;
  onSavePrice: (villaId: string, newRate: number, reason: string) => void;
}

export const EditVillaPriceModal: React.FC<EditVillaPriceModalProps> = ({
  isOpen,
  onClose,
  villa,
  canManagePricing,
  onSavePrice
}) => {
  const [rate, setRate] = useState<number>(0);
  const [rateInput, setRateInput] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (villa) {
      const initialRate = villa.nightlyRate || 4500000;
      setRate(initialRate);
      setRateInput(String(initialRate));
      setReason('');
      setError(null);
    }
  }, [villa]);

  if (!isOpen || !villa) return null;

  const currentRate = villa.nightlyRate || 4500000;
  const diff = rate - currentRate;
  const diffPercent = currentRate > 0 ? ((diff / currentRate) * 100).toFixed(1) : '0';

  const handleApplyPreset = (multiplier: number) => {
    const newRate = Math.round(currentRate * multiplier / 10000) * 10000;
    setRate(newRate);
    setRateInput(String(newRate));
  };

  const handleApplyDelta = (deltaVND: number) => {
    const newRate = Math.max(500000, rate + deltaVND);
    setRate(newRate);
    setRateInput(String(newRate));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRate = rate > 0 ? rate : Number(rateInput.replace(/[^0-9]/g, ''));
    if (finalRate <= 0 || isNaN(finalRate)) {
      setError('Giá tiền thuê đêm phải lớn hơn 0 VNĐ.');
      return;
    }
    onSavePrice(villa.id, finalRate, reason.trim() || 'Điều chỉnh bảng giá thuê đêm biệt thự');
    onClose();
  };

  return (
    <div className="hsw-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="hsw-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '90%',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: 'var(--bg-canvas, #faf9f6)',
            borderBottom: '1px solid var(--border-subtle, #e5e2dc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(45, 74, 62, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-forest, #2d4a3e)'
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Chỉnh Sửa Giá Thuê Đêm — Căn {villa.villaNumber}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {villa.categoryName} · {villa.zoneName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Security / Delegation Status Banner */}
        <div style={{ padding: '12px 24px', backgroundColor: canManagePricing ? '#f0fdf4' : '#fffbeb', borderBottom: '1px solid var(--border-subtle, #e5e2dc)' }}>
          {canManagePricing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#166534' }}>
              <ShieldCheck size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
              <div>
                <strong>Ủy quyền hợp lệ (manage_pricing):</strong> Bạn có thẩm quyền cập nhật biểu giá cho căn biệt thự này. Mọi thay đổi đều được ghi log kiểm toán.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#92400e' }}>
              <ShieldAlert size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <strong>Chỉ xem — Thiếu quyền hạn:</strong> Quản lý cần được Quản Trị Viên ủy quyền năng lực <code>manage_pricing</code> tại mục <em>Ủy Quyền Quản Trị</em> để mở khóa chỉnh sửa giá tiền.
              </div>
            </div>
          )}
        </div>

        {/* Modal Form */}
        <form noValidate onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Current vs New Price Comparison Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'var(--bg-canvas, #faf9f6)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            marginBottom: '18px'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Giá Hiện Tại
              </span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {formatVND(currentRate)}
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-secondary)' }}> / đêm</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Giá Đề Xuất Mới
              </span>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: diff > 0 ? '#15803d' : diff < 0 ? '#b91c1c' : 'var(--text-primary)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px'
              }}>
                {formatVND(rate)}
                {diff !== 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: diff > 0 ? '#dcfce7' : '#fee2e2',
                    color: diff > 0 ? '#166534' : '#991b1b'
                  }}>
                    {diff > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price Input Field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Đơn Giá Thuê Mỗi Đêm (VNĐ) <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                inputMode="numeric"
                value={rateInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setRateInput(val);
                  const parsed = Number(val.replace(/[^0-9]/g, ''));
                  setRate(parsed);
                  setError(null);
                }}
                placeholder="Nhập giá mới (VNĐ)..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  paddingRight: '60px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)'
              }}>
                VNĐ
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Đọc số: <strong>{rate > 0 ? `${rate.toLocaleString('vi-VN')} Việt Nam Đồng` : 'Chưa nhập'}</strong>
            </div>
          </div>

          {/* Quick Shortcuts */}
          {canManagePricing && (
            <div style={{ marginBottom: '18px' }}>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Phím Tắt Điều Chỉnh Nhanh (Thời Vụ / Khuyến Mãi):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1.05)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0',
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    cursor: 'pointer'
                  }}
                >
                  +5% Cuối Tuần
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1.10)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0',
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    cursor: 'pointer'
                  }}
                >
                  +10% Cao Điểm / Lễ
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.95)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #fed7aa',
                    backgroundColor: '#fff7ed',
                    color: '#9a3412',
                    cursor: 'pointer'
                  }}
                >
                  -5% Giữa Tuần
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDelta(500000)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  +500.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDelta(-500000)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  -500.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => setRate(currentRate)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Đặt Lại Ban Đầu
                </button>
              </div>
            </div>
          )}

          {/* Audit Reason Input */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Lý Do Giải Trình Nghiệp Vụ (Bắt buộc cho nhật ký kiểm toán)
            </label>
            <input
              type="text"
              placeholder="VD: Điều chỉnh giá cho giai đoạn Lễ Hội Mùa Thu / Khách đoàn VIP..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #e5e2dc)',
                fontSize: '12px',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={rate <= 0}
              icon={<CheckCircle2 size={16} />}
            >
              Lưu & Áp Dụng Giá Mới
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
