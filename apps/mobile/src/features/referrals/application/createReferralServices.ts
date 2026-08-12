import type {
  Facility,
  Referral,
  ReferralEvent,
  ReferralPassport,
  RiskAssessment,
  SyncQueueItem,
} from '../../../data/domain/entities/entities';
import type { AgeUnit } from '../../../data/domain/enums/ageUnit';
import type {
  ReferralOrigin,
  ReferralStatus,
  RiskPriority,
  TransportStatus,
} from '../../../data/domain/enums/domainEnums';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import { isEntityId } from '../../../data/domain/value-objects/EntityId';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import {
  isRepositoryError,
  RepositoryError,
} from '../../../data/repositories/errors/RepositoryError';
import type { TransactionRunner } from '../../clients/application/createClientServices';
import { getAppConfig } from '../../../config/appConfig';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { createLogger } from '../../../logging/logger';
import {
  getReferralReasonByCode,
  listLoadableReferralReasons,
  requireReferralReason,
} from '../content/registry';
import type { ReferralReasonDefinition } from '../content/types';
import {
  REFERRAL_PASSPORT_DEFAULT_TTL_MS,
  REFERRAL_PASSPORT_PAYLOAD_VERSION,
} from '../domain/constants';
import { isReferralError, ReferralError } from '../domain/errors';
import {
  assertPriorityNotCasuallyDowngraded,
  resolveReferralPriority,
} from '../domain/priorityPolicy';
import { provisionalReferralCodeFromId } from '../domain/referralReferenceCode';
import {
  assertCanTransitionReferralStatus,
  listAllowedTransitions,
} from '../domain/statusTransitions';
import { DEMO_DESTINATION_FACILITIES } from '../content/demoDestinationFacilities';
import { referralStrings } from '../i18n/referralStrings';
import { REFERRAL_PASSPORT_DEV_KEY_ID } from '../security/developmentPassportKeys';
import {
  getFacilitySealPublicKeyHex,
  resolveFacilitySealKeyId,
} from '../security/developmentFacilitySealKeys';
import { buildCaregiverSlipText } from '../security/buildCaregiverSlip';
import {
  derivePassportAgeBand,
  derivePassportSex,
} from '../security/passportAgeSex';
import {
  buildReferralPassportUri,
  parseReferralPassportQr,
} from '../security/qrPassportParser';
import { SIGNED_PASSPORT_SCHEMA_VERSION } from '../security/signedPassportClaims';
import type { SignedPassportClaims } from '../security/signedPassportClaims';
import {
  facilityKeyCandidatesForVerify,
  isSignedPassportUri,
  issueSealedSignedPassport,
  verifySignedPassportUri,
  type OfflinePassportVerifyResult,
} from '../security/signedPassportCrypto';
import { generateOpaquePassportToken, hashPassportToken } from '../security/tokenCrypto';

const log = createLogger({ environment: getAppConfig().appEnv });

export type ReferralDraftInput = {
  readonly clientId: EntityId;
  /** Auth session account id — may be opaque (non-UUID) in dev bypass. */
  readonly accountId: string;
  /** Auth session facility id — may be an external code such as fac-dev-001. */
  readonly sourceFacilityId: string;
  readonly origin: ReferralOrigin;
  readonly encounterId?: EntityId | null;
  readonly riskAssessmentId?: EntityId | null;
  readonly receivingFacilityId?: EntityId | null;
  readonly reasonCode?: string | null;
  readonly communicationNotes?: string | null;
  readonly workerNotes?: string | null;
  readonly transportStatus?: TransportStatus;
  readonly caregiverInformed?: boolean;
  readonly environment?: 'development' | 'staging' | 'production';
};

export type ReferralDetails = {
  readonly referral: Referral;
  readonly clientDisplayName: string;
  readonly clientSex: string | null;
  readonly clientDateOfBirth: string | null;
  readonly clientApproximateAge: number | null;
  readonly clientApproximateAgeUnit: AgeUnit | null;
  readonly sourceFacility: Facility | null;
  readonly receivingFacility: Facility | null;
  readonly riskAssessment: RiskAssessment | null;
  readonly events: readonly ReferralEvent[];
  readonly activePassport: ReferralPassport | null;
  readonly allowedTransitions: readonly ReferralStatus[];
  readonly reason: ReferralReasonDefinition | null;
};

export type GeneratedPassport = {
  readonly passport: ReferralPassport;
  readonly opaqueToken: string;
  /**
   * Primary QR value — Ed25519-signed offline passport (v3 sealed / v2 legacy).
   * Verifiable on another account/device without shared SQLite sync.
   */
  readonly uri: string;
  /** Opaque v1 URI for same-device local hash lookup only. */
  readonly localLookupUri: string;
  readonly slipText: string;
  readonly claims: SignedPassportClaims;
  /** Present only at generation time — never reloaded from DB. */
  readonly referral: Referral;
};

export type OfflineVerifiablePassport = {
  readonly uri: string;
  readonly slipText: string;
  readonly claims: SignedPassportClaims;
  readonly referral: Referral;
};

export type PassportResolveResult =
  | {
      readonly status: 'resolved';
      readonly referral: Referral;
      readonly passport: ReferralPassport;
      readonly details: ReferralDetails;
      /** Scan/resolve never mutates status. */
      readonly statusUnchanged: true;
    }
  | {
      readonly status: 'notAvailableOnThisDevice';
      readonly sanitisedMessage: string;
    }
  | {
      readonly status: 'expired' | 'revoked' | 'invalid';
      readonly sanitisedMessage: string;
    };

export type ReferralServices = {
  listSelectableReasons(environment?: 'development' | 'staging' | 'production'): readonly ReferralReasonDefinition[];
  listActiveFacilities(): Promise<Facility[]>;
  startReferralDraft(input: ReferralDraftInput): Promise<Referral>;
  getDraft(referralId: EntityId): Promise<Referral | null>;
  updateDraft(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
    readonly receivingFacilityId?: EntityId | null;
    readonly reasonCode?: string | null;
    readonly communicationNotes?: string | null;
    readonly workerNotes?: string | null;
    readonly transportStatus?: TransportStatus;
    readonly caregiverInformed?: boolean;
    readonly environment?: 'development' | 'staging' | 'production';
  }): Promise<Referral>;
  editReferral(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
    readonly receivingFacilityId?: EntityId | null;
    readonly reasonCode?: string | null;
    readonly communicationNotes?: string | null;
    readonly workerNotes?: string | null;
    readonly caregiverInformed?: boolean;
    readonly reissuePassport?: boolean;
    readonly environment?: 'development' | 'staging' | 'production';
  }): Promise<{
    readonly referral: Referral;
    readonly passport: GeneratedPassport | null;
  }>;
  reviewReferral(referralId: EntityId): Promise<ReferralDetails>;
  confirmReferral(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
    readonly generatePassport?: boolean;
  }): Promise<{
    readonly referral: Referral;
    readonly passport: GeneratedPassport | null;
    readonly syncItems: readonly SyncQueueItem[];
  }>;
  generatePassport(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
    readonly reissue?: boolean;
  }): Promise<GeneratedPassport>;
  /**
   * Build / refresh the Ed25519-signed QR from current referral data.
   * Does not require storing the raw opaque token.
   */
  buildOfflineVerifiablePassport(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
  }): Promise<OfflineVerifiablePassport>;
  /**
   * Offline signature check — no SQLite lookup, no network.
   * Pass assigned facility ids to unlock destination-sealed display name.
   */
  verifyOfflinePassport(
    rawOrUri: string,
    options?: {
      readonly assignedFacilityId?: string | null;
      readonly assignedFacilityExternalCode?: string | null;
      readonly assignedFacilityKeyIds?: readonly string[];
    },
  ): OfflinePassportVerifyResult;
  validatePassportToken(rawOrUri: string): Promise<PassportResolveResult>;
  resolvePassportLocally(rawOrUri: string): Promise<PassportResolveResult>;
  recordReferralEvent(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
    readonly eventType: string;
    readonly notes?: string | null;
    readonly facilityId?: EntityId | null;
  }): Promise<ReferralEvent>;
  cancelReferral(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
    readonly notes?: string | null;
  }): Promise<Referral>;
  getReferralDetails(referralId: EntityId): Promise<ReferralDetails | null>;
  listReferrals(): Promise<Referral[]>;
  getClientReferralHistory(clientId: EntityId): Promise<Referral[]>;
  markCaregiverInformed(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
  }): Promise<Referral>;
  markJourneyStarted(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
  }): Promise<Referral>;
  markFacilityReached(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
  }): Promise<Referral>;
  markClientReceived(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
  }): Promise<Referral>;
  completeReferral(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
  }): Promise<Referral>;
  transitionStatus(input: {
    readonly referralId: EntityId;
    readonly accountId: string;
    readonly to: ReferralStatus;
  }): Promise<Referral>;
};

function expiryIso(nowMs: number): string {
  return new Date(nowMs + REFERRAL_PASSPORT_DEFAULT_TTL_MS).toISOString();
}

async function enqueueReferralSync(
  repos: RepositoryContainer,
  input: {
    readonly entityId: EntityId;
    readonly operation: 'create' | 'update';
  },
): Promise<SyncQueueItem | null> {
  try {
    return await repos.syncQueue.enqueue({
      entityType: 'referral',
      entityId: input.entityId,
      operation: input.operation,
    });
  } catch (enqueueError) {
    // A pending row may already exist — keep the local write.
    if (isRepositoryError(enqueueError) && enqueueError.category === 'duplicate') {
      return null;
    }
    throw enqueueError;
  }
}

export function createReferralServices(
  repos: RepositoryContainer,
  tx: TransactionRunner,
): ReferralServices {
  const ids = getIdGenerator();

  /** Local entity writes require UUID actor ids; opaque auth ids are stored as null. */
  function actorEntityId(accountId: string | null | undefined): EntityId | null {
    return accountId && isEntityId(accountId) ? accountId : null;
  }

  /**
   * Resolve auth/session facility ids (e.g. fac-dev-001) to a local EntityId facility row.
   * Mirrors client registration so referral source_facility_id stays UUID-safe.
   */
  async function ensureAssignedFacility(input: {
    readonly facilityId: string;
    readonly name?: string | null;
    readonly district?: string | null;
    readonly region?: string | null;
    readonly facilityType?: string | null;
  }): Promise<Facility> {
    const facilityId = input.facilityId.trim();
    if (!facilityId) {
      throw new ReferralError(
        'sourceFacilityRequired',
        'Source facility must come from the signed-in worker session.',
      );
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

  async function loadDetails(referral: Referral): Promise<ReferralDetails> {
    const [client, sourceFacility, receivingFacility, riskAssessment, events, activePassport] =
      await Promise.all([
        repos.clients.findById(referral.clientId),
        referral.sourceFacilityId
          ? repos.facilities.findById(referral.sourceFacilityId)
          : Promise.resolve(null),
        referral.receivingFacilityId
          ? repos.facilities.findById(referral.receivingFacilityId)
          : Promise.resolve(null),
        referral.riskAssessmentId
          ? repos.riskAssessments.findById(referral.riskAssessmentId)
          : Promise.resolve(null),
        repos.referrals.listEvents(referral.id),
        referral.activePassportId
          ? repos.referralPassports.findById(referral.activePassportId)
          : repos.referralPassports.findActiveByReferralId(referral.id),
      ]);
    if (!client) {
      throw new RepositoryError('notFound', 'Client not found for referral');
    }
    const reason = referral.reasonCode
      ? getReferralReasonByCode(referral.reasonCode) ??
        (referral.reasonSummary
          ? {
              reasonCode: referral.reasonCode,
              version: 0,
              status: (referral.reasonContentStatus as ReferralReasonDefinition['status']) ??
                'APPROVED_FOR_DEVELOPMENT',
              label: referral.reasonSummary,
              description: '',
              applicableCategories: ['any'] as const,
              developmentOnly: true,
            }
          : null)
      : null;
    return {
      referral,
      clientDisplayName: `${client.givenName} ${client.familyName}`.trim(),
      clientSex: client.sex,
      clientDateOfBirth: client.dateOfBirth,
      clientApproximateAge: client.approximateAge,
      clientApproximateAgeUnit: client.approximateAgeUnit,
      sourceFacility,
      receivingFacility,
      riskAssessment,
      events,
      activePassport,
      allowedTransitions: listAllowedTransitions(referral.status),
      reason,
    };
  }

  async function transition(
    referralId: EntityId,
    accountId: string,
    to: ReferralStatus,
  ): Promise<Referral> {
    const existing = await repos.referrals.findById(referralId);
    if (!existing) {
      throw new ReferralError('notFound', 'Referral not found.');
    }
    assertCanTransitionReferralStatus(existing.status, to);
    const actorId = actorEntityId(accountId);
    let updated: Referral | null = null;
    await tx.withTransaction(async () => {
      updated = await repos.referrals.updateStatus(referralId, to, actorId, {
        alreadyInTransaction: true,
      });
      await repos.auditEvents.record({
        eventType: 'referral_status_changed',
        entityType: 'referral',
        entityId: referralId,
        actorAccountId: actorId,
        result: 'success',
        metadata: { from: existing.status, to },
      });
      await enqueueReferralSync(repos, {
        entityId: referralId,
        operation: 'update',
      });
    });
    if (!updated) {
      throw new ReferralError('persistenceFailed', 'Could not update referral status.');
    }
    return updated;
  }

  async function ensureDemoDestinationFacilities(): Promise<void> {
    for (const seed of DEMO_DESTINATION_FACILITIES) {
      const existing = await repos.facilities.findByExternalCode(seed.externalCode);
      if (existing) continue;
      await repos.facilities.create({
        name: seed.name,
        externalCode: seed.externalCode,
        facilityType: seed.facilityType,
        district: seed.district,
        region: seed.region,
        isActive: true,
      });
    }
  }

  async function buildSignedPassportPackage(
    referral: Referral,
    accountId: string,
  ): Promise<OfflineVerifiablePassport> {
    if (referral.status === 'draft' || referral.status === 'cancelled') {
      throw new ReferralError(
        'invalidDraft',
        'A passport can only be issued for an active confirmed referral.',
      );
    }
    const details = await loadDetails(referral);
    const expiresAt = expiryIso(Date.now());

    const destinationKeyId = resolveFacilitySealKeyId([
      details.receivingFacility?.externalCode,
      details.receivingFacility?.id,
      referral.receivingFacilityId,
    ]);
    if (!destinationKeyId || !getFacilitySealPublicKeyHex(destinationKeyId)) {
      throw new ReferralError(
        'invalidDraft',
        'Destination facility has no seal key on this build. Choose a demo directory facility (e.g. Tamale Teaching Hospital).',
      );
    }

    const srcKeyId =
      resolveFacilitySealKeyId([
        details.sourceFacility?.externalCode,
        details.sourceFacility?.id,
        referral.sourceFacilityId,
      ]) ??
      details.sourceFacility?.externalCode ??
      details.sourceFacility?.id ??
      referral.sourceFacilityId ??
      'unknown-source';

    const sex = derivePassportSex(details.clientSex);
    const ageBand = derivePassportAgeBand({
      dateOfBirth: details.clientDateOfBirth,
      approximateAge: details.clientApproximateAge,
      approximateAgeUnit: details.clientApproximateAgeUnit,
    });

    let issued;
    try {
      issued = issueSealedSignedPassport({
        base: {
          kid: REFERRAL_PASSPORT_DEV_KEY_ID,
          ref: referral.referenceCode ?? provisionalReferralCodeFromId(referral.id),
          srcId: srcKeyId,
          srcName: details.sourceFacility?.name ?? 'Origin facility',
          dstId: destinationKeyId,
          dstName: details.receivingFacility?.name ?? 'Destination facility',
          reasonCode: details.reason?.reasonCode ?? referral.reasonCode ?? 'unspecified',
          reasonLabel:
            details.reason?.label ?? referral.reasonSummary ?? 'Community referral',
          priority: referral.priority ?? 'undetermined',
          createdAt: referral.createdAt,
          expiresAt,
          issuerId: accountId || 'unknown-issuer',
        },
        displayName: details.clientDisplayName,
        destinationFacilityKeyId: destinationKeyId,
        sex,
        ageBand,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'issue_failed';
      if (code === 'uri_too_long') {
        throw new ReferralError(
          'invalidDraft',
          'Referral passport QR would be too long to scan. Shorten facility or reason labels.',
        );
      }
      if (code === 'missing_destination_seal_key') {
        throw new ReferralError(
          'invalidDraft',
          'Destination facility has no seal key on this build.',
        );
      }
      throw err;
    }

    return {
      uri: issued.uri,
      slipText: buildCaregiverSlipText({
        claims: issued.claims,
        uri: issued.uri,
        clientDisplayName: details.clientDisplayName,
      }),
      claims: issued.claims,
      referral,
    };
  }

  async function issuePassport(
    referral: Referral,
    accountId: string,
    reissue: boolean,
  ): Promise<GeneratedPassport> {
    if (referral.status === 'draft' || referral.status === 'cancelled') {
      throw new ReferralError(
        'invalidDraft',
        'A passport can only be issued for an active confirmed referral.',
      );
    }
    const actorId = actorEntityId(accountId);
    const opaqueToken = generateOpaquePassportToken();
    const tokenHash = hashPassportToken(opaqueToken);
    const localLookupUri = buildReferralPassportUri(opaqueToken);
    const now = Date.now();
    let issuedPassport: ReferralPassport | undefined;
    let linkedReferral: Referral | undefined;

    await tx.withTransaction(async () => {
      if (reissue) {
        const current = await repos.referralPassports.findActiveByReferralId(referral.id);
        issuedPassport = await repos.referralPassports.create({
          referralId: referral.id,
          tokenHash,
          payloadVersion: REFERRAL_PASSPORT_PAYLOAD_VERSION,
          expiresAt: expiryIso(now),
          accountId: actorId,
        });
        if (current) {
          await repos.referralPassports.markSuperseded({
            id: current.id,
            supersededByPassportId: issuedPassport.id,
            accountId: actorId,
          });
        }
      } else {
        const existing = await repos.referralPassports.findActiveByReferralId(referral.id);
        if (existing) {
          throw new ReferralError(
            'passportUnavailable',
            'An active passport already exists. Reissue to rotate the code.',
          );
        }
        issuedPassport = await repos.referralPassports.create({
          referralId: referral.id,
          tokenHash,
          payloadVersion: REFERRAL_PASSPORT_PAYLOAD_VERSION,
          expiresAt: expiryIso(now),
          accountId: actorId,
        });
      }

      linkedReferral = await repos.referrals.setActivePassport(
        referral.id,
        issuedPassport.id,
        REFERRAL_PASSPORT_PAYLOAD_VERSION,
        actorId,
      );
      await repos.referrals.addEvent({
        referralId: referral.id,
        eventType: reissue ? 'passport_reissued' : 'passport_issued',
        accountId: actorId,
        facilityId: referral.sourceFacilityId,
      });
      await repos.auditEvents.record({
        eventType: reissue ? 'referral_passport_reissued' : 'referral_passport_issued',
        entityType: 'referral',
        entityId: referral.id,
        actorAccountId: actorId,
        result: 'success',
        metadata: {
          passportId: issuedPassport.id,
          payloadVersion: REFERRAL_PASSPORT_PAYLOAD_VERSION,
          signedSchema: SIGNED_PASSPORT_SCHEMA_VERSION,
        },
      });
      await enqueueReferralSync(repos, {
        entityId: referral.id,
        operation: 'update',
      });
    });

    if (!issuedPassport || !linkedReferral) {
      throw new ReferralError('persistenceFailed', 'Could not issue referral passport.');
    }

    const signed = await buildSignedPassportPackage(linkedReferral, accountId);

    log.info('referral_passport_issued', {
      referralId: referral.id,
      passportId: issuedPassport.id,
      reissue,
      signed: true,
    });

    return {
      passport: issuedPassport,
      opaqueToken,
      uri: signed.uri,
      localLookupUri,
      slipText: signed.slipText,
      claims: signed.claims,
      referral: linkedReferral,
    };
  }

  async function resolveToken(rawOrUri: string): Promise<PassportResolveResult> {
    const trimmed = rawOrUri.trim();
    if (isSignedPassportUri(trimmed)) {
      return {
        status: 'notAvailableOnThisDevice',
        sanitisedMessage:
          referralStrings.signedPassportRedirectHint,
      };
    }
    let opaque: string | null = null;
    if (trimmed.includes('://')) {
      const parsed = parseReferralPassportQr(trimmed);
      if (!parsed.ok || parsed.version !== 1) {
        return {
          status: 'invalid',
          sanitisedMessage:
            'This code is not a recognised NorthCare AI referral passport.',
        };
      }
      opaque = parsed.opaqueToken;
    } else if (/^[A-Za-z0-9_-]{16,64}$/.test(trimmed)) {
      // Manual entry fallback — bare opaque token only (high entropy; not a short PIN).
      opaque = trimmed;
    } else {
      return {
        status: 'invalid',
        sanitisedMessage:
          'This code is not a recognised NorthCare AI referral passport.',
      };
    }
    return lookupByHash(hashPassportToken(opaque));
  }

  async function lookupByHash(tokenHash: string): Promise<PassportResolveResult> {
    const passport = await repos.referralPassports.findByTokenHash(tokenHash);
    if (!passport) {
      return {
        status: 'notAvailableOnThisDevice',
        sanitisedMessage:
          'This referral passport is not available on this device. Offline QR resolution only looks up locally stored token hashes.',
      };
    }
    if (passport.status === 'revoked' || passport.status === 'superseded') {
      return {
        status: 'revoked',
        sanitisedMessage: 'This referral passport is no longer valid.',
      };
    }
    if (passport.expiresAt && Date.parse(passport.expiresAt) < Date.now()) {
      if (passport.status === 'active') {
        await repos.referralPassports.markExpired(passport.id);
      }
      return {
        status: 'expired',
        sanitisedMessage: 'This referral passport has expired.',
      };
    }
    if (passport.status === 'expired') {
      return {
        status: 'expired',
        sanitisedMessage: 'This referral passport has expired.',
      };
    }
    const referral = await repos.referrals.findById(passport.referralId);
    if (!referral) {
      return {
        status: 'notAvailableOnThisDevice',
        sanitisedMessage: 'This referral passport is not available on this device.',
      };
    }
    const details = await loadDetails(referral);
    return {
      status: 'resolved',
      referral,
      passport,
      details,
      statusUnchanged: true,
    };
  }

  return {
    listSelectableReasons(environment) {
      return listLoadableReferralReasons(environment ?? getAppConfig().appEnv);
    },

    async listActiveFacilities() {
      await ensureDemoDestinationFacilities();
      return repos.facilities.listActive();
    },

    async startReferralDraft(input) {
      const environment = input.environment ?? getAppConfig().appEnv;
      if (!input.sourceFacilityId?.trim()) {
        throw new ReferralError(
          'sourceFacilityRequired',
          'Source facility must come from the signed-in worker session.',
        );
      }
      const client = await repos.clients.findById(input.clientId);
      if (!client) {
        throw new ReferralError('notFound', 'Client not found.');
      }

      const sourceFacility = await ensureAssignedFacility({
        facilityId: input.sourceFacilityId,
      });
      const actorId = actorEntityId(input.accountId);

      let enginePriority: RiskPriority | null = null;
      if (input.riskAssessmentId) {
        const assessment = await repos.riskAssessments.findById(input.riskAssessmentId);
        if (!assessment || assessment.clientId !== input.clientId) {
          throw new ReferralError(
            'assessmentMismatch',
            'The priority assessment does not match this client.',
          );
        }
        enginePriority = assessment.priority;
      }

      const resolved = resolveReferralPriority({
        origin: input.origin,
        enginePriority,
        riskAssessmentId: input.riskAssessmentId,
      });

      let reasonCode = input.reasonCode ?? null;
      let reasonSummary: string | null = null;
      let reasonContentStatus: string | null = null;
      if (reasonCode) {
        const reason = requireReferralReason(reasonCode, environment);
        reasonSummary = reason.label;
        reasonContentStatus = reason.status;
      }

      const referralId = ids.nextId();
      const referenceCode = provisionalReferralCodeFromId(referralId);

      const draft = await repos.referrals.createDraft({
        id: referralId,
        clientId: input.clientId,
        encounterId: input.encounterId ?? null,
        riskAssessmentId: input.riskAssessmentId ?? null,
        sourceFacilityId: sourceFacility.id,
        receivingFacilityId: input.receivingFacilityId ?? null,
        priority: resolved.priority,
        prioritySource: resolved.prioritySource,
        origin: input.origin,
        reasonCode,
        reasonSummary,
        reasonContentStatus,
        referenceCode,
        communicationNotes: input.communicationNotes ?? null,
        workerNotes: input.workerNotes ?? null,
        transportStatus: input.transportStatus ?? 'unknown',
        accountId: actorId,
      });

      // Caregiver informed must not default to informed.
      if (input.caregiverInformed === true) {
        await repos.referrals.updateDraft({
          id: draft.id,
          caregiverInformed: true,
          accountId: actorId,
        });
      }

      await repos.auditEvents.record({
        eventType: 'referral_draft_started',
        entityType: 'referral',
        entityId: draft.id,
        actorAccountId: actorId,
        result: 'success',
        metadata: {
          origin: input.origin,
          prioritySource: resolved.prioritySource,
          hasAssessment: Boolean(input.riskAssessmentId),
        },
      });

      return (await repos.referrals.findById(draft.id)) ?? draft;
    },

    async getDraft(referralId) {
      const referral = await repos.referrals.findById(referralId);
      if (!referral || referral.status !== 'draft') {
        return null;
      }
      return referral;
    },

    async updateDraft(input) {
      const environment = input.environment ?? getAppConfig().appEnv;
      const existing = await repos.referrals.findById(input.referralId);
      if (!existing || existing.status !== 'draft') {
        throw new ReferralError('invalidDraft', 'Referral draft not found.');
      }

      let reasonSummary: string | null | undefined = undefined;
      let reasonContentStatus: string | null | undefined = undefined;
      if (input.reasonCode) {
        const reason = requireReferralReason(input.reasonCode, environment);
        reasonSummary = reason.label;
        reasonContentStatus = reason.status;
      } else if (input.reasonCode === null) {
        reasonSummary = null;
        reasonContentStatus = null;
      }

      if (existing.riskAssessmentId && existing.prioritySource !== 'noEnginePriority') {
        const assessment = await repos.riskAssessments.findById(existing.riskAssessmentId);
        assertPriorityNotCasuallyDowngraded({
          linkedEnginePriority: assessment?.priority ?? null,
          requestedPriority: existing.priority,
          prioritySource: existing.prioritySource,
        });
      }

      return repos.referrals.updateDraft({
        id: input.referralId,
        receivingFacilityId: input.receivingFacilityId,
        reasonCode: input.reasonCode,
        reasonSummary,
        reasonContentStatus,
        communicationNotes: input.communicationNotes,
        workerNotes: input.workerNotes,
        transportStatus: input.transportStatus,
        caregiverInformed: input.caregiverInformed,
        accountId: actorEntityId(input.accountId),
      });
    },

    async editReferral(input) {
      const environment = input.environment ?? getAppConfig().appEnv;
      const existing = await repos.referrals.findById(input.referralId);
      if (!existing) {
        throw new ReferralError('notFound', 'Referral not found.');
      }
      if (existing.status === 'draft') {
        throw new ReferralError(
          'invalidDraft',
          'This referral is still a draft. Finish creating it first.',
        );
      }
      if (existing.status === 'cancelled' || existing.status === 'completed') {
        throw new ReferralError(
          'invalidDraft',
          'Completed or cancelled referrals cannot be edited.',
        );
      }
      if (!input.workerNotes?.trim()) {
        throw new ReferralError(
          'invalidDraft',
          'Add a brief clinical summary before saving changes.',
        );
      }
      if (input.receivingFacilityId === null || input.receivingFacilityId === undefined) {
        throw new ReferralError('facilityRequired', 'Select a destination facility.');
      }
      if (!input.reasonCode) {
        throw new ReferralError('reasonUnavailable', 'Select a referral reason.');
      }

      const reason = requireReferralReason(input.reasonCode, environment);
      const actorId = actorEntityId(input.accountId);
      const updated = await repos.referrals.updateDetails({
        id: input.referralId,
        receivingFacilityId: input.receivingFacilityId,
        reasonCode: input.reasonCode,
        reasonSummary: reason.label,
        reasonContentStatus: reason.status,
        communicationNotes: input.communicationNotes ?? null,
        workerNotes: input.workerNotes.trim(),
        caregiverInformed: input.caregiverInformed,
        accountId: actorId,
      });

      await repos.auditEvents.record({
        eventType: 'referral_edited',
        entityType: 'referral',
        entityId: input.referralId,
        actorAccountId: actorId,
        result: 'success',
      });
      await enqueueReferralSync(repos, {
        entityId: input.referralId,
        operation: 'update',
      });

      let passport: GeneratedPassport | null = null;
      if (input.reissuePassport !== false) {
        passport = await issuePassport(updated, input.accountId, true);
      }
      return { referral: passport?.referral ?? updated, passport };
    },

    async reviewReferral(referralId) {
      const referral = await repos.referrals.findById(referralId);
      if (!referral) {
        throw new ReferralError('notFound', 'Referral not found.');
      }
      return loadDetails(referral);
    },

    async confirmReferral({ referralId, accountId, generatePassport = true }) {
      const existing = await repos.referrals.findById(referralId);
      if (!existing || existing.status !== 'draft') {
        throw new ReferralError('invalidDraft', 'Only draft referrals can be confirmed.');
      }
      if (!existing.receivingFacilityId) {
        throw new ReferralError('facilityRequired', 'Select a destination facility.');
      }
      if (!existing.reasonCode) {
        throw new ReferralError('reasonUnavailable', 'Select an approved referral reason.');
      }
      // Re-check content gate at confirm time (fail closed).
      requireReferralReason(existing.reasonCode);
      if (!existing.sourceFacilityId) {
        throw new ReferralError(
          'sourceFacilityRequired',
          'Source facility is missing from this referral.',
        );
      }

      const actorId = actorEntityId(accountId);
      let confirmed: Referral | null = null;
      const syncItems: SyncQueueItem[] = [];
      await tx.withTransaction(async () => {
        assertCanTransitionReferralStatus(existing.status, 'created');
        confirmed = await repos.referrals.updateStatus(referralId, 'created', actorId, {
          alreadyInTransaction: true,
        });
        await repos.referrals.addEvent({
          referralId,
          eventType: 'referral_confirmed',
          accountId: actorId,
          facilityId: existing.sourceFacilityId,
        });
        await repos.auditEvents.record({
          eventType: 'referral_confirmed',
          entityType: 'referral',
          entityId: referralId,
          actorAccountId: actorId,
          result: 'success',
          metadata: {
            origin: existing.origin,
            priority: existing.priority,
            prioritySource: existing.prioritySource,
            reasonCode: existing.reasonCode,
          },
        });
        const syncItem = await enqueueReferralSync(repos, {
          entityId: referralId,
          operation: 'create',
        });
        if (syncItem) {
          syncItems.push(syncItem);
        }
      });
      if (!confirmed) {
        throw new ReferralError('persistenceFailed', 'Could not confirm referral.');
      }

      let passport: GeneratedPassport | null = null;
      if (generatePassport) {
        passport = await issuePassport(confirmed, accountId, false);
      }
      return { referral: passport?.referral ?? confirmed, passport, syncItems };
    },

    async generatePassport({ referralId, accountId, reissue = false }) {
      const referral = await repos.referrals.findById(referralId);
      if (!referral) {
        throw new ReferralError('notFound', 'Referral not found.');
      }
      return issuePassport(referral, accountId, reissue);
    },

    async buildOfflineVerifiablePassport({ referralId, accountId }) {
      const referral = await repos.referrals.findById(referralId);
      if (!referral) {
        throw new ReferralError('notFound', 'Referral not found.');
      }
      return buildSignedPassportPackage(referral, accountId);
    },

    verifyOfflinePassport(rawOrUri, options) {
      const assignedFacilityKeyIds =
        options?.assignedFacilityKeyIds ??
        facilityKeyCandidatesForVerify({
          facilityId: options?.assignedFacilityId,
          facilityExternalCode: options?.assignedFacilityExternalCode,
        });
      return verifySignedPassportUri(rawOrUri, {
        assignedFacilityKeyIds,
      });
    },

    async validatePassportToken(rawOrUri) {
      return resolveToken(rawOrUri);
    },

    async resolvePassportLocally(rawOrUri) {
      // Alias — local hash lookup only; never claims cross-device sync.
      return resolveToken(rawOrUri);
    },

    async recordReferralEvent(input) {
      const referral = await repos.referrals.findById(input.referralId);
      if (!referral) {
        throw new ReferralError('notFound', 'Referral not found.');
      }
      return repos.referrals.addEvent({
        referralId: input.referralId,
        eventType: input.eventType,
        notes: input.notes ?? null,
        facilityId: input.facilityId ?? referral.sourceFacilityId,
        accountId: actorEntityId(input.accountId),
      });
    },

    async cancelReferral({ referralId, accountId, notes }) {
      const existing = await repos.referrals.findById(referralId);
      if (!existing) {
        throw new ReferralError('notFound', 'Referral not found.');
      }
      assertCanTransitionReferralStatus(existing.status, 'cancelled');
      const actorId = actorEntityId(accountId);
      let cancelled: Referral | null = null;
      await tx.withTransaction(async () => {
        const active = await repos.referralPassports.findActiveByReferralId(referralId);
        if (active) {
          await repos.referralPassports.revoke({
            id: active.id,
            reason: 'referral_cancelled',
            accountId: actorId,
          });
        }
        cancelled = await repos.referrals.updateStatus(referralId, 'cancelled', actorId, {
          alreadyInTransaction: true,
        });
        if (notes) {
          await repos.referrals.addEvent({
            referralId,
            eventType: 'cancellation_note',
            notes,
            accountId: actorId,
          });
        }
        await repos.auditEvents.record({
          eventType: 'referral_cancelled',
          entityType: 'referral',
          entityId: referralId,
          actorAccountId: actorId,
          result: 'success',
        });
        await enqueueReferralSync(repos, {
          entityId: referralId,
          operation: 'update',
        });
      });
      if (!cancelled) {
        throw new ReferralError('persistenceFailed', 'Could not cancel referral.');
      }
      return cancelled;
    },

    async getReferralDetails(referralId) {
      const referral = await repos.referrals.findById(referralId);
      if (!referral) {
        return null;
      }
      return loadDetails(referral);
    },

    async listReferrals() {
      return repos.referrals.listRecent(100);
    },

    async getClientReferralHistory(clientId) {
      return repos.referrals.listByClient(clientId);
    },

    async markCaregiverInformed(input) {
      return transition(input.referralId, input.accountId, 'caregiverInformed');
    },

    async markJourneyStarted(input) {
      return transition(input.referralId, input.accountId, 'journeyStarted');
    },

    async markFacilityReached(input) {
      return transition(input.referralId, input.accountId, 'facilityReached');
    },

    async markClientReceived(input) {
      // Persisted enum remains patientReceived (Stage 6).
      return transition(input.referralId, input.accountId, 'patientReceived');
    },

    async completeReferral(input) {
      return transition(input.referralId, input.accountId, 'completed');
    },

    async transitionStatus(input) {
      return transition(input.referralId, input.accountId, input.to);
    },
  };
}

export function mapReferralServiceError(error: unknown): string {
  if (isReferralError(error)) {
    return error.sanitisedMessage;
  }
  if (isRepositoryError(error)) {
    if (error.category === 'notFound') {
      return 'Referral not found.';
    }
    return mapUserFacingError(error, 'Something went wrong while saving the referral. Please try again.');
  }
  return mapUserFacingError(error, 'Something went wrong. Please try again.');
}
