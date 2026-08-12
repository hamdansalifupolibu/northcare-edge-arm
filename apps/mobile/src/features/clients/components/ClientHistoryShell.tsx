import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../design-system/text/AppText';
import { HomeIcon } from '../../worker-home/components/WorkerHomeIcons';
import { ProfileBackIcon } from './ClientProfileIcons';
import {
  HistoryArchiveIcon,
  HistoryCalendarIcon,
  HistoryDocumentLockIcon,
  HistoryHeaderClockIcon,
  HistoryRegisterIcon,
  HistoryShieldCheckIcon,
  HistorySuccessCheckIcon,
  HistoryTimeIcon,
  HistoryUpdateIcon,
} from './ClientHistoryIcons';
import { colors, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import type { ColorPalette } from '../../../theme/theme.types';
import { useThemeMode } from '../../../theme/ThemeModeProvider';

const TIMELINE_ICON_SIZE = 36;

type ClientHistoryShellProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly backLabel: string;
  readonly goHomeLabel: string;
  readonly privacyTitle: string;
  readonly privacyBody: string;
  readonly auditEventsHeading: string;
  readonly utcFooter: string;
  readonly onBack: () => void;
  readonly onGoHome: () => void;
  readonly children: ReactNode;
  readonly testID?: string;
};

export function ClientHistoryShell({
  title,
  subtitle,
  backLabel,
  goHomeLabel,
  privacyTitle,
  privacyBody,
  auditEventsHeading,
  utcFooter,
  onBack,
  onGoHome,
  children,
  testID,
}: ClientHistoryShellProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]} testID={testID}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            onPress={onBack}
            style={({ pressed }) => [
              styles.navButton,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            testID="client-history-back"
          >
            <ProfileBackIcon size={18} color={colors.primary} />
            <AppText variant="body" style={styles.navButtonLabel}>
              {backLabel}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={goHomeLabel}
            onPress={onGoHome}
            style={({ pressed }) => [
              styles.navButton,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            testID="client-history-go-home"
          >
            <HomeIcon size={18} color={colors.primary} />
            <AppText variant="body" style={styles.navButtonLabel}>
              {goHomeLabel}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <View style={[styles.headerIconWrap, { backgroundColor: mintSurface }]}>
            <HistoryHeaderClockIcon />
          </View>
          <View style={styles.headerCopy}>
            <AppText variant="headingLarge" style={[styles.title, { color: themeColors.textPrimary }]}>
              {title}
            </AppText>
            <AppText variant="body" color="secondary" style={styles.subtitle}>
              {subtitle}
            </AppText>
          </View>
        </View>

        <View
          style={[styles.privacyCard, { backgroundColor: mintSurface }]}
          testID="client-history-privacy-card"
        >
          <View style={[styles.privacyIconWrap, { backgroundColor: themeColors.surface }]}>
            <HistoryShieldCheckIcon />
          </View>
          <View style={styles.privacyCopy}>
            <AppText variant="bodyStrong" style={{ color: colors.primaryDark }}>
              {privacyTitle}
            </AppText>
            <AppText variant="caption" color="secondary">
              {privacyBody}
            </AppText>
          </View>
          <HistoryDocumentLockIcon size={52} />
        </View>

        <AppText variant="bodyStrong" style={styles.auditHeading}>
          {auditEventsHeading}
        </AppText>

        <View style={styles.body}>{children}</View>

        <View style={styles.footer}>
          <HistoryShieldCheckIcon size={16} color={colors.textSecondary} />
          <AppText variant="caption" color="secondary" style={styles.footerText}>
            {utcFooter}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

function splitAuditTimestamp(iso: string): { readonly date: string; readonly time: string } {
  const [date = iso, time = ''] = iso.split('T');
  return { date, time };
}

function resolveEventVisual(
  eventType: string,
  palette: ColorPalette,
  isDark: boolean,
): {
  readonly icon: ReactNode;
  readonly backgroundColor: string;
} {
  if (eventType === 'client_registered') {
    return {
      icon: <HistoryRegisterIcon color={colors.primary} />,
      backgroundColor: isDark ? palette.mutedSurface : colors.successBackground,
    };
  }
  if (eventType === 'client_updated') {
    return {
      icon: <HistoryUpdateIcon color={colors.warning} />,
      backgroundColor: isDark ? palette.mutedSurface : colors.warningBackground,
    };
  }
  if (eventType === 'client_archived') {
    return {
      icon: <HistoryArchiveIcon color={colors.textSecondary} />,
      backgroundColor: palette.mutedSurface,
    };
  }
  return {
    icon: <HistoryRegisterIcon color={colors.primary} />,
    backgroundColor: isDark ? palette.mutedSurface : colors.successBackground,
  };
}

function formatResultLabel(result: string): string {
  if (!result) {
    return result;
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function ClientHistoryTimeline({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <View style={styles.timeline}>{children}</View>;
}

export function ClientHistoryEventRow({
  eventType,
  occurredAt,
  result,
  successLabel,
  isLast = false,
  testID,
}: {
  readonly eventType: string;
  readonly occurredAt: string;
  readonly result: string;
  readonly successLabel: string;
  readonly isLast?: boolean;
  readonly testID?: string;
}) {
  const { colors: themeColors, isDark, semantic } = useThemeMode();
  const { date, time } = splitAuditTimestamp(occurredAt);
  const visual = resolveEventVisual(eventType, themeColors, isDark);
  const resultLabel = formatResultLabel(result);

  return (
    <View style={styles.timelineItem} testID={testID}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineIconBubble, { backgroundColor: visual.backgroundColor }]}>
          {visual.icon}
        </View>
        {!isLast ? (
          <View style={styles.timelineConnector}>
            <View style={[styles.timelineDot, { backgroundColor: themeColors.border }]} />
            <View style={[styles.timelineLine, { backgroundColor: themeColors.border }]} />
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.eventCard,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <View style={styles.eventCardTopRow}>
          <AppText variant="bodyStrong" style={[styles.eventType, { color: themeColors.textPrimary }]}>
            {eventType}
          </AppText>
          <View style={[styles.successBadge, { backgroundColor: semantic.status.stableBackground }]}>
            <HistorySuccessCheckIcon />
            <AppText variant="caption" style={[styles.successBadgeLabel, { color: semantic.status.stable }]}>
              {resultLabel || successLabel}
            </AppText>
          </View>
        </View>
        <View style={styles.eventMetaRow}>
          <View style={styles.eventMetaItem}>
            <HistoryCalendarIcon />
            <AppText variant="caption" color="secondary">
              {date}
            </AppText>
          </View>
          <View style={styles.eventMetaItem}>
            <HistoryTimeIcon />
            <AppText variant="caption" color="secondary">
              {time}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

export function ClientHistoryEmptyState({ message }: { readonly message: string }) {
  return (
    <AppText variant="body" color="secondary" style={styles.emptyState} testID="client-history-empty">
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.base,
    flexGrow: 1,
    gap: spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  navButtonLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
    paddingTop: spacing.xxs,
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 22,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    padding: spacing.base,
  },
  privacyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  auditHeading: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  body: {
    gap: spacing.sm,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  timelineRail: {
    width: TIMELINE_ICON_SIZE,
    alignItems: 'center',
  },
  timelineIconBubble: {
    width: TIMELINE_ICON_SIZE,
    height: TIMELINE_ICON_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineConnector: {
    alignItems: 'center',
    flex: 1,
    minHeight: spacing.lg,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    marginTop: spacing.xxs,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
    borderRadius: radii.pill,
  },
  eventCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        ...shadows.sm,
      },
    }),
  },
  eventCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eventType: {
    flex: 1,
    fontWeight: '700',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  successBadgeLabel: {
    fontWeight: '700',
  },
  eventMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  emptyState: {
    lineHeight: 22,
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  footerText: {
    textAlign: 'center',
    flexShrink: 1,
  },
});
