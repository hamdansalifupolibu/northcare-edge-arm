import { FieldValue } from 'firebase-admin/firestore';

import { getDb } from './db';
import { assertAdministratorRole } from './roles';
import { DEMO_ACCOUNTS, type AuthenticatedContext } from './types';

const DEMO_FACILITIES = [
  {
    facilityId: 'fac-dev-001',
    name: 'Demo CHPS Compound',
    facilityType: 'CHPS',
    district: 'Northern Region (synthetic)',
    region: 'Northern',
    isActive: true,
  },
  {
    facilityId: 'fac-dev-hq',
    name: 'Demo District Health Office',
    facilityType: 'District office',
    district: 'Northern Region (synthetic)',
    region: 'Northern',
    isActive: true,
  },
] as const;

export type SyncedRecordItem = {
  readonly facilityId: string;
  readonly facilityName: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly serverVersion: number;
  readonly payload: Record<string, unknown> | null;
  readonly updatedAt: string;
  readonly syncedByAccountId: string | null;
};

function entityCollectionPath(organisationId: string, facilityId: string): string {
  return `organisations/${organisationId}/facilities/${facilityId}/synced_entities`;
}

export function getSessionAuthorisation(account: AuthenticatedContext) {
  assertAdministratorRole(account);
  return {
    accountId: account.accountId,
    displayName: account.displayName,
    email: account.email || null,
    roles: [...account.roles],
    permittedWorkspaces: [...account.permittedWorkspaces],
    accountStatus: account.accountStatus,
    organisationId: account.organisationId,
    workerFacilityId: account.roles.includes('worker') ? account.facilityId : null,
    firstLoginRequired: account.firstLoginRequired,
    accountVersion: account.accountVersion,
    identityProvider: 'development',
  };
}

export async function getAdminHome(account: AuthenticatedContext) {
  assertAdministratorRole(account);
  const workers = DEMO_ACCOUNTS.filter(
    (demo) =>
      demo.organisationId === account.organisationId &&
      demo.roles.includes('worker') &&
      demo.accountStatus === 'active',
  );
  const syncedRecordCount = await countSyncedRecords(account.organisationId);
  return {
    organisationId: account.organisationId,
    workerCount: workers.length,
    pendingFirstLoginCount: 0,
    inactiveWorkerCount: 0,
    backendAvailable: true,
    syncedRecordCount,
  };
}

export async function listFacilities(account: AuthenticatedContext) {
  assertAdministratorRole(account);
  return {
    items: DEMO_FACILITIES.filter(() => account.organisationId === 'org-dev-001').map(
      (facility) => ({ ...facility }),
    ),
  };
}

export async function listAccounts(account: AuthenticatedContext, page = 1, pageSize = 20) {
  assertAdministratorRole(account);
  const items = DEMO_ACCOUNTS.filter((demo) => demo.organisationId === account.organisationId).map(
    (demo) => ({
      accountId: demo.accountId,
      displayName: demo.displayName,
      email: demo.email,
      roles: [...demo.roles],
      facilityId: demo.facilityId,
      facilityName:
        DEMO_FACILITIES.find((facility) => facility.facilityId === demo.facilityId)?.name ??
        demo.facilityId,
      accountStatus: demo.accountStatus,
      firstLoginRequired: demo.firstLoginRequired,
      lastRemoteSignInAt: null,
      registeredDeviceCount: 0,
      accountVersion: demo.accountVersion,
      updatedAt: new Date().toISOString(),
    }),
  );
  return {
    items,
    page,
    pageSize,
    total: items.length,
    organisationId: account.organisationId,
  };
}

async function resolveFacilityIds(
  organisationId: string,
  facilityId?: string,
): Promise<readonly string[]> {
  if (facilityId) {
    return [facilityId];
  }
  const db = getDb();
  const snapshot = await db.collection(`organisations/${organisationId}/facilities`).get();
  const discovered = snapshot.docs.map((doc) => doc.id);
  if (discovered.length > 0) {
    return discovered;
  }
  return DEMO_FACILITIES.map((facility) => facility.facilityId);
}

async function countSyncedRecords(organisationId: string): Promise<number> {
  const records = await listSyncedRecords(
    {
      accountId: 'counter',
      remoteSubject: 'counter',
      email: '',
      displayName: '',
      role: 'administrator',
      roles: ['administrator'],
      permittedWorkspaces: ['administration'],
      facilityId: 'fac-dev-hq',
      organisationId,
      accountStatus: 'active',
      firstLoginRequired: false,
      accountVersion: 1,
      tokenIssuedAt: 0,
    },
    { limit: 500 },
  );
  return records.length;
}

export async function listSyncedRecords(
  account: AuthenticatedContext,
  options: {
    readonly facilityId?: string;
    readonly entityType?: string;
    readonly limit?: number;
  } = {},
): Promise<readonly SyncedRecordItem[]> {
  assertAdministratorRole(account);
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 500);
  const db = getDb();
  const facilityIds = await resolveFacilityIds(account.organisationId, options.facilityId);
  const entityTypeFilter = options.entityType;
  const results: SyncedRecordItem[] = [];

  for (const facilityId of facilityIds) {
    const facilityName =
      DEMO_FACILITIES.find((facility) => facility.facilityId === facilityId)?.name ?? facilityId;
    const snapshot = await db
      .collection(entityCollectionPath(account.organisationId, facilityId))
      .limit(limit)
      .get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.deleted === true) {
        continue;
      }
      const entityType = String(data.entityType ?? doc.id.split('__')[0] ?? 'unknown');
      if (entityTypeFilter && entityType !== entityTypeFilter) {
        continue;
      }
      results.push({
        facilityId,
        facilityName,
        entityType,
        entityId: String(data.entityId ?? doc.id.split('__').slice(1).join('__')),
        serverVersion: typeof data.serverVersion === 'number' ? data.serverVersion : 1,
        payload:
          data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload)
            ? (data.payload as Record<string, unknown>)
            : null,
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
        syncedByAccountId:
          typeof data.syncedByAccountId === 'string' ? data.syncedByAccountId : null,
      });
      if (results.length >= limit) {
        return results;
      }
    }
  }

  return results;
}

export async function touchAdminReadAudit(
  account: AuthenticatedContext,
  recordCount: number,
): Promise<void> {
  const db = getDb();
  await db.collection(`organisations/${account.organisationId}/admin_audit`).add({
    eventType: 'syncedRecordsViewed',
    actorAccountId: account.accountId,
    recordCount,
    createdAt: FieldValue.serverTimestamp(),
  });
}
