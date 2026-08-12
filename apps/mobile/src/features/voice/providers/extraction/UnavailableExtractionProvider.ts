import type {
  StructuredExtractionProvider,
  StructuredExtractionRequest,
  StructuredExtractionResult,
} from '../../domain/providers';

export const UNAVAILABLE_EXTRACTION_PROVIDER_ID = 'production.unavailable.extraction.v1';

export function createUnavailableExtractionProvider(): StructuredExtractionProvider {
  return {
    id: UNAVAILABLE_EXTRACTION_PROVIDER_ID,
    version: '1',
    availability: 'failedClosed',
    supportsOffline: false,
    isSynthetic: false,
    async extract(_input: StructuredExtractionRequest): Promise<StructuredExtractionResult> {
      return {
        providerId: UNAVAILABLE_EXTRACTION_PROVIDER_ID,
        providerVersion: '1',
        status: 'unavailable',
        suggestions: [],
        isSynthetic: false,
        connectivityRequired: false,
        errorCategory: 'noApprovedProvider',
      };
    },
  };
}
