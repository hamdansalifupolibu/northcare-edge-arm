import { resolvePostOnboardingRoute } from '../features/onboarding/resolvePostOnboardingRoute';

describe('resolvePostOnboardingRoute', () => {
  it('routes to login entry when workspace is already selected', () => {
    expect(resolvePostOnboardingRoute('worker')).toBe('/(auth)/worker-login');
    expect(resolvePostOnboardingRoute('administrator')).toBe('/(auth)/admin-login');
  });

  it('routes to workspace selection when none is saved', () => {
    expect(resolvePostOnboardingRoute(null)).toBe('/(entry)/workspace-selection');
  });
});
