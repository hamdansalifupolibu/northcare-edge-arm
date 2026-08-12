/**
 * In-memory only: holds a validated notification payload until the worker unlocks.
 * Never stores client names, reasons, or health content.
 */
export type PendingReminderOpen = {
  readonly version: 1;
  readonly reminderId: string;
  readonly action: 'openReminder';
};

let pending: PendingReminderOpen | null = null;

export function setPendingReminderOpen(value: PendingReminderOpen): void {
  pending = value;
}

export function consumePendingReminderOpen(): PendingReminderOpen | null {
  const value = pending;
  pending = null;
  return value;
}

export function clearPendingReminderOpen(): void {
  pending = null;
}

export function peekPendingReminderOpen(): PendingReminderOpen | null {
  return pending;
}
