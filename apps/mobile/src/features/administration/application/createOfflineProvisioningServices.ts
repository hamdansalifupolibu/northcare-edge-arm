import type { AdminProvisioningRepository } from '../../../data/repositories/sqlite/sqliteAdminProvisioningRepository';
import type {
  AccountSearchQuery,
  AdminAccountListPage,
  AdminAccountSummary,
  AdminFacility,
  ProfessionRegistryItem,
} from '../domain/types';
import {
  OFFLINE_ADMIN_FACILITIES,
  OFFLINE_ADMIN_PROFESSIONS,
  OFFLINE_DEMO_ORGANISATION_ID,
} from '../config/offlineRegistrationCatalog';
import type { SignedActivationClaimsV1 } from '../security/signedActivationClaims';
import {
  issueOfflineActivationPass,
  verifyWorkerActivationUri,
  type OfflineActivationVerifyResult,
} from '../security/signedActivationCrypto';

export type OfflineRegisterWorkerInput = {
  readonly enrollmentId: string;
  readonly displayName: string;
  readonly email: string;
  readonly facilityId: string;
  readonly facilityName: string;
  readonly profession: string;
  readonly professionLabel: string;
  readonly otherProfessionDescription: string | null;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
  readonly adminAccountId: string;
  readonly adminDisplayName: string;
  readonly organisationId?: string;
};

export type OfflineRegisterWorkerResult = {
  readonly enrollmentId: string;
  readonly activationUri: string;
  readonly claims: SignedActivationClaimsV1;
  readonly expiresAt: string;
};

const FACILITIES_CACHE_KEY = 'admin_facilities';
const PROFESSIONS_CACHE_KEY = 'admin_professions';

function mapOutboxRowToAccountSummary(
  row: Awaited<ReturnType<AdminProvisioningRepository['listOutbox']>>[number],
): AdminAccountSummary {
  return {
    accountId: row.enrollmentId,
    displayName: row.payload.displayName,
    email: row.payload.email,
    roles: ['worker'],
    facilityId: row.payload.facilityId,
    facilityName: row.payload.facilityName,
    accountStatus: 'pendingFirstLogin',
    firstLoginRequired: true,
    lastRemoteSignInAt: null,
    registeredDeviceCount: 0,
    accountVersion: 1,
    updatedAt: row.updatedAt,
  };
}

function pageLocalAccounts(
  items: readonly AdminAccountSummary[],
  query: AccountSearchQuery,
  organisationId: string,
): AdminAccountListPage {
  const pageSize = query.pageSize ?? 20;
  const page = query.page ?? 1;
  const search = query.search?.trim().toLowerCase();
  const filtered = search
    ? items.filter(
        (item) =>
          item.displayName.toLowerCase().includes(search) ||
          (item.email?.toLowerCase().includes(search) ?? false),
      )
    : items;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    organisationId,
  };
}

export type OfflineProvisioningServices = {
  listFacilities(): Promise<readonly AdminFacility[]>;
  listProfessions(): Promise<readonly ProfessionRegistryItem[]>;
  listProvisionedAccounts(query: AccountSearchQuery): Promise<AdminAccountListPage>;
  cacheReferenceData(input: {
    readonly facilities: readonly AdminFacility[];
    readonly professions: readonly ProfessionRegistryItem[];
  }): Promise<void>;
  registerWorkerOffline(input: OfflineRegisterWorkerInput): Promise<OfflineRegisterWorkerResult>;
  verifyActivationQr(raw: string, nowMs?: number): Promise<OfflineActivationVerifyResult>;
  acceptVerifiedActivation(claims: SignedActivationClaimsV1): Promise<void>;
  markActivationNonceConsumed(nonce: string): Promise<void>;
  getActivationUri(enrollmentId: string): Promise<string | null>;
};

export function createOfflineProvisioningServices(
  repo: AdminProvisioningRepository,
): OfflineProvisioningServices {
  return {
    async listFacilities() {
      const cached = await repo.loadReferenceCache(FACILITIES_CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as AdminFacility[];
        } catch {
          // fall through
        }
      }
      return OFFLINE_ADMIN_FACILITIES;
    },

    async listProfessions() {
      const cached = await repo.loadReferenceCache(PROFESSIONS_CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as ProfessionRegistryItem[];
        } catch {
          // fall through
        }
      }
      return OFFLINE_ADMIN_PROFESSIONS;
    },

    async listProvisionedAccounts(query) {
      const rows = await repo.listOutbox();
      const summaries = rows
        .map(mapOutboxRowToAccountSummary)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return pageLocalAccounts(summaries, query, OFFLINE_DEMO_ORGANISATION_ID);
    },

    async cacheReferenceData({ facilities, professions }) {
      const now = new Date().toISOString();
      await repo.saveReferenceCache(FACILITIES_CACHE_KEY, JSON.stringify(facilities), now);
      await repo.saveReferenceCache(PROFESSIONS_CACHE_KEY, JSON.stringify(professions), now);
    },

    async registerWorkerOffline(input) {
      const organisationId = input.organisationId ?? OFFLINE_DEMO_ORGANISATION_ID;
      const { uri, claims, nonce } = issueOfflineActivationPass({
        enrollmentId: input.enrollmentId,
        displayName: input.displayName,
        email: input.email,
        professionCode: input.profession,
        professionLabel: input.professionLabel,
        otherProfessionDescription: input.otherProfessionDescription,
        facilityId: input.facilityId,
        facilityName: input.facilityName,
        organisationId,
        communityRequestsEnabled: input.communityRequestsEnabled,
        emergencyRequestsEnabled: input.emergencyRequestsEnabled,
        adminAccountId: input.adminAccountId,
        adminDisplayName: input.adminDisplayName,
      });

      const now = new Date().toISOString();
      await repo.saveOutbox({
        enrollmentId: input.enrollmentId,
        payload: {
          displayName: input.displayName,
          email: input.email,
          facilityId: input.facilityId,
          facilityName: input.facilityName,
          profession: input.profession,
          professionLabel: input.professionLabel,
          otherProfessionDescription: input.otherProfessionDescription,
          communityRequestsEnabled: input.communityRequestsEnabled,
          emergencyRequestsEnabled: input.emergencyRequestsEnabled,
          organisationId,
          adminAccountId: input.adminAccountId,
          adminDisplayName: input.adminDisplayName,
        },
        activationNonce: nonce,
        activationUri: uri,
        status: 'saved_on_device',
        createdAt: now,
        updatedAt: now,
      });

      return {
        enrollmentId: input.enrollmentId,
        activationUri: uri,
        claims,
        expiresAt: claims.expiresAt,
      };
    },

    async verifyActivationQr(raw, nowMs) {
      const result = verifyWorkerActivationUri(raw, { nowMs });
      if (!result.ok) {
        return result;
      }
      if (await repo.isNonceConsumed(result.claims.nonce)) {
        return {
          ok: false,
          reason: 'nonceConsumed',
          message: 'This activation code has already been used.',
        };
      }
      return result;
    },

    async acceptVerifiedActivation(claims) {
      const now = new Date().toISOString();
      await repo.savePendingActivation({
        enrollmentId: claims.enrollmentId,
        claims,
        email: claims.email,
        status: 'pending_credentials',
        createdAt: now,
        updatedAt: now,
      });
    },

    async markActivationNonceConsumed(nonce) {
      await repo.consumeNonce(nonce, new Date().toISOString());
    },

    async getActivationUri(enrollmentId) {
      const row = await repo.getOutbox(enrollmentId);
      return row?.activationUri ?? null;
    },
  };
}
