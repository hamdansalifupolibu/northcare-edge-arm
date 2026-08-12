# Local Audio Security Limitations

**Stage:** 11  
**Date:** 2026-08-02

## What Stage 11 provides

| Control | Implementation |
|---|---|
| App-private storage | expo-file-system managed `voice-captures/` directory |
| Random filenames | `vc_<uuid-without-dashes>.m4a` — not derived from client name or visit ID |
| Metadata separation | SQLite stores attachment metadata + session pointer — **not audio bytes** |
| Auth gate | Voice routes require authenticated worker session |
| No blob in SQLite | Audio files remain on filesystem only |

## What Stage 11 does not claim

| Topic | Honest status |
|---|---|
| Encryption at rest | **Not implemented** for voice files in Stage 11 |
| Hardware security module | Not used for audio |
| Anti-forensics / secure wipe | Standard file delete only |
| Cloud upload protection | No upload in Stage 11 production path |
| Cross-app isolation | Relies on Android app sandbox |

Do not marketing-copy “encrypted voice storage” or “audio never leaves device” unless a future stage implements and verifies those properties.

## Logging and diagnostics

- Do not log audio URIs, transcript text, or full file paths in production
- Development preview shows aggregate provider/schema inventory only

## Deletion

- Worker-initiated delete removes managed file via file manager
- Orphan cleanup policies deferred to future retention stage

## Future evaluation

- Database / file encryption for pilot (see `PROJECT_STATUS.md` outstanding items)
- Retention TTL and automatic purge policy
- Secure delete on logout (policy TBD)

## Related

- `docs/architecture/VOICE_TO_CARE_ARCHITECTURE.md`
- `apps/mobile/src/features/voice/audio/fileManager.ts`
