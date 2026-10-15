import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import type { VillaCategoryItem } from '../../types/villaManagement';
import { Button } from '../common/Button';
import { formatVND } from '../../i18n';

interface EditCategoryPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: VillaCategoryItem | null;
  canManagePricing: boolean;
  onSavePrice: (
    categoryId: number,
    newBasePrice: number,
    newModifier: number,
    reason: string
  ) => void;
}

export const EditCategoryPriceModal: React.FC<EditCategoryPriceModalProps> = ({
  isOpen,
  onClose,
  category,
  canManagePricing,
  onSavePrice
}) => {
  const [basePrice, setBasePrice] = useState<number>(0);
  const [priceModifier, setPriceModifier] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setBasePrice(category.basePrice || 4500000);
      setPriceModifier(category.priceModifier || 0);
      setReason('');
      setError(null);
    }
  }, [category]);

  if (!isOpen || !category) return null;

  const currentBase = category.basePrice || 4500000;
  const currentModifier = category.priceModifier || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePricing) {
      setError('Bạn không có quyền điều chỉnh giá hạng phòng. Cần quyền ủy quyền từ Quản Trị Viên.');
      return;
    }
    if (basePrice <= 0 || isNaN(basePrice)) {
      setError('Đơn giá tiêu chuẩn phải lớn hơn 0 VNĐ.');
      return;
    }
    if (priceModifier < 0 || isNaN(priceModifier)) {
      setError('Phụ thu nâng hạng không thể là số âm.');
      return;
    }

    onSavePrice(
      category.id,
      basePrice,
      priceModifier,
      reason.trim() || `Điều chỉnh biểu giá hạng phòng ${category.categoryName}`
    );
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
                backgroundColor: 'rgba(45, 74, 62, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-forest, #2d4a3e)'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Chỉnh Sửa Biểu Giá Hạng Biệt Thự
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {category.categoryName} ({category.bedroomCount} PN · {category.inventoryCount} Căn)
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
                <strong>Ủy quyền hợp lệ (manage_pricing):</strong> Bạn có thẩm quyền điều chỉnh giá cơ bản và phụ thu nâng hạng cho hạng biệt thự này.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#92400e' }}>
              <ShieldAlert size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <strong>Chỉ xem — Thiếu quyền hạn:</strong> Cần Quản Trị Viên ủy quyền năng lực <code>manage_pricing</code> cho Quản lý để sửa giá phụ thu hạng phòng.
              </div>
            </div>
          )}
        </div>

        {/* Form */}
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

          {/* Current vs New Grid */}
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
                Giá Cơ Bản Tiêu Chuẩn Hiện Tại
              </span>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {formatVND(currentBase)} / đêm
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Phụ thu hiện tại: <strong>+{formatVND(currentModifier)}</strong>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Giá Tiêu Chuẩn Mới
              </span>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                {formatVND(basePrice)} / đêm
              </div>
              <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px' }}>
                Phụ thu mới: <strong>+{formatVND(priceModifier)}</strong>
              </div>
            </div>
          </div>

          {/* Base Price Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Giá Thuê Cơ Bản Mặc Định (VNĐ/đêm) <span style={{ color: '#b91c1c' }}>*</span>
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
                step={50000}
                min={500000}
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

          {/* Surcharge Modifier Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Phụ Thu Nâng Hạng Phòng (Price Modifier) <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                disabled={!canManagePricing}
                value={priceModifier}
                onChange={(e) => {
                  setPriceModifier(Number(e.target.value));
                  setError(null);
                }}
                step={50000}
                min={0}
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Phụ thu được cộng thêm khi khách hàng nâng từ hạng tiêu chuẩn (Garden Villa) lên hạng biệt thự này khi chọn gói retreat.
            </span>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Lý Do Giải Trình Nghiệp Vụ (Nhật ký kiểm toán)
            </label>
            <input
              type="text"
              disabled={!canManagePricing}
              placeholder="VD: Cập nhật biểu phí theo khung giá mới áp dụng từ quý 4..."
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

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!canManagePricing || (basePrice === currentBase && priceModifier === currentModifier)}
              icon={<CheckCircle2 size={16} />}
            >
              Cập Nhật Biểu Giá Hạng Biệt Thự
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
