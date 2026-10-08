import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'editorial' | 'operational' | 'sensitive';
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  title,
  subtitle,
  action,
  className = '',
  ...props
}) => {
  const variantClass = variant !== 'standard' ? `hsw-card-${variant}` : '';

  return (
    <div className={`hsw-card ${variantClass} ${className}`} {...props}>
      {(title || action) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            {title && (
              <h3 style={{
                fontFamily: variant === 'editorial' ? 'var(--font-display)' : 'var(--font-ui)',
                fontSize: variant === 'editorial' ? 'var(--text-xl)' : 'var(--text-md)',
                fontWeight: 600
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: 'var(--space-5)' }}>
        {children}
      </div>
    </div>
  );
};
