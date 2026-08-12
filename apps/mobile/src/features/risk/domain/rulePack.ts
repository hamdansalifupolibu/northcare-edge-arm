import type { RiskPriority } from '../../../data/domain/enums/domainEnums';
import type { RiskAggregationStrategyId } from './constants';
import type { RiskCondition } from './conditions';

export const RISK_CONTENT_STATUSES = [
  'DRAFT',
  'CLINICAL_REVIEW_REQUIRED',
  'APPROVED_FOR_DEVELOPMENT',
  'APPROVED_FOR_PILOT',
  'RETIRED',
] as const;
export type RiskContentStatus = (typeof RISK_CONTENT_STATUSES)[number];

export type RiskExplanationFragment = {
  readonly explanationId: string;
  readonly version: number;
  readonly summary: string;
  readonly detail: string;
  readonly reviewStatus: RiskContentStatus;
  readonly sourceReferences: readonly string[];
};

export type RiskRuleDefinition = {
  readonly ruleId: string;
  readonly title: string;
  readonly priority: Exclude<RiskPriority, 'undetermined'>;
  readonly description: string;
  readonly order: number;
  readonly enabled: boolean;
  readonly condition: RiskCondition;
  readonly requiredInputs: readonly string[];
  readonly explanation: RiskExplanationFragment;
  readonly workerActionText: string;
  readonly sourceReferences: readonly string[];
  readonly contentReviewStatus: RiskContentStatus;
  readonly effectiveDate: string | null;
  readonly retiredDate: string | null;
};

export type CompletenessPolicy = {
  readonly greenRequiresExplicitMatchedRule: boolean;
  readonly greenRequiresNoBlockingMissingInformation: boolean;
  readonly greenRequiresCompleteRequiredInputs: readonly string[];
  readonly blockingAnswerStates: readonly (
    | 'unknown'
    | 'notAssessed'
    | 'declined'
    | 'unanswered'
  )[];
};

export type RiskRulePackDefinition = {
  readonly rulePackId: string;
  readonly title: string;
  readonly description: string;
  readonly version: number;
  readonly engineCompatibilityVersion: number;
  readonly status: RiskContentStatus;
  readonly applicableScreeningTemplateIds: readonly string[];
  readonly applicableScreeningTemplateVersions: readonly number[];
  readonly applicableClientCategories: readonly string[];
  readonly applicableVisitTypes: readonly string[];
  readonly effectiveDate: string | null;
  readonly retiredDate: string | null;
  readonly sourceReferences: readonly string[];
  readonly clinicalReview: {
    readonly required: boolean;
    readonly reviewedBy: string | null;
    readonly reviewedAt: string | null;
  };
  readonly developmentBanner: string;
  readonly aggregationStrategy: RiskAggregationStrategyId;
  readonly aggregationStrategyVersion: number;
  readonly completenessPolicy: CompletenessPolicy;
  readonly explanationVersion: string;
  readonly knownQuestionKeys: readonly string[];
  readonly rules: readonly RiskRuleDefinition[];
};
