export const DAY_MS = 86_400_000;

/**
 * Validates whether a given string is a real calendar date in YYYY-MM-DD ISO format.
 *
 * @param iso - Date string to test.
 * @returns True if valid ISO date.
 */
export function isValidISO(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/**
 * Whole days since 1970-01-01 (UTC) for a YYYY-MM-DD string.
 *
 * @param iso - ISO date string.
 * @returns Days integer.
 */
export function toDayNumber(iso: string): number {
  return Math.round(new Date(`${iso}T00:00:00Z`).getTime() / DAY_MS);
}

/**
 * Converts a day number (days since 1970-01-01 UTC) into an ISO YYYY-MM-DD string.
 *
 * @param day - Days integer.
 * @returns ISO date string.
 */
export function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Adds an offset in days to an ISO date string.
 *
 * @param iso - Starting ISO date string.
 * @param days - Number of days to add (or subtract if negative).
 * @returns Resulting ISO date string.
 */
export function addDays(iso: string, days: number): string {
  return fromDayNumber(toDayNumber(iso) + days);
}

/**
 * Days from `a` to `b` (positive when b is later).
 *
 * @param a - Start date ISO.
 * @param b - End date ISO.
 * @returns Difference in integer days.
 */
export function diffDays(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

const dayMonth = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Formats an ISO date into Indian standard format, e.g. "15 Feb 2027".
 *
 * @param iso - Date string.
 * @returns Formatted date string.
 */
export function formatDayMonth(iso: string): string {
  return dayMonth.format(new Date(`${iso}T00:00:00Z`));
}
