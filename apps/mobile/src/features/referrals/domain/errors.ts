export type ReferralErrorCode =
  | 'reasonUnavailable'
  | 'invalidTransition'
  | 'invalidDraft'
  | 'assessmentRequired'
  | 'assessmentMismatch'
  | 'priorityPolicyViolation'
  | 'passportNotFound'
  | 'passportUnavailable'
  | 'passportExpired'
  | 'passportRevoked'
  | 'invalidQrPayload'
  | 'facilityRequired'
  | 'sourceFacilityRequired'
  | 'notFound'
  | 'persistenceFailed'
  | 'unauthorized';

export class ReferralError extends Error {
  readonly code: ReferralErrorCode;
  readonly sanitisedMessage: string;

  constructor(code: ReferralErrorCode, sanitisedMessage: string) {
    super(sanitisedMessage);
    this.name = 'ReferralError';
    this.code = code;
    this.sanitisedMessage = sanitisedMessage;
  }
}

export function isReferralError(error: unknown): error is ReferralError {
  return error instanceof ReferralError;
}
