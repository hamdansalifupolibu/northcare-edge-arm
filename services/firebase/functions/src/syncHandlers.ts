import { FieldValue } from 'firebase-admin/firestore';

import { getDb } from './db';
import type { AuthenticatedContext, DemoAccount, PushOperationInput, PushResultOutput } from './types';

const SYNC_PROTOCOL_VERSION = 1;

function entityDocumentPath(
  organisationId: string,
  facilityId: string,
  entityType: string,
  entityId: string,
): string {
  return [
    'organisations',
    organisationId,
    'facilities',
    facilityId,
    'synced_entities',
    `${entityType}__${entityId}`,
  ].join('/');
}

function operationDocPath(operationId: string): string {
  return `sync_operations/${operationId}`;
}

function deviceDocPath(deviceId: string): string {
  return `devices/${deviceId}`;
}

export async function registerDevice(
  account: AuthenticatedContext,
  deviceId: string,
  userAgent: string | undefined,
): Promise<void> {
  const db = getDb();
  await db.doc(deviceDocPath(deviceId)).set(
    {
      deviceId,
      accountId: account.accountId,
      facilityId: account.facilityId,
      organisationId: account.organisationId,
      userAgent: userAgent ?? null,
      registeredAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

async function isDeviceRegistered(deviceId: string, accountId: string): Promise<boolean> {
  const snapshot = await getDb().doc(deviceDocPath(deviceId)).get();
  if (!snapshot.exists) return false;
  const data = snapshot.data();
  return data?.accountId === accountId;
}

export async function pushOperations(
  account: AuthenticatedContext,
  deviceId: string,
  operations: readonly PushOperationInput[],
): Promise<{ protocolVersion: number; results: PushResultOutput[] }> {
  if (!(await isDeviceRegistered(deviceId, account.accountId))) {
    throw new Error('DEVICE_NOT_REGISTERED');
  }

  const db = getDb();
  const results: PushResultOutput[] = [];

  for (const operation of operations) {
    const existingOp = await db.doc(operationDocPath(operation.operationId)).get();
    if (existingOp.exists) {
      const prior = existingOp.data();
      results.push({
        operationId: operation.operationId,
        status: 'duplicate',
        serverVersion:
          typeof prior?.serverVersion === 'number' ? prior.serverVersion : null,
      });
      continue;
    }

    const entityRef = db.doc(
      entityDocumentPath(
        account.organisationId,
        account.facilityId,
        operation.entityType,
        operation.entityId,
      ),
    );
    const entitySnapshot = await entityRef.get();
    const currentVersion =
      entitySnapshot.exists && typeof entitySnapshot.data()?.serverVersion === 'number'
        ? (entitySnapshot.data()?.serverVersion as number)
        : null;

    if (
      operation.operation !== 'create' &&
      currentVersion !== null &&
      operation.baseServerVersion !== null &&
      operation.baseServerVersion !== currentVersion
    ) {
      results.push({
        operationId: operation.operationId,
        status: 'conflict',
        serverVersion: currentVersion,
        conflictId: `conflict-${operation.entityType}-${operation.entityId}`,
      });
      continue;
    }

    const nextVersion = (currentVersion ?? 0) + 1;
    const deleted = operation.operation === 'delete';
    const payload = deleted ? null : operation.payload;

    await entityRef.set(
      {
        entityType: operation.entityType,
        entityId: operation.entityId,
        serverVersion: nextVersion,
        payload,
        deleted,
        lastOperationId: operation.operationId,
        lastDeviceId: deviceId,
        syncedByAccountId: account.accountId,
        updatedAt: operation.occurredAt,
        syncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await db.doc(operationDocPath(operation.operationId)).set({
      operationId: operation.operationId,
      status: 'acked',
      serverVersion: nextVersion,
      entityType: operation.entityType,
      entityId: operation.entityId,
      accountId: account.accountId,
      deviceId,
      requestHash: operation.requestHash,
      processedAt: FieldValue.serverTimestamp(),
    });

    results.push({
      operationId: operation.operationId,
      status: 'acked',
      serverVersion: nextVersion,
    });
  }

  return { protocolVersion: SYNC_PROTOCOL_VERSION, results };
}

export async function pullChanges(): Promise<{
  protocolVersion: number;
  changes: [];
  nextCursor: null;
  hasMore: false;
}> {
  return {
    protocolVersion: SYNC_PROTOCOL_VERSION,
    changes: [],
    nextCursor: null,
    hasMore: false,
  };
}

export async function seedOrganisationMetadata(
  account: DemoAccount | AuthenticatedContext,
): Promise<void> {
  const db = getDb();
  const orgRef = db.doc(`organisations/${account.organisationId}`);
  const facilityRef = db.doc(
    `organisations/${account.organisationId}/facilities/${account.facilityId}`,
  );
  await orgRef.set(
    {
      organisationId: account.organisationId,
      name: 'NorthCare Demo Organisation',
      seededForDemo: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await facilityRef.set(
    {
      facilityId: account.facilityId,
      organisationId: account.organisationId,
      name: account.facilityId === 'fac-dev-hq' ? 'Demo District Health Office' : 'Demo CHPS Compound',
      seededForDemo: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
