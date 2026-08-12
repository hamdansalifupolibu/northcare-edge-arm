import { futureConstrainedGenerativeProvider } from '../../assistant/providers/futureGenerative/constrainedAssistantProvider';
import { resolveAssistantMode } from '../../assistant/providers/retrievalOnly/retrievalOnlyProvider';

describe('Ask NorthCare boundary during Offline AI Stage 1', () => {
  it('does not activate future generative provider', () => {
    expect(futureConstrainedGenerativeProvider.available).toBe(false);
  });

  it('does not introduce a generative Ask NorthCare mode', () => {
    const mode = resolveAssistantMode('production');
    expect(mode === 'CURATED_RETRIEVAL' || mode === 'UNAVAILABLE').toBe(true);
    expect(mode).not.toBe('DEVELOPMENT_SIMULATION');
  });
});
