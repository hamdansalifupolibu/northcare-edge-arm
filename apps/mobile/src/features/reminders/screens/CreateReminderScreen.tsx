import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AppButton,
  AppText,
  AppTextInput,
  FormErrorText,
  ScreenTitle,
  ScrollableAppScreen,
} from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { spacing } from '../../../theme';
import { useAuthSession } from '../../auth/providers/AuthSessionProvider';
import { NotificationPrivacyNotice } from '../components/NotificationPrivacyNotice';
import type { ReminderSource, ReminderType } from '../domain/reminderDomain';
import { suggestReferralFollowUpLocalSchedule } from '../domain/suggestedReminderDefaults';
import { useReminderServices } from '../hooks/useReminderServices';

function resolveSource(params: {
  clientId?: string;
  visitId?: string;
  nutritionId?: string;
  referralId?: string;
}): { sourceType: ReminderSource; sourceEntityId: string | null; reminderType: ReminderType } {
  if (params.referralId) {
    return {
      sourceType: 'referral',
      sourceEntityId: params.referralId,
      reminderType: 'referralFollowUp',
    };
  }
  if (params.nutritionId) {
    return {
      sourceType: 'nutritionAssessment',
      sourceEntityId: params.nutritionId,
      reminderType: 'nutritionFollowUp',
    };
  }
  if (params.visitId) {
    return {
      sourceType: 'visit',
      sourceEntityId: params.visitId,
      reminderType: 'visitFollowUp',
    };
  }
  if (params.clientId) {
    return {
      sourceType: 'clientProfile',
      sourceEntityId: params.clientId,
      reminderType: 'generalFollowUp',
    };
  }
  return {
    sourceType: 'workerCreated',
    sourceEntityId: null,
    reminderType: 'generalFollowUp',
  };
}

function initialSuggestedSchedule(referralId?: string): {
  localDate: string;
  localTime: string;
  fromReferral: boolean;
} {
  if (!referralId) {
    return { localDate: '', localTime: '', fromReferral: false };
  }
  const suggested = suggestReferralFollowUpLocalSchedule();
  return {
    localDate: suggested.localDate,
    localTime: suggested.localTime,
    fromReferral: true,
  };
}

export function CreateReminderScreen() {
  const t = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    clientId?: string;
    visitId?: string;
    nutritionId?: string;
    referralId?: string;
  }>();
  const { session, touchActivity } = useAuthSession();
  const services = useReminderServices();
  const initial = initialSuggestedSchedule(
    typeof params.referralId === 'string' ? params.referralId : undefined,
  );
  const [localDate, setLocalDate] = useState(initial.localDate);
  const [localTime, setLocalTime] = useState(initial.localTime);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPermission, setShowPermission] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicateReminderId, setDuplicateReminderId] = useState<string | null>(null);

  const source = resolveSource(params);

  useEffect(() => {
    if (!services || !session || source.reminderType !== 'referralFollowUp' || !source.sourceEntityId) {
      setDuplicateReminderId(null);
      return;
    }
    let cancelled = false;
    void services
      .findActiveReferralFollowUp(session.accountId, source.sourceEntityId)
      .then((existing) => {
        if (!cancelled) {
          setDuplicateReminderId(existing?.id ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateReminderId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [services, session, source.reminderType, source.sourceEntityId]);

  async function save(requestPermission: boolean) {
    if (!services || !session) return;
    setSaving(true);
    setError(null);
    touchActivity();
    try {
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const reminder = await services.create({
        accountId: session.accountId,
        organisationId: session.organisationId,
        facilityId: session.facilityId,
        clientId: params.clientId ?? null,
        encounterId: params.visitId ?? null,
        sourceType: source.sourceType,
        sourceEntityId: source.sourceEntityId,
        reminderType: source.reminderType,
        scheduledForUtc: new Date().toISOString(),
        originalTimeZone: timeZone,
        originalLocalDate: localDate.trim(),
        originalLocalTime: localTime.trim(),
        note: note.trim() || null,
        requestPermission,
      });
      router.replace(`/(worker)/more/reminders/${reminder.id}` as Href);
    } catch (err) {
      setError(mapUserFacingError(err, t.reminders.saveFailed));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollableAppScreen testID="create-reminder-screen">
      <View style={{ gap: spacing.base }}>
        <ScreenTitle>{t.reminders.create}</ScreenTitle>
        <AppText variant="caption" color="secondary">
          {t.reminders.workerSelectedOnly}
        </AppText>
        {initial.fromReferral ? (
          <AppText variant="caption" color="secondary" testID="reminder-suggested-default-hint">
            {t.reminders.suggestedReferralDefault}
          </AppText>
        ) : null}
        <NotificationPrivacyNotice />
        {duplicateReminderId ? (
          <View style={{ gap: spacing.sm }} testID="reminder-duplicate-warning">
            <AppText variant="body" color="secondary">
              {t.reminders.duplicateReferralFollowUp}
            </AppText>
            <AppButton
              label={t.reminders.openExistingReminder}
              variant="secondary"
              onPress={() =>
                router.replace(`/(worker)/more/reminders/${duplicateReminderId}` as Href)
              }
              testID="reminder-open-existing"
            />
          </View>
        ) : null}
        <AppTextInput
          label={t.reminders.dateLabel}
          value={localDate}
          onChangeText={setLocalDate}
          placeholder="YYYY-MM-DD"
          helperText={t.reminders.dateHelper}
          accessibilityLabel={t.reminders.dateLabel}
          testID="reminder-date"
        />
        <AppTextInput
          label={t.reminders.timeLabel}
          value={localTime}
          onChangeText={setLocalTime}
          placeholder="HH:MM"
          helperText={t.reminders.timeHelper}
          accessibilityLabel={t.reminders.timeLabel}
          testID="reminder-time"
        />
        <AppTextInput
          label={t.reminders.noteLabel}
          value={note}
          onChangeText={setNote}
          placeholder={t.reminders.notePlaceholder}
          accessibilityLabel={t.reminders.noteLabel}
          testID="reminder-note"
        />
        {error ? <FormErrorText>{error}</FormErrorText> : null}
        {!duplicateReminderId ? (
          !showPermission ? (
            <AppButton
              label={t.reminders.reviewAndContinue}
              disabled={saving}
              onPress={() => setShowPermission(true)}
              testID="reminder-review-continue"
            />
          ) : (
            <>
              <AppText variant="headingSmall">{t.reminders.permissionHeading}</AppText>
              <AppText variant="body" color="secondary">
                {t.reminders.permissionBody}
              </AppText>
              <AppButton
                label={t.reminders.enableNotifications}
                disabled={saving}
                onPress={() => {
                  void save(true);
                }}
                testID="reminder-enable-notifications"
              />
              <AppButton
                label={t.reminders.saveWithoutNotifications}
                variant="secondary"
                disabled={saving}
                onPress={() => {
                  void save(false);
                }}
                testID="reminder-save-without-notifications"
              />
            </>
          )
        ) : null}
        <AppButton label={t.reminders.back} variant="tertiary" onPress={() => router.back()} />
      </View>
    </ScrollableAppScreen>
  );
}
