/** Recording-consent copy version — update when wording changes after legal review. */
export const VOICE_RECORDING_CONSENT_VERSION = 'voice-recording-consent-v1-provisional';

/** Versioned audio format metadata for managed recordings. */
export const VOICE_AUDIO_FORMAT_VERSION = 1;
export const VOICE_AUDIO_MIME_TYPE = 'audio/mp4';
export const VOICE_AUDIO_EXTENSION = 'm4a';
export const VOICE_AUDIO_CONTAINER = 'm4a';
export const VOICE_AUDIO_CODEC = 'aac';

/** Provisional max recording duration (ms). */
export const VOICE_MAX_RECORDING_DURATION_MS = 3 * 60 * 1000;

/** Soft warning threshold before max duration. */
export const VOICE_RECORDING_WARNING_DURATION_MS = 2 * 60 * 1000 + 30 * 1000;

export const VOICE_MANAGED_DIRECTORY_NAME = 'voice-captures';

export const VOICE_ATTACHMENT_OWNER_TYPE = 'voiceCaptureSession';

export const FORBIDDEN_EXTRACTION_TARGETS = [
  'diagnosis',
  'riskPriority',
  'referralDecision',
  'destinationFacility',
  'medication',
  'dosage',
  'treatment',
  'accountRole',
  'facilityOwnership',
  'clientIdentityMatch',
  'consentRecorded',
  'workerConfirmation',
  'referralCompletion',
  'clinicalApprovalStatus',
] as const;

export type ForbiddenExtractionTarget = (typeof FORBIDDEN_EXTRACTION_TARGETS)[number];
