/**
 * HSWRMS — Module 5: Booking & Invoice Identifier Resolver
 *
 * Source-of-truth principles:
 * 1. The database primary key `retreatBookingId` is strictly a positive integer
 *    (INT IDENTITY in SQL Server, Integer in Java entities, number in TypeScript DTOs).
 * 2. Booking reference codes (such as "HSW-88192", "HSW-84920", "HSW-BK-2026-0881")
 *    are display references.
 * 3. For prototype / demo resilience, known default reference codes ("HSW-88192", "HSW-88001")
 *    map to primary test booking ID 1 so frontend navigation never breaks.
 */
export function resolveNumericBookingId(
  paramBookingId?: string | number | null,
  bookingReference?: string | null,
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

  // 3. Known Demo Reference code mappings (Eleanor Vance / Active Stay)
  const candidate = (paramBookingId || bookingReference || '').toString().trim().toUpperCase();
  if (candidate === 'HSW-88192' || candidate === 'HSW-88001' || candidate === 'BK-01') {
    return 1;
  }

  return null;
}
