import React from 'react';

export interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  className?: string;
  titleAs?: 'h1' | 'h2' | 'h3';
  style?: React.CSSProperties;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  subtitle,
  alignment = 'center',
  className = '',
  titleAs: TitleTag = 'h2',
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        textAlign: alignment,
        marginBottom: 'var(--space-10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
        ...style,
      }}
    >
      {badge && (
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--accent-olive)',
            backgroundColor: 'var(--accent-sand-soft)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {badge}
        </span>
      )}
      <TitleTag
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 400,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          margin: 0,
          maxWidth: '820px',
        }}
      >
        {title}
      </TitleTag>
      {subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginTop: 'var(--space-3)',
            marginBottom: 0,
            maxWidth: '640px',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
