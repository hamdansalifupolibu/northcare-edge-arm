import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

import { layout, radii } from '../../theme';
import { AppImage } from './AppImage';

export type HeroImageProps = {
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  readonly aspectRatio?: number;
  readonly decorative?: boolean;
  readonly style?: StyleProp<ImageStyle>;
  readonly testID?: string;
};

/**
 * Hero image treatment for onboarding-style surfaces (Stage 4+).
 * Focal point: centre-weighted contain/cover — document per asset in MOBILE_ASSET_MAPPING.
 */
export function HeroImage({
  source,
  accessibilityLabel,
  aspectRatio = 4 / 3,
  decorative = false,
  style,
  testID,
}: HeroImageProps) {
  return (
    <AppImage
      testID={testID}
      source={source}
      accessibilityLabel={accessibilityLabel}
      decorative={decorative}
      rounded
      resizeMode="cover"
      style={[
        {
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          aspectRatio,
          borderRadius: radii.image,
        },
        style,
      ]}
    />
  );
}
