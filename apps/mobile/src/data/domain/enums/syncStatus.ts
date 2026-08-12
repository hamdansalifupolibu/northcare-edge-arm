export const SYNC_STATUSES = [
  'localOnly',
  'pendingCreate',
  'pendingUpdate',
  'pendingDelete',
  'syncing',
  'synced',
  'syncFailed',
  'conflict',
  'needsReview',
] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export function isSyncStatus(value: unknown): value is SyncStatus {
  return typeof value === 'string' && (SYNC_STATUSES as readonly string[]).includes(value);
}

export function assertSyncStatus(value: unknown): SyncStatus {
  if (!isSyncStatus(value)) {
    throw new Error('Invalid sync status');
  }
  return value;
}
