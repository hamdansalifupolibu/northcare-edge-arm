import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { useWorkerHomeSummary } from '../hooks/useWorkerHomeSummary';
import { HomeSummaryCard } from './HomeSummaryCard';

export function WorkerHomeDashboard() {
  const t = useTranslation();
  const router = useRouter();
  const { summary } = useWorkerHomeSummary();

  const communityTone =
    summary.emergencyRequests != null && summary.emergencyRequests > 0
      ? 'urgent'
      : summary.awaitingRequests != null && summary.awaitingRequests > 0
        ? 'warning'
        : 'neutral';

  const reminderTone = summary.overdueReminders > 0 ? 'warning' : 'neutral';

  const nextReminderDetail =
    summary.nextReminders[0] != null
      ? t.workerHome.nextReminder(
          summary.nextReminders[0].originalLocalDate,
          summary.nextReminders[0].originalLocalTime,
        )
      : undefined;

  return (
    <View style={{ gap: spacing.md }} testID="worker-home-dashboard">
      <AppText variant="label" color="secondary">
        {t.workerHome.todaySection}
      </AppText>

      {summary.loading ? (
        <AppText variant="caption" color="secondary">
          {t.workerHome.loading}
        </AppText>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <HomeSummaryCard
            testID="worker-home-reminders-summary"
            title={t.workerHome.remindersTap}
            body={t.workerHome.remindersSummary(
              summary.upcomingReminders,
              summary.overdueReminders,
            )}
            detail={nextReminderDetail}
            tone={reminderTone}
            onPress={() => router.push('/(worker)/more/reminders' as Href)}
          />

          <HomeSummaryCard
            testID="worker-home-community-summary"
            title={t.workerHome.communityTap}
            body={
              summary.communityAvailable
                ? t.workerHome.communitySummary(
                    summary.awaitingRequests ?? 0,
                    summary.emergencyRequests ?? 0,
                  )
                : t.workerHome.communityUnavailable
            }
            tone={summary.communityAvailable ? communityTone : 'neutral'}
            onPress={() => router.push('/(worker)/community-requests' as Href)}
          />

          <HomeSummaryCard
            testID="worker-home-sync-summary"
            title={t.workerHome.syncTap}
            body={t.workerHome.syncSummary(summary.pendingSync)}
            tone={summary.pendingSync > 0 ? 'warning' : 'neutral'}
            onPress={() => router.push('/(worker)/sync-centre')}
          />
        </View>
      )}
    </View>
  );
}
