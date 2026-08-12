import { sanitizeMeta } from '../../../logging/logger';

describe('voice privacy logging', () => {
  it('redacts transcript keys via sanitizeMeta', () => {
    const meta = sanitizeMeta({
      transcriptText: 'Sensitive transcript content',
      transcript: 'Another transcript field',
      providerId: 'development.simulation.transcription.v1',
      acceptedCount: 2,
      editedCount: 1,
      rejectedCount: 0,
    });
    expect(meta?.transcriptText).toBe('[REDACTED]');
    expect(meta?.transcript).toBe('[REDACTED]');
    expect(meta?.providerId).toBe('development.simulation.transcription.v1');
    expect(meta?.acceptedCount).toBe(2);
  });
});
