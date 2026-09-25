import React from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`hsw-input ${error ? 'has-error' : ''} ${className}`}
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
