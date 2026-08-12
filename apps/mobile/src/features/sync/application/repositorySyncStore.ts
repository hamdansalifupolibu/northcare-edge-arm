import type { SqliteDriver } from '../../../data/database/connection/SqliteDriver';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { IsoUtcTimestamp } from '../../../data/domain/value-objects/timestamps';
import { acknowledgeLocalEntity } from '../engine/entitySyncAck';
import { applyRemoteChange } from './entityApplicators';
import { getDeviceInstallationId } from './deviceInstallation';
import { normalizeSyncEntityType } from '../domain/entityTypeNormalize';
import { canonicalJson, canonicalJsonSha256 } from '../domain/hashing';
import type { PullChange } from '../domain/protocol';
import type { QueueRecord, SyncStore } from '../engine/syncEngine';

const FORBIDDEN_SYNC_KEYS = new Set([
  'password',
  'pin',
  'biometric',
  'biometrics',
  'fileUri',
  'file_uri',
  'rawQr',
  'raw_qr',
  'audio',
  'audioUri',
  'accessToken',
  'token',
]);

function sanitise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitise);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !FORBIDDEN_SYNC_KEYS.has(key))
        .map(([key, child]) => [key, sanitise(child)]),
    );
  }
  return value;
}

async function snapshotFor(
  repos: RepositoryContainer,
  entityType: string,
  entityId: EntityId,
): Promise<Readonly<Record<string, unknown>>> {
  const entity = await ({
    client: () => repos.clients.findById(entityId, { includeDeleted: true }),
    caregiver: () => repos.caregivers.findById(entityId, { includeDeleted: true }),
    encounter: () => repos.encounters.findById(entityId, { includeDeleted: true }),
    screening: () => repos.screenings.findById(entityId, { includeDeleted: true }),
    referral: () => repos.referrals.findById(entityId, { includeDeleted: true }),
    nutrition_assessment: () => repos.nutritionAssessments.findById(entityId),
    nutritionAssessment: () => repos.nutritionAssessments.findById(entityId),
  }[entityType] ?? (() => Promise.resolve(null)))();
  if (!entity) throw new Error(`Cannot build a sync snapshot for ${entityType}.`);
  return sanitise(entity) as Readonly<Record<string, unknown>>;
}

function parsePayload(payloadJson: string): Readonly<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(payloadJson);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Sync queue payload is invalid.');
  }
  return parsed as Readonly<Record<string, unknown>>;
}

/**
 * Foreground sync store. Pull changes use reviewed entity applicators; the engine
 * advances the cursor only after each apply succeeds.
 */
export function createRepositorySyncStore(
  repos: RepositoryContainer,
  scopeKey: string,
  db: SqliteDriver,
): SyncStore {
  return {
    deviceId: getDeviceInstallationId,
    async listReady() {
      const ready = await repos.syncQueue.listReady(
        new Date().toISOString() as IsoUtcTimestamp,
      );
      const result: QueueRecord[] = [];
      for (const item of ready) {
        if (!item.operationId) {
          throw new Error('Sync queue item is missing its operation id.');
        }
        const payload = item.payloadJson
          ? parsePayload(item.payloadJson)
          : await snapshotFor(repos, item.entityType, item.entityId);
        const payloadJson = item.payloadJson ?? canonicalJson(payload);
        const requestHash = item.requestHash ?? canonicalJsonSha256(payload);
        const occurredAt = item.occurredAt ?? item.createdAt;
        const clientLocalVersion = item.clientLocalVersion ?? 1;
        if (
          !item.payloadJson
          || !item.requestHash
          || !item.clientLocalVersion
          || !item.occurredAt
        ) {
          await repos.syncQueue.setProtocolPayload({
            id: item.id,
            payloadJson,
            requestHash,
            occurredAt,
            clientLocalVersion,
            baseServerVersion: item.baseServerVersion,
          });
        }
        result.push({
          id: item.id,
          operationId: item.operationId,
          entityType: normalizeSyncEntityType(item.entityType),
          entityId: item.entityId,
          operation: item.operation as QueueRecord['operation'],
          baseServerVersion: item.baseServerVersion,
          clientLocalVersion,
          payload,
          occurredAt,
          requestHash,
        });
      }
      return result;
    },
    async markAcknowledged(queueId, serverVersion) {
      const item = await repos.syncQueue.findById(queueId as EntityId);
      await repos.syncQueue.markCompleted(queueId as EntityId);
      if (item) {
        await acknowledgeLocalEntity(
          db,
          item.entityType,
          item.entityId,
          serverVersion,
          new Date().toISOString(),
        );
      }
    },
    async markConflict(queueId, conflictId) {
      const item = await repos.syncQueue.findById(queueId as EntityId);
      await repos.syncQueue.markConflict(queueId as EntityId);
      if (item) {
        await repos.syncConflicts.upsert({
          id: conflictId ?? item.id,
          serverConflictId: conflictId,
          entityType: item.entityType,
          entityId: item.entityId,
          localOperationId: item.operationId,
          localPayloadJson: item.payloadJson,
          conflictClass: 'versionedRecord',
          state: 'open',
          serverVersion: item.baseServerVersion,
        });
      }
    },
    markRejected: async (queueId, reason) => {
      await repos.syncQueue.markFailed(queueId as EntityId, reason ?? 'rejected');
    },
    async cursor() {
      return (await repos.syncState.get(scopeKey))?.pullCursor ?? null;
    },
    async applyChange(change: PullChange) {
      await applyRemoteChange({
        repos,
        db,
        change,
        now: new Date().toISOString() as IsoUtcTimestamp,
      });
    },
    saveCursor: async (cursor) => {
      await repos.syncState.upsert({ scopeKey, pullCursor: cursor });
    },
    recordFailure: async (category) => {
      await repos.syncState.upsert({ scopeKey, lastSyncErrorCategory: category });
    },
    recordSuccess: async () => {
      await repos.syncState.upsert({
        scopeKey,
        lastSyncAt: new Date().toISOString() as IsoUtcTimestamp,
        lastSyncErrorCategory: null,
      });
    },
  };
}
