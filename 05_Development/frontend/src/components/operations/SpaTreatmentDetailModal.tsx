import React from 'react';
import { X, Clock, DollarSign, Home, Award, AlertTriangle, Edit2 } from 'lucide-react';
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
        style={{ maxWidth: '680px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: 0, background: 'var(--surface)' }}
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
                {treatment.durationMinutes} phút
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <DollarSign size={14} color="#C5A059" />
                Đơn Giá Niêm Yết A-la-carte
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px', color: '#C5A059' }}>
                {formatVND(treatment.basePrice)}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Mô Tả Trải Nghiệm & Công Dụng
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {treatment.description || 'Chưa cập nhật mô tả chi tiết cho liệu trình này.'}
            </p>
          </div>

          {/* Operational requirements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <Home size={18} style={{ color: '#2E7D5A', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Yêu Cầu Phòng Trị Liệu (Room Compatibility)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {treatment.roomCompatibility || 'Phòng Massage Standard/VIP'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <Award size={18} style={{ color: '#9E7A24', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Chứng Chỉ Kỹ Thuật Viên (Therapist Qualification)</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {treatment.therapistQualification || 'Chứng chỉ Trị liệu Tiêu chuẩn'}
                </div>
              </div>
            </div>
          </div>

          {/* Contraindications Alert Box */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: 'rgba(217, 83, 79, 0.08)',
            border: '1px solid rgba(217, 83, 79, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            gap: '12px'
          }}>
            <AlertTriangle size={20} color="#D9534F" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#D9534F' }}>
                Chống Chỉ Định Y Tế (Rule GB-M3-12 Safety Minimization)
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.5 }}>
                {treatment.contraindications || 'Không có chống chỉ định nghiêm trọng.'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                * Hệ thống tự động đối chiếu hồ sơ sức khỏe (Health Profile) của khách để bảo đảm an toàn trước khi xác nhận phiên spa.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="tertiary" type="button" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              type="button"
              icon={<Edit2 size={15} />}
              onClick={() => {
                onClose();
                onEdit(treatment);
              }}
            >
              Chỉnh Sửa Liệu Trình
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
