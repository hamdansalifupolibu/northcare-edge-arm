import { Asset } from 'expo-asset';

import { ONBOARDING_SLIDE_COUNT, onboardingSlides } from './onboardingSlides';

const loadedIndices = new Set<number>();

/** @internal Test helper */
export function resetOnboardingImagePreloadCacheForTests(): void {
  loadedIndices.clear();
}

export async function preloadOnboardingSlideIndices(
  indices: readonly number[],
): Promise<void> {
  const pending = indices.filter(
    (index) =>
      index >= 0 && index < ONBOARDING_SLIDE_COUNT && !loadedIndices.has(index),
  );

  if (pending.length === 0) {
    return;
  }

  const modules = pending.map((index) => onboardingSlides[index]!.image);
  await Asset.loadAsync(modules);
  pending.forEach((index) => {
    loadedIndices.add(index);
  });
}

export function preloadOnboardingSlidesInBackground(indices: readonly number[]): void {
  void preloadOnboardingSlideIndices(indices).catch(() => {
    // Non-fatal — slides still render from bundled assets on demand.
  });
}

/** Warm slides 1–2 during splash; queue the rest without blocking navigation. */
export async function preloadOnboardingForSplash(): Promise<void> {
  await preloadOnboardingSlideIndices([0, 1]);
  preloadOnboardingSlidesInBackground([2, 3, 4, 5]);
}

/** Keep the next slides ready while the user reads the current chapter. */
export function preloadOnboardingAheadOf(currentIndex: number): void {
  preloadOnboardingSlidesInBackground([currentIndex, currentIndex + 1, currentIndex + 2]);
}
