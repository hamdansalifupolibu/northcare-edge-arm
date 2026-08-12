import { createCommunityRequestServices } from '../application/createCommunityRequestServices';
import type { CommunityRequestsApiClient } from '../transport/communityRequestsApiClient';
import {
  CommunityRequestError,
  CommunityRequestOfflineError,
  CommunityRequestTimeoutError,
} from '../domain/errors';
import type { WorkerRequestDetail, WorkerRequestListItem } from '../domain/types';
import { canEscalate } from '../domain/actions';
import { en } from '../../../i18n/en';

function listItem(overrides: Partial<WorkerRequestListItem> = {}): WorkerRequestListItem {
  return {
    requestId: 'req-synth-1',
    category: 'childHealth',
    requestType: 'routine',
    communityOrLandmark: 'Demo community',
    preferredLanguage: 'en',
    status: 'assigned',
    assignedToCaller: true,
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
    version: 2,
    ...overrides,
  };
}

function detail(overrides: Partial<WorkerRequestDetail> = {}): WorkerRequestDetail {
  return {
    ...listItem(),
    contactNumber: 'SYNTHETIC-000',
    consentToContact: true,
    consentToShareLocation: false,
    assignedWorkerId: 'dev-dual-worker',
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
    ...overrides,
  };
}

describe('community request services workflow', () => {
  it('loads list filters without embedding contact numbers', async () => {
    const client: CommunityRequestsApiClient = {
      listCommunityRequests: jest.fn(async (filter) => ({
        items: [listItem({ status: filter === 'handled' ? 'handled' : 'assigned' })],
      })),
      getCommunityRequest: jest.fn(),
      acknowledgeCommunityRequest: jest.fn(),
      recordCommunityContactAttempt: jest.fn(),
      markCommunityRequestHandled: jest.fn(),
      escalateCommunityRequest: jest.fn(),
    };
    const services = createCommunityRequestServices(client);
    for (const filter of ['awaiting', 'assignedToMe', 'emergency', 'handled'] as const) {
      const page = await services.listCommunityRequests(filter);
      expect(page.items[0]).not.toHaveProperty('contactNumber');
      expect(client.listCommunityRequests).toHaveBeenCalledWith(filter, undefined);
    }
  });

  it('acknowledge, escalate, contact attempt and handle send expected versions', async () => {
    const client: CommunityRequestsApiClient = {
      listCommunityRequests: jest.fn(),
      getCommunityRequest: jest.fn(async () => detail({ version: 5, status: 'assigned' })),
      acknowledgeCommunityRequest: jest.fn(async () => ({
        requestId: 'req-synth-1',
        status: 'acknowledged',
        version: 6,
        assignedWorkerId: 'dev-dual-worker',
      })),
      escalateCommunityRequest: jest.fn(async () => ({
        requestId: 'req-synth-1',
        status: 'escalated',
        version: 7,
        assignedWorkerId: 'dev-dual-worker',
        message: 'Escalated for further human support.',
      })),
      recordCommunityContactAttempt: jest.fn(async () => ({
        requestId: 'req-synth-1',
        status: 'contactAttempted',
        version: 8,
      })),
      markCommunityRequestHandled: jest.fn(async () => ({
        requestId: 'req-synth-1',
        status: 'handled',
        version: 9,
        message: 'Handled refers to the community request workflow, not clinical care completion.',
      })),
    };
    const services = createCommunityRequestServices(client);
    const loaded = await services.getCommunityRequest('req-synth-1');
    expect(loaded.contactNumber).toBe('SYNTHETIC-000');
    expect(loaded).not.toHaveProperty('statusPin');
    expect(loaded).not.toHaveProperty('statusPinVerifier');

    await services.acknowledgeCommunityRequest('req-synth-1', loaded.version);
    expect(client.acknowledgeCommunityRequest).toHaveBeenCalledWith('req-synth-1', 5);

    const escalated = await services.escalateCommunityRequest('req-synth-1', 6);
    expect(client.escalateCommunityRequest).toHaveBeenCalledWith('req-synth-1', 6);
    expect(escalated.status).toBe('escalated');
    expect(escalated.message?.toLowerCase()).toContain('further human support');
    expect(escalated.message?.toLowerCase()).not.toContain('ambulance');

    await services.recordCommunityContactAttempt('req-synth-1', 7);
    expect(client.recordCommunityContactAttempt).toHaveBeenCalledWith('req-synth-1', 7);

    const handled = await services.markCommunityRequestHandled('req-synth-1', 8);
    expect(client.markCommunityRequestHandled).toHaveBeenCalledWith('req-synth-1', 8);
    expect(handled.status).toBe('handled');
    expect(handled.message).toMatch(/not clinical care completion/i);
  });

  it('does not invent clinical records from mark handled', async () => {
    const client: CommunityRequestsApiClient = {
      listCommunityRequests: jest.fn(),
      getCommunityRequest: jest.fn(),
      acknowledgeCommunityRequest: jest.fn(),
      recordCommunityContactAttempt: jest.fn(),
      markCommunityRequestHandled: jest.fn(async () => ({
        requestId: 'req-synth-1',
        status: 'handled',
        version: 9,
      })),
      escalateCommunityRequest: jest.fn(),
    };
    const services = createCommunityRequestServices(client);
    const result = await services.markCommunityRequestHandled('req-synth-1', 8);
    expect(result).not.toHaveProperty('visitId');
    expect(result).not.toHaveProperty('referralId');
    expect(result).not.toHaveProperty('clientId');
  });

  it('escalation offline and timeout never report success', async () => {
    const offlineClient: CommunityRequestsApiClient = {
      listCommunityRequests: jest.fn(),
      getCommunityRequest: jest.fn(),
      acknowledgeCommunityRequest: jest.fn(),
      recordCommunityContactAttempt: jest.fn(),
      markCommunityRequestHandled: jest.fn(),
      escalateCommunityRequest: jest.fn(async () => {
        throw new CommunityRequestOfflineError();
      }),
    };
    const offlineServices = createCommunityRequestServices(offlineClient);
    await expect(offlineServices.escalateCommunityRequest('req-synth-1', 2)).rejects.toBeInstanceOf(
      CommunityRequestOfflineError,
    );

    const timeoutClient: CommunityRequestsApiClient = {
      ...offlineClient,
      escalateCommunityRequest: jest.fn(async () => {
        throw new CommunityRequestTimeoutError();
      }),
    };
    const timeoutServices = createCommunityRequestServices(timeoutClient);
    await expect(timeoutServices.escalateCommunityRequest('req-synth-1', 2)).rejects.toBeInstanceOf(
      CommunityRequestTimeoutError,
    );
    expect(en.communityRequests.escalateSuccess).not.toMatch(/ambulance/i);
  });

  it('maps escalate conflict and capability denial without false success', async () => {
    const conflictClient: CommunityRequestsApiClient = {
      listCommunityRequests: jest.fn(),
      getCommunityRequest: jest.fn(),
      acknowledgeCommunityRequest: jest.fn(),
      recordCommunityContactAttempt: jest.fn(),
      markCommunityRequestHandled: jest.fn(),
      escalateCommunityRequest: jest.fn(async () => {
        throw new CommunityRequestError('communityRequestVersionConflict');
      }),
    };
    await expect(
      createCommunityRequestServices(conflictClient).escalateCommunityRequest('req-synth-1', 1),
    ).rejects.toMatchObject({ code: 'communityRequestVersionConflict' });

    const capabilityClient: CommunityRequestsApiClient = {
      ...conflictClient,
      escalateCommunityRequest: jest.fn(async () => {
        throw new CommunityRequestError('emergencyCapabilityRequired');
      }),
    };
    await expect(
      createCommunityRequestServices(capabilityClient).escalateCommunityRequest('req-synth-1', 3),
    ).rejects.toMatchObject({ code: 'emergencyCapabilityRequired' });

    expect(
      canEscalate(
        detail({
          status: 'cancelled',
          assignedToCaller: true,
          category: 'emergency',
          requestType: 'emergencyAssistance',
        }),
      ),
    ).toBe(false);
  });
});
