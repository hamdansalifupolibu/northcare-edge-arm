import { View } from 'react-native';

import { radii, semanticColors, spacing } from '../../theme';
import { AppText } from '../text/AppText';
import { SYNC_COPY } from './syncCopy';

export type LocalSaveConfirmationProps = {
  readonly testID?: string;
};

export function LocalSaveConfirmation({ testID }: LocalSaveConfirmationProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={SYNC_COPY.savedLocally}
      style={{
        padding: spacing.base,
        borderRadius: radii.md,
        backgroundColor: semanticColors.status.stableBackground,
      }}
    >
      <AppText variant="bodyStrong" color="stable">
        ✓ {SYNC_COPY.savedLocally}
      </AppText>
    </View>
  );
}
