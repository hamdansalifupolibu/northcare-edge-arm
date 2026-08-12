import { evaluateEdgeQualityGate, type EdgeQualityGateResult } from './qualityGate';
import type { EdgeBenchmarkRunSummary, EdgePipelineStageId } from './types';

export type EdgeStageDelta = {
  readonly stage: EdgePipelineStageId;
  readonly baselineMs: number | null;
  readonly candidateMs: number | null;
  readonly deltaMs: number | null;
  readonly improvementRatio: number | null;
};

export type EdgeCompareReport = {
  readonly baselineRunId: string | null;
  readonly candidateRunId: string | null;
  readonly stages: readonly EdgeStageDelta[];
  readonly gate: EdgeQualityGateResult;
  readonly notes: readonly string[];
};

function stageDuration(
  summary: EdgeBenchmarkRunSummary | null,
  stage: EdgePipelineStageId,
): number | null {
  if (!summary) {
    return null;
  }
  return summary.stages.find((s) => s.stage === stage)?.durationMs ?? null;
}

const COMPARE_STAGES: readonly EdgePipelineStageId[] = [
  'whisper_load',
  'whisper_inference',
  'qwen_load',
  'qwen_inference',
  'total',
];

export function compareEdgeRuns(
  baseline: EdgeBenchmarkRunSummary | null,
  candidate: EdgeBenchmarkRunSummary | null,
): EdgeCompareReport {
  const notes: string[] = [];
  if (!baseline) {
    notes.push('No designated baseline run yet (connect S20 Ultra and pin a baseline).');
  }
  if (!candidate) {
    notes.push('No candidate/last run yet.');
  }

  const stages: EdgeStageDelta[] = COMPARE_STAGES.map((stage) => {
    const baselineMs = stageDuration(baseline, stage);
    const candidateMs = stageDuration(candidate, stage);
    const deltaMs =
      baselineMs != null && candidateMs != null ? baselineMs - candidateMs : null;
    const improvementRatio =
      baselineMs != null && candidateMs != null && baselineMs > 0
        ? (baselineMs - candidateMs) / baselineMs
        : null;
    return { stage, baselineMs, candidateMs, deltaMs, improvementRatio };
  });

  const gate = evaluateEdgeQualityGate({
    baselineLatencyMs: stageDuration(baseline, 'total'),
    candidateLatencyMs: stageDuration(candidate, 'total'),
    baselineQuality: baseline?.qualityScore ?? null,
    candidateQuality: candidate?.qualityScore ?? null,
  });

  return {
    baselineRunId: baseline?.runId ?? null,
    candidateRunId: candidate?.runId ?? null,
    stages,
    gate,
    notes,
  };
}
