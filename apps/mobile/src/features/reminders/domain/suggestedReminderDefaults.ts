/**
 * UX convenience defaults only — not clinical follow-up timing.
 *
 * Workers must review and may edit date/time before saving.
 * Do not treat these constants as protocol intervals or medical advice.
 *
 * `REFERRAL_FOLLOW_UP_SUGGESTED_CALENDAR_DAYS` is a fixed product suggestion
 * (+7 local calendar days at 09:00 device-local) used when opening Create Reminder
 * from a referral success/details path. It is not derived from AI, risk priority,
 * or approved guidance packs.
 */
export const REFERRAL_FOLLOW_UP_SUGGESTED_CALENDAR_DAYS = 7;

/** Fixed suggested wall-clock time in the device-local timezone (HH:MM, 24h). */
export const SUGGESTED_FOLLOW_UP_LOCAL_TIME = '09:00';

/**
 * Returns a worker-editable suggested local date/time for a referral follow-up.
 * Uses local calendar arithmetic (not UTC day boundaries).
 */
export function suggestReferralFollowUpLocalSchedule(now: Date = new Date()): {
  readonly localDate: string;
  readonly localTime: string;
} {
  const local = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + REFERRAL_FOLLOW_UP_SUGGESTED_CALENDAR_DAYS,
  );
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return {
    localDate: `${year}-${month}-${day}`,
    localTime: SUGGESTED_FOLLOW_UP_LOCAL_TIME,
  };
}
