import { assertEntityId } from '../../../data/domain/value-objects/EntityId';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import { SYNTHETIC_DEV_PRIORITY_RULE_PACK } from '../content/development/syntheticDevPriorityRulePack';
import type { RiskEngineInput } from '../domain/input';
import { buildRiskEngineInput } from '../engine/inputResolver';

export function makeAnswers(
  overrides: readonly RecordedScreeningAnswer[],
): readonly RecordedScreeningAnswer[] {
  return overrides;
}

export function buildSyntheticInput(
  answers: readonly RecordedScreeningAnswer[],
  options?: {
    readonly completionState?: 'completed' | 'incomplete';
    readonly workerConfirmation?: boolean;
  },
): RiskEngineInput {
  return buildRiskEngineInput({
    evaluationId: '00000000-0000-4000-8000-000000000099',
    client: {
      id: assertEntityId('00000000-0000-4000-8000-000000000001'),
      category: 'pregnant',
      dateOfBirth: null,
      approximateAge: 28,
      approximateAgeUnit: 'years',
    },
    encounterId: assertEntityId('00000000-0000-4000-8000-000000000002'),
    visitType: 'antenatalVisit',
    screeningId: assertEntityId('00000000-0000-4000-8000-000000000003'),
    screeningType: 'antenatal',
    screeningTemplateId: 'synthetic-dev-workflow-v1',
    screeningTemplateVersion: 1,
    answers,
    measurements: [],
    completionState: options?.completionState ?? 'completed',
    workerConfirmation: options?.workerConfirmation ?? true,
    referenceDateOnly: '2026-08-02',
    applicableRulePackId: SYNTHETIC_DEV_PRIORITY_RULE_PACK.rulePackId,
    applicableRulePackVersion: SYNTHETIC_DEV_PRIORITY_RULE_PACK.version,
  });
}

export const SCENARIO = {
  red: makeAnswers([
    { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: true } },
    {
      questionId: 'item_a2',
      state: 'answered',
      value: { kind: 'option', value: 'option_one' },
    },
    {
      questionId: 'item_b1_weight',
      state: 'answered',
      value: { kind: 'measurement', value: 70, unit: 'kg' },
    },
    {
      questionId: 'item_b3_ack',
      state: 'answered',
      value: { kind: 'acknowledgement', acknowledged: true },
    },
  ]),
  amber: makeAnswers([
    { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: false } },
    {
      questionId: 'item_a2',
      state: 'answered',
      value: { kind: 'option', value: 'option_two' },
    },
    {
      questionId: 'item_b1_weight',
      state: 'answered',
      value: { kind: 'measurement', value: 70, unit: 'kg' },
    },
    {
      questionId: 'item_b3_ack',
      state: 'answered',
      value: { kind: 'acknowledgement', acknowledged: true },
    },
  ]),
  green: makeAnswers([
    { questionId: 'item_a1', state: 'answered', value: { kind: 'boolean', value: false } },
    {
      questionId: 'item_a2',
      state: 'answered',
      value: { kind: 'option', value: 'option_one' },
    },
    {
      questionId: 'item_b1_weight',
      state: 'answered',
      value: { kind: 'measurement', value: 70, unit: 'kg' },
    },
    {
      questionId: 'item_b3_ack',
      state: 'answered',
      value: { kind: 'acknowledgement', acknowledged: true },
    },
  ]),
  undeterminedUnknown: makeAnswers([
    { questionId: 'item_a1', state: 'unknown' },
    {
      questionId: 'item_a2',
      state: 'answered',
      value: { kind: 'option', value: 'option_one' },
    },
    {
      questionId: 'item_b1_weight',
      state: 'answered',
      value: { kind: 'measurement', value: 70, unit: 'kg' },
    },
    {
      questionId: 'item_b3_ack',
      state: 'answered',
      value: { kind: 'acknowledgement', acknowledged: true },
    },
  ]),
};
