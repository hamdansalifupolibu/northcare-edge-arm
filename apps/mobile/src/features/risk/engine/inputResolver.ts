import type { Client, Measurement } from '../../../data/domain/entities/entities';
import type { EncounterType, ScreeningType } from '../../../data/domain/enums/domainEnums';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import type { EngineAnswer, RiskEngineInput } from '../domain/input';
import { deriveApproximateAgeYears, deriveExactAgeYears } from './ageHelpers';

export function buildRiskEngineInput(input: {
  readonly evaluationId: string;
  readonly client: Pick<
    Client,
    'id' | 'category' | 'dateOfBirth' | 'approximateAge' | 'approximateAgeUnit'
  >;
  readonly encounterId: EntityId;
  readonly visitType: EncounterType;
  readonly screeningId: EntityId;
  readonly screeningType: ScreeningType;
  readonly screeningTemplateId: string;
  readonly screeningTemplateVersion: number;
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly measurements: readonly Measurement[];
  readonly completionState: 'completed' | 'incomplete';
  readonly workerConfirmation: boolean;
  readonly existingRiskAssessmentId?: EntityId | null;
  readonly referenceDateOnly: string;
  readonly applicableRulePackId?: string | null;
  readonly applicableRulePackVersion?: number | null;
}): RiskEngineInput {
  const approximateAgeYears =
    input.client.approximateAge != null &&
    (input.client.approximateAgeUnit === 'years' || input.client.approximateAgeUnit == null)
      ? input.client.approximateAge
      : input.client.approximateAge != null && input.client.approximateAgeUnit === 'months'
        ? input.client.approximateAge / 12
        : null;

  const derivedAge = input.client.dateOfBirth
    ? deriveExactAgeYears(input.client.dateOfBirth, input.referenceDateOnly)
    : approximateAgeYears != null
      ? deriveApproximateAgeYears(approximateAgeYears)
      : null;

  const measurementByQuestion = new Map<string, Measurement>();
  for (const measurement of input.measurements) {
    const match = /^question:(.+)$/.exec(measurement.notes ?? '');
    if (match?.[1]) {
      measurementByQuestion.set(match[1], measurement);
    }
  }

  const answers: EngineAnswer[] = input.answers.map((answer) => {
    const linkedMeasurement = measurementByQuestion.get(answer.questionId);
    let value = answer.value
      ? answer.value.kind === 'measurement'
        ? {
            kind: 'measurement' as const,
            value: answer.value.value,
            unit: answer.value.unit,
            originalValue: answer.value.value,
            originalUnit: answer.value.unit,
          }
        : answer.value.kind === 'time'
          ? { kind: 'text' as const, value: answer.value.value }
          : answer.value
      : undefined;

    // Persisted measurement answers are stored as numbers; restore unit from linked row.
    if (
      linkedMeasurement &&
      answer.state === 'answered' &&
      (value == null || value.kind === 'number')
    ) {
      value = {
        kind: 'measurement',
        value: linkedMeasurement.numericValue,
        unit: linkedMeasurement.unit,
        originalValue: linkedMeasurement.numericValue,
        originalUnit: linkedMeasurement.unit,
      };
    }

    return {
      questionKey: answer.questionId,
      state: answer.state,
      value,
      provenance: {
        kind: linkedMeasurement ? 'measurement' : 'screeningAnswer',
        sourceId: linkedMeasurement?.id ?? answer.questionId,
      },
    };
  });

  return {
    evaluationId: input.evaluationId,
    clientId: input.client.id,
    clientCategory: input.client.category,
    dateOfBirth: input.client.dateOfBirth,
    approximateAgeYears,
    derivedAge,
    encounterId: input.encounterId,
    visitType: input.visitType,
    screeningId: input.screeningId,
    screeningType: input.screeningType,
    screeningTemplateId: input.screeningTemplateId,
    screeningTemplateVersion: input.screeningTemplateVersion,
    answers,
    measurements: input.measurements.map((measurement) => ({
      measurementId: measurement.id,
      questionKey: null,
      measurementType: measurement.measurementType,
      numericValue: measurement.numericValue,
      unit: measurement.unit,
      provenance: {
        kind: 'measurement',
        sourceId: measurement.id,
      },
    })),
    completionState: input.completionState,
    workerConfirmation: input.workerConfirmation,
    existingRiskAssessmentId: input.existingRiskAssessmentId ?? null,
    applicableRulePackId: input.applicableRulePackId ?? null,
    applicableRulePackVersion: input.applicableRulePackVersion ?? null,
  };
}
