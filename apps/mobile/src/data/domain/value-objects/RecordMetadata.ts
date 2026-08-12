import type { EntityId } from './EntityId';
import type { IsoUtcTimestamp } from './timestamps';
import type { SyncStatus } from '../enums/syncStatus';

/**
 * Standard metadata for persisted clinical / operational entities.
 */
export type RecordMetadata = {
  readonly id: EntityId;
  readonly createdAt: IsoUtcTimestamp;
  readonly updatedAt: IsoUtcTimestamp;
  readonly createdByAccountId: EntityId | null;
  readonly updatedByAccountId: EntityId | null;
  readonly localVersion: number;
  readonly serverVersion: number | null;
  readonly syncStatus: SyncStatus;
  readonly lastSyncedAt: IsoUtcTimestamp | null;
  readonly deletedAt: IsoUtcTimestamp | null;
  readonly isDeleted: boolean;
};

export type SoftDeleteOptions = {
  readonly includeDeleted?: boolean;
};
