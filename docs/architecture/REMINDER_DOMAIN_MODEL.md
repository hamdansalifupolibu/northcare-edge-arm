# Reminder domain model

Typed model fields include account/facility scope, optional client/encounter links, controlled `sourceType` / `reminderType` / `status`, UTC schedule plus original local date/time/zone, private note, versions, sync status, and soft delete.

Device-local scheduling metadata lives in `notification_schedule_events` and is never synchronised.

Controlled types: `generalFollowUp`, `visitFollowUp`, `nutritionFollowUp`, `referralFollowUp`, `recordReview`.  
No emergency/critical/severe/highRisk reminder types.
