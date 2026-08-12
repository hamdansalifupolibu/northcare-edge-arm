import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { spacing } from '../../../theme';

type EdgeLabKvRowProps = {
  readonly label: string;
  readonly value: string;
};

export function EdgeLabKvRow({ label, value }: EdgeLabKvRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingVertical: spacing.xxs,
      }}
    >
      <AppText variant="caption" color="secondary" style={{ flex: 1 }}>
        {label}
      </AppText>
      <AppText variant="caption" color="primary" style={{ flexShrink: 0, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
