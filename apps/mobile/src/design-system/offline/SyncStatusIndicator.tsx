import { View } from 'react-native';

import { radii, semanticColors, spacing } from '../../theme';
import { AppText } from '../text/AppText';
import { SYNC_COPY, type SyncPresentationStatus } from './syncCopy';

export type SyncStatusIndicatorProps = {
  readonly status: SyncPresentationStatus;
  readonly testID?: string;
};

const COLOR: Record<
  SyncPresentationStatus,
  'secondary' | 'warning' | 'info' | 'stable' | 'urgent'
> = {
  online: 'stable',
  offline: 'secondary',
  savedLocally: 'secondary',
  waitingForConnection: 'warning',
  syncing: 'info',
  synced: 'stable',
  syncFailed: 'urgent',
  needsReview: 'warning',
};

/** Presentation-only sync indicator — no sync queue or network wiring. */
export function SyncStatusIndicator({
  status,
  testID,
}: SyncStatusIndicatorProps) {
  const label = SYNC_COPY[status];
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
        backgroundColor: semanticColors.surface.muted,
      }}
    >
      <AppText variant="label" color={COLOR[status]}>
        {label}
      </AppText>
    </View>
  );
}
