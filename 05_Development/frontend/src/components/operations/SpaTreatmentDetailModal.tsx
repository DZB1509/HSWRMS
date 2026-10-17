import React from 'react';
import { X, Clock, DollarSign, Home, Award, AlertTriangle, ShieldCheck, FileText, Edit2 } from 'lucide-react';
import type { SpaTreatmentItem } from '../../types/spaManagement';
import { formatVND } from '../../i18n';
import { Button } from '../common/Button';

interface SpaTreatmentDetailModalProps {
  isOpen: boolean;
  treatment: SpaTreatmentItem | null;
  onClose: () => void;
  onEdit: (treatment: SpaTreatmentItem) => void;
}

export const SpaTreatmentDetailModal: React.FC<SpaTreatmentDetailModalProps> = ({
  isOpen,
  treatment,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !treatment) return null;

  return (
    <div className="hsw-modal-backdrop" onClick={onClose}>
      <div
        className="hsw-modal-card"
        style={{ maxWidth: '720px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: 0, background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image header */}
        <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
          <img
            src={treatment.image || 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80'}
            alt={treatment.treatmentName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
          }} />
          <button
            type="button"
            className="hsw-modal-close-btn"
            style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
          <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.04em'
              }}>
                {treatment.treatmentCode}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: treatment.status === 'ACTIVE' ? '#2E7D5A' : '#718096',
                color: '#fff'
              }}>
                {treatment.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(212, 175, 55, 0.3)',
                color: '#FFE29A',
                backdropFilter: 'blur(4px)'
              }}>
                {treatment.category}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
              {treatment.treatmentName}
            </h2>
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Clock size={14} color="#2E7D5A" />
                Thời Lượng Phiên Trị Liệu
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                {treatment.durationMinutes} phút ({treatment.durationUnit || 'Phút (Minutes)'})
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <DollarSign size={14} color="#B7791F" />
                Đơn Giá Niêm Yết
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px', color: '#B7791F' }}>
                {formatVND(treatment.basePrice)}
              </div>
            </div>
          </div>

          {/* Pricing Rule */}
          {treatment.pricingRule && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(197, 160, 89, 0.1)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              fontSize: '0.86rem',
              color: 'var(--text-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#9E7A24', marginBottom: '4px' }}>
                <FileText size={15} />
                Quy Tắc Áp Giá & Hạn Ngạch Gói (Pricing Rule)
              </div>
              <div>{treatment.pricingRule}</div>
            </div>
          )}

          {/* Room & Qualification Requirement */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(49, 130, 206, 0.12)', color: '#2B6CB0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Home size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loại Phòng Tương Thích</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {treatment.roomCompatibility || 'Phòng Massage Standard/VIP'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(128, 90, 213, 0.12)', color: '#6B46C1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Chứng Chỉ KTV Yêu Cầu</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {treatment.requiredQualificationCode || treatment.therapistQualification || 'Chứng chỉ Trị liệu chuyên sâu'}
                </div>
              </div>
            </div>
          </div>

          {/* Contraindications & Precautions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {treatment.contraindications && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(229, 62, 62, 0.08)',
                border: '1px solid rgba(229, 62, 62, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C53030', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                  <AlertTriangle size={16} />
                  Chống Chỉ Định Tuyệt Đối (Absolute Contraindications)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {treatment.contraindications}
                </div>
              </div>
            )}

            {treatment.precautions && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(214, 158, 46, 0.08)',
                border: '1px solid rgba(214, 158, 46, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B7791F', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                  <ShieldCheck size={16} />
                  Thận Trọng / Cần Đánh Giá Thêm (Precautions / Safety Review)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {treatment.precautions}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {treatment.description && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Mô Tả Chi Tiết & Tác Dụng Trị Liệu
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px' }}>
                {treatment.description}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(treatment);
              }}
            >
              <Edit2 size={15} style={{ marginRight: '6px' }} />
              Chỉnh Sửa Liệu Trình
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
