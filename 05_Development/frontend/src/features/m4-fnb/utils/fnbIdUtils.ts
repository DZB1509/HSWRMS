/**
 * HSWRMS — Module 4: F&B Identifier Extraction and Sanitization Utility
 *
 * Requirements satisfied:
 * - Safely handles both raw numeric IDs (Long/Integer from Spring Boot) and formatted strings.
 * - Prevents TypeError crashes (e.g. `id.replace is not a function`) when receiving numbers.
 * - Normalizes prefixed strings like 'MEAL-101', 'ORD-204', 'MS-55' into integer IDs.
 * - Fails safely by returning null on null, undefined, NaN, empty strings, or non-numeric tokens.
 */
export function extractNumericId(id: string | number | undefined | null): number | null {
  if (id === undefined || id === null) return null;
  if (typeof id === 'number') {
    return isNaN(id) ? null : id;
  }
  const str = String(id).trim();
  const digits = str.replace(/\D/g, '');
  if (digits) {
    const parsed = parseInt(digits, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

