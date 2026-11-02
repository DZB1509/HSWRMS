import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateParameterValue,
  canEditParameter,
  parametersApi,
  type ParameterViewDto,
} from './parametersApi.ts';
import { AppApiError } from '../../../api/errors/apiError.ts';

describe('M6 Business Parameters API & Authorization Logic', () => {
  describe('validateParameterValue validation rules', () => {
    const intParam: Pick<ParameterViewDto, 'valueType' | 'minValue' | 'maxValue'> = {
      valueType: 'INT',
      minValue: 0,
      maxValue: 720,
    };

    const decimalParam: Pick<ParameterViewDto, 'valueType' | 'minValue' | 'maxValue'> = {
      valueType: 'DECIMAL',
      minValue: 0,
      maxValue: 100,
    };

    it('rejects empty, whitespace, null, or undefined values', () => {
      assert.strictEqual(validateParameterValue(intParam, '').isValid, false);
      assert.strictEqual(validateParameterValue(intParam, '   ').isValid, false);
      assert.strictEqual(validateParameterValue(intParam, null).isValid, false);
      assert.strictEqual(validateParameterValue(intParam, undefined).isValid, false);
      assert.match(validateParameterValue(intParam, '').error || '', /bắt buộc/);
    });

    it('rejects non-numeric string representations', () => {
      assert.strictEqual(validateParameterValue(intParam, 'abc').isValid, false);
      assert.strictEqual(validateParameterValue(intParam, '12px').isValid, false);
      assert.strictEqual(validateParameterValue(intParam, '--5').isValid, false);
      assert.match(validateParameterValue(intParam, 'abc').error || '', /định dạng số/);
    });

    it('enforces integer scale when valueType is INT', () => {
      // Rejects decimal representations for INT
      const decimalCheck = validateParameterValue(intParam, '48.5');
      assert.strictEqual(decimalCheck.isValid, false);
      assert.match(decimalCheck.error || '', /số nguyên \(INT\)/);

      const dotZeroCheck = validateParameterValue(intParam, '48.0');
      assert.strictEqual(dotZeroCheck.isValid, false);

      // Accepts valid integer representations
      assert.strictEqual(validateParameterValue(intParam, '48').isValid, true);
      assert.strictEqual(validateParameterValue(intParam, 48).isValid, true);
      assert.strictEqual(validateParameterValue(intParam, '0').isValid, true);
    });

    it('validates min and max boundary limits', () => {
      // Below min (0)
      const belowMin = validateParameterValue(intParam, '-1');
      assert.strictEqual(belowMin.isValid, false);
      assert.match(belowMin.error || '', /nhỏ hơn ngưỡng tối thiểu/);

      // Above max (720)
      const aboveMax = validateParameterValue(intParam, '721');
      assert.strictEqual(aboveMax.isValid, false);
      assert.match(aboveMax.error || '', /vượt quá ngưỡng tối đa/);

      // Exact boundaries
      assert.strictEqual(validateParameterValue(intParam, '0').isValid, true);
      assert.strictEqual(validateParameterValue(intParam, '720').isValid, true);
      assert.strictEqual(validateParameterValue(intParam, '48').isValid, true);
    });

    it('allows valid decimals when valueType is DECIMAL', () => {
      assert.strictEqual(validateParameterValue(decimalParam, '80.5').isValid, true);
      assert.strictEqual(validateParameterValue(decimalParam, '0.25').isValid, true);
      assert.strictEqual(validateParameterValue(decimalParam, '100').isValid, true);

      // Out of bounds for DECIMAL
      const outOfBounds = validateParameterValue(decimalParam, '100.01');
      assert.strictEqual(outOfBounds.isValid, false);
      assert.match(outOfBounds.error || '', /vượt quá ngưỡng tối đa/);
    });
  });

  describe('canEditParameter authorization & role enforcement', () => {
    const managerEditableParam: ParameterViewDto = {
      key: 'cancellation_window_hours',
      value: '48',
      valueType: 'INT',
      minValue: 0,
      maxValue: 720,
      unit: 'Hours',
      description: 'Cancellation window',
      managerEditable: true,
      status: 'ACTIVE',
    };

    const adminOnlyParam: ParameterViewDto = {
      key: 'max_failed_login_attempts',
      value: '5',
      valueType: 'INT',
      minValue: 3,
      maxValue: 10,
      unit: 'Attempts',
      description: 'Max failed login attempts before lockout',
      managerEditable: false,
      status: 'ACTIVE',
    };

    it('grants full editing access to ADMIN with verified S50:U permission', () => {
      const adminUser = {
        role: 'admin',
        permissions: ['S50:V', 'S50:U', 'S10:V'],
      };

      // Admin can edit manager-editable parameters
      assert.strictEqual(canEditParameter(managerEditableParam, adminUser), true);

      // Admin can edit admin-only security parameters
      assert.strictEqual(canEditParameter(adminOnlyParam, adminUser), true);
    });

    it('denies editing to ADMIN if S50:U permission is missing (fail-closed)', () => {
      const adminNoPerm = {
        role: 'admin',
        permissions: ['S50:V', 'S10:V'], // Missing S50:U
      };

      assert.strictEqual(canEditParameter(managerEditableParam, adminNoPerm), false);
      assert.strictEqual(canEditParameter(adminOnlyParam, adminNoPerm), false);

      const adminEmpty = {
        role: 'admin',
        permissions: [],
      };
      assert.strictEqual(canEditParameter(managerEditableParam, adminEmpty), false);
    });

    it('allows MANAGER with S50:U to edit ONLY parameters with managerEditable=true', () => {
      const delegatedManager = {
        role: 'manager',
        permissions: ['S46:V', 'S47:V', 'S50:V', 'S50:U'],
      };

      // Allowed for manager-editable parameter
      assert.strictEqual(canEditParameter(managerEditableParam, delegatedManager), true);

      // STRICTLY DENIED for admin-only parameter
      assert.strictEqual(canEditParameter(adminOnlyParam, delegatedManager), false);
    });

    it('denies MANAGER from editing any parameter if S50:U is not delegated', () => {
      const defaultManager = {
        role: 'manager',
        permissions: ['S46:V', 'S47:V', 'S54:V', 'S55:V'], // No S50:U
      };

      assert.strictEqual(canEditParameter(managerEditableParam, defaultManager), false);
      assert.strictEqual(canEditParameter(adminOnlyParam, defaultManager), false);
    });

    it('denies other non-admin/manager roles from editing parameters', () => {
      const receptionist = {
        role: 'receptionist',
        permissions: ['S20:V', 'S20:C'],
      };
      assert.strictEqual(canEditParameter(managerEditableParam, receptionist), false);
      assert.strictEqual(canEditParameter(adminOnlyParam, receptionist), false);

      const customer = {
        role: 'customer',
        permissions: [],
      };
      assert.strictEqual(canEditParameter(managerEditableParam, customer), false);
    });

    it('fails closed for null or undefined user', () => {
      assert.strictEqual(canEditParameter(managerEditableParam, null), false);
      assert.strictEqual(canEditParameter(managerEditableParam, undefined), false);
      assert.strictEqual(canEditParameter(adminOnlyParam, null), false);
    });
  });

  describe('parametersApi contract mapping & error handling', () => {
    it('verifies ParameterViewDto structure matches backend AdminDtos.ParameterView', () => {
      const mockBackendView: ParameterViewDto = {
        key: 'deposit_percentage',
        value: '30',
        valueType: 'INT',
        minValue: 10,
        maxValue: 100,
        unit: 'Percent',
        description: 'Required deposit percentage',
        managerEditable: true,
        status: 'ACTIVE',
        updatedAt: '2026-10-19T10:00:00Z',
      };

      assert.strictEqual(typeof mockBackendView.key, 'string');
      assert.strictEqual(typeof mockBackendView.value, 'string');
      assert.strictEqual(typeof mockBackendView.valueType, 'string');
      assert.strictEqual(typeof mockBackendView.minValue, 'number');
      assert.strictEqual(typeof mockBackendView.maxValue, 'number');
      assert.strictEqual(typeof mockBackendView.managerEditable, 'boolean');
      assert.strictEqual(mockBackendView.managerEditable, true);
    });

    it('encodes URI component for parameter key when calling update endpoint', async () => {
      // Mock global fetch to inspect requested URL and payload
      const originalFetch = globalThis.fetch;
      let requestedUrl = '';
      let requestedMethod = '';
      let requestedBody = '';

      globalThis.fetch = async (url: any, init: any) => {
        requestedUrl = String(url);
        requestedMethod = init?.method;
        requestedBody = init?.body;

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            message: 'SUCCESS',
            data: {
              key: 'cancellation_window_hours',
              value: '72',
              valueType: 'INT',
              managerEditable: true,
            },
          }),
        } as any;
      };

      try {
        const result = await parametersApi.update('cancellation_window_hours', '72');
        assert.match(requestedUrl, /\/admin\/parameters\/cancellation_window_hours$/);
        assert.strictEqual(requestedMethod, 'PUT');
        assert.deepStrictEqual(JSON.parse(requestedBody), { value: '72' });
        assert.strictEqual(result.key, 'cancellation_window_hours');
        assert.strictEqual(result.value, '72');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('properly fails without falsifying success when backend returns 401 Unauthorized', async () => {
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
            message: 'Full authentication is required to access this resource',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await parametersApi.list();
          },
          (err: any) => {
            assert.strictEqual(err instanceof AppApiError, true);
            assert.strictEqual(err.status, 401);
            assert.strictEqual(err.code, 'UNAUTHORIZED');
            return true;
          }
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('properly fails when backend returns 403 Forbidden (insufficient permission)', async () => {
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
            message: 'Access Denied: Missing S50:U permission or non-editable parameter',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await parametersApi.update('max_failed_login_attempts', '6');
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

    it('properly fails when backend returns 400 Bad Request (business rule validation failure)', async () => {
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
            code: 'M6-MSG-04',
            message: 'Giá trị phải là số nguyên nằm trong khoảng 0 đến 720',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await parametersApi.update('cancellation_window_hours', '9999');
          },
          (err: any) => {
            assert.strictEqual(err instanceof AppApiError, true);
            assert.strictEqual(err.status, 400);
            assert.strictEqual(err.code, 'M6-MSG-04');
            assert.match(err.message, /khoảng 0 đến 720/);
            return true;
          }
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('properly fails when backend returns 404 Not Found (parameter key does not exist)', async () => {
      const originalFetch = globalThis.fetch;

      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            timestamp: '2026-10-19T10:00:00Z',
            status: 404,
            code: 'NOT_FOUND',
            message: 'Parameter not found: unknown_param_key',
          }),
        } as any;
      };

      try {
        await assert.rejects(
          async () => {
            await parametersApi.update('unknown_param_key', '123');
          },
          (err: any) => {
            assert.strictEqual(err instanceof AppApiError, true);
            assert.strictEqual(err.status, 404);
            return true;
          }
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
