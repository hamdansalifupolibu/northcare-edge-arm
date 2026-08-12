/**
 * Provisional transcription quality proxy for Edge Lab until fixture goldens exist.
 * Uses success + transcript length stability vs baseline — NOT WER.
 * Never inspects transcript text in logs/exports.
 */
export function scoreProvisionalTranscriptionQuality(options: {
  readonly success: boolean;
  readonly baselineTranscriptCharCount: number | null;
  readonly candidateTranscriptCharCount: number | null;
}): number | null {
  if (!options.success) {
    return 0;
  }
  if (
    options.baselineTranscriptCharCount == null ||
    options.candidateTranscriptCharCount == null ||
    options.baselineTranscriptCharCount <= 0
  ) {
    return null;
  }

  const ratio =
    options.candidateTranscriptCharCount / options.baselineTranscriptCharCount;
  const drift = Math.abs(1 - ratio);

  // Within 15% length of baseline → high provisional score.
  if (drift <= 0.15) {
    return 96;
  }
  if (drift <= 0.3) {
    return 88;
  }
  if (drift <= 0.5) {
    return 75;
  }
  return 60;
}

/** Baseline reference quality when the baseline run itself succeeded. */
export const BASELINE_REFERENCE_QUALITY = 100;
