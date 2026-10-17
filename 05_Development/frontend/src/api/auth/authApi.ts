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

export type SsoProvider = 'google';

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
 * Request body for POST /api/v1/auth/register/sso. Email is deliberately absent —
 * the backend takes it from the server-bound registration ticket. Password is
 * optional for SSO-only accounts; consent remains mandatory.
 */
export interface SsoRegisterRequestBody {
  ssoTicket: string;
  fullName: string;
  phone?: string;
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

