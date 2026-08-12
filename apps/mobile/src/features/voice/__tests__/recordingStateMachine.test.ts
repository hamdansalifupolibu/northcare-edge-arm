import { assertRecordingTransition, canTransition } from '../domain/states';
import { VoiceError } from '../domain/errors';

describe('recording state machine', () => {
  it('allows idle to preparing and ready', () => {
    expect(canTransition('idle', 'preparing')).toBe(true);
    expect(canTransition('idle', 'ready')).toBe(true);
  });

  it('rejects idle to recording without permission path', () => {
    expect(canTransition('idle', 'recording')).toBe(false);
    expect(() => assertRecordingTransition('idle', 'recording')).toThrow(VoiceError);
  });

  it('allows recording pause and stop transitions', () => {
    expect(canTransition('recording', 'paused')).toBe(true);
    expect(canTransition('recording', 'stopping')).toBe(true);
    expect(canTransition('paused', 'recording')).toBe(true);
  });

  it('rejects discarded resume', () => {
    expect(canTransition('discarded', 'recording')).toBe(false);
    expect(canTransition('discarded', 'ready')).toBe(false);
  });

  it('allows recorded to transcript and playback paths', () => {
    expect(canTransition('recorded', 'playing')).toBe(true);
    expect(canTransition('recorded', 'transcriptionPending')).toBe(true);
    expect(canTransition('recorded', 'transcriptReady')).toBe(true);
  });
});
