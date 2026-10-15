import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  DollarSign,
  CheckCircle2,
  Heart
} from 'lucide-react';
import type { RetreatPackageMaster } from '../../types/masterData';
import { Button } from '../common/Button';
import { formatVND } from '../../i18n';

interface AddRetreatPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPackages: RetreatPackageMaster[];
  onAddPackage: (newPackage: RetreatPackageMaster) => void;
}

export const AddRetreatPackageModal: React.FC<AddRetreatPackageModalProps> = ({
  isOpen,
  onClose,
  existingPackages,
  onAddPackage
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [goal, setGoal] = useState('Detoxification & Cellular Renewal');
  const [durationDays, setDurationDays] = useState(5);
  const [durationNights, setDurationNights] = useState(4);
  const [includedSpaSessions, setIncludedSpaSessions] = useState(4);
  const [basePrice, setBasePrice] = useState<number>(25000000);
  const [description, setDescription] = useState('Chương trình nghỉ dưỡng sức khỏe toàn diện bao gồm thực dưỡng hữu cơ, trị liệu hydrotherapy và huấn luyện thiền định hàng ngày.');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập tên gói nghỉ dưỡng sức khỏe');
      return;
    }

    const cleanCode = (code.trim() || `RET-${Date.now().toString().slice(-4)}`).toUpperCase();

    if (existingPackages.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMsg(`Gói nghỉ dưỡng "${cleanName}" đã tồn tại!`);
      return;
    }

    const newPkg: RetreatPackageMaster = {
      id: `PKG-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      name: cleanName,
      goal,
      durationDays: Number(durationDays),
      durationNights: Number(durationNights),
      includedSpaSessions: Number(includedSpaSessions),
      basePrice: Number(basePrice),
      status: 'active',
      description: description.trim() || 'Gói nghỉ dưỡng chăm sóc sức khỏe chuyên sâu HSWRMS'
    };

    onAddPackage(newPkg);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: 'var(--space-4)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-subtle, #e5e2dc)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle, #e5e2dc)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#faf8f5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-forest, #2d4a3e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Thêm Gói Nghỉ Dưỡng Chăm Sóc Sức Khỏe Mới
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Thiết lập gói Retreat trọn gói kết hợp lưu trú, thực dưỡng và các buổi trị liệu spa bao gồm.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '16px',
              fontWeight: 500
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Tên Gói */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Tên Gói Nghỉ Dưỡng (Retreat Package Name) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Hành Trình Trẻ Hóa Tế Bào & Cân Bằng Thân Tâm"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Mã Gói */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mã Gói (Package Code)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: RET-REJUVENATE-05"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            {/* Mục Tiêu Sức Khỏe */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mục Tiêu Sức Khỏe (Wellness Goal) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Heart size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="Detoxification & Cellular Renewal">Detoxification & Cellular Renewal (Thanh lọc tế bào)</option>
                  <option value="Stress Relief & Emotional Balance">Stress Relief & Emotional Balance (Xua tan căng thẳng)</option>
                  <option value="Deep Sleep & Circadian Restoration">Deep Sleep & Circadian Restoration (Phục hồi giấc ngủ)</option>
                  <option value="Ayurvedic Rejuvenation & Vitality">Ayurvedic Rejuvenation & Vitality (Tái sinh năng lượng)</option>
                  <option value="Mindfulness & Yoga Immersion">Mindfulness & Yoga Immersion (Tĩnh tâm & Thiền định)</option>
                </select>
              </div>
            </div>

            {/* Thời Lượng Ngày / Đêm */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Thời Lượng Lưu Trú <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={durationDays}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setDurationDays(d);
                      setDurationNights(Math.max(1, d - 1));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium, #d1cbbe)',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Số Ngày</span>
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={durationNights}
                    onChange={(e) => setDurationNights(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium, #d1cbbe)',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Số Đêm</span>
                </div>
              </div>
            </div>

            {/* Số buổi Spa bao gồm */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Số Buổi Trị Liệu Spa Bao Gồm <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Sparkles size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={includedSpaSessions}
                  onChange={(e) => setIncludedSpaSessions(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Giá Gói Cơ Bản */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Giá Trọn Gói Cơ Bản (VND) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                />
              </div>
            </div>

            {/* Mô tả hành trình */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mô Tả Chi Tiết Hành Trình Nghỉ Dưỡng
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả các hoạt động, lộ trình chăm sóc sức khỏe, chế độ dinh dưỡng và các buổi tư vấn chuyên gia..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#faf8f5',
            borderRadius: '10px',
            border: '1px dashed #d1cbbe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-forest, #2d4a3e)' }}>
                {name || 'TÊN GÓI NGHỈ DƯỠNG RETREAT'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {durationDays}N / {durationNights}Đ · {goal} · {includedSpaSessions} buổi Spa bao gồm
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giá Trọn Gói</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatVND(basePrice, 'vi')}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle, #e5e2dc)'
          }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy Bỏ
            </Button>
            <Button type="submit" variant="primary" icon={<CheckCircle2 size={14} />}>
              Lưu & Ban Hành Gói Nghỉ Dưỡng
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
