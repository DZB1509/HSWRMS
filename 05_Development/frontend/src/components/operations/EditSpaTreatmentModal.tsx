import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Clock, DollarSign, Home, Award, FileText } from 'lucide-react';
import type { SpaTreatmentItem, SpaStatus } from '../../types/spaManagement';
import { formatVND } from '../../i18n';
import { Button } from '../common/Button';

interface EditSpaTreatmentModalProps {
  isOpen: boolean;
  treatment: SpaTreatmentItem | null;
  onClose: () => void;
  onSave: (updated: SpaTreatmentItem) => void;
}

export const EditSpaTreatmentModal: React.FC<EditSpaTreatmentModalProps> = ({
  isOpen,
  treatment,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<SpaTreatmentItem | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');

  useEffect(() => {
    if (treatment) {
      setFormData({ ...treatment });
      setPriceInput(String(treatment.basePrice || 0));
    }
  }, [treatment]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Chỉnh Sửa Liệu Trình Trị Liệu</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mã: <strong>{formData.treatmentCode}</strong> — HSWRMS Standardized Spa Catalog V3
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
                Tên Liệu Trình *
              </label>
              <input
                type="text"
                className="hsw-input"
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
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="VD: Body Massage, Detox Therapy..."
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
                type="text"
                inputMode="numeric"
                className="hsw-input"
                value={priceInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setPriceInput(val);
                  const parsed = Number(val.replace(/[^0-9]/g, ''));
                  setFormData({ ...formData, basePrice: parsed });
                }}
                placeholder="Nhập đơn giá niêm yết (VNĐ)..."
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
                value={formData.roomCompatibility}
                onChange={(e) => setFormData({ ...formData, roomCompatibility: e.target.value })}
                placeholder="VD: MASSAGE_STANDARD, MASSAGE_VIP..."
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
                value={formData.requiredQualificationCode || formData.therapistQualification}
                onChange={(e) => setFormData({
                  ...formData,
                  requiredQualificationCode: e.target.value,
                  therapistQualification: e.target.value
                })}
                placeholder="VD: QUAL_HOT_STONE_MASSAGE"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <FileText size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Quy Tắc Áp Giá (Pricing Rule - Sheet 2)
            </label>
            <input
              type="text"
              className="hsw-input"
              value={formData.pricingRule || ''}
              onChange={(e) => setFormData({ ...formData, pricingRule: e.target.value })}
              placeholder="Giá cơ sở một buổi. Nằm trong số buổi được hưởng của gói Retreat: Không thu phí thêm..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#C53030' }}>
              <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Chống Chỉ Định Tuyệt Đối (Absolute Contraindications)
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
              placeholder="VD: Sốt cao, vết thương hở, bệnh ngoài da lây nhiễm..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#D69E2E' }}>
              <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Thận Trọng / Cần Đánh Giá Thêm (Precautions / Review)
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              value={formData.precautions || ''}
              onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
              placeholder="VD: Huyết áp cao (cần chỉnh nhiệt độ đá dưới 45°C), da mỏng nhạy cảm..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Mô Tả Chi Tiết
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả kỹ thuật, tác dụng sinh học..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Trạng Thái:</label>
            <select
              className="hsw-input"
              style={{ width: '180px' }}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SpaStatus })}
            >
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
