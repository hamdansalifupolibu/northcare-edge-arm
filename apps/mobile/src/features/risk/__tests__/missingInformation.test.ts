import { SYNTHETIC_DEV_PRIORITY_RULE_PACK } from '../content/development/syntheticDevPriorityRulePack';
import { evaluateRisk } from '../engine/evaluator';
import { buildSyntheticInput, makeAnswers, SCENARIO } from './helpers';

describe('missing information safety', () => {
  it('does not treat unknown / notAssessed / declined / unanswered as No', () => {
    for (const state of ['unknown', 'notAssessed', 'declined'] as const) {
      const outcome = evaluateRisk(
        buildSyntheticInput(
          makeAnswers([
            { questionId: 'item_a1', state },
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
        ),
        SYNTHETIC_DEV_PRIORITY_RULE_PACK,
      );
      expect(outcome.priority).toBe('undetermined');
      expect(outcome.priority).not.toBe('green');
      expect(outcome.missingInformation.some((item) => item.questionKey === 'item_a1')).toBe(
        true,
      );
    }
  });

  it('never returns GREEN for incomplete or missing measurement paths', () => {
    expect(() =>
      evaluateRisk(
        buildSyntheticInput(SCENARIO.green, { completionState: 'incomplete' }),
        SYNTHETIC_DEV_PRIORITY_RULE_PACK,
      ),
    ).toThrow();

    const missingWeight = evaluateRisk(
      buildSyntheticInput(
        makeAnswers([
          {
            questionId: 'item_a1',
            state: 'answered',
            value: { kind: 'boolean', value: false },
          },
          {
            questionId: 'item_a2',
            state: 'answered',
            value: { kind: 'option', value: 'option_one' },
          },
          { questionId: 'item_b1_weight', state: 'notAssessed' },
          {
            questionId: 'item_b3_ack',
            state: 'answered',
            value: { kind: 'acknowledgement', acknowledged: true },
          },
        ]),
      ),
      SYNTHETIC_DEV_PRIORITY_RULE_PACK,
    );
    expect(missingWeight.priority).toBe('undetermined');
    expect(missingWeight.priority).not.toBe('green');
  });

  it('returns undetermined for the dedicated unknown scenario', () => {
    const outcome = evaluateRisk(
      buildSyntheticInput(SCENARIO.undeterminedUnknown),
      SYNTHETIC_DEV_PRIORITY_RULE_PACK,
    );
    expect(outcome.priority).toBe('undetermined');
    expect(outcome.greenAllowedExplicitly).toBe(false);
  });
});
