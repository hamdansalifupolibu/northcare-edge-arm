import { WHISPER_TRANSCRIPTION_OPTIONS } from '../providers/transcription/whisperTranscriptionOptions';

describe('whisperTranscriptionOptions', () => {
  it('uses greedy decoding for faster field-note transcription', () => {
    expect(WHISPER_TRANSCRIPTION_OPTIONS.beamSize).toBe(1);
    expect(WHISPER_TRANSCRIPTION_OPTIONS.bestOf).toBe(1);
  });

  it('keeps deterministic temperature and disables speedUp until validated', () => {
    expect(WHISPER_TRANSCRIPTION_OPTIONS.temperature).toBe(0);
    expect(WHISPER_TRANSCRIPTION_OPTIONS.speedUp).toBe(false);
  });
});
