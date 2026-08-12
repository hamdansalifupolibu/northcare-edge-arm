import type { Measurement } from '../../../../data/domain/entities/entities';
import type { RecordedScreeningAnswer } from '../../../screening/content/types';
import { convertMeasurementUnit } from '../../../risk/engine/unitConversion';
import type { NutritionAgeContext } from '../templateResolver';
import {
  classifyGrowthZScore,
  growthClassificationCode,
  type GrowthIndicatorId,
  type GrowthSeverity,
} from './growthClassification';
import { computeWhoZScore, lookupWhoLms } from './whoLmsMath';
import {
  RECUMBENT_LENGTH_MAX_AGE_DAYS,
  resolveWhoTable,
  WHO_GROWTH_DATA_SOURCE,
  WHO_0_5_MAX_AGE_DAYS,
} from './whoLmsTables';
import type { WhoAgeIndicator, WhoGrowthSex } from './whoLmsTypes';

export const GROWTH_ENGINE_VERSION = 1 as const;

export type NutritionGrowthIndicatorResult = {
  readonly indicatorId: GrowthIndicatorId;
  readonly whoIndicator: WhoAgeIndicator;
  readonly zScore: number | null;
  readonly severity: GrowthSeverity | null;
  readonly classificationCode: string | null;
  readonly status: 'calculated' | 'insufficientInformation' | 'incompatibleAge';
  readonly missingReason: string | null;
};

export type NutritionGrowthEvaluationResult = {
  readonly status: 'calculated' | 'partial' | 'insufficientInformation';
  readonly engineVersion: number;
  readonly dataSource: string;
  readonly isDevelopment: true;
  readonly developmentBanner: string;
  readonly indicators: readonly NutritionGrowthIndicatorResult[];
  readonly missingInformation: readonly string[];
};

export type GrowthEvaluationInput = {
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly measurements: readonly Measurement[];
  readonly age: NutritionAgeContext;
};

function answerMap(
  answers: readonly RecordedScreeningAnswer[],
): Map<string, RecordedScreeningAnswer> {
  return new Map(answers.map((a) => [a.questionId, a]));
}

function resolveSex(answers: Map<string, RecordedScreeningAnswer>): WhoGrowthSex | null {
  const answer = answers.get('child_sex');
  if (!answer || answer.state !== 'answered' || !answer.value) {
    return null;
  }
  if (answer.value.kind === 'option') {
    if (answer.value.value === 'male') {
      return 'male';
    }
    if (answer.value.value === 'female') {
      return 'female';
    }
  }
  return null;
}

function resolveAgeDays(
  answers: Map<string, RecordedScreeningAnswer>,
  age: NutritionAgeContext,
): number | null {
  const monthsAnswer = answers.get('child_age_months');
  if (monthsAnswer?.state === 'answered' && monthsAnswer.value?.kind === 'number') {
    return Math.round(monthsAnswer.value.value * 30.4375);
  }
  return age.ageDays;
}

function measurementValue(
  measurements: readonly Measurement[],
  type: Measurement['measurementType'],
  targetUnit: Measurement['unit'],
): number | null {
  const measurement = measurements.find((m) => m.measurementType === type);
  if (!measurement) {
    return null;
  }
  const converted = convertMeasurementUnit(
    measurement.numericValue,
    measurement.unit,
    targetUnit,
  );
  return converted?.convertedValue ?? null;
}

function evaluateIndicator(input: {
  readonly indicatorId: GrowthIndicatorId;
  readonly whoIndicator: WhoAgeIndicator;
  readonly sex: WhoGrowthSex;
  readonly ageInDays: number;
  readonly measurement: number | null;
  readonly lengthHeightCm: number | null;
}): NutritionGrowthIndicatorResult {
  const base = {
    indicatorId: input.indicatorId,
    whoIndicator: input.whoIndicator,
    zScore: null as number | null,
    severity: null as GrowthSeverity | null,
    classificationCode: null as string | null,
    status: 'insufficientInformation' as const,
    missingReason: null as string | null,
  };

  if (input.ageInDays > WHO_0_5_MAX_AGE_DAYS) {
    return {
      ...base,
      status: 'incompatibleAge',
      missingReason: 'ageOutOfRange',
    };
  }

  if (input.measurement == null) {
    return {
      ...base,
      missingReason: `measurement:${input.indicatorId}`,
    };
  }

  const lengthHeightCm = input.lengthHeightCm ?? 0;
  const resolved = resolveWhoTable({
    indicator: input.whoIndicator,
    sex: input.sex,
    ageInDays: input.ageInDays,
    lengthHeightCm,
  });
  if (!resolved) {
    return {
      ...base,
      status: 'incompatibleAge',
      missingReason: 'tableUnavailable',
    };
  }

  const lms = lookupWhoLms(resolved.table, resolved.index);
  if (!lms) {
    return {
      ...base,
      status: 'incompatibleAge',
      missingReason: 'indexOutOfRange',
    };
  }

  const zScore = computeWhoZScore(input.measurement, lms);
  if (!Number.isFinite(zScore)) {
    return {
      ...base,
      missingReason: 'calculationFailed',
    };
  }

  const severity = classifyGrowthZScore(zScore);
  return {
    ...base,
    zScore,
    severity,
    classificationCode: growthClassificationCode(input.indicatorId, severity),
    status: 'calculated',
    missingReason: null,
  };
}

/**
 * Deterministic WHO growth z-scores for child nutrition assessments (0–5 years).
 * Uses bundled LMS tables — no network, no AI.
 */
export function evaluateNutritionGrowthIndicators(
  input: GrowthEvaluationInput,
): NutritionGrowthEvaluationResult {
  const developmentBanner =
    'WHO growth z-scores (development build). Requires GHS clinical review before pilot.';

  const answers = answerMap(input.answers);
  const sex = resolveSex(answers);
  const ageInDays = resolveAgeDays(answers, input.age);
  const weightKg = measurementValue(input.measurements, 'weight', 'kg');
  const heightCm = measurementValue(input.measurements, 'height', 'cm');

  const missing: string[] = [];
  if (!sex) {
    missing.push('sex');
  }
  if (ageInDays == null) {
    missing.push('age');
  }
  if (weightKg == null) {
    missing.push('measurement:weight');
  }

  if (!sex || ageInDays == null) {
    return {
      status: 'insufficientInformation',
      engineVersion: GROWTH_ENGINE_VERSION,
      dataSource: WHO_GROWTH_DATA_SOURCE,
      isDevelopment: true,
      developmentBanner,
      indicators: [],
      missingInformation: missing,
    };
  }

  const useRecumbentLength = ageInDays < RECUMBENT_LENGTH_MAX_AGE_DAYS;
  const wflhIndicator: WhoAgeIndicator = useRecumbentLength
    ? 'weight-for-length'
    : 'weight-for-height';

  const bmiValue =
    weightKg != null && heightCm != null && heightCm > 0
      ? weightKg / Math.pow(heightCm / 100, 2)
      : null;

  const indicators: NutritionGrowthIndicatorResult[] = [
    evaluateIndicator({
      indicatorId: 'wfa',
      whoIndicator: 'weight-for-age',
      sex,
      ageInDays,
      measurement: weightKg,
      lengthHeightCm: heightCm,
    }),
    evaluateIndicator({
      indicatorId: 'lhfa',
      whoIndicator: 'length-height-for-age',
      sex,
      ageInDays,
      measurement: heightCm,
      lengthHeightCm: heightCm,
    }),
    evaluateIndicator({
      indicatorId: 'wflh',
      whoIndicator: wflhIndicator,
      sex,
      ageInDays,
      measurement: weightKg,
      lengthHeightCm: heightCm,
    }),
    evaluateIndicator({
      indicatorId: 'bmi',
      whoIndicator: 'bmi-for-age',
      sex,
      ageInDays,
      measurement: bmiValue,
      lengthHeightCm: heightCm,
    }),
  ];

  for (const indicator of indicators) {
    if (indicator.missingReason && indicator.status !== 'calculated') {
      missing.push(`${indicator.indicatorId}:${indicator.missingReason}`);
    }
  }

  const calculatedCount = indicators.filter((i) => i.status === 'calculated').length;
  const status =
    calculatedCount === 0
      ? 'insufficientInformation'
      : calculatedCount === indicators.length
        ? 'calculated'
        : 'partial';

  return {
    status,
    engineVersion: GROWTH_ENGINE_VERSION,
    dataSource: WHO_GROWTH_DATA_SOURCE,
    isDevelopment: true,
    developmentBanner,
    indicators,
    missingInformation: [...new Set(missing)],
  };
}
