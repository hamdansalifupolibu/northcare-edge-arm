import baselineConfigJson from './baselineConfig.json';

/**
 * Phase 1 frozen baseline for NorthCare Edge.
 * Mirror of production Voice-to-Care / offline-AI config — not an optimization result.
 * Do not treat this object as a runtime override for clinical providers.
 */
export const EDGE_BASELINE_CONFIG = baselineConfigJson;

export type EdgeBaselineConfig = typeof EDGE_BASELINE_CONFIG;

export function formatBaselineBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
