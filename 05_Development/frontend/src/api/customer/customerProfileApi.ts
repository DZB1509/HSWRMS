import { apiClient } from '../client/apiClient';

/** Backend CustomerProfileResponse for GET/PUT /api/v1/customers/me/profile. */
export interface CustomerProfileData {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  residentialAddress: string | null;
  preferredLanguage: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
}

/** Backend success envelope: { success, message, data }. */
export interface CustomerProfileApiSuccess {
  success: boolean;
  message: string;
  data: CustomerProfileData;
}

/** Editable subset accepted by PUT /api/v1/customers/me/profile. Email is read-only. */
export interface UpdateCustomerProfileBody {
  fullName?: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  residentialAddress?: string | null;
  preferredLanguage?: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
}

export const getMyProfile = (): Promise<CustomerProfileApiSuccess> =>
  apiClient.get<CustomerProfileApiSuccess>('/customers/me/profile');

export const updateMyProfile = (
  body: UpdateCustomerProfileBody
): Promise<CustomerProfileApiSuccess> =>
  apiClient.put<CustomerProfileApiSuccess>('/customers/me/profile', body);
