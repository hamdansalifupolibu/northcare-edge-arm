import type { ReactNode } from 'react';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { useTranslation } from '../../../i18n/LanguageProvider';
import {
  radii,
  shadows,
  spacing,
  themedQuickActionCardBackground,
  type HexColor,
} from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import {
  AccountsIcon,
  ActivityIcon,
  SettingsGearIcon,
  SyncedRecordsIcon,
} from './AdminHomeIcons';

type QuickAction = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly lightBackground: HexColor;
  readonly href: Href;
  readonly testID: string;
  readonly renderIcon: () => ReactNode;
};

export function AdminHomeQuickActions() {
  const t = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useThemeMode();

  const actions: readonly QuickAction[] = [
    {
      id: 'accounts',
      title: t.adminShell.openAccounts,
      subtitle: t.adminShell.quickAccountsHint,
      lightBackground: '#E6F4F1',
      href: '/(admin)/accounts' as Href,
      testID: 'admin-open-accounts',
      renderIcon: () => <AccountsIcon color={colors.primary} />,
    },
    {
      id: 'synced',
      title: t.adminShell.openSyncedRecords,
      subtitle: t.adminShell.quickSyncedHint,
      lightBackground: '#E8F4FD',
      href: '/(admin)/synced-records' as Href,
      testID: 'admin-open-synced-records',
      renderIcon: () => <SyncedRecordsIcon />,
    },
    {
      id: 'activity',
      title: t.adminShell.openActivity,
      subtitle: t.adminShell.quickActivityHint,
      lightBackground: '#F3E8FF',
      href: '/(admin)/activity' as Href,
      testID: 'admin-open-activity',
      renderIcon: () => <ActivityIcon />,
    },
    {
      id: 'settings',
      title: t.adminShell.openSettings,
      subtitle: t.adminShell.quickSettingsHint,
      lightBackground: '#FFF8E1',
      href: '/(admin)/settings' as Href,
      testID: 'admin-open-settings',
      renderIcon: () => <SettingsGearIcon />,
    },
  ];

  return (
    <View style={styles.grid} testID="admin-home-quick-actions">
      {actions.map((action) => {
        const cardBackground = themedQuickActionCardBackground(
          colors,
          isDark,
          action.lightBackground,
        );
        return (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}. ${action.subtitle}`}
            onPress={() => router.push(action.href)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: cardBackground,
                borderColor: colors.border,
                borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            testID={action.testID}
          >
            <View style={styles.iconWrap}>{action.renderIcon()}</View>
            <AppText variant="label" style={[styles.title, { color: colors.textPrimary }]}>
              {action.title}
            </AppText>
            <AppText
              variant="caption"
              color="secondary"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              {action.subtitle}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    flexGrow: 1,
    minHeight: 132,
    borderRadius: radii.lg,
    padding: spacing.base,
    gap: spacing.xs,
    ...shadows.sm,
  },
  iconWrap: {
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 18,
  },
});
