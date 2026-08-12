import { View, type StyleProp, type ViewStyle } from 'react-native';

import { borders, semanticColors, spacing } from '../../theme';

export type DividerProps = {
  readonly spacingSize?: 'none' | 'sm' | 'md' | 'lg';
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

const SPACE = {
  none: 0,
  sm: spacing.sm,
  md: spacing.base,
  lg: spacing.lg,
} as const;

export function Divider({ spacingSize = 'md', style, testID }: DividerProps) {
  const gap = SPACE[spacingSize];
  return (
    <View
      testID={testID}
      accessibilityRole="none"
      style={[
        {
          height: borders.widthHairline,
          backgroundColor: semanticColors.border.default,
          marginVertical: gap,
        },
        style,
      ]}
    />
  );
}
