# Reminder time-zone policy

Do not hardcode Ghana UTC. Persist UTC instant, original local date/time, and device time-zone identifier (`time_zone_policy_version = 1`). Preserve the original intended local wall time when the device zone changes; ambiguous cases require worker review rather than silent mass shifts.
