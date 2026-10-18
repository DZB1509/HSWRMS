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
import { loginRequest, ssoAuthorizeUrl } from '../../api/auth/authApi';
import { setAuthToken } from '../../api/client/apiClient';
import { AppApiError } from '../../api/errors/apiError';
import type { Role } from '../../types/auth';

const DASHBOARD_BY_ROLE: Record<Role, string> = {
  customer: '/customer/dashboard',
  receptionist: '/receptionist/dashboard',
  therapist: '/therapist/dashboard',
  fb_staff: '/fb/dashboard',
  manager: '/manager/dashboard',
  admin: '/admin/dashboard',
};

/** Route prefixes each role may be sent back to via `?redirect=` (verified against the router). */
const REDIRECT_PREFIXES_BY_ROLE: Record<Role, string[]> = {
  customer: ['/customer', '/retreats', '/'],
  receptionist: ['/receptionist'],
  therapist: ['/therapist'],
  fb_staff: ['/fb'],
  manager: ['/manager', '/admin/system-overview'],
  admin: ['/admin', '/manager'],
};

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithCredentials } = useAuth();
  const { showToast } = useToast();

  // Prefill matches the DevAccountBootstrap demo customer (dev profile) so a
  // fresh clone can log in immediately; users registering their own account
  // simply overwrite it.
  const [email, setEmail] = useState('customer@heavenstay.dev');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectParam = searchParams.get('redirect');

  const resolvePostLoginTarget = (resolvedRole: Role): string => {
    // Accept the requested redirect only when it is an internal path the
    // authenticated role is actually allowed to visit; otherwise fall back
    // to that role's own dashboard so Customer-only URLs never trap staff.
    if (redirectParam && redirectParam.startsWith('/')) {
      const allowed = REDIRECT_PREFIXES_BY_ROLE[resolvedRole] ?? [];
      if (
        allowed.some(
          (prefix) =>
            redirectParam === prefix ||
            redirectParam === '/' ||
            (prefix !== '/' && redirectParam.startsWith(`${prefix}/`)),
        )
      ) {
        return redirectParam;
      }
    }
    return DASHBOARD_BY_ROLE[resolvedRole];
  };

  const toUserMessage = (error: unknown): string => {
    if (error instanceof AppApiError) {
      if (error.code === 'EMAIL_NOT_VERIFIED') return t('auth.alerts.emailNotVerified');
      if (error.code === 'ACCOUNT_NOT_ACTIVE') return t('auth.alerts.accountNotActive');
      if (error.code === 'UNAUTHORIZED' || error.status === 401) return t('auth.alerts.invalidCredentials');
      if (error.code === 'NETWORK_ERROR') return t('auth.alerts.networkError');
      return error.message || t('auth.alerts.loginFailed');
    }
    return t('auth.alerts.loginFailed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = t('auth.alerts.emailRequired');
    if (!password) newErrors.password = t('auth.alerts.passwordRequired');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsLoading(true);

    try {
      const response = await loginRequest({ email: email.trim(), password });
      setAuthToken(response.data.token, rememberMe);
      const resolvedRole = loginWithCredentials({
        userId: response.data.userId,
        email: response.data.email,
        fullName: response.data.fullName,
        roles: response.data.roles,
        accountStatus: response.data.accountStatus,
        tokenType: response.data.tokenType,
        expiresInMs: response.data.expiresInMs,
      });
      showToast(t('auth.alerts.loginSuccess'), 'success');
      navigate(resolvePostLoginTarget(resolvedRole), { replace: true });
    } catch (error) {
      const message = toUserMessage(error);
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSso = () => {
    setIsLoading(true);
    // Full browser redirect to the backend OAuth authorization endpoint.
    // The backend issues a one-time ticket and the browser returns here via
    // the SsoCallbackPage route after the Google consent screen.
    window.location.href = ssoAuthorizeUrl('google');
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} aria-busy={isLoading}>
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
            }}
          >
            {formError}
          </div>
        ) : null}
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
          onClick={handleGoogleSso}
          aria-label={t('auth.login.google')}
        >
          <GoogleIcon size={18} />
          <span>Google</span>
        </button>

        <button
          type="button"
          className="hsw-btn-sso hsw-btn-sso-disabled"
          disabled
          aria-label={t('auth.login.facebook')}
          aria-disabled="true"
        >
          <FacebookIcon size={18} />
          <span>Facebook (Coming Soon)</span>
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
