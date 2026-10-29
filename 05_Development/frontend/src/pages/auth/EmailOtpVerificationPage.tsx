import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { verifyEmailRequest } from '../../api/auth/authApi';
import { AppApiError } from '../../api/errors/apiError';

export const EmailOtpVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 min matches backend OTP expiry
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const pendingEmail =
    sessionStorage.getItem('hswrms_pending_verification_email') || '';

  // Redirect to register if no pending email
  useEffect(() => {
    if (!pendingEmail) {
      navigate('/register', { replace: true });
    }
  }, [pendingEmail, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-advance
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    // Focus the last filled or the next empty
    const focusIndex = Math.min(pasted.length, 5);
    const target = document.getElementById(`otp-input-${focusIndex}`);
    if (target) target.focus();
  };

  const toUserMessage = (error: unknown): string => {
    if (error instanceof AppApiError) {
      switch (error.code) {
        case 'OTP_INVALID': return t('auth.alerts.otpInvalid');
        case 'OTP_EXPIRED': return t('auth.alerts.otpExpired');
        case 'OTP_ATTEMPTS_EXCEEDED': return t('auth.alerts.otpAttemptsExceeded');
        case 'OTP_NOT_FOUND': return t('auth.alerts.otpNotFound');
        case 'OTP_CONSUMED': return t('auth.alerts.otpAlreadyUsed');
        case 'RESOURCE_NOT_FOUND': return t('auth.alerts.accountNotFound');
        case 'EMAIL_DELIVERY_FAILED': return t('auth.alerts.emailDeliveryFailed');
        case 'VALIDATION_ERROR': return error.validationErrors?.[0]?.message || t('auth.alerts.otpInvalid');
        case 'NETWORK_ERROR': return t('auth.alerts.networkError');
        default:
          if (error.status === 500) return t('auth.alerts.serverError');
          return error.message || t('auth.alerts.verificationFailed');
      }
    }
    return t('auth.alerts.verificationFailed');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      showToast(t('auth.alerts.codeIncomplete'), 'warning');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      await verifyEmailRequest({ email: pendingEmail, otp: fullCode });
      // Clean up pending email
      sessionStorage.removeItem('hswrms_pending_verification_email');
      showToast(t('auth.alerts.accountActivated'), 'success');
      // Navigate to login so the user logs in with their new credentials
      navigate('/login', { replace: true });
    } catch (error) {
      const message = toUserMessage(error);
      setFormError(message);
      showToast(message, 'error');
      // Clear OTP fields for retry (unless attempts exhausted)
      if (error instanceof AppApiError && (error.code === 'OTP_INVALID' || error.code === 'VALIDATION_ERROR')) {
        setOtp(['', '', '', '', '', '']);
        const firstInput = document.getElementById('otp-input-0');
        if (firstInput) firstInput.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="hsw-auth-form-wrap" style={{ textAlign: 'center' }}>
      <div className="hsw-auth-emblem" aria-hidden="true">
        <Mail size={22} />
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-3xl)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {t('auth.otp.title')}
      </h1>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-1)' }}>
        {t('auth.otp.subtitle')}
      </p>

      <div
        style={{
          display: 'inline-block',
          fontWeight: 600,
          color: 'var(--accent-forest)',
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {pendingEmail}
      </div>

      {formError ? (
        <div
          role="alert"
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.5,
            marginBottom: 'var(--space-4)',
            textAlign: 'left',
          }}
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleVerify} aria-busy={isLoading}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: 'var(--space-6)',
          }}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-input-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              autoFocus={i === 0}
              aria-label={`OTP digit ${i + 1}`}
              className="hsw-otp-input"
              disabled={isLoading}
              style={{
                borderColor: digit ? 'var(--accent-forest)' : undefined,
                boxShadow: digit ? '0 0 0 2px rgba(79, 90, 80, 0.15)' : undefined,
              }}
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          icon={<CheckCircle2 size={16} />}
          style={{ width: '100%', marginBottom: 'var(--space-4)' }}
        >
          {t('auth.otp.submitBtn')}
        </Button>
      </form>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
        {secondsLeft > 0 ? (
          <span>{t('auth.otp.expiresIn', { time: formatTimeLeft(secondsLeft) })}</span>
        ) : (
          <span style={{ color: 'var(--danger)' }}>{t('auth.alerts.otpExpiredHint')}</span>
        )}
      </div>

      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--bg-soft)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {t('auth.otp.realEmailHint')}
      </div>
    </div>
  );
};

