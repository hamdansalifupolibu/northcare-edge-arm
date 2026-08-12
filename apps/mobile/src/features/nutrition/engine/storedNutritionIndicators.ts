import type { NutritionGrowthEvaluationResult } from './growth/growthIndicatorEvaluator';
import type { NutritionIycfEvaluationResult } from './iycf/iycfEvaluator';

export const STORED_NUTRITION_INDICATORS_VERSION = 2 as const;

export type StoredNutritionIndicatorsPayloadV2 = {
  readonly version: typeof STORED_NUTRITION_INDICATORS_VERSION;
  readonly growth: NutritionGrowthEvaluationResult;
  readonly iycf: NutritionIycfEvaluationResult | null;
};

export function serializeStoredNutritionIndicators(input: {
  readonly growth: NutritionGrowthEvaluationResult;
  readonly iycf: NutritionIycfEvaluationResult | null;
}): string {
  const payload: StoredNutritionIndicatorsPayloadV2 = {
    version: STORED_NUTRITION_INDICATORS_VERSION,
    growth: input.growth,
    iycf: input.iycf,
  };
  return JSON.stringify(payload);
}

export function parseStoredNutritionIndicators(json: string): {
  readonly growth: NutritionGrowthEvaluationResult | null;
  readonly iycf: NutritionIycfEvaluationResult | null;
} {
  try {
    const parsed = JSON.parse(json) as
      | NutritionGrowthEvaluationResult
      | StoredNutritionIndicatorsPayloadV2;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'version' in parsed &&
      parsed.version === STORED_NUTRITION_INDICATORS_VERSION &&
      'growth' in parsed
    ) {
      return {
        growth: parsed.growth ?? null,
        iycf: parsed.iycf ?? null,
      };
    }
    if (parsed && typeof parsed === 'object' && 'indicators' in parsed) {
      return {
        growth: parsed as NutritionGrowthEvaluationResult,
        iycf: null,
      };
    }
    return { growth: null, iycf: null };
  } catch {
    return { growth: null, iycf: null };
  }
}
