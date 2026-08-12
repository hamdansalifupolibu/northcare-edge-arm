import { edgeStageLabel, formatEdgeMs, shortRunId } from '../domain/formatters';

describe('edge lab formatters', () => {
  it('formats milliseconds and seconds', () => {
    expect(formatEdgeMs(null)).toBe('—');
    expect(formatEdgeMs(850)).toBe('850 ms');
    expect(formatEdgeMs(12500)).toBe('12.5 s');
  });

  it('labels stages for UI', () => {
    expect(edgeStageLabel('whisper_inference')).toContain('decode');
    expect(edgeStageLabel('total')).toBe('Total');
  });

  it('shortens run ids', () => {
    expect(shortRunId(null)).toBe('—');
    expect(shortRunId('edge_short')).toBe('edge_short');
    expect(shortRunId('edge_abcdefghijklmnopqrstuvwxyz').endsWith('…')).toBe(true);
  });
});
