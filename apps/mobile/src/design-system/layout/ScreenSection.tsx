import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, spacing } from '../../theme';
import { AppText } from '../text/AppText';

export type ScreenSectionProps = {
  readonly title?: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function ScreenSection({
  title,
  description,
  children,
  style,
  testID,
}: ScreenSectionProps) {
  return (
    <View
      testID={testID}
      style={[{ marginBottom: layout.sectionSpacing, gap: spacing.sm }, style]}
    >
      {title ? (
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      {description ? (
        <AppText variant="body" color="secondary">
          {description}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}
