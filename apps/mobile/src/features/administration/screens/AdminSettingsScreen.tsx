import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  LoadingState,
} from '../../../design-system';
import { LanguageToggleCompact } from '../../../i18n/LanguageToggle';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { ChevronRightIcon } from '../../worker-home/components/WorkerHomeIcons';
import { MenuWorkerAvatarIcon } from '../../worker-home/components/WorkerHomeMenuIcons';
import { WorkerHubHeader } from '../../worker-home/components/WorkerHubHeader';
import {
  WorkerSettingsRow,
  WorkerSettingsSection,
} from '../../worker-home/components/WorkerSettingsSection';
import { WorkerThemeToggle } from '../../worker-home/components/WorkerThemeToggle';
import { AdminPortalShell } from '../components/AdminPortalShell';
import { AdminSectionCard } from '../components/AdminSectionCard';

export function AdminSettingsScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { session, lock, touchActivity } = useAuthSession();
  const { colors: themeColors } = useThemeMode();

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  if (!session) {
    return (
      <AdminPortalShell testID="admin-settings-loading">
        <LoadingState message={t.administration.loading} />
      </AdminPortalShell>
    );
  }

  return (
    <AdminPortalShell testID="admin-settings">
      <WorkerHubHeader
        title={t.adminShell.settingsTitle}
        onBack={() => router.back()}
        onHome={() => router.replace('/(admin)')}
      />

      <AdminSectionCard style={styles.profileHero}>
        <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <MenuWorkerAvatarIcon size={32} color={themeColors.textInverse} />
          </View>
        </View>
        <AppText variant="headingMedium" style={styles.profileName}>
          {session.displayName}
        </AppText>
        <AppText variant="body" color="secondary">
          {t.adminShell.activeWorkspace}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.adminShell.settingsAccountId(session.accountId)}
        </AppText>
      </AdminSectionCard>

      <WorkerSettingsSection label={t.adminShell.settingsPreferencesSection}>
        <WorkerSettingsRow
          label={t.adminShell.settingsAppearanceLabel}
          hint={t.workerHome.themeToggleHint}
        >
          <WorkerThemeToggle />
        </WorkerSettingsRow>
        <WorkerSettingsRow label={t.adminShell.settingsLanguageLabel} showDivider={false}>
          <LanguageToggleCompact />
        </WorkerSettingsRow>
      </WorkerSettingsSection>

      <WorkerSettingsSection label={t.adminShell.settingsAccountSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.adminShell.openAbout}
          onPress={() => router.push('/(admin)/about' as Href)}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          testID="admin-settings-about"
        >
          <WorkerSettingsRow label={t.adminShell.openAbout} hint={t.workerHome.menuAboutSubtitle}>
            <ChevronRightIcon color={themeColors.textSecondary} />
          </WorkerSettingsRow>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.adminShell.lock}
          onPress={() => {
            void lock().then(() => router.replace('/(auth)/unlock'));
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          testID="admin-settings-lock"
        >
          <WorkerSettingsRow label={t.adminShell.lock} hint={t.adminShell.lockHint}>
            <ChevronRightIcon color={themeColors.textSecondary} />
          </WorkerSettingsRow>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.adminShell.signOut}
          onPress={() => router.push('/(auth)/logout-confirm')}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          testID="admin-settings-sign-out"
        >
          <WorkerSettingsRow
            label={t.adminShell.signOut}
            hint={t.adminShell.settingsSignOutHint}
            showDivider={false}
          >
            <ChevronRightIcon color={themeColors.textSecondary} />
          </WorkerSettingsRow>
        </Pressable>
      </WorkerSettingsSection>
    </AdminPortalShell>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  avatarRing: {
    borderWidth: 2,
    borderRadius: radii.pill,
    padding: 3,
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontWeight: '800',
    textAlign: 'center',
  },
});
