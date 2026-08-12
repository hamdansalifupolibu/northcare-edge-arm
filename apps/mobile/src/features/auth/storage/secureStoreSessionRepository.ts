import * as SecureStore from 'expo-secure-store';

import type { PinVerifierRecord } from '../crypto/pinVerifier';
import {
  isValidSessionEnvelope,
  type LocalSessionEnvelope,
} from '../domain/sessionEnvelope';
import type { PinAttemptState, SecureSessionRepository } from './SecureSessionRepository';

const KEYS = {
  session: 'northcare.session.envelope.v1',
  pinVerifier: 'northcare.pin.verifier.v1',
  biometric: 'northcare.biometric.enabled.v1',
  pinAttempts: 'northcare.pin.attempts.v1',
} as const;

async function setJson(key: string, value: unknown): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

async function getJson<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function createSecureStoreSessionRepository(): SecureSessionRepository {
  return {
    async saveSessionEnvelope(envelope) {
      await setJson(KEYS.session, envelope);
    },
    async loadSessionEnvelope() {
      const value = await getJson<LocalSessionEnvelope>(KEYS.session);
      if (value === null) {
        return null;
      }
      if (!isValidSessionEnvelope(value)) {
        await SecureStore.deleteItemAsync(KEYS.session);
        return null;
      }
      return value;
    },
    async removeSessionEnvelope() {
      await SecureStore.deleteItemAsync(KEYS.session);
    },
    async savePinVerifier(record: PinVerifierRecord) {
      await setJson(KEYS.pinVerifier, record);
    },
    async loadPinVerifier() {
      return getJson<PinVerifierRecord>(KEYS.pinVerifier);
    },
    async clearPinVerifier() {
      await SecureStore.deleteItemAsync(KEYS.pinVerifier);
    },
    async saveBiometricEnabled(enabled) {
      await SecureStore.setItemAsync(KEYS.biometric, enabled ? '1' : '0');
    },
    async loadBiometricEnabled() {
      const value = await SecureStore.getItemAsync(KEYS.biometric);
      return value === '1';
    },
    async clearBiometricSessionHandle() {
      await SecureStore.deleteItemAsync(KEYS.biometric);
    },
    async savePinAttemptState(state: PinAttemptState) {
      await setJson(KEYS.pinAttempts, state);
    },
    async loadPinAttemptState() {
      const value = await getJson<PinAttemptState>(KEYS.pinAttempts);
      return value ?? { failedAttempts: 0, lockedUntilMs: null };
    },
    async clearAllAuthMaterial() {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.session),
        SecureStore.deleteItemAsync(KEYS.pinVerifier),
        SecureStore.deleteItemAsync(KEYS.biometric),
        SecureStore.deleteItemAsync(KEYS.pinAttempts),
      ]);
    },
  };
}
