import { apiClient, API_BASE_URL } from '../client/apiClient';

// ── Register ──────────────────────────────────────────────────────────

/** Request body for POST /api/v1/auth/register (backend RegisterRequest). */
export interface RegisterRequestBody {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  consent: boolean;
}

/** Success payload inside the backend ApiResponse envelope (backend RegisterResponse). */
export interface RegisterResponseData {
  userId: number;
  email: string;
  message: string;
}

/** Backend success envelope for registration. */
export interface RegisterApiSuccess {
  success: boolean;
  message: string;
  data: RegisterResponseData;
}

export const registerRequest = (body: RegisterRequestBody): Promise<RegisterApiSuccess> =>
  apiClient.post<RegisterApiSuccess>('/auth/register', body);

// ── Google SSO ─────────────────────────────────────────────────────────

export type SsoProvider = 'google' | 'facebook';

/** Display name for SSO toasts (provider id is lowercase in URLs/tickets). */
export const ssoProviderLabel = (provider: SsoProvider): string =>
  provider === 'facebook' ? 'Facebook' : 'Google';

/**
 * Absolute URL of the backend OAuth authorization start endpoint
 * (Spring Security redirects from here to the provider's consent screen).
 */
export const ssoAuthorizeUrl = (provider: SsoProvider): string =>
  `${API_BASE_URL.replace(/\/+$/, '')}/auth/sso/${provider}`;

/** Request body for POST /api/v1/auth/sso/tickets/exchange|resolve. */
export interface SsoTicketRequestBody {
  ticket: string;
}

/** Success payload inside the backend ApiResponse envelope for ticket resolution. */
export interface SsoRegistrationPrefillData {
  provider: string;
  email: string;
  fullName: string;
}

export interface SsoRegistrationPrefillApiSuccess {
  success: boolean;
  message: string;
  data: SsoRegistrationPrefillData;
}

/**
 * Redeems a LOGIN ticket for the standard login response (same envelope as
 * POST /auth/login). Consumes the ticket server-side.
 */
export const ssoExchangeTicket = (body: SsoTicketRequestBody): Promise<LoginApiSuccess> =>
  apiClient.post<LoginApiSuccess>('/auth/sso/tickets/exchange', body);

/** Resolves registration prefill data from a REGISTRATION ticket (not consumed). */
export const ssoResolveTicket = (body: SsoTicketRequestBody): Promise<SsoRegistrationPrefillApiSuccess> =>
  apiClient.post<SsoRegistrationPrefillApiSuccess>('/auth/sso/tickets/resolve', body);

/**
 * Request body for POST /api/v1/auth/sso/tickets/link.
 * Ticket is the single-use LINK token; otp is the code sent to the existing
 * account's email to prove mailbox ownership before binding the Facebook identity.
 */
export interface SsoLinkRequestBody {
  ticket: string;
  otp: string;
}

/**
 * Completes a Facebook account link: verifies the OTP, binds the Facebook identity
 * to the existing Customer account, and returns the standard login envelope (JWT).
 * Consumes the LINK ticket server-side.
 */
export const ssoLinkTicket = (body: SsoLinkRequestBody): Promise<LoginApiSuccess> =>
  apiClient.post<LoginApiSuccess>('/auth/sso/tickets/link', body);

/**
 * Request body for POST /api/v1/auth/register/sso. Email is deliberately absent —
 * the backend takes it from the server-bound registration ticket. Password is
 * optional for Google (verified-email) accounts; it is REQUIRED for Facebook
 * registrations (which always verify the mailbox via OTP). Consent remains
 * mandatory.
 */
export interface SsoRegisterRequestBody {
  ssoTicket: string;
  fullName: string;
  phone?: string;
  password?: string;
  consent: boolean;
}

/** SSO registration returns the standard login envelope (auto sign-in). */
export const ssoRegisterRequest = (body: SsoRegisterRequestBody): Promise<LoginApiSuccess> =>
  apiClient.post<LoginApiSuccess>('/auth/register/sso', body);

// ── Verify Email ──────────────────────────────────────────────────────

/** Request body for POST /api/v1/auth/verify-email (backend VerifyEmailRequest). */
export interface VerifyEmailRequestBody {
  email: string;
  otp: string;
}

/** Success payload inside the backend ApiResponse envelope (backend VerifyEmailResponse). */
export interface VerifyEmailResponseData {
  userId: number;
  email: string;
  emailVerified: boolean;
  accountStatus: string;
}

/** Backend success envelope for email verification. */
export interface VerifyEmailApiSuccess {
  success: boolean;
  message: string;
  data: VerifyEmailResponseData;
}

export const verifyEmailRequest = (body: VerifyEmailRequestBody): Promise<VerifyEmailApiSuccess> =>
  apiClient.post<VerifyEmailApiSuccess>('/auth/verify-email', body);

// ── Login ─────────────────────────────────────────────────────────────

/** Request body for POST /api/v1/auth/login (backend LoginRequest). */
export interface LoginRequestBody {
  email: string;
  password: string;
}

/** Success payload inside the backend ApiResponse envelope (backend LoginResponse). */
export interface LoginResponseData {
  token: string;
  tokenType: string;
  expiresInMs: number;
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
  accountStatus: string;
}

/** Backend success envelope: { success, message, data }. */
export interface LoginApiSuccess {
  success: boolean;
  message: string;
  data: LoginResponseData;
}

export const loginRequest = (body: LoginRequestBody): Promise<LoginApiSuccess> =>
  apiClient.post<LoginApiSuccess>('/auth/login', body);

