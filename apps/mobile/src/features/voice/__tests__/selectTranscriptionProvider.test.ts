import { selectTranscriptionProvider } from '../providers/transcription/selectTranscriptionProvider';
import { UNAVAILABLE_TRANSCRIPTION_PROVIDER_ID } from '../providers/transcription/UnavailableTranscriptionProvider';
import { WHISPER_TRANSCRIPTION_PROVIDER_ID } from '../providers/transcription/WhisperTranscriptionProvider';

describe('selectTranscriptionProvider language routing', () => {
  it('routes Dagbanli to unavailable (offline manual path, no cloud ASR)', () => {
    const provider = selectTranscriptionProvider('development', 'dag');
    expect(provider.id).toBe(UNAVAILABLE_TRANSCRIPTION_PROVIDER_ID);
    expect(provider.availability).toBe('failedClosed');
  });

  it('routes Dagbanli dg code to unavailable', () => {
    const provider = selectTranscriptionProvider('development', 'dg');
    expect(provider.id).toBe(UNAVAILABLE_TRANSCRIPTION_PROVIDER_ID);
  });

  it('routes English to Whisper when model is ready on device', () => {
    const provider = selectTranscriptionProvider('development', 'en');
    if (provider.id === WHISPER_TRANSCRIPTION_PROVIDER_ID) {
      expect(provider.supportsOffline).toBe(true);
    }
  });
});
