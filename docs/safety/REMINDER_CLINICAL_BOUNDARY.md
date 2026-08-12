# Reminder clinical boundary

NorthCare AI must not invent clinical follow-up timing.

Reminders require an explicit worker-selected date and time, or a previously recorded date that the worker confirms plus a required time. Approved guidance packs that supply a time are unavailable in Stage 15 (zero pilot packs).

A fixed **suggested default** (today + 7 local calendar days at 09:00 device-local) may be prefilled on the Create Reminder form when opening from a referral path. That suggestion is a UX convenience only — the worker must review and confirm (or edit) before save. Prefill does not auto-create a reminder.

Do not auto-create reminders from synthetic guidance, RED/AMBER/GREEN priority, referral state, or unconfirmed voice suggestions. Do not assume midnight or clinic opening hours for date-only values.
