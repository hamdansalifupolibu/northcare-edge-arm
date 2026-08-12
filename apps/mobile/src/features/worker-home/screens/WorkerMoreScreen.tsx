import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { getAppConfig } from '../../../config/appConfig';
import { AppText } from '../../../design-system/text/AppText';
import { NutritionCentreShell } from '../../nutrition/components/centre/NutritionCentreShell';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { WORKER_BOTTOM_NAV_CLEARANCE } from '../domain/workerNav';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { AssistantIcon, CommunityIcon } from '../components/WorkerHomeIcons';
import {
  MenuBellIcon,
  MenuSettingsIcon,
  MenuSyncIcon,
  MenuWorkerAvatarIcon,
} from '../components/WorkerHomeMenuIcons';
import { WorkerHubHeader } from '../components/WorkerHubHeader';
import { WorkerHubMenuCard } from '../components/WorkerHubMenuCard';

export function WorkerMoreScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { session, touchActivity } = useAuthSession();
  const { colors: themeColors } = useThemeMode();
  const appConfig = getAppConfig();
  const showEdgeLab =
    appConfig.diagnosticsEnabled && appConfig.appEnv !== 'production';

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  return (
    <NutritionCentreShell testID="worker-more">
      <WorkerHubHeader
        title={t.workerHome.moreTitle}
        subtitle={t.workerHome.moreSubtitle}
        onBack={() => router.back()}
        showConnectivity
      />

      {session ? (
        <View
          style={[
            styles.profileCard,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <MenuWorkerAvatarIcon color={colors.textInverse} />
          </View>
          <View style={styles.profileCopy}>
            <AppText variant="title">{session.displayName}</AppText>
            <AppText variant="caption" color="secondary">
              {session.facilityName}
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="caption" style={styles.sectionLabel}>
          {t.workerHome.moreToolsSection}
        </AppText>
        <View style={styles.menuList}>
          <WorkerHubMenuCard
            title={t.workerHome.settingsTitle}
            subtitle={t.workerHome.menuSettingsSubtitle}
            onPress={() => router.push('/(worker)/more/settings' as Href)}
            testID="worker-more-open-settings"
            iconBackgroundLight="#E6F4F1"
            renderIcon={() => <MenuSettingsIcon />}
          />
          <WorkerHubMenuCard
            title={t.workerHome.aboutTitle}
            subtitle={t.workerHome.menuAboutSubtitle}
            onPress={() => router.push('/(worker)/more/about' as Href)}
            testID="worker-more-open-about"
            iconBackgroundLight="#E6F4F1"
            renderIcon={() => <MenuSettingsIcon />}
          />
          <WorkerHubMenuCard
            title={t.workerShell.openReminders}
            subtitle={t.workerHome.menuRemindersSubtitle}
            onPress={() => router.push('/(worker)/more/reminders' as Href)}
            testID="worker-more-open-reminders"
            iconBackgroundLight="#FFF8E1"
            renderIcon={() => <MenuBellIcon />}
          />
          <WorkerHubMenuCard
            title={t.workerShell.openSyncCentre}
            subtitle={t.workerHome.menuSyncSubtitle}
            onPress={() => router.push('/(worker)/sync-centre')}
            testID="worker-more-open-sync"
            iconBackgroundLight="#E8F4FD"
            renderIcon={() => <MenuSyncIcon />}
          />
          <WorkerHubMenuCard
            title={t.workerShell.openCommunityRequests}
            subtitle={t.workerHome.communityTap}
            onPress={() => router.push('/(worker)/community-requests' as Href)}
            testID="worker-more-open-community"
            iconBackgroundLight="#F3E8FF"
            renderIcon={() => <CommunityIcon color={colors.primary} />}
          />
          <WorkerHubMenuCard
            title={t.workerShell.openAskNorthCare}
            subtitle={t.workerHome.quickAssistantHint}
            onPress={() => router.push('/(worker)/ask/chat')}
            testID="worker-more-open-ask"
            iconBackgroundLight="#E8F4FD"
            renderIcon={() => <AssistantIcon />}
          />
          {showEdgeLab ? (
            <WorkerHubMenuCard
              title={t.workerHome.edgeLabTitle}
              subtitle={t.workerHome.menuEdgeLabSubtitle}
              onPress={() => router.push('/(development)/edge-lab' as Href)}
              testID="worker-more-open-edge-lab"
              iconBackgroundLight="#E6F4F1"
              renderIcon={() => <MenuSyncIcon />}
            />
          ) : null}
        </View>
      </View>

      <View style={{ height: WORKER_BOTTOM_NAV_CLEARANCE }} />
    </NutritionCentreShell>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  menuList: {
    gap: spacing.sm,
  },
});
