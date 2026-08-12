import type { Referral } from '../../../data/domain/entities/entities';
import {
  getReferralNextAction,
  isOpenReferralStatus,
  partitionReferralInbox,
  recommendedNextReferralStatus,
  sortReferralsForInbox,
} from '../referralInbox';

function stubReferral(
  overrides: Partial<Referral> & Pick<Referral, 'id' | 'status' | 'createdAt'>,
): Referral {
  return {
    clientId: 'client-1',
    encounterId: null,
    riskAssessmentId: null,
    sourceFacilityId: 'fac-1',
    receivingFacilityId: 'fac-2',
    priority: 'amber',
    reasonSummary: null,
    transportStatus: 'unknown',
    caregiverInformed: false,
    completedAt: null,
    qrPayloadVersion: null,
    referenceCode: 'REF-TEST',
    origin: 'workerInitiated',
    reasonCode: null,
    reasonContentStatus: null,
    prioritySource: 'noEnginePriority',
    communicationNotes: null,
    workerNotes: null,
    activePassportId: null,
    updatedAt: overrides.createdAt,
    createdByAccountId: null,
    updatedByAccountId: null,
    localVersion: 1,
    serverVersion: null,
    syncStatus: 'localOnly',
    lastSyncedAt: null,
    deletedAt: null,
    isDeleted: false,
    ...overrides,
  };
}

describe('referralInbox', () => {
  it('treats open vs terminal statuses correctly', () => {
    expect(isOpenReferralStatus('created')).toBe(true);
    expect(isOpenReferralStatus('overdue')).toBe(true);
    expect(isOpenReferralStatus('completed')).toBe(false);
    expect(isOpenReferralStatus('cancelled')).toBe(false);
  });

  it('recommends caregiver informed after created', () => {
    expect(recommendedNextReferralStatus('created')).toBe('caregiverInformed');
    expect(getReferralNextAction('created')?.label).toMatch(/caregiver informed/i);
  });

  it('sorts overdue and open before closed, newest first within group', () => {
    const closed = stubReferral({
      id: 'c1',
      status: 'completed',
      createdAt: '2026-08-03T12:00:00.000Z',
    });
    const olderOpen = stubReferral({
      id: 'o1',
      status: 'created',
      createdAt: '2026-08-01T12:00:00.000Z',
    });
    const newerOpen = stubReferral({
      id: 'o2',
      status: 'journeyStarted',
      createdAt: '2026-08-02T12:00:00.000Z',
    });
    const overdue = stubReferral({
      id: 'ov',
      status: 'overdue',
      createdAt: '2026-08-01T08:00:00.000Z',
    });

    const sorted = sortReferralsForInbox([closed, olderOpen, newerOpen, overdue]);
    expect(sorted.map((r) => r.id)).toEqual(['ov', 'o2', 'o1', 'c1']);

    const parts = partitionReferralInbox([closed, olderOpen, newerOpen, overdue]);
    expect(parts.open.map((r) => r.id)).toEqual(['ov', 'o2', 'o1']);
    expect(parts.closed.map((r) => r.id)).toEqual(['c1']);
  });
});
