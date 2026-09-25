import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';

export const PasswordResetPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      showToast('Mã khôi phục đã được gửi tới email của bạn (Mô phỏng: 123456)', 'info');
    }, 600);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Vui lòng nhập mã xác thực OTP 6 số');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Mật khẩu mới cần tối thiểu 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
      showToast('Đổi mật khẩu thành công!', 'success');
    }, 700);
  };

  return (
    <div className="hsw-auth-form-wrap">
      {step === 1 && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-sand-soft)',
                color: 'var(--accent-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
              }}
            >
              <KeyRound size={22} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              {t('auth.reset.title')}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('auth.reset.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <FormField label={t('auth.reset.emailLabel')} required error={error} id="reset-email">
              <TextInput
                id="reset-email"
                type="email"
                placeholder={t('auth.reset.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {t('auth.reset.sendCodeBtn')}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              <ArrowLeft size={14} />
              <span>{t('auth.reset.backToLogin')}</span>
            </Link>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              {t('auth.reset.step2Title')}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('auth.reset.step2Subtitle')}
            </p>
          </div>

          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <FormField label={t('auth.reset.otpLabel')} required id="reset-otp">
              <TextInput
                id="reset-otp"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </FormField>

            <FormField label={t('auth.reset.newPasswordLabel')} required error={error} id="reset-new-password">
              <PasswordInput
                id="reset-new-password"
                placeholder={t('auth.reset.newPasswordPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!error}
              />
            </FormField>

            <FormField label={t('auth.reset.confirmNewPasswordLabel')} required id="reset-confirm-password">
              <PasswordInput
                id="reset-confirm-password"
                placeholder={t('auth.reset.confirmNewPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {t('auth.reset.saveNewPasswordBtn')}
            </Button>
          </form>
        </>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-sand-soft)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            {t('auth.reset.successTitle')}
          </h2>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
            {t('auth.reset.successMessage')}
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
            style={{ width: '100%' }}
          >
            {t('auth.reset.backToLogin')}
          </Button>
        </div>
      )}
    </div>
  );
};
