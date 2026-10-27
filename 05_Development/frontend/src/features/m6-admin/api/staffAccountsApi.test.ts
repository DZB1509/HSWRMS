import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toBackendRole,
  mapStaffView,
  parseAuthMePermissions,
  handleAuthMeError,
  evaluatePermission,
  type StaffViewDto,
} from './staffAccountsApi.ts';

describe('M6 Staff Management API & Permission Mapping', () => {
  describe('toBackendRole mapping', () => {
    it('maps frontend roles to backend Spring Security role names', () => {
      assert.strictEqual(toBackendRole('admin'), 'ADMIN');
      assert.strictEqual(toBackendRole('manager'), 'MANAGER');
      assert.strictEqual(toBackendRole('receptionist'), 'RECEPTIONIST');
      assert.strictEqual(toBackendRole('therapist'), 'THERAPIST');
      assert.strictEqual(toBackendRole('fb_staff'), 'FNB_STAFF');
    });

    it('falls back to uppercase for unknown roles', () => {
      assert.strictEqual(toBackendRole('custom_role' as any), 'CUSTOM_ROLE');
    });
  });

  describe('mapStaffView DTO transformation', () => {
    it('maps active staff view from backend to frontend StaffAccount', () => {
      const dto: StaffViewDto = {
        userId: 105,
        fullName: 'Le Thi Mai',
        email: 'mai.le@heavenstay.com',
        phoneNumber: '0901234567',
        role: 'THERAPIST',
        status: 'ACTIVE',
        lastLoginAt: new Date(Date.now() - 5 * 60000).toISOString(),
        createdAt: '2026-03-01T08:00:00Z',
      };

      const staff = mapStaffView(dto);
      assert.strictEqual(staff.id, '105');
      assert.strictEqual(staff.name, 'Le Thi Mai');
      assert.strictEqual(staff.email, 'mai.le@heavenstay.com');
      assert.strictEqual(staff.phone, '0901234567');
      assert.strictEqual(staff.role, 'therapist');
      assert.strictEqual(staff.status, 'active');
      assert.strictEqual(staff.joinedDate, '2026-03-01');
      assert.strictEqual(staff.avatar, 'LT');
      assert.strictEqual(staff.department, 'Chăm Sóc Sức Khỏe & Spa');
      assert.strictEqual(staff.title, 'Chuyên Viên Trị Liệu');
      assert.match(staff.lastActiveAt, /phút trước/);
    });

    it('maps FNB_STAFF and handles suspended status', () => {
      const dto: StaffViewDto = {
        userId: 202,
        fullName: 'Pham Van Binh',
        email: 'binh.pham@heavenstay.com',
        phoneNumber: null,
        role: 'FNB_STAFF',
        status: 'INACTIVE',
        lastLoginAt: null,
        createdAt: null,
      };

      const staff = mapStaffView(dto);
      assert.strictEqual(staff.id, '202');
      assert.strictEqual(staff.role, 'fb_staff');
      assert.strictEqual(staff.status, 'suspended');
      assert.strictEqual(staff.phone, undefined);
      assert.strictEqual(staff.lastActiveAt, 'Chưa đăng nhập');
      assert.strictEqual(staff.joinedDate, '');
      assert.strictEqual(staff.department, 'Ẩm Thực & Dinh Dưỡng F&B');
    });

    it('safely normalizes legacy FBSTAFF variant', () => {
      const dto: StaffViewDto = {
        userId: 303,
        fullName: 'Chef Hoang',
        email: 'hoang@heavenstay.com',
        role: 'FBSTAFF',
        status: 'ACTIVE',
      };

      const staff = mapStaffView(dto);
      assert.strictEqual(staff.role, 'fb_staff');
    });
  });

  describe('parseAuthMePermissions contract parser', () => {
    it('reads canonical permissions field from ApiResponse<MeView>', () => {
      const res = {
        success: true,
        message: 'SUCCESS',
        data: {
          userId: 1,
          fullName: 'Admin',
          email: 'admin@heavenstay.com',
          roles: ['ADMIN'],
          permissions: ['S10:V', 'S10:C', 'S11:V', 'S11:C', 'S11:D'],
        },
      };
      const perms = parseAuthMePermissions(res);
      assert.deepStrictEqual(perms, ['S10:V', 'S10:C', 'S11:V', 'S11:C', 'S11:D']);
    });

    it('resiliently reads effectivePermissions fallback if present', () => {
      const res = {
        data: {
          userId: 2,
          effectivePermissions: ['S46:V', 'S47:V'],
        },
      };
      const perms = parseAuthMePermissions(res);
      assert.deepStrictEqual(perms, ['S46:V', 'S47:V']);
    });

    it('returns empty array when permissions field is missing or null', () => {
      assert.deepStrictEqual(parseAuthMePermissions({ data: {} }), []);
      assert.deepStrictEqual(parseAuthMePermissions({ data: { permissions: null } }), []);
      assert.deepStrictEqual(parseAuthMePermissions(null), []);
      assert.deepStrictEqual(parseAuthMePermissions(undefined), []);
    });

    it('filters out non-string entries in permissions array', () => {
      const res = {
        data: {
          permissions: ['S10:V', 123, null, undefined, 'S11:C'],
        },
      };
      assert.deepStrictEqual(parseAuthMePermissions(res), ['S10:V', 'S11:C']);
    });
  });

  describe('handleAuthMeError fail-closed & session behavior', () => {
    it('invokes onLogout on true 401 Unauthorized', () => {
      let loggedOut = false;
      const res = handleAuthMeError({ status: 401, message: 'Unauthorized' }, () => {
        loggedOut = true;
      });
      assert.strictEqual(res.isSessionExpired, true);
      assert.strictEqual(res.permissions, null);
      assert.strictEqual(loggedOut, true);
    });

    it('does NOT invoke onLogout on 500 Internal Server Error (fail-closed)', () => {
      let loggedOut = false;
      const res = handleAuthMeError({ status: 500, message: 'Server Error' }, () => {
        loggedOut = true;
      });
      assert.strictEqual(res.isSessionExpired, false);
      assert.strictEqual(res.permissions, null);
      assert.strictEqual(loggedOut, false);
    });

    it('does NOT invoke onLogout on network failure / offline / timeout (status 0)', () => {
      let loggedOut = false;
      const res = handleAuthMeError({ status: 0, code: 'NETWORK_ERROR' }, () => {
        loggedOut = true;
      });
      assert.strictEqual(res.isSessionExpired, false);
      assert.strictEqual(res.permissions, null);
      assert.strictEqual(loggedOut, false);
    });
  });

  describe('evaluatePermission & Fail-Closed Authorization', () => {
    it('grants permission when code is verified in permissions array', () => {
      const user = { role: 'receptionist', permissions: ['S10:V', 'S20:V'] };
      assert.strictEqual(evaluatePermission(user, 'S10:V'), true);
      assert.strictEqual(evaluatePermission(user, 'S20:V'), true);
    });

    it('denies access when user has role admin but required permission is UNVERIFIED (fail-closed)', () => {
      const adminUnverified = { role: 'admin', permissions: [] };
      assert.strictEqual(evaluatePermission(adminUnverified, 'S10:V'), false);
      assert.strictEqual(evaluatePermission(adminUnverified, 'S11:C'), false);
      assert.strictEqual(evaluatePermission(adminUnverified, 'S11:D'), false);

      const adminNoPerms = { role: 'admin', permissions: undefined };
      assert.strictEqual(evaluatePermission(adminNoPerms, 'S10:V'), false);
    });

    it('grants access to admin with verified permissions from /auth/me', () => {
      const adminVerified = {
        role: 'admin',
        permissions: ['S10:V', 'S10:C', 'S11:V', 'S11:C', 'S11:D'],
      };
      assert.strictEqual(evaluatePermission(adminVerified, 'S10:V'), true);
      assert.strictEqual(evaluatePermission(adminVerified, 'S11:C'), true);
      assert.strictEqual(evaluatePermission(adminVerified, 'S11:D'), true);
    });

    it('denies staff management permissions to MANAGER (non-delegable)', () => {
      const managerUser = { role: 'manager', permissions: ['S46:V', 'S47:V', 'S54:V'] };
      assert.strictEqual(evaluatePermission(managerUser, 'S10:V'), false);
      assert.strictEqual(evaluatePermission(managerUser, 'S11:C'), false);
      assert.strictEqual(evaluatePermission(managerUser, 'S11:D'), false);
    });

    it('fails closed for null/undefined user or empty permission code', () => {
      assert.strictEqual(evaluatePermission(null, 'S10:V'), false);
      assert.strictEqual(evaluatePermission(undefined, 'S10:V'), false);
      assert.strictEqual(evaluatePermission({ role: 'admin', permissions: ['S10:V'] }, ''), false);
    });

    it('strictly discriminates list viewing (S10:V), creation (S11:C), and status toggle (S11:D)', () => {
      const viewerOnly = { role: 'receptionist', permissions: ['S10:V'] };
      assert.strictEqual(evaluatePermission(viewerOnly, 'S10:V'), true);
      assert.strictEqual(evaluatePermission(viewerOnly, 'S11:C'), false);
      assert.strictEqual(evaluatePermission(viewerOnly, 'S11:D'), false);

      const creatorOnly = { role: 'receptionist', permissions: ['S11:C'] };
      assert.strictEqual(evaluatePermission(creatorOnly, 'S10:V'), false);
      assert.strictEqual(evaluatePermission(creatorOnly, 'S11:C'), true);
      assert.strictEqual(evaluatePermission(creatorOnly, 'S11:D'), false);

      const statusToggleOnly = { role: 'receptionist', permissions: ['S11:D'] };
      assert.strictEqual(evaluatePermission(statusToggleOnly, 'S10:V'), false);
      assert.strictEqual(evaluatePermission(statusToggleOnly, 'S11:C'), false);
      assert.strictEqual(evaluatePermission(statusToggleOnly, 'S11:D'), true);
    });
  });
});

