import React from 'react';

interface OperationalPageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  badge?: string;
  actions?: React.ReactNode;
}

export const OperationalPageHeader: React.FC<OperationalPageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        paddingBottom: 'var(--space-5)',
        marginBottom: 'var(--space-6)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '4px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-sand-soft)',
                color: 'var(--accent-forest)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <div
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {actions}
        </div>
      )}
    </div>
  );
};
