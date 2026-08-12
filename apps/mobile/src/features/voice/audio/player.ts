import { VoiceError } from '../domain/errors';

export type VoicePlayerAdapter = {
  load(uri: string): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  unload(): Promise<void>;
};

export function createVoicePlayerController(adapter: VoicePlayerAdapter) {
  let loadedUri: string | null = null;
  let playing = false;

  return {
    isPlaying(): boolean {
      return playing;
    },
    getLoadedUri(): string | null {
      return loadedUri;
    },
    async load(uri: string): Promise<void> {
      try {
        await adapter.load(uri);
        loadedUri = uri;
        playing = false;
      } catch {
        throw new VoiceError('playbackFailed', 'Playback could not be prepared.');
      }
    },
    async play(): Promise<void> {
      if (!loadedUri) {
        throw new VoiceError('playbackFailed', 'No recording is loaded for playback.');
      }
      await adapter.play();
      playing = true;
    },
    async pause(): Promise<void> {
      await adapter.pause();
      playing = false;
    },
    async stop(): Promise<void> {
      await adapter.stop();
      playing = false;
    },
    async unload(): Promise<void> {
      await adapter.unload();
      loadedUri = null;
      playing = false;
    },
  };
}

export type VoicePlayerController = ReturnType<typeof createVoicePlayerController>;
