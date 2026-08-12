import type { EntityId } from '../../../data/domain/value-objects/EntityId';

/**
 * Provisional local reference derived from UUID.
 * Uses the trailing hex so short sequential/test IDs remain unique.
 * PROVISIONAL — REVIEW BEFORE PILOT DEPLOYMENT
 */
export function provisionalClientCodeFromId(id: EntityId | string): string {
  const compact = id.replace(/-/g, '').slice(-6).toUpperCase();
  return `NC-${compact}`;
}
