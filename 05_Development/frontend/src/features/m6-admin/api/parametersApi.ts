import { apiClient } from '../../../api/client/apiClient';
import { evaluatePermission } from './staffAccountsApi';

export interface ParameterViewDto {
  key: string;
  value: string;
  valueType: string; // 'INT' | 'DECIMAL'
  minValue?: number | null;
  maxValue?: number | null;
  unit?: string | null;
  description?: string | null;
  managerEditable: boolean;
  status?: string | null;
  updatedAt?: string | null;
}

export interface ApiEnvelope<T> {
  timestamp?: string;
  success?: boolean;
  message?: string;
  data: T;
}

export interface ParameterUpdateDto {
  value: string;
}

export interface ParameterValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates parameter value against backend rules before submission.
 */
export function validateParameterValue(
  param: Pick<ParameterViewDto, 'valueType' | 'minValue' | 'maxValue'>,
  raw: string | number | null | undefined
): ParameterValidationResult {
  const str = raw === undefined || raw === null ? '' : String(raw).trim();
  if (!str) {
    return { isValid: false, error: 'Giá trị tham số là bắt buộc.' };
  }

  const num = Number(str);
  if (isNaN(num)) {
    return { isValid: false, error: 'Giá trị phải là định dạng số hợp lệ.' };
  }

  if (param.valueType === 'INT') {
    if (!Number.isInteger(num) || str.includes('.')) {
      return { isValid: false, error: 'Tham số yêu cầu số nguyên (INT).' };
    }
  }

  if (param.minValue !== undefined && param.minValue !== null && num < param.minValue) {
    return {
      isValid: false,
      error: `Giá trị nhỏ hơn ngưỡng tối thiểu cho phép (${param.minValue}).`,
    };
  }

  if (param.maxValue !== undefined && param.maxValue !== null && num > param.maxValue) {
    return {
      isValid: false,
      error: `Giá trị vượt quá ngưỡng tối đa cho phép (${param.maxValue}).`,
    };
  }

  return { isValid: true };
}

/**
 * Authorization check for editing a specific parameter:
 * - User must have 'S50:U' permission.
 * - If user is not 'admin', parameter must have managerEditable === true.
 */
export function canEditParameter(
  param: Pick<ParameterViewDto, 'managerEditable'>,
  user: { role?: string; permissions?: string[] } | null | undefined
): boolean {
  if (!user) return false;
  const hasUpdatePerm = evaluatePermission(user, 'S50:U');
  if (!hasUpdatePerm) return false;

  // Admin with verified S50:U can edit all parameters
  if (user.role === 'admin') return true;

  // Manager or other delegated roles can ONLY edit if managerEditable is true
  return Boolean(param.managerEditable);
}

export const parametersApi = {
  list: async (): Promise<ParameterViewDto[]> => {
    const res = await apiClient.get<ApiEnvelope<ParameterViewDto[]>>('/admin/parameters');
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  update: async (key: string, value: string): Promise<ParameterViewDto> => {
    const encodedKey = encodeURIComponent(key);
    const res = await apiClient.put<ApiEnvelope<ParameterViewDto>>(
      `/admin/parameters/${encodedKey}`,
      { value }
    );
    return res.data;
  },
};
