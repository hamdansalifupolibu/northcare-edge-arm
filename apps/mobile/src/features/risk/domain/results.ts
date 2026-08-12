import type { RiskPriority } from '../../../data/domain/enums/domainEnums';
import type { RISK_ENGINE_VERSION } from './constants';
import type { MatchedFactor, MissingInformationRecord } from './input';

export const RULE_EVALUATION_STATUSES = [
  'matched',
  'notMatched',
  'notApplicable',
  'missingInput',
  'invalidInput',
  'blocked',
  'error',
] as const;
export type RuleEvaluationStatus = (typeof RULE_EVALUATION_STATUSES)[number];

export type RuleEvaluationResult = {
  readonly ruleId: string;
  readonly status: RuleEvaluationStatus;
  readonly priority: Exclude<RiskPriority, 'undetermined'> | null;
  readonly matchedConditions: readonly string[];
  readonly missingInputs: readonly MissingInformationRecord[];
  readonly explanationId: string | null;
  readonly explanationSummary: string | null;
  readonly sourceReferences: readonly string[];
  readonly evaluationOrder: number;
};

export type UndeterminedReasonCategory =
  | 'moreInformationRequired'
  | 'screeningIncomplete'
  | 'ruleSetUnavailable'
  | 'measurementUnitUnsupported'
  | 'recordedInformationRequiresReview'
  | 'technicalEvaluationUnavailable'
  | 'noExplicitGreenRule'
  | 'blockingUncertainty'
  | 'incompatibleVersions';

export type RiskEvaluationOutcome = {
  readonly priority: RiskPriority;
  readonly engineVersion: typeof RISK_ENGINE_VERSION;
  readonly rulePackId: string;
  readonly rulePackVersion: number;
  readonly rulePackStatus: string;
  readonly developmentBanner: string | null;
  readonly aggregationStrategy: string;
  readonly aggregationStrategyVersion: number;
  readonly screeningTemplateId: string;
  readonly screeningTemplateVersion: number;
  readonly matchedFactors: readonly MatchedFactor[];
  readonly missingInformation: readonly MissingInformationRecord[];
  readonly ruleResults: readonly RuleEvaluationResult[];
  readonly explanationSummary: string;
  readonly explanationDetail: string;
  readonly explanationVersion: string;
  readonly undeterminedReasonCategory: UndeterminedReasonCategory | null;
  readonly greenAllowedExplicitly: boolean;
  readonly inputDigest: string;
};

export type RiskUiState =
  | 'idle'
  | 'resolvingRulePack'
  | 'validatingInput'
  | 'evaluating'
  | 'resultReady'
  | 'awaitingAcknowledgement'
  | 'saving'
  | 'saved'
  | 'rulePackUnavailable'
  | 'inputIncomplete'
  | 'evaluationFailed'
  | 'saveFailed';
