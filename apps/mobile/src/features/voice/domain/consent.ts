import type { ConsentStatus } from '../../../data/domain/enums/domainEnums';
import { VOICE_RECORDING_CONSENT_VERSION } from './constants';
import { VoiceError } from './errors';

export type VoiceRecordingConsentDecision = Extract<
  ConsentStatus,
  'recorded' | 'declined' | 'deferred' | 'unknown'
>;

export type VoiceRecordingConsentRecord = {
  readonly status: VoiceRecordingConsentDecision;
  readonly consentVersion: string;
  readonly decidedAt: string;
  readonly decidedByAccountId: string;
};

/** Consent never defaults to recorded — caller must supply an explicit decision. */
export function createVoiceRecordingConsent(input: {
  readonly status: VoiceRecordingConsentDecision;
  readonly decidedAt: string;
  readonly decidedByAccountId: string;
  readonly consentVersion?: string;
}): VoiceRecordingConsentRecord {
  if (input.status === 'unknown') {
    throw new VoiceError(
      'consentRequired',
      'Recording consent must be reviewed before the microphone can start.',
    );
  }
  return {
    status: input.status,
    consentVersion: input.consentVersion ?? VOICE_RECORDING_CONSENT_VERSION,
    decidedAt: input.decidedAt,
    decidedByAccountId: input.decidedByAccountId,
  };
}

export function assertRecordingAllowedByConsent(
  status: ConsentStatus | null | undefined,
): void {
  if (status == null || status === 'unknown') {
    throw new VoiceError(
      'consentRequired',
      'Recording consent must be reviewed before the microphone can start.',
    );
  }
  if (status === 'declined') {
    throw new VoiceError(
      'consentDeclined',
      'Recording consent was declined. Use the manual transcript path instead.',
    );
  }
  if (status !== 'recorded' && status !== 'deferred') {
    throw new VoiceError(
      'consentRequired',
      'Recording consent must be reviewed before the microphone can start.',
    );
  }
}

/** Mic OS permission is separate from caregiver recording consent. */
export function isMicrophonePermissionEquivalentToConsent(): false {
  return false;
}
