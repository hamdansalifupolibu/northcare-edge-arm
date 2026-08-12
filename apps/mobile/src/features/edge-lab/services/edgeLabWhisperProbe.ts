import { Directory, File, Paths } from 'expo-file-system';
import { initWhisper } from 'whisper.rn';

import { WhisperModelManager } from '../../voice/providers/transcription/whisperModelManager';
import { WHISPER_TRANSCRIPTION_OPTIONS } from '../../voice/providers/transcription/whisperTranscriptionOptions';
import { cleanWhisperTranscript } from '../../voice/providers/transcription/WhisperTranscriptionProvider';

export type EdgeLabWhisperProbeResult = {
  readonly ok: boolean;
  readonly whisperLoadMs: number | null;
  /** Includes native M4A decode + Whisper inference (not separable in JS). */
  readonly whisperTranscribeTotalMs: number | null;
  readonly transcriptCharCount: number | null;
  /** In-memory only for optional Qwen stage — never written to evidence logs. */
  readonly transcriptTextForLabOnly: string | null;
  /** Actual GGML filename loaded (lab override or production manifest). */
  readonly modelFilenameUsed: string | null;
  readonly error: string | null;
  readonly whisperLoadWasCold: true;
};

export type EdgeLabWhisperProbeOptions = {
  readonly onLoadStart?: () => void;
  readonly onTranscribeStart?: () => void;
  /** Lab-only override — does not mutate production WHISPER_TRANSCRIPTION_OPTIONS. */
  readonly maxThreads?: number;
  /** Lab-only prompt override (may be empty). */
  readonly prompt?: string;
  readonly speedUp?: boolean;
  /** Lab-only alternate GGML filename in documents/whisper/. */
  readonly modelFilename?: string;
};

function stripFileScheme(uri: string): string {
  return uri.startsWith('file://') ? uri.substring(7) : uri;
}

/**
 * Lab-owned Whisper probe. Does not call createVoiceServices or write SQLite.
 * Uses a fresh initWhisper context so load timing is measurable independently
 * of the production provider cache.
 */
export async function runEdgeLabWhisperProbe(
  audioUri: string,
  probeOptions: EdgeLabWhisperProbeOptions = {},
): Promise<EdgeLabWhisperProbeResult> {
  const manager = WhisperModelManager.getInstance();
  await manager.refreshState();
  const snapshot = manager.getSnapshot();

  let modelPath: string | null = null;
  let modelFilenameUsed: string | null = null;
  if (probeOptions.modelFilename) {
    const labModel = new File(new Directory(Paths.document, 'whisper'), probeOptions.modelFilename);
    if (!labModel.exists) {
      return {
        ok: false,
        whisperLoadMs: null,
        whisperTranscribeTotalMs: null,
        transcriptCharCount: null,
        transcriptTextForLabOnly: null,
        modelFilenameUsed: null,
        error: 'whisper_lab_model_missing',
        whisperLoadWasCold: true,
      };
    }
    modelPath = stripFileScheme(labModel.uri);
    modelFilenameUsed = probeOptions.modelFilename;
  } else if (snapshot.state === 'ready') {
    modelPath = stripFileScheme(manager.getModelUri());
    modelFilenameUsed = snapshot.filename;
  } else {
    return {
      ok: false,
      whisperLoadMs: null,
      whisperTranscribeTotalMs: null,
      transcriptCharCount: null,
      transcriptTextForLabOnly: null,
      modelFilenameUsed: null,
      error: 'whisper_model_not_ready',
      whisperLoadWasCold: true,
    };
  }

  let context: {
    transcribe: (
      path: string,
      options: Record<string, unknown>,
    ) => { promise: Promise<{ result?: string }> };
    release?: () => Promise<void>;
  } | null = null;

  try {
    probeOptions.onLoadStart?.();
    const loadStarted = Date.now();
    context = await initWhisper({ filePath: modelPath });
    const whisperLoadMs = Date.now() - loadStarted;

    const audioPath = stripFileScheme(audioUri);
    const options = {
      language: 'en',
      ...WHISPER_TRANSCRIPTION_OPTIONS,
      ...(typeof probeOptions.maxThreads === 'number'
        ? { maxThreads: probeOptions.maxThreads }
        : {}),
      ...(typeof probeOptions.prompt === 'string' ? { prompt: probeOptions.prompt } : {}),
      ...(typeof probeOptions.speedUp === 'boolean' ? { speedUp: probeOptions.speedUp } : {}),
    };

    probeOptions.onTranscribeStart?.();
    const inferStarted = Date.now();
    const { promise } = context.transcribe(audioPath, options);
    const { result } = await promise;
    const whisperTranscribeTotalMs = Date.now() - inferStarted;

    const cleaned = cleanWhisperTranscript(result || '');
    return {
      ok: true,
      whisperLoadMs,
      whisperTranscribeTotalMs,
      transcriptCharCount: cleaned.length,
      transcriptTextForLabOnly: cleaned,
      modelFilenameUsed,
      error: null,
      whisperLoadWasCold: true,
    };
  } catch {
    return {
      ok: false,
      whisperLoadMs: null,
      whisperTranscribeTotalMs: null,
      transcriptCharCount: null,
      transcriptTextForLabOnly: null,
      modelFilenameUsed,
      error: 'whisper_probe_failed',
      whisperLoadWasCold: true,
    };
  } finally {
    if (context && typeof context.release === 'function') {
      try {
        await context.release();
      } catch {
        // ignore release errors
      }
    }
  }
}
