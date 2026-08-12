import { formatCommunityRequestRelativeTime } from '../domain/labels';

describe('formatCommunityRequestRelativeTime', () => {
  const now = Date.parse('2026-08-09T12:00:00.000Z');

  it('returns now for timestamps under one minute', () => {
    expect(formatCommunityRequestRelativeTime('2026-08-09T11:59:30.000Z', now)).toBe('now');
  });

  it('returns minutes for recent timestamps', () => {
    expect(formatCommunityRequestRelativeTime('2026-08-09T11:50:00.000Z', now)).toBe('10m');
  });

  it('returns hours for same-day timestamps', () => {
    expect(formatCommunityRequestRelativeTime('2026-08-09T08:00:00.000Z', now)).toBe('4h');
  });

  it('returns days for recent week timestamps', () => {
    expect(formatCommunityRequestRelativeTime('2026-08-07T12:00:00.000Z', now)).toBe('2d');
  });

  it('falls back to locale date for older timestamps', () => {
    const label = formatCommunityRequestRelativeTime('2026-07-01T12:00:00.000Z', now);
    expect(label).toContain('2026');
  });
});
