import { assertRecordingTransition, type RecordingState } from '../domain/states';
import { VoiceError } from '../domain/errors';

export type VoiceRecorderAdapter = {
  prepare(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<{ uri: string | null; durationMs: number | null }>;
  cancel(): Promise<void>;
  getDurationMs(): number;
};

/**
 * Typed recording controller — React-independent; UI supplies expo-audio adapter.
 */
export function createVoiceRecorderController(adapter: VoiceRecorderAdapter) {
  let state: RecordingState = 'idle';

  function transition(to: RecordingState): void {
    assertRecordingTransition(state, to);
    state = to;
  }

  return {
    getState(): RecordingState {
      return state;
    },
    async prepare(): Promise<void> {
      transition('preparing');
      try {
        await adapter.prepare();
        transition('ready');
      } catch {
        transition('failed');
        throw new VoiceError('recordingFailed', 'The recorder could not be prepared.');
      }
    },
    async start(): Promise<void> {
      if (state !== 'ready' && state !== 'paused') {
        throw new VoiceError(
          'invalidStateTransition',
          'Recording can only start when the recorder is ready or paused.',
        );
      }
      if (state === 'paused') {
        await adapter.resume();
        transition('recording');
        return;
      }
      await adapter.start();
      transition('recording');
    },
    async pause(): Promise<void> {
      assertRecordingTransition(state, 'paused');
      await adapter.pause();
      transition('paused');
    },
    async stop(): Promise<{ uri: string | null; durationMs: number | null }> {
      assertRecordingTransition(state, 'stopping');
      transition('stopping');
      try {
        const result = await adapter.stop();
        transition('recorded');
        return result;
      } catch {
        transition('failed');
        throw new VoiceError('recordingFailed', 'Recording could not be stopped safely.');
      }
    },
    async cancel(): Promise<void> {
      try {
        await adapter.cancel();
      } finally {
        if (state !== 'discarded') {
          transition('discarded');
        }
      }
    },
    markPlaying(): void {
      assertRecordingTransition(state, 'playing');
      transition('playing');
    },
    markPlaybackStopped(): void {
      if (state === 'playing') {
        transition('recorded');
      }
    },
    forceFailed(): void {
      if (state !== 'failed' && state !== 'discarded' && state !== 'confirmed') {
        transition('failed');
      }
    },
    resetToReady(): void {
      assertRecordingTransition(state, 'ready');
      transition('ready');
    },
  };
}

export type VoiceRecorderController = ReturnType<typeof createVoiceRecorderController>;
