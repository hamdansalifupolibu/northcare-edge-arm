import { Pressable, StyleSheet, View } from 'react-native';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { colors, layout, radii, shadows, spacing, themedMintSurface } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { ReachBackIcon, ReachRefreshIcon } from './ReachCentreIcons';

type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly liveLabel: string;
  readonly isOnline: boolean;
  readonly checking: boolean;
  readonly refreshLabel: string;
  readonly backLabel: string;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly onBack: () => void;
};

export function ReachCentreHeader({
  title,
  subtitle,
  liveLabel,
  isOnline,
  checking,
  refreshLabel,
  backLabel,
  refreshing,
  onRefresh,
  onBack,
}: Props) {
  const { colors: themeColors, isDark } = useThemeMode();
  const mintSurface = themedMintSurface(themeColors, isDark);
  const liveText = checking ? '…' : liveLabel;

  return (
    <View style={styles.root} testID="reach-centre-header">
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.85 : 1 }]}
          testID="reach-centre-back"
        >
          <ReachBackIcon color={themeColors.textPrimary} />
        </Pressable>
        <View style={styles.logoWrap}>
          <NorthCareLogo variant="stacked" size="sm" testID="reach-centre-logo" />
        </View>
        <View style={styles.trailing}>
          <View
            style={[
              styles.livePill,
              {
                backgroundColor: mintSurface,
                borderColor: isOnline ? colors.primary : themeColors.border,
              },
            ]}
            accessibilityRole="text"
            accessibilityLabel={liveText}
            testID="reach-centre-live-pill"
          >
            <View
              style={[
                styles.liveDot,
                { backgroundColor: isOnline ? colors.success : themeColors.textSecondary },
              ]}
            />
            <AppText variant="caption" style={styles.liveLabel} numberOfLines={1}>
              {liveText}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={refreshLabel}
            onPress={onRefresh}
            disabled={refreshing}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: themeColors.surface, opacity: pressed || refreshing ? 0.7 : 1 },
            ]}
            testID="reach-centre-refresh"
          >
            <ReachRefreshIcon color={themeColors.primary} />
          </Pressable>
          <WorkerThemeToggle />
        </View>
      </View>
      <View style={styles.titleBlock}>
        <AppText variant="headingLarge" style={[styles.title, { color: themeColors.textPrimary }]}>
          {title}
        </AppText>
        <AppText variant="caption" color="secondary">
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.minTouchTarget,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    ...shadows.sm,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 88,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  liveLabel: {
    fontWeight: '700',
  },
  titleBlock: {
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '800',
  },
});
