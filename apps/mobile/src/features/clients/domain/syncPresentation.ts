import type { SyncStatus } from '../../../data/domain/enums/syncStatus';

/**
 * Truthful offline status labels for client records.
 * Never invents "Synced" without an actual synced status.
 */
export type ClientSyncPresentation =
  | 'savedOnDevice'
  | 'waitingForConnection'
  | 'needsReview'
  | 'synced';

export function mapClientSyncPresentation(
  status: SyncStatus,
): ClientSyncPresentation {
  switch (status) {
    case 'synced':
      return 'synced';
    case 'needsReview':
    case 'conflict':
    case 'syncFailed':
      return 'needsReview';
    case 'pendingCreate':
    case 'pendingUpdate':
    case 'pendingDelete':
    case 'syncing':
      return 'waitingForConnection';
    case 'localOnly':
    default:
      return 'savedOnDevice';
  }
}
