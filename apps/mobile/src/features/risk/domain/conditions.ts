import type { MeasurementUnit } from '../../../data/domain/enums/domainEnums';
import type { ScreeningAnswerState } from '../../screening/content/types';

/**
 * Typed condition model — no eval, Function, or string JS expressions.
 * Every operator documents missing-input behaviour in conditionEvaluator.
 */
export type RiskCondition =
  | { readonly op: 'all'; readonly conditions: readonly RiskCondition[] }
  | { readonly op: 'any'; readonly conditions: readonly RiskCondition[] }
  | { readonly op: 'not'; readonly condition: RiskCondition }
  | {
      readonly op: 'equals';
      readonly questionKey: string;
      readonly value: string | number | boolean;
    }
  | {
      readonly op: 'notEquals';
      readonly questionKey: string;
      readonly value: string | number | boolean;
    }
  | {
      readonly op: 'in';
      readonly questionKey: string;
      readonly values: readonly (string | number | boolean)[];
    }
  | {
      readonly op: 'notIn';
      readonly questionKey: string;
      readonly values: readonly (string | number | boolean)[];
    }
  | { readonly op: 'exists'; readonly questionKey: string }
  | { readonly op: 'isMissing'; readonly questionKey: string }
  | {
      readonly op: 'answerStateIs';
      readonly questionKey: string;
      readonly state: ScreeningAnswerState | 'unanswered';
    }
  | {
      readonly op: 'greaterThan';
      readonly questionKey: string;
      readonly value: number;
      readonly measurementUnit?: MeasurementUnit;
    }
  | {
      readonly op: 'greaterThanOrEqual';
      readonly questionKey: string;
      readonly value: number;
      readonly measurementUnit?: MeasurementUnit;
    }
  | {
      readonly op: 'lessThan';
      readonly questionKey: string;
      readonly value: number;
      readonly measurementUnit?: MeasurementUnit;
    }
  | {
      readonly op: 'lessThanOrEqual';
      readonly questionKey: string;
      readonly value: number;
      readonly measurementUnit?: MeasurementUnit;
    }
  | {
      readonly op: 'between';
      readonly questionKey: string;
      readonly min: number;
      readonly max: number;
      readonly measurementUnit?: MeasurementUnit;
    }
  | {
      readonly op: 'outsideRange';
      readonly questionKey: string;
      readonly min: number;
      readonly max: number;
      readonly measurementUnit?: MeasurementUnit;
    }
  | { readonly op: 'clientCategoryIs'; readonly category: string }
  | { readonly op: 'visitTypeIs'; readonly visitType: string }
  | {
      readonly op: 'ageInRange';
      readonly minYearsInclusive: number;
      readonly maxYearsInclusive: number;
      readonly allowApproximate?: boolean;
    }
  | { readonly op: 'screeningTemplateIs'; readonly templateId: string }
  | { readonly op: 'templateVersionIs'; readonly version: number };

export const SUPPORTED_CONDITION_OPS = [
  'all',
  'any',
  'not',
  'equals',
  'notEquals',
  'in',
  'notIn',
  'exists',
  'isMissing',
  'answerStateIs',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'between',
  'outsideRange',
  'clientCategoryIs',
  'visitTypeIs',
  'ageInRange',
  'screeningTemplateIs',
  'templateVersionIs',
] as const;

export type SupportedConditionOp = (typeof SUPPORTED_CONDITION_OPS)[number];
