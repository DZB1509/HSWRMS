import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { GoogleIcon, FacebookIcon } from '../../components/common/BrandIcons';
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

    if (!email.trim()) newErrors.email = t('auth.alerts.emailRequired');
    if (!password) newErrors.password = t('auth.alerts.passwordRequired');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      loginAs('customer');
      showToast(t('auth.alerts.loginSuccess'), 'success');
      navigate(redirectUrl);
    }, 600);
  };

  const handleSimulatedSSO = (provider: 'Google' | 'Facebook') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginAs('customer');
      showToast(t('auth.alerts.ssoSuccess', { provider }), 'success');
      navigate(redirectUrl);
    }, 500);
  };

  return (
    <div className="hsw-auth-form-wrap">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        {/* Serene welcome / retreat access emblem */}
        <div className="hsw-auth-emblem" aria-hidden="true">
          <Sparkles size={22} />
        </div>
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
            className="hsw-auth-link"
            style={{ fontSize: 'var(--text-xs)' }}
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

      {/* Simulated SSO Dividers with refined gradient line */}
      <div className="hsw-auth-divider">
        <div className="hsw-auth-divider-line" />
        <span className="hsw-auth-divider-text">
          {t('auth.login.orContinueWith')}
        </span>
      </div>

      {/* Native Brand Colored SSO Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          type="button"
          className="hsw-btn-sso"
          onClick={() => handleSimulatedSSO('Google')}
          aria-label={t('auth.login.google')}
        >
          <GoogleIcon size={18} />
          <span>Google</span>
        </button>

        <button
          type="button"
          className="hsw-btn-sso"
          onClick={() => handleSimulatedSSO('Facebook')}
          aria-label={t('auth.login.facebook')}
        >
          <FacebookIcon size={18} />
          <span>Facebook</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        <span>{t('auth.login.noAccount')} </span>
        <Link to="/register" className="hsw-auth-link">
          <span>{t('auth.login.registerNow')}</span>
          <ArrowRight size={12} style={{ display: 'inline' }} />
        </Link>
      </div>
    </div>
  );
};
