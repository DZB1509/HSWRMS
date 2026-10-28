import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { FormField } from '../../components/common/FormField';
import { TextInput } from '../../components/common/TextInput';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ssoExchangeTicket, ssoLinkTicket, ssoProviderLabel } from '../../api/auth/authApi';
import { setAuthToken } from '../../api/client/apiClient';
import { AppApiError } from '../../api/errors/apiError';
import { resolvePostLoginTarget } from './roleRouting';

/** Stable backend SSO error codes → i18n keys (fallback: generic failure). */
const SSO_ERROR_KEYS: Record<string, string> = {
  SSO_NOT_CONFIGURED: 'auth.alerts.ssoNotConfigured',
  SSO_EMPLOYEE_ACCOUNT: 'auth.alerts.ssoStaffAccount',
  SSO_EMAIL_NOT_VERIFIED: 'auth.alerts.ssoEmailNotVerified',
  SSO_ACCOUNT_NOT_ACTIVE: 'auth.alerts.accountNotActive',
  SSO_ACCOUNT_NOT_ELIGIBLE: 'auth.alerts.ssoFailed',
  SSO_LINK_CONFLICT: 'auth.alerts.ssoFailed',
  SSO_LINK_NOT_ALLOWED: 'auth.alerts.ssoLinkNotAllowed',
  SSO_AUTH_FAILED: 'auth.alerts.ssoFailed',
  SSO_FAILED: 'auth.alerts.ssoFailed',
};

const ssoErrorMessage = (translate: (key: string) => string, code: string): string =>
  translate(SSO_ERROR_KEYS[code] ?? 'auth.alerts.ssoFailed');

/**
 * Landing page for the backend Google OAuth callback.
 *
 * The backend redirected here with either:
 * - `?purpose=login&ticket=…` — exchange the one-time ticket for the standard
 *   JWT login response, then continue through the shared role routing; or
 * - `?purpose=register&ticket=…` — hand the registration ticket to the existing
 *   Register page for prefill (no account exists yet); or
 * - `?error=CODE` — controlled failure; return to the login screen.
 *
 * The ticket is removed from the browser URL as soon as it is read (replace
 * navigations), and the login ticket is single-use server-side.
 */
export const SsoCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithCredentials } = useAuth();
  const { showToast } = useToast();
  const handledRef = useRef(false);
  const [isCompleting, setIsCompleting] = useState(true);
  const [linkTicket, setLinkTicket] = useState('');
  const [linkOtp, setLinkOtp] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const completeSsoLogin = (
    response: { data: { token: string; userId: number; email: string; fullName: string; roles: string[]; accountStatus: string; tokenType: string; expiresInMs: number } },
    provider: 'google' | 'facebook',
  ) => {
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
    showToast(t('auth.alerts.ssoLoginSuccess', { provider: ssoProviderLabel(provider) }), 'success');
    navigate(resolvePostLoginTarget(null, resolvedRole), { replace: true });
  };

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const error = searchParams.get('error');
    const ticket = searchParams.get('ticket');
    const purpose = searchParams.get('purpose');

    if (error) {
      showToast(ssoErrorMessage(t, error), 'error');
      navigate('/login', { replace: true });
      return;
    }

    if (!ticket || !purpose) {
      showToast(t('auth.alerts.ssoFailed'), 'error');
      navigate('/login', { replace: true });
      return;
    }

    if (purpose === 'register') {
      // Carry the short-lived registration ticket into the existing Register
      // page (URL replaced so the raw ticket is not kept in browser history
      // beyond this hand-off).
      navigate(`/register?ssoTicket=${encodeURIComponent(ticket)}`, { replace: true });
      return;
    }

    if (purpose === 'link') {
      // Facebook account-linking handshake: render the OTP collection form.
      // The backend already sent the code to the account's email; the ticket
      // is single-use server-side.
      setLinkTicket(ticket);
      setIsCompleting(false);
      return;
    }

    // purpose === 'login'
    // The provider name is informational only: the ticket itself is bound to
    // the validated provider identity server-side and cannot be swapped.
    const providerParam = (searchParams.get('provider') === 'facebook' ? 'facebook' : 'google') as
      import('../../api/auth/authApi').SsoProvider;
    (async () => {
      try {
        const response = await ssoExchangeTicket({ ticket });
        completeSsoLogin(response, providerParam);
      } catch (err) {
        const message =
          err instanceof AppApiError && err.message ? err.message : t('auth.alerts.ssoFailed');
        showToast(message, 'error');
        navigate('/login', { replace: true });
      } finally {
        setIsCompleting(false);
      }
    })();
  }, [searchParams, loginWithCredentials, navigate, showToast, t]);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLinking || !linkTicket) return;
    setLinkError(null);
    setIsLinking(true);
    try {
      const response = await ssoLinkTicket({ ticket: linkTicket, otp: linkOtp.trim() });
      completeSsoLogin(response, 'facebook');
    } catch (err) {
      const message =
        err instanceof AppApiError && err.message ? err.message : t('auth.alerts.ssoFailed');
      setLinkError(message);
      showToast(message, 'error');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="hsw-auth-form-wrap" style={{ textAlign: 'center' }}>
      <div className="hsw-auth-emblem" aria-hidden="true">
        <Sparkles size={22} />
      </div>
      {linkPurpose() === 'link' ? (
        <>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {t('auth.ssoLink.title')}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 'var(--form-max-width)', margin: '0 auto var(--space-4)' }}>
            {t('auth.ssoLink.subtitle')}
          </p>
          <form
            onSubmit={handleLinkSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              maxWidth: 'var(--form-max-width)',
              margin: '0 auto',
            }}
            aria-busy={isLinking}
          >
            {linkError ? (
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
                {linkError}
              </div>
            ) : null}
            <FormField label={t('auth.ssoLink.codeLabel')} required error={linkError ?? undefined} id="link-otp">
              <TextInput
                id="link-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder={t('auth.ssoLink.codePlaceholder')}
                value={linkOtp}
                onChange={(e) => setLinkOtp(e.target.value)}
                error={!!linkError}
              />
            </FormField>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLinking}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {t('auth.ssoLink.submitBtn')}
            </Button>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {t('auth.ssoLink.demoHint')}
            </p>
          </form>
        </>
      ) : (
        <>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {t('auth.ssoCallback.title')}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {isCompleting ? t('auth.ssoCallback.inProgress') : t('auth.ssoCallback.redirecting')}
          </p>
        </>
      )}
    </div>
  );

  function linkPurpose(): string {
    return searchParams.get('purpose') ?? '';
  }
};
