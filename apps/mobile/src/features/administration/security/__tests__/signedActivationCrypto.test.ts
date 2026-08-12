import {
  issueOfflineActivationPass,
  verifyWorkerActivationUri,
} from '../signedActivationCrypto';

describe('offline worker activation QR', () => {
  const baseInput = {
    enrollmentId: 'enroll-test-001',
    displayName: 'Demo Worker',
    email: 'demo.worker@northcare.local',
    professionCode: 'community_health_nurse',
    professionLabel: 'Community health nurse',
    otherProfessionDescription: null,
    facilityId: 'fac-dev-001',
    facilityName: 'Demo CHPS Compound',
    organisationId: 'org-dev-001',
    communityRequestsEnabled: true,
    emergencyRequestsEnabled: false,
    adminAccountId: 'admin-001',
    adminDisplayName: 'Demo Admin',
    nowMs: Date.parse('2026-08-08T12:00:00.000Z'),
    nonce: 'abc123nonce456',
  };

  it('issues and verifies a signed activation URI offline', () => {
    const { uri, claims } = issueOfflineActivationPass(baseInput);
    const result = verifyWorkerActivationUri(uri, {
      nowMs: baseInput.nowMs + 60_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.email).toBe(baseInput.email);
      expect(result.claims.enrollmentId).toBe(baseInput.enrollmentId);
      expect(result.claims.displayName).toBe(baseInput.displayName);
      expect(claims.expiresAt).toBe(result.claims.expiresAt);
    }
  });

  it('rejects expired activation URIs', () => {
    const { uri } = issueOfflineActivationPass(baseInput);
    const result = verifyWorkerActivationUri(uri, {
      nowMs: baseInput.nowMs + 31 * 60 * 1000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('expired');
    }
  });

  it('rejects consumed nonces', () => {
    const { uri, nonce } = issueOfflineActivationPass(baseInput);
    const result = verifyWorkerActivationUri(uri, {
      nowMs: baseInput.nowMs + 60_000,
      isNonceConsumed: (value) => value === nonce,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('nonceConsumed');
    }
  });
});
