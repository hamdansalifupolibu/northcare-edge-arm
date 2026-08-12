import { SYNTHETIC_DEV_PRIORITY_RULE_PACK } from '../content/development/syntheticDevPriorityRulePack';
import { evaluateRisk } from '../engine/evaluator';
import { buildSyntheticInput, makeAnswers, SCENARIO } from './helpers';

describe('priority aggregation (synthetic, non-clinical)', () => {
  it('returns RED / AMBER / GREEN for dedicated synthetic scenarios', () => {
    expect(
      evaluateRisk(buildSyntheticInput(SCENARIO.red), SYNTHETIC_DEV_PRIORITY_RULE_PACK)
        .priority,
    ).toBe('red');
    expect(
      evaluateRisk(buildSyntheticInput(SCENARIO.amber), SYNTHETIC_DEV_PRIORITY_RULE_PACK)
        .priority,
    ).toBe('amber');
    expect(
      evaluateRisk(buildSyntheticInput(SCENARIO.green), SYNTHETIC_DEV_PRIORITY_RULE_PACK)
        .priority,
    ).toBe('green');
  });

  it('lets RED win over AMBER when both match', () => {
    const outcome = evaluateRisk(
      buildSyntheticInput(
        makeAnswers([
          {
            questionId: 'item_a1',
            state: 'answered',
            value: { kind: 'boolean', value: true },
          },
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
      ),
      SYNTHETIC_DEV_PRIORITY_RULE_PACK,
    );
    expect(outcome.priority).toBe('red');
    expect(outcome.matchedFactors.some((factor) => factor.priority === 'amber')).toBe(true);
  });

  it('does not default to GREEN when no rules match', () => {
    const outcome = evaluateRisk(
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
            value: { kind: 'option', value: 'option_three' },
          },
          {
            questionId: 'item_b1_weight',
            state: 'answered',
            value: { kind: 'measurement', value: 70, unit: 'kg' },
          },
          {
            questionId: 'item_b2',
            state: 'answered',
            value: { kind: 'number', value: 1 },
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
    expect(outcome.undeterminedReasonCategory).toBe('noExplicitGreenRule');
  });

  it('is deterministic for the same input', () => {
    const input = buildSyntheticInput(SCENARIO.amber);
    const a = evaluateRisk(input, SYNTHETIC_DEV_PRIORITY_RULE_PACK);
    const b = evaluateRisk(input, SYNTHETIC_DEV_PRIORITY_RULE_PACK);
    expect(a.priority).toBe(b.priority);
    expect(a.matchedFactors.map((f) => f.ruleId)).toEqual(
      b.matchedFactors.map((f) => f.ruleId),
    );
    expect(a.inputDigest).toBe(b.inputDigest);
  });

  it('keeps stable factor ordering', () => {
    const outcome = evaluateRisk(
      buildSyntheticInput(SCENARIO.red),
      SYNTHETIC_DEV_PRIORITY_RULE_PACK,
    );
    const orders = outcome.matchedFactors.map((factor) => factor.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
