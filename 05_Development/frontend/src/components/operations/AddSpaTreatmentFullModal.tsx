import React, { useState } from 'react';
import { X, Plus, Clock, DollarSign, Home, Award, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import type { SpaTreatmentItem } from '../../types/spaManagement';
import { formatVND } from '../../i18n';
import { Button } from '../common/Button';

interface AddSpaTreatmentFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newTreatment: SpaTreatmentItem) => void;
}

export const AddSpaTreatmentFullModal: React.FC<AddSpaTreatmentFullModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    treatmentCode: '',
    treatmentName: '',
    category: 'Body Massage',
    durationMinutes: 60,
    durationUnit: 'Phút (Minutes)',
    basePrice: 1200000,
    pricingRule: 'Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm; Vượt hạn ngạch: Tính phí phát sinh.',
    roomCompatibility: 'MASSAGE_STANDARD, MASSAGE_VIP',
    requiredQualificationCode: 'QUAL_HOT_STONE_MASSAGE',
    contraindications: '',
    precautions: '',
    description: '',
    status: 'ACTIVE' as const,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = formData.treatmentCode.trim() || `SPA-NEW-${Date.now().toString().slice(-4)}`;
    const newTreatment: SpaTreatmentItem = {
      id: `TRT-${code}`,
      treatmentCode: code,
      treatmentName: formData.treatmentName.trim(),
      category: formData.category.trim(),
      durationMinutes: formData.durationMinutes,
      durationUnit: formData.durationUnit,
      basePrice: formData.basePrice,
      pricingRule: formData.pricingRule.trim(),
      roomCompatibility: formData.roomCompatibility.trim(),
      requiredQualificationCode: formData.requiredQualificationCode.trim(),
      therapistQualification: formData.requiredQualificationCode.trim(),
      contraindications: formData.contraindications.trim(),
      precautions: formData.precautions.trim(),
      description: formData.description.trim(),
      status: formData.status,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    };
    onAdd(newTreatment);
    onClose();
  };

  return (
    <div className="hsw-modal-backdrop" onClick={onClose}>
      <div
        className="hsw-modal-card"
        style={{ maxWidth: '750px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hsw-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              backgroundColor: 'rgba(46, 125, 90, 0.12)', color: '#2E7D5A',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Thêm Liệu Trình Trị Liệu Mới</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Đăng ký dịch vụ Spa A-la-carte theo tiêu chuẩn HSWRMS Master Data V3
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
                Mã Liệu Trình (Treatment Code)
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: SPA-MASS-07 (để trống sẽ tự sinh)"
                value={formData.treatmentCode}
                onChange={(e) => setFormData({ ...formData, treatmentCode: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Tên Liệu Trình *
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: Massage Thư Giãn Tinh Dầu Tràm Trà"
                value={formData.treatmentName}
                onChange={(e) => setFormData({ ...formData, treatmentName: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Phân Nhóm Dịch Vụ (Category) *
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: Body Massage, Facial Care, Detox Therapy..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <Clock size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Thời Lượng (Phút) *
              </label>
              <input
                type="number"
                min="15"
                step="5"
                className="hsw-input"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <DollarSign size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Đơn Giá Niêm Yết (VND) *
              </label>
              <input
                type="number"
                min="0"
                step="10000"
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
                <Home size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Loại Phòng Tương Thích (Room Compatibility)
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: MASSAGE_STANDARD, MASSAGE_VIP"
                value={formData.roomCompatibility}
                onChange={(e) => setFormData({ ...formData, roomCompatibility: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <Award size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Mã Chứng Chỉ KTV (Qualification Code)
              </label>
              <input
                type="text"
                className="hsw-input"
                placeholder="VD: QUAL_HOT_STONE_MASSAGE"
                value={formData.requiredQualificationCode}
                onChange={(e) => setFormData({ ...formData, requiredQualificationCode: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <FileText size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Quy Tắc Áp Giá (Pricing Rule)
            </label>
            <input
              type="text"
              className="hsw-input"
              value={formData.pricingRule}
              onChange={(e) => setFormData({ ...formData, pricingRule: e.target.value })}
              placeholder="Quy định thanh toán, phụ thu khi vượt số buổi hoặc gọi thêm..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#C53030' }}>
              <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Chống Chỉ Định Tuyệt Đối
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              placeholder="VD: Sốt cao, vết thương hở ngoài da, viêm tắc tĩnh mạch..."
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#D69E2E' }}>
              <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Thận Trọng / Cần Đánh Giá Thêm
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              placeholder="VD: Huyết áp cao (cần chỉnh nhiệt độ dưới 45°C), da mỏng nhạy cảm..."
              value={formData.precautions}
              onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Mô Tả Dịch Vụ
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              placeholder="Mô tả kỹ thuật, lợi ích sức khỏe và phương pháp thực hiện..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Tạo Liệu Trình
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
