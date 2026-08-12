# Reach Stage R4 — Worker Community Requests Centre

**Status:** Implemented — awaiting R5 approval  
**Date:** 2026-08-03  

## Purpose

Build the Worker-side mobile experience for receiving and handling NorthCare Reach community requests using existing R2 APIs.

## In scope

- Feature module `apps/mobile/src/features/community-requests/`
- Routes `/(worker)/community-requests` and `/(worker)/community-requests/[requestId]`
- List filters: awaiting / assignedToMe / emergency / handled
- Detail: contact, consent, status, assignment
- Actions: acknowledge, contact attempt, mark handled
- Optional Start client lookup (navigate only)
- Truthful offline / reach-disabled / conflict messaging
- Manual + focus + foreground refresh
- Docs, inventories, tests, checkpoint

## Out of scope

- New backend model / routing / migrations
- USSD changes
- Push / WebSockets / background polling
- Emergency escalation UI (R5)
- Offline mutation queue / SQLite request repository
- Auto client create/link
- Stage 19 / R5 implementation

## Checkpoint

See `docs/development/REACH_R4_CHECKPOINT.md`.
