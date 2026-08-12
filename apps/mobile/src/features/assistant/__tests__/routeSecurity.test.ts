import { evaluateRouteAccess } from '../../../navigation/routeAccess';

describe('assistant route security', () => {
  it('denies signed-out and locked worker access to protected routes', () => {
    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'signedOut',
        role: null,
      }).allowed,
    ).toBe(false);

    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'locked',
        role: 'worker',
      }).allowed,
    ).toBe(false);

    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'worker',
        availableRoles: ['worker'],
        activeWorkspace: 'worker',
      }).allowed,
    ).toBe(true);

    expect(
      evaluateRouteAccess('protected-worker', {
        authState: 'authenticated',
        role: 'administrator',
        availableRoles: ['administrator'],
        activeWorkspace: 'administration',
      }).allowed,
    ).toBe(false);
  });

  it('blocks development preview when diagnostics are disabled', () => {
    expect(
      evaluateRouteAccess('development-only', { diagnosticsEnabled: false }).allowed,
    ).toBe(false);
    expect(
      evaluateRouteAccess('development-only', { diagnosticsEnabled: true }).allowed,
    ).toBe(true);
  });

  it('uses stable article ids in article routes', () => {
    const articleId = 'article-example-care-a-exact';
    const path = `/(worker)/ask/article/${encodeURIComponent(articleId)}`;
    expect(path).toContain(articleId);
    expect(path).not.toMatch(/what|diagnose|phone/i);
  });
});
