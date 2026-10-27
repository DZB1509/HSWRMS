import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  adminDashboardApi,
  validateDashboardAuthorization
} from './adminDashboardApi';
import type { PageViewDto, AuditViewDto } from './auditLogApi';
import type { ParameterViewDto } from './parametersApi';
import type { DelegationViewDto } from './delegationApi';
import type { StaffAccount } from '../../../types/staff';

describe('M6 Admin Dashboard API & Partial Failure Resilience', () => {
  describe('validateDashboardAuthorization fail-closed checks', () => {
    it('grants view access to user with ADMIN role', () => {
      const user = { roles: ['admin'], permissions: ['S10:V', 'S50:V'] };
      const res = validateDashboardAuthorization(user);
      assert.equal(res.canView, true);
      assert.equal(res.isAdmin, true);
    });

    it('denies view access to user with only MANAGER role (cockpit is admin-only)', () => {
      const user = { roles: ['manager'], permissions: ['S50:V', 'S53:V'] };
      const res = validateDashboardAuthorization(user);
      assert.equal(res.canView, false);
      assert.equal(res.isAdmin, false);
    });

    it('denies view access to operational roles (Receptionist, Customer)', () => {
      const customer = { roles: ['customer'], permissions: ['S02:V'] };
      assert.equal(validateDashboardAuthorization(customer).canView, false);

      const receptionist = { roles: ['receptionist'], permissions: ['S20:V'] };
      assert.equal(validateDashboardAuthorization(receptionist).canView, false);
    });

    it('fails closed for null, undefined, or malformed user objects', () => {
      assert.deepEqual(validateDashboardAuthorization(null), { canView: false, isAdmin: false });
      assert.deepEqual(validateDashboardAuthorization(undefined), { canView: false, isAdmin: false });
      assert.deepEqual(validateDashboardAuthorization({}), { canView: false, isAdmin: false });
    });
  });

  describe('adminDashboardApi contract & absence of mutations', () => {
    it('verifies adminDashboardApi exposes ONLY read methods (getDashboardSummary)', () => {
      const methods = Object.keys(adminDashboardApi);
      assert.deepEqual(methods, ['getDashboardSummary']);
      // Absolutely no mutations
      assert.equal('create' in adminDashboardApi, false);
      assert.equal('update' in adminDashboardApi, false);
      assert.equal('delete' in adminDashboardApi, false);
      assert.equal('export' in adminDashboardApi, false);
    });

    it('guarantees unavailable metrics are explicitly marked unavailable rather than fabricated', async () => {
      const summary = await adminDashboardApi.getDashboardSummary({
        loadParameters: async () => [],
        loadDelegations: async () => [],
        loadAuditLogs: async () => ({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 5 }),
        loadStaffAccounts: async () => []
      });

      assert.equal(summary.featureFlags.status, 'unavailable');
      assert.equal(summary.systemOverviewWidgets.status, 'unavailable');
      assert.match(summary.featureFlags.error || '', /chưa hỗ trợ/i);
      assert.match(summary.systemOverviewWidgets.error || '', /chưa được hợp nhất/i);
    });
  });

  describe('HTTP error, network resilience and fail-closed zero-suppression tests', () => {
    it('handles HTTP 401 Unauthorized by setting metric to error and value to null (no fake 0)', async () => {
      const summary = await adminDashboardApi.getDashboardSummary({
        loadParameters: async () => {
          const err = new Error('HTTP 401 Unauthorized: Session token expired or invalid');
          throw err;
        },
        loadDelegations: async () => [],
        loadAuditLogs: async () => ({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 5 }),
        loadStaffAccounts: async () => []
      });

      // Crucial: Error must NOT be converted to 0
      assert.equal(summary.businessParameters.status, 'error');
      assert.equal(summary.businessParameters.value, null);
      assert.match(summary.businessParameters.error || '', /401/);

      // Other metrics load normally
      assert.equal(summary.managerDelegations.status, 'loaded');
      assert.equal(summary.auditActivity.status, 'loaded');
    });

    it('handles HTTP 403 Forbidden on Sensitive Audit Logs without crashing other widgets', async () => {
      const summary = await adminDashboardApi.getDashboardSummary({
        loadParameters: async () => [{ key: 'cutoff', value: '12', valueType: 'INT', managerEditable: true } as ParameterViewDto],
        loadDelegations: async () => [{ delegationId: 1, managerUserId: 2, managerName: 'Manager', grantedByAdminUserId: 1, validFrom: '2026-10-01T00:00:00Z', validUntil: '2026-10-31T23:59:59Z', status: 'ACTIVE', permissions: ['S50:U'] } as DelegationViewDto],
        loadAuditLogs: async () => {
          throw new Error('HTTP 403 Forbidden: Actor lacks S53:V permission to view audit trail');
        },
        loadStaffAccounts: async () => [{ id: '1', email: 'staff@hswrms.com', name: 'Staff 1', role: 'receptionist', status: 'active', department: 'Front Desk', title: 'Staff' } as StaffAccount]
      });

      // Audit widget is failed
      assert.equal(summary.auditActivity.status, 'error');
      assert.equal(summary.auditActivity.value, null);
      assert.match(summary.auditActivity.error || '', /403/);

      // Other 3 widgets are functional and retain their live counts
      assert.equal(summary.businessParameters.status, 'loaded');
      assert.equal(summary.businessParameters.value?.count, 1);

      assert.equal(summary.managerDelegations.status, 'loaded');
      assert.equal(summary.managerDelegations.value?.activeCount, 1);

      assert.equal(summary.staffAccounts.status, 'loaded');
      assert.equal(summary.staffAccounts.value?.activeCount, 1);
    });

    it('handles Network error / connection timeout gracefully', async () => {
      const summary = await adminDashboardApi.getDashboardSummary({
        loadParameters: async () => {
          throw new Error('Network Error: Connection Timed Out after 10000ms');
        },
        loadDelegations: async () => {
          throw new Error('Network Error: Failed to fetch (ECONNREFUSED)');
        },
        loadAuditLogs: async () => ({ items: [], totalElements: 120, totalPages: 24, page: 0, size: 5 }),
        loadStaffAccounts: async () => []
      });

      assert.equal(summary.businessParameters.status, 'error');
      assert.equal(summary.businessParameters.value, null);
      assert.match(summary.businessParameters.error || '', /Timed Out/);

      assert.equal(summary.managerDelegations.status, 'error');
      assert.equal(summary.managerDelegations.value, null);
      assert.match(summary.managerDelegations.error || '', /ECONNREFUSED/);

      // Audit logs still loaded correctly
      assert.equal(summary.auditActivity.status, 'loaded');
      assert.equal(summary.auditActivity.value?.totalRecords, 120);
    });

    it('correctly handles audit responses with missing optional fields (null/undefined details)', async () => {
      const sampleItemWithoutOptionals: AuditViewDto = {
        auditLogId: 99,
        createdAt: '2026-10-20T00:00:00Z',
        actorUserId: 1,
        actorRole: 'ADMIN',
        action: 'View Audit Log List',
        targetDataType: 'AuditLog',
        targetRefId: null, // optional
        accessStatus: 'SUCCESS',
        oldValue: null,    // optional
        newValue: null,    // optional
        delegationId: null // optional
      };

      const summary = await adminDashboardApi.getDashboardSummary({
        loadParameters: async () => [],
        loadDelegations: async () => [],
        loadAuditLogs: async () => ({
          items: [sampleItemWithoutOptionals],
          totalElements: 531,
          totalPages: 107,
          page: 0,
          size: 5
        }),
        loadStaffAccounts: async () => []
      });

      assert.equal(summary.auditActivity.status, 'loaded');
      assert.equal(summary.auditActivity.value?.totalRecords, 531);
      assert.equal(summary.auditActivity.value?.totalEvents, 531);
      assert.equal(summary.auditActivity.value?.recentEvents.length, 1);
      assert.equal(summary.auditActivity.value?.recentEvents[0].targetRefId, null);
      assert.equal(summary.auditActivity.value?.recentEvents[0].oldValue, null);
    });

    it('handles malformed responses (non-array parameters or staff) without crashing', async () => {
      const summary = await adminDashboardApi.getDashboardSummary({
        // Backend returned unexpected object { error: "bad" } instead of array
        loadParameters: async () => ({ error: 'malformed' } as unknown as ParameterViewDto[]),
        loadDelegations: async () => [
          // Items with missing or malformed status
          { delegationId: 1, status: null } as unknown as DelegationViewDto,
          { delegationId: 2, status: 'ACTIVE' } as DelegationViewDto
        ],
        loadAuditLogs: async () => ({
          // Missing totalElements or items not array
          items: 'not-an-array' as unknown as AuditViewDto[],
          totalElements: NaN,
          totalPages: 0,
          page: 0,
          size: 5
        } as unknown as PageViewDto<AuditViewDto>),
        loadStaffAccounts: async () => 'unexpected string payload' as unknown as StaffAccount[]
      });

      // Malformed parameters -> error, value is null (fail-closed, not 0)
      assert.equal(summary.businessParameters.status, 'error');
      assert.equal(summary.businessParameters.value, null);
      assert.match(summary.businessParameters.error || '', /sai cấu trúc/);

      // Delegations filtered safely without throw
      assert.equal(summary.managerDelegations.status, 'loaded');
      assert.equal(summary.managerDelegations.value?.activeCount, 1);
      assert.equal(summary.managerDelegations.value?.totalCount, 2);

      // Malformed audit -> error, value is null
      assert.equal(summary.auditActivity.status, 'error');
      assert.equal(summary.auditActivity.value, null);
      assert.match(summary.auditActivity.error || '', /thiếu trường bắt buộc hoặc sai cấu trúc/);

      // Malformed staff -> error, value is null
      assert.equal(summary.staffAccounts.status, 'error');
      assert.equal(summary.staffAccounts.value, null);
      assert.match(summary.staffAccounts.error || '', /sai cấu trúc/);
    });

    it('verifies that total historical audit records reflects backend totalElements accurately', async () => {
      const summary = await adminDashboardApi.getDashboardSummary({
        loadParameters: async () => [],
        loadDelegations: async () => [],
        loadAuditLogs: async () => ({
          items: [],
          totalElements: 1250, // Historical total in database
          totalPages: 250,
          page: 0,
          size: 5
        }),
        loadStaffAccounts: async () => []
      });

      assert.equal(summary.auditActivity.status, 'loaded');
      assert.equal(summary.auditActivity.value?.totalRecords, 1250);
      assert.equal(summary.auditActivity.value?.totalEvents, 1250);
      assert.equal(summary.auditActivity.sourceEndpoint, 'GET /api/v1/admin/audit-logs');
    });
  });
});


