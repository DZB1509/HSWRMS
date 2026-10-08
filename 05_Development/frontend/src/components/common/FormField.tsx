import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  helperText,
  error,
  id,
  children,
  className = '',
}) => {
  return (
    <div className={`hsw-form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="hsw-label">
          {label}
          {required && <span className="required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="hsw-input-error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className="hsw-input-helper">{helperText}</span>
      ) : null}
    </div>
  );
};
