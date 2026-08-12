import {
  NOTIFICATION_BODY,
  NOTIFICATION_TITLE,
  buildPrivateNotification,
  isSafeReminderResponse,
  workerScheduleToUtc,
} from '../domain/reminderDomain';

describe('reminder privacy and time validation', () => {
  it('builds only generic notification content and the permitted payload', () => {
    const payload = buildPrivateNotification('00000000-0000-4000-8000-000000000001');
    expect(payload.title).toBe(NOTIFICATION_TITLE);
    expect(payload.body).toBe(NOTIFICATION_BODY);
    expect(Object.keys(payload.data)).toEqual(['version', 'reminderId', 'action']);
  });

  it('fails closed for invalid notification responses', () => {
    expect(
      isSafeReminderResponse({
        version: 1,
        reminderId: '00000000-0000-4000-8000-000000000001',
        action: 'openReminder',
      }),
    ).toBe(true);
    expect(isSafeReminderResponse({ version: 2, action: 'openReminder' })).toBe(false);
  });

  it('requires a future reviewed date and time', () => {
    expect(() =>
      workerScheduleToUtc({
        localDate: '2020-01-01',
        localTime: '09:00',
        timeZone: 'Africa/Accra',
        now: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).toThrow('future');
  });
});
