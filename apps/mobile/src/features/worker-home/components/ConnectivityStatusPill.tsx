import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { WifiOfflineIcon, WifiOnlineIcon } from './WorkerHomeIcons';

type Props = {
  readonly isOnline: boolean;
  readonly checking: boolean;
  readonly variant?: 'hero' | 'surface';
  readonly testID?: string;
};

export function ConnectivityStatusPill({
  isOnline,
  checking,
  variant = 'surface',
  testID = 'connectivity-status-pill',
}: Props) {
  const t = useTranslation();
  const { colors: themeColors, isDark } = useThemeMode();
  const isHero = variant === 'hero';

  const label = checking
    ? t.workerHome.connectivityChecking
    : isOnline
      ? t.workerHome.online
      : t.workerHome.offline;

  const onlineStyles = isOnline && !checking
    ? {
        borderColor: colors.success,
        backgroundColor: isDark ? 'rgba(22, 163, 74, 0.14)' : '#ECFDF3',
      }
    : null;

  const offlineStyles = !checking && !isOnline
    ? {
        borderColor: colors.warning,
        backgroundColor: isDark ? themeColors.warningBackground : '#FFF8ED',
      }
    : null;

  return (
    <View
      style={[
        styles.pill,
        isHero ? styles.pillHero : [styles.pillSurface, { backgroundColor: themeColors.surface, borderColor: themeColors.border }],
        onlineStyles,
        offlineStyles,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
      testID={testID}
    >
      {checking ? (
        <AppText variant="caption" style={styles.label} numberOfLines={1}>
          …
        </AppText>
      ) : isOnline ? (
        <>
          <WifiOnlineIcon />
          <AppText
            variant="caption"
            style={[styles.label, styles.onlineLabel]}
            numberOfLines={1}
          >
            {t.workerHome.online}
          </AppText>
        </>
      ) : (
        <>
          <WifiOfflineIcon />
          <AppText variant="caption" style={[styles.label, styles.offlineLabel]} numberOfLines={1}>
            {t.workerHome.offline}
          </AppText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 108,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillHero: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...shadows.sm,
  },
  pillSurface: {
    ...shadows.sm,
  },
  label: {
    fontWeight: '600',
    fontSize: 11,
  },
  onlineLabel: {
    color: colors.success,
  },
  offlineLabel: {
    color: colors.warning,
  },
});
