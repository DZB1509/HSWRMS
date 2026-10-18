import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ssoExchangeTicket } from '../../api/auth/authApi';
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

    // purpose === 'login'
    (async () => {
      try {
        const response = await ssoExchangeTicket({ ticket });
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
        showToast(t('auth.alerts.ssoLoginSuccess', { provider: 'Google' }), 'success');
        navigate(resolvePostLoginTarget(null, resolvedRole), { replace: true });
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

  return (
    <div className="hsw-auth-form-wrap" style={{ textAlign: 'center' }}>
      <div className="hsw-auth-emblem" aria-hidden="true">
        <Sparkles size={22} />
      </div>
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
    </div>
  );
};
