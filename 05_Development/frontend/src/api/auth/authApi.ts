import { apiClient } from '../client/apiClient';

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
