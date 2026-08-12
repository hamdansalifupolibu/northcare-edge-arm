import {
  countSyntheticReachDemoStats,
  listSyntheticReachDemoRequests,
  reopenSyntheticReachDemoRequest,
  resetDemoReachInboxMutations,
  solveSyntheticReachDemoRequest,
  takeSyntheticReachDemoRequest,
} from '../demo/reachDemoInbox';

describe('reachDemoInbox', () => {
  beforeEach(() => {
    resetDemoReachInboxMutations();
  });

  it('provides presentation samples across inbox filters', () => {
    const awaiting = listSyntheticReachDemoRequests('awaiting');
    const assignedToMe = listSyntheticReachDemoRequests('assignedToMe');
    const emergency = listSyntheticReachDemoRequests('emergency');
    const handled = listSyntheticReachDemoRequests('handled');

    expect(awaiting.length).toBeGreaterThanOrEqual(3);
    expect(assignedToMe.length).toBeGreaterThanOrEqual(2);
    expect(emergency.length).toBeGreaterThanOrEqual(1);
    expect(handled.length).toBeGreaterThanOrEqual(2);

    expect(awaiting.some((item) => item.category === 'childHealth')).toBe(true);
    expect(awaiting.some((item) => item.category === 'pregnancyNewborn')).toBe(true);
    expect(emergency.some((item) => item.requestType === 'emergencyAssistance')).toBe(true);
    expect(handled.every((item) => item.status === 'handled')).toBe(true);
  });

  it('exposes stat counts for the live tiles', () => {
    const stats = countSyntheticReachDemoStats();
    expect(stats.awaiting).toBe(listSyntheticReachDemoRequests('awaiting').length);
    expect(stats.assignedToMe).toBe(listSyntheticReachDemoRequests('assignedToMe').length);
    expect(stats.emergency).toBe(listSyntheticReachDemoRequests('emergency').length);
    expect(stats.awaiting).toBeGreaterThan(0);
    expect(stats.emergency).toBeGreaterThan(0);
  });

  it('does not expose contact numbers on list items', () => {
    for (const item of listSyntheticReachDemoRequests('awaiting')) {
      expect(item).not.toHaveProperty('contactNumber');
    }
  });

  it('supports demo take, solve, and reopen mutations', () => {
    const open = listSyntheticReachDemoRequests('awaiting').find(
      (item) => item.requestId.endsWith('001'),
    );
    expect(open).toBeDefined();
    if (!open) return;

    const taken = takeSyntheticReachDemoRequest(open.requestId, open.version);
    expect(taken.status).toBe('acknowledged');
    expect(taken.assignedToCaller).toBe(true);

    const solved = solveSyntheticReachDemoRequest(taken.requestId, taken.version);
    expect(solved.status).toBe('handled');
    expect(listSyntheticReachDemoRequests('handled').some((item) => item.requestId === open.requestId)).toBe(
      true,
    );

    const reopened = reopenSyntheticReachDemoRequest(solved.requestId, solved.version);
    expect(reopened.status).toBe('acknowledged');
    expect(listSyntheticReachDemoRequests('awaiting').some((item) => item.requestId === open.requestId)).toBe(
      true,
    );
  });
});
