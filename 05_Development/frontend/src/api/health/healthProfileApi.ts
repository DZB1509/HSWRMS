import { apiClient } from '../client/apiClient';

/** Backend HealthProfileResponse for GET/PUT /api/v1/customers/me/health-profile. */
export interface HealthProfileData {
  healthProfileId: number | null;
  currentHealthCondition: string | null;
  injurySurgeryHistory: string | null;
  mobilityJointNotes: string | null;
  currentMedications: string | null;
  stressFatigueLevel: string | null;
  foodAllergies: string[];
  foodIntoleranceNotes: string | null;
  dietaryRequirements: string[];
  therapyPreferences: string[];
  dislikedIngredients: string | null;
  kitchenNotes: string | null;
  hasConsented: boolean;
}

/** Backend success envelope: { success, message, data }. */
export interface HealthProfileApiSuccess {
  success: boolean;
  message: string;
  data: HealthProfileData;
}

/** Editable subset accepted by PUT /api/v1/customers/me/health-profile. */
export interface UpdateHealthProfileBody {
  currentHealthCondition?: string | null;
  injurySurgeryHistory?: string | null;
  mobilityJointNotes?: string | null;
  currentMedications?: string | null;
  stressFatigueLevel?: string;
  foodAllergies?: string[];
  foodIntoleranceNotes?: string | null;
  dietaryRequirements?: string[];
  therapyPreferences?: string[];
  therapyCode?: string;
  dislikedIngredients?: string | null;
  kitchenNotes?: string | null;
}

export const getMyHealthProfile = (): Promise<HealthProfileApiSuccess> =>
  apiClient.get<HealthProfileApiSuccess>('/customers/me/health-profile');

export const updateMyHealthProfile = (
  body: UpdateHealthProfileBody
): Promise<HealthProfileApiSuccess> =>
  apiClient.put<HealthProfileApiSuccess>('/customers/me/health-profile', body);
