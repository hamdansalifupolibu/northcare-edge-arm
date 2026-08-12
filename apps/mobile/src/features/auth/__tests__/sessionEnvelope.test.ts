import {
  isValidSessionEnvelope,
  SESSION_ENVELOPE_SCHEMA_VERSION,
  type LocalSessionEnvelope,
} from '../domain/sessionEnvelope';

const validEnvelope: LocalSessionEnvelope = {
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
  lastRemoteVerificationAt: new Date().toISOString(),
  offlineAccessPolicyVersion: 1,
  localSetupCompletedAt: new Date().toISOString(),
  biometricEnabled: false,
  sessionState: 'locked',
};

describe('LocalSessionEnvelope validation', () => {
  it('accepts a valid v2 envelope', () => {
    expect(isValidSessionEnvelope(validEnvelope)).toBe(true);
  });

  it('rejects legacy v1 envelopes', () => {
    expect(isValidSessionEnvelope({ ...validEnvelope, schemaVersion: 1 })).toBe(false);
  });

  it('rejects corrupt or incomplete envelopes', () => {
    expect(isValidSessionEnvelope(null)).toBe(false);
    expect(isValidSessionEnvelope({})).toBe(false);
    expect(isValidSessionEnvelope({ ...validEnvelope, schemaVersion: 99 })).toBe(false);
    expect(isValidSessionEnvelope({ ...validEnvelope, role: 'superuser' })).toBe(false);
    expect(isValidSessionEnvelope({ ...validEnvelope, accountId: 1 })).toBe(false);
    expect(isValidSessionEnvelope({ ...validEnvelope, activeWorkspace: 'clinical' })).toBe(false);
  });
});
