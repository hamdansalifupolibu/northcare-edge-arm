import { evaluateRouteAccess } from '../../../navigation/routeAccess';

describe('client route security', () => {
  it('blocks signed-out and locked workers from protected client routes', () => {
    expect(
      evaluateRouteAccess('protected-worker', { authState: 'signedOut', role: null }).allowed,
    ).toBe(false);
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'locked',
        role: 'worker',
      }).redirectTo,
    ).toBe('/(auth)/unlock');
  });

  it('blocks administrators from worker client routes', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'administrator',
        availableRoles: ['administrator'],
        activeWorkspace: 'administration',
      }).allowed,
    ).toBe(false);
  });

  it('allows authenticated workers in Worker workspace', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(true);
  });
});
