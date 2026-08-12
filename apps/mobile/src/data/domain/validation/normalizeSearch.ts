/**
 * Offline search normalisation for client names.
 * Preserves local-language characters; no aggressive transliteration.
 */
export function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
