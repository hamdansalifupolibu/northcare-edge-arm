export const NUTRITION_CONTENT_STATUSES = [
  'DRAFT',
  'REVIEW_REQUIRED',
  'APPROVED_FOR_DEVELOPMENT',
  'APPROVED_FOR_PILOT',
  'RETIRED',
] as const;
export type NutritionContentStatus = (typeof NUTRITION_CONTENT_STATUSES)[number];

export const NUTRITION_ASSESSMENT_TYPES = [
  'maternalNutrition',
  'infantFeeding',
  'childNutrition',
  'growthMonitoring',
  'complementaryFeeding',
  'generalNutritionFollowUp',
] as const;
export type NutritionAssessmentType = (typeof NUTRITION_ASSESSMENT_TYPES)[number];

export const NUTRITION_FOLLOW_UP_SOURCES = [
  'notSet',
  'workerSelected',
  'guidanceSuggested',
  'requiresReview',
] as const;
export type NutritionFollowUpSource = (typeof NUTRITION_FOLLOW_UP_SOURCES)[number];

export const NUTRITION_REFERENCE_RESULT_STATUSES = [
  'available',
  'calculated',
  'insufficientInformation',
  'incompatibleMeasurements',
  'incompatibleAge',
  'unsupportedUnit',
  'referencePackUnavailable',
  'referencePackUnapproved',
  'calculationFailed',
] as const;
export type NutritionReferenceResultStatus =
  (typeof NUTRITION_REFERENCE_RESULT_STATUSES)[number];

export const NUTRITION_GUIDANCE_RESOLUTION_OUTCOMES = [
  'guidanceAvailable',
  'guidanceUnavailable',
  'guidancePackUnavailable',
  'moreInformationRequired',
  'incompatibleContent',
  'contentRetired',
  'resolutionFailed',
] as const;
export type NutritionGuidanceResolutionOutcome =
  (typeof NUTRITION_GUIDANCE_RESOLUTION_OUTCOMES)[number];

export const NUTRITION_ENGINE_VERSION = 1 as const;
