import React, { useState } from 'react';
import { X, Plus, Target, Moon, DollarSign, Sparkles, Utensils, FileText } from 'lucide-react';
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
    wellnessGoal: 'Holistic Wellness & Recovery',
    durationNights: 3,
    durationUnit: 'Đêm (Nights)',
    basePrice: 15000000,
    basePriceUnit: 'VND/khách/gói',
    includedTreatments: '',
    dietaryPlan: '',
    extraChargePolicy: 'ĐÃ BAO GỒM các buổi trị liệu và F&B nêu trên. Khách đặt thêm dịch vụ ngoài danh mục hoặc ngoài số buổi quy định sẽ tính Extra ghi nợ Folio (M5).',
    targetGuest: 'Khách hàng tìm kiếm phục hồi sức khỏe thân tâm toàn diện',
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
      durationUnit: formData.durationUnit,
      basePrice: formData.basePrice,
      basePriceUnit: formData.basePriceUnit,
      includedTreatments: formData.includedTreatments.trim(),
      dietaryPlan: formData.dietaryPlan.trim(),
      extraChargePolicy: formData.extraChargePolicy.trim(),
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
        style={{ maxWidth: '800px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Thêm Gói Nghỉ Dưỡng Mới</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Tạo gói Retreat trọn gói mới theo chuẩn HSWRMS Master Data V3
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
                Mã Gói (Package Code)
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
                Tên Gói Nghỉ Dưỡng *
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: 3D2N Chữa Lành Năng Lượng Tự Nhiên"
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
                placeholder="VD: Detox & Cleansing, Stress Reduction..."
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
                Giá Gói Trọn Gói (VND/khách) *
              </label>
              <input
                type="number"
                min="0"
                step="500000"
                className="hsw-input"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                required
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {formatVND(formData.basePrice)} / khách / gói
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Chi Tiết Quyền Lợi Trị Liệu (Liệt kê dịch vụ & số buổi)
            </label>
            <textarea
              className="hsw-input"
              rows={3}
              placeholder="VD: SPA-MASS-01 (01 buổi - 90p), SPA-HYDRO-02 (01 buổi - 45p)..."
              value={formData.includedTreatments}
              onChange={(e) => setFormData({ ...formData, includedTreatments: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <Utensils size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Kế Hoạch Dinh Dưỡng Đi Kèm (F&B Plan Module 4)
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              placeholder="VD: 3 bữa sáng thanh lọc + 3 bữa trưa thực dưỡng + 3 bữa tối nhẹ nhàng..."
              value={formData.dietaryPlan}
              onChange={(e) => setFormData({ ...formData, dietaryPlan: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#B7791F' }}>
              <FileText size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Quy Tắc Tính Phí Phát Sinh (Extra Charge Policy - Rule 21)
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              value={formData.extraChargePolicy}
              onChange={(e) => setFormData({ ...formData, extraChargePolicy: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Tạo Gói Nghỉ Dưỡng
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
