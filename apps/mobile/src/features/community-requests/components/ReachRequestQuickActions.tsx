import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { layout, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  canDemoMarkSolved,
  canDemoReopen,
  canDemoTakeRequest,
} from '../demo/reachDemoActions';
import type { WorkerRequestListItem } from '../domain/types';

type Props = {
  readonly item: WorkerRequestListItem;
  readonly takeLabel: string;
  readonly markSolvedLabel: string;
  readonly reopenLabel: string;
  readonly onTake: () => void;
  readonly onMarkSolved: () => void;
  readonly onReopen: () => void;
  readonly busy?: boolean;
};

export function ReachRequestQuickActions({
  item,
  takeLabel,
  markSolvedLabel,
  reopenLabel,
  onTake,
  onMarkSolved,
  onReopen,
  busy = false,
}: Props) {
  const { colors: themeColors, semantic } = useThemeMode();
  const showTake = canDemoTakeRequest(item);
  const showMarkSolved = canDemoMarkSolved(item);
  const showReopen = canDemoReopen(item);

  if (!showTake && !showMarkSolved && !showReopen) {
    return null;
  }

  return (
    <View style={styles.row} testID={`reach-request-actions-${item.requestId}`}>
      {showTake ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={takeLabel}
          disabled={busy}
          onPress={onTake}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: themeColors.mutedSurface,
              borderColor: semantic.border.default,
              opacity: pressed || busy ? 0.75 : 1,
            },
          ]}
          testID={`reach-request-take-${item.requestId}`}
        >
          <AppText variant="caption" style={{ color: themeColors.primary, fontWeight: '700' }}>
            {takeLabel}
          </AppText>
        </Pressable>
      ) : null}
      {showMarkSolved ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={markSolvedLabel}
          disabled={busy}
          onPress={onMarkSolved}
          style={({ pressed }) => [
            styles.action,
            styles.primaryAction,
            {
              backgroundColor: themeColors.primary,
              opacity: pressed || busy ? 0.75 : 1,
            },
          ]}
          testID={`reach-request-solve-${item.requestId}`}
        >
          <AppText variant="caption" color="inverse" style={styles.primaryLabel}>
            {markSolvedLabel}
          </AppText>
        </Pressable>
      ) : null}
      {showReopen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={reopenLabel}
          disabled={busy}
          onPress={onReopen}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.primary,
              opacity: pressed || busy ? 0.75 : 1,
            },
          ]}
          testID={`reach-request-reopen-${item.requestId}`}
        >
          <AppText variant="caption" style={{ color: themeColors.primary, fontWeight: '700' }}>
            {reopenLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    minHeight: layout.minTouchTarget - 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    borderWidth: 0,
  },
  primaryLabel: {
    fontWeight: '700',
  },
});
