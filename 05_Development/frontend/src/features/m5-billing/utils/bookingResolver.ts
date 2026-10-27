/**
 * HSWRMS — Module 5: Booking & Invoice Identifier Resolver
 *
 * Source-of-truth principles:
 * 1. The database primary key `retreatBookingId` is strictly a positive integer
 *    (INT IDENTITY in SQL Server, Integer in Java entities, number in TypeScript DTOs).
 * 2. Booking reference codes (such as "HSW-88192", "HSW-84920", "HSW-BK-2026-0881")
 *    are display references. In the current backend contracts and database schema (dbo.RetreatBooking),
 *    there is NO formula mapping (e.g. "HSW-88192" does NOT equate to ID 192).
 * 3. Therefore, non-numeric reference strings CANNOT be converted by guessing or arithmetic.
 *    If only a reference code is available, a dedicated lookup API is required
 *    (e.g., GET /api/v1/customer/bookings/by-reference/{ref} or filtering by reference).
 * 4. In the absence of a backend reference lookup endpoint, this resolver fails closed
 *    by returning `null`.
 * 5. Callers MUST fail closed when this returns `null`: they must NEVER call billing,
 *    payment, or checkout finalization APIs with unverified or guessed IDs.
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

  // 3. Fail-closed: reference codes (e.g. "HSW-88192") or invalid formats cannot be resolved to a DB ID
  return null;
}
