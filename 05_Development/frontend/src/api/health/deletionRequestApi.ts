import { apiClient } from '../client/apiClient';

export interface DeletionRequestData {
  deletionRequestId: number;
  requestType: string;
  status: string;
  requestedByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeletionRequestApiSuccess {
  success: boolean;
  message: string;
  data: DeletionRequestData;
}

export interface DeletionRequestListApiSuccess {
  success: boolean;
  message: string;
  data: DeletionRequestData[];
}

export const listMyDeletionRequests = (): Promise<DeletionRequestListApiSuccess> =>
  apiClient.get<DeletionRequestListApiSuccess>('/customers/me/deletion-requests');

export const createMyDeletionRequest = (body: { requestType: string }): Promise<DeletionRequestApiSuccess> =>
  apiClient.post<DeletionRequestApiSuccess>('/customers/me/deletion-requests', body);

export const cancelMyDeletionRequest = (id: number): Promise<DeletionRequestApiSuccess> =>
  apiClient.post<DeletionRequestApiSuccess>(`/customers/me/deletion-requests/${id}/cancel`, {});
