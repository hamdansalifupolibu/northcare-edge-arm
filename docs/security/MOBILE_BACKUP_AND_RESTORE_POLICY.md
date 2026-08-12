# Mobile Backup and Restore Policy (Stage 18)

**Updated:** 2026-08-02

## Boundary

- Application does **not** implement a custom encrypted backup/export pipeline in Stage 18.
- Android Auto Backup / device transfer behaviour depends on OS and manifest — treat clinical SQLite as sensitive if OS backup is enabled.
- SecureStore material follows platform keystore rules; not a substitute for full-disk encryption policy.

## Guidance

1. Demo/pilot devices should use synthetic data only.
2. Before device hand-off, clear app data or uninstall.
3. Do not rely on cloud backup for PHI recovery.
4. Future pilot may disable auto-backup for the app and document restore runbooks.

## Honesty

No claim that backups are encrypted end-to-end by NorthCare AI.
