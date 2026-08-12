import type { EdgeExperimentVerdict } from './types';

/**
 * Provisional quality thresholds for NorthCare Edge.
 * Tune only after Phase 3 establishes a real quality measurement on the fixture.
 */
export const EDGE_QUALITY_GATE_DEFAULTS = {
  /** Minimum relative latency improvement to count as a performance win. */
  minLatencyImprovementRatio: 0.05,
  /**
   * Maximum allowed quality drop (absolute points on 0–100 scale).
   * Example: 94 → 89 is a 5-point drop.
   */
  maxQualityDropPoints: 5,
} as const;

export type EdgeQualityGateInput = {
  readonly baselineLatencyMs: number | null;
  readonly candidateLatencyMs: number | null;
  /** 0–100 quality scores; null means quality not measured yet. */
  readonly baselineQuality: number | null;
  readonly candidateQuality: number | null;
  readonly minLatencyImprovementRatio?: number;
  readonly maxQualityDropPoints?: number;
};

export type EdgeQualityGateResult = {
  readonly verdict: EdgeExperimentVerdict;
  readonly latencyImprovementRatio: number | null;
  readonly qualityDeltaPoints: number | null;
  readonly reasons: readonly string[];
};

/**
 * Faster + acceptable quality → accepted.
 * Faster + significant quality drop → rejected.
 * Missing measurements → pending / inconclusive (never invent numbers).
 */
export function evaluateEdgeQualityGate(input: EdgeQualityGateInput): EdgeQualityGateResult {
  const minGain =
    input.minLatencyImprovementRatio ?? EDGE_QUALITY_GATE_DEFAULTS.minLatencyImprovementRatio;
  const maxDrop = input.maxQualityDropPoints ?? EDGE_QUALITY_GATE_DEFAULTS.maxQualityDropPoints;
  const reasons: string[] = [];

  if (
    input.baselineLatencyMs == null ||
    input.candidateLatencyMs == null ||
    input.baselineLatencyMs <= 0 ||
    input.candidateLatencyMs <= 0
  ) {
    return {
      verdict: 'pending',
      latencyImprovementRatio: null,
      qualityDeltaPoints: null,
      reasons: ['Latency not measured for both baseline and candidate.'],
    };
  }

  const latencyImprovementRatio =
    (input.baselineLatencyMs - input.candidateLatencyMs) / input.baselineLatencyMs;

  if (input.baselineQuality == null || input.candidateQuality == null) {
    reasons.push('Quality not measured for both baseline and candidate.');
    if (latencyImprovementRatio >= minGain) {
      reasons.push('Performance improved, but quality gate cannot pass without quality scores.');
      return {
        verdict: 'pending',
        latencyImprovementRatio,
        qualityDeltaPoints: null,
        reasons,
      };
    }
    reasons.push('Performance did not meet minimum improvement threshold.');
    return {
      verdict: 'inconclusive',
      latencyImprovementRatio,
      qualityDeltaPoints: null,
      reasons,
    };
  }

  const qualityDeltaPoints = input.candidateQuality - input.baselineQuality;
  const qualityDrop = -qualityDeltaPoints;

  if (latencyImprovementRatio < minGain) {
    reasons.push(
      `Latency improvement ${(latencyImprovementRatio * 100).toFixed(1)}% below minimum ${(minGain * 100).toFixed(0)}%.`,
    );
    return {
      verdict: 'rejected',
      latencyImprovementRatio,
      qualityDeltaPoints,
      reasons,
    };
  }

  if (qualityDrop > maxDrop) {
    reasons.push(
      `Quality dropped ${qualityDrop.toFixed(1)} points (limit ${maxDrop}). Faster but rejected.`,
    );
    return {
      verdict: 'rejected',
      latencyImprovementRatio,
      qualityDeltaPoints,
      reasons,
    };
  }

  reasons.push('Performance improved and quality remained within threshold.');
  return {
    verdict: 'accepted',
    latencyImprovementRatio,
    qualityDeltaPoints,
    reasons,
  };
}
