export type VoiceErrorCode =
  | 'invalidStateTransition'
  | 'consentRequired'
  | 'consentDeclined'
  | 'permissionDenied'
  | 'permissionBlocked'
  | 'recordingFailed'
  | 'playbackFailed'
  | 'fileManagementFailed'
  | 'providerUnavailable'
  | 'providerNotAllowed'
  | 'manualTranscriptRequired'
  | 'transcriptRequired'
  | 'schemaUnavailable'
  | 'forbiddenTarget'
  | 'suggestionNotReviewed'
  | 'suggestionRejected'
  | 'validationFailed'
  | 'sessionNotFound'
  | 'sessionLocked'
  | 'notAuthorised'
  | 'retentionConfirmationRequired'
  | 'deletionConfirmationRequired'
  | 'unknown';

export class VoiceError extends Error {
  readonly code: VoiceErrorCode;
  readonly sanitisedMessage: string;

  constructor(code: VoiceErrorCode, sanitisedMessage: string) {
    super(sanitisedMessage);
    this.name = 'VoiceError';
    this.code = code;
    this.sanitisedMessage = sanitisedMessage;
  }
}

export function isVoiceError(error: unknown): error is VoiceError {
  return error instanceof VoiceError;
}
