import { getOfflineAiServices } from '../../offline-ai/services/createOfflineAiServices';

/** Fixed synthetic note used when Whisper produced no text — never a real patient record. */
export const EDGE_LAB_SYNTHETIC_EXTRACTION_NOTE =
  'Synthetic lab note: child aged two years, temperature thirty eight point five, mild cough, no danger signs mentioned.';

export type EdgeLabQwenProbeResult = {
  readonly ok: boolean;
  readonly qwenLoadMs: number | null;
  readonly qwenInferenceMs: number | null;
  readonly tokensPerSecond: number | null;
  readonly generatedTokenCount: number | null;
  /** In-memory only for lab quality scoring — never evidence-logged. */
  readonly rawTextForLabOnly: string | null;
  readonly error: string | null;
};

/**
 * Lab Qwen probe via offline-AI lifecycle. No Voice-to-Care SQLite apply.
 * Prompts are never evidence-logged.
 */
export async function runEdgeLabQwenProbe(options?: {
  readonly labTranscript?: string | null;
  readonly onLoadStart?: () => void;
  readonly onInferStart?: () => void;
}): Promise<EdgeLabQwenProbeResult> {
  const ai = getOfflineAiServices();

  try {
    await ai.refreshStateFromDisk();
    const before = ai.getSnapshot();
    if (before.state === 'missing' || before.state === 'unsupported') {
      return {
        ok: false,
        qwenLoadMs: null,
        qwenInferenceMs: null,
        tokensPerSecond: null,
        generatedTokenCount: null,
        rawTextForLabOnly: null,
        error: 'qwen_model_not_ready',
      };
    }

    // Force a timed load when possible so qwen_load is visible in the breakdown.
    if (before.state === 'loaded' || before.state === 'generating') {
      await ai.releaseModel();
    }

    options?.onLoadStart?.();
    await ai.loadModel();
    const loaded = ai.getSnapshot();
    const qwenLoadMs = loaded.lastTiming?.loadMs ?? null;
    if (loaded.state !== 'loaded') {
      return {
        ok: false,
        qwenLoadMs,
        qwenInferenceMs: null,
        tokensPerSecond: null,
        generatedTokenCount: null,
        rawTextForLabOnly: null,
        error: 'qwen_load_failed',
      };
    }

    const note =
      options?.labTranscript && options.labTranscript.trim().length > 0
        ? options.labTranscript.trim()
        : EDGE_LAB_SYNTHETIC_EXTRACTION_NOTE;

    options?.onInferStart?.();
    const gen = await ai.generate({
      systemPrompt:
        'You are a lab extraction timer for NorthCare Edge. Reply with ONLY a compact JSON object. Do not diagnose.',
      userPrompt: `Extract fields as JSON with keys symptomSummary and urgencyLevel from this synthetic note: "${note}"`,
      expectPhrase: '{',
    });

    return {
      ok: true,
      qwenLoadMs,
      qwenInferenceMs: gen.timing.completionMs,
      tokensPerSecond: gen.timing.tokensPerSecond,
      generatedTokenCount: gen.timing.generatedTokenCount,
      rawTextForLabOnly: typeof gen.text === 'string' ? gen.text : null,
      error: null,
    };
  } catch {
    const snap = ai.getSnapshot();
    return {
      ok: false,
      qwenLoadMs: snap.lastTiming?.loadMs ?? null,
      qwenInferenceMs: null,
      tokensPerSecond: null,
      generatedTokenCount: null,
      rawTextForLabOnly: null,
      error: 'qwen_probe_failed',
    };
  }
}
