import type { VoiceProcessingStep } from '../components/VoiceProcessingSteps';
import type { VoiceAnalysisStep } from '../components/VoiceAnalysisProcessingSteps';

export type ProcessingProgressCurve = 'linear' | 'easeOut';

type EstimateOptions = {
  readonly cap?: number;
  readonly curve?: ProcessingProgressCurve;
};

/**
 * Maps elapsed time to 0–cap while work is in-flight.
 * easeOut moves quickly at first then slows near the cap — feels responsive without lying at 99% for ages.
 */
export function estimateProcessingPercent(
  elapsedMs: number,
  estimatedDurationMs: number,
  options: EstimateOptions = {},
): number {
  const cap = options.cap ?? 99;
  if (estimatedDurationMs <= 0 || elapsedMs <= 0) {
    return 0;
  }
  if (options.curve === 'easeOut') {
    const t = elapsedMs / estimatedDurationMs;
    const eased = 1 - Math.exp(-2.6 * t);
    return Math.min(cap, Math.round(eased * cap));
  }
  return Math.min(cap, Math.round((elapsedMs / estimatedDurationMs) * cap));
}

/** Speech-to-text (Whisper) progress — asymptotic to 99% until transcription resolves. */
export function speechTranscriptionPercent(elapsedMs: number, estimatedDurationMs: number): number {
  return estimateProcessingPercent(elapsedMs, estimatedDurationMs, {
    cap: 99,
    curve: 'easeOut',
  });
}

/** NorthCare AI analysis — phase-aware so applying/saving gets its own 78→100 band. */
export function analysisExtractionPercent(
  phase: 'extracting' | 'applying',
  elapsedMs: number,
): number {
  if (phase === 'applying') {
    const band = estimateProcessingPercent(elapsedMs, 3500, { cap: 22, curve: 'easeOut' });
    return Math.min(100, 78 + band);
  }
  return estimateProcessingPercent(elapsedMs, 18_000, { cap: 78, curve: 'easeOut' });
}

/** Saving a recording locally — short, linear-ish task. */
export function saveRecordingPercent(elapsedMs: number, estimatedDurationMs: number): number {
  return estimateProcessingPercent(elapsedMs, estimatedDurationMs, {
    cap: 99,
    curve: 'easeOut',
  });
}

export function processingStepFromPercent(percent: number): VoiceProcessingStep {
  if (percent < 12) {
    return 'captured';
  }
  if (percent < 72) {
    return 'transcribing';
  }
  return 'preparing';
}

/** @deprecated Use analysisStepFromPercent for AI extraction UI */
export function extractionStepFromPercent(percent: number): VoiceProcessingStep {
  return processingStepFromPercent(percent);
}

export function analysisStepFromPercent(percent: number): VoiceAnalysisStep {
  if (percent < 15) {
    return 'loading';
  }
  if (percent < 42) {
    return 'reading';
  }
  if (percent < 80) {
    return 'extracting';
  }
  return 'preparing';
}
