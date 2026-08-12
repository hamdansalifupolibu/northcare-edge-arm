import {
  availableCommunityRequestActions,
  canAcknowledge,
  canEscalate,
  canMarkHandled,
  canRecordContactAttempt,
} from '../domain/actions';
import {
  assertEmergencySafetyWording,
  containsForbiddenEmergencyWording,
  emergencyCall112Reminder,
  emergencyCoordinationBannerTitle,
  emergencyFilterExplanation,
  emergencyFilterHeading,
  emergencyLiveIntegrationPending,
  emergencyLiveIntegrationPendingDetail,
  escalateConfirmBody,
  escalateConfirmTitle,
  escalateSuccessMessage,
} from '../domain/emergencyPresentation';
import {
  communityRequestCategoryLabel,
  communityRequestStatusLabel,
  communityRequestTypeLabel,
  isEmergencyRequest,
} from '../domain/labels';
import type { WorkerRequestDetail } from '../domain/types';
import { en } from '../../../i18n/en';

function detail(overrides: Partial<WorkerRequestDetail>): WorkerRequestDetail {
  return {
    requestId: 'req-1',
    category: 'generalChps',
    requestType: 'routine',
    contactNumber: 'SYNTHETIC',
    communityOrLandmark: 'Demo landmark',
    preferredLanguage: 'en',
    consentToContact: true,
    consentToShareLocation: false,
    status: 'assigned',
    assignedToCaller: true,
    assignedWorkerId: 'worker-1',
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

describe('community request labels', () => {
  it('maps categories, types and statuses without clinical severity words', () => {
    expect(communityRequestCategoryLabel('pregnancyNewborn')).toBe('Pregnancy and newborn');
    expect(communityRequestTypeLabel('emergencyAssistance')).toBe(
      'Emergency assistance request',
    );
    expect(communityRequestStatusLabel('contactAttempted')).toBe('Contact attempted');
    expect(communityRequestStatusLabel('escalated')).toBe('Escalated for further support');
    expect(isEmergencyRequest('emergency', 'emergencyAssistance')).toBe(true);
    expect(containsForbiddenEmergencyWording(communityRequestStatusLabel('escalated'))).toBe(
      false,
    );
  });
});

describe('community request action availability', () => {
  it('allows acknowledge for assigned and eligible unassigned received', () => {
    expect(canAcknowledge(detail({ status: 'assigned', assignedToCaller: true }))).toBe(true);
    expect(
      canAcknowledge(
        detail({
          status: 'received',
          assignedToCaller: false,
          assignedWorkerId: null,
        }),
      ),
    ).toBe(true);
    expect(canAcknowledge(detail({ status: 'acknowledged', assignedToCaller: true }))).toBe(
      false,
    );
  });

  it('allows escalate only from acknowledged assigned state (R2 transition)', () => {
    expect(canEscalate(detail({ status: 'acknowledged', assignedToCaller: true }))).toBe(true);
    expect(canEscalate(detail({ status: 'assigned', assignedToCaller: true }))).toBe(false);
    expect(canEscalate(detail({ status: 'contactAttempted', assignedToCaller: true }))).toBe(
      false,
    );
    expect(canEscalate(detail({ status: 'escalated', assignedToCaller: true }))).toBe(false);
    expect(canEscalate(detail({ status: 'handled', assignedToCaller: true }))).toBe(false);
    expect(canEscalate(detail({ status: 'acknowledged', assignedToCaller: false }))).toBe(false);
    // Category alone must not unlock escalate.
    expect(
      canEscalate(
        detail({
          category: 'emergency',
          requestType: 'emergencyAssistance',
          status: 'assigned',
          assignedToCaller: true,
        }),
      ),
    ).toBe(false);
  });

  it('allows contact attempt and handled only on valid assigned states', () => {
    expect(
      canRecordContactAttempt(detail({ status: 'acknowledged', assignedToCaller: true })),
    ).toBe(true);
    expect(
      canRecordContactAttempt(detail({ status: 'escalated', assignedToCaller: true })),
    ).toBe(true);
    expect(canMarkHandled(detail({ status: 'contactAttempted', assignedToCaller: true }))).toBe(
      true,
    );
    expect(canMarkHandled(detail({ status: 'acknowledged', assignedToCaller: true }))).toBe(
      false,
    );
    expect(
      availableCommunityRequestActions(
        detail({ status: 'acknowledged', assignedToCaller: true }),
      ),
    ).toEqual(['escalate', 'contactAttempt']);
  });
});

describe('emergency presentation wording', () => {
  it('exposes required simulation and 112 wording without ambulance claims', () => {
    expect(emergencyFilterHeading()).toBe('Emergency assistance requests');
    expect(emergencyFilterExplanation()).toMatch(/emergency simulation/i);
    expect(emergencyLiveIntegrationPending()).toMatch(/not active/i);
    expect(emergencyCoordinationBannerTitle()).toBe('Emergency coordination simulation');
    expect(emergencyCall112Reminder().toLowerCase()).toContain('call 112');
    expect(emergencyLiveIntegrationPendingDetail()).toMatch(/pending/i);
    expect(escalateConfirmTitle()).toBe('Escalate request?');
    expect(escalateConfirmBody().toLowerCase()).toContain('further human support');
    expect(escalateConfirmBody().toLowerCase()).toContain('will not contact or dispatch an ambulance');
    expect(escalateSuccessMessage()).toBe('Request escalated for further support.');

    const combined = [
      en.communityRequests.emergencyBannerTitle,
      en.communityRequests.emergencyCall112,
      en.communityRequests.emergencyLiveIntegrationPending,
      en.communityRequests.escalateConfirmBody,
      en.communityRequests.escalateSuccess,
      en.communityRequests.statuses.escalated,
    ].join('\n');

    const audit = assertEmergencySafetyWording(combined);
    expect(audit.missingRequired).toEqual([]);
    expect(audit.foundForbidden).toEqual([]);
    expect(combined.toLowerCase()).not.toContain('red priority');
    expect(combined.toLowerCase()).not.toContain('ambulance dispatched');
  });

  it('keeps i18n emergency filter and card copy calm and non-clinical', () => {
    expect(en.communityRequests.emergencyFilterHeading).toBe('Emergency assistance requests');
    expect(en.communityRequests.emergencyFilterExplanation).toContain(
      'NorthCare Reach emergency simulation',
    );
    expect(en.communityRequests.emergencyLiveIntegrationNotActive).toContain(
      'not active',
    );
    expect(en.communityRequests.emergencyLabel).toBe('Emergency assistance request');
    expect(en.communityRequests.emergencyHandledMeaning).toMatch(/does not confirm the outcome/i);
    expect(containsForbiddenEmergencyWording(en.communityRequests.escalate)).toBe(false);
    expect(containsForbiddenEmergencyWording(en.communityRequests.emergencyLabel)).toBe(false);
  });
});
