import type {
  StructuredExtractionProvider,
  StructuredExtractionRequest,
  StructuredExtractionResult,
} from '../../domain/providers';
import { VoiceError } from '../../domain/errors';
import { assertAllowedExtractionTarget } from '../../domain/policies';

export const DEV_EXTRACTION_PROVIDER_ID = 'development.simulation.extraction.v1';

/**
 * Development-only structured suggestions. Non-clinical. Never activate in production.
 */
export function createDevelopmentSimulationExtractionProvider(options?: {
  readonly allowInProduction?: boolean;
}): StructuredExtractionProvider {
  return {
    id: DEV_EXTRACTION_PROVIDER_ID,
    version: '1',
    availability: 'developmentOnly',
    supportsOffline: true,
    isSynthetic: true,
    async extract(input: StructuredExtractionRequest): Promise<StructuredExtractionResult> {
      if (options?.allowInProduction === true) {
        throw new VoiceError(
          'providerNotAllowed',
          'Development extraction must never run in production.',
        );
      }

      const transcript = input.confirmedTranscript.trim();
      const summary =
        transcript.length > 120 ? transcript.slice(0, 120) + '…' : transcript;

      const drafts = input.schema.allowedTargets.map((field, index) => {
        assertAllowedExtractionTarget(field.targetType, field.targetKey);

        let proposedValue: unknown;
        if (field.valueType === 'boolean') {
          proposedValue = null;
        } else if (field.valueType === 'measurement') {
          const isWeight = field.targetKey.toLowerCase().includes('weight');
          proposedValue = isWeight
            ? { numericValue: 3.2, unit: 'kg', measurementType: 'weight' }
            : { numericValue: 36.8, unit: 'celsius', measurementType: 'temperature' };
        } else if (field.valueType === 'note') {
          proposedValue = transcript;
        } else {
          proposedValue = summary;
        }

        return {
          targetType: field.targetType,
          targetKey: field.targetKey,
          proposedValue,
          valueType: field.valueType,
          sourceStart: index,
          sourceEnd: index + 8,
          sourceTextExcerpt: null,
          confidenceCategory: 'uncertain' as const,
        };
      });

      return {
        providerId: DEV_EXTRACTION_PROVIDER_ID,
        providerVersion: '1',
        status: 'completed',
        suggestions: drafts,
        isSynthetic: true,
        connectivityRequired: false,
        errorCategory: null,
      };
    },
  };
}
