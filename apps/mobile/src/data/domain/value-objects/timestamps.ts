/**
 * Persisted timestamps are ISO 8601 UTC strings, e.g. 2026-08-02T12:30:00.000Z
 */
export type IsoUtcTimestamp = string;

const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function isIsoUtcTimestamp(value: unknown): value is IsoUtcTimestamp {
  if (typeof value !== 'string' || !ISO_UTC_PATTERN.test(value)) {
    return false;
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

export function assertIsoUtcTimestamp(
  value: unknown,
  fieldName = 'timestamp',
): IsoUtcTimestamp {
  if (!isIsoUtcTimestamp(value)) {
    throw new Error(`Invalid ISO UTC timestamp for ${fieldName}`);
  }
  return value;
}

export function toIsoUtcString(date: Date): IsoUtcTimestamp {
  return date.toISOString();
}

export function parseIsoUtc(value: IsoUtcTimestamp): Date {
  assertIsoUtcTimestamp(value);
  return new Date(value);
}

export function compareIsoUtc(a: IsoUtcTimestamp, b: IsoUtcTimestamp): number {
  return parseIsoUtc(a).getTime() - parseIsoUtc(b).getTime();
}
