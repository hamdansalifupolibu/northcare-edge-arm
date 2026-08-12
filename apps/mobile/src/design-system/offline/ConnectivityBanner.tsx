import { View } from 'react-native';

import { semanticColors, spacing } from '../../theme';
import { AppText } from '../text/AppText';
import { SYNC_COPY, type SyncPresentationStatus } from './syncCopy';

export type ConnectivityBannerProps = {
  readonly status: Extract<
    SyncPresentationStatus,
    'online' | 'offline' | 'waitingForConnection'
  >;
  readonly testID?: string;
};

/**
 * Presentation-only connectivity banner. Does not detect network state.
 */
export function ConnectivityBanner({
  status,
  testID,
}: ConnectivityBannerProps) {
  const isOffline = status !== 'online';
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={SYNC_COPY[status]}
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        backgroundColor: isOffline
          ? semanticColors.status.warningBackground
          : semanticColors.status.stableBackground,
      }}
    >
      <AppText
        variant="label"
        color={isOffline ? 'warning' : 'stable'}
        align="center"
      >
        {isOffline ? `○ ${SYNC_COPY[status]}` : `✓ ${SYNC_COPY[status]}`}
      </AppText>
    </View>
  );
}
