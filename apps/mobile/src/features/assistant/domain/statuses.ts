export const KNOWLEDGE_CONTENT_STATUSES = [
  'DRAFT',
  'REVIEW_REQUIRED',
  'APPROVED_FOR_DEVELOPMENT',
  'APPROVED_FOR_PILOT',
  'RETIRED',
] as const;
export type KnowledgeContentStatus = (typeof KNOWLEDGE_CONTENT_STATUSES)[number];

export const ANSWERABILITY_OUTCOMES = [
  'answerAvailable',
  'multipleRelevantSources',
  'insufficientCoverage',
  'unsupportedTopic',
  'incompatibleLanguage',
  'contentUnavailable',
  'contentRetired',
  'assistantUnavailable',
  'privacyReviewRequired',
  'urgentBoundary',
  'patientSpecificBoundary',
  'diagnosisBoundary',
  'treatmentBoundary',
  'medicationBoundary',
  'dosageBoundary',
] as const;
export type AnswerabilityOutcome = (typeof ANSWERABILITY_OUTCOMES)[number];

export const FEEDBACK_CATEGORIES = ['helpful', 'notHelpful', 'reportContentIssue'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const CONTENT_ISSUE_CATEGORIES = [
  'unclear',
  'outdated',
  'sourceMissing',
  'doesNotAnswerQuestion',
  'potentiallyUnsafe',
  'translationIssue',
  'other',
] as const;
export type ContentIssueCategory = (typeof CONTENT_ISSUE_CATEGORIES)[number];

export const KNOWLEDGE_FAMILIES = [
  'appUsage',
  'maternalCareReference',
  'newbornCareReference',
  'childUnderFiveReference',
  'nutritionReference',
  'referralWorkflowReference',
  'dataCaptureGuidance',
  'privacyAndConsentGuidance',
  'offlineApplicationHelp',
  'syntheticDevelopment',
] as const;
export type KnowledgeFamily = (typeof KNOWLEDGE_FAMILIES)[number];
