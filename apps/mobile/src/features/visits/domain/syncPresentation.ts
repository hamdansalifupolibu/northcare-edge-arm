import type { SyncStatus } from '../../../data/domain/enums/syncStatus';

export type VisitSyncPresentation =
  | 'savedOnDevice'
  | 'waitingForConnection'
  | 'needsReview'
  | 'synced';

/** Never invent "Synced" unless record syncStatus is actually synced. */
export function mapVisitSyncPresentation(status: SyncStatus): VisitSyncPresentation {
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
