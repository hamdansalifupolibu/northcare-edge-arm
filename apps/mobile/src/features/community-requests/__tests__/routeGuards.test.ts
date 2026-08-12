import { evaluateRouteAccess } from '../../../navigation/routeAccess';
import { clearCommunityRequestViews, getCommunityRequestViewGeneration } from '../session/communityRequestViewStore';

describe('community requests route guards', () => {
  it('allows Worker workspace access to protected-worker routes', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker', 'administrator'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(true);
  });

  it('denies signed-out access', () => {
    const result = evaluateRouteAccess('protected-worker', {
      authState: 'signedOut',
      role: null,
      activeWorkspace: null,
    });
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/(auth)/worker-login');
  });

  it('denies locked access', () => {
    const result = evaluateRouteAccess('protected-worker', {
      authState: 'locked',
      role: 'worker',
      availableRoles: ['worker'],
      activeWorkspace: 'worker',
    });
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe('/(auth)/unlock');
  });

  it('denies Administration workspace', () => {
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

  it('denies admin-only account for worker routes', () => {
    const result = evaluateRouteAccess('protected-worker', {
      authState: 'authenticated',
      role: 'administrator',
      availableRoles: ['administrator'],
      activeWorkspace: 'administration',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('worker-role-required');
  });

  it('allows dual-role account through Worker workspace', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker', 'administrator'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(true);
  });

  it('clears community request views on workspace/session clear', () => {
    const before = getCommunityRequestViewGeneration();
    clearCommunityRequestViews();
    expect(getCommunityRequestViewGeneration()).toBe(before + 1);
  });
});
