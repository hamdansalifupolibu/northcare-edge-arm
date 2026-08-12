/**
 * Lab configs must never silently replace production Voice-to-Care settings.
 * Promotion requires an explicit human checkpoint (docs/arm/LOCKED_DECISIONS.md §2).
 */

export const EDGE_LAB_PROMOTION_POLICY = {
  labOnlyUntilApproved: true,
  productionVoiceToCareWritableFromLab: false,
  requiresHumanCheckpoint: true,
  documentation: 'docs/arm/LOCKED_DECISIONS.md',
} as const;

export function isEdgeLabConfigPromotedToProduction(): boolean {
  // Phase 1–8: always false. Flip only after an explicit promotion checkpoint.
  return false;
}
