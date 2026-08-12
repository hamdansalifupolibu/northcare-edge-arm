import type { MeasurementType, MeasurementUnit, ScreeningType } from '../../../data/domain/enums/domainEnums';

/**
 * Governance statuses for screening templates.
 * Production may load APPROVED_FOR_PILOT only.
 * Development may also load APPROVED_FOR_DEVELOPMENT.
 * DRAFT / CLINICAL_REVIEW_REQUIRED / RETIRED are never loaded for new visits in production.
 */
export const SCREENING_CONTENT_STATUSES = [
  'DRAFT',
  'CLINICAL_REVIEW_REQUIRED',
  'APPROVED_FOR_DEVELOPMENT',
  'APPROVED_FOR_PILOT',
  'RETIRED',
] as const;
export type ScreeningContentStatus = (typeof SCREENING_CONTENT_STATUSES)[number];

export const SCREENING_ANSWER_TYPES = [
  'yesNo',
  'singleChoice',
  'multipleChoice',
  'text',
  'integer',
  'decimal',
  'date',
  'time',
  'measurement',
  'informationAcknowledgement',
] as const;
export type ScreeningAnswerType = (typeof SCREENING_ANSWER_TYPES)[number];

export const SCREENING_ANSWER_STATES = [
  'answered',
  'unknown',
  'notAssessed',
  'declined',
  'notApplicable',
  'skippedByCondition',
] as const;
export type ScreeningAnswerState = (typeof SCREENING_ANSWER_STATES)[number];

export type VisibilityCondition =
  | { readonly op: 'equals'; readonly questionId: string; readonly value: string | number | boolean }
  | {
      readonly op: 'notEquals';
      readonly questionId: string;
      readonly value: string | number | boolean;
    }
  | { readonly op: 'includes'; readonly questionId: string; readonly value: string }
  | { readonly op: 'exists'; readonly questionId: string }
  | {
      readonly op: 'numberGreaterThanOrEqual';
      readonly questionId: string;
      readonly value: number;
    }
  | { readonly op: 'numberLessThan'; readonly questionId: string; readonly value: number }
  | { readonly op: 'all'; readonly conditions: readonly VisibilityCondition[] }
  | { readonly op: 'any'; readonly conditions: readonly VisibilityCondition[] };

export type ScreeningChoiceOption = {
  readonly id: string;
  readonly label: string;
};

export type ScreeningQuestionDefinition = {
  readonly id: string;
  readonly label: string;
  readonly helpText?: string;
  readonly answerType: ScreeningAnswerType;
  readonly required?: boolean;
  readonly options?: readonly ScreeningChoiceOption[];
  readonly measurementType?: MeasurementType;
  readonly measurementUnit?: MeasurementUnit;
  readonly visibleWhen?: VisibilityCondition;
  /** Allows unknown / not assessed / declined without inventing a clinical default. */
  readonly allowUnknown?: boolean;
  readonly allowNotAssessed?: boolean;
  readonly allowDeclined?: boolean;
  readonly allowNotApplicable?: boolean;
};

export type ScreeningSectionDefinition = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly questions: readonly ScreeningQuestionDefinition[];
};

export type ScreeningTemplateDefinition = {
  readonly templateId: string;
  readonly version: number;
  readonly status: ScreeningContentStatus;
  readonly screeningType: ScreeningType;
  readonly title: string;
  /** Honest labelling for synthetic / non-clinical packs. */
  readonly developmentBanner: string;
  readonly sections: readonly ScreeningSectionDefinition[];
  readonly clinicalSourceRef?: string | null;
};

export type RecordedAnswerValue =
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'date'; readonly value: string }
  | { readonly kind: 'time'; readonly value: string }
  | { readonly kind: 'option'; readonly value: string }
  | { readonly kind: 'multipleOptions'; readonly values: readonly string[] }
  | { readonly kind: 'measurement'; readonly value: number; readonly unit: MeasurementUnit }
  | { readonly kind: 'acknowledgement'; readonly acknowledged: true };

export type RecordedScreeningAnswer = {
  readonly questionId: string;
  readonly state: ScreeningAnswerState;
  readonly value?: RecordedAnswerValue;
};
