import type { Measurement } from '../../../data/domain/entities/entities';
import type { MeasurementType } from '../../../data/domain/enums/domainEnums';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import { convertMeasurementUnit } from '../../risk/engine/unitConversion';
import { NUTRITION_ENGINE_VERSION } from '../domain/statuses';
import type {
  NutritionAgeApplicability,
  NutritionReferenceCondition,
  NutritionReferenceEvaluationResult,
  NutritionReferencePackDefinition,
  NutritionReferenceRule,
} from '../domain/types';
import type { NutritionAgeContext } from './templateResolver';

export type ReferenceEvaluationInput = {
  readonly pack: NutritionReferencePackDefinition | null;
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly measurements: readonly Measurement[];
  readonly age: NutritionAgeContext;
  readonly packLoadable: boolean;
};

function answerMap(
  answers: readonly RecordedScreeningAnswer[],
): Map<string, RecordedScreeningAnswer> {
  return new Map(answers.map((a) => [a.questionId, a]));
}

function measurementByType(
  measurements: readonly Measurement[],
  type: MeasurementType,
): Measurement | undefined {
  return measurements.find((m) => m.measurementType === type);
}

function evaluateCondition(
  condition: NutritionReferenceCondition,
  answers: Map<string, RecordedScreeningAnswer>,
  measurements: readonly Measurement[],
): boolean {
  switch (condition.op) {
    case 'hasMeasurement':
      return measurementByType(measurements, condition.measurementType) != null;
    case 'measurementLessThan': {
      const m = measurementByType(measurements, condition.measurementType);
      return m != null && m.numericValue < condition.threshold;
    }
    case 'measurementBetween': {
      const m = measurementByType(measurements, condition.measurementType);
      return m != null && m.numericValue >= condition.min && m.numericValue < condition.max;
    }
    case 'measurementGreaterThanOrEqual': {
      const m = measurementByType(measurements, condition.measurementType);
      return m != null && m.numericValue >= condition.threshold;
    }
    case 'answerEquals': {
      const answer = answers.get(condition.questionId);
      if (!answer || answer.state !== 'answered' || !answer.value) {
        return false;
      }
      const value = answer.value;
      if (value.kind === 'boolean' || value.kind === 'number' || value.kind === 'option') {
        return value.value === condition.value;
      }
      if (value.kind === 'text') {
        return value.value === condition.value;
      }
      return false;
    }
    case 'answerState': {
      const answer = answers.get(condition.questionId);
      return answer?.state === condition.state;
    }
    case 'all':
      return condition.conditions.every((c) => evaluateCondition(c, answers, measurements));
    case 'any':
      return condition.conditions.some((c) => evaluateCondition(c, answers, measurements));
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

function checkAge(
  age: NutritionAgeContext,
  applicability: NutritionAgeApplicability,
  allowApproximateAge: boolean,
): NutritionReferenceEvaluationResult['status'] | null {
  if (applicability.requireExactAge && age.precision !== 'exact') {
    return 'insufficientInformation';
  }
  if (age.precision === 'unknown') {
    return 'insufficientInformation';
  }
  if (age.precision === 'approximate' && !allowApproximateAge) {
    return 'incompatibleAge';
  }
  if (age.ageDays == null) {
    return 'insufficientInformation';
  }
  if (applicability.minAgeDays != null && age.ageDays < applicability.minAgeDays) {
    return 'incompatibleAge';
  }
  if (applicability.maxAgeDays != null && age.ageDays > applicability.maxAgeDays) {
    return 'incompatibleAge';
  }
  return null;
}

function applyRule(
  rule: NutritionReferenceRule,
  measurements: readonly Measurement[],
): Pick<
  NutritionReferenceEvaluationResult,
  'interpretationCode' | 'derivedValue' | 'derivedUnit' | 'explanationId' | 'inputMeasurementIds' | 'status'
> {
  if (rule.derivedValueExpression === 'none' || !rule.measurementType) {
    return {
      status: 'calculated',
      interpretationCode: rule.interpretationCode,
      derivedValue: null,
      derivedUnit: null,
      explanationId: rule.explanationId,
      inputMeasurementIds: [],
    };
  }
  const measurement = measurementByType(measurements, rule.measurementType);
  if (!measurement) {
    return {
      status: 'insufficientInformation',
      interpretationCode: null,
      derivedValue: null,
      derivedUnit: null,
      explanationId: null,
      inputMeasurementIds: [],
    };
  }
  const targetUnit = rule.targetUnit ?? measurement.unit;
  const converted = convertMeasurementUnit(measurement.numericValue, measurement.unit, targetUnit);
  if (!converted) {
    return {
      status: 'unsupportedUnit',
      interpretationCode: null,
      derivedValue: null,
      derivedUnit: null,
      explanationId: null,
      inputMeasurementIds: [measurement.id],
    };
  }
  return {
    status: 'calculated',
    interpretationCode: rule.interpretationCode,
    derivedValue: converted.convertedValue,
    derivedUnit: converted.targetUnit,
    explanationId: rule.explanationId,
    inputMeasurementIds: [measurement.id],
  };
}

/**
 * Deterministic, React-independent nutrition reference evaluator.
 * Same inputs + pack version + engine version → same result.
 * Never invents clinical labels; synthetic packs use developmentCategory*.
 */
export function evaluateNutritionReference(
  input: ReferenceEvaluationInput,
): NutritionReferenceEvaluationResult {
  const base = {
    engineVersion: NUTRITION_ENGINE_VERSION,
    referencePackId: input.pack?.referencePackId ?? null,
    referencePackVersion: input.pack?.version ?? null,
    interpretationCode: null as string | null,
    derivedValue: null as number | null,
    derivedUnit: null as NutritionReferenceEvaluationResult['derivedUnit'],
    explanationId: null as string | null,
    missingInformation: [] as string[],
    inputMeasurementIds: [] as string[],
    isDevelopment: input.pack?.status === 'APPROVED_FOR_DEVELOPMENT',
    developmentBanner: input.pack?.developmentBanner ?? null,
  };

  if (!input.packLoadable || !input.pack) {
    return {
      ...base,
      status: input.pack ? 'referencePackUnapproved' : 'referencePackUnavailable',
      isDevelopment: false,
      developmentBanner: null,
    };
  }

  if (
    input.pack.status === 'DRAFT' ||
    input.pack.status === 'REVIEW_REQUIRED' ||
    input.pack.status === 'RETIRED'
  ) {
    return { ...base, status: 'referencePackUnapproved' };
  }

  const ageFailure = checkAge(
    input.age,
    input.pack.ageApplicability,
    input.pack.allowApproximateAge,
  );
  if (ageFailure) {
    return {
      ...base,
      status: ageFailure,
      missingInformation: ageFailure === 'insufficientInformation' ? ['age'] : [],
    };
  }

  const missingMeasurements = input.pack.requiredMeasurements.filter(
    (type) => !measurementByType(input.measurements, type),
  );
  if (missingMeasurements.length > 0) {
    return {
      ...base,
      status: 'insufficientInformation',
      missingInformation: missingMeasurements.map((m) => `measurement:${m}`),
    };
  }

  for (const measurement of input.measurements) {
    if (
      input.pack.requiredMeasurements.includes(measurement.measurementType) &&
      !input.pack.supportedUnits.includes(measurement.unit)
    ) {
      const convertible = input.pack.supportedUnits.some(
        (unit) => convertMeasurementUnit(measurement.numericValue, measurement.unit, unit) != null,
      );
      if (!convertible) {
        return {
          ...base,
          status: 'unsupportedUnit',
          inputMeasurementIds: [measurement.id],
        };
      }
    }
  }

  const answers = answerMap(input.answers);
  const ordered = [...input.pack.rules].sort((a, b) => a.order - b.order);
  for (const rule of ordered) {
    if (!evaluateCondition(rule.condition, answers, input.measurements)) {
      continue;
    }
    const applied = applyRule(rule, input.measurements);
    if (applied.status !== 'calculated') {
      return { ...base, ...applied, missingInformation: [] };
    }
    // Guard: never emit clinical-looking labels from synthetic packs
    if (
      applied.interpretationCode &&
      /^(normal|wasted|stunted|underweight|obese|malnourished)$/i.test(applied.interpretationCode)
    ) {
      return { ...base, status: 'calculationFailed' };
    }
    return { ...base, ...applied, missingInformation: [] };
  }

  return {
    ...base,
    status: 'insufficientInformation',
    missingInformation: ['noMatchingRule'],
  };
}
