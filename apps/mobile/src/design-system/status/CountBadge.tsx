import { View } from 'react-native';

import { layout, radii, semanticColors, spacing } from '../../theme';
import { AppText } from '../text/AppText';

export type CountBadgeProps = {
  readonly count: number;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
};

export function CountBadge({
  count,
  accessibilityLabel,
  testID,
}: CountBadgeProps) {
  const display = count > 99 ? '99+' : String(count);
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${count} items`}
      style={{
        minWidth: layout.iconSizeMd,
        minHeight: layout.iconSizeMd,
        paddingHorizontal: spacing.xs,
        borderRadius: radii.pill,
        backgroundColor: semanticColors.action.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="label" color="inverse">
        {display}
      </AppText>
    </View>
  );
}
