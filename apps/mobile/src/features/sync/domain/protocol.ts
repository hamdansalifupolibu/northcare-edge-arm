export const SYNC_PROTOCOL_VERSION = 1 as const;

export type SyncOperation = {
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

export type PushResult = {
  readonly operationId: string;
  readonly status: 'acked' | 'duplicate' | 'conflict' | 'rejected';
  readonly serverVersion?: number | null;
  readonly conflictId?: string | null;
  readonly reason?: string | null;
};

export type PullChange = {
  readonly changeId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly operation: 'upsert' | 'delete';
  readonly serverVersion: number;
  readonly payload: Readonly<Record<string, unknown>> | null;
  readonly deleted: boolean;
  readonly changedAt: string;
};

export type SyncConflict = {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly conflictClass: string;
  readonly state: 'open' | 'resolved' | 'keptForReview';
  readonly serverVersion: number | null;
};
