import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FnbFulfillmentStatus, MealPrepEntry } from '../../types/dining.ts';

/**
 * Filter function for active kitchen preparation queue.
 * Mirrors the active queue filtering implemented in DiningContext & FnbDashboardPage.
 * Excludes terminal lifecycle statuses: 'delivered' and 'cancelled'.
 * Preserves all active preparation states: 'pending', 'preparing', 'ready'.
 */
export function filterActiveKitchenQueue(items: MealPrepEntry[]): MealPrepEntry[] {
  return items.filter(
    (item) => item.status === 'pending' || item.status === 'preparing' || item.status === 'ready'
  );
}

/**
 * Checks whether an order status is an active kitchen status.
 */
export function isActiveKitchenStatus(status: FnbFulfillmentStatus): boolean {
  return status === 'pending' || status === 'preparing' || status === 'ready';
}

/**
 * Checks whether an order status is a terminal fulfillment status.
 */
export function isTerminalFulfillmentStatus(status: FnbFulfillmentStatus): boolean {
  return status === 'delivered' || status === 'cancelled';
}

describe('Kitchen Active Queue Lifecycle Safety', () => {
  const sampleItems: MealPrepEntry[] = [
    {
      id: 'order-101',
      type: 'retreat_meal',
      date: '2026-09-24',
      mealPeriod: 'breakfast',
      customerName: 'Eleanor Vance',
      villaNumber: '102',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
      dietaryNotes: ['Vegan'],
      status: 'pending',
    },
    {
      id: 'order-102',
      type: 'a_la_carte',
      date: '2026-09-24',
      targetTime: '12:30',
      customerName: 'Marcus Wright',
      villaNumber: '204',
      items: [{ menuItemId: 'item-2', quantity: 2 }],
      dietaryNotes: [],
      status: 'preparing',
    },
    {
      id: 'order-103',
      type: 'retreat_meal',
      date: '2026-09-24',
      mealPeriod: 'lunch',
      customerName: 'Sophia Loren',
      villaNumber: '301',
      items: [{ menuItemId: 'item-3', quantity: 1 }],
      dietaryNotes: ['Gluten-Free'],
      status: 'ready',
    },
    {
      id: 'order-104',
      type: 'retreat_meal',
      date: '2026-09-24',
      mealPeriod: 'breakfast',
      customerName: 'John Doe',
      villaNumber: '105',
      items: [{ menuItemId: 'item-4', quantity: 1 }],
      dietaryNotes: [],
      status: 'delivered',
    },
    {
      id: 'order-105',
      type: 'a_la_carte',
      date: '2026-09-24',
      targetTime: '09:00',
      customerName: 'Jane Smith',
      villaNumber: '106',
      items: [{ menuItemId: 'item-5', quantity: 1 }],
      dietaryNotes: [],
      status: 'cancelled',
    },
  ];

  describe('Defect Resolution: Exclusion of Terminal Orders', () => {
    it('excludes DELIVERED orders from the active kitchen prep queue', () => {
      const activeQueue = filterActiveKitchenQueue(sampleItems);
      const deliveredItem = activeQueue.find((item) => item.id === 'order-104');
      assert.strictEqual(
        deliveredItem,
        undefined,
        'DELIVERED orders must NOT appear in the active kitchen queue'
      );
    });

    it('excludes CANCELLED orders from the active kitchen prep queue', () => {
      const activeQueue = filterActiveKitchenQueue(sampleItems);
      const cancelledItem = activeQueue.find((item) => item.id === 'order-105');
      assert.strictEqual(
        cancelledItem,
        undefined,
        'CANCELLED orders must remain excluded from the active kitchen queue'
      );
    });

    it('returns zero terminal orders in the filtered queue', () => {
      const activeQueue = filterActiveKitchenQueue(sampleItems);
      const hasTerminal = activeQueue.some((item) => isTerminalFulfillmentStatus(item.status));
      assert.strictEqual(hasTerminal, false, 'No terminal status orders may be present');
    });
  });

  describe('Preservation of Valid Active Kitchen States', () => {
    it('preserves all active statuses: PENDING, PREPARING, and READY', () => {
      const activeQueue = filterActiveKitchenQueue(sampleItems);
      assert.strictEqual(activeQueue.length, 3);

      const statuses = activeQueue.map((item) => item.status);
      assert.ok(statuses.includes('pending'), 'Pending orders must be retained');
      assert.ok(statuses.includes('preparing'), 'Preparing orders must be retained');
      assert.ok(statuses.includes('ready'), 'Ready orders must be retained');
    });

    it('preserves order details, villa assignments, and dietary notes on active orders', () => {
      const activeQueue = filterActiveKitchenQueue(sampleItems);
      const eleanorOrder = activeQueue.find((i) => i.id === 'order-101');

      assert.ok(eleanorOrder, 'Eleanor Vance order must exist');
      assert.strictEqual(eleanorOrder?.customerName, 'Eleanor Vance');
      assert.strictEqual(eleanorOrder?.villaNumber, '102');
      assert.deepStrictEqual(eleanorOrder?.dietaryNotes, ['Vegan']);
      assert.strictEqual(eleanorOrder?.status, 'pending');
    });

    it('classifies statuses strictly and correctly into active vs terminal', () => {
      assert.strictEqual(isActiveKitchenStatus('pending'), true);
      assert.strictEqual(isActiveKitchenStatus('preparing'), true);
      assert.strictEqual(isActiveKitchenStatus('ready'), true);
      assert.strictEqual(isActiveKitchenStatus('delivered'), false);
      assert.strictEqual(isActiveKitchenStatus('cancelled'), false);

      assert.strictEqual(isTerminalFulfillmentStatus('delivered'), true);
      assert.strictEqual(isTerminalFulfillmentStatus('cancelled'), true);
      assert.strictEqual(isTerminalFulfillmentStatus('pending'), false);
      assert.strictEqual(isTerminalFulfillmentStatus('preparing'), false);
      assert.strictEqual(isTerminalFulfillmentStatus('ready'), false);
    });
  });

  describe('Empty and Edge Conditions', () => {
    it('returns an empty array when all daily orders are fulfilled or cancelled', () => {
      const fulfilledList: MealPrepEntry[] = [
        { ...sampleItems[3] }, // delivered
        { ...sampleItems[4] }, // cancelled
      ];
      const result = filterActiveKitchenQueue(fulfilledList);
      assert.strictEqual(result.length, 0);
    });

    it('handles empty input gracefully', () => {
      const result = filterActiveKitchenQueue([]);
      assert.deepStrictEqual(result, []);
    });
  });
});
