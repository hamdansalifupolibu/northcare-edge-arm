import type { EdgePipelineStageId } from './types';

export function formatEdgeMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) {
    return '—';
  }
  if (ms >= 10_000) {
    return `${(ms / 1000).toFixed(1)} s`;
  }
  return `${Math.round(ms)} ms`;
}

export function edgeStageLabel(stage: EdgePipelineStageId): string {
  switch (stage) {
    case 'm4a_decode':
      return 'M4A decode';
    case 'whisper_load':
      return 'Whisper load';
    case 'whisper_inference':
      return 'Transcribe (decode+infer)';
    case 'qwen_load':
      return 'Qwen load';
    case 'qwen_inference':
      return 'Qwen inference';
    case 'total':
      return 'Total';
    default:
      return stage;
  }
}

export function shortRunId(runId: string | null | undefined): string {
  if (!runId) {
    return '—';
  }
  return runId.length > 18 ? `${runId.slice(0, 18)}…` : runId;
}
