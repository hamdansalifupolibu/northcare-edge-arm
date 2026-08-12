import type { ImageSourcePropType, ImageStyle } from 'react-native';

export type OnboardingSlideId =
  | 'care'
  | 'reach'
  | 'intelligence'
  | 'trust'
  | 'inclusion'
  | 'impact';

export type OnboardingSlideContextKind =
  | 'location'
  | 'offline'
  | 'features'
  | 'verification'
  | 'reach'
  | 'sdg';

export type OnboardingSlideDefinition = {
  readonly id: OnboardingSlideId;
  readonly image: ImageSourcePropType;
  readonly imageStyle?: ImageStyle;
  readonly contextKind: OnboardingSlideContextKind;
};

export const ONBOARDING_SLIDE_COUNT = 6;

export const onboardingSlides: readonly OnboardingSlideDefinition[] = [
  {
    id: 'care',
    image: require('../../../../assets/images/onboarding/v2/slide-01-care.webp'),
    imageStyle: { transform: [{ scale: 1.02 }] },
    contextKind: 'location',
  },
  {
    id: 'reach',
    image: require('../../../../assets/images/onboarding/v2/slide-02-reach.webp'),
    imageStyle: { transform: [{ translateY: -24 }] },
    contextKind: 'offline',
  },
  {
    id: 'intelligence',
    image: require('../../../../assets/images/onboarding/v2/slide-03-intelligence.webp'),
    contextKind: 'features',
  },
  {
    id: 'trust',
    image: require('../../../../assets/images/onboarding/v2/slide-04-trust.webp'),
    contextKind: 'verification',
  },
  {
    id: 'inclusion',
    image: require('../../../../assets/images/onboarding/v2/slide-05-inclusion.webp'),
    imageStyle: { transform: [{ translateY: -16 }] },
    contextKind: 'reach',
  },
  {
    id: 'impact',
    image: require('../../../../assets/images/onboarding/v2/slide-06-impact.png'),
    imageStyle: { transform: [{ translateY: -32 }] },
    contextKind: 'sdg',
  },
] as const;
