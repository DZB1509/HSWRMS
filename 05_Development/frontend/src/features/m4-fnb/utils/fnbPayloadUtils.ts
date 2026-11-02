/**
 * HSWRMS — Module 4: F&B Payload Builder and Contract Serialization Utility
 *
 * Ensures strict adherence to Spring Boot backend DTO contracts:
 * - CreateDailyMealRequest: { retreatBookingId, orderDate, mealPeriod, menuItemIds, notes }
 * - CreateAlaCarteRequest: { retreatBookingId, orderDate, targetTime, location, items: [{ menuItemId, quantity, notes }] }
 * - CancelOrderRequest: { cancellationReason }
 *
 * Provides fail-fast validation when required identifiers (retreatBookingId) are omitted,
 * while maintaining backward-compatibility aliases (bookingId -> retreatBookingId, specialNotes -> notes).
 */

export interface CreateDailyMealBackendRequest {
  retreatBookingId: number;
  orderDate: string;
  mealPeriod: string;
  menuItemIds: number[];
  notes?: string;
}

export interface CreateAlaCarteBackendRequest {
  retreatBookingId: number;
  orderDate?: string;
  targetTime?: string;
  location?: string;
  items: {
    menuItemId: number;
    quantity: number;
    notes?: string;
  }[];
}

export interface CancelOrderBackendRequest {
  cancellationReason: string;
}

export interface DailyMealInputPayload {
  retreatBookingId?: number;
  orderDate: string;
  mealPeriod: string;
  menuItemIds: number[];
  notes?: string;
  // Backward-compatibility aliases
  bookingId?: number;
  specialNotes?: string;
}

export interface AlaCarteInputPayload {
  retreatBookingId?: number;
  orderDate?: string;
  targetTime?: string;
  location?: string;
  items: {
    menuItemId: number;
    quantity: number;
    notes?: string;
    specialNotes?: string;
  }[];
  // Backward-compatibility aliases
  bookingId?: number;
  deliveryTime?: string;
  deliveryLocation?: string;
}

/**
 * Builds and validates payload for CreateDailyMealRequest.
 * Throws an Error if neither retreatBookingId nor bookingId is provided.
 */
export function buildDailyMealOrderPayload(payload: DailyMealInputPayload): CreateDailyMealBackendRequest {
  const bookingId = payload.retreatBookingId ?? payload.bookingId;
  if (bookingId === undefined || bookingId === null) {
    throw new Error('retreatBookingId is required to submit a daily meal selection');
  }
  return {
    retreatBookingId: bookingId,
    orderDate: payload.orderDate,
    mealPeriod: payload.mealPeriod,
    menuItemIds: payload.menuItemIds,
    notes: payload.notes ?? payload.specialNotes,
  };
}

/**
 * Builds and validates payload for CreateAlaCarteRequest.
 * Throws an Error if neither retreatBookingId nor bookingId is provided.
 */
export function buildAlaCarteOrderPayload(payload: AlaCarteInputPayload): CreateAlaCarteBackendRequest {
  const bookingId = payload.retreatBookingId ?? payload.bookingId;
  if (bookingId === undefined || bookingId === null) {
    throw new Error('retreatBookingId is required to place an a-la-carte order');
  }
  return {
    retreatBookingId: bookingId,
    orderDate: payload.orderDate,
    targetTime: payload.targetTime ?? payload.deliveryTime,
    location: payload.location ?? payload.deliveryLocation,
    items: (payload.items || []).map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes ?? item.specialNotes,
    })),
  };
}

/**
 * Builds payload for CancelOrderRequest, ensuring cancellationReason is set.
 */
export function buildCancelOrderPayload(
  reason?: string,
  defaultReason: string = 'Customer cancelled'
): CancelOrderBackendRequest {
  const trimmed = reason ? reason.trim() : '';
  return {
    cancellationReason: trimmed || defaultReason,
  };
}

