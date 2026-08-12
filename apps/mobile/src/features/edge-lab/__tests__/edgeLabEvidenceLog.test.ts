import { sanitizeEdgeLabEvidencePayload } from '../services/edgeLabEvidenceLog';
import { computeEdgeBaselineConfigHash } from '../services/edgeLabConfigHash';

describe('edgeLabEvidenceLog', () => {
  it('strips transcript and audio keys from evidence payloads', () => {
    const sanitized = sanitizeEdgeLabEvidencePayload({
      event: 'whisper',
      whisperLoadMs: 1200,
      transcript: 'should not appear',
      transcriptText: 'should not appear',
      rawPreview: 'should not appear',
      audioPath: '/secret/path.m4a',
      nested: {
        preview: 'nope',
        transcriptCharCount: 42,
      },
    });

    expect(sanitized.event).toBe('whisper');
    expect(sanitized.whisperLoadMs).toBe(1200);
    expect(sanitized.transcript).toBeUndefined();
    expect(sanitized.transcriptText).toBeUndefined();
    expect(sanitized.rawPreview).toBeUndefined();
    expect(sanitized.audioPath).toBeUndefined();
    expect(sanitized.nested).toEqual({ transcriptCharCount: 42 });
  });
});

describe('computeEdgeBaselineConfigHash', () => {
  it('returns a stable cfg_ hash for the frozen baseline', () => {
    const a = computeEdgeBaselineConfigHash();
    const b = computeEdgeBaselineConfigHash();
    expect(a).toEqual(b);
    expect(a.startsWith('cfg_')).toBe(true);
  });
});
