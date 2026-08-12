import type { PinVerifierRecord } from '../crypto/pinVerifier';
import type { LocalSessionEnvelope } from '../domain/sessionEnvelope';

export type PinAttemptState = {
  readonly failedAttempts: number;
  readonly lockedUntilMs: number | null;
};

export type SecureSessionRepository = {
  saveSessionEnvelope(envelope: LocalSessionEnvelope): Promise<void>;
  loadSessionEnvelope(): Promise<LocalSessionEnvelope | null>;
  removeSessionEnvelope(): Promise<void>;
  savePinVerifier(record: PinVerifierRecord): Promise<void>;
  loadPinVerifier(): Promise<PinVerifierRecord | null>;
  clearPinVerifier(): Promise<void>;
  saveBiometricEnabled(enabled: boolean): Promise<void>;
  loadBiometricEnabled(): Promise<boolean>;
  clearBiometricSessionHandle(): Promise<void>;
  savePinAttemptState(state: PinAttemptState): Promise<void>;
  loadPinAttemptState(): Promise<PinAttemptState>;
  clearAllAuthMaterial(): Promise<void>;
};
