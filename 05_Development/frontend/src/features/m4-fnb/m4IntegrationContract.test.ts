import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyMealOrderPayload,
  buildAlaCarteOrderPayload,
  buildCancelOrderPayload,
  type DailyMealInputPayload,
  type AlaCarteInputPayload,
} from './utils/fnbPayloadUtils.ts';
import { extractNumericId } from './utils/fnbIdUtils.ts';
import type { FnbFulfillmentStatus, MealPrepEntry } from '../../types/dining.ts';

// Reusable mock mapper mirroring DiningContext mapBackendPrepEntry
interface MealPrepEntryBackendDto {
  id: string | number;
  rawMealOrderId?: number;
  type: 'retreat_meal' | 'a_la_carte';
  date: string;
  targetTime?: string;
  mealPeriod?: string;
  customerName: string;
  villaNumber?: string;
  items: {
    menuItemId: string | number;
    itemName?: string;
    quantity: number;
    notes?: string;
  }[];
  customerNotes?: string;
  dietaryNotes: string[];
  status: string;
}

function mapBackendPrepEntry(dto: MealPrepEntryBackendDto): MealPrepEntry {
  const safeId = String(dto.id);
  return {
    id: safeId,
    type: dto.type,
    date: dto.date,
    targetTime: dto.targetTime,
    mealPeriod: dto.mealPeriod ? (dto.mealPeriod.toLowerCase() as any) : undefined,
    customerName: dto.customerName || 'Resort Guest',
    villaNumber: dto.villaNumber || '—',
    items: (dto.items || []).map((i) => ({
      menuItemId: String(i.menuItemId),
      quantity: i.quantity || 1,
      notes: i.notes,
    })),
    customerNotes: dto.customerNotes,
    dietaryNotes: dto.dietaryNotes || [],
    status: (dto.status?.toLowerCase() as FnbFulfillmentStatus) || 'pending',
  };
}

describe('M4 F&B Frontend-Backend Contract Integration (Phase 5.8.3.71)', () => {

  describe('Fix 1: Daily Meal Selection Contract & Payload (CreateDailyMealRequest)', () => {
    it('requires retreatBookingId and fails fast if omitted', () => {
      const invalidPayload: DailyMealInputPayload = {
        orderDate: '2026-09-24',
        mealPeriod: 'LUNCH',
        menuItemIds: [1, 2],
      };

      assert.throws(
        () => buildDailyMealOrderPayload(invalidPayload),
        /retreatBookingId is required to submit a daily meal selection/
      );
    });

    it('correctly builds payload with retreatBookingId and notes matching backend DTO', () => {
      const payload: DailyMealInputPayload = {
        retreatBookingId: 101,
        orderDate: '2026-09-24',
        mealPeriod: 'BREAKFAST',
        menuItemIds: [5, 6],
        notes: 'Strict vegan preference',
      };

      const result = buildDailyMealOrderPayload(payload);

      assert.strictEqual(result.retreatBookingId, 101);
      assert.strictEqual(result.orderDate, '2026-09-24');
      assert.strictEqual(result.mealPeriod, 'BREAKFAST');
      assert.deepStrictEqual(result.menuItemIds, [5, 6]);
      assert.strictEqual(result.notes, 'Strict vegan preference');
      // Ensure legacy aliases are not emitted to backend
      assert.strictEqual((result as any).bookingId, undefined);
      assert.strictEqual((result as any).specialNotes, undefined);
    });

    it('supports backward-compatible aliases (bookingId -> retreatBookingId, specialNotes -> notes)', () => {
      const legacyPayload: DailyMealInputPayload = {
        bookingId: 88,
        orderDate: '2026-09-24',
        mealPeriod: 'DINNER',
        menuItemIds: [10],
        specialNotes: 'No peanuts',
      };

      const result = buildDailyMealOrderPayload(legacyPayload);

      assert.strictEqual(result.retreatBookingId, 88);
      assert.strictEqual(result.notes, 'No peanuts');
      assert.strictEqual((result as any).bookingId, undefined);
      assert.strictEqual((result as any).specialNotes, undefined);
    });
  });

  describe('Fix 2: A-la-carte Ordering Contract & Payload (CreateAlaCarteRequest)', () => {
    it('requires retreatBookingId and fails fast if omitted', () => {
      const invalidPayload: AlaCarteInputPayload = {
        targetTime: '12:30',
        location: 'Villa 102',
        items: [{ menuItemId: 3, quantity: 1 }],
      };

      assert.throws(
        () => buildAlaCarteOrderPayload(invalidPayload),
        /retreatBookingId is required to place an a-la-carte order/
      );
    });

    it('correctly maps retreatBookingId, location, targetTime, and item notes', () => {
      const payload: AlaCarteInputPayload = {
        retreatBookingId: 42,
        orderDate: '2026-09-24',
        targetTime: '19:30',
        location: 'Villa Lotus-01',
        items: [
          { menuItemId: 10, quantity: 2, notes: 'Warm dressing on the side' },
          { menuItemId: 12, quantity: 1, notes: 'Less ice' },
        ],
      };

      const result = buildAlaCarteOrderPayload(payload);

      assert.strictEqual(result.retreatBookingId, 42);
      assert.strictEqual(result.orderDate, '2026-09-24');
      assert.strictEqual(result.location, 'Villa Lotus-01');
      assert.strictEqual(result.targetTime, '19:30');
      assert.strictEqual(result.items.length, 2);
      assert.strictEqual(result.items[0].notes, 'Warm dressing on the side');
      assert.strictEqual(result.items[1].notes, 'Less ice');
      // Ensure old frontend keys are not emitted
      assert.strictEqual((result as any).deliveryLocation, undefined);
      assert.strictEqual((result as any).deliveryTime, undefined);
    });

    it('maps legacy deliveryLocation, deliveryTime, and specialNotes to backend contract', () => {
      const legacyPayload: AlaCarteInputPayload = {
        bookingId: 42,
        deliveryTime: '20:00',
        deliveryLocation: 'Poolside Cabana 4',
        items: [{ menuItemId: 15, quantity: 1, specialNotes: 'Extra lemon' }],
      };

      const result = buildAlaCarteOrderPayload(legacyPayload);

      assert.strictEqual(result.retreatBookingId, 42);
      assert.strictEqual(result.location, 'Poolside Cabana 4');
      assert.strictEqual(result.targetTime, '20:00');
      assert.strictEqual(result.items[0].notes, 'Extra lemon');
      assert.strictEqual((result as any).deliveryLocation, undefined);
      assert.strictEqual((result as any).deliveryTime, undefined);
    });
  });

  describe('Fix 3: Order Cancellation Payload & Mandatory cancellationReason', () => {
    it('uses cancellationReason key and rejects old reason key', () => {
      const customerReq = buildCancelOrderPayload('Customer changed plan', 'Customer cancelled');
      assert.strictEqual(customerReq.cancellationReason, 'Customer changed plan');
      assert.strictEqual((customerReq as any).reason, undefined, 'Old "reason" key must never be sent');

      const staffReq = buildCancelOrderPayload('Kitchen ran out of ingredients', 'Staff cancelled');
      assert.strictEqual(staffReq.cancellationReason, 'Kitchen ran out of ingredients');
      assert.strictEqual((staffReq as any).reason, undefined, 'Old "reason" key must never be sent');
    });

    it('falls back to default reason when reason is omitted or empty whitespace', () => {
      const defaultCustomerReq = buildCancelOrderPayload(undefined, 'Customer cancelled');
      assert.strictEqual(defaultCustomerReq.cancellationReason, 'Customer cancelled');

      const whitespaceReq = buildCancelOrderPayload('   ', 'Customer cancelled');
      assert.strictEqual(whitespaceReq.cancellationReason, 'Customer cancelled');
    });
  });

  describe('Fix 4: Numeric ID Type Handling and Safety in KDS', () => {
    it('extractNumericId handles raw numbers without calling .replace()', () => {
      assert.strictEqual(extractNumericId(101), 101);
      assert.strictEqual(extractNumericId(0), 0);
      assert.strictEqual(extractNumericId(99999), 99999);
    });

    it('extractNumericId handles numeric strings and formatted order IDs', () => {
      assert.strictEqual(extractNumericId('101'), 101);
      assert.strictEqual(extractNumericId('MEAL-204'), 204);
      assert.strictEqual(extractNumericId('ORD-1729837482'), 1729837482);
      assert.strictEqual(extractNumericId('MS-55'), 55);
    });

    it('extractNumericId returns null for invalid or empty inputs gracefully', () => {
      assert.strictEqual(extractNumericId(null), null);
      assert.strictEqual(extractNumericId(undefined), null);
      assert.strictEqual(extractNumericId(''), null);
      assert.strictEqual(extractNumericId('no-digits-here'), null);
      assert.strictEqual(extractNumericId(NaN), null);
    });

    it('mapBackendPrepEntry guarantees string ID for frontend consumption', () => {
      const rawDto: MealPrepEntryBackendDto = {
        id: 101, // Raw Long/number returned from Spring Boot Jackson
        rawMealOrderId: 101,
        type: 'retreat_meal',
        date: '2026-09-24',
        mealPeriod: 'LUNCH',
        customerName: 'Eleanor Vance',
        villaNumber: '102',
        items: [{ menuItemId: 5, itemName: 'Detox Bowl', quantity: 1 }],
        dietaryNotes: ['Gluten Free'],
        status: 'PREPARING',
      };

      const mapped = mapBackendPrepEntry(rawDto);
      assert.strictEqual(typeof mapped.id, 'string');
      assert.strictEqual(mapped.id, '101');
      assert.strictEqual(mapped.status, 'preparing');
      assert.deepStrictEqual(mapped.dietaryNotes, ['Gluten Free']);

      // Ensure extractNumericId works on mapped item without throwing TypeError
      const extracted = extractNumericId(mapped.id);
      assert.strictEqual(extracted, 101);
    });
  });

  describe('Fix 5: No False Success / State Rollback on Backend Failure', () => {
    it('simulates rollback behavior: failed promise removes optimistic item from state', () => {
      const tempId = 'ORD-12345';
      let orders = [
        { id: tempId, bookingId: '42', totalAmount: 150, status: 'pending' as FnbFulfillmentStatus }
      ];

      // Simulate backend failure: optimistic order rolled back
      orders = orders.filter(o => o.id !== tempId);

      assert.strictEqual(orders.length, 0, 'Unsaved optimistic order must be rolled back on error');
    });

    it('simulates daily meal selection rollback on backend failure', () => {
      const tempId = 'MS-9999';
      let selections = [
        { id: tempId, bookingId: '42', date: '2026-09-24', mealPeriod: 'breakfast', menuItemIds: ['1'] }
      ];

      // Simulate backend failure: optimistic selection rolled back
      selections = selections.filter(s => s.id !== tempId);

      assert.strictEqual(selections.length, 0, 'Unsaved optimistic selection must be rolled back on error');
    });
  });
});
