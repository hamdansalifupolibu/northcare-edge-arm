export type PrivacyPrecheckResult = {
  readonly flagged: boolean;
  readonly reasons: readonly string[];
  /** Never store or log the raw question. */
  readonly message: string | null;
};

const PHONE_LIKE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const EMAIL_LIKE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

/**
 * Lightweight heuristic only. Does not claim complete identifier detection.
 */
export function runPrivacyPrecheck(question: string): PrivacyPrecheckResult {
  const reasons: string[] = [];
  if (PHONE_LIKE.test(question)) {
    reasons.push('phoneLikePattern');
  }
  if (EMAIL_LIKE.test(question)) {
    reasons.push('emailLikePattern');
  }
  if (reasons.length === 0) {
    return { flagged: false, reasons: [], message: null };
  }
  return {
    flagged: true,
    reasons,
    message:
      'This question may include identifying details. Remove names, phone numbers or other personal details before asking.',
  };
}
