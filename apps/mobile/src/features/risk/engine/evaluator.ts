import { RISK_ENGINE_VERSION } from '../domain/constants';
import { RiskEngineError } from '../domain/errors';
import type {
  MatchedFactor,
  MissingInformationRecord,
  RiskEngineInput,
} from '../domain/input';
import type { RiskRuleDefinition, RiskRulePackDefinition } from '../domain/rulePack';
import type { RiskEvaluationOutcome, RuleEvaluationResult } from '../domain/results';
import { aggregateHighestApprovedPriorityWins } from './aggregation';
import { canonicalJson, stableChecksum } from './checksum';
import { evaluateCondition } from './conditionEvaluator';
import { assertValidRulePack } from './validation';

/**
 * Deterministic priority evaluation. React-independent.
 * Evaluation time must be recorded by the caller after this returns.
 */
export function evaluateRisk(
  input: RiskEngineInput,
  pack: RiskRulePackDefinition,
): RiskEvaluationOutcome {
  assertValidRulePack(pack);

  if (input.completionState !== 'completed') {
    throw new RiskEngineError('screeningIncomplete', 'Screening is incomplete');
  }
  if (!input.workerConfirmation) {
    throw new RiskEngineError('inputInvalid', 'Worker confirmation is required');
  }
  if (
    !pack.applicableScreeningTemplateIds.includes(input.screeningTemplateId) ||
    !pack.applicableScreeningTemplateVersions.includes(input.screeningTemplateVersion)
  ) {
    throw new RiskEngineError(
      'incompatibleTemplate',
      'Rule pack is not compatible with this screening template',
    );
  }

  const enabledRules = [...pack.rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.order - b.order || a.ruleId.localeCompare(b.ruleId));

  const ruleResults: RuleEvaluationResult[] = [];
  const factors: MatchedFactor[] = [];
  const blockingMissing: MissingInformationRecord[] = [];
  const nonBlockingMissing: MissingInformationRecord[] = [];

  // Completeness: required green inputs with blocking states
  for (const questionKey of pack.completenessPolicy.greenRequiresCompleteRequiredInputs) {
    const answer = input.answers.find((item) => item.questionKey === questionKey);
    const state = answer?.state ?? 'unanswered';
    if (
      pack.completenessPolicy.blockingAnswerStates.includes(
        state as 'unknown' | 'notAssessed' | 'declined' | 'unanswered',
      )
    ) {
      const reason =
        state === 'unknown' ||
        state === 'notAssessed' ||
        state === 'declined' ||
        state === 'unanswered'
          ? state
          : 'unanswered';
      blockingMissing.push({
        questionKey,
        sectionId: null,
        reason,
        requiredByRuleIds: [],
        workerFacingLabel: `Assessment item ${questionKey} needs a recorded answer`,
        blocking: true,
        sourceReference: null,
      });
    }
  }

  for (const rule of enabledRules) {
    const result = evaluateRule(rule, input, pack);
    ruleResults.push(result);
    if (result.status === 'matched' && result.priority) {
      factors.push({
        ruleId: rule.ruleId,
        factorCode: rule.ruleId,
        factorLabel: rule.title,
        priority: result.priority,
        sourceQuestionKey: rule.requiredInputs[0] ?? null,
        sourceMeasurementId: null,
        explanationId: rule.explanation.explanationId,
        explanationSummary: rule.explanation.summary,
        explanationDetail: rule.explanation.detail,
        workerActionText: rule.workerActionText,
        ruleVersion: `${pack.rulePackId}@${pack.version}`,
        order: rule.order,
      });
    }
    for (const missing of result.missingInputs) {
      if (missing.blocking) {
        blockingMissing.push(missing);
      } else {
        nonBlockingMissing.push(missing);
      }
    }
  }

  const aggregated = aggregateHighestApprovedPriorityWins({
    pack,
    ruleResults,
    factors,
    blockingMissing: dedupeMissing(blockingMissing),
    nonBlockingMissing: dedupeMissing(nonBlockingMissing),
  });

  return {
    priority: aggregated.priority,
    engineVersion: RISK_ENGINE_VERSION,
    rulePackId: pack.rulePackId,
    rulePackVersion: pack.version,
    rulePackStatus: pack.status,
    developmentBanner:
      pack.status === 'APPROVED_FOR_DEVELOPMENT' ? pack.developmentBanner : null,
    aggregationStrategy: aggregated.aggregationStrategy,
    aggregationStrategyVersion: aggregated.aggregationStrategyVersion,
    screeningTemplateId: input.screeningTemplateId,
    screeningTemplateVersion: input.screeningTemplateVersion,
    matchedFactors: aggregated.matchedFactors,
    missingInformation: aggregated.missingInformation,
    ruleResults,
    explanationSummary: aggregated.explanationSummary,
    explanationDetail: aggregated.explanationDetail,
    explanationVersion: pack.explanationVersion,
    undeterminedReasonCategory: aggregated.undeterminedReasonCategory,
    greenAllowedExplicitly: aggregated.greenAllowedExplicitly,
    inputDigest: buildInputDigest(input),
  };
}

function evaluateRule(
  rule: RiskRuleDefinition,
  input: RiskEngineInput,
  pack: RiskRulePackDefinition,
): RuleEvaluationResult {
  const missingInputs: MissingInformationRecord[] = [];

  for (const questionKey of rule.requiredInputs) {
    const answer = input.answers.find((item) => item.questionKey === questionKey);
    const state = answer?.state ?? 'unanswered';
    if (
      pack.completenessPolicy.blockingAnswerStates.includes(
        state as 'unknown' | 'notAssessed' | 'declined' | 'unanswered',
      )
    ) {
      const reason =
        state === 'unknown' ||
        state === 'notAssessed' ||
        state === 'declined' ||
        state === 'unanswered'
          ? state
          : 'unanswered';
      // Rule-local missing inputs do not block a higher matched priority.
      // Completeness-policy blocking items are collected separately above.
      missingInputs.push({
        questionKey,
        sectionId: null,
        reason,
        requiredByRuleIds: [rule.ruleId],
        workerFacingLabel: `Assessment item ${questionKey} needs a recorded answer`,
        blocking: false,
        sourceReference: rule.sourceReferences[0] ?? null,
      });
    }
  }

  if (missingInputs.length > 0) {
    return {
      ruleId: rule.ruleId,
      status: 'missingInput',
      priority: rule.priority,
      matchedConditions: [],
      missingInputs,
      explanationId: rule.explanation.explanationId,
      explanationSummary: rule.explanation.summary,
      sourceReferences: rule.sourceReferences,
      evaluationOrder: rule.order,
    };
  }

  const conditionResult = evaluateCondition(rule.condition, input);
  if (conditionResult.status === 'missingInput') {
    return {
      ruleId: rule.ruleId,
      status: 'missingInput',
      priority: rule.priority,
      matchedConditions: [],
      missingInputs: [
        {
          questionKey: conditionResult.questionKey ?? rule.requiredInputs[0] ?? 'unknown',
          sectionId: null,
          reason: 'unknown',
          requiredByRuleIds: [rule.ruleId],
          workerFacingLabel: 'Additional recorded information is required for this rule',
          blocking: false,
          sourceReference: rule.sourceReferences[0] ?? null,
        },
      ],
      explanationId: rule.explanation.explanationId,
      explanationSummary: rule.explanation.summary,
      sourceReferences: rule.sourceReferences,
      evaluationOrder: rule.order,
    };
  }
  if (conditionResult.status === 'invalidInput') {
    return {
      ruleId: rule.ruleId,
      status: 'invalidInput',
      priority: rule.priority,
      matchedConditions: [],
      missingInputs: [],
      explanationId: rule.explanation.explanationId,
      explanationSummary: rule.explanation.summary,
      sourceReferences: rule.sourceReferences,
      evaluationOrder: rule.order,
    };
  }
  if (conditionResult.status === 'notApplicable') {
    return {
      ruleId: rule.ruleId,
      status: 'notApplicable',
      priority: rule.priority,
      matchedConditions: [],
      missingInputs: [],
      explanationId: rule.explanation.explanationId,
      explanationSummary: rule.explanation.summary,
      sourceReferences: rule.sourceReferences,
      evaluationOrder: rule.order,
    };
  }
  if (conditionResult.status === 'true') {
    return {
      ruleId: rule.ruleId,
      status: 'matched',
      priority: rule.priority,
      matchedConditions: [conditionResult.detail],
      missingInputs: [],
      explanationId: rule.explanation.explanationId,
      explanationSummary: rule.explanation.summary,
      sourceReferences: rule.sourceReferences,
      evaluationOrder: rule.order,
    };
  }
  return {
    ruleId: rule.ruleId,
    status: 'notMatched',
    priority: rule.priority,
    matchedConditions: [],
    missingInputs: [],
    explanationId: rule.explanation.explanationId,
    explanationSummary: rule.explanation.summary,
    sourceReferences: rule.sourceReferences,
    evaluationOrder: rule.order,
  };
}

function dedupeMissing(
  items: readonly MissingInformationRecord[],
): readonly MissingInformationRecord[] {
  const map = new Map<string, MissingInformationRecord>();
  for (const item of items) {
    const key = `${item.questionKey}:${item.reason}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }
    map.set(key, {
      ...existing,
      requiredByRuleIds: [
        ...new Set([...existing.requiredByRuleIds, ...item.requiredByRuleIds]),
      ].sort(),
      blocking: existing.blocking || item.blocking,
    });
  }
  return [...map.values()];
}

function buildInputDigest(input: RiskEngineInput): string {
  return stableChecksum(
    canonicalJson({
      screeningId: input.screeningId,
      screeningTemplateId: input.screeningTemplateId,
      screeningTemplateVersion: input.screeningTemplateVersion,
      clientCategory: input.clientCategory,
      visitType: input.visitType,
      completionState: input.completionState,
      workerConfirmation: input.workerConfirmation,
      answers: input.answers.map((answer) => ({
        questionKey: answer.questionKey,
        state: answer.state,
        valueKind: answer.value?.kind ?? null,
        // Non-identifying structural digest only — no free text bodies.
        value:
          answer.value == null
            ? null
            : answer.value.kind === 'text'
              ? { kind: 'text', length: answer.value.value.length }
              : answer.value,
      })),
      measurements: input.measurements.map((measurement) => ({
        measurementType: measurement.measurementType,
        unit: measurement.unit,
        // Omit numeric value from digest? Spec says canonical non-identifying.
        // Measurements are synthetic in tests; still avoid logging. Digest may
        // include numeric for reproducibility of evaluation without identity.
        numericValue: measurement.numericValue,
        questionKey: measurement.questionKey,
      })),
    }),
  );
}
