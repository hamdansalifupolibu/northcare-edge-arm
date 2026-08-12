/**
 * Edge Lab metric shapes.
 * Keep payloads free of transcripts, audio bytes, tokens, PINs, or health identifiers.
 */

export type EdgeExperimentVerdict = 'accepted' | 'rejected' | 'inconclusive' | 'pending';

/**
 * Pipeline stages.
 * Note: on current whisper.rn + patch, M4A decode runs inside transcribe() and
 * cannot be timed separately from inference in JS. See whisperTranscribeBundlesDecode.
 */
export type EdgePipelineStageId =
  | 'm4a_decode'
  | 'whisper_load'
  | 'whisper_inference'
  | 'qwen_load'
  | 'qwen_inference'
  | 'total';

export type EdgeStageTimingMs = {
  readonly stage: EdgePipelineStageId;
  /** Null when not measurable or not run. */
  readonly durationMs: number | null;
};

/**
 * Privacy-safe Arm device evidence.
 * Populate from the device — never invent SoC / ABI values in docs.
 */
export type EdgeArmDeviceEvidence = {
  readonly marketingName: string | null;
  readonly model: string | null;
  readonly androidVersion: string | null;
  readonly abi: string | null;
  readonly soc: string | null;
  readonly cpuCoreCount: number | null;
  readonly backend: 'cpu' | string;
  readonly nativeLibraryAbi: string | null;
  readonly platformOs: string | null;
};

/**
 * One benchmark run summary. Privacy-safe for logcat / AsyncStorage / export.
 */
export type EdgeLabOverrides = {
  readonly experimentId?: string;
  readonly whisperMaxThreads?: number;
  /** Lab-only prompt override; empty string allowed. */
  readonly whisperPrompt?: string;
  /** Lab-only whisper.rn speedUp flag. */
  readonly whisperSpeedUp?: boolean;
  /** Lab-only model filename under app documents /whisper/. */
  readonly whisperModelFilename?: string;
  /**
   * Lab-only: write synthetic fixture transcript to documents for golden authoring.
   * Never enable in production clinical flows.
   */
  readonly captureFixtureTranscript?: boolean;
};

export type EdgeQualityBreakdownSummary = {
  readonly method: string;
  readonly phrasesMatched: number | null;
  readonly phrasesTotal: number | null;
  readonly extractionKeysPresent: number | null;
  readonly extractionKeysTotal: number | null;
  readonly extractionJsonParsed: boolean | null;
};

export type EdgeBenchmarkRunSummary = {
  readonly schemaVersion: 1;
  readonly runId: string;
  readonly capturedAtIso: string | null;
  readonly configFreezeId: string;
  readonly configHash: string | null;
  readonly fixtureId: string | null;
  readonly experimentId: string | null;
  readonly labOverrides: EdgeLabOverrides | null;
  readonly device: EdgeArmDeviceEvidence;
  readonly stages: readonly EdgeStageTimingMs[];
  /**
   * True when whisper_inference duration includes native M4A decode
   * (decode not separable in JS today).
   */
  readonly whisperTranscribeBundlesDecode: boolean;
  /** Whether Whisper initWhisper was timed as a fresh lab context load. */
  readonly whisperLoadWasCold: boolean;
  readonly tokensPerSecond: number | null;
  readonly generatedTokenCount: number | null;
  /** Character count only — never the transcript text. */
  readonly transcriptCharCount: number | null;
  readonly peakMemoryBytes: number | null;
  /** Observational battery % delta only — not claimed model energy. */
  readonly batteryLevelChangePercent: number | null;
  readonly startTemperatureC: number | null;
  readonly endTemperatureC: number | null;
  readonly success: boolean | null;
  readonly qualityScore: number | null;
  /** Privacy-safe quality breakdown (counts only — no transcript text). */
  readonly qualityBreakdown: EdgeQualityBreakdownSummary | null;
  readonly verdict: EdgeExperimentVerdict;
  /** Safe error category / short message — never includes transcript or paths with PHI. */
  readonly error: string | null;
  readonly notes: readonly string[];
};

export type EdgeLabHarnessMode = 'ui' | 'auto';
