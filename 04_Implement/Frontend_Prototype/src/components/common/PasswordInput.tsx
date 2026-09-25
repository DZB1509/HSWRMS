import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="hsw-password-wrap">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`hsw-input ${error ? 'has-error' : ''} ${className}`}
          style={{ paddingRight: '40px' }}
          {...props}
        />
        <button
          type="button"
          className="hsw-password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
