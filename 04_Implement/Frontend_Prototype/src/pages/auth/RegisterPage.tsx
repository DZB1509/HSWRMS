import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, UserPlus } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!email.trim()) newErrors.email = 'Vui lòng nhập email hợp lệ';
    if (!password || password.length < 8) newErrors.password = 'Mật khẩu cần tối thiểu 8 ký tự';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (!consent) newErrors.consent = 'Vui lòng chấp thuận điều khoản bảo mật dữ liệu sức khỏe';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    // Simulate OTP dispatch
    setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('hswrms_pending_verification_email', email);
      showToast('Mã OTP 6 số đã được gửi tới email của bạn (Mô phỏng)', 'success');
      navigate('/register/verify');
    }, 800);
  };

  return (
    <div className="hsw-auth-form-wrap">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {t('auth.register.title')}
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('auth.register.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <FormField label={t('auth.register.fullNameLabel')} required error={errors.fullName} id="reg-fullname">
          <TextInput
            id="reg-fullname"
            placeholder={t('auth.register.fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={!!errors.fullName}
          />
        </FormField>

        <FormField label={t('auth.register.emailLabel')} required error={errors.email} id="reg-email">
          <TextInput
            id="reg-email"
            type="email"
            placeholder={t('auth.register.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
          />
        </FormField>

        <FormField label={t('auth.register.phoneLabel')} id="reg-phone">
          <TextInput
            id="reg-phone"
            type="tel"
            placeholder={t('auth.register.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormField>

        <FormField label={t('auth.register.passwordLabel')} required error={errors.password} id="reg-password">
          <PasswordInput
            id="reg-password"
            placeholder={t('auth.register.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
          />
        </FormField>

        <FormField label={t('auth.register.confirmPasswordLabel')} required error={errors.confirmPassword} id="reg-confirm-password">
          <PasswordInput
            id="reg-confirm-password"
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
          />
        </FormField>

        <Checkbox
          id="register-consent"
          label={t('auth.register.consentCheckbox')}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          error={errors.consent}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          icon={<UserPlus size={16} />}
          style={{ width: '100%', marginTop: 'var(--space-2)' }}
        >
          {t('auth.register.submitBtn')}
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        <span>{t('auth.register.alreadyHaveAccount')} </span>
        <Link to="/login" style={{ color: 'var(--accent-forest)', fontWeight: 600 }}>
          {t('auth.register.signInNow')} <ArrowRight size={12} style={{ display: 'inline' }} />
        </Link>
      </div>
    </div>
  );
};
