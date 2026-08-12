import type { EntityId } from '../../../data/domain/value-objects/EntityId';

/**
 * Provisional local referral reference derived from UUID.
 * Format: NCR-XXXXXXXX (8 hex chars from trailing id bytes).
 * PROVISIONAL — REVIEW BEFORE PILOT DEPLOYMENT
 * See docs/architecture/REFERRAL_REFERENCE_CODE.md
 */
export function provisionalReferralCodeFromId(id: EntityId | string): string {
  const compact = id.replace(/-/g, '').slice(-8).toUpperCase();
  return `NCR-${compact}`;
}
