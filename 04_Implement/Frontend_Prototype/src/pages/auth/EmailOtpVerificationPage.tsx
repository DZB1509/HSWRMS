import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle2, RotateCw } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const EmailOtpVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  const { showToast } = useToast();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pendingEmail =
    sessionStorage.getItem('hswrms_pending_verification_email') ||
    'eleanor.vance@example.com';

  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanResend(true);
      return;
    }
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

  const handleResend = () => {
    setSecondsLeft(60);
    setCanResend(false);
    showToast('Mã OTP mới đã được gửi (Mô phỏng: 123456)', 'info');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      showToast('Vui lòng nhập đủ 6 chữ số mã xác thực', 'warning');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginAs('customer');
      showToast('Tài khoản đã được kích hoạt thành công!', 'success');
      navigate('/customer/dashboard');
    }, 700);
  };

  return (
    <div className="hsw-auth-form-wrap" style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-sand-soft)',
          color: 'var(--accent-forest)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-4)',
        }}
      >
        <Mail size={24} />
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
          marginBottom: 'var(--space-6)',
        }}
      >
        {pendingEmail}
      </div>

      <form onSubmit={handleVerify}>
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
              autoFocus={i === 0}
              aria-label={`OTP digit ${i + 1}`}
              style={{
                width: '46px',
                height: '54px',
                textAlign: 'center',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                boxShadow: digit ? '0 0 0 2px var(--accent-forest)' : 'none',
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
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-forest)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCw size={12} />
            <span>{t('auth.otp.resendNow')}</span>
          </button>
        ) : (
          <span>{t('auth.otp.resendCountdown', { seconds: secondsLeft })}</span>
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
        {t('auth.otp.demoHint')}
      </div>
    </div>
  );
};
