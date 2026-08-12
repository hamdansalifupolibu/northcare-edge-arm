import { evaluateRouteAccess, isDevelopmentRouteAllowed } from '../navigation/routeAccess';
import { resolveDeepLinkPath } from '../navigation/deepLinks';

describe('evaluateRouteAccess', () => {
  it('allows public and auth-boundary routes', () => {
    expect(evaluateRouteAccess('public').allowed).toBe(true);
    expect(evaluateRouteAccess('future-worker-auth').allowed).toBe(true);
  });

  it('blocks development routes in production', () => {
    const result = evaluateRouteAccess('development-only', {
      diagnosticsEnabled: false,
    });
    expect(result.allowed).toBe(false);
    expect(isDevelopmentRouteAllowed(false)).toBe(false);
  });

  it('blocks protected worker routes while signed out', () => {
    expect(
      evaluateRouteAccess('protected-worker', { authState: 'signedOut', role: null })
        .redirectTo,
    ).toBe('/(auth)/worker-login');
  });

  it('blocks protected worker routes while locked', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'locked',
        role: 'worker',
      }).redirectTo,
    ).toBe('/(auth)/unlock');
  });

  it('allows authenticated worker into worker routes', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(true);
  });

  it('blocks worker from administrator routes', () => {
    expect(
      evaluateRouteAccess('protected-admin', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(false);
  });

  it('blocks administrator from worker routes', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'administrator',
        availableRoles: ['administrator'],
        activeWorkspace: 'administration',
      }).allowed,
    ).toBe(false);
  });

  it('blocks first-time setup routes when setup is not active', () => {
    expect(
      evaluateRouteAccess('auth-setup', { authState: 'authenticated', role: 'worker' }).allowed,
    ).toBe(false);
  });

  it('allows auth-setup only during first-time setup', () => {
    expect(
      evaluateRouteAccess('auth-setup', {
        authState: 'firstTimeSetupRequired',
        role: 'worker',
      }).allowed,
    ).toBe(true);
  });

  it('allows locked unlock routes only while locked', () => {
    expect(evaluateRouteAccess('auth-locked', { authState: 'locked' }).allowed).toBe(true);
    expect(evaluateRouteAccess('auth-locked', { authState: 'authenticated' }).allowed).toBe(
      false,
    );
  });
});

describe('resolveDeepLinkPath', () => {
  it('allows public entry paths', () => {
    expect(resolveDeepLinkPath('/(entry)/onboarding').allowed).toBe(true);
  });

  it('redirects protected health deep links to auth boundary', () => {
    const result = resolveDeepLinkPath('/referral/abc');
    expect(result.allowed).toBe(false);
    expect(result.redirectPath).toBe('/(auth)/worker-login');
  });

  it('redirects referral-passport deep links to auth boundary', () => {
    const result = resolveDeepLinkPath('/referral-passport/v1/opaqueTokenValue');
    expect(result.allowed).toBe(false);
    expect(result.redirectPath).toBe('/(auth)/worker-login');
  });

  it('blocks development deep links', () => {
    const result = resolveDeepLinkPath('/(development)/preview');
    expect(result.allowed).toBe(false);
    expect(result.redirectPath).toBe('/');
  });

  it('redirects administrator deep links to admin entry', () => {
    const result = resolveDeepLinkPath('/(admin)/accounts');
    expect(result.allowed).toBe(false);
    expect(result.redirectPath).toBe('/(auth)/admin-login');
  });

  it('fails closed for unknown deep links', () => {
    const result = resolveDeepLinkPath('/totally-unknown');
    expect(result.allowed).toBe(false);
    expect(result.redirectPath).toBe('/(entry)/splash');
  });
});
