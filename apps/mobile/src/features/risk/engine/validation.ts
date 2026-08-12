import { MEASUREMENT_UNITS, RISK_PRIORITIES } from '../../../data/domain/enums/domainEnums';
import {
  RISK_AGGREGATION_STRATEGIES,
  RISK_ENGINE_VERSION,
} from '../domain/constants';
import {
  SUPPORTED_CONDITION_OPS,
  type RiskCondition,
  type SupportedConditionOp,
} from '../domain/conditions';
import { RiskEngineError } from '../domain/errors';
import {
  RISK_CONTENT_STATUSES,
  type RiskRulePackDefinition,
} from '../domain/rulePack';
import { canonicalJson, stableChecksum } from './checksum';

export type RulePackValidationResult =
  | { readonly ok: true; readonly checksum: string }
  | { readonly ok: false; readonly reasons: readonly string[] };

export function validateRulePack(pack: RiskRulePackDefinition): RulePackValidationResult {
  const reasons: string[] = [];

  if (!pack.rulePackId.trim()) {
    reasons.push('missingRulePackId');
  }
  if (!Number.isInteger(pack.version) || pack.version < 1) {
    reasons.push('invalidVersion');
  }
  if (!RISK_CONTENT_STATUSES.includes(pack.status)) {
    reasons.push('invalidStatus');
  }
  if (pack.engineCompatibilityVersion !== RISK_ENGINE_VERSION) {
    reasons.push('incompatibleEngineVersion');
  }
  if (!RISK_AGGREGATION_STRATEGIES.includes(pack.aggregationStrategy)) {
    reasons.push('unsupportedAggregation');
  }
  if (!pack.applicableScreeningTemplateIds.length) {
    reasons.push('missingTemplateIds');
  }
  if (!pack.applicableScreeningTemplateVersions.length) {
    reasons.push('missingTemplateVersions');
  }
  if (!pack.sourceReferences.length && pack.status === 'APPROVED_FOR_PILOT') {
    reasons.push('missingSourceMetadata');
  }
  if (pack.effectiveDate && pack.retiredDate && pack.retiredDate < pack.effectiveDate) {
    reasons.push('invalidDateRange');
  }

  const ruleIds = new Set<string>();
  const knownKeys = new Set(pack.knownQuestionKeys);
  for (const rule of pack.rules) {
    if (ruleIds.has(rule.ruleId)) {
      reasons.push(`duplicateRuleId:${rule.ruleId}`);
    }
    ruleIds.add(rule.ruleId);
    if (!rule.enabled) {
      continue;
    }
    if (!(RISK_PRIORITIES as readonly string[]).includes(rule.priority)) {
      reasons.push(`unsupportedPriority:${rule.ruleId}`);
    }
    if (!rule.explanation?.explanationId) {
      reasons.push(`missingExplanation:${rule.ruleId}`);
    }
    if (!rule.sourceReferences.length && pack.status === 'APPROVED_FOR_PILOT') {
      reasons.push(`missingRuleSource:${rule.ruleId}`);
    }
    collectConditionIssues(rule.condition, knownKeys, reasons, rule.ruleId);
    for (const required of rule.requiredInputs) {
      if (!knownKeys.has(required)) {
        reasons.push(`unknownRequiredInput:${rule.ruleId}:${required}`);
      }
    }
  }

  if (!pack.completenessPolicy.greenRequiresExplicitMatchedRule) {
    // Allowed only when explicitly false — still valid, but GREEN path must still
    // satisfy other completeness gates in aggregation.
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }
  return { ok: true, checksum: computeRulePackChecksum(pack) };
}

export function assertValidRulePack(pack: RiskRulePackDefinition): string {
  const result = validateRulePack(pack);
  if (!result.ok) {
    throw new RiskEngineError(
      'rulePackInvalid',
      'Priority rule pack failed integrity validation',
    );
  }
  return result.checksum;
}

export function computeRulePackChecksum(pack: RiskRulePackDefinition): string {
  return stableChecksum(
    canonicalJson({
      rulePackId: pack.rulePackId,
      version: pack.version,
      engineCompatibilityVersion: pack.engineCompatibilityVersion,
      status: pack.status,
      aggregationStrategy: pack.aggregationStrategy,
      completenessPolicy: pack.completenessPolicy,
      rules: pack.rules.map((rule) => ({
        ruleId: rule.ruleId,
        priority: rule.priority,
        order: rule.order,
        enabled: rule.enabled,
        condition: rule.condition,
        requiredInputs: rule.requiredInputs,
        explanationId: rule.explanation.explanationId,
        explanationVersion: rule.explanation.version,
      })),
    }),
  );
}

function collectConditionIssues(
  condition: RiskCondition,
  knownKeys: ReadonlySet<string>,
  reasons: string[],
  ruleId: string,
): void {
  if (!SUPPORTED_CONDITION_OPS.includes(condition.op as SupportedConditionOp)) {
    reasons.push(`unsupportedOperator:${ruleId}:${condition.op}`);
    return;
  }
  switch (condition.op) {
    case 'all':
    case 'any':
      for (const child of condition.conditions) {
        collectConditionIssues(child, knownKeys, reasons, ruleId);
      }
      return;
    case 'not':
      collectConditionIssues(condition.condition, knownKeys, reasons, ruleId);
      return;
    case 'equals':
    case 'notEquals':
    case 'in':
    case 'notIn':
    case 'exists':
    case 'isMissing':
    case 'answerStateIs':
    case 'greaterThan':
    case 'greaterThanOrEqual':
    case 'lessThan':
    case 'lessThanOrEqual':
    case 'between':
    case 'outsideRange': {
      const key = 'questionKey' in condition ? condition.questionKey : null;
      if (key && !knownKeys.has(key)) {
        reasons.push(`unknownQuestionKey:${ruleId}:${key}`);
      }
      if (
        'measurementUnit' in condition &&
        condition.measurementUnit &&
        !MEASUREMENT_UNITS.includes(condition.measurementUnit)
      ) {
        reasons.push(`invalidUnit:${ruleId}:${condition.measurementUnit}`);
      }
      return;
    }
    default:
      return;
  }
}
