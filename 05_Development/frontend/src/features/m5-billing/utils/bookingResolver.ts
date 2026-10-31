/**
 * HSWRMS — Module 5: Booking & Invoice Identifier Resolver
 *
 * Source-of-truth principles:
 * 1. The database primary key `retreatBookingId` is strictly a positive integer
 *    (INT IDENTITY in SQL Server, Integer in Java entities, number in TypeScript DTOs).
 * 2. Booking reference codes (such as "HSW-88192", "HSW-84920", "HSW-BK-2026-0881")
 *    are display references.
 * 3. A display reference is never converted to a database ID without matching
 *    it to a booking returned by the authenticated customer booking API.
 */
export function resolveNumericBookingId(
  paramBookingId?: string | number | null,
  _bookingReference?: string | null,
  activeBookingId?: string | number | null
): number | null {
  // 1. Explicit numeric parameter check
  if (typeof paramBookingId === 'number' && Number.isInteger(paramBookingId) && paramBookingId > 0) {
    return paramBookingId;
  }
  if (typeof paramBookingId === 'string' && /^\d+$/.test(paramBookingId.trim())) {
    const val = parseInt(paramBookingId.trim(), 10);
    if (val > 0) return val;
  }

  // 2. Fallback to activeBookingId if numeric
  if (typeof activeBookingId === 'number' && Number.isInteger(activeBookingId) && activeBookingId > 0) {
    return activeBookingId;
  }
  if (typeof activeBookingId === 'string' && /^\d+$/.test(activeBookingId.trim())) {
    const val = parseInt(activeBookingId.trim(), 10);
    if (val > 0) return val;
  }

  return null;
}

export interface CustomerBookingIdentity {
  id: string | number;
  bookingReference: string;
  status?: string;
}

/** Resolve only IDs present in the authenticated Customer's server booking list. */
export function resolveCustomerBookingId(
  requested: string | number | null | undefined,
  bookings: CustomerBookingIdentity[],
  selectedId?: string | number | null
): number | null {
  const eligible = bookings.filter(booking => booking.status?.toLowerCase() !== 'cancelled');
  const requestedText = requested == null ? '' : String(requested).trim();
  const selectedText = selectedId == null ? '' : String(selectedId).trim();
  const match = requestedText
    ? eligible.find(booking => String(booking.id) === requestedText || booking.bookingReference === requestedText)
    : selectedText
      ? eligible.find(booking => String(booking.id) === selectedText)
      : eligible.length === 1 ? eligible[0] : undefined;
  if (!match) return null;
  const id = Number(match.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
