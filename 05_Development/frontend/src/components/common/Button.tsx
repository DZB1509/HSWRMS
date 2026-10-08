import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = `hsw-btn-${variant}`;
  const sizeClass = size !== 'md' ? `hsw-btn-${size}` : '';

  return (
    <button
      className={`hsw-btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="hsw-btn-spinner" aria-hidden="true">⏳</span>
      ) : icon ? (
        <span className="hsw-btn-icon">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
