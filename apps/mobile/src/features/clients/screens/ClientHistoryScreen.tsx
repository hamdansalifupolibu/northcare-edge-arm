import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { AuditEvent } from '../../../data/domain/entities/entities';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { colors, spacing } from '../../../theme';
import {
  ClientHistoryEmptyState,
  ClientHistoryEventRow,
  ClientHistoryShell,
  ClientHistoryTimeline,
} from '../components/ClientHistoryShell';
import { useClientServices } from '../hooks/useClientServices';

export function ClientHistoryScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { touchActivity } = useAuthSession();
  const t = useTranslation();
  const services = useClientServices();
  const [events, setEvents] = useState<readonly AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!services || !clientId) {
      return;
    }
    setLoading(true);
    try {
      const profile = await services.getClientProfile(clientId);
      setEvents(profile?.history ?? []);
    } finally {
      setLoading(false);
    }
  }, [services, clientId]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <ClientHistoryShell
      title={t.clients.history.title}
      subtitle={t.clients.history.sanitisedNote}
      backLabel={t.clients.registration.back}
      goHomeLabel={t.workerShell.goToHome}
      privacyTitle={t.clients.history.privacyTitle}
      privacyBody={t.clients.history.privacyBody}
      auditEventsHeading={t.clients.history.auditEventsHeading}
      utcFooter={t.clients.history.utcFooter}
      onBack={() => router.back()}
      onGoHome={() => router.replace('/(worker)')}
      testID="client-history-screen"
    >
      {loading ? (
        <View style={{ paddingVertical: spacing.md }} testID="client-history-loading">
          <ActivityIndicator color={colors.primary} accessibilityLabel={t.clients.loading} />
        </View>
      ) : null}
      {!loading && events.length === 0 ? (
        <ClientHistoryEmptyState message={t.clients.history.empty} />
      ) : null}
      {!loading && events.length > 0 ? (
        <ClientHistoryTimeline>
          {events.map((event, index) => (
            <ClientHistoryEventRow
              key={event.id}
              eventType={event.eventType}
              occurredAt={event.occurredAt}
              result={event.result}
              successLabel={t.clients.history.successBadge}
              isLast={index === events.length - 1}
              testID={`client-history-event-${event.id}`}
            />
          ))}
        </ClientHistoryTimeline>
      ) : null}
    </ClientHistoryShell>
  );
}
