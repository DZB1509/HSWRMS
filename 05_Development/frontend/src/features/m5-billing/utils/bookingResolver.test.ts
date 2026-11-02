import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseBookingId, resolveCustomerBookingId, resolveNumericBookingId } from './bookingResolver.ts';

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

  it('does not infer an ID from any booking reference', () => {
    assert.strictEqual(resolveNumericBookingId('HSW-88192'), null);
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

describe('resolveCustomerBookingId', () => {
  const bookings = [
    { id: 27, bookingReference: 'HSW-BK-27', status: 'in_stay' },
    { id: 34, bookingReference: 'HSW-BK-34', status: 'upcoming' },
  ];

  it('resolves a persisted ID or reference from the server booking response', () => {
    assert.strictEqual(resolveCustomerBookingId('HSW-BK-27', bookings), 27);
    assert.strictEqual(resolveCustomerBookingId('34', bookings), 34);
  });

  it('returns no booking for empty or multiple eligible bookings without explicit selection', () => {
    assert.strictEqual(resolveCustomerBookingId(undefined, [], null), null);
    assert.strictEqual(resolveCustomerBookingId(undefined, bookings, null), null);
  });

  it('selects the only eligible booking and ignores cancelled bookings', () => {
    assert.strictEqual(resolveCustomerBookingId(undefined, [bookings[0]], null), 27);
    assert.strictEqual(resolveCustomerBookingId(undefined, [{ id: 99, bookingReference: 'cancelled', status: 'cancelled' }], null), null);
  });

  it('rejects references and IDs not present in the authenticated Customer booking list', () => {
    assert.strictEqual(resolveCustomerBookingId('HSW-BK-999', bookings), null);
    assert.strictEqual(resolveCustomerBookingId('999', bookings), null);
  });
});

describe('parseBookingId', () => {
  it('parses numeric values and strings', () => {
    assert.strictEqual(parseBookingId(3), 3);
    assert.strictEqual(parseBookingId('3'), 3);
    assert.strictEqual(parseBookingId('  102  '), 102);
  });

  it('parses M5 HSW-88xxx booking references (88000 + id)', () => {
    assert.strictEqual(parseBookingId('HSW-88003'), 3);
    assert.strictEqual(parseBookingId('HSW-88001'), 1);
    assert.strictEqual(parseBookingId('HSW-88042'), 42);
  });

  it('parses M2 HSW-BK-x and BK-x booking references', () => {
    assert.strictEqual(parseBookingId('HSW-BK-3'), 3);
    assert.strictEqual(parseBookingId('BK-5'), 5);
  });

  it('parses M3 HSW-x booking references', () => {
    assert.strictEqual(parseBookingId('HSW-7'), 7);
  });

  it('returns null for non-matching or invalid values', () => {
    assert.strictEqual(parseBookingId(''), null);
    assert.strictEqual(parseBookingId(null), null);
    assert.strictEqual(parseBookingId(undefined), null);
    assert.strictEqual(parseBookingId('invalid'), null);
    assert.strictEqual(parseBookingId(-5), null);
  });
});
