import { createOfflineProvisioningServices } from '../application/createOfflineProvisioningServices';
import { createTestDatabase } from '../../../data/__tests__/helpers/testDatabase';
import { isWorkerActivationUri } from '../security/signedActivationCrypto';

describe('offline provisioning integration', () => {
  it('registers worker offline, persists outbox, and verifies activation QR', async () => {
    const { manager, repos } = await createTestDatabase();
    const services = createOfflineProvisioningServices(repos.adminProvisioning);

    const result = await services.registerWorkerOffline({
      enrollmentId: 'enroll-integration-001',
      displayName: 'Integration Worker',
      email: 'integration.worker@northcare.local',
      facilityId: 'fac-dev-001',
      facilityName: 'Demo CHPS Compound',
      profession: 'communityHealthNurse',
      professionLabel: 'Community health nurse',
      otherProfessionDescription: null,
      communityRequestsEnabled: true,
      emergencyRequestsEnabled: false,
      adminAccountId: 'admin-integration',
      adminDisplayName: 'Demo Admin',
      organisationId: 'org-dev-001',
    });

    expect(isWorkerActivationUri(result.activationUri)).toBe(true);
    expect(result.claims.displayName).toBe('Integration Worker');

    const outbox = await repos.adminProvisioning.getOutbox('enroll-integration-001');
    expect(outbox).not.toBeNull();
    expect(outbox?.status).toBe('saved_on_device');
    expect(outbox?.activationUri).toBe(result.activationUri);

    const verify = await services.verifyActivationQr(result.activationUri);
    expect(verify.ok).toBe(true);
    if (!verify.ok) return;

    await services.acceptVerifiedActivation(verify.claims);
    const pending = await repos.adminProvisioning.getPendingActivation('enroll-integration-001');
    expect(pending?.email).toBe('integration.worker@northcare.local');

    await services.markActivationNonceConsumed(verify.claims.nonce);
    const replay = await services.verifyActivationQr(result.activationUri);
    expect(replay.ok).toBe(false);
    if (!replay.ok) {
      expect(replay.reason).toBe('nonceConsumed');
    }

    const schemaVersion = await manager.getSchemaVersion();
    expect(schemaVersion).toBeGreaterThanOrEqual(11);
  });

  it('falls back to bundled facilities when cache is empty', async () => {
    const { repos } = await createTestDatabase();
    const services = createOfflineProvisioningServices(repos.adminProvisioning);
    const facilities = await services.listFacilities();
    expect(facilities.length).toBeGreaterThan(0);
    expect(facilities.some((f) => f.facilityId === 'fac-dev-001')).toBe(true);
  });

  it('lists locally provisioned workers for offline account search', async () => {
    const { repos } = await createTestDatabase();
    const services = createOfflineProvisioningServices(repos.adminProvisioning);

    await services.registerWorkerOffline({
      enrollmentId: 'enroll-list-001',
      displayName: 'Alpha Worker',
      email: 'alpha@northcare.local',
      facilityId: 'fac-dev-001',
      facilityName: 'Demo CHPS Compound',
      profession: 'communityHealthNurse',
      professionLabel: 'Community health nurse',
      otherProfessionDescription: null,
      communityRequestsEnabled: false,
      emergencyRequestsEnabled: false,
      adminAccountId: 'admin-list',
      adminDisplayName: 'Demo Admin',
    });
    await services.registerWorkerOffline({
      enrollmentId: 'enroll-list-002',
      displayName: 'Beta Worker',
      email: 'beta@northcare.local',
      facilityId: 'fac-dev-001',
      facilityName: 'Demo CHPS Compound',
      profession: 'communityHealthOfficer',
      professionLabel: 'Community health officer',
      otherProfessionDescription: null,
      communityRequestsEnabled: false,
      emergencyRequestsEnabled: false,
      adminAccountId: 'admin-list',
      adminDisplayName: 'Demo Admin',
    });

    const page = await services.listProvisionedAccounts({ page: 1, pageSize: 20 });
    expect(page.total).toBe(2);
    expect(page.items.map((item) => item.displayName)).toEqual(
      expect.arrayContaining(['Alpha Worker', 'Beta Worker']),
    );

    const filtered = await services.listProvisionedAccounts({
      page: 1,
      pageSize: 20,
      search: 'alpha',
    });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.displayName).toBe('Alpha Worker');
    expect(filtered.items[0]?.accountStatus).toBe('pendingFirstLogin');
  });
});
