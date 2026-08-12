import type { VoiceAllowedTargetType, VoiceSuggestionValueType } from '../../../domain/types';

export type ExtractionSchemaContentStatus =
  | 'DRAFT'
  | 'REVIEW_REQUIRED'
  | 'APPROVED_FOR_DEVELOPMENT'
  | 'APPROVED_FOR_PILOT'
  | 'RETIRED';

export type ExtractionSchemaField = {
  readonly targetType: VoiceAllowedTargetType;
  readonly targetKey: string;
  readonly valueType: VoiceSuggestionValueType;
  readonly requiredReview: true;
  readonly label: string;
};

export type ExtractionSchemaDefinition = {
  readonly schemaId: string;
  readonly title: string;
  readonly version: number;
  readonly status: ExtractionSchemaContentStatus;
  readonly applicableClientCategories: readonly string[];
  readonly applicableVisitTypes: readonly string[];
  readonly applicableScreeningTemplates: readonly string[];
  readonly allowedTargets: readonly ExtractionSchemaField[];
  readonly reviewRequirements: readonly string[];
  readonly sourceReferences: readonly string[];
  readonly clinicalReviewStatus: string;
  readonly languageSupport: readonly string[];
  readonly providerCompatibility: readonly string[];
  readonly developmentBanner?: string;
};
