import type { FollowUpReminder } from '../domain/reminderDomain';
import { reminderListSubtitle, reminderTypeLabel } from '../domain/reminderLabels';

const strings = {
  typeLabels: {
    generalFollowUp: 'General follow-up',
    visitFollowUp: 'Visit follow-up',
    nutritionFollowUp: 'Nutrition follow-up',
    referralFollowUp: 'Referral follow-up',
    recordReview: 'Record review',
  },
} as const;

const baseReminder = {
  id: 'r1',
  accountId: 'a1',
  organisationId: 'o1',
  facilityId: 'f1',
  clientId: null,
  encounterId: null,
  sourceType: 'workerCreated',
  sourceEntityId: null,
  reminderType: 'generalFollowUp',
  status: 'active',
  scheduledForUtc: '2099-01-01T09:00:00.000Z',
  originalTimeZone: 'UTC',
  originalLocalDate: '2099-01-01',
  originalLocalTime: '09:00',
  note: null,
  localVersion: 1,
} satisfies FollowUpReminder;

describe('reminderLabels', () => {
  it('maps reminder types to readable labels', () => {
    expect(reminderTypeLabel('generalFollowUp', strings)).toBe('General follow-up');
    expect(reminderTypeLabel('referralFollowUp', strings)).toBe('Referral follow-up');
  });

  it('prefers the worker note over the type label in list subtitles', () => {
    expect(reminderListSubtitle(baseReminder, strings)).toBe('General follow-up');
    expect(
      reminderListSubtitle({ ...baseReminder, note: '  Check MUAC at home  ' }, strings),
    ).toBe('Check MUAC at home');
  });
});
