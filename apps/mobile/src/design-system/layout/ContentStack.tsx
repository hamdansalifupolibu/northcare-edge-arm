import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '../../theme';

export type ContentStackProps = {
  readonly children: ReactNode;
  readonly gap?: keyof typeof spacing;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function ContentStack({
  children,
  gap = 'base',
  style,
  testID,
}: ContentStackProps) {
  return (
    <View testID={testID} style={[{ gap: spacing[gap] }, style]}>
      {children}
    </View>
  );
}
