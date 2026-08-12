import {
  assertRecordingAllowedByConsent,
  createVoiceRecordingConsent,
} from '../domain/consent';
import { VoiceError } from '../domain/errors';

describe('voice recording consent', () => {
  it('never defaults to recorded', () => {
    expect(() =>
      createVoiceRecordingConsent({
        status: 'unknown',
        decidedAt: new Date().toISOString(),
        decidedByAccountId: 'worker-1',
      }),
    ).toThrow(VoiceError);
  });

  it('records explicit consent with version', () => {
    const record = createVoiceRecordingConsent({
      status: 'recorded',
      decidedAt: '2026-08-02T12:00:00.000Z',
      decidedByAccountId: 'worker-1',
    });
    expect(record.status).toBe('recorded');
    expect(record.consentVersion).toContain('voice-recording-consent');
  });

  it('blocks recording when consent declined', () => {
    expect(() => assertRecordingAllowedByConsent('declined')).toThrow(VoiceError);
  });

  it('allows recorded and deferred consent for microphone path', () => {
    expect(() => assertRecordingAllowedByConsent('recorded')).not.toThrow();
    expect(() => assertRecordingAllowedByConsent('deferred')).not.toThrow();
  });
});
