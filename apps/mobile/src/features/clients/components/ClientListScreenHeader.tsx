import { Pressable, StyleSheet, View } from 'react-native';

import { NorthCareLogo } from '../../../design-system/brand/NorthCareLogo';
import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, shadows, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  ClientListBackIcon,
  ClientListOfflineIcon,
  ClientListUserPlusIcon,
} from './ClientListIcons';

type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly isOnline: boolean;
  readonly checking: boolean;
  readonly onBack: () => void;
  readonly onRegister: () => void;
  readonly showRegisterShortcut?: boolean;
};

export function ClientListScreenHeader({
  title,
  subtitle,
  isOnline,
  checking,
  onBack,
  onRegister,
  showRegisterShortcut = true,
}: Props) {
  const t = useTranslation();
  const { colors: themeColors } = useThemeMode();

  return (
    <View style={styles.root} testID="client-list-header">
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.workerShell.goToHome}
          onPress={onBack}
          style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
          testID="client-list-back"
        >
          <ClientListBackIcon />
        </Pressable>

        <View style={styles.logoWrap}>
          <NorthCareLogo variant="stacked" size="sm" testID="client-list-logo" />
        </View>

        <View
          style={[styles.statusPill, { backgroundColor: themeColors.surface }]}
          accessibilityRole="text"
          accessibilityLabel={
            checking
              ? t.workerHome.connectivityChecking
              : isOnline
                ? t.workerHome.online
                : t.workerHome.offline
          }
          testID="client-list-connectivity"
        >
          {!checking && !isOnline ? <ClientListOfflineIcon /> : null}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.success : colors.warning },
            ]}
          />
          <AppText variant="caption" style={styles.statusLabel} numberOfLines={1}>
            {checking ? '…' : isOnline ? t.workerHome.online : t.workerHome.offline}
          </AppText>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <AppText variant="headingLarge" style={{ color: themeColors.textPrimary }}>
            {title}
          </AppText>
          <AppText variant="body" color="secondary">
            {subtitle}
          </AppText>
        </View>
        {showRegisterShortcut ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.clients.register}
            onPress={onRegister}
            style={[styles.registerShortcut, { borderColor: themeColors.border }]}
            testID="client-list-register-shortcut"
          >
            <ClientListUserPlusIcon size={22} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 108,
    ...shadows.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  statusLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 11,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  registerShortcut: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
