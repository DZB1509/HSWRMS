import { apiClient } from '../../../api/client/apiClient';

export interface ApiEnvelope<T> {
  timestamp?: string;
  success?: boolean;
  code?: string;
  message?: string;
  data: T;
}

/**
 * Backend Audit Record View DTO matching com.heavenstay.hswrms.m6admin.dto.AdminDtos.AuditView
 */
export interface AuditViewDto {
  auditLogId: number;
  createdAt: string; // ISO Instant from backend (e.g. 2026-10-19T09:28:14.974270100Z)
  actorUserId: number | null;
  actorRole: string | null;
  action: string;
  targetDataType: string | null;
  targetRefId: string | null;
  accessStatus: 'SUCCESS' | 'DENIED' | string;
  oldValue: string | null;
  newValue: string | null;
  delegationId: number | null;
}

/**
 * Page wrapper matching com.heavenstay.hswrms.m6admin.dto.AdminDtos.PageView<T>
 */
export interface PageViewDto<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Filter parameters supported by GET /api/v1/admin/audit-logs
 */
export interface AuditFilterParams {
  from?: string; // ISO date-time string (e.g. 2026-10-19T00:00:00)
  to?: string;   // ISO date-time string (e.g. 2026-10-19T23:59:59)
  actorUserId?: number;
  role?: string;
  action?: string;
  dataType?: string;
  status?: string;
  page?: number; // 0-indexed
  size?: number; // default 20, max 100
}

/**
 * Normalizes backend accessStatus string canonically.
 */
export function normalizeAuditStatus(status?: string | null): 'SUCCESS' | 'DENIED' | 'UNKNOWN' {
  if (!status) return 'UNKNOWN';
  const clean = status.trim().toUpperCase();
  if (clean === 'SUCCESS') return 'SUCCESS';
  if (clean === 'DENIED') return 'DENIED';
  return 'UNKNOWN';
}

/**
 * Formats ISO Instant timestamp into user-friendly localized format.
 */
export function formatAuditTimestamp(isoString?: string | null): string {
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
      second: '2-digit',
      hour12: false
    });
  } catch {
    return isoString;
  }
}

/**
 * Client-side validation of audit date range to prevent backend M6-MSG-08 error.
 */
export function validateAuditDateRange(from?: string | null, to?: string | null): { valid: boolean; error?: string } {
  if (!from || !to) return { valid: true };
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  if (isNaN(fromTime) || isNaN(toTime)) {
    return { valid: false, error: 'Định dạng ngày không hợp lệ.' };
  }
  if (fromTime > toTime) {
    return { valid: false, error: 'Khoảng thời gian không hợp lệ. Ngày bắt đầu phải trước ngày kết thúc (M6-MSG-08).' };
  }
  return { valid: true };
}

/**
 * Runtime contract guard verifying an object conforms to AuditViewDto.
 */
export function validateAuditView(data: unknown): data is AuditViewDto {
  if (!data || typeof data !== 'object') return false;
  const item = data as Record<string, unknown>;
  return (
    typeof item.auditLogId === 'number' &&
    typeof item.createdAt === 'string' &&
    typeof item.action === 'string' &&
    typeof item.accessStatus === 'string'
  );
}

/**
 * Fail-closed authorization evaluator for viewing sensitive audit logs.
 * Required permission: S53:V (Sensitive Audit Log View).
 * S53:V is admin-only by default but is DELEGABLE to MANAGER.
 */
export function validateAuditAuthorization(user: { roles?: string[]; permissions?: string[] } | null | undefined): {
  canView: boolean;
  canExport: boolean;
  isManagerDelegated: boolean;
} {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return { canView: false, canExport: false, isManagerDelegated: false };
  }

  const hasViewPerm = user.permissions.includes('S53:V');
  const hasExportPerm = user.permissions.includes('S53:E');
  const isManager = (user.roles || []).some((r) => r.toLowerCase() === 'manager');
  const isAdmin = (user.roles || []).some((r) => r.toLowerCase() === 'admin');

  const isManagerDelegated = isManager && hasViewPerm;
  const canView = (isAdmin || isManager) && hasViewPerm;
  const canExport = isAdmin && hasExportPerm; // Export is never delegable

  return { canView, canExport, isManagerDelegated };
}

/**
 * Read-only Audit Log API Client.
 * STRICTLY READ-ONLY: NO audit mutation, purge or modification endpoints exist.
 * CSV export is explicitly deferred in Phase 5.5.
 */
export const auditLogApi = {
  /**
   * Fetches paginated audit logs from GET /api/v1/admin/audit-logs
   */
  async list(params?: AuditFilterParams): Promise<PageViewDto<AuditViewDto>> {
    // Validate date range if provided
    if (params?.from && params?.to) {
      const validation = validateAuditDateRange(params.from, params.to);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    const queryParams: Record<string, string | number> = {};
    if (params?.from) queryParams.from = params.from;
    if (params?.to) queryParams.to = params.to;
    if (params?.actorUserId !== undefined) queryParams.actorUserId = params.actorUserId;
    if (params?.role?.trim()) queryParams.role = params.role.trim();
    if (params?.action?.trim()) queryParams.action = params.action.trim();
    if (params?.dataType?.trim()) queryParams.dataType = params.dataType.trim();
    if (params?.status?.trim() && params.status !== 'all') queryParams.status = params.status.trim();
    if (params?.page !== undefined) queryParams.page = Math.max(params.page, 0);
    if (params?.size !== undefined) queryParams.size = Math.min(Math.max(params.size, 1), 100);

    const response = await apiClient.get<ApiEnvelope<PageViewDto<AuditViewDto>>>('/admin/audit-logs', {
      params: queryParams
    });

    const pageData = response?.data;
    if (!pageData || !Array.isArray(pageData.items)) {
      throw new Error('Định dạng phản hồi nhật ký kiểm toán không hợp lệ từ máy chủ.');
    }

    return pageData;
  },

  /**
   * Fetches a single audit log detail from GET /api/v1/admin/audit-logs/{id}
   */
  async getById(id: number): Promise<AuditViewDto> {
    if (!id || id <= 0) {
      throw new Error('ID bản ghi nhật ký kiểm toán không hợp lệ.');
    }

    const response = await apiClient.get<ApiEnvelope<AuditViewDto>>(`/admin/audit-logs/${id}`);
    const record = response?.data;
    if (!record || !validateAuditView(record)) {
      throw new Error('Không thể tải chi tiết bản ghi nhật ký kiểm toán hoặc dữ liệu bị lỗi.');
    }

    return record;
  }
};
