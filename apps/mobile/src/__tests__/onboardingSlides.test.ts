import {
  ONBOARDING_SLIDE_COUNT,
  onboardingSlides,
} from '../features/onboarding/content/onboardingSlides';

describe('onboardingSlides', () => {
  it('defines the six-screen product story', () => {
    expect(onboardingSlides).toHaveLength(ONBOARDING_SLIDE_COUNT);
    expect(onboardingSlides.map((slide) => slide.id)).toEqual([
      'care',
      'reach',
      'intelligence',
      'trust',
      'inclusion',
      'impact',
    ]);
  });
});
