import type { EdgeBenchmarkRunSummary, EdgePipelineStageId } from './types';

export type EdgeBottleneckRank = {
  readonly stage: EdgePipelineStageId;
  readonly durationMs: number;
  readonly shareOfMeasured: number;
};

const RANKABLE: readonly EdgePipelineStageId[] = [
  'whisper_load',
  'whisper_inference',
  'qwen_load',
  'qwen_inference',
];

/**
 * Rank measured stages by duration. Ignores nulls and the aggregate `total`.
 * Returns empty when no stage timings exist yet (device pending).
 */
export function rankEdgeBottlenecks(
  summary: EdgeBenchmarkRunSummary | null,
): readonly EdgeBottleneckRank[] {
  if (!summary) {
    return [];
  }

  const measured = summary.stages
    .filter((s) => RANKABLE.includes(s.stage) && s.durationMs != null && s.durationMs > 0)
    .map((s) => ({ stage: s.stage, durationMs: s.durationMs as number }));

  const sum = measured.reduce((acc, row) => acc + row.durationMs, 0);
  if (sum <= 0) {
    return [];
  }

  return measured
    .map((row) => ({
      stage: row.stage,
      durationMs: row.durationMs,
      shareOfMeasured: row.durationMs / sum,
    }))
    .sort((a, b) => b.durationMs - a.durationMs);
}

export function primaryBottleneck(
  summary: EdgeBenchmarkRunSummary | null,
): EdgeBottleneckRank | null {
  const ranks = rankEdgeBottlenecks(summary);
  return ranks[0] ?? null;
}
