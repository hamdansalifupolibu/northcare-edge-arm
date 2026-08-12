import { initWhisper } from 'whisper.rn';
import type {
  VoiceTranscriptionProvider,
  VoiceTranscriptionRequest,
  VoiceTranscriptionResult,
} from '../../domain/providers';
import { WhisperModelManager } from './whisperModelManager';
import { WHISPER_TRANSCRIPTION_OPTIONS } from './whisperTranscriptionOptions';

export const WHISPER_TRANSCRIPTION_PROVIDER_ID = 'offline.whisper.transcription.v1';

let cachedContext: any = null;
let cachedModelPath: string | null = null;

async function getOrInitWhisper(filePath: string): Promise<any> {
  if (cachedContext && cachedModelPath === filePath) {
    return cachedContext;
  }
  if (cachedContext) {
    try {
      await cachedContext.release();
    } catch {
      // ignore
    }
    cachedContext = null;
  }
  cachedContext = await initWhisper({ filePath });
  cachedModelPath = filePath;
  return cachedContext;
}

/** Preloads the Whisper model context into memory to eliminate latency when recording finishes. */
export async function preloadWhisperModel(): Promise<void> {
  const manager = WhisperModelManager.getInstance();
  const snapshot = manager.getSnapshot();
  if (snapshot.state !== 'ready') return;
  try {
    const modelUri = manager.getModelUri();
    let filePath = modelUri;
    if (filePath.startsWith('file://')) {
      filePath = filePath.substring(7);
    }
    await getOrInitWhisper(filePath);
  } catch (err) {
    console.warn('Failed to preload Whisper model:', err);
  }
}

/** Cleans common Whisper hallucinations and closed-caption bracket markers from raw model output. */
export function cleanWhisperTranscript(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // Remove square brackets like [Intense Music], [Laughter], [Silence], [Applause]
  cleaned = cleaned.replace(/\[[^\]]+\]/g, ' ');

  // Remove parentheses like (Music), (coughing), (applause)
  cleaned = cleaned.replace(/\([^)]+\)/g, ' ');

  // Remove common unbracketed Whisper hallucinations (base.en model artefacts).
  // These appear as plain-text phrases, not bracketed captions.
  const unbracketedHallucinations = [
    /intense music/gi,
    /suspense music/gi,
    /dramatic music/gi,
    /sad music/gi,
    /tense music/gi,
    /epic music/gi,
    /emotional music/gi,
    /romantic music/gi,
    /heroic music/gi,
    /upbeat music/gi,
    /melancholy music/gi,
    /music playing/gi,
    /background music/gi,
    /[♪♫]+/g,
    /thank\s+you\s+for\s+watching/gi,
    /thank\s+you\s+very\s+much/gi,
    /subtitles\s+by/gi,
    /subscribe\s+to/gi,
    /you\s+watching/gi,
    /intro\s+music/gi,
    /outro\s+music/gi,
  ];

  for (const pattern of unbracketedHallucinations) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export function createWhisperTranscriptionProvider(): VoiceTranscriptionProvider {
  return {
    id: WHISPER_TRANSCRIPTION_PROVIDER_ID,
    version: '1',
    availability: 'available',
    supportsOffline: true,
    isSynthetic: false,
    async transcribe(input: VoiceTranscriptionRequest): Promise<VoiceTranscriptionResult> {
      const manager = WhisperModelManager.getInstance();
      const snapshot = manager.getSnapshot();
      if (snapshot.state !== 'ready') {
        return {
          providerId: WHISPER_TRANSCRIPTION_PROVIDER_ID,
          providerVersion: '1',
          status: 'failed',
          transcriptText: null,
          detectedLanguage: null,
          isPartial: false,
          isSynthetic: false,
          connectivityRequired: false,
          errorCategory: 'modelMissing',
          confidenceCategory: 'uncertain',
        };
      }

      try {
        const modelUri = manager.getModelUri();
        let filePath = modelUri;
        if (filePath.startsWith('file://')) {
          filePath = filePath.substring(7);
        }

        const context = await getOrInitWhisper(filePath);

        let audioPath = input.audioUri;
        if (audioPath.startsWith('file://')) {
          audioPath = audioPath.substring(7);
        }

        const options = {
          language: input.languageHint || 'en',
          ...WHISPER_TRANSCRIPTION_OPTIONS,
        };

        console.info('Whisper transcription starting', {
          audioPath,
          audioDurationMs: input.durationMs,
          language: options.language,
        });

        const t0 = Date.now();
        const { promise } = context.transcribe(audioPath, options);
        const { result } = await promise;
        const elapsedMs = Date.now() - t0;

        const rawText = result || '';
        const cleanedText = cleanWhisperTranscript(rawText);

        console.info('Whisper transcription complete', {
          audioDurationMs: input.durationMs,
          transcriptionMs: elapsedMs,
          rawLength: rawText.length,
          cleanedLength: cleanedText.length,
          rawPreview: rawText.substring(0, 120),
        });

        return {
          providerId: WHISPER_TRANSCRIPTION_PROVIDER_ID,
          providerVersion: '1',
          status: 'completed',
          transcriptText: cleanedText,
          detectedLanguage: input.languageHint || 'en',
          isPartial: false,
          isSynthetic: false,
          connectivityRequired: false,
          errorCategory: null,
          confidenceCategory: 'high',
        };
      } catch (err) {
        console.error('WHISPER TRANSCRIBE CRITICAL ERROR:', err);
        return {
          providerId: WHISPER_TRANSCRIPTION_PROVIDER_ID,
          providerVersion: '1',
          status: 'failed',
          transcriptText: null,
          detectedLanguage: null,
          isPartial: false,
          isSynthetic: false,
          connectivityRequired: false,
          errorCategory: err instanceof Error ? err.message : String(err),
          confidenceCategory: 'uncertain',
        };
      }
    },
  };
}
