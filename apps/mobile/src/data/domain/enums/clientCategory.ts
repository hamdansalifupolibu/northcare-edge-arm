/**
 * Controlled client categories.
 * Category changes (e.g. pregnant → postnatal) update the current category field;
 * historical encounters retain their own context. Category history table deferred.
 */
export const CLIENT_CATEGORIES = [
  'pregnant',
  'postnatal',
  'newborn',
  'childUnderFive',
] as const;

export type ClientCategory = (typeof CLIENT_CATEGORIES)[number];

export function isClientCategory(value: unknown): value is ClientCategory {
  return (
    typeof value === 'string' && (CLIENT_CATEGORIES as readonly string[]).includes(value)
  );
}
