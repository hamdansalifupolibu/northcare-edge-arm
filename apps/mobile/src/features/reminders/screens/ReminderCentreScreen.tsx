import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppStateView,
  AppText,
  ScreenTitle,
} from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { ReminderListItem } from '../components/ReminderListItem';
import type { FollowUpReminder } from '../domain/reminderDomain';
import { useReminderServices } from '../hooks/useReminderServices';

type Filter = 'upcoming' | 'past' | 'handled' | 'cancelled';

function matchesFilter(reminder: FollowUpReminder, filter: Filter, now: Date): boolean {
  if (filter === 'handled') return reminder.status === 'handled';
  if (filter === 'cancelled') return reminder.status === 'cancelled';
  if (filter === 'past') {
    return (
      reminder.status !== 'handled' &&
      reminder.status !== 'cancelled' &&
      new Date(reminder.scheduledForUtc) <= now
    );
  }
  return (
    reminder.status !== 'handled' &&
    reminder.status !== 'cancelled' &&
    new Date(reminder.scheduledForUtc) > now
  );
}

export function ReminderCentreScreen() {
  const t = useTranslation();
  const router = useRouter();
  const services = useReminderServices();
  const { session, touchActivity } = useAuthSession();
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [error, setError] = useState(false);
  const now = useMemo(() => new Date(), []);

  const load = useCallback(async () => {
    if (!services || !session) return;
    try {
      setReminders(await services.listForCentre(session.accountId));
      setError(false);
    } catch {
      setError(true);
    }
  }, [services, session]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const visible = reminders.filter((item) => matchesFilter(item, filter, now));

  return (
    <AppScreen padded={false} testID="reminder-centre-screen">
      <View style={{ padding: spacing.base, gap: spacing.md, flex: 1 }}>
        <ScreenTitle>{t.reminders.title}</ScreenTitle>
        <AppText variant="caption" color="secondary">
          {t.reminders.handledMeaning}
        </AppText>
        <AppButton
          label={t.reminders.create}
          onPress={() => router.push('/(worker)/more/reminders/create' as Href)}
          testID="reminder-create"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(
            [
              ['upcoming', t.reminders.upcoming],
              ['past', t.reminders.past],
              ['handled', t.reminders.handled],
              ['cancelled', t.reminders.cancelled],
            ] as const
          ).map(([key, label]) => (
            <AppButton
              key={key}
              label={label}
              variant={filter === key ? 'primary' : 'secondary'}
              fullWidth={false}
              onPress={() => setFilter(key)}
              testID={`reminder-filter-${key}`}
            />
          ))}
        </View>
        {error ? (
          <AppStateView
            variant="error"
            heading={t.reminders.unavailableHeading}
            explanation={t.reminders.unavailableBody}
            primaryActionLabel={t.reminders.retry}
            onPrimaryAction={() => {
              void load();
            }}
          />
        ) : null}
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <AppStateView
              variant="empty"
              heading={t.reminders.empty}
              explanation={t.reminders.notificationsOff}
            />
          }
          renderItem={({ item }) => (
            <ReminderListItem
              reminder={item}
              onPress={() =>
                router.push(`/(worker)/more/reminders/${item.id}` as Href)
              }
            />
          )}
        />
        <AppButton
          label={t.reminders.back}
          variant="tertiary"
          onPress={() => router.back()}
        />
      </View>
    </AppScreen>
  );
}
