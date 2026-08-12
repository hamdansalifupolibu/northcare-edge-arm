import { Image, type ImageStyle, type StyleProp } from 'react-native';

export type NorthCareLogoVariant = 'symbol' | 'stacked';
export type NorthCareLogoSize = 'sm' | 'md' | 'lg' | 'xl';

export type NorthCareLogoProps = {
  readonly variant?: NorthCareLogoVariant;
  readonly size?: NorthCareLogoSize;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ImageStyle>;
  readonly testID?: string;
};

const SIZES: Record<NorthCareLogoSize, { width: number; height: number }> = {
  sm: { width: 40, height: 40 },
  md: { width: 72, height: 72 },
  lg: { width: 96, height: 96 },
  xl: { width: 128, height: 128 },
};

const STACKED_SIZES: Record<NorthCareLogoSize, { width: number; height: number }> = {
  sm: { width: 96, height: 72 },
  md: { width: 144, height: 108 },
  lg: { width: 192, height: 144 },
  xl: { width: 256, height: 192 },
};

/**
 * Canonical PNG logo wrapper.
 * Does not use unapproved SVG logo candidates.
 */
export function NorthCareLogo({
  variant = 'symbol',
  size = 'md',
  accessibilityLabel = 'NorthCare AI logo',
  style,
  testID,
}: NorthCareLogoProps) {
  const dimensions = variant === 'stacked' ? STACKED_SIZES[size] : SIZES[size];
  const source =
    variant === 'stacked'
      ? require('../../../assets/brand/northcare-logo-stacked-transparent.png')
      : require('../../../assets/brand/northcare-logo-symbol-primary.png');

  return (
    <Image
      testID={testID}
      source={source}
      accessibilityLabel={accessibilityLabel}
      accessible
      resizeMode="contain"
      style={[dimensions, style]}
    />
  );
}
