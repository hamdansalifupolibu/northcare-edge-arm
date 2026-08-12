import { View } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from '../text/AppText';

export type SectionHeaderProps = {
  readonly title: string;
  readonly description?: string;
  readonly testID?: string;
};

export function SectionHeader({
  title,
  description,
  testID,
}: SectionHeaderProps) {
  return (
    <View testID={testID} style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" color="secondary">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
