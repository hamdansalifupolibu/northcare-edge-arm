import type {
  StructuredExtractionProvider,
  StructuredExtractionRequest,
  StructuredExtractionResult,
  StructuredExtractionSuggestionDraft,
} from '../../domain/providers';
import { getOfflineAiServices } from '../../../offline-ai/services/createOfflineAiServices';

export const QWEN_EXTRACTION_PROVIDER_ID = 'offline.qwen.extraction.v1';

export function createQwenExtractionProvider(): StructuredExtractionProvider {
  return {
    id: QWEN_EXTRACTION_PROVIDER_ID,
    version: '1',
    availability: 'available',
    supportsOffline: true,
    isSynthetic: false,
    async extract(input: StructuredExtractionRequest): Promise<StructuredExtractionResult> {
      const ai = getOfflineAiServices();
      const loaded = await ai.ensureModelLoaded();
      if (!loaded.ok) {
        return {
          providerId: QWEN_EXTRACTION_PROVIDER_ID,
          providerVersion: '1',
          status: 'failed',
          suggestions: [],
          isSynthetic: false,
          connectivityRequired: false,
          errorCategory: 'modelNotLoaded',
        };
      }

      const systemPrompt = `You are a clinical data extraction assistant for community health workers in Northern Ghana. Parse the transcript and output ONLY a JSON object. Use short values (not full sentences).

IMPORTANT: If a field is NOT clearly mentioned in the transcript, you MUST set it to null. Do NOT guess or invent values. Do NOT use generic placeholders like "Baby", "Patient", "Child", "Unknown", or "N/A".

JSON keys:
{
  ${input.schema.allowedTargets
    .map(
      (f) =>
        `"${f.targetKey}": ${
          f.valueType === 'boolean'
            ? 'boolean or null'
            : f.valueType === 'measurement'
              ? '{"numericValue": number, "unit": string, "measurementType": string} or null'
              : f.targetKey === 'urgencyLevel'
                ? '"low"|"moderate"|"high"|"critical" or null'
                : 'string or null'
        }`,
    )
    .join(',\n  ')}
}

Fields: ${input.schema.allowedTargets.map((f) => `${f.targetKey}=${f.label}`).join(', ')}`;

      const userPrompt = `Extract from this transcript. Output ONLY the JSON object, no explanation:
"${input.confirmedTranscript}"`;

      try {
        const gen = await ai.generate({
          systemPrompt,
          userPrompt,
        });

        const text = gen.text.trim();
        let cleanText = text;

        // Clean potential markdown blocks
        if (cleanText.includes('```json')) {
          const start = cleanText.indexOf('```json') + 7;
          const end = cleanText.lastIndexOf('```');
          cleanText = cleanText.slice(start, end).trim();
        } else if (cleanText.includes('```')) {
          const start = cleanText.indexOf('```') + 3;
          const end = cleanText.lastIndexOf('```');
          cleanText = cleanText.slice(start, end).trim();
        }

        const parsedJson = JSON.parse(cleanText) as Record<string, unknown>;
        const suggestions: StructuredExtractionSuggestionDraft[] = [];

        for (const field of input.schema.allowedTargets) {
          const parsedVal = parsedJson[field.targetKey];
          if (parsedVal !== undefined && parsedVal !== null) {
            let normalizedVal: unknown = parsedVal;

            if (field.valueType === 'boolean') {
              if (typeof parsedVal === 'string') {
                const normStr = parsedVal.toLowerCase();
                normalizedVal = normStr === 'true' || normStr === 'yes' || normStr === '1';
              } else {
                normalizedVal = Boolean(parsedVal);
              }
            } else             if (field.valueType === 'measurement') {
              const defaultUnit = field.targetKey === 'weight' ? 'kg' : 'celsius';
              if (typeof parsedVal === 'number') {
                normalizedVal = {
                  numericValue: parsedVal,
                  unit: defaultUnit,
                  measurementType: field.targetKey,
                };
              } else if (typeof parsedVal === 'object' && parsedVal !== null) {
                const obj = parsedVal as Record<string, unknown>;
                const num =
                  typeof obj.numericValue === 'number'
                    ? obj.numericValue
                    : parseFloat(String(obj.value || obj.numericValue));
                if (!isNaN(num)) {
                  normalizedVal = {
                    numericValue: num,
                    unit: String(obj.unit || defaultUnit),
                    measurementType: String(obj.measurementType || field.targetKey),
                  };
                } else {
                  normalizedVal = null;
                }
              } else {
                const parsedNum = parseFloat(String(parsedVal));
                if (!isNaN(parsedNum)) {
                  normalizedVal = {
                    numericValue: parsedNum,
                    unit: defaultUnit,
                    measurementType: field.targetKey,
                  };
                } else {
                  normalizedVal = null;
                }
              }
            }

            if (normalizedVal !== null) {
              suggestions.push({
                targetType: field.targetType,
                targetKey: field.targetKey,
                proposedValue: normalizedVal,
                valueType: field.valueType,
                sourceStart: null,
                sourceEnd: null,
                sourceTextExcerpt: null,
                confidenceCategory: 'high',
              });
            }
          }
        }

        const filtered = suggestions.filter((s) => {
          if (s.valueType === 'measurement' || s.valueType === 'boolean') return true;
          const val = typeof s.proposedValue === 'string' ? s.proposedValue.trim().toLowerCase() : '';
          if (!val) return false;
          const placeholders = [
            'baby', 'patient', 'child', 'mother', 'unknown', 'n/a', 'na',
            'none', 'not mentioned', 'not specified', 'not available',
            'null', 'undefined', '-', 'the baby', 'the child', 'the patient',
          ];
          return !placeholders.includes(val);
        });

        return {
          providerId: QWEN_EXTRACTION_PROVIDER_ID,
          providerVersion: '1',
          status: 'completed',
          suggestions: filtered,
          isSynthetic: false,
          connectivityRequired: false,
          errorCategory: null,
        };
      } catch (err) {
        return {
          providerId: QWEN_EXTRACTION_PROVIDER_ID,
          providerVersion: '1',
          status: 'failed',
          suggestions: [],
          isSynthetic: false,
          connectivityRequired: false,
          errorCategory: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}
