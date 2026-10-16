import React, { useState } from 'react';
import { X, Plus, Sparkles, Clock, DollarSign, Home, Award, AlertTriangle } from 'lucide-react';
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
    basePrice: 1200000,
    roomCompatibility: 'Phòng Massage Standard/VIP',
    therapistQualification: 'Chứng chỉ Spa & Trị liệu Chuyên nghiệp',
    contraindications: '',
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
      basePrice: formData.basePrice,
      roomCompatibility: formData.roomCompatibility.trim(),
      therapistQualification: formData.therapistQualification.trim(),
      contraindications: formData.contraindications.trim(),
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
        style={{ maxWidth: '720px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
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
                Đăng ký dịch vụ Spa A-la-carte theo tiêu chuẩn HSWRMS Master Data
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
                Mã Liệu Trình (Treatment ID)
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
                placeholder="VD: Massage Trị Liệu Tre Ấm Tự Nhiên"
                value={formData.treatmentName}
                onChange={(e) => setFormData({ ...formData, treatmentName: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Phân Nhóm Dịch Vụ (Category) *
              </label>
              <select
                className="hsw-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Body Massage">Body Massage</option>
                <option value="Detox Therapy">Detox Therapy</option>
                <option value="Herbal Therapy">Herbal Therapy</option>
                <option value="Energy Healing">Energy Healing</option>
                <option value="Ayurveda Therapy">Ayurveda Therapy</option>
                <option value="Facial Care">Facial Care</option>
                <option value="Anti-Aging Facial">Anti-Aging Facial</option>
                <option value="Body Scrub">Body Scrub</option>
                <option value="Body Wrap">Body Wrap</option>
                <option value="Hydrotherapy">Hydrotherapy</option>
                <option value="Yoga & Movement">Yoga & Movement</option>
                <option value="Mindfulness">Mindfulness</option>
                <option value="Maternal Care">Maternal Care</option>
              </select>
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
                Yêu Cầu Phòng Trị Liệu
              </label>
              <input
                type="text"
                className="hsw-input"
                value={formData.roomCompatibility}
                onChange={(e) => setFormData({ ...formData, roomCompatibility: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <Award size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Chứng Chỉ Kỹ Thuật Viên Yêu Cầu
            </label>
            <input
              type="text"
              className="hsw-input"
              value={formData.therapistQualification}
              onChange={(e) => setFormData({ ...formData, therapistQualification: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#B26A00' }}>
              <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Chống Chỉ Định Y Tế (Rule GB-M3-12)
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
              placeholder="VD: Không áp dụng cho người huyết áp cao chưa kiểm soát, phụ nữ có thai dưới 12 tuần..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Mô Tả Trải Nghiệm & Tác Dụng
            </label>
            <textarea
              className="hsw-input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả kỹ thuật thực hiện, công dụng giải mỏi, tái tạo năng lượng..."
            />
          </div>

          <div className="hsw-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="tertiary" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" icon={<Sparkles size={16} />}>
              Tạo Liệu Trình Mới
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
