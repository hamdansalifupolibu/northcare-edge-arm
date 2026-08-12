import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import type { AuditEvent } from '../../../data/domain/entities/entities';
import { useDatabase } from '../../../data/providers/DatabaseProvider';
import {
  AppButton,
  AppStateView,
  AppText,
  LoadingState,
} from '../../../design-system';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { WorkerHubHeader } from '../../worker-home/components/WorkerHubHeader';
import { AdminPortalShell } from '../components/AdminPortalShell';
import { AdminSectionCard } from '../components/AdminSectionCard';

const ACTIVITY_FILTERS = [
  { id: 'all', eventType: null },
  { id: 'client_registered', eventType: 'client_registered' },
  { id: 'client_updated', eventType: 'client_updated' },
  { id: 'client_archived', eventType: 'client_archived' },
] as const;

type ActivityFilterId = (typeof ACTIVITY_FILTERS)[number]['id'];
type TranslationStrings = ReturnType<typeof useTranslation>;

function summariseMetadata(metadataJson: string | null, t: TranslationStrings): string {
  if (!metadataJson) {
    return t.administration.activity.noDetails;
  }
  try {
    const parsed = JSON.parse(metadataJson) as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof parsed.changedFields === 'string' && parsed.changedFields.length > 0) {
      parts.push(t.administration.activity.changedFields(parsed.changedFields));
    }
    if (typeof parsed.category === 'string') {
      parts.push(t.administration.activity.categoryLabel(parsed.category));
    }
    if (parsed.consentChanged === true) {
      parts.push(t.administration.activity.consentChanged);
    }
    if (typeof parsed.localVersion === 'number') {
      parts.push(t.administration.activity.versionLabel(parsed.localVersion));
    }
    return parts.length > 0 ? parts.join(' · ') : t.administration.activity.noDetails;
  } catch {
    return t.administration.activity.noDetails;
  }
}

function eventTitle(eventType: string, t: TranslationStrings): string {
  const labels = t.administration.activity.eventTypes;
  if (eventType in labels) {
    return labels[eventType as keyof typeof labels];
  }
  return eventType;
}

export function AdminActivityScreen() {
  const t = useTranslation();
  const router = useRouter();
  const { touchActivity } = useAuthSession();
  const { repositories } = useDatabase();
  const [filter, setFilter] = useState<ActivityFilterId>('all');
  const [events, setEvents] = useState<readonly AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!repositories) {
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const selected = ACTIVITY_FILTERS.find((item) => item.id === filter);
      const rows = await repositories.auditEvents.listRecent({
        limit: 75,
        eventType: selected?.eventType ?? null,
      });
      setEvents(rows);
    } catch {
      setEvents([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [repositories, filter]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (!repositories) {
    return (
      <AdminPortalShell testID="admin-activity">
        <LoadingState message={t.administration.loading} />
      </AdminPortalShell>
    );
  }

  return (
    <AdminPortalShell testID="admin-activity">
      <WorkerHubHeader
        title={t.administration.activity.title}
        subtitle={t.administration.activity.body}
        onBack={() => router.back()}
        onHome={() => router.replace('/(admin)')}
      />
      <AppText variant="caption" color="secondary">
        {t.administration.activity.sanitisedNote}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {ACTIVITY_FILTERS.map((item) => (
          <AppButton
            key={item.id}
            label={t.administration.activity.filters[item.id]}
            size="compact"
            fullWidth={false}
            variant={filter === item.id ? 'primary' : 'secondary'}
            onPress={() => setFilter(item.id)}
            testID={`admin-activity-filter-${item.id}`}
          />
        ))}
      </View>
      {loading ? <LoadingState message={t.administration.loading} /> : null}
      {failed ? (
        <AppStateView
          variant="error"
          heading={t.administration.errorHeading}
          explanation={t.administration.retry}
          primaryActionLabel={t.administration.retry}
          onPrimaryAction={() => void load()}
        />
      ) : null}
      {!loading && !failed && events.length === 0 ? (
        <AppStateView
          variant="empty"
          heading={t.administration.activity.emptyHeading}
          explanation={t.administration.activity.emptyBody}
        />
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {events.map((event) => (
          <AdminSectionCard key={event.id} testID={`admin-activity-item-${event.id}`}>
            <AppText variant="bodyStrong">{eventTitle(event.eventType, t)}</AppText>
            <AppText variant="caption" color="secondary">
              {event.occurredAt} · {event.result}
            </AppText>
            <AppText variant="caption" color="secondary">
              {t.administration.activity.entityLabel(event.entityType, event.entityId)}
            </AppText>
            {event.actorAccountId ? (
              <AppText variant="caption" color="secondary">
                {t.administration.activity.actorLabel(event.actorAccountId)}
              </AppText>
            ) : null}
            <AppText variant="caption" color="secondary">
              {summariseMetadata(event.metadataJson, t)}
            </AppText>
          </AdminSectionCard>
        ))}
      </View>
    </AdminPortalShell>
  );
}
