import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EntranceMotion } from '../../../design-system/motion/EntranceMotion';
import { AppText, StatusChip } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { layout, motion, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { canDemoQuickActions } from '../demo/reachDemoActions';
import {
  communityRequestCategoryLabel,
  communityRequestStatusLabel,
  communityRequestStatusTone,
  communityRequestTypeLabel,
  formatCommunityRequestRelativeTime,
  isEmergencyRequest,
} from '../domain/labels';
import type { WorkerRequestListItem } from '../domain/types';
import { ReachSignalIcon } from './ReachCentreIcons';
import { ReachRequestQuickActions } from './ReachRequestQuickActions';

type Props = {
  readonly item: WorkerRequestListItem;
  readonly index: number;
  readonly onPress: () => void;
  readonly onTake?: () => void;
  readonly onMarkSolved?: () => void;
  readonly onReopen?: () => void;
  readonly actionsBusy?: boolean;
};

export function ReachRequestCard({
  item,
  index,
  onPress,
  onTake,
  onMarkSolved,
  onReopen,
  actionsBusy = false,
}: Props) {
  const t = useTranslation();
  const { colors: themeColors, semantic, isDark } = useThemeMode();
  const [pressed, setPressed] = useState(false);
  const emergency = isEmergencyRequest(item.category, item.requestType);
  const categoryLabel = communityRequestCategoryLabel(item.category, t.communityRequests);
  const typeLabel = communityRequestTypeLabel(item.requestType, t.communityRequests);
  const statusLabel = communityRequestStatusLabel(item.status, t.communityRequests);
  const relativeTime = formatCommunityRequestRelativeTime(item.createdAt);
  const accentColor = emergency ? semantic.status.urgent : themeColors.primary;
  const showQuickActions = canDemoQuickActions(item) && onTake && onMarkSolved && onReopen;
  const centre = t.communityRequests.centre;

  const accessibilityParts = [
    emergency ? t.communityRequests.emergencyLabel : categoryLabel,
    statusLabel,
    item.communityOrLandmark,
    item.preferredLanguage,
    relativeTime,
    item.assignedToCaller ? t.communityRequests.assignedToMe : null,
  ].filter(Boolean);

  const card = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: semantic.border.default,
          borderLeftColor: accentColor,
        },
        isDark ? null : shadows.sm,
      ]}
      testID={`community-request-item-${item.requestId}`}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityParts.join(', ')}
        accessibilityHint="Open community request details"
        style={{ gap: spacing.sm, transform: [{ scale: pressed ? motion.scale.press : 1 }] }}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: emergency
                  ? semantic.status.urgentBackground
                  : themeColors.mutedSurface,
              },
            ]}
          >
            {emergency ? (
              <AppText variant="label" color="urgent">
                {t.communityRequests.emergencyIconGlyph}
              </AppText>
            ) : (
              <ReachSignalIcon size={18} color={themeColors.primary} />
            )}
          </View>
          <View style={styles.copy}>
            <AppText variant="bodyStrong" style={{ color: themeColors.textPrimary }} numberOfLines={1}>
              {emergency ? t.communityRequests.emergencyLabel : categoryLabel}
            </AppText>
            <AppText variant="caption" color="secondary" numberOfLines={1}>
              {typeLabel}
            </AppText>
          </View>
          <AppText variant="caption" color="secondary">
            {relativeTime}
          </AppText>
        </View>
        <AppText variant="caption" color="secondary" numberOfLines={2}>
          {item.communityOrLandmark} • {item.preferredLanguage}
        </AppText>
        <View style={styles.footer}>
          <StatusChip label={statusLabel} tone={communityRequestStatusTone(item.status)} hidePrefix />
          {item.assignedToCaller ? (
            <AppText variant="caption" color="secondary">
              {t.communityRequests.assignedToMe}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {showQuickActions ? (
        <ReachRequestQuickActions
          item={item}
          takeLabel={centre.takeRequest}
          markSolvedLabel={centre.markSolved}
          reopenLabel={centre.reopenRequest}
          onTake={onTake}
          onMarkSolved={onMarkSolved}
          onReopen={onReopen}
          busy={actionsBusy}
        />
      ) : null}
    </View>
  );

  if (index >= 5) {
    return <View style={{ marginBottom: spacing.sm }}>{card}</View>;
  }

  return (
    <EntranceMotion
      style={{ marginBottom: spacing.sm }}
      testID={`reach-request-card-motion-${item.requestId}`}
    >
      {card}
    </EntranceMotion>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: spacing.base,
    gap: spacing.sm,
    minHeight: layout.minTouchTarget,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
