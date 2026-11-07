import { apiClient } from '../client/apiClient';

export interface UserProfileDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  accountStatus: string;
  roles: string[];
  emailVerified: boolean;
  createdAt: string;
}

export interface UpdateUserProfileDto {
  fullName: string;
  phoneNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getMyUserProfile = async (): Promise<UserProfileDto> => {
  const res = await apiClient.get<ApiResponseEnvelope<UserProfileDto>>('/users/me');
  return res.data;
};

export const updateMyUserProfile = async (body: UpdateUserProfileDto): Promise<UserProfileDto> => {
  const res = await apiClient.put<ApiResponseEnvelope<UserProfileDto>>('/users/me/profile', body);
  return res.data;
};

export const changeMyPassword = async (body: ChangePasswordDto): Promise<void> => {
  await apiClient.post<ApiResponseEnvelope<null>>('/users/me/change-password', body);
};

