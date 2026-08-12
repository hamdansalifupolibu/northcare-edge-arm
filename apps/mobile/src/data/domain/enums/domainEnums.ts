export const RELATIONSHIP_TYPES = [
  'mother',
  'father',
  'guardian',
  'grandparent',
  'other',
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const ENCOUNTER_STATUSES = [
  'draft',
  'inProgress',
  'completed',
  'cancelled',
] as const;
export type EncounterStatus = (typeof ENCOUNTER_STATUSES)[number];

export const ENCOUNTER_TYPES = [
  'antenatalVisit',
  'postnatalVisit',
  'newbornVisit',
  'childVisit',
  'followUp',
  'other',
] as const;
export type EncounterType = (typeof ENCOUNTER_TYPES)[number];

export const SCREENING_TYPES = [
  'antenatal',
  'postnatal',
  'newborn',
  'childUnderFive',
  'nutrition',
] as const;
export type ScreeningType = (typeof SCREENING_TYPES)[number];

export const SCREENING_STATUSES = [
  'draft',
  'inProgress',
  'completed',
  'cancelled',
] as const;
export type ScreeningStatus = (typeof SCREENING_STATUSES)[number];

export const ANSWER_VALUE_TYPES = [
  'boolean',
  'number',
  'text',
  'date',
  'option',
  'multipleOptions',
  'unknown',
] as const;
export type AnswerValueType = (typeof ANSWER_VALUE_TYPES)[number];

export const MEASUREMENT_TYPES = [
  'weight',
  'height',
  'length',
  'temperature',
  'muac',
  'respiratoryRate',
  'other',
] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export const MEASUREMENT_UNITS = [
  'kg',
  'g',
  'cm',
  'mm',
  'celsius',
  'perMinute',
  'other',
] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const RISK_PRIORITIES = ['red', 'amber', 'green', 'undetermined'] as const;
export type RiskPriority = (typeof RISK_PRIORITIES)[number];

export const REFERRAL_STATUSES = [
  'draft',
  'created',
  'caregiverInformed',
  'journeyStarted',
  'facilityReached',
  'patientReceived',
  'completed',
  'cancelled',
  'overdue',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

/** UI may say “client received”; persisted status remains patientReceived (Stage 6). */
export const REFERRAL_ORIGINS = [
  'priorityAssessment',
  'workerInitiated',
  'visitFollowUp',
] as const;
export type ReferralOrigin = (typeof REFERRAL_ORIGINS)[number];

export const REFERRAL_PRIORITY_SOURCES = [
  'fromEngine',
  'noEnginePriority',
  'preservedEngine',
] as const;
export type ReferralPrioritySource = (typeof REFERRAL_PRIORITY_SOURCES)[number];

export const REFERRAL_PASSPORT_STATUSES = [
  'active',
  'revoked',
  'expired',
  'superseded',
] as const;
export type ReferralPassportStatus = (typeof REFERRAL_PASSPORT_STATUSES)[number];

export const TRANSPORT_STATUSES = [
  'unknown',
  'notRequired',
  'arranged',
  'inTransit',
  'arrived',
  'unavailable',
] as const;
export type TransportStatus = (typeof TRANSPORT_STATUSES)[number];

export const NUTRITION_STATUSES = [
  'draft',
  'completed',
  'cancelled',
] as const;
export type NutritionStatus = (typeof NUTRITION_STATUSES)[number];

export const ATTACHMENT_ENCRYPTION_STATUSES = [
  'none',
  'planned',
  'unknown',
] as const;
export type AttachmentEncryptionStatus =
  (typeof ATTACHMENT_ENCRYPTION_STATUSES)[number];

export const ATTACHMENT_UPLOAD_STATUSES = [
  'localOnly',
  'pending',
  'uploaded',
  'failed',
] as const;
export type AttachmentUploadStatus = (typeof ATTACHMENT_UPLOAD_STATUSES)[number];

export const SYNC_QUEUE_OPERATIONS = [
  'create',
  'update',
  'delete',
  'uploadAttachment',
] as const;
export type SyncQueueOperation = (typeof SYNC_QUEUE_OPERATIONS)[number];

export const SYNC_QUEUE_STATES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'blocked',
  'conflict',
] as const;
export type SyncQueueState = (typeof SYNC_QUEUE_STATES)[number];

/**
 * Client consent statuses (Stage 7).
 * Stage 6 used granted/withdrawn — migrated to recorded/declined in schema v2.
 */
export const CONSENT_STATUSES = [
  'unknown',
  'recorded',
  'declined',
  'deferred',
  'notApplicable',
] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const ACCOUNT_ROLES = ['worker', 'administrator'] as const;
export type LocalAccountRole = (typeof ACCOUNT_ROLES)[number];

export function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}
