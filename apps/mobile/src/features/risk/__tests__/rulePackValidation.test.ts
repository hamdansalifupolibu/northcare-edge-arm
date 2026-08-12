import { SYNTHETIC_DEV_PRIORITY_RULE_PACK } from '../content/development/syntheticDevPriorityRulePack';
import { listLoadableRulePacks } from '../content/registry';
import type { RiskRulePackDefinition } from '../domain/rulePack';
import {
  computeRulePackChecksum,
  validateRulePack,
} from '../engine/validation';

function clonePack(
  overrides: Partial<RiskRulePackDefinition> = {},
): RiskRulePackDefinition {
  return {
    ...SYNTHETIC_DEV_PRIORITY_RULE_PACK,
    ...overrides,
    rules: overrides.rules ?? SYNTHETIC_DEV_PRIORITY_RULE_PACK.rules,
    completenessPolicy:
      overrides.completenessPolicy ?? SYNTHETIC_DEV_PRIORITY_RULE_PACK.completenessPolicy,
  };
}

describe('rule pack validation', () => {
  it('accepts the valid development pack', () => {
    const result = validateRulePack(SYNTHETIC_DEV_PRIORITY_RULE_PACK);
    expect(result.ok).toBe(true);
  });

  it('rejects duplicate rule IDs', () => {
    const pack = clonePack({
      rules: [
        SYNTHETIC_DEV_PRIORITY_RULE_PACK.rules[0]!,
        { ...SYNTHETIC_DEV_PRIORITY_RULE_PACK.rules[0]!, order: 99 },
      ],
    });
    const result = validateRulePack(pack);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasons.some((reason) => reason.startsWith('duplicateRuleId'))).toBe(
        true,
      );
    }
  });

  it('rejects unsupported operators and unknown question keys', () => {
    const pack = clonePack({
      rules: [
        {
          ...SYNTHETIC_DEV_PRIORITY_RULE_PACK.rules[0]!,
          condition: {
            op: 'equals',
            questionKey: 'not_a_real_question',
            value: true,
          },
        },
      ],
    });
    const result = validateRulePack(pack);
    expect(result.ok).toBe(false);
  });

  it('rejects missing explanation IDs', () => {
    const pack = clonePack({
      rules: [
        {
          ...SYNTHETIC_DEV_PRIORITY_RULE_PACK.rules[0]!,
          explanation: {
            ...SYNTHETIC_DEV_PRIORITY_RULE_PACK.rules[0]!.explanation,
            explanationId: '',
          },
        },
      ],
    });
    const result = validateRulePack(pack);
    expect(result.ok).toBe(false);
  });

  it('rejects unsupported aggregation strategies', () => {
    const pack = clonePack({
      aggregationStrategy: 'notAStrategy' as RiskRulePackDefinition['aggregationStrategy'],
    });
    const result = validateRulePack(pack);
    expect(result.ok).toBe(false);
  });

  it('blocks development packs in production loading', () => {
    expect(listLoadableRulePacks('production')).toEqual([]);
    expect(
      listLoadableRulePacks('development').some(
        (pack) => pack.rulePackId === SYNTHETIC_DEV_PRIORITY_RULE_PACK.rulePackId,
      ),
    ).toBe(true);
  });

  it('produces a stable checksum', () => {
    expect(computeRulePackChecksum(SYNTHETIC_DEV_PRIORITY_RULE_PACK)).toBe(
      computeRulePackChecksum(SYNTHETIC_DEV_PRIORITY_RULE_PACK),
    );
  });
});
