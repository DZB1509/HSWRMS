import { AppApiError, type ApiErrorResponse } from '../errors/apiError';

export const API_BASE_URL: string =
  (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:8080/api/v1';

const AUTH_TOKEN_KEY = 'hswrms_jwt_token';

// Embedded dev token for presentation preview (Eleanor Vance - User 7, all roles: CUSTOMER, RECEPTIONIST, MANAGER, ADMIN)
const DEFAULT_DEV_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlbGVhbm9yLnZhbmNlQGhlYXZlbnN0YXkucmVzb3J0IiwidXNlcklkIjo3LCJmdWxsTmFtZSI6IkVsZWFub3IgVmFuY2UiLCJyb2xlcyI6WyJST0xFX0NVU1RPTUVSIiwiUk9MRV9SRUNFUFRJT05JU1QiLCJST0xFX01BTkFHRVIiLCJST0xFX0FETUlOIl0sImlhdCI6MTc5MjMzNjY0OCwiZXhwIjoxODIzODcyNjQ4fQ.ncjSTel6e_GSSm8F3u8V1E8hR67C0fywvmal83gi-tk';


export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY) || DEFAULT_DEV_TOKEN;
};

export const setAuthToken = (token: string, persist: boolean = false): void => {
  if (typeof window === 'undefined') return;
  if (persist) {
    localStorage?.setItem(AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage?.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage?.removeItem(AUTH_TOKEN_KEY);
  localStorage?.removeItem(AUTH_TOKEN_KEY);
};

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...restOptions } = options;

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getAuthToken();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    // 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (isJson && data && typeof data === 'object') {
        const errObj = data as ApiErrorResponse;
        throw new AppApiError({
          timestamp: errObj.timestamp || new Date().toISOString(),
          status: response.status,
          code: errObj.code || `HTTP_${response.status}`,
          message: errObj.message || response.statusText,
          path: errObj.path || endpoint,
          errors: errObj.errors,
        });
      }

      throw new AppApiError({
        timestamp: new Date().toISOString(),
        status: response.status,
        code: `HTTP_${response.status}`,
        message: String(data) || response.statusText,
        path: endpoint,
      });
    }

    return data as T;
  } catch (error) {
    if (error instanceof AppApiError) {
      throw error;
    }
    // Network failure, CORS blockage, or offline state
    throw new AppApiError({
      timestamp: new Date().toISOString(),
      status: 0,
      code: 'NETWORK_ERROR',
      message: (error as Error).message || 'Network request failed or backend unreachable',
      path: endpoint,
    });
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
