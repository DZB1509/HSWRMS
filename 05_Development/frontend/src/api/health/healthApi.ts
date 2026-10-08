import { apiClient } from '../client/apiClient';

export interface HealthCheckResponse {
  status: string;
  service?: string;
  timestamp?: string;
}

export const checkBackendHealth = async (): Promise<HealthCheckResponse> => {
  return apiClient.get<HealthCheckResponse>('/health');
};
