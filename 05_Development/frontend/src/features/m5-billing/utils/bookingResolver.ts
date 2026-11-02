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

/**
 * Resolves a booking ID from route parameters or standard reference formats.
 * Format mapping:
 * - Direct digits: "3" or 3 -> 3
 * - M5 reference: "HSW-88003" -> 3 (88000 + id)
 * - M2 reference: "HSW-BK-3" or "BK-3" -> 3
 * - M3 reference: "HSW-3" -> 3
 */
export function parseBookingId(input?: string | number | null): number | null {
  if (typeof input === 'number' && Number.isInteger(input) && input > 0) {
    return input;
  }
  if (typeof input !== 'string') return null;
  const clean = input.trim();
  if (/^\d+$/.test(clean)) {
    const val = parseInt(clean, 10);
    return val > 0 ? val : null;
  }
  const m5Match = clean.match(/^HSW-88(\d+)$/i);
  if (m5Match) {
    const full = parseInt(m5Match[0].replace(/HSW-/i, ''), 10);
    const id = full - 88000;
    if (id > 0) return id;
  }
  const bkMatch = clean.match(/^(?:HSW-)?BK-(\d+)$/i);
  if (bkMatch) {
    const id = parseInt(bkMatch[1], 10);
    if (id > 0) return id;
  }
  const hswMatch = clean.match(/^HSW-(\d+)$/i);
  if (hswMatch) {
    const id = parseInt(hswMatch[1], 10);
    if (id > 0) return id;
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
  const parsedId = parseBookingId(requestedText);
  const match = requestedText
    ? eligible.find(booking =>
        String(booking.id) === requestedText ||
        booking.bookingReference === requestedText ||
        (parsedId !== null && Number(booking.id) === parsedId)
      )
    : selectedText
      ? eligible.find(booking => String(booking.id) === selectedText)
      : eligible.length === 1 ? eligible[0] : undefined;
  if (!match) return null;
  const id = Number(match.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
