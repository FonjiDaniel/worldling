// UTC day helpers. Every "day" in the data model is a UTC `YYYY-MM-DD` string (SPEC §5.2).

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The UTC day containing `ms`, e.g. `2026-10-17`. */
export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Epoch ms of 00:00 UTC on `day`. Throws on a malformed day. */
export function startOfUtcDay(day: string): number {
  const ms = DAY_PATTERN.test(day) ? Date.parse(`${day}T00:00:00.000Z`) : Number.NaN;
  if (Number.isNaN(ms) || utcDay(ms) !== day) {
    throw new Error(`Invalid UTC day: ${day}`);
  }
  return ms;
}

/** `day` shifted by `n` days (negative goes back). */
export function addUtcDays(day: string, n: number): string {
  return utcDay(startOfUtcDay(day) + n * DAY_MS);
}
