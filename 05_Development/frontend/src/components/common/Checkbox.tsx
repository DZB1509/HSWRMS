import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className={`hsw-checkbox-group ${className}`}>
        <label htmlFor={id} className="hsw-checkbox-label">
          <input ref={ref} id={id} type="checkbox" {...props} />
          <span>{label}</span>
        </label>
        {error && <span className="hsw-input-error" role="alert" style={{ marginLeft: '28px' }}>{error}</span>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
