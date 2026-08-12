import * as SecureStore from 'expo-secure-store';

import { createPinVerifierWithSalt } from '../crypto/pinVerifier';
import {
  SESSION_ENVELOPE_SCHEMA_VERSION,
  type LocalSessionEnvelope,
} from '../domain/sessionEnvelope';
import { createMemorySecureSessionRepository } from '../storage/memorySecureSessionRepository';
import { createSecureStoreSessionRepository } from '../storage/secureStoreSessionRepository';

function sampleEnvelope(
  overrides: Partial<LocalSessionEnvelope> = {},
): LocalSessionEnvelope {
  return {
    schemaVersion: SESSION_ENVELOPE_SCHEMA_VERSION,
    accountId: 'dev-worker-001',
    role: 'worker',
    availableRoles: ['worker'],
    permittedWorkspaces: ['worker'],
    activeWorkspace: 'worker',
    displayName: 'Synthetic Worker',
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    organisationId: 'org-dev-001',
    lastRemoteVerificationAt: '2026-08-01T12:00:00.000Z',
    offlineAccessPolicyVersion: 1,
    localSetupCompletedAt: '2026-08-01T12:05:00.000Z',
    biometricEnabled: false,
    sessionState: 'locked',
    ...overrides,
  };
}

describe('MemorySecureSessionRepository', () => {
  it('saves and loads a valid session envelope', async () => {
    const repo = createMemorySecureSessionRepository();
    const envelope = sampleEnvelope();
    await repo.saveSessionEnvelope(envelope);
    await expect(repo.loadSessionEnvelope()).resolves.toEqual(envelope);
  });

  it('fails closed on corrupt session data', async () => {
    const repo = createMemorySecureSessionRepository() as ReturnType<
      typeof createMemorySecureSessionRepository
    > & { injectCorruptSession(value: unknown): void };
    repo.injectCorruptSession({ schemaVersion: 1, accountId: 'x' });
    await expect(repo.loadSessionEnvelope()).resolves.toBeNull();
  });

  it('removes session material', async () => {
    const repo = createMemorySecureSessionRepository();
    await repo.saveSessionEnvelope(sampleEnvelope());
    await repo.savePinVerifier(
      createPinVerifierWithSalt('123456', '00112233445566778899aabbccddeeff'),
    );
    await repo.clearAllAuthMaterial();
    await expect(repo.loadSessionEnvelope()).resolves.toBeNull();
    await expect(repo.loadPinVerifier()).resolves.toBeNull();
  });

  it('persists PIN attempt state without the PIN', async () => {
    const repo = createMemorySecureSessionRepository();
    await repo.savePinAttemptState({ failedAttempts: 3, lockedUntilMs: 1000 });
    const state = await repo.loadPinAttemptState();
    expect(state.failedAttempts).toBe(3);
    expect(JSON.stringify(state)).not.toContain('123456');
  });

  it('surfaces storage unavailable on save failure', async () => {
    const repo = createMemorySecureSessionRepository({ failOnSave: true });
    await expect(repo.saveSessionEnvelope(sampleEnvelope())).rejects.toThrow(
      'secure-storage-unavailable',
    );
  });
});

describe('SecureStoreSessionRepository', () => {
  it('loads valid sessions and rejects corrupt ones', async () => {
    const repo = createSecureStoreSessionRepository();
    await repo.clearAllAuthMaterial();
    const envelope = sampleEnvelope({ sessionState: 'ready' });
    await repo.saveSessionEnvelope(envelope);
    await expect(repo.loadSessionEnvelope()).resolves.toEqual(envelope);

    await SecureStore.setItemAsync(
      'northcare.session.envelope.v1',
      JSON.stringify({ broken: true }),
    );
    await expect(repo.loadSessionEnvelope()).resolves.toBeNull();
  });
});
