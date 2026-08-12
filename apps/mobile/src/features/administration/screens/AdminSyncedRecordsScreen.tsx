import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
  LoadingState,
} from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { WorkerHubHeader } from '../../worker-home/components/WorkerHubHeader';
import {
  AdministrationOfflineState,
  mapAdministrationError,
} from '../components/AdministrationStateViews';
import { AdminPortalShell } from '../components/AdminPortalShell';
import { AdminSectionCard } from '../components/AdminSectionCard';
import type { AdminSyncedRecord } from '../domain/types';
import { useAdministrationServices } from '../hooks/useAdministrationServices';

function recordLabel(record: AdminSyncedRecord): string {
  const payload = record.payload;
  if (payload && typeof payload.givenName === 'string') {
    const family = typeof payload.familyName === 'string' ? payload.familyName : '';
    return `${payload.givenName}${family ? ` ${family}` : ''}`.trim();
  }
  if (payload && typeof payload.classification === 'string') {
    return payload.classification;
  }
  return record.entityId;
}

export function AdminSyncedRecordsScreen() {
  const t = useTranslation();
  const router = useRouter();
  const services = useAdministrationServices();
  const [records, setRecords] = useState<readonly AdminSyncedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const page = await services.listSyncedRecords({ limit: 100 });
      setRecords(page.items);
    } catch (error) {
      setRecords([]);
      setOffline(mapAdministrationError(error) === 'offline');
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <AdminPortalShell testID="admin-synced-records">
      <WorkerHubHeader
        title={t.administration.syncedRecordsTitle}
        subtitle={t.administration.syncedRecordsBody}
        onBack={() => router.back()}
        onHome={() => router.replace('/(admin)')}
      />
      {offline ? <AdministrationOfflineState onRetry={() => void load()} /> : null}
      {loading ? <LoadingState message={t.administration.loading} /> : null}
      {!loading && !offline && records.length === 0 ? (
        <AppText variant="body" color="secondary" testID="admin-synced-records-empty">
          {t.administration.syncedRecordsEmpty}
        </AppText>
      ) : null}
      {!loading && records.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {records.map((item) => (
            <AdminSectionCard
              key={`${item.entityType}:${item.entityId}`}
              testID={`admin-synced-record-${item.entityType}-${item.entityId}`}
            >
              <AppText variant="label">{recordLabel(item)}</AppText>
              <AppText variant="caption" color="secondary">
                {t.administration.syncedRecordMeta(item.entityType, item.facilityName)}
              </AppText>
            </AdminSectionCard>
          ))}
        </View>
      ) : null}
      <AppButton
        label={t.onboarding.back}
        variant="secondary"
        onPress={() => router.back()}
        testID="admin-synced-records-back"
      />
    </AdminPortalShell>
  );
}
