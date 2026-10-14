import { apiClient } from '../client/apiClient';

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

