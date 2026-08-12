import type { RiskPriority } from '../../../data/domain/enums/domainEnums';
import { RISK_AGGREGATION_STRATEGY_VERSION } from '../domain/constants';
import type { MatchedFactor, MissingInformationRecord } from '../domain/input';
import { comparePriority } from '../domain/priorities';
import type { RiskRulePackDefinition } from '../domain/rulePack';
import type {
  RuleEvaluationResult,
  UndeterminedReasonCategory,
} from '../domain/results';

export type AggregationResult = {
  readonly priority: RiskPriority;
  readonly matchedFactors: readonly MatchedFactor[];
  readonly missingInformation: readonly MissingInformationRecord[];
  readonly greenAllowedExplicitly: boolean;
  readonly undeterminedReasonCategory: UndeterminedReasonCategory | null;
  readonly explanationSummary: string;
  readonly explanationDetail: string;
  readonly aggregationStrategy: string;
  readonly aggregationStrategyVersion: number;
};

/**
 * Named strategy: highestApprovedPriorityWins (v1).
 * - Priority order: red > amber > green
 * - Blocking missing information → undetermined (never green)
 * - invalidInput / error rule results → undetermined (not coerced to notMatched)
 * - GREEN requires explicit matched green rule + completeness policy
 * - No matched rules → undetermined (GREEN is never default)
 * - All matched factors retained, sorted by rule order then ruleId
 */
export function aggregateHighestApprovedPriorityWins(input: {
  readonly pack: RiskRulePackDefinition;
  readonly ruleResults: readonly RuleEvaluationResult[];
  readonly factors: readonly MatchedFactor[];
  readonly blockingMissing: readonly MissingInformationRecord[];
  readonly nonBlockingMissing: readonly MissingInformationRecord[];
}): AggregationResult {
  const strategy = 'highestApprovedPriorityWins';
  const strategyVersion = RISK_AGGREGATION_STRATEGY_VERSION;
  const allMissing = sortMissing([
    ...input.blockingMissing,
    ...input.nonBlockingMissing,
  ]);
  const sortedFactors = sortFactors(input.factors);

  if (input.blockingMissing.length > 0) {
    return baseUndetermined({
      factors: sortedFactors,
      missing: allMissing,
      category: 'blockingUncertainty',
      detail:
        'Required information is unknown, not assessed, declined, or unanswered. Missing information is not treated as No.',
      strategy,
      strategyVersion,
    });
  }

  const hasInvalid = input.ruleResults.some(
    (result) => result.status === 'invalidInput' || result.status === 'error',
  );
  if (hasInvalid) {
    return baseUndetermined({
      factors: sortedFactors,
      missing: allMissing,
      category: 'technicalEvaluationUnavailable',
      detail: 'Recorded information requires review before a priority can be assigned.',
      strategy,
      strategyVersion,
    });
  }

  const matched = input.ruleResults.filter((result) => result.status === 'matched');
  const matchedPriorities = matched
    .map((result) => result.priority)
    .filter((priority): priority is Exclude<RiskPriority, 'undetermined'> => priority != null);

  if (matchedPriorities.length === 0) {
    return baseUndetermined({
      factors: [],
      missing: allMissing,
      category: 'noExplicitGreenRule',
      detail:
        'No approved priority rule matched. Routine monitoring is not assumed when no rule matches.',
      strategy,
      strategyVersion,
    });
  }

  const highest = matchedPriorities.reduce((best, current) =>
    comparePriority(current, best) > 0 ? current : best,
  );

  if (highest === 'green') {
    const policy = input.pack.completenessPolicy;
    const greenFactor = sortedFactors.find((factor) => factor.priority === 'green');
    const greenOk =
      policy.greenRequiresExplicitMatchedRule &&
      greenFactor != null &&
      (!policy.greenRequiresNoBlockingMissingInformation ||
        input.blockingMissing.length === 0);

    if (!greenOk) {
      return baseUndetermined({
        factors: sortedFactors,
        missing: allMissing,
        category: 'noExplicitGreenRule',
        detail:
          'Routine monitoring requires an explicit approved green rule and complete required information.',
        strategy,
        strategyVersion,
      });
    }

    return {
      priority: 'green',
      matchedFactors: sortedFactors.filter((factor) => factor.priority === 'green'),
      missingInformation: allMissing,
      greenAllowedExplicitly: true,
      undeterminedReasonCategory: null,
      explanationSummary: greenFactor.explanationSummary,
      explanationDetail: greenFactor.explanationDetail,
      aggregationStrategy: strategy,
      aggregationStrategyVersion: strategyVersion,
    };
  }

  const lead =
    sortedFactors.find((factor) => factor.priority === highest) ?? sortedFactors[0];

  return {
    priority: highest,
    matchedFactors: sortedFactors,
    missingInformation: allMissing,
    greenAllowedExplicitly: false,
    undeterminedReasonCategory: null,
    explanationSummary:
      lead?.explanationSummary ??
      'Priority was determined from matched approved development rules',
    explanationDetail:
      lead?.explanationDetail ??
      'Matched factors are listed for worker review. This is not a diagnosis.',
    aggregationStrategy: strategy,
    aggregationStrategyVersion: strategyVersion,
  };
}

function baseUndetermined(input: {
  readonly factors: readonly MatchedFactor[];
  readonly missing: readonly MissingInformationRecord[];
  readonly category: UndeterminedReasonCategory;
  readonly detail: string;
  readonly strategy: string;
  readonly strategyVersion: number;
}): AggregationResult {
  return {
    priority: 'undetermined',
    matchedFactors: input.factors,
    missingInformation: input.missing,
    greenAllowedExplicitly: false,
    undeterminedReasonCategory: input.category,
    explanationSummary: 'Priority could not be determined from the available information',
    explanationDetail: input.detail,
    aggregationStrategy: input.strategy,
    aggregationStrategyVersion: input.strategyVersion,
  };
}

function sortFactors(factors: readonly MatchedFactor[]): readonly MatchedFactor[] {
  return [...factors].sort((a, b) => a.order - b.order || a.ruleId.localeCompare(b.ruleId));
}

function sortMissing(
  items: readonly MissingInformationRecord[],
): readonly MissingInformationRecord[] {
  return [...items].sort(
    (a, b) =>
      a.questionKey.localeCompare(b.questionKey) || a.reason.localeCompare(b.reason),
  );
}
