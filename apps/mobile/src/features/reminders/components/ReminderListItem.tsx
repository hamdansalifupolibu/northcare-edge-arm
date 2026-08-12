import { Pressable, View } from 'react-native';

import { AppText } from '../../../design-system';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { semanticColors, spacing } from '../../../theme';
import type { FollowUpReminder } from '../domain/reminderDomain';
import { reminderListSubtitle } from '../domain/reminderLabels';

function uiBucket(
  reminder: FollowUpReminder,
  now: Date,
  labels: {
    upcoming: string;
    past: string;
    handled: string;
    cancelled: string;
    scheduleFailed: string;
    snoozed: string;
  },
): string {
  if (reminder.status === 'handled') return labels.handled;
  if (reminder.status === 'cancelled') return labels.cancelled;
  if (reminder.status === 'scheduleFailed') return labels.scheduleFailed;
  if (new Date(reminder.scheduledForUtc) <= now) return labels.past;
  if (reminder.status === 'snoozed') return labels.snoozed;
  return labels.upcoming;
}

export function ReminderListItem(props: {
  readonly reminder: FollowUpReminder;
  readonly onPress: () => void;
  readonly now?: Date;
}) {
  const t = useTranslation();
  const now = props.now ?? new Date();
  const bucket = uiBucket(props.reminder, now, {
    upcoming: t.reminders.upcoming,
    past: t.reminders.past,
    handled: t.reminders.handled,
    cancelled: t.reminders.cancelled,
    scheduleFailed: t.reminders.scheduleFailed,
    snoozed: t.reminders.snoozed,
  });
  const subtitle = reminderListSubtitle(props.reminder, t.reminders);

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={`Follow-up reminder, ${bucket}, ${props.reminder.originalLocalDate} ${props.reminder.originalLocalTime}, ${subtitle}`}
      style={{
        minHeight: 48,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: semanticColors.border.default,
        gap: spacing.xs,
      }}
      testID={`reminder-item-${props.reminder.id}`}
    >
      <AppText variant="body">{bucket}</AppText>
      <AppText variant="caption" color="secondary">
        {props.reminder.originalLocalDate} · {props.reminder.originalLocalTime}
      </AppText>
      <AppText variant="caption" color="secondary" testID={`reminder-item-subtitle-${props.reminder.id}`}>
        {subtitle}
      </AppText>
      <View />
    </Pressable>
  );
}
