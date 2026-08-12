import type { SyncStatus } from '../../domain/enums/syncStatus';
import { assertSyncStatus } from '../../domain/enums/syncStatus';
import type { EntityId } from '../../domain/value-objects/EntityId';
import { assertEntityId, isEntityId } from '../../domain/value-objects/EntityId';
import type { RecordMetadata } from '../../domain/value-objects/RecordMetadata';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import { assertIsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import { RepositoryError } from '../errors/RepositoryError';

export type MetadataRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_account_id: string | null;
  updated_by_account_id: string | null;
  local_version: number;
  server_version: number | null;
  sync_status: string;
  last_synced_at: string | null;
  deleted_at: string | null;
  is_deleted: number;
};

/**
 * Accept UUID entity ids; coerce opaque auth/session ids (e.g. dev-dual-…) and
 * non-UUID facility codes to null so read-back never asserts on them.
 */
export function optionalEntityId(value: string | null | undefined): EntityId | null {
  if (!value) return null;
  return isEntityId(value) ? value : null;
}

export function mapMetadata(row: MetadataRow): RecordMetadata {
  try {
    return {
      id: assertEntityId(row.id),
      createdAt: assertIsoUtcTimestamp(row.created_at, 'created_at'),
      updatedAt: assertIsoUtcTimestamp(row.updated_at, 'updated_at'),
      createdByAccountId: optionalEntityId(row.created_by_account_id),
      updatedByAccountId: optionalEntityId(row.updated_by_account_id),
      localVersion: row.local_version,
      serverVersion: row.server_version,
      syncStatus: assertSyncStatus(row.sync_status),
      lastSyncedAt: row.last_synced_at
        ? assertIsoUtcTimestamp(row.last_synced_at, 'last_synced_at')
        : null,
      deletedAt: row.deleted_at
        ? assertIsoUtcTimestamp(row.deleted_at, 'deleted_at')
        : null,
      isDeleted: row.is_deleted === 1,
    };
  } catch (error) {
    throw new RepositoryError('dataIntegrity', 'Invalid persisted metadata', {
      tableHint: 'metadata',
      causeCategory: error instanceof Error ? error.message.slice(0, 80) : 'unknown',
    });
  }
}

export function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

export function intToBool(value: number | null | undefined): boolean {
  return value === 1;
}

export type NewMetadataInput = {
  readonly id: EntityId;
  readonly now: IsoUtcTimestamp;
  readonly accountId?: EntityId | null;
  readonly syncStatus?: SyncStatus;
};

export function newMetadataValues(input: NewMetadataInput) {
  const accountId =
    input.accountId && isEntityId(input.accountId) ? input.accountId : null;
  return {
    id: input.id,
    created_at: input.now,
    updated_at: input.now,
    created_by_account_id: accountId,
    updated_by_account_id: accountId,
    local_version: 1,
    server_version: null as number | null,
    sync_status: input.syncStatus ?? 'localOnly',
    last_synced_at: null as string | null,
    deleted_at: null as string | null,
    is_deleted: 0,
  };
}
