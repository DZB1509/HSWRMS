import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, Clock, DollarSign, Home, Award } from 'lucide-react';
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

  useEffect(() => {
    if (treatment) {
      setFormData({ ...treatment });
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
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Chỉnh Sửa Liệu Trình Trị Liệu</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mã: <strong>{formData.treatmentCode}</strong> — Rule GB-M3-12 Safety Minimization
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
                Yêu Cầu Phòng Trị Liệu (Room Compatibility)
              </label>
              <input
                type="text"
                className="hsw-input"
                value={formData.roomCompatibility}
                onChange={(e) => setFormData({ ...formData, roomCompatibility: e.target.value })}
                placeholder="VD: Phòng Massage Standard/VIP..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                <Award size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                Chứng Chỉ Yêu Cầu (Therapist Qualification)
              </label>
              <input
                type="text"
                className="hsw-input"
                value={formData.therapistQualification}
                onChange={(e) => setFormData({ ...formData, therapistQualification: e.target.value })}
                placeholder="VD: Chứng chỉ Body Therapy & Đá nóng..."
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#B26A00' }}>
              <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Chống Chỉ Định Y Tế (Contraindications - Rule GB-M3-12)
            </label>
            <textarea
              className="hsw-input"
              rows={2}
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
              placeholder="VD: Huyết áp cao chưa kiểm soát, vết thương hở ngoài da, phụ nữ có thai..."
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Thông tin an toàn y tế sẽ được hiển thị bảo mật cho Kỹ thuật viên (Therapist) trước buổi trị liệu.
            </span>
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
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Trạng Thái Hoạt Động</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Chỉ liệu trình ACTIVE mới hiển thị lên màn hình đặt lịch của khách hàng
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
            <Button id="submit-edit-treatment-btn" variant="primary" type="submit" icon={<ShieldCheck size={16} />}>
              Lưu Thay Đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
