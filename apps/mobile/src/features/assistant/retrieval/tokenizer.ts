const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'for',
  'is',
  'are',
  'was',
  'were',
  'what',
  'how',
  'do',
  'does',
  'can',
  'i',
  'about',
]);

export function tokenize(text: string): readonly string[] {
  if (!text) {
    return [];
  }
  return text
    .split(/[\s?/,-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}
