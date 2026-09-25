import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, ArrowRight } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginAs } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('eleanor.vance@example.com');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/customer/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      loginAs('customer');
      showToast('Đăng nhập thành công với vai trò Customer (Eleanor Vance)', 'success');
      navigate(redirectUrl);
    }, 600);
  };

  const handleSimulatedSSO = (provider: 'Google' | 'Facebook') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginAs('customer');
      showToast(`Đăng nhập thành công qua ${provider} SSO`, 'success');
      navigate(redirectUrl);
    }, 500);
  };

  return (
    <div className="hsw-auth-form-wrap">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {t('auth.login.title')}
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('auth.login.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <FormField label={t('auth.login.emailLabel')} required error={errors.email} id="login-email">
          <TextInput
            id="login-email"
            type="email"
            placeholder={t('auth.login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
          />
        </FormField>

        <FormField label={t('auth.login.passwordLabel')} required error={errors.password} id="login-password">
          <PasswordInput
            id="login-password"
            placeholder={t('auth.login.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
          />
        </FormField>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Checkbox
            id="remember-me"
            label={t('auth.login.rememberMe')}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />

          <Link
            to="/password-reset"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-forest)', fontWeight: 500 }}
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          icon={<LogIn size={16} />}
          style={{ width: '100%', marginTop: 'var(--space-2)' }}
        >
          {t('auth.login.submitBtn')}
        </Button>
      </form>

      {/* Simulated SSO Dividers */}
      <div style={{ position: 'relative', margin: 'var(--space-6) 0', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        <span
          style={{
            position: 'relative',
            backgroundColor: '#ffffff',
            padding: '0 var(--space-3)',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {t('auth.login.orContinueWith')}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => handleSimulatedSSO('Google')}
          style={{ flex: 1, fontSize: 'var(--text-xs)' }}
        >
          <span style={{ fontWeight: 600 }}>G</span> Google
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => handleSimulatedSSO('Facebook')}
          style={{ flex: 1, fontSize: 'var(--text-xs)' }}
        >
          <span style={{ fontWeight: 600 }}>f</span> Facebook
        </Button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        <span>{t('auth.login.noAccount')} </span>
        <Link to="/register" style={{ color: 'var(--accent-forest)', fontWeight: 600 }}>
          {t('auth.login.registerNow')} <ArrowRight size={12} style={{ display: 'inline' }} />
        </Link>
      </div>
    </div>
  );
};
