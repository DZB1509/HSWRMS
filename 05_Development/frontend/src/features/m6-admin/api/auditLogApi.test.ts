import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  auditLogApi,
  normalizeAuditStatus,
  formatAuditTimestamp,
  validateAuditDateRange,
  validateAuditView,
  validateAuditAuthorization,
  type AuditViewDto
} from './auditLogApi';

describe('M6 Sensitive Audit Log API & Read-Only Contract Verification', () => {
  describe('normalizeAuditStatus mapping', () => {
    it('maps canonical uppercase backend statuses', () => {
      assert.equal(normalizeAuditStatus('SUCCESS'), 'SUCCESS');
      assert.equal(normalizeAuditStatus('DENIED'), 'DENIED');
    });

    it('normalizes lowercase or padded whitespace statuses', () => {
      assert.equal(normalizeAuditStatus(' success '), 'SUCCESS');
      assert.equal(normalizeAuditStatus('denied'), 'DENIED');
    });

    it('returns UNKNOWN for unrecognized or missing status strings', () => {
      assert.equal(normalizeAuditStatus(null), 'UNKNOWN');
      assert.equal(normalizeAuditStatus(undefined), 'UNKNOWN');
      assert.equal(normalizeAuditStatus('ERROR'), 'UNKNOWN');
      assert.equal(normalizeAuditStatus(''), 'UNKNOWN');
    });
  });

  describe('formatAuditTimestamp representation', () => {
    it('formats ISO Instant string correctly', () => {
      const formatted = formatAuditTimestamp('2026-10-19T09:28:14.974270100Z');
      assert.ok(formatted.includes('2026') || formatted.includes('19'));
    });

    it('returns fallback dash for null/undefined timestamps', () => {
      assert.equal(formatAuditTimestamp(null), '—');
      assert.equal(formatAuditTimestamp(undefined), '—');
      assert.equal(formatAuditTimestamp(''), '—');
    });

    it('returns raw string for unparseable dates without throwing', () => {
      assert.equal(formatAuditTimestamp('invalid-date-token'), 'invalid-date-token');
    });
  });

  describe('validateAuditDateRange client-side check', () => {
    it('accepts null or missing bounds', () => {
      assert.deepEqual(validateAuditDateRange(null, null), { valid: true });
      assert.deepEqual(validateAuditDateRange('2026-10-01T00:00:00', null), { valid: true });
      assert.deepEqual(validateAuditDateRange(null, '2026-10-20T23:59:59'), { valid: true });
    });

    it('accepts valid range where from <= to', () => {
      const res = validateAuditDateRange('2026-10-01T00:00:00', '2026-10-20T23:59:59');
      assert.equal(res.valid, true);
    });

    it('rejects invalid range where from > to (M6-MSG-08 guard)', () => {
      const res = validateAuditDateRange('2026-10-25T00:00:00', '2026-10-20T23:59:59');
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes('M6-MSG-08'));
    });

    it('rejects unparseable dates gracefully', () => {
      const res = validateAuditDateRange('not-a-date', '2026-10-20T23:59:59');
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes('không hợp lệ'));
    });
  });

  describe('validateAuditView DTO contract guard', () => {
    it('validates a complete, conforming backend AuditView DTO', () => {
      const dto: AuditViewDto = {
        auditLogId: 101,
        createdAt: '2026-10-19T09:28:14.974270100Z',
        actorUserId: 1,
        actorRole: 'ADMIN',
        action: 'View Audit Log List',
        targetDataType: 'AuditLog',
        targetRefId: 'PAGE_0',
        accessStatus: 'SUCCESS',
        oldValue: null,
        newValue: null,
        delegationId: null
      };
      assert.equal(validateAuditView(dto), true);
    });

    it('validates record with optional fields present (e.g. parameter change with oldValue/newValue)', () => {
      const dto: AuditViewDto = {
        auditLogId: 102,
        createdAt: '2026-10-19T09:30:00Z',
        actorUserId: 15,
        actorRole: 'MANAGER',
        action: 'Update Business Parameter',
        targetDataType: 'SystemConfiguration',
        targetRefId: 'refund_percentage',
        accessStatus: 'SUCCESS',
        oldValue: '50',
        newValue: '75',
        delegationId: 2
      };
      assert.equal(validateAuditView(dto), true);
    });

    it('rejects malformed or incomplete DTOs missing required fields', () => {
      assert.equal(validateAuditView(null), false);
      assert.equal(validateAuditView({}), false);
      assert.equal(validateAuditView({ auditLogId: 'not-a-number' }), false);
      assert.equal(validateAuditView({ auditLogId: 101, createdAt: '2026-10-19' }), false); // missing action, accessStatus
    });
  });

  describe('validateAuditAuthorization Fail-Closed Checks', () => {
    it('grants view and export to ADMIN with S53:V and S53:E', () => {
      const user = {
        roles: ['admin'],
        permissions: ['S53:V', 'S53:E', 'S10:V']
      };
      const res = validateAuditAuthorization(user);
      assert.equal(res.canView, true);
      assert.equal(res.canExport, true);
      assert.equal(res.isManagerDelegated, false);
    });

    it('grants view only to ADMIN if S53:E is missing', () => {
      const user = {
        roles: ['admin'],
        permissions: ['S53:V']
      };
      const res = validateAuditAuthorization(user);
      assert.equal(res.canView, true);
      assert.equal(res.canExport, false);
    });

    it('grants view to MANAGER when S53:V is delegated (delegable = true)', () => {
      const user = {
        roles: ['manager'],
        permissions: ['S53:V', 'S50:V']
      };
      const res = validateAuditAuthorization(user);
      assert.equal(res.canView, true);
      assert.equal(res.canExport, false); // Export is non-delegable
      assert.equal(res.isManagerDelegated, true);
    });

    it('denies view and export to MANAGER without S53:V delegation (fail-closed)', () => {
      const user = {
        roles: ['manager'],
        permissions: ['S50:V', 'S12:V']
      };
      const res = validateAuditAuthorization(user);
      assert.equal(res.canView, false);
      assert.equal(res.canExport, false);
      assert.equal(res.isManagerDelegated, false);
    });

    it('denies view and export to operational roles (Customer, Receptionist, Therapist)', () => {
      const customer = { roles: ['customer'], permissions: ['S02:V'] };
      assert.equal(validateAuditAuthorization(customer).canView, false);

      const receptionist = { roles: ['receptionist'], permissions: ['S20:V'] };
      assert.equal(validateAuditAuthorization(receptionist).canView, false);
    });

    it('fails closed for null, undefined, or missing permissions array', () => {
      assert.deepEqual(validateAuditAuthorization(null), { canView: false, canExport: false, isManagerDelegated: false });
      assert.deepEqual(validateAuditAuthorization(undefined), { canView: false, canExport: false, isManagerDelegated: false });
      assert.deepEqual(validateAuditAuthorization({ roles: ['admin'] }), { canView: false, canExport: false, isManagerDelegated: false });
    });
  });

  describe('auditLogApi contract & absence of mutations / export safety', () => {
    it('verifies auditLogApi exposes ONLY read methods (list, getById)', () => {
      const methods = Object.keys(auditLogApi);
      assert.deepEqual(methods.sort(), ['getById', 'list'].sort());
      // Absolutely no create, update, delete, purge, or export method
      assert.equal('create' in auditLogApi, false);
      assert.equal('update' in auditLogApi, false);
      assert.equal('delete' in auditLogApi, false);
      assert.equal('purge' in auditLogApi, false);
      assert.equal('exportCsv' in auditLogApi, false);
    });

    it('rejects invalid getById parameters before network dispatch', async () => {
      await assert.rejects(
        async () => {
          await auditLogApi.getById(0);
        },
        { message: /ID bản ghi nhật ký kiểm toán không hợp lệ/ }
      );

      await assert.rejects(
        async () => {
          await auditLogApi.getById(-5);
        },
        { message: /ID bản ghi nhật ký kiểm toán không hợp lệ/ }
      );
    });

    it('rejects date range violation before network dispatch', async () => {
      await assert.rejects(
        async () => {
          await auditLogApi.list({
            from: '2026-10-25T00:00:00',
            to: '2026-10-20T23:59:59'
          });
        },
        { message: /M6-MSG-08/ }
      );
    });
  });
});
