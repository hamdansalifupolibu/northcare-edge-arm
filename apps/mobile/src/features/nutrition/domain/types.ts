import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import type { MeasurementType, MeasurementUnit } from '../../../data/domain/enums/domainEnums';
import type {
  ScreeningQuestionDefinition,
  ScreeningSectionDefinition,
} from '../../screening/content/types';
import type {
  NutritionAssessmentType,
  NutritionContentStatus,
  NutritionFollowUpSource,
  NutritionGuidanceResolutionOutcome,
  NutritionReferenceResultStatus,
} from './statuses';

export type NutritionAgeApplicability = {
  readonly minAgeDays: number | null;
  readonly maxAgeDays: number | null;
  readonly allowApproximateAge: boolean;
  readonly requireExactAge: boolean;
};

export type NutritionAssessmentTemplateDefinition = {
  readonly templateId: string;
  readonly version: number;
  readonly status: NutritionContentStatus;
  readonly assessmentType: NutritionAssessmentType;
  readonly title: string;
  readonly developmentBanner: string;
  readonly clinicalSourceRef: string | null;
  readonly applicableClientCategories: readonly ClientCategory[];
  readonly ageApplicability: NutritionAgeApplicability;
  readonly requiredMeasurementTypes: readonly MeasurementType[];
  readonly optionalMeasurementTypes: readonly MeasurementType[];
  readonly referencePackIds: readonly string[];
  readonly guidancePackIds: readonly string[];
  readonly sections: readonly ScreeningSectionDefinition[];
  readonly knownLimitations: readonly string[];
};

export type NutritionReferenceCondition =
  | { readonly op: 'hasMeasurement'; readonly measurementType: MeasurementType }
  | { readonly op: 'measurementLessThan'; readonly measurementType: MeasurementType; readonly threshold: number }
  | { readonly op: 'measurementBetween'; readonly measurementType: MeasurementType; readonly min: number; readonly max: number }
  | { readonly op: 'measurementGreaterThanOrEqual'; readonly measurementType: MeasurementType; readonly threshold: number }
  | { readonly op: 'answerEquals'; readonly questionId: string; readonly value: string | number | boolean }
  | { readonly op: 'answerState'; readonly questionId: string; readonly state: string }
  | { readonly op: 'all'; readonly conditions: readonly NutritionReferenceCondition[] }
  | { readonly op: 'any'; readonly conditions: readonly NutritionReferenceCondition[] };

export type NutritionReferenceRule = {
  readonly ruleId: string;
  readonly order: number;
  readonly condition: NutritionReferenceCondition;
  readonly interpretationCode: string;
  readonly explanationId: string;
  readonly derivedValueExpression: 'measurementNumeric' | 'none';
  readonly measurementType?: MeasurementType;
  readonly targetUnit?: MeasurementUnit;
};

export type NutritionReferencePackDefinition = {
  readonly referencePackId: string;
  readonly title: string;
  readonly version: number;
  readonly status: NutritionContentStatus;
  readonly engineCompatibilityVersion: number;
  readonly developmentBanner: string;
  readonly applicableAssessmentTemplateIds: readonly string[];
  readonly applicableClientCategories: readonly ClientCategory[];
  readonly ageApplicability: NutritionAgeApplicability;
  readonly requiredMeasurements: readonly MeasurementType[];
  readonly supportedUnits: readonly MeasurementUnit[];
  readonly allowApproximateAge: boolean;
  readonly rules: readonly NutritionReferenceRule[];
  readonly knownLimitations: readonly string[];
  readonly clinicalSourceRef: string | null;
};

export type NutritionGuidanceCondition =
  | { readonly op: 'interpretationCode'; readonly code: string }
  | { readonly op: 'answerEquals'; readonly questionId: string; readonly value: string | number | boolean }
  | { readonly op: 'answerState'; readonly questionId: string; readonly state: string }
  | { readonly op: 'all'; readonly conditions: readonly NutritionGuidanceCondition[] }
  | { readonly op: 'any'; readonly conditions: readonly NutritionGuidanceCondition[] };

export type NutritionGuidanceCard = {
  readonly guidanceId: string;
  readonly heading: string;
  readonly body: string;
  readonly priorityOrder: number;
  readonly applicableConditions: NutritionGuidanceCondition;
  readonly workerActionText: string;
  readonly caregiverFacingText: string;
  readonly sourceReferences: readonly string[];
  readonly reviewStatus: NutritionContentStatus;
  readonly translationStatus: 'notTranslated' | 'enOnly';
};

export type NutritionGuidancePackDefinition = {
  readonly guidancePackId: string;
  readonly title: string;
  readonly version: number;
  readonly status: NutritionContentStatus;
  readonly developmentBanner: string;
  readonly applicableAssessmentTemplateIds: readonly string[];
  readonly applicableReferencePackIds: readonly string[];
  readonly applicableClientCategories: readonly ClientCategory[];
  readonly applicableInterpretationCodes: readonly string[];
  readonly cards: readonly NutritionGuidanceCard[];
  readonly knownLimitations: readonly string[];
  readonly clinicalSourceRef: string | null;
  readonly effectiveDate: string | null;
  readonly retiredDate: string | null;
};

export type NutritionReferenceEvaluationResult = {
  readonly status: NutritionReferenceResultStatus;
  readonly referencePackId: string | null;
  readonly referencePackVersion: number | null;
  readonly engineVersion: number;
  readonly interpretationCode: string | null;
  readonly derivedValue: number | null;
  readonly derivedUnit: MeasurementUnit | null;
  readonly explanationId: string | null;
  readonly missingInformation: readonly string[];
  readonly inputMeasurementIds: readonly string[];
  readonly isDevelopment: boolean;
  readonly developmentBanner: string | null;
};

export type NutritionGuidanceResolutionResult = {
  readonly outcome: NutritionGuidanceResolutionOutcome;
  readonly guidancePackId: string | null;
  readonly guidancePackVersion: number | null;
  readonly guidanceIds: readonly string[];
  readonly cards: readonly NutritionGuidanceCard[];
  readonly isDevelopment: boolean;
  readonly developmentBanner: string | null;
  readonly missingInformation: readonly string[];
};

export type { NutritionFollowUpSource, ScreeningQuestionDefinition };
