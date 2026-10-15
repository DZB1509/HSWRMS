import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import type { RetreatPackageMaster } from '../../types/masterData';
import { Button } from '../common/Button';
import { formatVND } from '../../i18n';

interface EditPackagePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: RetreatPackageMaster | null;
  canManagePricing: boolean;
  onSavePrice: (pkgId: string, newBasePrice: number, reason: string) => void;
}

export const EditPackagePriceModal: React.FC<EditPackagePriceModalProps> = ({
  isOpen,
  onClose,
  pkg,
  canManagePricing,
  onSavePrice
}) => {
  const [basePrice, setBasePrice] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pkg) {
      setBasePrice(pkg.basePrice);
      setReason('');
      setError(null);
    }
  }, [pkg]);

  if (!isOpen || !pkg) return null;

  const currentPrice = pkg.basePrice;
  const diff = basePrice - currentPrice;
  const diffPercent = currentPrice > 0 ? ((diff / currentPrice) * 100).toFixed(1) : '0';

  const handleApplyPreset = (multiplier: number) => {
    if (!canManagePricing) return;
    const newPrice = Math.round((currentPrice * multiplier) / 100000) * 100000;
    setBasePrice(newPrice);
  };

  const handleApplyDelta = (deltaVND: number) => {
    if (!canManagePricing) return;
    const newPrice = Math.max(1000000, basePrice + deltaVND);
    setBasePrice(newPrice);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePricing) {
      setError('Bạn không có quyền cập nhật giá gói. Cần quyền ủy quyền từ Quản Trị Viên.');
      return;
    }
    if (basePrice <= 0 || isNaN(basePrice)) {
      setError('Đơn giá gói phải lớn hơn 0 VNĐ.');
      return;
    }
    onSavePrice(pkg.id, basePrice, reason.trim() || 'Điều chỉnh bảng giá gói nghỉ dưỡng');
    onClose();
  };

  return (
    <div className="hsw-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="hsw-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          width: '90%',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
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
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706'
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Chỉnh Sửa Giá Gói Nghỉ Dưỡng — {pkg.code}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {pkg.name} ({pkg.durationDays}N/{pkg.durationNights}Đ)
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
                <strong>Ủy quyền hợp lệ (manage_pricing):</strong> Thẩm quyền điều chỉnh đơn giá trọn gói đã được phê duyệt.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#92400e' }}>
              <ShieldAlert size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <strong>Chỉ xem — Thiếu quyền hạn:</strong> Cần Quản Trị Viên ủy quyền năng lực <code>manage_pricing</code> cho Quản lý để sửa đơn giá gói.
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
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

          {/* Package Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-canvas, #faf9f6)',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '11px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Thời lượng:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {pkg.durationDays} Ngày {pkg.durationNights} Đêm
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Buổi Spa Trị Liệu:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)', marginTop: '2px' }}>
                {pkg.includedSpaSessions} Buổi tiêu chuẩn
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Mục tiêu sức khỏe:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pkg.goal}
              </div>
            </div>
          </div>

          {/* Current vs New Price */}
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
                Đơn Giá Gói Hiện Tại
              </span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {formatVND(currentPrice)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Đơn Giá Gói Mới
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
                {formatVND(basePrice)}
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

          {/* Price Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Đơn Giá Gói Trọn Gói (VNĐ) <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                disabled={!canManagePricing}
                value={basePrice || ''}
                onChange={(e) => {
                  setBasePrice(Number(e.target.value));
                  setError(null);
                }}
                step={100000}
                min={1000000}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  paddingRight: '60px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-subtle, #e5e2dc)',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  backgroundColor: canManagePricing ? '#ffffff' : '#f3f4f6',
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
              Đọc số: <strong>{basePrice > 0 ? `${basePrice.toLocaleString('vi-VN')} Việt Nam Đồng` : 'Chưa nhập'}</strong>
            </div>
          </div>

          {/* Fast presets */}
          {canManagePricing && (
            <div style={{ marginBottom: '18px' }}>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Điều Chỉnh Biểu Phí Nhanh:
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
                  +5% Điều Chỉnh Mùa
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
                  +10% Cao Điểm Hè
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
                  -5% Ưu Đãi Mùa Thấp Điểm
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDelta(1000000)}
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
                  +1.000.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => setBasePrice(currentPrice)}
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
                  Giá Ban Đầu
                </button>
              </div>
            </div>
          )}

          {/* Audit reason */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Lý Do Giải Trình Nghiệp Vụ (Nhật ký kiểm toán)
            </label>
            <input
              type="text"
              disabled={!canManagePricing}
              placeholder="VD: Cập nhật chi phí nguyên liệu thực đơn dưỡng sinh và dịch vụ trị liệu..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #e5e2dc)',
                fontSize: '12px',
                backgroundColor: canManagePricing ? '#ffffff' : '#f3f4f6',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!canManagePricing || basePrice <= 0 || basePrice === currentPrice}
              icon={<CheckCircle2 size={16} />}
            >
              Cập Nhật Đơn Giá Gói
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
