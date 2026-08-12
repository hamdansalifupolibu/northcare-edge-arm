/**
 * Date-only health fields (DOB, EDD) — YYYY-MM-DD, never timezone-shifted.
 */
export type DateOnly = string;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value: unknown): value is DateOnly {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    return false;
  }
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function assertDateOnly(value: unknown, fieldName = 'date'): DateOnly {
  if (!isDateOnly(value)) {
    throw new Error(`Invalid date-only value for ${fieldName}`);
  }
  return value;
}

export function compareDateOnly(a: DateOnly, b: DateOnly): number {
  assertDateOnly(a);
  assertDateOnly(b);
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}
