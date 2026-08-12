import { AssistantError } from '../../domain/errors';
import type { ConstrainedAssistantProvider } from '../../domain/providers';

/**
 * Interface stub only. Production generative provider is unavailable in Stage 13.
 */
export const futureConstrainedGenerativeProvider: ConstrainedAssistantProvider = {
  providerId: 'future-constrained-generative-v1',
  mode: 'CONSTRAINED_GENERATION',
  available: false,
  async generateGroundedAnswer() {
    throw new AssistantError(
      'providerUnavailable',
      'Constrained generative provider is not approved for production or Stage 13 use.',
    );
  },
};

export function isProductionGenerativeProviderAvailable(): boolean {
  return false;
}
