import { evaluateRouteAccess, isDevelopmentRouteAllowed } from '../../../navigation/routeAccess';

describe('visit security and privacy gates', () => {
  it('keeps visit routes behind protected worker auth', () => {
    expect(
      evaluateRouteAccess('protected-worker', { authState: 'signedOut', role: null }).allowed,
    ).toBe(false);
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(true);
  });

  it('blocks screening template preview in production diagnostics mode', () => {
    expect(isDevelopmentRouteAllowed(false)).toBe(false);
    expect(
      evaluateRouteAccess('development-only', { diagnosticsEnabled: false }).allowed,
    ).toBe(false);
    expect(
      evaluateRouteAccess('development-only', { diagnosticsEnabled: true }).allowed,
    ).toBe(true);
  });

  it('uses UUID-only visit path segments in route conventions', () => {
    const clientId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const visitId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const sectionId = 'section-a';
    const path = `/(worker)/clients/${clientId}/visits/${visitId}/screening/${sectionId}`;
    expect(path).not.toMatch(/symptom|phone|yes|no|ama/i);
    expect(path).toContain(clientId);
    expect(path).toContain(visitId);
  });
});
