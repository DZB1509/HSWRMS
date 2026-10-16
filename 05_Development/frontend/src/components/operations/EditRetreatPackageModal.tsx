import React, { useState, useEffect } from 'react';
import { X, Package, ShieldCheck, Moon, DollarSign, Target, Utensils, Sparkles } from 'lucide-react';
import type { RetreatPackageItem, SpaStatus } from '../../types/spaManagement';
import { formatVND } from '../../i18n';
import { Button } from '../common/Button';

interface EditRetreatPackageModalProps {
  isOpen: boolean;
  pkg: RetreatPackageItem | null;
  onClose: () => void;
  onSave: (updated: RetreatPackageItem) => void;
}

export const EditRetreatPackageModal: React.FC<EditRetreatPackageModalProps> = ({
  isOpen,
  pkg,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<RetreatPackageItem | null>(null);

  useEffect(() => {
    if (pkg) {
      setFormData({ ...pkg });
    }
  }, [pkg]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="hsw-modal-backdrop" onClick={onClose}>
      <div
        className="hsw-modal-card"
        style={{ maxWidth: '780px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hsw-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              backgroundColor: 'rgba(197, 160, 89, 0.15)', color: '#9E7A24',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Chỉnh Sửa Gói Nghỉ Dưỡng & Trị Liệu</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mã Gói: <strong>{formData.packageCode}</strong> — HSWRMS Retreat Packages Master
              </p>
            </div>
          </div>
          <button type="button" className="hsw-modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Tên Gói Trị Liệu / Nghỉ Dưỡng *
              </label>
              <input
                type="text"
                className="hsw-input"
                value={formData.packageName}
                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <Target size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Mục Tiêu Sức Khỏe (Wellness Goal) *
              </label>
              <input
                type="text"
                className="hsw-input"
                value={formData.wellnessGoal}
                onChange={(e) => setFormData({ ...formData, wellnessGoal: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <Moon size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Thời Lượng Lưu Trú (Đêm) *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                className="hsw-input"
                value={formData.durationNights}
                onChange={(e) => setFormData({ ...formData, durationNights: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <DollarSign size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Giá Gốc Trọn Gói (VND) *
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                className="hsw-input"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                required
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {formatVND(formData.basePrice)}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Các Liệu Trình Trị Liệu Bao Gồm (Included Treatments)
            </label>
            <textarea
              className="hsw-input"
              rows={4}
              value={formData.includedTreatments}
              onChange={(e) => setFormData({ ...formData, includedTreatments: e.target.value })}
              placeholder="• 01 Massage dẫn lưu bạch huyết (75p)&#10;• 01 Tẩy tế bào chết trà xanh (60p)..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <Utensils size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Chế Độ Dinh Dưỡng Đi Kèm (F&B)
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              value={formData.dietaryPlan}
              onChange={(e) => setFormData({ ...formData, dietaryPlan: e.target.value })}
              placeholder="Thực đơn Detox thanh lọc, nước ép lạnh hữu cơ..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Đối Tượng Mục Tiêu (Target Guest)
            </label>
            <input
              type="text"
              className="hsw-input"
              value={formData.targetGuest}
              onChange={(e) => setFormData({ ...formData, targetGuest: e.target.value })}
              placeholder="Khách muốn đào thải độc tố, người làm việc áp lực cao..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Trạng Thái Gói Nghỉ Dưỡng</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Trạng thái ACTIVE cho phép khách hàng đặt gói trực tuyến
              </div>
            </div>
            <select
              className="hsw-input"
              style={{ width: 'auto' }}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SpaStatus })}
            >
              <option value="ACTIVE">Hoạt Động (ACTIVE)</option>
              <option value="INACTIVE">Tạm Ngừng (INACTIVE)</option>
            </select>
          </div>

          <div className="hsw-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', position: 'sticky', bottom: 0, background: 'var(--bg-primary, #fff)', paddingTop: '12px', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
            <Button variant="tertiary" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button id="submit-edit-package-btn" variant="primary" type="submit" icon={<ShieldCheck size={16} />}>
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
