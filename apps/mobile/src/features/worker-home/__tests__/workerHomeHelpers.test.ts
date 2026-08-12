import { firstDisplayName, resolveDayPeriod } from '../domain/workerGreeting';
import { isSameLocalCalendarDay } from '../domain/dateHelpers';

describe('workerGreeting', () => {
  it('resolves morning greeting period', () => {
    expect(resolveDayPeriod(new Date('2026-08-08T08:00:00'))).toBe('morning');
  });

  it('extracts first display name token', () => {
    expect(firstDisplayName('Amina Yakubu')).toBe('Amina');
  });
});

describe('dateHelpers', () => {
  it('matches same local calendar day', () => {
    const reference = new Date('2026-08-08T20:00:00');
    expect(isSameLocalCalendarDay('2026-08-08T02:00:00.000Z', reference)).toBe(true);
  });
});
