import React from 'react';
import { Home, UtensilsCrossed, Sparkles } from 'lucide-react';
import { parseDiningNotes, type DiningServiceLocation } from '../../utils/diningServiceHelper';

interface Props {
  notes?: string | null;
  locationOverride?: DiningServiceLocation;
  villaNumber?: string;
  showInstructions?: boolean;
  compact?: boolean;
  lang?: string;
}


export const AmanoiServiceLocationBadge: React.FC<Props> = ({
  notes,
  locationOverride,
  villaNumber,
  showInstructions = false,
  compact = false,
  lang = 'vi',
}) => {
  const parsed = parseDiningNotes(notes);
  const isVilla = locationOverride ? locationOverride === 'IN_VILLA' : parsed.isVillaDelivery;

  const bg = isVilla ? 'rgba(217, 119, 6, 0.12)' : 'rgba(46, 125, 50, 0.12)';
  const border = isVilla ? 'rgba(217, 119, 6, 0.35)' : 'rgba(46, 125, 50, 0.35)';
  const textColor = isVilla ? '#b45309' : '#1e5e2e';
  const label = isVilla
    ? lang === 'vi'
      ? `🏡 Dùng tại Biệt thự (In-Villa)`
      : `🏡 In-Villa Dining`
    : lang === 'vi'
      ? `🍽️ Nhà hàng Trung tâm (Dining Pavilion)`
      : `🍽️ Central Dining Pavilion`;

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill, 9999px)',
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color: textColor,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
        title={isVilla ? 'Phục vụ tận Biệt thự bằng xe điện và nắp cloche giữ nhiệt' : 'Phục vụ trực tiếp tại bàn Nhà hàng Trung tâm'}
      >
        {isVilla ? <Home size={12} /> : <UtensilsCrossed size={12} />}
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm, 6px)',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px' }}>
          {isVilla ? <Home size={14} /> : <UtensilsCrossed size={14} />}
          <span>{label}</span>
          {isVilla && villaNumber && (
            <span style={{ opacity: 0.9, fontWeight: 600 }}>({villaNumber})</span>
          )}
        </div>
        <span
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '1px 6px',
            borderRadius: 'var(--radius-pill, 9999px)',
            backgroundColor: isVilla ? '#d97706' : '#2e7d32',
            color: '#ffffff',
            fontWeight: 700,
          }}
        >
          {isVilla ? 'In-Villa' : 'Pavilion'}
        </span>
      </div>

      {showInstructions && (
        <div
          style={{
            fontSize: '11px',
            marginTop: '2px',
            lineHeight: 1.4,
            opacity: 0.95,
            borderTop: `1px dashed ${border}`,
            paddingTop: '4px',
          }}
        >
          {lang === 'vi' ? parsed.serviceInstructionsVi : parsed.serviceInstructionsEn}
        </div>
      )}

      {parsed.wellnessTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
          {parsed.wellnessTags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs, 4px)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                color: textColor,
                border: `1px solid ${border}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 600,
              }}
            >
              <Sparkles size={9} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
