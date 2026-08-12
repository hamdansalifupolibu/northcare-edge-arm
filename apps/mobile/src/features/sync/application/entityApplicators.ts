import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { IsoUtcTimestamp } from '../../../data/domain/value-objects/timestamps';
import { normalizeSearchText } from '../../../data/domain/validation/normalizeSearch';
import type { PullChange } from '../domain/protocol';
import { canonicalJson } from '../domain/hashing';

const ACTIVE_QUEUE_STATES = new Set([
  'pending',
  'processing',
  'failed',
  'blocked',
  'conflict',
]);

/** Maps protocol/registry names and existing mobile enqueue aliases to tables. */
const ENTITY_TABLE: Readonly<Record<string, string>> = {
  client: 'clients',
  caregiver: 'caregivers',
  client_relationship: 'client_relationships',
  encounter: 'encounters',
  screening: 'screenings',
  measurement: 'measurements',
  risk_assessment: 'risk_assessments',
  riskAssessment: 'risk_assessments',
  referral: 'referrals',
  referral_event: 'referral_events',
  referralEvent: 'referral_events',
  referral_passport: 'referral_passports',
  referralPassport: 'referral_passports',
  nutrition_assessment: 'nutrition_assessments',
  nutritionAssessment: 'nutrition_assessments',
  voice_capture_session: 'voice_capture_sessions',
  voiceCaptureSession: 'voice_capture_sessions',
  voice_transcript: 'voice_transcripts',
  voiceTranscript: 'voice_transcripts',
  voice_extraction_run: 'voice_extraction_runs',
  voiceExtractionRun: 'voice_extraction_runs',
  attachment: 'attachments',
  assistant_feedback: 'assistant_feedback',
  facility: 'facilities',
  followUpReminder: 'follow_up_reminders',
  follow_up_reminder: 'follow_up_reminders',
};

type DbRunner = {
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolInt(value: unknown): number {
  return value === true || value === 1 ? 1 : 0;
}

async function hasActiveLocalQueue(
  repos: RepositoryContainer,
  entityType: string,
  entityId: string,
): Promise<boolean> {
  for (const state of ACTIVE_QUEUE_STATES) {
    const items = await repos.syncQueue.listByState(state as never);
    if (items.some((item) => item.entityType === entityType && item.entityId === entityId)) {
      return true;
    }
  }
  return false;
}

/**
 * Apply one pull change. Local pending divergence becomes an open conflict
 * (local data preserved). Otherwise upsert/soft-delete domain rows and mark synced.
 * Returning successfully is what allows the engine to advance the cursor.
 */
export async function applyRemoteChange(options: {
  readonly repos: RepositoryContainer;
  readonly db: DbRunner;
  readonly change: PullChange;
  readonly now: IsoUtcTimestamp;
}): Promise<void> {
  const { repos, db, change, now } = options;
  const table = ENTITY_TABLE[change.entityType];
  if (!table) {
    throw new Error(`No approved local applicator for remote ${change.entityType} changes.`);
  }

  const localPending = await hasActiveLocalQueue(repos, change.entityType, change.entityId);
  if (localPending) {
    await repos.syncConflicts.upsert({
      id: `pull:${change.changeId}`,
      serverConflictId: change.changeId,
      entityType: change.entityType,
      entityId: change.entityId,
      conflictClass: 'serverVersionConflict',
      serverPayloadJson: change.payload ? canonicalJson(change.payload) : null,
      serverVersion: change.serverVersion,
      state: 'open',
    });
    await db.runAsync(
      `UPDATE ${table} SET sync_status = 'conflict', updated_at = ? WHERE id = ?`,
      [now, change.entityId],
    );
    return;
  }

  if (change.deleted || change.operation === 'delete') {
    await db.runAsync(
      `UPDATE ${table}
       SET is_deleted = 1,
           deleted_at = ?,
           server_version = ?,
           sync_status = 'synced',
           last_synced_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [change.changedAt, change.serverVersion, now, now, change.entityId],
    );
    return;
  }

  const payload = change.payload ?? {};
  if (change.entityType === 'client') {
    await upsertClient(db, change.entityId as EntityId, payload, change.serverVersion, now);
    return;
  }
  if (change.entityType === 'caregiver') {
    await upsertCaregiver(db, change.entityId as EntityId, payload, change.serverVersion, now);
    return;
  }
  if (change.entityType === 'facility') {
    await upsertFacility(db, change.entityId as EntityId, payload, change.serverVersion, now);
    return;
  }
  if (change.entityType === 'encounter') {
    await upsertEncounter(db, change.entityId as EntityId, payload, change.serverVersion, now);
    return;
  }
  if (change.entityType === 'referral') {
    await upsertReferral(db, change.entityId as EntityId, payload, change.serverVersion, now);
    return;
  }
  if (change.entityType === 'follow_up_reminder' || change.entityType === 'followUpReminder') {
    await upsertFollowUpReminder(db, change.entityId as EntityId, payload, change.serverVersion, now);
    return;
  }

  // Generic metadata sync for remaining registered tables: update sync bookkeeping
  // when the row already exists; otherwise insert a minimal synced stub from payload ids.
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM ${table} WHERE id = ?`,
    [change.entityId],
  );
  if (existing) {
    await db.runAsync(
      `UPDATE ${table}
       SET server_version = ?,
           sync_status = 'synced',
           last_synced_at = ?,
           updated_at = ?,
           is_deleted = 0,
           deleted_at = NULL
       WHERE id = ?`,
      [change.serverVersion, now, now, change.entityId],
    );
    return;
  }

  // Fail closed for unknown insert shapes rather than inventing clinical rows.
  throw new Error(
    `Remote ${change.entityType} create requires a specialised applicator on this build.`,
  );
}

async function upsertClient(
  db: DbRunner,
  id: EntityId,
  payload: Readonly<Record<string, unknown>>,
  serverVersion: number,
  now: IsoUtcTimestamp,
): Promise<void> {
  const givenName = asString(payload.givenName, 'Unknown');
  const familyName = asString(payload.familyName, 'Client');
  const clientCode = asString(payload.clientCode, `SYNC-${id.slice(0, 8)}`);
  const category = asString(payload.category, 'childUnderFive');
  const search = asString(
    payload.searchNormalized,
    normalizeSearchText(`${givenName} ${familyName} ${clientCode}`),
  );
  await db.runAsync(
    `INSERT INTO clients (
      id, client_code, category, given_name, family_name, preferred_name, sex,
      date_of_birth, approximate_age, approximate_age_unit, pregnancy_status,
      estimated_delivery_date, phone_number, community, district, region,
      primary_facility_id, consent_status, consent_recorded_at, notes, search_normalized,
      created_at, updated_at, created_by_account_id, updated_by_account_id,
      local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, NULL, 0)
    ON CONFLICT(id) DO UPDATE SET
      client_code = excluded.client_code,
      category = excluded.category,
      given_name = excluded.given_name,
      family_name = excluded.family_name,
      preferred_name = excluded.preferred_name,
      sex = excluded.sex,
      date_of_birth = excluded.date_of_birth,
      approximate_age = excluded.approximate_age,
      approximate_age_unit = excluded.approximate_age_unit,
      pregnancy_status = excluded.pregnancy_status,
      estimated_delivery_date = excluded.estimated_delivery_date,
      phone_number = excluded.phone_number,
      community = excluded.community,
      district = excluded.district,
      region = excluded.region,
      primary_facility_id = excluded.primary_facility_id,
      consent_status = excluded.consent_status,
      consent_recorded_at = excluded.consent_recorded_at,
      notes = excluded.notes,
      search_normalized = excluded.search_normalized,
      updated_at = excluded.updated_at,
      updated_by_account_id = excluded.updated_by_account_id,
      server_version = excluded.server_version,
      sync_status = 'synced',
      last_synced_at = excluded.last_synced_at,
      is_deleted = 0,
      deleted_at = NULL`,
    [
      id,
      clientCode,
      category,
      givenName,
      familyName,
      asNullableString(payload.preferredName),
      asNullableString(payload.sex),
      asNullableString(payload.dateOfBirth),
      asNullableNumber(payload.approximateAge),
      asNullableString(payload.approximateAgeUnit),
      asNullableString(payload.pregnancyStatus),
      asNullableString(payload.estimatedDeliveryDate),
      asNullableString(payload.phoneNumber),
      asNullableString(payload.community),
      asNullableString(payload.district),
      asNullableString(payload.region),
      asNullableString(payload.primaryFacilityId),
      asString(payload.consentStatus, 'unknown'),
      asNullableString(payload.consentRecordedAt),
      asNullableString(payload.notes),
      search,
      asString(payload.createdAt, now),
      now,
      asNullableString(payload.createdByAccountId),
      asNullableString(payload.updatedByAccountId),
      asNumber(payload.localVersion, 1),
      serverVersion,
      now,
    ],
  );
}

async function upsertCaregiver(
  db: DbRunner,
  id: EntityId,
  payload: Readonly<Record<string, unknown>>,
  serverVersion: number,
  now: IsoUtcTimestamp,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO caregivers (
      id, given_name, family_name, phone_number, community, notes,
      created_at, updated_at, created_by_account_id, updated_by_account_id,
      local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, NULL, 0)
    ON CONFLICT(id) DO UPDATE SET
      given_name = excluded.given_name,
      family_name = excluded.family_name,
      phone_number = excluded.phone_number,
      community = excluded.community,
      notes = excluded.notes,
      updated_at = excluded.updated_at,
      server_version = excluded.server_version,
      sync_status = 'synced',
      last_synced_at = excluded.last_synced_at,
      is_deleted = 0,
      deleted_at = NULL`,
    [
      id,
      asString(payload.givenName, 'Unknown'),
      asString(payload.familyName, 'Caregiver'),
      asNullableString(payload.phoneNumber),
      asNullableString(payload.community),
      asNullableString(payload.notes),
      asString(payload.createdAt, now),
      now,
      asNullableString(payload.createdByAccountId),
      asNullableString(payload.updatedByAccountId),
      asNumber(payload.localVersion, 1),
      serverVersion,
      now,
    ],
  );
}

async function upsertFacility(
  db: DbRunner,
  id: EntityId,
  payload: Readonly<Record<string, unknown>>,
  serverVersion: number,
  now: IsoUtcTimestamp,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO facilities (
      id, external_code, name, facility_type, district, region, latitude, longitude, is_active,
      created_at, updated_at, created_by_account_id, updated_by_account_id,
      local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, NULL, 0)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      external_code = excluded.external_code,
      facility_type = excluded.facility_type,
      district = excluded.district,
      region = excluded.region,
      is_active = excluded.is_active,
      updated_at = excluded.updated_at,
      server_version = excluded.server_version,
      sync_status = 'synced',
      last_synced_at = excluded.last_synced_at,
      is_deleted = 0,
      deleted_at = NULL`,
    [
      id,
      asNullableString(payload.externalCode),
      asString(payload.name, 'Facility'),
      asNullableString(payload.facilityType),
      asNullableString(payload.district),
      asNullableString(payload.region),
      asNullableNumber(payload.latitude),
      asNullableNumber(payload.longitude),
      asBoolInt(payload.isActive ?? true),
      asString(payload.createdAt, now),
      now,
      asNullableString(payload.createdByAccountId),
      asNullableString(payload.updatedByAccountId),
      asNumber(payload.localVersion, 1),
      serverVersion,
      now,
    ],
  );
}

async function upsertEncounter(
  db: DbRunner,
  id: EntityId,
  payload: Readonly<Record<string, unknown>>,
  serverVersion: number,
  now: IsoUtcTimestamp,
): Promise<void> {
  const clientId = asNullableString(payload.clientId);
  if (!clientId) {
    throw new Error('Remote encounter payload is missing clientId.');
  }
  await db.runAsync(
    `INSERT INTO encounters (
      id, client_id, encounter_type, occurred_at, facility_id, worker_account_id, status,
      started_at, completed_at, draft_saved_at, source, notes,
      created_at, updated_at, created_by_account_id, updated_by_account_id,
      local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, NULL, 0)
    ON CONFLICT(id) DO UPDATE SET
      client_id = excluded.client_id,
      encounter_type = excluded.encounter_type,
      occurred_at = excluded.occurred_at,
      facility_id = excluded.facility_id,
      worker_account_id = excluded.worker_account_id,
      status = excluded.status,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at,
      draft_saved_at = excluded.draft_saved_at,
      source = excluded.source,
      notes = excluded.notes,
      updated_at = excluded.updated_at,
      server_version = excluded.server_version,
      sync_status = 'synced',
      last_synced_at = excluded.last_synced_at,
      is_deleted = 0,
      deleted_at = NULL`,
    [
      id,
      clientId,
      asString(payload.encounterType, 'homeVisit'),
      asNullableString(payload.occurredAt),
      asNullableString(payload.facilityId),
      asNullableString(payload.workerAccountId),
      asString(payload.status, 'inProgress'),
      asNullableString(payload.startedAt),
      asNullableString(payload.completedAt),
      asNullableString(payload.draftSavedAt),
      asNullableString(payload.source),
      asNullableString(payload.notes),
      asString(payload.createdAt, now),
      now,
      asNullableString(payload.createdByAccountId),
      asNullableString(payload.updatedByAccountId),
      asNumber(payload.localVersion, 1),
      serverVersion,
      now,
    ],
  );
}

async function upsertReferral(
  db: DbRunner,
  id: EntityId,
  payload: Readonly<Record<string, unknown>>,
  serverVersion: number,
  now: IsoUtcTimestamp,
): Promise<void> {
  const clientId = asNullableString(payload.clientId);
  if (!clientId) {
    throw new Error('Remote referral payload is missing clientId.');
  }
  await db.runAsync(
    `INSERT INTO referrals (
      id, client_id, encounter_id, risk_assessment_id, source_facility_id, receiving_facility_id,
      priority, reason_summary, transport_status, caregiver_informed, status, completed_at,
      qr_payload_version,
      created_at, updated_at, created_by_account_id, updated_by_account_id,
      local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, NULL, 0)
    ON CONFLICT(id) DO UPDATE SET
      encounter_id = excluded.encounter_id,
      risk_assessment_id = excluded.risk_assessment_id,
      source_facility_id = excluded.source_facility_id,
      receiving_facility_id = excluded.receiving_facility_id,
      priority = excluded.priority,
      reason_summary = excluded.reason_summary,
      transport_status = excluded.transport_status,
      caregiver_informed = excluded.caregiver_informed,
      status = excluded.status,
      completed_at = excluded.completed_at,
      qr_payload_version = excluded.qr_payload_version,
      updated_at = excluded.updated_at,
      server_version = excluded.server_version,
      sync_status = 'synced',
      last_synced_at = excluded.last_synced_at,
      is_deleted = 0,
      deleted_at = NULL`,
    [
      id,
      clientId,
      asNullableString(payload.encounterId),
      asNullableString(payload.riskAssessmentId),
      asNullableString(payload.sourceFacilityId),
      asNullableString(payload.receivingFacilityId),
      asString(payload.priority, 'undetermined'),
      asNullableString(payload.reasonSummary),
      asString(payload.transportStatus, 'unknown'),
      asBoolInt(payload.caregiverInformed),
      asString(payload.status, 'created'),
      asNullableString(payload.completedAt),
      asNullableNumber(payload.qrPayloadVersion),
      asString(payload.createdAt, now),
      now,
      asNullableString(payload.createdByAccountId),
      asNullableString(payload.updatedByAccountId),
      asNumber(payload.localVersion, 1),
      serverVersion,
      now,
    ],
  );
}

async function upsertFollowUpReminder(
  db: DbRunner,
  id: EntityId,
  payload: Readonly<Record<string, unknown>>,
  serverVersion: number,
  now: IsoUtcTimestamp,
): Promise<void> {
  const accountId = asString(payload.accountId);
  const facilityId = asString(payload.facilityId);
  const organisationId = asString(payload.organisationId);
  const scheduledForUtc = asString(payload.scheduledForUtc);
  if (!accountId || !facilityId || !organisationId || !scheduledForUtc) {
    throw new Error('Remote reminder payload is missing required scope or schedule fields.');
  }
  await db.runAsync(
    `INSERT INTO follow_up_reminders (
      id,account_id,organisation_id,facility_id,client_id,encounter_id,source_type,source_entity_id,
      reminder_type,status,scheduled_for_utc,original_time_zone,original_local_date,original_local_time,
      time_zone_policy_version,privacy_level,note,created_by_account_id,created_at,updated_at,local_version,
      server_version,sync_status,is_deleted
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'synced',0)
    ON CONFLICT(id) DO UPDATE SET
      status=excluded.status,scheduled_for_utc=excluded.scheduled_for_utc,
      original_time_zone=excluded.original_time_zone,original_local_date=excluded.original_local_date,
      original_local_time=excluded.original_local_time,note=excluded.note,updated_at=excluded.updated_at,
      local_version=excluded.local_version,server_version=excluded.server_version,sync_status='synced',
      is_deleted=0,deleted_at=NULL`,
    [
      id,accountId,organisationId,facilityId,asNullableString(payload.clientId),asNullableString(payload.encounterId),
      asString(payload.sourceType,'workerCreated'),asNullableString(payload.sourceEntityId),
      asString(payload.reminderType,'generalFollowUp'),asString(payload.status,'active'),scheduledForUtc,
      asString(payload.originalTimeZone),asString(payload.originalLocalDate),asString(payload.originalLocalTime),
      1,'private',asNullableString(payload.note),accountId,asString(payload.createdAt,now),now,
      asNumber(payload.localVersion,1),serverVersion,
    ],
  );
}
