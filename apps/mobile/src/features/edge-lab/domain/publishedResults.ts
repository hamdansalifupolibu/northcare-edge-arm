/**
 * Published S20 Ultra evidence for judge-facing UI.
 * Numbers match benchmarks/raw + BASELINE_TO_DONE_TRAIL — never invent here.
 */
export const EDGE_PUBLISHED_RESULTS = {
  deviceLabel: 'Samsung Galaxy S20 Ultra · SM-G988B · arm64-v8a',
  freezeId: 'northcare-edge-baseline-2026-08-11',
  baselineRunId: 'edge_msp5nrdb_2sfe',
  optimizedRunId: 'edge_msp6cf7n_d5qs',
  qualityVerifyTinyRunId: 'edge_mspazssb_br9p',
  experimentId: 'exp-06-smaller-whisper-conditional',
  baselineWhisperModel: 'ggml-base.en.bin',
  optimizedWhisperModel: 'ggml-tiny.en.bin',
  baseline: {
    whisperInferenceMs: 42367,
    totalMs: 53962,
    whisperBytes: 147964211,
  },
  optimized: {
    whisperInferenceMs: 19564,
    totalMs: 26508,
    whisperBytes: 77704715,
  },
  /** Relative improvements: positive = faster / smaller. */
  improvement: {
    whisperInferenceRatio: 0.538,
    totalRatio: 0.509,
    whisperStorageRatio: 0.475,
  },
  /**
   * Fixture accuracy (phrase + extraction keys), not length-proxy.
   * Tiny verified on edge_mspazssb_br9p: 4/4 phrases + 2/2 keys → 100.
   */
  fixtureQuality: {
    method: 'fixture_combined_v1',
    baseline: 100,
    optimized: 100,
    deltaPoints: 0,
    phrasesTotal: 4,
  },
  headline: '−53.8% Whisper · −50.9% end-to-end · quality 100/100',
  statusLine: 'EXP-06 shipped · fixture phrase quality gate passed',
} as const;
