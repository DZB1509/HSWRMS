import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDelegationStatus,
  validateDelegationView,
  formatDelegationTime,
  validateDelegationAuthorization,
  delegationApi,
  type DelegationViewDto,
} from './delegationApi.ts';
import { AppApiError } from '../../../api/errors/apiError.ts';

describe('M6 Delegation API & Read-Only Contract Verification', () => {
  describe('normalizeDelegationStatus mapping', () => {
    it('maps canonical uppercase backend statuses', () => {
      assert.strictEqual(normalizeDelegationStatus('ACTIVE'), 'ACTIVE');
      assert.strictEqual(normalizeDelegationStatus('PENDING'), 'PENDING');
      assert.strictEqual(normalizeDelegationStatus('EXPIRED'), 'EXPIRED');
      assert.strictEqual(normalizeDelegationStatus('REVOKED'), 'REVOKED');
    });

    it('normalizes lowercase or whitespace-padded statuses gracefully', () => {
      assert.strictEqual(normalizeDelegationStatus('  active '), 'ACTIVE');
      assert.strictEqual(normalizeDelegationStatus('pending'), 'PENDING');
      assert.strictEqual(normalizeDelegationStatus('expired'), 'EXPIRED');
      assert.strictEqual(normalizeDelegationStatus('revoked'), 'REVOKED');
    });

    it('returns UNKNOWN for unrecognized or missing status strings', () => {
      assert.strictEqual(normalizeDelegationStatus(''), 'UNKNOWN');
      assert.strictEqual(normalizeDelegationStatus(null), 'UNKNOWN');
      assert.strictEqual(normalizeDelegationStatus(undefined), 'UNKNOWN');
      assert.strictEqual(normalizeDelegationStatus('DELETED'), 'UNKNOWN');
      assert.strictEqual(normalizeDelegationStatus('SUSPENDED'), 'UNKNOWN');
    });
  });

  describe('validateDelegationView DTO contract guard', () => {
    it('validates a complete, conforming backend DelegationView DTO', () => {
      const validDto: DelegationViewDto = {
        delegationId: 101,
        managerUserId: 2,
        managerName: 'Sarah Jenkins',
        grantedByAdminUserId: 1,
        validFrom: '2026-10-19T08:00:00Z',
        validUntil: '2026-10-20T08:00:00Z',
        status: 'ACTIVE',
        permissions: ['S50:U', 'S50:V'],
        revokedAt: null,
      };

      assert.strictEqual(validateDelegationView(validDto), true);
    });

    it('rejects malformed or incomplete DTOs', () => {
      // Missing delegationId
      assert.strictEqual(validateDelegationView({ managerUserId: 2 }), false);
      // Null or non-object
      assert.strictEqual(validateDelegationView(null), false);
      assert.strictEqual(validateDelegationView(undefined), false);
      assert.strictEqual(validateDelegationView('string'), false);
      // Non-array permissions
      assert.strictEqual(
        validateDelegationView({
          delegationId: 102,
          managerUserId: 2,
          managerName: 'Sarah',
          validFrom: '2026-10-19T08:00:00Z',
          validUntil: '2026-10-20T08:00:00Z',
          status: 'ACTIVE',
          permissions: 'S50:U',
        }),
        false
      );
    });
  });

  describe('formatDelegationTime representation', () => {
    it('formats ISO Instant string correctly', () => {
      const formatted = formatDelegationTime('2026-10-19T08:00:00Z');
      assert.match(formatted, /2026/);
    });

    it('returns fallback dash for null/undefined', () => {
      assert.strictEqual(formatDelegationTime(null), '—');
      assert.strictEqual(formatDelegationTime(undefined), '—');
      assert.strictEqual(formatDelegationTime(''), '—');
    });

    it('returns raw string for unparseable dates without throwing', () => {
      assert.strictEqual(formatDelegationTime('invalid-date'), 'invalid-date');
    });
  });

  describe('validateDelegationAuthorization Fail-Closed Checks', () => {
    it('grants view to user with verified S52:V permission', () => {
      const admin = {
        role: 'admin',
        permissions: ['S52:V', 'S52:C', 'S52:D'],
      };
      assert.deepStrictEqual(validateDelegationAuthorization(admin), { canView: true });
    });

    it('denies view to user with missing S52:V (fail-closed)', () => {
      const adminUnverified = {
        role: 'admin',
        permissions: ['S50:V'], // Missing S52:V
      };
      assert.deepStrictEqual(validateDelegationAuthorization(adminUnverified), { canView: false });

      const adminEmpty = {
        role: 'admin',
        permissions: [],
      };
      assert.deepStrictEqual(validateDelegationAuthorization(adminEmpty), { canView: false });
    });

    it('denies view to MANAGER role (S52 is admin-only, non-delegable)', () => {
      const manager = {
        role: 'manager',
        permissions: ['S46:V', 'S47:V', 'S50:V', 'S55:V'],
      };
      assert.deepStrictEqual(validateDelegationAuthorization(manager), { canView: false });
    });

    it('fails closed for null or undefined user', () => {
      assert.deepStrictEqual(validateDelegationAuthorization(null), { canView: false });
      assert.deepStrictEqual(validateDelegationAuthorization(undefined), { canView: false });
    });
  });

  describe('delegationApi read-only HTTP methods & absence of mutations', () => {
    it('verifies delegationApi exposes ONLY read methods (list, listDelegablePermissions)', () => {
      const keys = Object.keys(delegationApi);
      assert.deepStrictEqual(keys.sort(), ['list', 'listDelegablePermissions']);
      // Explicitly verifies NO create, update, delete, or revoke methods exist on delegationApi
      assert.strictEqual('create' in delegationApi, false);
      assert.strictEqual('revoke' in delegationApi, false);
      assert.strictEqual('delete' in delegationApi, false);
      assert.strictEqual('update' in delegationApi, false);
    });

    it('fetches delegation list from GET /admin/delegations', async () => {
      const originalFetch = globalThis.fetch;
      let requestedUrl = '';
      let requestedMethod = '';

      globalThis.fetch = async (url: any, init: any) => {
        requestedUrl = String(url);
        requestedMethod = init?.method;

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: [
              {
                delegationId: 1,
                managerUserId: 2,
                managerName: 'Sarah Jenkins',
                grantedByAdminUserId: 1,
                validFrom: '2026-10-19T00:00:00Z',
                validUntil: '2026-10-21T00:00:00Z',
                status: 'ACTIVE',
                permissions: ['S50:V', 'S50:U'],
                revokedAt: null,
              },
            ],
          }),
        } as any;
      };

      try {
        const list = await delegationApi.list();
        assert.match(requestedUrl, /\/admin\/delegations$/);
        assert.strictEqual(requestedMethod, 'GET');
        assert.strictEqual(list.length, 1);
        assert.strictEqual(list[0].delegationId, 1);
        assert.strictEqual(list[0].managerName, 'Sarah Jenkins');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('fetches delegable permissions from GET /admin/delegations/delegable-permissions', async () => {
      const originalFetch = globalThis.fetch;
      let requestedUrl = '';
      let requestedMethod = '';

      globalThis.fetch = async (url: any, init: any) => {
        requestedUrl = String(url);
        requestedMethod = init?.method;

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: [
              { permissionId: 10, module: 'S50', action: 'V' },
              { permissionId: 11, module: 'S50', action: 'U' },
            ],
          }),
        } as any;
      };

      try {
        const delegables = await delegationApi.listDelegablePermissions();
        assert.match(requestedUrl, /\/admin\/delegations\/delegable-permissions$/);
        assert.strictEqual(requestedMethod, 'GET');
        assert.strictEqual(delegables.length, 2);
        assert.strictEqual(delegables[0].module, 'S50');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('properly fails when backend returns 401 Unauthorized', async () => {
      const originalFetch = globalThis.fetch;

      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            timestamp: '2026-10-19T10:00:00Z',
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Authentication required to access delegations',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await delegationApi.list();
          },
          (err: any) => {
            assert.strictEqual(err instanceof AppApiError, true);
            assert.strictEqual(err.status, 401);
            return true;
          }
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('properly fails when backend returns 403 Forbidden (missing S52:V)', async () => {
      const originalFetch = globalThis.fetch;

      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            timestamp: '2026-10-19T10:00:00Z',
            status: 403,
            code: 'ACCESS_DENIED',
            message: 'Access Denied: Missing S52:V permission',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await delegationApi.list();
          },
          (err: any) => {
            assert.strictEqual(err instanceof AppApiError, true);
            assert.strictEqual(err.status, 403);
            return true;
          }
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
