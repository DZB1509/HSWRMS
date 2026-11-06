import { apiClient } from '../client/apiClient';

export interface HealthCheckResponse {
  status: string;
  service?: string;
  timestamp?: string;
}

export const checkBackendHealth = async (timeoutMs: number = 3000): Promise<HealthCheckResponse> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await apiClient.get<HealthCheckResponse>('/health', { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};
