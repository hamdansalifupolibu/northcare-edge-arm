import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { layout, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { ReachBackIcon } from '../../community-requests/components/ReachCentreIcons';
import { useConnectivity } from '../hooks/useConnectivity';
import { ConnectivityStatusPill } from './ConnectivityStatusPill';
import { HomeIcon } from './WorkerHomeIcons';
import { WorkerThemeToggle } from './WorkerThemeToggle';

type Props = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly onHome?: () => void;
  readonly backLabel?: string;
  readonly showConnectivity?: boolean;
  readonly showThemeToggle?: boolean;
  readonly trailing?: ReactNode;
};

export function WorkerHubHeader({
  title,
  subtitle,
  onBack,
  onHome,
  backLabel,
  showConnectivity = true,
  showThemeToggle = true,
  trailing,
}: Props) {
  const t = useTranslation();
  const { colors: themeColors } = useThemeMode();
  const { isOnline, checking } = useConnectivity();
  const resolvedBackLabel = backLabel ?? t.onboarding.back;

  return (
    <View style={styles.root} testID="worker-hub-header">
      <View style={styles.topRow}>
        <View style={styles.leading}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={resolvedBackLabel}
              onPress={onBack}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: themeColors.surface, opacity: pressed ? 0.85 : 1 },
              ]}
              testID="worker-hub-back"
            >
              <ReachBackIcon color={themeColors.textPrimary} />
            </Pressable>
          ) : null}
          {onHome ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.workerHome.navHome}
              onPress={onHome}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: themeColors.surface, opacity: pressed ? 0.85 : 1 },
              ]}
              testID="worker-hub-home"
            >
              <HomeIcon color={themeColors.textPrimary} />
            </Pressable>
          ) : null}
          {!onBack && !onHome ? <View style={styles.iconSpacer} /> : null}
        </View>

        <View style={styles.logoWrap}>
          <NorthCareLogo variant="stacked" size="sm" testID="worker-hub-logo" />
        </View>

        <View style={styles.trailing}>
          {trailing}
          {showThemeToggle ? <WorkerThemeToggle /> : null}
          {showConnectivity ? (
            <ConnectivityStatusPill isOnline={isOnline} checking={checking} variant="surface" />
          ) : (
            <View style={styles.iconSpacer} />
          )}
        </View>
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="headingLarge" style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="secondary">
            {subtitle}
          </AppText>
        ) : null}
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
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minWidth: layout.minTouchTarget,
  },
  trailing: {
    minWidth: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  iconSpacer: {
    width: layout.minTouchTarget,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
  },
  titleBlock: {
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '800',
  },
});
