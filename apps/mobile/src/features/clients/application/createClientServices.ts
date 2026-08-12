import type { ClientCategory } from '../../../data/domain/enums/clientCategory';
import type { ConsentStatus, RelationshipType } from '../../../data/domain/enums/domainEnums';
import type { AgeUnit } from '../../../data/domain/enums/ageUnit';
import type {
  AuditEvent,
  Caregiver,
  Client,
  ClientRelationship,
  Facility,
  SyncQueueItem,
} from '../../../data/domain/entities/entities';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import { isEntityId } from '../../../data/domain/value-objects/EntityId';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import { isRepositoryError, RepositoryError } from '../../../data/repositories/errors/RepositoryError';
import {
  findDuplicateCandidates,
  type DuplicateCandidate,
} from '../domain/duplicateDetection';
import { provisionalClientCodeFromId } from '../domain/clientReferenceCode';
import { type RegisterClientDraft, validateRegisterDraft } from './validation';

export type EnsureAssignedFacilityInput = {
  readonly facilityId: string;
  readonly name?: string | null;
  readonly facilityType?: string | null;
  readonly district?: string | null;
  readonly region?: string | null;
};

export type TransactionRunner = {
  withTransaction(task: () => Promise<void>): Promise<void>;
};

export type RegisterClientResult = {
  readonly client: Client;
  readonly caregiver: Caregiver | null;
  readonly relationship: ClientRelationship | null;
  readonly auditEvent: AuditEvent;
  readonly syncItem: SyncQueueItem;
};

export type ClientProfile = {
  readonly client: Client;
  readonly facility: Facility | null;
  readonly caregivers: readonly {
    readonly caregiver: Caregiver;
    readonly relationship: ClientRelationship;
  }[];
  readonly history: readonly AuditEvent[];
};

export type ClientServices = {
  searchClients(input: {
    readonly query?: string;
    readonly category?: ClientCategory | null;
    readonly facilityId?: string | null;
    readonly includeDeleted?: boolean;
  }): Promise<Client[]>;
  getClientProfile(clientId: EntityId): Promise<ClientProfile | null>;
  checkPossibleDuplicates(draft: RegisterClientDraft): Promise<DuplicateCandidate[]>;
  /** Resolve auth/session facility ids (e.g. fac-dev-001) to a local EntityId facility row. */
  ensureAssignedFacility(input: EnsureAssignedFacilityInput): Promise<Facility>;
  registerClient(input: {
    readonly draft: RegisterClientDraft;
    readonly accountId: string;
  }): Promise<RegisterClientResult>;
  updateClient(input: {
    readonly id: EntityId;
    readonly expectedLocalVersion: number;
    readonly accountId: EntityId;
    readonly givenName?: string;
    readonly familyName?: string;
    readonly preferredName?: string | null;
    readonly community?: string | null;
    readonly district?: string | null;
    readonly region?: string | null;
    readonly phoneNumber?: string | null;
    readonly pregnancyStatus?: string | null;
    readonly estimatedDeliveryDate?: string | null;
    readonly consentStatus?: ConsentStatus;
    readonly notes?: string | null;
    readonly sex?: string | null;
    readonly dateOfBirth?: string | null;
    readonly approximateAge?: number | null;
    readonly approximateAgeUnit?: AgeUnit | null;
  }): Promise<Client>;
  archiveClient(input: {
    readonly id: EntityId;
    readonly accountId: EntityId;
  }): Promise<Client>;
  countClients(facilityId?: string | null): Promise<number>;
  countPendingSync(): Promise<number>;
};

type ClientUpdateFieldSnapshot = {
  readonly givenName?: string;
  readonly familyName?: string;
  readonly preferredName?: string | null;
  readonly community?: string | null;
  readonly district?: string | null;
  readonly region?: string | null;
  readonly phoneNumber?: string | null;
  readonly pregnancyStatus?: string | null;
  readonly estimatedDeliveryDate?: string | null;
  readonly consentStatus?: ConsentStatus;
  readonly notes?: string | null;
  readonly sex?: string | null;
  readonly dateOfBirth?: string | null;
  readonly approximateAge?: number | null;
  readonly approximateAgeUnit?: AgeUnit | null;
};

function normaliseComparable(value: unknown): string {
  if (value == null) {
    return '';
  }
  return String(value);
}

/** Field-name summary only — never includes PHI values in audit metadata. */
export function summariseClientUpdateFields(
  before: Client,
  patch: ClientUpdateFieldSnapshot,
): string[] {
  const changed: string[] = [];
  const candidates: Array<keyof ClientUpdateFieldSnapshot> = [
    'givenName',
    'familyName',
    'preferredName',
    'community',
    'district',
    'region',
    'phoneNumber',
    'pregnancyStatus',
    'estimatedDeliveryDate',
    'consentStatus',
    'notes',
    'sex',
    'dateOfBirth',
    'approximateAge',
    'approximateAgeUnit',
  ];
  for (const field of candidates) {
    if (patch[field] === undefined) {
      continue;
    }
    if (normaliseComparable(before[field]) !== normaliseComparable(patch[field])) {
      changed.push(field);
    }
  }
  return changed;
}

export function createClientServices(
  repos: RepositoryContainer,
  tx: TransactionRunner,
  ids: IdGenerator = getIdGenerator(),
): ClientServices {
  async function resolveFacilityFilter(
    facilityId: string | null | undefined,
  ): Promise<EntityId | null | undefined> {
    if (facilityId == null) {
      return facilityId;
    }
    const trimmed = facilityId.trim();
    if (!trimmed) {
      return null;
    }
    if (isEntityId(trimmed)) {
      return trimmed;
    }
    const byCode = await repos.facilities.findByExternalCode(trimmed);
    return byCode?.id ?? trimmed;
  }

  async function ensureAssignedFacility(
    input: EnsureAssignedFacilityInput,
  ): Promise<Facility> {
    const facilityId = input.facilityId.trim();
    if (!facilityId) {
      throw new RepositoryError('validation', 'Facility assignment is required', {
        fieldHint: 'primaryFacilityId',
      });
    }

    if (isEntityId(facilityId)) {
      const existing = await repos.facilities.findById(facilityId);
      if (existing) {
        return existing;
      }
      return repos.facilities.create({
        id: facilityId,
        name: input.name?.trim() || 'Assigned facility',
        externalCode: facilityId,
        facilityType: input.facilityType ?? null,
        district: input.district ?? null,
        region: input.region ?? null,
        isActive: true,
      });
    }

    const byCode = await repos.facilities.findByExternalCode(facilityId);
    if (byCode) {
      return byCode;
    }

    return repos.facilities.create({
      name: input.name?.trim() || facilityId,
      externalCode: facilityId,
      facilityType: input.facilityType ?? null,
      district: input.district ?? null,
      region: input.region ?? null,
      isActive: true,
    });
  }

  /** Local entity writes require UUID actor ids; opaque auth ids are stored as null. */
  function actorEntityId(accountId: string | null | undefined): EntityId | null {
    return accountId && isEntityId(accountId) ? accountId : null;
  }

  return {
    async searchClients(input) {
      const facilityId = await resolveFacilityFilter(input.facilityId);
      return repos.clients.list({
        query: input.query,
        category: input.category,
        facilityId,
        includeDeleted: input.includeDeleted,
      });
    },

    async getClientProfile(clientId) {
      const client = await repos.clients.findById(clientId, { includeDeleted: true });
      if (!client) {
        return null;
      }
      const facility = client.primaryFacilityId
        ? await repos.facilities.findById(client.primaryFacilityId)
        : null;
      const relationships = await repos.caregivers.listRelationshipsForClient(clientId, {
        includeDeleted: true,
      });
      const caregivers = [];
      for (const relationship of relationships) {
        const caregiver = await repos.caregivers.findById(relationship.caregiverId, {
          includeDeleted: true,
        });
        if (caregiver) {
          caregivers.push({ caregiver, relationship });
        }
      }
      const history = await repos.auditEvents.listForEntity('client', clientId);
      return { client, facility, caregivers, history };
    },

    async checkPossibleDuplicates(draft) {
      const existing = await repos.clients.list({});
      return findDuplicateCandidates(existing, {
        givenName: draft.givenName,
        familyName: draft.familyName,
        dateOfBirth: draft.ageMode === 'dateOfBirth' ? draft.dateOfBirth : null,
        approximateAge:
          draft.ageMode === 'approximateAge' ? Number(draft.approximateAge) : null,
        approximateAgeUnit:
          draft.ageMode === 'approximateAge' ? draft.approximateAgeUnit : null,
        phoneNumber: draft.phoneNotAvailable ? null : draft.phoneNumber,
        community: draft.community,
      });
    },

    ensureAssignedFacility,

    async registerClient({ draft, accountId }) {
      let workingDraft = draft;
      if (draft.primaryFacilityId?.trim()) {
        const facility = await ensureAssignedFacility({
          facilityId: draft.primaryFacilityId,
          name: null,
          district: draft.district.trim() || null,
          region: draft.region.trim() || null,
        });
        workingDraft = { ...draft, primaryFacilityId: facility.id };
      }

      const errors = validateRegisterDraft(workingDraft);
      if (errors.length > 0) {
        throw new RepositoryError('validation', 'Registration validation failed', {
          fieldHint: errors[0]?.field ?? 'form',
        });
      }
      if (
        !workingDraft.category ||
        !workingDraft.consentStatus ||
        !workingDraft.primaryFacilityId ||
        !isEntityId(workingDraft.primaryFacilityId)
      ) {
        throw new RepositoryError('validation', 'Registration incomplete');
      }

      const duplicates = await this.checkPossibleDuplicates(workingDraft);
      const hasStrong = duplicates.some((d) => d.strength === 'strong');
      if (hasStrong && !workingDraft.duplicateContinueConfirmed) {
        throw new RepositoryError('validation', 'Strong duplicate confirmation required', {
          fieldHint: 'duplicates',
        });
      }

      const actorId = actorEntityId(accountId);
      let result: RegisterClientResult | null = null;

      try {
        await tx.withTransaction(async () => {
          let id = ids.nextId();
          let clientCode = provisionalClientCodeFromId(id);
          // Extremely rare local collision on provisional short code — regenerate once.
          if (await repos.clients.findByClientCode(clientCode)) {
            id = ids.nextId();
            clientCode = provisionalClientCodeFromId(id);
          }
          const client = await repos.clients.create({
            id,
            clientCode,
            category: workingDraft.category!,
            givenName: workingDraft.givenName.trim(),
            familyName: workingDraft.familyName.trim(),
            preferredName: workingDraft.preferredName.trim() || null,
            sex: workingDraft.sex.trim() || null,
            dateOfBirth:
              workingDraft.ageMode === 'dateOfBirth' ? workingDraft.dateOfBirth : null,
            approximateAge:
              workingDraft.ageMode === 'approximateAge'
                ? Number(workingDraft.approximateAge)
                : null,
            approximateAgeUnit:
              workingDraft.ageMode === 'approximateAge'
                ? workingDraft.approximateAgeUnit
                : null,
            pregnancyStatus: workingDraft.pregnancyStatus.trim() || null,
            estimatedDeliveryDate: workingDraft.estimatedDeliveryDate.trim() || null,
            phoneNumber: workingDraft.phoneNotAvailable
              ? null
              : workingDraft.phoneNumber.trim() || null,
            community: workingDraft.community.trim() || null,
            district: workingDraft.district.trim() || null,
            region: workingDraft.region.trim() || null,
            primaryFacilityId: workingDraft.primaryFacilityId,
            consentStatus: workingDraft.consentStatus!,
            notes: workingDraft.notes.trim() || null,
            accountId: actorId,
          });

          let caregiver: Caregiver | null = null;
          let relationship: ClientRelationship | null = null;
          if (workingDraft.includeCaregiver) {
            caregiver = await repos.caregivers.create({
              givenName: workingDraft.caregiverGivenName.trim(),
              familyName: workingDraft.caregiverFamilyName.trim(),
              phoneNumber: workingDraft.caregiverPhone.trim() || null,
              community:
                workingDraft.caregiverCommunity.trim() ||
                workingDraft.community.trim() ||
                null,
              accountId: actorId,
            });
            relationship = await repos.caregivers.createRelationship({
              clientId: client.id,
              caregiverId: caregiver.id,
              relationshipType: workingDraft.relationshipType as RelationshipType,
              isPrimary: true,
              accountId: actorId,
            });
            await repos.syncQueue.enqueue({
              entityType: 'caregiver',
              entityId: caregiver.id,
              operation: 'create',
            });
          }

          const auditEvent = await repos.auditEvents.record({
            eventType: 'client_registered',
            entityType: 'client',
            entityId: client.id,
            actorAccountId: actorId,
            result: 'success',
            metadata: {
              category: client.category,
              hasCaregiver: Boolean(caregiver),
              consentStatus: client.consentStatus,
            },
          });

          const syncItem = await repos.syncQueue.enqueue({
            entityType: 'client',
            entityId: client.id,
            operation: 'create',
          });

          result = { client, caregiver, relationship, auditEvent, syncItem };
        });
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError('transactionFailed', 'Client registration could not be saved', {
          operation: 'registerClient',
        });
      }

      if (!result) {
        throw new RepositoryError('unknown', 'Client registration produced no result');
      }
      return result;
    },

    async updateClient(input) {
      try {
        const existing = await repos.clients.findById(input.id);
        if (!existing || existing.isDeleted) {
          throw new RepositoryError('notFound', 'Client not found for update', {
            operation: 'updateClient',
          });
        }

        const updated = await repos.clients.update({
          id: input.id,
          expectedLocalVersion: input.expectedLocalVersion,
          accountId: input.accountId,
          givenName: input.givenName,
          familyName: input.familyName,
          preferredName: input.preferredName,
          community: input.community,
          district: input.district,
          region: input.region,
          phoneNumber: input.phoneNumber,
          pregnancyStatus: input.pregnancyStatus,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          consentStatus: input.consentStatus,
          notes: input.notes,
          sex: input.sex,
          dateOfBirth: input.dateOfBirth,
          approximateAge: input.approximateAge,
          approximateAgeUnit: input.approximateAgeUnit,
        });

        const changedFields = summariseClientUpdateFields(existing, {
          givenName: input.givenName,
          familyName: input.familyName,
          preferredName: input.preferredName,
          community: input.community,
          district: input.district,
          region: input.region,
          phoneNumber: input.phoneNumber,
          pregnancyStatus: input.pregnancyStatus,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          consentStatus: input.consentStatus,
          notes: input.notes,
          sex: input.sex,
          dateOfBirth: input.dateOfBirth,
          approximateAge: input.approximateAge,
          approximateAgeUnit: input.approximateAgeUnit,
        });

        await tx.withTransaction(async () => {
          await repos.auditEvents.record({
            eventType: 'client_updated',
            entityType: 'client',
            entityId: updated.id,
            actorAccountId: input.accountId,
            result: 'success',
            metadata: {
              localVersion: updated.localVersion,
              // Field names only — no PHI values.
              changedFields: changedFields.join(',') || 'none',
              fieldCount: changedFields.length,
              consentChanged: changedFields.includes('consentStatus'),
            },
          });
          try {
            await repos.syncQueue.enqueue({
              entityType: 'client',
              entityId: updated.id,
              operation: 'update',
              payloadVersion: updated.localVersion,
            });
          } catch (enqueueError) {
            // A pending update row may already exist — keep the local edit.
            if (!(isRepositoryError(enqueueError) && enqueueError.category === 'duplicate')) {
              throw enqueueError;
            }
          }
        });

        return updated;
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError('unknown', 'Client update failed');
      }
    },

    async archiveClient({ id, accountId }) {
      let archived: Client | null = null;
      try {
        await tx.withTransaction(async () => {
          archived = await repos.clients.archive(id, accountId);
          await repos.auditEvents.record({
            eventType: 'client_archived',
            entityType: 'client',
            entityId: id,
            actorAccountId: accountId,
            result: 'success',
            metadata: { localVersion: archived.localVersion },
          });
          await repos.syncQueue.enqueue({
            entityType: 'client',
            entityId: id,
            operation: 'delete',
            payloadVersion: archived.localVersion,
          });
        });
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError('transactionFailed', 'Client archive could not be completed');
      }
      if (!archived) {
        throw new RepositoryError('unknown', 'Client archive produced no result');
      }
      return archived;
    },

    async countClients(facilityId = null) {
      const resolved = await resolveFacilityFilter(facilityId);
      const clients = await repos.clients.list({ facilityId: resolved });
      return clients.length;
    },

    async countPendingSync() {
      const pending = await repos.syncQueue.listByState('pending');
      return pending.length;
    },
  };
}
