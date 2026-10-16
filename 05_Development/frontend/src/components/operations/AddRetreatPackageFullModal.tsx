import React, { useState } from 'react';
import { X, Plus, Package, Moon, DollarSign, Target, Sparkles, Utensils } from 'lucide-react';
import type { RetreatPackageItem } from '../../types/spaManagement';
import { formatVND } from '../../i18n';
import { Button } from '../common/Button';

interface AddRetreatPackageFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newPkg: RetreatPackageItem) => void;
}

export const AddRetreatPackageFullModal: React.FC<AddRetreatPackageFullModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    packageCode: '',
    packageName: '',
    wellnessGoal: 'Detox & Purification',
    durationNights: 3,
    basePrice: 15000000,
    includedTreatments: '',
    dietaryPlan: '',
    targetGuest: '',
    status: 'ACTIVE' as const,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = formData.packageCode.trim() || `RET-NEW-${Date.now().toString().slice(-4)}`;
    const newPkg: RetreatPackageItem = {
      id: `PKG-${code}`,
      packageCode: code,
      packageName: formData.packageName.trim(),
      wellnessGoal: formData.wellnessGoal.trim(),
      durationNights: formData.durationNights,
      basePrice: formData.basePrice,
      includedTreatments: formData.includedTreatments.trim(),
      dietaryPlan: formData.dietaryPlan.trim(),
      targetGuest: formData.targetGuest.trim(),
      status: formData.status,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    };
    onAdd(newPkg);
    onClose();
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
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Tạo Gói Nghỉ Dưỡng Retreat Mới</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Đóng gói chương trình Wellness trọn gói theo mô hình Chiva-Som & Amanoi
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
                Mã Gói (Package ID)
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: RET-HEAL-03 (để trống sẽ tự sinh)"
                value={formData.packageCode}
                onChange={(e) => setFormData({ ...formData, packageCode: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Tên Gói Trị Liệu / Nghỉ Dưỡng *
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: 3D2N Chữa Lành Năng Lượng & Thức Tỉnh Giác Quan"
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
                placeholder="VD: Detox & Purification, Sleep Improvement..."
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
                step="100000"
                className="hsw-input"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                required
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {formatVND(formData.basePrice)}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Đối Tượng Mục Tiêu (Target Guest)
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: Khách cần phục hồi sau kiệt sức, doanh nhân bận rộn..."
                value={formData.targetGuest}
                onChange={(e) => setFormData({ ...formData, targetGuest: e.target.value })}
              />
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
              placeholder="• 01 Massage dẫn lưu bạch huyết (75p)&#10;• 01 Tẩy tế bào chết khoáng nóng (60p)&#10;• 02 Buổi Hatha Yoga thanh lọc buổi sáng"
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
              placeholder="Thực đơn thanh lọc, nước ép lạnh hữu cơ không đường..."
            />
          </div>

          <div className="hsw-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="tertiary" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" icon={<Package size={16} />}>
              Tạo Gói Nghỉ Dưỡng Mới
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
