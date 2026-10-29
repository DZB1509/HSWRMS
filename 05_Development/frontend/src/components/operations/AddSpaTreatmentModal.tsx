import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Clock,
  UserCheck,
  Building,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import type { SpaServiceMaster } from '../../types/masterData';
import { Button } from '../common/Button';
import { formatVND } from '../../i18n';

interface AddSpaTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingServices: SpaServiceMaster[];
  onAddService: (newService: SpaServiceMaster) => void;
}

export const AddSpaTreatmentModal: React.FC<AddSpaTreatmentModalProps> = ({
  isOpen,
  onClose,
  existingServices,
  onAddService
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Trị Liệu Massage Thảo Dược');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [practitionerType, setPractitionerType] = useState('Chuyên Viên Spa Cấp Cao (Senior Therapist)');
  const [compatibleRoomType, setCompatibleRoomType] = useState('Phòng Trị Liệu Đơn Tiêu Chuẩn');
  const [basePrice, setBasePrice] = useState<number>(1800000);
  const [description, setDescription] = useState('Liệu trình kết hợp túi thảo dược ấm và tinh dầu tràm sinh thái giúp giải tỏa cơ và điều hòa khí huyết.');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập tên liệu trình trị liệu');
      return;
    }

    const cleanCode = (code.trim() || `TRT-${Date.now().toString().slice(-4)}`).toUpperCase();

    if (existingServices.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMsg(`Liệu trình "${cleanName}" đã tồn tại trong danh mục!`);
      return;
    }

    const newService: SpaServiceMaster = {
      id: `SPA-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      name: cleanName,
      category,
      durationMinutes: Number(durationMinutes),
      practitionerType,
      compatibleRoomType,
      basePrice: Number(basePrice),
      status: 'active',
      description: description.trim() || 'Liệu trình chăm sóc sức khỏe chuẩn GWI'
    };

    onAddService(newService);
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
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Thêm Liệu Trình Trị Liệu Spa Mới
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Chuẩn hóa danh mục trị liệu, thời lượng, yêu cầu chứng chỉ KTV và tương thích buồng phòng.
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
            {/* Tên Liệu Trình */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Tên Liệu Trình Trị Liệu Spa <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Liệu Trình Dầu Ấm Shirodhara & Massage Ấn Huyệt Cổ Truyền"
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

            {/* Mã Liệu Trình */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mã Dịch Vụ (Treatment Code)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: TRT-AYUR-SHIRO-60"
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

            {/* Danh Mục Trị Liệu */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Phân Loại Liệu Trình (Category) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #d1cbbe)',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Trị Liệu Massage Thảo Dược">Trị Liệu Massage Thảo Dược</option>
                <option value="Đông Y & Bấm Huyệt Trị Liệu">Đông Y & Bấm Huyệt Trị Liệu</option>
                <option value="Thủy Liệu Pháp & Tắm Khoáng">Thủy Liệu Pháp & Tắm Khoáng</option>
                <option value="Âm Thanh Trị Liệu Singing Bowl">Âm Thanh Trị Liệu Singing Bowl</option>
                <option value="Phục Hồi Giấc Ngủ Sâu">Phục Hồi Giấc Ngủ Sâu</option>
                <option value="Đá Nóng Basalt Giảm Căng Thẳng">Đá Nóng Basalt Giảm Căng Thẳng</option>
                <option value="Chăm Sóc & Trẻ Hóa Tế Bào Da">Chăm Sóc & Trẻ Hóa Tế Bào Da</option>
              </select>
            </div>

            {/* Thời Lượng (Phút) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Thời Lượng Thực Hiện (Phút) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Clock size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value={30}>30 phút (Liệu trình ngắn)</option>
                  <option value={45}>45 phút (Chuông xoay / Thư giãn nhanh)</option>
                  <option value={60}>60 phút (Tiêu chuẩn)</option>
                  <option value={75}>75 phút (Thủy liệu pháp)</option>
                  <option value={90}>90 phút (Chuyên sâu)</option>
                  <option value={120}>120 phút (Toàn diện Hoàng Gia)</option>
                </select>
              </div>
            </div>

            {/* Giá Cơ Bản */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Giá Liệu Trình Tiêu Chuẩn (VND) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Yêu cầu Kỹ Thuật Viên */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Yêu Cầu Trình Độ Kỹ Thuật Viên (Therapist) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <UserCheck size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <select
                  value={practitionerType}
                  onChange={(e) => setPractitionerType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="Chuyên Viên Spa Cấp Cao (Senior Therapist)">Chuyên Viên Spa Cấp Cao (Senior Therapist)</option>
                  <option value="Kỹ Thuật Viên Spa Tiêu Chuẩn (Spa Therapist)">Kỹ Thuật Viên Spa Tiêu Chuẩn (Spa Therapist)</option>
                  <option value="Bậc Thầy Yoga & Thiền Định (Yoga/Meditation Master)">Bậc Thầy Yoga & Thiền Định (Yoga/Meditation Master)</option>
                  <option value="Bác Sĩ Trị Liệu Y Học Cổ Truyền (Ayurvedic Practitioner)">Bác Sĩ Trị Liệu Y Học Cổ Truyền (Ayurvedic Practitioner)</option>
                </select>
              </div>
            </div>

            {/* Phòng Trị Liệu Tương Thích */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Yêu Cầu Phòng Trị Liệu (Room Compatibility)
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                <select
                  value={compatibleRoomType}
                  onChange={(e) => setCompatibleRoomType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium, #d1cbbe)',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="Phòng Trị Liệu Đơn Tiêu Chuẩn">Phòng Trị Liệu Đơn Tiêu Chuẩn</option>
                  <option value="Phòng Đôi Thủy Liệu Pháp & Bồn Ngâm">Phòng Đôi Thủy Liệu Pháp & Bồn Ngâm</option>
                  <option value="Phòng Xông Hơi Đá Muối Himalaya">Phòng Xông Hơi Đá Muối Himalaya</option>
                  <option value="Phòng Thiền & Trị Liệu Âm Thanh Biệt Lập">Phòng Thiền & Trị Liệu Âm Thanh Biệt Lập</option>
                  <option value="Chòi Spa Ngoài Trời Ven Biển">Chòi Spa Ngoài Trời Ven Biển</option>
                </select>
              </div>
            </div>

            {/* Mô tả chi tiết */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mô Tả Quy Trình Liệu Pháp & Lưu Ý Sức Khỏe
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả các bước thực hiện, tác dụng trị liệu và lưu ý chống chỉ định sức khỏe..."
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
                {name || 'TÊN LIỆU TRÌNH TRỊ LIỆU'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {category} · {durationMinutes} phút · {practitionerType}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giá Liệu Trình</div>
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
              Lưu & Ban Hành Liệu Trình Spa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
