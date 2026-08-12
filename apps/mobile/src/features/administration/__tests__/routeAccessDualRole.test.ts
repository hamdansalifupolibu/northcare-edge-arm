import { evaluateRouteAccess } from '../../../navigation/routeAccess';

describe('dual-role route access', () => {
  it('denies worker routes when active workspace is administration', () => {
    const result = evaluateRouteAccess('protected-worker', {
      authState: 'authenticated',
      role: 'worker',
      availableRoles: ['worker', 'administrator'],
      activeWorkspace: 'administration',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('wrong-workspace');
    expect(result.redirectTo).toBe('/(admin)');
  });

  it('denies admin routes when active workspace is worker', () => {
    const result = evaluateRouteAccess('protected-admin', {
      authState: 'authenticated',
      role: 'administrator',
      availableRoles: ['worker', 'administrator'],
      activeWorkspace: 'worker',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('wrong-workspace');
    expect(result.redirectTo).toBe('/(worker)');
  });

  it('allows dual-role account in the matching workspace', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker', 'administrator'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(true);
    expect(
      evaluateRouteAccess('protected-admin', {
        authState: 'authenticated',
        role: 'administrator',
        availableRoles: ['worker', 'administrator'],
        activeWorkspace: 'administration',
      }).allowed,
    ).toBe(true);
  });

  it('keeps activity log behind the same admin workspace guard', () => {
    // Route lives under app/(admin)/activity.tsx — layout applies protected-admin.
    expect(
      evaluateRouteAccess('protected-admin', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(false);
    expect(
      evaluateRouteAccess('protected-admin', {
        authState: 'authenticated',
        role: 'administrator',
        availableRoles: ['worker', 'administrator'],
        activeWorkspace: 'administration',
      }).allowed,
    ).toBe(true);
  });

  it('allows workspace selection route only while required', () => {
    expect(
      evaluateRouteAccess('auth-workspace-selection', {
        authState: 'workspaceSelectionRequired',
        availableRoles: ['worker', 'administrator'],
        activeWorkspace: null,
      }).allowed,
    ).toBe(true);
    expect(
      evaluateRouteAccess('auth-workspace-selection', {
        authState: 'authenticated',
        availableRoles: ['worker', 'administrator'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(false);
  });
});
