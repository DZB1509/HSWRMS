import { apiClient } from '../client/apiClient';

/** Explicit customer declaration state for allergies / dietary requirements. */
export type HealthDeclarationState = 'NOT_DECLARED' | 'EXPLICITLY_NONE' | 'DECLARED';

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
  allergiesDeclarationState: HealthDeclarationState | null;
  dietaryRequirementsDeclarationState: HealthDeclarationState | null;
  isComplete: boolean;
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
  stressFatigueLevel?: string | null;
  foodAllergies?: string[];
  foodIntoleranceNotes?: string | null;
  dietaryRequirements?: string[];
  therapyPreferences?: string[];
  therapyCode?: string;
  dislikedIngredients?: string | null;
  kitchenNotes?: string | null;
  allergiesDeclarationState?: HealthDeclarationState;
  dietaryRequirementsDeclarationState?: HealthDeclarationState;
}

export const getMyHealthProfile = (): Promise<HealthProfileApiSuccess> =>
  apiClient.get<HealthProfileApiSuccess>('/customers/me/health-profile');

export const updateMyHealthProfile = (
  body: UpdateHealthProfileBody
): Promise<HealthProfileApiSuccess> =>
  apiClient.put<HealthProfileApiSuccess>('/customers/me/health-profile', body);
