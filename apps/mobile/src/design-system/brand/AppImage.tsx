import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';

import { radii } from '../../theme';

export type AppImageProps = Omit<ImageProps, 'style'> & {
  readonly accessibilityLabel?: string;
  readonly decorative?: boolean;
  readonly rounded?: boolean;
  readonly style?: StyleProp<ImageStyle>;
  readonly testID?: string;
};

/**
 * Safe image wrapper. Important UI text must not be baked into images.
 */
export function AppImage({
  accessibilityLabel,
  decorative = false,
  rounded = false,
  style,
  testID,
  ...rest
}: AppImageProps) {
  return (
    <Image
      {...rest}
      testID={testID}
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      importantForAccessibility={decorative ? 'no' : 'yes'}
      style={[{ borderRadius: rounded ? radii.image : 0 }, style]}
    />
  );
}
