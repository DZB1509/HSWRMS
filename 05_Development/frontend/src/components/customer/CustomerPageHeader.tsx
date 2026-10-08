import React from 'react';

export interface CustomerPageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const CustomerPageHeader: React.FC<CustomerPageHeaderProps> = ({
  badge,
  title,
  subtitle,
  action,
  children,
}) => {
  return (
    <div
      className="hsw-customer-page-header"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
        paddingBottom: 'var(--space-6)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div>
        {badge && (
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--accent-olive)',
              backgroundColor: 'var(--accent-sand-soft)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {badge}
          </span>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            margin: '0 0 var(--space-2)',
            lineHeight: 1.25,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              margin: 0,
              maxWidth: '680px',
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {action}
        </div>
      )}

      {children && <div style={{ width: '100%', marginTop: 'var(--space-4)' }}>{children}</div>}
    </div>
  );
};
