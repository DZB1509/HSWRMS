import { apiClient } from '../../../api/client/apiClient';
import { evaluatePermission } from './staffAccountsApi';

export type DelegationStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface DelegationViewDto {
  delegationId: number;
  managerUserId: number;
  managerName: string;
  grantedByAdminUserId: number;
  validFrom: string; // ISO Instant string e.g. "2026-10-19T08:00:00Z"
  validUntil: string; // ISO Instant string e.g. "2026-10-20T08:00:00Z"
  status: string; // "PENDING" | "ACTIVE" | "EXPIRED" | "REVOKED"
  permissions: string[]; // e.g. ["S50:U", "S50:V"]
  revokedAt?: string | null;
}

export interface DelegablePermissionViewDto {
  permissionId: number;
  module: string;
  action: string;
}

export interface ApiEnvelope<T> {
  timestamp?: string;
  success?: boolean;
  message?: string;
  data: T;
}

/**
 * Normalizes delegation status from backend.
 * Backend sends uppercase strings: "PENDING", "ACTIVE", "EXPIRED", "REVOKED".
 */
export function normalizeDelegationStatus(
  rawStatus: string | null | undefined
): DelegationStatus | 'UNKNOWN' {
  if (!rawStatus) return 'UNKNOWN';
  const upper = rawStatus.trim().toUpperCase();
  if (upper === 'PENDING') return 'PENDING';
  if (upper === 'ACTIVE') return 'ACTIVE';
  if (upper === 'EXPIRED') return 'EXPIRED';
  if (upper === 'REVOKED') return 'REVOKED';
  return 'UNKNOWN';
}

/**
 * Validates whether an object is a valid DelegationViewDto matching backend contract.
 */
export function validateDelegationView(obj: any): obj is DelegationViewDto {
  if (!obj || typeof obj !== 'object') return false;
  return (
    typeof obj.delegationId === 'number' &&
    typeof obj.managerUserId === 'number' &&
    typeof obj.managerName === 'string' &&
    typeof obj.validFrom === 'string' &&
    typeof obj.validUntil === 'string' &&
    typeof obj.status === 'string' &&
    Array.isArray(obj.permissions)
  );
}

/**
 * Formats ISO Instant string into human-readable date-time representation.
 */
export function formatDelegationTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Authorization validation for delegations (S52).
 * Fail-closed:
 * - canView: Requires 'S52:V'
 * - canCreate: Requires 'S52:C'
 * - canRevoke: Requires 'S52:D'
 */
export function validateDelegationAuthorization(
  user: { role?: string; permissions?: string[] } | null | undefined
): { canView: boolean; canCreate: boolean; canRevoke: boolean } {
  if (!user) {
    return { canView: false, canCreate: false, canRevoke: false };
  }
  return {
    canView: evaluatePermission(user, 'S52:V'),
    canCreate: evaluatePermission(user, 'S52:C'),
    canRevoke: evaluatePermission(user, 'S52:D'),
  };
}

/**
 * Delegation API client backed by the M6 S52 controller.
 * The backend validates active Manager, permission delegability, date range, and audit records.
 */
export const delegationApi = {
  /**
   * Fetches the authoritative list of resort delegations from backend.
   * Requires S52:V permission.
   */
  list: async (): Promise<DelegationViewDto[]> => {
    const res = await apiClient.get<ApiEnvelope<DelegationViewDto[]>>('/admin/delegations');
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Fetches the list of delegable permissions from backend.
   * Requires S52:V permission.
   */
  listDelegablePermissions: async (): Promise<DelegablePermissionViewDto[]> => {
    const res = await apiClient.get<ApiEnvelope<DelegablePermissionViewDto[]>>(
      '/admin/delegations/delegable-permissions'
    );
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Creates a time-limited scoped delegation to an active Manager.
   * Requires S52:C permission.
   */
  create: async (body: {
    managerUserId: number;
    permissionIds: number[];
    validFrom: string;
    validUntil: string;
  }): Promise<DelegationViewDto> => {
    const res = await apiClient.post<ApiEnvelope<DelegationViewDto>>('/admin/delegations', body);
    if (res?.data && validateDelegationView(res.data)) {
      return res.data;
    }
    throw new Error('The server returned an invalid delegation response.');
  },

  /**
   * Revokes an active or pending delegation immediately.
   * Requires S52:D permission.
   */
  revoke: async (delegationId: number): Promise<DelegationViewDto> => {
    const res = await apiClient.post<ApiEnvelope<DelegationViewDto>>(
      `/admin/delegations/${delegationId}/revoke`
    );
    if (res?.data && validateDelegationView(res.data)) {
      return res.data;
    }
    throw new Error('The server returned an invalid delegation response.');
  },
};
