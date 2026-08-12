import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppScreen,
  AppStateView,
  AppText,
  AppTextInput,
  FormErrorText,
  LoadingState,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { NotificationPrivacyNotice } from '../components/NotificationPrivacyNotice';
import { reminderTypeLabel } from '../domain/reminderLabels';
import { useReminderServices } from '../hooks/useReminderServices';

export function ReminderDetailsScreen() {
  const t = useTranslation();
  const { reminderId } = useLocalSearchParams<{ reminderId: string }>();
  const router = useRouter();
  const services = useReminderServices();
  const { session, touchActivity } = useAuthSession();
  const [reminder, setReminder] = useState<FollowUpReminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'snooze' | 'reschedule'>('view');
  const [localDate, setLocalDate] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!services || !reminderId) return;
    setLoading(true);
    try {
      setReminder(await services.findById(reminderId));
    } finally {
      setLoading(false);
    }
  }, [services, reminderId]);

  useEffect(() => {
    touchActivity();
  }, [touchActivity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <AppScreen>
        <LoadingState message={t.reminders.loading} />
      </AppScreen>
    );
  }

  if (!reminder || !session || !services) {
    return (
      <AppScreen testID="reminder-missing">
        <AppStateView
          variant="empty"
          heading={t.reminders.missingHeading}
          explanation={t.reminders.missingBody}
          primaryActionLabel={t.reminders.back}
          onPrimaryAction={() =>
            router.replace('/(worker)/more/reminders' as Href)
          }
        />
      </AppScreen>
    );
  }

  async function runSchedule(kind: 'snooze' | 'reschedule') {
    if (!services || !session || !reminder) return;
    const reminderRef = reminder;
    setError(null);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const next =
        kind === 'snooze'
          ? await services.snooze({
              id: reminderRef.id,
              accountId: session.accountId,
              localDate: localDate.trim(),
              localTime: localTime.trim(),
              timeZone,
            })
          : await services.reschedule({
              id: reminderRef.id,
              accountId: session.accountId,
              localDate: localDate.trim(),
              localTime: localTime.trim(),
              timeZone,
            });
      setReminder(next);
      setMode('view');
    } catch (err) {
      setError(mapUserFacingError(err, t.reminders.saveFailed));
    }
  }

  return (
    <ScrollableAppScreen testID="reminder-details-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.reminders.detailsTitle}</ScreenTitle>
        <NotificationPrivacyNotice />
        <AppText variant="body">
          {reminder.originalLocalDate} · {reminder.originalLocalTime}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.reminders.statusLabel}: {reminder.status}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.reminders.typeLabel}: {reminderTypeLabel(reminder.reminderType, t.reminders)}
        </AppText>
        <AppText variant="caption" color="secondary">
          {t.reminders.handledMeaning}
        </AppText>
        {reminder.note ? (
          <AppText variant="body" color="secondary">
            {t.reminders.noteLabel}: {reminder.note}
          </AppText>
        ) : null}
        {mode !== 'view' ? (
          <>
            <AppTextInput
              label={t.reminders.dateLabel}
              value={localDate}
              onChangeText={setLocalDate}
              placeholder="YYYY-MM-DD"
              helperText={t.reminders.dateHelper}
              testID="reminder-reschedule-date"
            />
            <AppTextInput
              label={t.reminders.timeLabel}
              value={localTime}
              onChangeText={setLocalTime}
              placeholder="HH:MM"
              helperText={t.reminders.timeHelper}
              testID="reminder-reschedule-time"
            />
            {error ? <FormErrorText>{error}</FormErrorText> : null}
            <AppButton
              label={mode === 'snooze' ? t.reminders.confirmSnooze : t.reminders.confirmReschedule}
              onPress={() => {
                void runSchedule(mode);
              }}
            />
            <AppButton
              label={t.reminders.back}
              variant="tertiary"
              onPress={() => setMode('view')}
            />
          </>
        ) : (
          <>
            {error ? <FormErrorText>{error}</FormErrorText> : null}
            {reminder.status !== 'handled' && reminder.status !== 'cancelled' ? (
              <>
                <AppButton
                  label={t.reminders.snooze}
                  variant="secondary"
                  onPress={() => {
                    setLocalDate(reminder.originalLocalDate);
                    setLocalTime(reminder.originalLocalTime);
                    setMode('snooze');
                  }}
                  testID="reminder-snooze"
                />
                <AppButton
                  label={t.reminders.reschedule}
                  variant="secondary"
                  onPress={() => {
                    setLocalDate(reminder.originalLocalDate);
                    setLocalTime(reminder.originalLocalTime);
                    setMode('reschedule');
                  }}
                  testID="reminder-reschedule"
                />
                <AppButton
                  label={t.reminders.markHandled}
                  onPress={() => {
                    setError(null);
                    void services
                      .markHandled(reminder.id, session.accountId)
                      .then(setReminder)
                      .catch((err) => {
                        setError(mapUserFacingError(err, t.reminders.saveFailed));
                      });
                  }}
                  testID="reminder-mark-handled"
                />
                <AppButton
                  label={t.reminders.cancel}
                  variant="destructive"
                  onPress={() => {
                    setError(null);
                    void services
                      .cancel(reminder.id, session.accountId)
                      .then(setReminder)
                      .catch((err) => {
                        setError(mapUserFacingError(err, t.reminders.saveFailed));
                      });
                  }}
                  testID="reminder-cancel"
                />
                {reminder.clientId ? (
                  <AppButton
                    label={t.reminders.startVisit}
                    variant="secondary"
                    onPress={() =>
                      router.push(`/(worker)/clients/${reminder.clientId}/visits/start`)
                    }
                    testID="reminder-start-visit"
                  />
                ) : null}
              </>
            ) : null}
            <AppButton
              label={t.reminders.back}
              variant="tertiary"
              onPress={() =>
                router.replace('/(worker)/more/reminders' as Href)
              }
            />
          </>
        )}
      </View>
    </ScrollableAppScreen>
  );
}
