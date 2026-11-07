/**
 * Authoritative business timezone for HeavenStay Wellness Resort.
 * Standardized across backend (app.resort.timezone in application.yml) and frontend.
 */
export const RESORT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Returns the calendar date string (YYYY-MM-DD) for a given Date in the resort's business timezone (Asia/Ho_Chi_Minh).
 * Avoids UTC skew bugs caused by Date#toISOString() (e.g. 17:30 UTC on Nov 6 is 00:30 on Nov 7 in Vietnam).
 */
export function getResortDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESORT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's calendar date string (YYYY-MM-DD) in the resort's business timezone.
 */
export function getResortTodayString(): string {
  return getResortDateString(new Date());
}

