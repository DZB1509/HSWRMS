import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, UserPlus, Compass } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { setAuthToken } from '../../api/client/apiClient';
import { resolvePostLoginTarget } from './roleRouting';
import { registerRequest, ssoRegisterRequest, ssoResolveTicket } from '../../api/auth/authApi';
import { type SsoProvider, type SsoRegistrationPrefillData } from '../../api/auth/authApi';
import { AppApiError } from '../../api/errors/apiError';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loginWithCredentials } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Google SSO registration prefill ────────────────────────────────
  const [searchParams] = useSearchParams();
  const ssoTicket = searchParams.get('ssoTicket');
  const [isSsoRegistration, setIsSsoRegistration] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<SsoProvider | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Facebook exposes no email_verified claim, so its registration always takes
  // the OTP route and therefore requires a password. Google's verified email
  // keeps the password optional (SSO-only account).
  const requiresSsoPassword = isSsoRegistration && ssoProvider === 'facebook';

  useEffect(() => {
    if (!ssoTicket || isSsoRegistration || isResolving) return;

    const resolveSsoTicket = async () => {
      setIsResolving(true);
      try {
        const response = await ssoResolveTicket({ ticket: ssoTicket });
        const prefill: SsoRegistrationPrefillData = response.data;
        setFullName(prefill.fullName);
        setEmail(prefill.email);
        setSsoProvider(prefill.provider.toLowerCase() === 'facebook' ? 'facebook' : 'google');
        setIsSsoRegistration(true);
      } catch {
        // Resolution failed — fall back to normal registration without prefill.
        setIsSsoRegistration(false);
      } finally {
        setIsResolving(false);
      }
    };

    resolveSsoTicket();
  }, [ssoTicket, isSsoRegistration, isResolving]);

  const toUserMessage = (error: unknown): string => {
    if (error instanceof AppApiError) {
      if (error.code === 'EMAIL_EXISTS') return t('auth.alerts.emailAlreadyRegistered');
      if (error.code === 'VALIDATION_ERROR' && error.validationErrors?.length) {
        return error.validationErrors.map((e) => e.message).join(' ');
      }
      if (error.code === 'NETWORK_ERROR') return t('auth.alerts.networkError');
      if (error.status === 500) return t('auth.alerts.serverError');
      return error.message || t('auth.alerts.registrationFailed');
    }
    return t('auth.alerts.registrationFailed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const newErrors: Record<string, string> = {};

    if (!isSsoRegistration) {
      if (!fullName.trim()) newErrors.fullName = t('auth.alerts.fullNameRequired');
      if (!email.trim()) newErrors.email = t('auth.alerts.emailInvalid');
      if (!password || password.length < 8) newErrors.password = t('auth.alerts.passwordMinLength');
      if (password !== confirmPassword) newErrors.confirmPassword = t('auth.alerts.passwordMismatch');
    } else if (!fullName.trim()) {
      // SSO prefill already filled the name, but the user may clear it.
      newErrors.fullName = t('auth.alerts.fullNameRequired');
    }
    if (requiresSsoPassword) {
      // Facebook registration always verifies by email OTP, so a password is
      // mandatory even though the account arrived via SSO.
      if (!password || password.length < 8) newErrors.password = t('auth.alerts.passwordMinLength');
      if (password !== confirmPassword) newErrors.confirmPassword = t('auth.alerts.passwordMismatch');
    }
    if (!consent) newErrors.consent = t('auth.alerts.consentRequired');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsLoading(true);

    try {
      if (isSsoRegistration && ssoTicket) {
        // SSO registration: email comes from the server-bound ticket. Google
        // (verified) needs no password and auto-signs-in; Facebook requires a
        // password and answers SSO_OTP_REQUIRED → continue via the OTP screen.
        const response = await ssoRegisterRequest({
          ssoTicket,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          password: requiresSsoPassword ? password : undefined,
          consent,
        });
        // SSO registration auto-signs in; persist the standard JWT login session
        // exactly like the password and SSO-callback login flows.
        setAuthToken(response.data.token);
        const resolvedRole = loginWithCredentials({
          userId: response.data.userId,
          email: response.data.email,
          fullName: response.data.fullName,
          roles: response.data.roles,
          accountStatus: response.data.accountStatus,
          tokenType: response.data.tokenType,
          expiresInMs: response.data.expiresInMs,
        });
        showToast(t('auth.alerts.registrationCompleted'), 'success');
        navigate(resolvePostLoginTarget(null, resolvedRole), { replace: true });
      } else {
        await registerRequest({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          confirmPassword,
          consent,
        });
        sessionStorage.setItem('hswrms_pending_verification_email', email.trim());
        showToast(t('auth.alerts.otpDispatched'), 'success');
        navigate('/register/verify');
      }
    } catch (error) {
      if (error instanceof AppApiError && error.code === 'SSO_OTP_REQUIRED') {
        // Facebook registration: the PENDING account and OTP exist server-side,
        // but no JWT is issued until the mailbox is proven via the OTP screen.
        sessionStorage.setItem('hswrms_pending_verification_email', email.trim());
        showToast(t('auth.alerts.otpDispatched'), 'success');
        navigate('/register/verify', { replace: true });
        return;
      }
      const message = toUserMessage(error);
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hsw-auth-form-wrap">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        {/* Begin wellness journey thematic accent */}
        <div className="hsw-auth-emblem" aria-hidden="true">
          <Compass size={22} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {t('auth.register.title')}
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('auth.register.subtitle')}
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

        {isSsoRegistration && (
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info)',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.5,
              marginBottom: 'var(--space-2)',
            }}
          >
            <strong>{t('auth.register.ssoBannerTitle')}:</strong> {t(
              requiresSsoPassword
                ? 'auth.register.ssoBannerBodyFacebook'
                : 'auth.register.ssoBannerBody'
            )}
          </div>
        )}

        <FormField
          label={t('auth.register.fullNameLabel')}
          required={!isSsoRegistration}
          error={errors.fullName}
          id="reg-fullname"
        >
          <TextInput
            id="reg-fullname"
            placeholder={t('auth.register.fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={!!errors.fullName}
            disabled={isSsoRegistration}
          />
        </FormField>

        <FormField
          label={t('auth.register.emailLabel')}
          required={!isSsoRegistration}
          error={errors.email}
          id="reg-email"
        >
          <TextInput
            id="reg-email"
            type="email"
            placeholder={t('auth.register.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            disabled={isSsoRegistration}
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

        {(!isSsoRegistration || requiresSsoPassword) && (
          <>
            <FormField
              label={t('auth.register.passwordLabel')}
              required
              error={errors.password}
              id="reg-password"
            >
              <PasswordInput
                id="reg-password"
                placeholder={t('auth.register.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
              />
            </FormField>

            <FormField
              label={t('auth.register.confirmPasswordLabel')}
              required
              error={errors.confirmPassword}
              id="reg-confirm-password"
            >
              <PasswordInput
                id="reg-confirm-password"
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
              />
            </FormField>
          </>
        )}

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
          {isSsoRegistration ? t('auth.register.submitSsoBtn') : t('auth.register.submitBtn')}
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        <span>{t('auth.register.alreadyHaveAccount')} </span>
        <Link to="/login" className="hsw-auth-link">
          <span>{t('auth.register.signInNow')}</span>
          <ArrowRight size={12} style={{ display: 'inline' }} />
        </Link>
      </div>
    </div>
  );
};

