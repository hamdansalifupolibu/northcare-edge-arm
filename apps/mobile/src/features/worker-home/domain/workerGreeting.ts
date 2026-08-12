export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export function resolveDayPeriod(now: Date): DayPeriod {
  const hour = now.getHours();
  if (hour < 12) {
    return 'morning';
  }
  if (hour < 17) {
    return 'afternoon';
  }
  return 'evening';
}

export function firstDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return displayName;
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
