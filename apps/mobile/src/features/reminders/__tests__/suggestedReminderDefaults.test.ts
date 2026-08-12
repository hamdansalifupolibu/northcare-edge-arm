import {
  REFERRAL_FOLLOW_UP_SUGGESTED_CALENDAR_DAYS,
  SUGGESTED_FOLLOW_UP_LOCAL_TIME,
  suggestReferralFollowUpLocalSchedule,
} from '../domain/suggestedReminderDefaults';

describe('suggested referral follow-up defaults', () => {
  it('documents the fixed +7 day product suggestion constant', () => {
    expect(REFERRAL_FOLLOW_UP_SUGGESTED_CALENDAR_DAYS).toBe(7);
    expect(SUGGESTED_FOLLOW_UP_LOCAL_TIME).toBe('09:00');
  });

  it('adds seven local calendar days and keeps 09:00', () => {
    const suggested = suggestReferralFollowUpLocalSchedule(
      new Date(2026, 7, 4, 15, 30, 0), // 4 Aug 2026 local
    );
    expect(suggested).toEqual({
      localDate: '2026-08-11',
      localTime: '09:00',
    });
  });

  it('crosses month boundaries using local calendar days', () => {
    const suggested = suggestReferralFollowUpLocalSchedule(
      new Date(2026, 0, 28, 8, 0, 0), // 28 Jan 2026 local
    );
    expect(suggested.localDate).toBe('2026-02-04');
    expect(suggested.localTime).toBe(SUGGESTED_FOLLOW_UP_LOCAL_TIME);
  });
});
