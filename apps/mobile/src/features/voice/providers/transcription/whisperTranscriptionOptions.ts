/**
 * Tunable Whisper inference options for on-device English transcription.
 * See docs/development/WHISPER_SPEED_OPTIMIZATION_PLAN.md
 */
export const WHISPER_TRANSCRIPTION_OPTIONS = {
  /** Greedy decoding — faster than beam search for clear single-speaker field notes. */
  beamSize: 1,
  bestOf: 1,
  /** S20 Ultra (Snapdragon 865) has 8 cores; 4 performance threads is a stable default. */
  maxThreads: 4,
  /** Keep deterministic output; non-zero temperature can increase hallucinations. */
  temperature: 0,
  /** Disabled — accuracy prioritised until field testing justifies 2x speed trade-off. */
  speedUp: false,
  prompt:
    'Community health worker recording patient case notes during home visit.',
} as const;

/** Rough UI progress estimate after EXP-06 tiny.en promotion (S20 Ultra fixture ~20 s). */
export const WHISPER_TRANSCRIBE_ESTIMATE_MS = 20_000;
