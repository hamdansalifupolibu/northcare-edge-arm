# Reminder sync model

Registry entity: `follow_up_reminder` (alias `followUpReminder`). Conflict class: `versionedRecord`.

Synced: ids, scope, source refs, type, status, UTC/local time fields, note (under policy), versions, soft delete.  
Excluded: native notification id, permission/channel state, local scheduling errors.
