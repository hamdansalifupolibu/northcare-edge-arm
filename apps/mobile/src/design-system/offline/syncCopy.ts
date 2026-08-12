/**
 * Approved presentation wording for offline / sync UI.
 * Components receive status via props — no network detection in Stage 3.
 */
export type SyncPresentationStatus =
  | 'online'
  | 'offline'
  | 'savedLocally'
  | 'waitingForConnection'
  | 'syncing'
  | 'synced'
  | 'syncFailed'
  | 'needsReview';

export const SYNC_COPY: Record<SyncPresentationStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  savedLocally: 'Saved on this device',
  waitingForConnection: 'Waiting for connection',
  syncing: 'Syncing securely',
  synced: 'Synced',
  syncFailed: 'Sync could not be completed',
  needsReview: 'Needs review',
};
