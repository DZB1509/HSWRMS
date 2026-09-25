import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export interface PrivacyNoticeProps {
  title: string;
  description: string;
  variant?: 'subtle' | 'highlight' | 'warning';
  icon?: 'shield' | 'lock';
  children?: React.ReactNode;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({
  title,
  description,
  variant = 'subtle',
  icon = 'shield',
  children,
}) => {
  let bg = 'var(--bg-soft)';
  let borderColor = 'var(--border-subtle)';
  let iconColor = 'var(--accent-olive)';

  if (variant === 'highlight') {
    bg = 'rgba(227, 210, 184, 0.2)';
    borderColor = 'rgba(191, 160, 122, 0.4)';
    iconColor = 'var(--accent-forest)';
  } else if (variant === 'warning') {
    bg = 'rgba(254, 243, 199, 0.4)';
    borderColor = 'rgba(217, 119, 6, 0.3)';
    iconColor = '#b45309';
  }

  const IconComp = icon === 'lock' ? Lock : ShieldCheck;

  return (
    <div
      className="hsw-privacy-notice"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-4) var(--space-5)',
        backgroundColor: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        margin: 'var(--space-4) 0',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px', color: iconColor }}>
        <IconComp size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}
        >
          {title}
        </div>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
        {children && <div style={{ marginTop: 'var(--space-2)' }}>{children}</div>}
      </div>
    </div>
  );
};
