import React from 'react';
import { Home, UtensilsCrossed, Sparkles, Check, Info, Clock } from 'lucide-react';
import {
  AMANOI_WELLNESS_TAGS,
  type DiningServiceLocation,
  type DeliveryTimingOption,
  type AmanoiWellnessTag,
} from '../../utils/diningServiceHelper';

interface Props {
  location: DiningServiceLocation;
  onLocationChange: (loc: DiningServiceLocation) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  customNotes: string;
  onCustomNotesChange: (notes: string) => void;
  villaNumber?: string;
  lang?: 'vi' | 'en';
  deliveryTiming?: DeliveryTimingOption;
  onDeliveryTimingChange?: (timing: DeliveryTimingOption) => void;
  scheduledTime?: string;
  onScheduledTimeChange?: (time: string) => void;
}

export const AmanoiDiningLocationPicker: React.FC<Props> = ({
  location,
  onLocationChange,
  selectedTags,
  onToggleTag,
  customNotes,
  onCustomNotesChange,
  villaNumber,
  lang = 'vi',
  deliveryTiming = 'ASAP',
  onDeliveryTimingChange,
  scheduledTime = '',
  onScheduledTimeChange,
}) => {
  const leadMinutes = location === 'IN_VILLA' ? 35 : 20;
  const etaWindowText = location === 'IN_VILLA' ? '30 - 45 phút' : '15 - 25 phút';

  const getAsapTimeStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + leadMinutes);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface, #ffffff)',
        border: '1px solid var(--border-subtle, #e5e7eb)',
        borderRadius: 'var(--radius-sm, 8px)',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
      id="amanoi-dining-location-picker"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent-olive, #5c6f4e)',
            }}
          >
            {lang === 'vi' ? 'Tiêu chuẩn Dưỡng Sinh Amanoi' : 'Amanoi Wellness Standard'}
          </span>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 700,
              margin: '2px 0 0 0',
              color: 'var(--text-primary, #111827)',
              fontFamily: 'var(--font-display, inherit)',
            }}
          >
            {lang === 'vi' ? 'Địa Điểm Dùng Bữa & Yêu Cầu Ẩm Thực' : 'Dining Venue & Wellness Requests'}
          </h4>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary, #6b7280)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Info size={13} />
          {lang === 'vi' ? 'Không phụ thu' : 'No surcharge'}
        </span>
      </div>

      {/* 2-Option Luxury Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        {/* Option 1: Dining Pavilion (Default) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onLocationChange('DINING_PAVILION')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLocationChange('DINING_PAVILION'); }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm, 6px)',
            border: location === 'DINING_PAVILION'
              ? '2px solid var(--accent-forest, #2e5a36)'
              : '1px solid var(--border-subtle, #e5e7eb)',
            backgroundColor: location === 'DINING_PAVILION'
              ? 'rgba(46, 90, 54, 0.05)'
              : 'var(--bg-soft, #f9fafb)',
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
          id="btn-select-dining-pavilion"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: location === 'DINING_PAVILION' ? 'var(--accent-forest, #2e5a36)' : 'rgba(0,0,0,0.05)',
                  color: location === 'DINING_PAVILION' ? '#ffffff' : 'var(--text-secondary, #4b5563)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UtensilsCrossed size={14} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #111827)' }}>
                {lang === 'vi' ? 'Nhà hàng Trung tâm' : 'Central Dining Pavilion'}
              </span>
            </div>
            {location === 'DINING_PAVILION' && (
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-forest, #2e5a36)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={12} />
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary, #4b5563)', lineHeight: 1.4 }}>
            {lang === 'vi'
              ? 'Thưởng thức tại không gian mở nhìn ra hồ sen. Bày đĩa sứ nghệ nhân & phục vụ trực tiếp tại bàn ăn (SLA 15-25 phút).'
              : 'Dine in open pavilion over lotus lake. Plated on artisan porcelain with dedicated table service (SLA 15-25 min).'}
          </p>
        </div>

        {/* Option 2: In-Villa Dining */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onLocationChange('IN_VILLA')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLocationChange('IN_VILLA'); }}
          style={{
            cursor: 'pointer',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm, 6px)',
            border: location === 'IN_VILLA'
              ? '2px solid #d97706'
              : '1px solid var(--border-subtle, #e5e7eb)',
            backgroundColor: location === 'IN_VILLA'
              ? 'rgba(217, 119, 6, 0.05)'
              : 'var(--bg-soft, #f9fafb)',
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
          id="btn-select-in-villa"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: location === 'IN_VILLA' ? '#d97706' : 'rgba(0,0,0,0.05)',
                  color: location === 'IN_VILLA' ? '#ffffff' : 'var(--text-secondary, #4b5563)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Home size={14} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary, #111827)' }}>
                {lang === 'vi' ? 'Dùng tại Biệt thự' : 'Private In-Villa Dining'}
              </span>
            </div>
            {location === 'IN_VILLA' && (
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={12} />
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary, #4b5563)', lineHeight: 1.4 }}>
            {lang === 'vi'
              ? `Phục vụ riêng tại ${villaNumber || 'Biệt thự'}. Bếp trang bị dụng cụ giữ nhiệt cloche & Butler giao tận phòng (SLA 30-45 phút).`
              : `Private dining at ${villaNumber || 'Villa'}. Packed with insulated cloche domes and delivered by butler (SLA 30-45 min).`}
          </p>
        </div>
      </div>

      {/* Delivery Timing & ETA Selector */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm, 6px)',
          backgroundColor: 'var(--bg-soft, #f9fafb)',
          border: '1px solid var(--border-subtle, #e5e7eb)',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} style={{ color: 'var(--accent-forest, #2e5a36)' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
              {lang === 'vi' ? 'Thời gian nhận món & Dự kiến hoàn thành (ETA)' : 'Service Timing & Estimated Arrival (ETA)'}
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: location === 'IN_VILLA' ? '#fef3c7' : '#ecfdf5',
              color: location === 'IN_VILLA' ? '#92400e' : '#065f46',
              border: `1px solid ${location === 'IN_VILLA' ? '#fde68a' : '#a7f3d0'}`,
            }}
          >
            SLA: {etaWindowText}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => onDeliveryTimingChange?.('ASAP')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: (deliveryTiming === 'ASAP' || !deliveryTiming)
                ? '2px solid var(--accent-forest, #2e5a36)'
                : '1px solid var(--border-subtle, #e5e7eb)',
              backgroundColor: (deliveryTiming === 'ASAP' || !deliveryTiming)
                ? 'rgba(46, 90, 54, 0.08)'
                : '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            id="btn-timing-asap"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
                {location === 'IN_VILLA'
                  ? (lang === 'vi' ? '🚀 Giao ngay (ASAP)' : '🚀 Deliver ASAP')
                  : (lang === 'vi' ? '🍽️ Phục vụ ngay tại bàn' : '🍽️ Serve ASAP at Table')}
              </span>
              {(deliveryTiming === 'ASAP' || !deliveryTiming) && <Check size={12} color="var(--accent-forest, #2e5a36)" />}
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: 'var(--text-secondary, #4b5563)' }}>
              {lang === 'vi'
                ? `Dự kiến: khoảng ${getAsapTimeStr()} (${etaWindowText})`
                : `Est: ~${getAsapTimeStr()} (${etaWindowText})`}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onDeliveryTimingChange?.('SCHEDULED')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: deliveryTiming === 'SCHEDULED'
                ? '2px solid var(--accent-forest, #2e5a36)'
                : '1px solid var(--border-subtle, #e5e7eb)',
              backgroundColor: deliveryTiming === 'SCHEDULED'
                ? 'rgba(46, 90, 54, 0.08)'
                : '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            id="btn-timing-scheduled"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
                {lang === 'vi' ? '⏰ Hẹn giờ cụ thể' : '⏰ Scheduled Time'}
              </span>
              {deliveryTiming === 'SCHEDULED' && <Check size={12} color="var(--accent-forest, #2e5a36)" />}
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: 'var(--text-secondary, #4b5563)' }}>
              {lang === 'vi'
                ? (location === 'IN_VILLA' ? 'Đặt trước tối thiểu 45 phút' : 'Đặt trước tối thiểu 30 phút')
                : (location === 'IN_VILLA' ? 'Min 45 min notice' : 'Min 30 min notice')}
            </p>
          </button>
        </div>

        {deliveryTiming === 'SCHEDULED' && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle, #e5e7eb)' }}>
            <label
              htmlFor="amanoi-scheduled-time"
              style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #4b5563)', marginBottom: '4px' }}
            >
              {lang === 'vi' ? 'Chọn mốc giờ quý khách muốn dùng món:' : 'Select preferred service time:'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="amanoi-scheduled-time"
                type="time"
                className="hsw-input"
                style={{ width: '140px', fontSize: '13px', padding: '6px 10px' }}
                value={scheduledTime || ''}
                onChange={(e) => onScheduledTimeChange?.(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary, #6b7280)' }}>
                {lang === 'vi'
                  ? (location === 'IN_VILLA'
                    ? 'Khung giờ phục vụ In-Villa: 06:00 – 22:30'
                    : 'Các ca Nhà hàng: 06:30–10:30, 11:30–14:30, 14:30–17:30, 18:00–22:00')
                  : 'In-Villa: 06:00–22:30 | Dining Pavilion: meal periods'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Amanoi Quick Wellness Tags */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <Sparkles size={13} style={{ color: 'var(--accent-olive, #5c6f4e)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary, #4b5563)' }}>
            {lang === 'vi' ? 'Yêu cầu ẩm thực nhanh (Chạm để chọn):' : 'Amanoi Wellness Dining Requests (Click to select):'}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {AMANOI_WELLNESS_TAGS.map((tag: AmanoiWellnessTag) => {
            const isSelected = selectedTags.includes(tag.labelVi) || selectedTags.includes(tag.labelEn);
            const label = lang === 'vi' ? tag.labelVi : tag.labelEn;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(label)}
                style={{
                  fontSize: '11px',
                  padding: '4px 9px',
                  borderRadius: 'var(--radius-pill, 9999px)',
                  border: isSelected
                    ? '1px solid var(--accent-forest, #2e5a36)'
                    : '1px solid var(--border-subtle, #e5e7eb)',
                  backgroundColor: isSelected
                    ? 'var(--accent-forest, #2e5a36)'
                    : 'var(--bg-soft, #f9fafb)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary, #111827)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                id={`btn-wellness-tag-${tag.id}`}
              >
                {isSelected && <Check size={11} />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Free-text Custom Notes */}
      <div>
        <label
          htmlFor="amanoi-custom-notes"
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-secondary, #4b5563)',
            marginBottom: '4px',
          }}
        >
          {lang === 'vi' ? 'Ghi chú thêm cho Bếp trưởng (Tùy chọn):' : 'Special requests for the Executive Chef (Optional):'}
        </label>
        <textarea
          id="amanoi-custom-notes"
          className="hsw-input"
          style={{
            width: '100%',
            minHeight: '60px',
            resize: 'vertical',
            fontSize: '12px',
            lineHeight: 1.4,
            padding: '8px 10px',
          }}
          placeholder={
            lang === 'vi'
              ? 'Ví dụ: Sốt để riêng bên cạnh, chuẩn bị bàn gần hồ sen, mang thêm khăn ấm...'
              : 'e.g., Dressing on the side, table near lotus pond, extra warm towel...'
          }
          value={customNotes}
          onChange={(e) => onCustomNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
};
