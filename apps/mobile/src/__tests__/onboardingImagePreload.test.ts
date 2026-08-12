import { Asset } from 'expo-asset';

import {
  preloadOnboardingAheadOf,
  preloadOnboardingForSplash,
  preloadOnboardingSlideIndices,
  resetOnboardingImagePreloadCacheForTests,
} from '../features/onboarding/content/onboardingImagePreload';
import { ONBOARDING_SLIDE_COUNT } from '../features/onboarding/content/onboardingSlides';

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve([])),
  },
}));

const loadAsyncMock = Asset.loadAsync as jest.MockedFunction<typeof Asset.loadAsync>;

describe('onboardingImagePreload', () => {
  beforeEach(() => {
    resetOnboardingImagePreloadCacheForTests();
    loadAsyncMock.mockClear();
  });

  it('preloads only the requested slide indices once', async () => {
    await preloadOnboardingSlideIndices([0, 1]);
    await preloadOnboardingSlideIndices([0, 1, 2]);

    expect(loadAsyncMock).toHaveBeenCalledTimes(2);
    expect(loadAsyncMock.mock.calls[0]?.[0]).toHaveLength(2);
    expect(loadAsyncMock.mock.calls[1]?.[0]).toHaveLength(1);
  });

  it('ignores out-of-range indices', async () => {
    await preloadOnboardingSlideIndices([-1, ONBOARDING_SLIDE_COUNT, 3]);

    expect(loadAsyncMock).toHaveBeenCalledTimes(1);
    expect(loadAsyncMock.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('warms the first two slides during splash and queues the rest', async () => {
    await preloadOnboardingForSplash();

    expect(loadAsyncMock).toHaveBeenCalledTimes(2);
    expect(loadAsyncMock.mock.calls[0]?.[0]).toHaveLength(2);
    expect(loadAsyncMock.mock.calls[1]?.[0]).toHaveLength(4);
  });

  it('preloads the current slide and the next two ahead', () => {
    preloadOnboardingAheadOf(2);

    expect(loadAsyncMock).toHaveBeenCalledTimes(1);
    expect(loadAsyncMock.mock.calls[0]?.[0]).toHaveLength(3);
  });
});
