import { apiClient } from '../client/apiClient';

/** Backend ConsentRecordResponse for GET /api/v1/customers/me/consents. */
export interface ConsentRecordData {
  consentId: number;
  consentType: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  policyVersion: string;
  active: boolean;
}

/** Backend success envelope: { success, message, data }. */
export interface ConsentListApiSuccess {
  success: boolean;
  message: string;
  data: ConsentRecordData[];
}

/** Backend success envelope for grant/revoke (single record). */
export interface ConsentApiSuccess {
  success: boolean;
  message: string;
  data: ConsentRecordData;
}

/** Request body for POST /api/v1/customers/me/consents (backend GrantConsentRequest). */
export interface GrantConsentBody {
  consentType: string;
}

export const listMyConsents = (): Promise<ConsentListApiSuccess> =>
  apiClient.get<ConsentListApiSuccess>('/customers/me/consents');

export const grantConsent = (body: GrantConsentBody): Promise<ConsentApiSuccess> =>
  apiClient.post<ConsentApiSuccess>('/customers/me/consents', body);
