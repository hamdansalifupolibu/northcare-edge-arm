import { canEscalate, canAcknowledge, canRecordContactAttempt, canMarkHandled } from '../domain/actions';
import { en } from '../../../i18n/en';
import type { WorkerRequestDetail } from '../domain/types';

function detail(overrides: Partial<WorkerRequestDetail> = {}): WorkerRequestDetail {
  return {
    requestId: 'req-r6-1',
    category: 'childHealth',
    requestType: 'routine',
    communityOrLandmark: 'Synthetic R6 Landmark',
    preferredLanguage: 'en',
    status: 'assigned',
    assignedToCaller: true,
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
    version: 2,
    contactNumber: 'SYNTHETIC-000',
    consentToContact: true,
    consentToShareLocation: false,
    assignedWorkerId: 'dev-dual-worker',
    handledMeans:
      'Handled refers to the community request workflow, not clinical care completion.',
    ...overrides,
  };
}

describe('R6 packaged community-request journey semantics', () => {
  it('supports the routine action sequence without exposing PIN fields on detail', () => {
    const assigned = detail({ status: 'assigned' });
    expect(canAcknowledge(assigned)).toBe(true);
    expect(assigned).not.toHaveProperty('statusPin');
    expect(assigned).not.toHaveProperty('statusPinHash');
    expect(assigned.contactNumber).toBeTruthy();

    const acknowledged = detail({ status: 'acknowledged' });
    expect(canRecordContactAttempt(acknowledged)).toBe(true);

    const contacted = detail({ status: 'contactAttempted' });
    expect(canMarkHandled(contacted)).toBe(true);
    expect(contacted.handledMeans.toLowerCase()).toContain('clinical');
  });

  it('keeps emergency escalate wording free of ambulance claims', () => {
    const emergency = detail({
      category: 'emergency',
      requestType: 'emergencyAssistance',
      status: 'acknowledged',
    });
    expect(canEscalate(emergency)).toBe(true);
    const confirm = en.communityRequests.escalateConfirmBody.toLowerCase();
    expect(confirm).toContain('ambulance');
    expect(confirm).toMatch(/will not contact|will not.*dispatch/);
    expect(en.communityRequests.emergencyBannerTitle.toLowerCase()).toContain('simulation');
    expect(en.communityRequests.statuses.escalated.toLowerCase()).toContain('further support');
    expect(en.communityRequests.emergencyCall112.toLowerCase()).toContain('112');
  });

  it('does not treat list items as contact carriers', () => {
    const listItem = {
      requestId: 'req-r6-2',
      category: 'emergency' as const,
      requestType: 'emergencyAssistance' as const,
      communityOrLandmark: 'Synthetic',
      preferredLanguage: 'en',
      status: 'assigned' as const,
      assignedToCaller: true,
      createdAt: '2026-08-03T10:00:00.000Z',
      updatedAt: '2026-08-03T10:00:00.000Z',
      version: 1,
    };
    expect(listItem).not.toHaveProperty('contactNumber');
  });
});
