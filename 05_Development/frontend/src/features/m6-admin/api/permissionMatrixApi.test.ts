import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isCellLocked,
  getLockReason,
  validateMatrixAuthorization,
  computePendingChanges,
  permissionMatrixApi,
  type MatrixRowDto,
  type MatrixViewDto,
  type MatrixChangeDto,
} from './permissionMatrixApi.ts';
import { AppApiError } from '../../../api/errors/apiError.ts';

describe('M6 Permission Matrix API, Preview & RBAC Boundaries', () => {
  describe('isCellLocked & Boundary Invariants', () => {
    const adminLockedRow: MatrixRowDto = {
      permissionId: 1,
      module: 'S10',
      action: 'V',
      delegable: false,
      adminOnly: true,
      grants: { ADMIN: true, MANAGER: false, RECEPTIONIST: false },
      lockedRoles: ['ADMIN'],
    };

    const adminOnlyParamRow: MatrixRowDto = {
      permissionId: 5,
      module: 'S50',
      action: 'U',
      delegable: true,
      adminOnly: true,
      grants: { ADMIN: true, MANAGER: false },
      lockedRoles: ['ADMIN'],
    };

    const sensitiveDataRow: MatrixRowDto = {
      permissionId: 20,
      module: 'DATA_HEALTH_FULL',
      action: 'V',
      delegable: false,
      adminOnly: false,
      grants: { CUSTOMER: true, ADMIN: false, THERAPIST: false },
      lockedRoles: [],
    };

    const delegableRow: MatrixRowDto = {
      permissionId: 30,
      module: 'S46',
      action: 'V',
      delegable: false,
      adminOnly: false,
      grants: { ADMIN: true, MANAGER: true, RECEPTIONIST: false },
      lockedRoles: [],
    };

    it('enforces Admin lock invariant (Admin cannot lose S10-S12, S49-S53)', () => {
      assert.strictEqual(isCellLocked(adminLockedRow, 'ADMIN'), true);
      assert.strictEqual(isCellLocked(adminLockedRow, 'admin'), true);
      assert.match(getLockReason(adminLockedRow, 'ADMIN') || '', /Ranh giới bảo mật bất biến/);
    });

    it('locks Admin-only permissions from being granted to non-admin roles', () => {
      // Manager cannot be granted admin-only permission directly in the matrix
      assert.strictEqual(isCellLocked(adminOnlyParamRow, 'MANAGER'), true);
      assert.strictEqual(isCellLocked(adminOnlyParamRow, 'RECEPTIONIST'), true);
      assert.match(getLockReason(adminOnlyParamRow, 'MANAGER') || '', /Admin-Only/);
    });

    it('identifies sensitive data minimization boundaries', () => {
      const reason = getLockReason(sensitiveDataRow, 'ADMIN');
      assert.match(reason || '', /Nghị định 13\/2023/);
    });

    it('allows editing non-locked, non-admin-only roles for operational screens', () => {
      assert.strictEqual(isCellLocked(delegableRow, 'RECEPTIONIST'), false);
      assert.strictEqual(isCellLocked(delegableRow, 'THERAPIST'), false);
    });
  });

  describe('validateMatrixAuthorization Fail-Closed Checks', () => {
    it('grants view and preview to ADMIN with S51:V and S51:G', () => {
      const admin = {
        role: 'admin',
        permissions: ['S51:V', 'S51:G', 'S10:V'],
      };
      const auth = validateMatrixAuthorization(admin);
      assert.strictEqual(auth.canView, true);
      assert.strictEqual(auth.canPreview, true);
    });

    it('grants view only if S51:G is missing', () => {
      const adminReadOnly = {
        role: 'admin',
        permissions: ['S51:V'],
      };
      const auth = validateMatrixAuthorization(adminReadOnly);
      assert.strictEqual(auth.canView, true);
      assert.strictEqual(auth.canPreview, false);
    });

    it('denies both view and preview to ADMIN with unverified permissions (fail-closed)', () => {
      const unverifiedAdmin = {
        role: 'admin',
        permissions: [],
      };
      const auth = validateMatrixAuthorization(unverifiedAdmin);
      assert.strictEqual(auth.canView, false);
      assert.strictEqual(auth.canPreview, false);
    });

    it('denies both view and preview to MANAGER without S51 permissions (non-delegable)', () => {
      const manager = {
        role: 'manager',
        permissions: ['S46:V', 'S47:V', 'S54:V', 'S55:V'],
      };
      const auth = validateMatrixAuthorization(manager);
      assert.strictEqual(auth.canView, false);
      assert.strictEqual(auth.canPreview, false);
    });

    it('fails closed for null or undefined user', () => {
      assert.deepStrictEqual(validateMatrixAuthorization(null), { canView: false, canPreview: false });
      assert.deepStrictEqual(validateMatrixAuthorization(undefined), { canView: false, canPreview: false });
    });
  });

  describe('computePendingChanges diff calculator', () => {
    const originalRows: MatrixRowDto[] = [
      {
        permissionId: 1,
        module: 'S46',
        action: 'V',
        delegable: false,
        adminOnly: false,
        grants: { ADMIN: true, MANAGER: true, RECEPTIONIST: false },
        lockedRoles: [],
      },
      {
        permissionId: 2,
        module: 'S47',
        action: 'E',
        delegable: false,
        adminOnly: false,
        grants: { ADMIN: false, MANAGER: true, RECEPTIONIST: false },
        lockedRoles: [],
      },
    ];

    it('generates empty array when draft grants match original rows', () => {
      const draftGrants = {
        'S46:V': { ADMIN: true, MANAGER: true, RECEPTIONIST: false },
        'S47:E': { ADMIN: false, MANAGER: true, RECEPTIONIST: false },
      };
      const changes = computePendingChanges(originalRows, draftGrants);
      assert.strictEqual(changes.length, 0);
    });

    it('detects single cell modification correctly', () => {
      const draftGrants = {
        'S46:V': { ADMIN: true, MANAGER: true, RECEPTIONIST: true }, // Changed false -> true
        'S47:E': { ADMIN: false, MANAGER: true, RECEPTIONIST: false },
      };
      const changes = computePendingChanges(originalRows, draftGrants);
      assert.strictEqual(changes.length, 1);
      assert.deepStrictEqual(changes[0], {
        role: 'RECEPTIONIST',
        module: 'S46',
        action: 'V',
        granted: true,
      });
    });

    it('detects multiple cell modifications across different rows and roles', () => {
      const draftGrants = {
        'S46:V': { ADMIN: true, MANAGER: true, RECEPTIONIST: true }, // RECEPTIONIST: false -> true
        'S47:E': { ADMIN: true, MANAGER: false, RECEPTIONIST: false }, // ADMIN: false -> true, MANAGER: true -> false
      };
      const changes = computePendingChanges(originalRows, draftGrants);
      assert.strictEqual(changes.length, 3);
    });
  });

  describe('permissionMatrixApi contract & HTTP verification', () => {
    it('verifies MatrixViewDto structure conforms to backend MatrixView', () => {
      const sampleMatrix: MatrixViewDto = {
        roles: [
          { roleId: 1, roleName: 'ADMIN', description: 'System administrator' },
          { roleId: 2, roleName: 'MANAGER', description: 'Manager' },
        ],
        rows: [
          {
            permissionId: 10,
            module: 'S51',
            action: 'V',
            delegable: false,
            adminOnly: true,
            grants: { ADMIN: true, MANAGER: false },
            lockedRoles: ['ADMIN'],
          },
        ],
      };

      assert.strictEqual(sampleMatrix.roles.length, 2);
      assert.strictEqual(sampleMatrix.rows[0].module, 'S51');
      assert.strictEqual(sampleMatrix.rows[0].adminOnly, true);
      assert.deepStrictEqual(sampleMatrix.rows[0].lockedRoles, ['ADMIN']);
    });

    it('fetches matrix from GET /admin/permissions/matrix', async () => {
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
            data: {
              roles: [{ roleId: 1, roleName: 'ADMIN', description: 'Admin' }],
              rows: [
                {
                  permissionId: 1,
                  module: 'S10',
                  action: 'V',
                  delegable: false,
                  adminOnly: true,
                  grants: { ADMIN: true },
                  lockedRoles: ['ADMIN'],
                },
              ],
            },
          }),
        } as any;
      };

      try {
        const matrix = await permissionMatrixApi.getMatrix();
        assert.match(requestedUrl, /\/admin\/permissions\/matrix$/);
        assert.strictEqual(requestedMethod, 'GET');
        assert.strictEqual(matrix.rows.length, 1);
        assert.strictEqual(matrix.rows[0].module, 'S10');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('calls POST /admin/permissions/matrix/preview and verifies read-only payload', async () => {
      const originalFetch = globalThis.fetch;
      let requestedUrl = '';
      let requestedMethod = '';
      let requestedBody: any = null;

      globalThis.fetch = async (url: any, init: any) => {
        requestedUrl = String(url);
        requestedMethod = init?.method;
        requestedBody = JSON.parse(init?.body);

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: [
              {
                role: 'RECEPTIONIST',
                module: 'S46',
                action: 'V',
                from: false,
                to: true,
              },
            ],
          }),
        } as any;
      };

      try {
        const changes: MatrixChangeDto[] = [
          { role: 'RECEPTIONIST', module: 'S46', action: 'V', granted: true },
        ];
        const diff = await permissionMatrixApi.previewChanges(changes);

        assert.match(requestedUrl, /\/admin\/permissions\/matrix\/preview$/);
        assert.strictEqual(requestedMethod, 'POST');
        assert.notStrictEqual(requestedMethod, 'PUT'); // Proves PUT is NOT called
        assert.deepStrictEqual(requestedBody, { changes });
        assert.strictEqual(diff.length, 1);
        assert.strictEqual(diff[0].from, false);
        assert.strictEqual(diff[0].to, true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('properly fails when preview is rejected with 400 Bad Request (e.g. ADMIN_LOCKED)', async () => {
      const originalFetch = globalThis.fetch;

      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            timestamp: '2026-10-19T10:00:00Z',
            status: 400,
            code: 'ADMIN_LOCKED',
            message: 'The Admin role must keep S10 permissions.',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await permissionMatrixApi.previewChanges([
              { role: 'ADMIN', module: 'S10', action: 'V', granted: false },
            ]);
          },
          (err: any) => {
            assert.strictEqual(err instanceof AppApiError, true);
            assert.strictEqual(err.status, 400);
            assert.strictEqual(err.code, 'ADMIN_LOCKED');
            assert.match(err.message, /ADMIN_LOCKED|must keep/);
            return true;
          }
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('properly fails when backend returns 403 Forbidden (insufficient S51:V or S51:G permission)', async () => {
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
            message: 'Access Denied: Missing required S51:V permission',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await permissionMatrixApi.getMatrix();
          },
          (err: any) => {
            assert.strictEqual(err instanceof AppApiError, true);
            assert.strictEqual(err.status, 403);
            assert.strictEqual(err.code, 'ACCESS_DENIED');
            return true;
          }
        );
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
            message: 'Authentication is required',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await permissionMatrixApi.getMatrix();
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
  });
});
