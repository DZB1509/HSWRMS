import React from 'react';
import { X, Moon, DollarSign, Target, Utensils, Sparkles, Users, Edit2 } from 'lucide-react';
import type { RetreatPackageItem } from '../../types/spaManagement';
import { formatVND } from '../../i18n';
import { Button } from '../common/Button';

interface RetreatPackageDetailModalProps {
  isOpen: boolean;
  pkg: RetreatPackageItem | null;
  onClose: () => void;
  onEdit: (pkg: RetreatPackageItem) => void;
}

export const RetreatPackageDetailModal: React.FC<RetreatPackageDetailModalProps> = ({
  isOpen,
  pkg,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !pkg) return null;

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
            src={pkg.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'}
            alt={pkg.packageName}
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
                {pkg.packageCode}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: pkg.status === 'ACTIVE' ? '#2E7D5A' : '#718096',
                color: '#fff'
              }}>
                {pkg.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(197, 160, 89, 0.4)',
                color: '#FFE29A',
                backdropFilter: 'blur(4px)'
              }}>
                {pkg.durationNights} Đêm Nghỉ Dưỡng
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
              {pkg.packageName}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <Moon size={14} color="#2E7D5A" />
                Thời Lượng
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                {pkg.durationNights} Đêm ({pkg.durationNights + 1}N{pkg.durationNights}D)
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <Target size={14} color="#9E7A24" />
                Mục Tiêu Sức Khỏe
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pkg.wellnessGoal}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <DollarSign size={14} color="#C5A059" />
                Giá Gốc Trọn Gói
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '4px', color: '#C5A059' }}>
                {formatVND(pkg.basePrice)}
              </div>
            </div>
          </div>

          {/* Included treatments */}
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              <Sparkles size={16} color="#2E7D5A" />
              Các Liệu Trình Trị Liệu Bao Gồm Trong Gói (Included Spa & Wellness)
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {pkg.includedTreatments || 'Chưa có danh sách liệu trình chi tiết.'}
            </div>
          </div>

          {/* F&B & Nutrition */}
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              <Utensils size={16} color="#C5A059" />
              Chế Độ Dinh Dưỡng Đi Kèm (F&B Regimen)
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {pkg.dietaryPlan || 'Thực đơn tiêu chuẩn lành mạnh theo tư vấn chuyên gia.'}
            </div>
          </div>

          {/* Target Guest */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(46, 125, 90, 0.08)', borderRadius: '8px' }}>
            <Users size={18} color="#2E7D5A" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <strong>Đối tượng phù hợp:</strong> {pkg.targetGuest || 'Phù hợp với đa số khách nghỉ dưỡng có nhu cầu phục hồi sức khỏe.'}
            </div>
          </div>

          {/* Actions */}
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
                onEdit(pkg);
              }}
            >
              Chỉnh Sửa Gói Nghỉ Dưỡng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
