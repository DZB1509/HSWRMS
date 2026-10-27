import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNumericBookingId } from './bookingResolver.ts';

describe('bookingResolver', () => {
  it('resolves explicit positive integer number', () => {
    assert.strictEqual(resolveNumericBookingId(5), 5);
    assert.strictEqual(resolveNumericBookingId(1), 1);
    assert.strictEqual(resolveNumericBookingId(1024), 1024);
  });

  it('resolves explicit numeric string', () => {
    assert.strictEqual(resolveNumericBookingId('42'), 42);
    assert.strictEqual(resolveNumericBookingId('  100  '), 100);
    assert.strictEqual(resolveNumericBookingId('1'), 1);
  });

  it('fails closed (returns null) for reference strings without guessing IDs', () => {
    // Explicitly verify reference code HSW-88192 does NOT map to 192
    assert.notStrictEqual(resolveNumericBookingId('HSW-88192'), 192);
    assert.strictEqual(resolveNumericBookingId('HSW-88192'), null);

    // Other reference formats must also return null
    assert.strictEqual(resolveNumericBookingId('HSW-88001'), null);
    assert.strictEqual(resolveNumericBookingId('HSW-84920'), null);
    assert.strictEqual(resolveNumericBookingId('HSW-15'), null);
    assert.strictEqual(resolveNumericBookingId('HSW-BK-2026-0881'), null);
    assert.strictEqual(resolveNumericBookingId(null, 'HSW-88192'), null);
  });

  it('falls back to activeBookingId only when activeBookingId is numeric', () => {
    assert.strictEqual(resolveNumericBookingId(null, null, 7), 7);
    assert.strictEqual(resolveNumericBookingId(undefined, undefined, '8'), 8);

    // If activeBookingId is a reference string, it must fail closed
    assert.strictEqual(resolveNumericBookingId(null, null, 'HSW-88192'), null);
    assert.strictEqual(resolveNumericBookingId(null, null, 'HSW-BK-2026-0881'), null);
  });

  it('returns null for invalid numbers, decimals, and empty inputs', () => {
    assert.strictEqual(resolveNumericBookingId(0), null);
    assert.strictEqual(resolveNumericBookingId(-1), null);
    assert.strictEqual(resolveNumericBookingId(-99), null);
    assert.strictEqual(resolveNumericBookingId(3.14), null);
    assert.strictEqual(resolveNumericBookingId(1.5), null);
    assert.strictEqual(resolveNumericBookingId(''), null);
    assert.strictEqual(resolveNumericBookingId('   '), null);
    assert.strictEqual(resolveNumericBookingId('abc'), null);
    assert.strictEqual(resolveNumericBookingId('NaN'), null);
    assert.strictEqual(resolveNumericBookingId(null), null);
    assert.strictEqual(resolveNumericBookingId(undefined), null);
    assert.strictEqual(resolveNumericBookingId(), null);
  });
});
