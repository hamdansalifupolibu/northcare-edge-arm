import type { PinVerifierRecord } from '../crypto/pinVerifier';
import {
  isValidSessionEnvelope,
  type LocalSessionEnvelope,
} from '../domain/sessionEnvelope';
import type { PinAttemptState, SecureSessionRepository } from './SecureSessionRepository';

export function createMemorySecureSessionRepository(options?: {
  readonly failOnSave?: boolean;
}): SecureSessionRepository {
  let session: LocalSessionEnvelope | null = null;
  let pin: PinVerifierRecord | null = null;
  let biometric = false;
  let attempts: PinAttemptState = { failedAttempts: 0, lockedUntilMs: null };
  let corruptRaw: unknown = undefined;

  const repository: SecureSessionRepository & {
    injectCorruptSession(value: unknown): void;
  } = {
    async saveSessionEnvelope(envelope) {
      if (options?.failOnSave) {
        throw new Error('secure-storage-unavailable');
      }
      session = envelope;
      corruptRaw = undefined;
    },
    async loadSessionEnvelope() {
      if (corruptRaw !== undefined) {
        if (!isValidSessionEnvelope(corruptRaw)) {
          session = null;
          corruptRaw = undefined;
          return null;
        }
        return corruptRaw;
      }
      return session;
    },
    async removeSessionEnvelope() {
      session = null;
    },
    async savePinVerifier(record) {
      pin = record;
    },
    async loadPinVerifier() {
      return pin;
    },
    async clearPinVerifier() {
      pin = null;
    },
    async saveBiometricEnabled(enabled) {
      biometric = enabled;
    },
    async loadBiometricEnabled() {
      return biometric;
    },
    async clearBiometricSessionHandle() {
      biometric = false;
    },
    async savePinAttemptState(state) {
      attempts = state;
    },
    async loadPinAttemptState() {
      return attempts;
    },
    async clearAllAuthMaterial() {
      session = null;
      pin = null;
      biometric = false;
      attempts = { failedAttempts: 0, lockedUntilMs: null };
      corruptRaw = undefined;
    },
    injectCorruptSession(value: unknown) {
      corruptRaw = value;
    },
  };

  return repository;
}
