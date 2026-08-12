import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, View } from 'react-native';

import { AppButton, AppText } from '../../../design-system';
import { NutritionCentreShell } from '../../nutrition/components/centre/NutritionCentreShell';
import { useConnectivity } from '../../worker-home/hooks/useConnectivity';
import { WorkerHubHeader } from '../../worker-home/components/WorkerHubHeader';
import { WorkerHubMenuCard } from '../../worker-home/components/WorkerHubMenuCard';
import { WorkerSettingsRow, WorkerSettingsSection } from '../../worker-home/components/WorkerSettingsSection';
import { MenuSyncIcon } from '../../worker-home/components/WorkerHomeMenuIcons';
import { useDatabase } from '../../../data/providers/DatabaseProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, radii, spacing } from '../../../theme';
import { useThemeMode } from '../../../theme/ThemeModeProvider';
import { SyncCentreStatRow } from '../components/SyncCentreStatRow';
import {
  resolveSyncCentreMode,
  syncErrorCategoryMessage,
} from '../domain/syncStatus';
import { useSync } from '../providers/SyncProvider';

export function SyncCentreScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { colors: themeColors } = useThemeMode();
  const { isOnline, checking } = useConnectivity();
  const { repositories } = useDatabase();
  const {
    syncNow,
    syncing,
    error,
    errorCategory,
    syncConfigured,
    lastResult,
    autoSyncWhenOnline,
    setAutoSyncWhenOnline,
  } = useSync();
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [manualAttemptFailed, setManualAttemptFailed] = useState(false);

  const refreshCounts = useCallback(async () => {
    if (!repositories) {
      return;
    }
    const [queue, openConflicts] = await Promise.all([
      repositories.syncQueue.listByState('pending'),
      repositories.syncConflicts.listOpen(),
    ]);
    setPending(queue.length);
    setConflicts(openConflicts.length);
  }, [repositories]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts, lastResult, syncing]);

  const handleSyncNow = useCallback(async () => {
    const result = await syncNow();
    setManualAttemptFailed(!result.ok);
    await refreshCounts();
  }, [refreshCounts, syncNow]);

  const statusMode = resolveSyncCentreMode({
    syncing,
    syncConfigured,
    isOnline,
    checking,
    pending,
  });

  const errorMessages = useMemo(
    () => ({
      errorConfiguration: t.sync.errorConfiguration,
      errorAuthentication: t.sync.errorAuthentication,
      errorNetwork: t.sync.errorNetwork,
      errorServer: t.sync.errorServer,
      errorProtocol: t.sync.errorProtocol,
      errorUnknown: t.sync.errorUnknown,
    }),
    [t.sync],
  );

  const failureNotice =
    manualAttemptFailed && errorCategory
      ? [
          syncErrorCategoryMessage(errorCategory, errorMessages),
          t.sync.statusErrorRetry,
        ].join(' ')
      : manualAttemptFailed && error
        ? [error, t.sync.statusErrorRetry].join(' ')
        : null;

  const statusTitle =
    statusMode === 'syncing'
      ? t.sync.statusSyncing
      : statusMode === 'unavailable'
        ? t.sync.statusUnavailable
        : statusMode === 'offline'
          ? t.sync.statusOffline
          : statusMode === 'pending'
            ? t.sync.statusPending
            : t.sync.statusUpToDate;

  const statusBody =
    statusMode === 'syncing'
      ? t.sync.statusSyncingBody
      : statusMode === 'unavailable'
        ? t.sync.statusUnavailableBody
        : statusMode === 'offline'
          ? t.sync.statusOfflineBody
          : statusMode === 'pending'
            ? t.sync.pending(pending)
            : t.sync.statusUpToDateBody;

  const statusTone =
    statusMode === 'unavailable' || statusMode === 'offline'
      ? 'warning'
      : statusMode === 'syncing'
        ? 'action'
        : statusMode === 'pending'
          ? 'warning'
          : 'success';

  const syncBlocked = syncing || !syncConfigured || (!checking && !isOnline);

  return (
    <NutritionCentreShell testID="sync-centre">
      <WorkerHubHeader
        title={t.sync.title}
        subtitle={t.sync.subtitle}
        onBack={() => router.back()}
        showThemeToggle={false}
      />

      <View
        style={[
          styles.statusHero,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          },
        ]}
      >
        {syncing ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  statusTone === 'warning'
                    ? colors.warning
                    : statusTone === 'action'
                      ? colors.primary
                      : colors.success,
              },
            ]}
          />
        )}
        <View style={styles.statusCopy}>
          <AppText variant="title">{statusTitle}</AppText>
          <AppText variant="body" color="secondary">
            {statusBody}
          </AppText>
          {lastResult && !manualAttemptFailed ? (
            <AppText variant="caption" color="secondary">
              {t.sync.completed(lastResult.pushed, lastResult.pulled)}
            </AppText>
          ) : null}
        </View>
      </View>

      {failureNotice ? (
        <View
          style={[
            styles.failureNotice,
            {
              backgroundColor: themeColors.surface,
              borderColor: colors.warning,
            },
          ]}
          testID="sync-failure-notice"
        >
          <AppText variant="label" color="warning">
            {t.sync.lastAttemptFailed}
          </AppText>
          <AppText variant="body" color="secondary">
            {failureNotice}
          </AppText>
        </View>
      ) : null}

      <SyncCentreStatRow
        stats={[
          { label: t.sync.statPending, value: pending, tone: pending > 0 ? 'warning' : 'success' },
          { label: t.sync.statConflicts, value: conflicts, tone: conflicts > 0 ? 'danger' : 'default' },
          {
            label: t.sync.statLastSent,
            value: lastResult?.pushed ?? '—',
            tone: 'default',
          },
          {
            label: t.sync.statLastReceived,
            value: lastResult?.pulled ?? '—',
            tone: 'default',
          },
        ]}
      />

      <WorkerSettingsSection label={t.sync.automaticSection}>
        <WorkerSettingsRow
          label={t.sync.autoSyncWhenOnlineLabel}
          hint={t.sync.autoSyncWhenOnlineHint}
        >
          <Switch
            accessibilityRole="switch"
            accessibilityLabel={t.sync.autoSyncWhenOnlineLabel}
            value={autoSyncWhenOnline}
            onValueChange={(value) => void setAutoSyncWhenOnline(value)}
            trackColor={{ false: themeColors.border, true: colors.primary }}
            thumbColor={themeColors.surface}
            testID="sync-auto-when-online"
          />
        </WorkerSettingsRow>
        <View style={[styles.plannedRow, { borderTopColor: themeColors.border }]}>
          <View style={styles.plannedCopy}>
            <AppText variant="label">{t.sync.scheduledSyncLabel}</AppText>
            <AppText variant="caption" color="secondary">
              {t.sync.scheduledSyncHint}
            </AppText>
            <AppText variant="caption" color="secondary" style={styles.plannedExample}>
              {t.sync.scheduledSyncExample}
            </AppText>
          </View>
          <AppText variant="caption" color="secondary">
            {t.sync.scheduledSyncPlanned}
          </AppText>
        </View>
      </WorkerSettingsSection>

      <AppText variant="caption" color="secondary">
        {t.sync.foregroundOnly}
      </AppText>

      <AppButton
        label={syncing ? t.sync.syncing : t.sync.syncNow}
        disabled={syncBlocked}
        loading={syncing}
        onPress={() => void handleSyncNow()}
        testID="sync-now"
      />

      {!syncConfigured ? (
        <AppText variant="caption" color="warning">
          {t.sync.syncUnavailableBlocked}
        </AppText>
      ) : !checking && !isOnline ? (
        <AppText variant="caption" color="warning">
          {t.sync.offlineSyncBlocked}
        </AppText>
      ) : null}

      <WorkerHubMenuCard
        title={t.sync.reviewConflicts(conflicts)}
        subtitle={t.sync.conflictsBody}
        onPress={() => router.push('/(worker)/sync-conflicts')}
        testID="sync-open-conflicts"
        iconBackground="#FFF8E1"
        renderIcon={() => <MenuSyncIcon color={colors.warning} />}
      />
    </NutritionCentreShell>
  );
}

const styles = StyleSheet.create({
  statusHero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
  },
  failureNotice: {
    gap: spacing.xxs,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  statusCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  plannedRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  plannedCopy: {
    gap: spacing.xxs,
  },
  plannedExample: {
    fontStyle: 'italic',
  },
});
