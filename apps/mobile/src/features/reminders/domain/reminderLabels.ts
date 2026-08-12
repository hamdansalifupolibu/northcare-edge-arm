import type { FollowUpReminder, ReminderType } from './reminderDomain';

export type ReminderUiStrings = {
  readonly typeLabels: Record<ReminderType, string>;
};

export function reminderTypeLabel(type: ReminderType, strings: ReminderUiStrings): string {
  return strings.typeLabels[type] ?? type;
}

/** Worker-facing line: optional private note, else readable reminder category. */
export function reminderListSubtitle(
  reminder: FollowUpReminder,
  strings: ReminderUiStrings,
): string {
  const note = reminder.note?.trim();
  if (note) {
    return note;
  }
  return reminderTypeLabel(reminder.reminderType, strings);
}
