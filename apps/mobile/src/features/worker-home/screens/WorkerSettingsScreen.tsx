import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../design-system/text/AppText';
import { LanguageToggleCompact } from '../../../i18n/LanguageToggle';
import { NutritionCentreShell } from '../../nutrition/components/centre/NutritionCentreShell';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../domain/workerNav';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { ChevronRightIcon } from '../components/WorkerHomeIcons';
import { MenuWorkerAvatarIcon } from '../components/WorkerHomeMenuIcons';
import { WorkerHubHeader } from '../components/WorkerHubHeader';
import { WorkerSettingsRow, WorkerSettingsSection } from '../components/WorkerSettingsSection';
import { WorkerThemeToggle } from '../components/WorkerThemeToggle';

export function WorkerSettingsScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const { colors: themeColors } = useThemeMode();

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  if (!session) {
    return null;
  }

  return (
    <NutritionCentreShell testID="worker-settings">
      <WorkerHubHeader
        title={t.workerHome.settingsTitle}
        subtitle={t.workerHome.settingsSubtitle}
        onBack={() => router.back()}
        showConnectivity
        showThemeToggle={false}
      />

      <View
        style={[
          styles.profileHero,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <MenuWorkerAvatarIcon size={32} color={colors.textInverse} />
          </View>
        </View>
        <AppText variant="headingMedium" style={styles.profileName}>
          {session.displayName}
        </AppText>
        <AppText variant="body" color="secondary">
          {session.facilityName}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.workerHome.settingsAccountId(session.accountId)}
        </AppText>
      </View>

      <WorkerSettingsSection label={t.workerHome.settingsPreferencesSection}>
        <WorkerSettingsRow label={t.workerHome.settingsAppearanceLabel} hint={t.workerHome.themeToggleHint}>
          <WorkerThemeToggle />
        </WorkerSettingsRow>
        <WorkerSettingsRow label={t.workerHome.settingsLanguageLabel} showDivider={false}>
          <LanguageToggleCompact />
        </WorkerSettingsRow>
      </WorkerSettingsSection>

      <WorkerSettingsSection label={t.workerHome.settingsAccountSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.workerHome.resetPassword}
          onPress={() => router.push('/(worker)/more/reset-password')}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          testID="worker-settings-reset-password"
        >
          <WorkerSettingsRow
            label={t.workerHome.resetPassword}
            hint={t.workerHome.resetPasswordHint}
          >
            <ChevronRightIcon color={themeColors.textSecondary} />
          </WorkerSettingsRow>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.workerShell.signOut}
          onPress={() => router.push('/(auth)/logout-confirm')}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          testID="worker-settings-sign-out"
        >
          <WorkerSettingsRow
            label={t.workerShell.signOut}
            hint={t.workerHome.settingsSignOutHint}
            showDivider={false}
          >
            <ChevronRightIcon color={themeColors.textSecondary} />
          </WorkerSettingsRow>
        </Pressable>
      </WorkerSettingsSection>

      <View style={{ height: WORKER_BOTTOM_NAV_CLEARANCE }} />
    </NutritionCentreShell>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
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
