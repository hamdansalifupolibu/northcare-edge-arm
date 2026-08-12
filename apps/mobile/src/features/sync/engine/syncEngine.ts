import type { SyncTransport } from '../transport/syncTransport';
import type { PullChange, SyncOperation } from '../domain/protocol';
import { categoriseSyncError } from '../domain/syncStatus';

export type QueueRecord = {
  readonly id: string;
  readonly operationId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly operation: 'create' | 'update' | 'delete';
  readonly baseServerVersion: number | null;
  readonly clientLocalVersion: number;
  readonly payload: Readonly<Record<string, unknown>> | null;
  readonly occurredAt: string;
  readonly requestHash: string;
};

export type SyncStore = {
  deviceId(): Promise<string>;
  listReady(): Promise<readonly QueueRecord[]>;
  markAcknowledged(queueId: string, serverVersion: number | null): Promise<void>;
  markConflict(queueId: string, conflictId: string | null): Promise<void>;
  markRejected(queueId: string, reason: string | null): Promise<void>;
  cursor(): Promise<string | null>;
  applyChange(change: PullChange): Promise<void>;
  saveCursor(cursor: string | null): Promise<void>;
  recordFailure(category: string): Promise<void>;
  recordSuccess(): Promise<void>;
};

export type SyncRunResult = { readonly pushed: number; readonly pulled: number; readonly conflicts: number };

/** A single-flight foreground orchestrator. No acknowledgement/cursor is persisted early. */
export function createSyncEngine(transport: SyncTransport, store: SyncStore) {
  let running: Promise<SyncRunResult> | null = null;

  const execute = async (): Promise<SyncRunResult> => {
    try {
      const deviceId = await store.deviceId();
      await transport.registerDevice(deviceId);
      let pushed = 0;
      let conflicts = 0;
      const records = await store.listReady();
      if (records.length) {
        const operations: SyncOperation[] = records.map((record) => ({
          operationId: record.operationId, entityType: record.entityType, entityId: record.entityId,
          operation: record.operation, baseServerVersion: record.baseServerVersion,
          clientLocalVersion: record.clientLocalVersion, payload: record.payload,
          occurredAt: record.occurredAt, requestHash: record.requestHash,
        }));
        const results = await transport.push(deviceId, operations);
        for (const result of results) {
          const record = records.find((entry) => entry.operationId === result.operationId);
          if (!record) continue;
          if (result.status === 'acked' || result.status === 'duplicate') {
            await store.markAcknowledged(record.id, result.serverVersion ?? null);
            pushed += 1;
          } else if (result.status === 'conflict') {
            await store.markConflict(record.id, result.conflictId ?? null);
            conflicts += 1;
          } else {
            await store.markRejected(record.id, result.reason ?? null);
          }
        }
      }

      let pulled = 0;
      let cursor = await store.cursor();
      do {
        const page = await transport.pull(cursor);
        for (const change of page.changes) {
          // Local application completes before the cursor is written.
          await store.applyChange(change);
          pulled += 1;
        }
        cursor = page.nextCursor;
        await store.saveCursor(cursor);
        if (!page.hasMore) break;
      } while (true);
      await store.recordSuccess();
      return { pushed, pulled, conflicts };
    } catch (error) {
      await store.recordFailure(categoriseSyncError(error));
      throw error;
    }
  };

  return {
    syncNow: (): Promise<SyncRunResult> => {
      if (!running) running = execute().finally(() => { running = null; });
      return running;
    },
  };
}
