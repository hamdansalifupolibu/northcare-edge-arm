import { EDGE_PUBLISHED_RESULTS } from '../domain/publishedResults';

describe('EDGE_PUBLISHED_RESULTS', () => {
  it('matches S20 Ultra evidence trail numbers', () => {
    expect(EDGE_PUBLISHED_RESULTS.baseline.totalMs).toBe(53962);
    expect(EDGE_PUBLISHED_RESULTS.optimized.totalMs).toBe(26508);
    expect(EDGE_PUBLISHED_RESULTS.baseline.whisperInferenceMs).toBe(42367);
    expect(EDGE_PUBLISHED_RESULTS.optimized.whisperInferenceMs).toBe(19564);
    expect(EDGE_PUBLISHED_RESULTS.optimizedRunId).toBe('edge_msp6cf7n_d5qs');
    expect(EDGE_PUBLISHED_RESULTS.fixtureQuality.optimized).toBe(100);
    expect(EDGE_PUBLISHED_RESULTS.fixtureQuality.method).toBe('fixture_combined_v1');
  });
});

