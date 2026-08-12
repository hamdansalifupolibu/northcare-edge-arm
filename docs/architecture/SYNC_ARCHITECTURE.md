# Sync Architecture

**Stage:** 14  
**Protocol version:** 1  
**Server DB:** PostgreSQL  
**Client DB:** SQLite (local-first)

## Flow

1. Worker writes locally → enqueue `sync_queue_items` (stable `operation_id`)
2. Foreground sync engine (single-flight): register device → push → pull → apply
3. Push ACK updates `serverVersion` / `syncStatus` only after server acknowledgement
4. Pull cursor advances only after each change is applied locally
5. Conflicts persist on server and mobile for controlled resolution

## Triggers

Sync now · app active · offline→connected · remote sign-in (token available) · debounced queue  
Not: every keystroke · signed out · locked · no token · DB not ready  
Background sync: disabled (see `BACKGROUND_SYNC_DECISION.md`)

## Authority

- Server is authority for shared records after ACK
- Unsynced local clinical work is never silently discarded
- No blind last-write-wins for clinical records
