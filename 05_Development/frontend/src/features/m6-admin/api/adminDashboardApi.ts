import { staffAccountsApi } from './staffAccountsApi';
import type { StaffAccount } from '../../../types/staff';
import { parametersApi, type ParameterViewDto } from './parametersApi';
import { delegationApi, type DelegationViewDto } from './delegationApi';
import { auditLogApi, type AuditViewDto, type PageViewDto } from './auditLogApi';

/**
 * Metric status indicating whether a dashboard value was loaded from live API,
 * failed to load, or is structurally unavailable in the backend.
 */
export type MetricStatus = 'loaded' | 'error' | 'unavailable';

export interface DashboardMetric<T> {
  value: T | null;
  status: MetricStatus;
  error?: string;
  sourceEndpoint?: string;
}

export interface AdminDashboardData {
  // Live KPI metrics from verified backend endpoints
  businessParameters: DashboardMetric<{ count: number }>;
  managerDelegations: DashboardMetric<{ activeCount: number; totalCount: number }>;
  auditActivity: DashboardMetric<{
    totalRecords: number;
    totalEvents?: number;
    recentEvents: AuditViewDto[];
  }>;
  staffAccounts: DashboardMetric<{ activeCount: number; totalCount: number }>;

  // Explicitly deferred / unavailable backend metrics
  featureFlags: DashboardMetric<{ enabledCount: number; totalCount: number }>;
  systemOverviewWidgets: DashboardMetric<unknown>;
}

/**
 * Optional test seam loaders for verifying HTTP errors (401, 403, timeout, malformed)
 * without mocking global modules or adding heavy HTTP-interception dependencies.
 */
export interface DashboardLoaders {
  loadParameters?: () => Promise<ParameterViewDto[]>;
  loadDelegations?: () => Promise<DelegationViewDto[]>;
  loadAuditLogs?: (params: { page: number; size: number }) => Promise<PageViewDto<AuditViewDto>>;
  loadStaffAccounts?: () => Promise<StaffAccount[]>;
}

/**
 * Validates whether the user has required Admin permissions to view the Dashboard Cockpit.
 * Fail-closed: Denies if user or roles are null/undefined.
 */
export function validateDashboardAuthorization(user: { roles?: string[]; permissions?: string[] } | null | undefined): {
  canView: boolean;
  isAdmin: boolean;
} {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return { canView: false, isAdmin: false };
  }
  const isAdmin = user.roles.some((r) => r.toLowerCase() === 'admin');
  return { canView: isAdmin, isAdmin };
}

/**
 * Aggregated read-only API client for the Admin Dashboard Cockpit.
 * Aggregates real metrics using Promise.allSettled to ensure that
 * a failure or 403 in one domain does NOT break other valid metrics.
 * 
 * STRICTLY READ-ONLY: NO mutation or export endpoints.
 * NO automatic background polling (avoids flooding backend audit log).
 */
export const adminDashboardApi = {
  /**
   * Fetches all verified live metrics from backend endpoints.
   */
  async getDashboardSummary(loaders?: DashboardLoaders): Promise<AdminDashboardData> {
    const fetchParams = loaders?.loadParameters ?? (() => parametersApi.list());
    const fetchDelegations = loaders?.loadDelegations ?? (() => delegationApi.list());
    const fetchAuditLogs = loaders?.loadAuditLogs ?? (() => auditLogApi.list({ page: 0, size: 5 }));
    const fetchStaff = loaders?.loadStaffAccounts ?? (() => staffAccountsApi.list());

    const [paramsResult, delegationsResult, auditResult, staffResult] = await Promise.allSettled([
      fetchParams(),
      fetchDelegations(),
      fetchAuditLogs({ page: 0, size: 5 }),
      fetchStaff()
    ]);

    // 1. Business Parameters (GET /api/v1/admin/parameters)
    let businessParameters: DashboardMetric<{ count: number }>;
    if (paramsResult.status === 'fulfilled') {
      if (Array.isArray(paramsResult.value)) {
        businessParameters = {
          value: { count: paramsResult.value.length },
          status: 'loaded',
          sourceEndpoint: 'GET /api/v1/admin/parameters'
        };
      } else {
        businessParameters = {
          value: null,
          status: 'error',
          error: 'Phản hồi tham số nghiệp vụ sai cấu trúc (không phải mảng)',
          sourceEndpoint: 'GET /api/v1/admin/parameters'
        };
      }
    } else {
      businessParameters = {
        value: null,
        status: 'error',
        error: paramsResult.reason instanceof Error ? paramsResult.reason.message : 'Không thể tải tham số',
        sourceEndpoint: 'GET /api/v1/admin/parameters'
      };
    }

    // 2. Manager Delegations (GET /api/v1/admin/delegations)
    let managerDelegations: DashboardMetric<{ activeCount: number; totalCount: number }>;
    if (delegationsResult.status === 'fulfilled') {
      if (Array.isArray(delegationsResult.value)) {
        const activeCount = delegationsResult.value.filter(
          (d) => d && typeof d.status === 'string' && d.status.toUpperCase() === 'ACTIVE'
        ).length;
        managerDelegations = {
          value: {
            activeCount,
            totalCount: delegationsResult.value.length
          },
          status: 'loaded',
          sourceEndpoint: 'GET /api/v1/admin/delegations'
        };
      } else {
        managerDelegations = {
          value: null,
          status: 'error',
          error: 'Phản hồi ủy quyền quản lý sai cấu trúc (không phải mảng)',
          sourceEndpoint: 'GET /api/v1/admin/delegations'
        };
      }
    } else {
      managerDelegations = {
        value: null,
        status: 'error',
        error: delegationsResult.reason instanceof Error ? delegationsResult.reason.message : 'Không thể tải ủy quyền',
        sourceEndpoint: 'GET /api/v1/admin/delegations'
      };
    }

    // 3. Sensitive Audit Records (GET /api/v1/admin/audit-logs?page=0&size=5)
    // Note: totalElements from Spring Page represents total historical audit records in database,
    // NOT events in a specific timeframe (e.g. 24h).
    let auditActivity: DashboardMetric<{ totalRecords: number; totalEvents: number; recentEvents: AuditViewDto[] }>;
    if (auditResult.status === 'fulfilled') {
      const val = auditResult.value;
      if (val && typeof val === 'object' && typeof val.totalElements === 'number' && !isNaN(val.totalElements) && Array.isArray(val.items)) {
        auditActivity = {
          value: {
            totalRecords: val.totalElements,
            totalEvents: val.totalElements,
            recentEvents: val.items
          },
          status: 'loaded',
          sourceEndpoint: 'GET /api/v1/admin/audit-logs'
        };
      } else {
        auditActivity = {
          value: null,
          status: 'error',
          error: 'Phản hồi nhật ký kiểm toán thiếu trường bắt buộc hoặc sai cấu trúc',
          sourceEndpoint: 'GET /api/v1/admin/audit-logs'
        };
      }
    } else {
      auditActivity = {
        value: null,
        status: 'error',
        error: auditResult.reason instanceof Error ? auditResult.reason.message : 'Không thể tải nhật ký kiểm toán',
        sourceEndpoint: 'GET /api/v1/admin/audit-logs'
      };
    }

    // 4. Staff Accounts (GET /api/v1/admin/staff)
    let staffAccounts: DashboardMetric<{ activeCount: number; totalCount: number }>;
    if (staffResult.status === 'fulfilled') {
      if (Array.isArray(staffResult.value)) {
        const activeCount = staffResult.value.filter(
          (s) => s && typeof s.status === 'string' && s.status.toUpperCase() === 'ACTIVE'
        ).length;
        staffAccounts = {
          value: {
            activeCount,
            totalCount: staffResult.value.length
          },
          status: 'loaded',
          sourceEndpoint: 'GET /api/v1/admin/staff'
        };
      } else {
        staffAccounts = {
          value: null,
          status: 'error',
          error: 'Phản hồi tài khoản nhân viên sai cấu trúc (không phải mảng)',
          sourceEndpoint: 'GET /api/v1/admin/staff'
        };
      }
    } else {
      staffAccounts = {
        value: null,
        status: 'error',
        error: staffResult.reason instanceof Error ? staffResult.reason.message : 'Không thể tải nhân viên',
        sourceEndpoint: 'GET /api/v1/admin/staff'
      };
    }

    // 5. Feature Flags: No backend endpoint exists (Prototype-only client state)
    const featureFlags: DashboardMetric<{ enabledCount: number; totalCount: number }> = {
      value: null,
      status: 'unavailable',
      error: 'Backend chưa hỗ trợ API Feature Flags (Prototype state)',
      sourceEndpoint: undefined
    };

    // 6. System Overview Widgets: Backend DashboardController not ported to current worktree
    const systemOverviewWidgets: DashboardMetric<unknown> = {
      value: null,
      status: 'unavailable',
      error: 'DashboardController (GET /api/v1/admin/dashboard) chưa được hợp nhất vào worktree',
      sourceEndpoint: 'GET /api/v1/admin/dashboard (Missing)'
    };

    return {
      businessParameters,
      managerDelegations,
      auditActivity,
      staffAccounts,
      featureFlags,
      systemOverviewWidgets
    };
  }
};

