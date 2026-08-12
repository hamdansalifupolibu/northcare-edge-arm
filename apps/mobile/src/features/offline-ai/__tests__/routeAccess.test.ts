import { evaluateRouteAccess } from '../../../navigation/routeAccess';
import { resolveDeepLinkPath } from '../../../navigation/deepLinks';

describe('offline AI development route access', () => {
  it('allows development route when diagnostics are enabled', () => {
    expect(
      evaluateRouteAccess('development-only', { diagnosticsEnabled: true }).allowed,
    ).toBe(true);
  });

  it('denies development route in production', () => {
    const result = evaluateRouteAccess('development-only', { diagnosticsEnabled: false });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('development-only-blocked-in-production');
  });

  it('keeps offline-ai deep link under development policy', () => {
    const resolved = resolveDeepLinkPath('/(development)/offline-ai');
    expect(resolved.allowed).toBe(false);
  });
});
