/**
 * Conservative query normalisation. No stemming, translation, or LLM rewrite.
 */
export function normaliseAssistantQuery(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s?-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const MAX_ASSISTANT_QUESTION_LENGTH = 500;
