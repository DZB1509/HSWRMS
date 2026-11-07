import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getResortDateString, getResortTodayString, RESORT_TIMEZONE } from './utils/spaDateUtils';

describe('M3 Business Timezone Consistency & Boundary Defense', () => {
  test('1. Resort timezone is explicitly Asia/Ho_Chi_Minh', () => {
    assert.equal(RESORT_TIMEZONE, 'Asia/Ho_Chi_Minh');
  });

  test('2. 2026-11-06 17:30 UTC derives 2026-11-07 in Ho Chi Minh City (prevents UTC date-lag bug)', () => {
    // 17:30 UTC + 7h = 00:30 on Nov 7 in Vietnam
    const utcDate = new Date('2026-11-06T17:30:00Z');
    const resortDate = getResortDateString(utcDate);
    assert.equal(resortDate, '2026-11-07');
  });

  test('3. 2026-11-06 16:59 UTC derives 2026-11-06 in Ho Chi Minh City', () => {
    // 16:59 UTC + 7h = 23:59 on Nov 6 in Vietnam
    const utcDate = new Date('2026-11-06T16:59:00Z');
    const resortDate = getResortDateString(utcDate);
    assert.equal(resortDate, '2026-11-06');
  });

  test('4. Exact midnight boundary at 17:00:00 UTC shifts to next calendar day in Vietnam', () => {
    // 17:00:00 UTC + 7h = 00:00:00 on Nov 7
    const midnightUtc = new Date('2026-11-06T17:00:00Z');
    assert.equal(getResortDateString(midnightUtc), '2026-11-07');

    // 1 second prior (16:59:59 UTC) remains Nov 6
    const secondBeforeUtc = new Date('2026-11-06T16:59:59Z');
    assert.equal(getResortDateString(secondBeforeUtc), '2026-11-06');
  });

  test('5. getResortTodayString returns valid YYYY-MM-DD pattern', () => {
    const today = getResortTodayString();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });
});

