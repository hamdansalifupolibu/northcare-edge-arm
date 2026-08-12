import { createAdministrationServices } from '../application/createAdministrationServices';
import { validateProfessionalProfileForm } from '../domain/policies';
import type { AdministrationApiClient } from '../transport/administrationApiClient';

function createMockClient(overrides: Partial<AdministrationApiClient> = {}): AdministrationApiClient {
  return {
    getSessionAuthorisation: jest.fn(),
    getAdminHome: jest.fn(),
    listFacilities: jest.fn(),
    listProfessions: jest.fn(),
    listAccounts: jest.fn(),
    getAccountDetails: jest.fn(),
    registerWorker: jest.fn(),
    upsertProfessionalProfile: jest.fn(),
    assignWorkerFacility: jest.fn(),
    deactivateWorker: jest.fn(),
    reactivateWorker: jest.fn(),
    initiateWorkerAccessReset: jest.fn(),
    listRegisteredDevices: jest.fn(),
    revokeRegisteredDevice: jest.fn(),
    getAdministrationHistory: jest.fn(),
    listSyncedRecords: jest.fn(),
    ...overrides,
  };
}

describe('registerWorker', () => {
  it('registers worker-only accounts through the API client', async () => {
    const registerWorker = jest.fn().mockResolvedValue({
      accountId: 'acc-1',
      displayName: 'Registered Worker',
      email: 'worker@development.invalid',
      roles: ['worker'],
      facilityId: 'fac-dev-001',
      accountStatus: 'pendingFirstLogin',
      firstLoginRequired: true,
      accountVersion: 1,
      identityProvider: 'development',
      professionalProfile: {
        accountId: 'acc-1',
        profession: 'communityHealthNurse',
        otherProfessionDescription: null,
        communityRequestsEnabled: false,
        emergencyRequestsEnabled: false,
        version: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const services = createAdministrationServices(createMockClient({ registerWorker }));

    const result = await services.registerWorker({
      displayName: 'Registered Worker',
      email: 'worker@development.invalid',
      facilityId: 'fac-dev-001',
      temporaryPassword: 'TempWorker12Ab',
      idempotencyKey: 'idem-1',
      profession: 'communityHealthNurse',
      otherProfessionDescription: null,
      communityRequestsEnabled: false,
      emergencyRequestsEnabled: false,
    });

    expect(result.roles).toEqual(['worker']);
    expect(registerWorker).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Registered Worker',
        email: 'worker@development.invalid',
        profession: 'communityHealthNurse',
        communityRequestsEnabled: false,
        emergencyRequestsEnabled: false,
      }),
    );
  });
});

describe('validateProfessionalProfileForm', () => {
  it('requires a known profession', () => {
    expect(
      validateProfessionalProfileForm({
        profession: '',
        communityRequestsEnabled: false,
        emergencyRequestsEnabled: false,
      }),
    ).toBe('profession');
  });

  it('requires other profession description for otherApprovedHealthProfessional', () => {
    expect(
      validateProfessionalProfileForm({
        profession: 'otherApprovedHealthProfessional',
        otherProfessionDescription: '  ',
        communityRequestsEnabled: false,
        emergencyRequestsEnabled: false,
      }),
    ).toBe('otherProfessionDescription');
  });

  it('rejects emergency without community requests', () => {
    expect(
      validateProfessionalProfileForm({
        profession: 'midwife',
        communityRequestsEnabled: false,
        emergencyRequestsEnabled: true,
      }),
    ).toBe('emergencyRequiresCommunity');
  });

  it('accepts a valid midwife profile', () => {
    expect(
      validateProfessionalProfileForm({
        profession: 'midwife',
        communityRequestsEnabled: true,
        emergencyRequestsEnabled: true,
      }),
    ).toBeNull();
  });
});

describe('account actions', () => {
  it('deactivates, reassigns facility, resets access, and revokes devices', async () => {
    const deactivateWorker = jest.fn().mockResolvedValue({
      accountId: 'acc-1',
      accountStatus: 'inactive',
      accountVersion: 2,
      facilityId: 'fac-dev-001',
    });
    const assignWorkerFacility = jest.fn().mockResolvedValue({
      accountId: 'acc-1',
      accountStatus: 'active',
      accountVersion: 3,
      facilityId: 'fac-dev-hq',
    });
    const initiateWorkerAccessReset = jest.fn().mockResolvedValue({
      accountId: 'acc-1',
      accountStatus: 'active',
      accountVersion: 4,
      facilityId: 'fac-dev-hq',
    });
    const revokeRegisteredDevice = jest.fn().mockResolvedValue({
      deviceId: 'device-1',
      label: 'Other phone',
      platform: 'android',
      appVersion: '0.1.0',
      status: 'revoked',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-02T00:00:00.000Z',
      isCurrent: false,
    });

    const services = createAdministrationServices(
      createMockClient({
        deactivateWorker,
        assignWorkerFacility,
        initiateWorkerAccessReset,
        revokeRegisteredDevice,
      }),
    );

    await services.deactivateWorker('acc-1', 1);
    await services.assignWorkerFacility('acc-1', 'fac-dev-hq', 2);
    await services.initiateWorkerAccessReset('acc-1', 3, 'TempWorker12Ab');
    await services.revokeRegisteredDevice('acc-1', 'device-1');

    expect(deactivateWorker).toHaveBeenCalledWith('acc-1', 1);
    expect(assignWorkerFacility).toHaveBeenCalledWith('acc-1', 'fac-dev-hq', 2);
    expect(initiateWorkerAccessReset).toHaveBeenCalledWith('acc-1', 3, 'TempWorker12Ab');
    expect(revokeRegisteredDevice).toHaveBeenCalledWith('acc-1', 'device-1');
  });
});
