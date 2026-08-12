export const AGE_UNITS = ['days', 'weeks', 'months', 'years'] as const;
export type AgeUnit = (typeof AGE_UNITS)[number];

export function isAgeUnit(value: unknown): value is AgeUnit {
  return typeof value === 'string' && (AGE_UNITS as readonly string[]).includes(value);
}
