import {
  CURRENT_ONBOARDING_VERSION,
  createMemoryPreferencesRepository,
  isOnboardingCompleteForVersion,
} from '../preferences';

describe('onboarding versioning', () => {
  it('treats matching completed version as complete', () => {
    expect(isOnboardingCompleteForVersion(1, 1)).toBe(true);
    expect(isOnboardingCompleteForVersion(CURRENT_ONBOARDING_VERSION, CURRENT_ONBOARDING_VERSION)).toBe(
      true,
    );
    expect(isOnboardingCompleteForVersion(1, CURRENT_ONBOARDING_VERSION)).toBe(false);
    expect(isOnboardingCompleteForVersion(null, 1)).toBe(false);
    expect(isOnboardingCompleteForVersion(0, 1)).toBe(false);
  });
});

describe('memory preferences repository', () => {
  it('persists onboarding completion and workspace selection', async () => {
    const repo = createMemoryPreferencesRepository();

    expect((await repo.getOnboardingStatus()).completed).toBe(false);

    await repo.setOnboardingCompleted(CURRENT_ONBOARDING_VERSION);
    expect((await repo.getOnboardingStatus()).completed).toBe(true);

    await repo.setSelectedWorkspace('worker');
    expect(await repo.getSelectedWorkspace()).toBe('worker');

    await repo.clearSelectedWorkspace();
    expect(await repo.getSelectedWorkspace()).toBeNull();

    await repo.resetOnboardingForDevelopment();
    expect((await repo.getOnboardingStatus()).completed).toBe(false);
  });
});
