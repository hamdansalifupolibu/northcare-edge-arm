import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId, type EntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  VoiceCaptureSession,
  VoiceExtractionRun,
  VoiceExtractionSuggestion,
  VoiceTranscript,
} from '../../../features/voice/domain/types';
import {
  VOICE_CAPTURE_SESSION_STATUSES,
  VOICE_CONFIDENCE_CATEGORIES,
  VOICE_EXTRACTION_RUN_STATUSES,
  VOICE_ALLOWED_TARGET_TYPES,
  VOICE_REJECTION_REASON_CODES,
  VOICE_RETENTION_STATUSES,
  VOICE_SUGGESTION_REVIEW_STATUSES,
  VOICE_SUGGESTION_VALUE_TYPES,
  VOICE_TRANSCRIPT_SOURCES,
  VOICE_TRANSCRIPT_STATUSES,
} from '../../../features/voice/domain/types';
import { CONSENT_STATUSES, isOneOf } from '../../domain/enums/domainEnums';
import { RECORDING_STATES } from '../../../features/voice/domain/states';
import type {
  CreateVoiceCaptureSessionInput,
  CreateVoiceExtractionRunInput,
  CreateVoiceSuggestionInput,
  CreateVoiceTranscriptInput,
  UpdateVoiceCaptureSessionInput,
  UpdateVoiceSuggestionReviewInput,
  VoiceCaptureSessionRepository,
  VoiceExtractionRunRepository,
  VoiceExtractionSuggestionRepository,
  VoiceTranscriptRepository,
} from '../contracts/voiceTypes';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';
import {
  boolToInt,
  intToBool,
  mapMetadata,
  newMetadataValues,
  optionalEntityId,
  type MetadataRow,
} from './rowHelpers';

function mapMetadataRow(row: MetadataRow & { updated_at?: string | null }) {
  return mapMetadata({
    ...row,
    updated_at: row.updated_at ?? row.created_at,
  });
}

function mapSession(
  row: MetadataRow & {
    client_id: string;
    encounter_id: string | null;
    attachment_id: string | null;
    status: string;
    ui_state: string;
    consent_status: string;
    consent_version: string | null;
    language_hint: string | null;
    duration_ms: number | null;
    audio_format_version: number | null;
    transcription_provider_id: string | null;
    transcription_provider_version: string | null;
    extraction_provider_id: string | null;
    extraction_provider_version: string | null;
    retention_status: string;
    completed_at: string | null;
    discarded_at: string | null;
  },
): VoiceCaptureSession {
  if (
    !isOneOf(row.status, VOICE_CAPTURE_SESSION_STATUSES) ||
    !isOneOf(row.ui_state, RECORDING_STATES) ||
    !isOneOf(row.consent_status, CONSENT_STATUSES) ||
    !isOneOf(row.retention_status, VOICE_RETENTION_STATUSES)
  ) {
    throw new RepositoryError('dataIntegrity', 'Invalid voice capture session row');
  }
  const meta = mapMetadata(row);
  return {
    id: meta.id,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt,
    createdByAccountId: meta.createdByAccountId,
    updatedByAccountId: meta.updatedByAccountId,
    localVersion: meta.localVersion,
    serverVersion: meta.serverVersion,
    syncStatus: meta.syncStatus,
    lastSyncedAt: meta.lastSyncedAt,
    deletedAt: meta.deletedAt,
    isDeleted: meta.isDeleted,
    clientId: assertEntityId(row.client_id),
    encounterId: row.encounter_id ? assertEntityId(row.encounter_id) : null,
    attachmentId: row.attachment_id ? assertEntityId(row.attachment_id) : null,
    status: row.status,
    uiState: row.ui_state,
    consentStatus: row.consent_status,
    consentVersion: row.consent_version,
    languageHint: row.language_hint,
    durationMs: row.duration_ms,
    audioFormatVersion: row.audio_format_version,
    transcriptionProviderId: row.transcription_provider_id,
    transcriptionProviderVersion: row.transcription_provider_version,
    extractionProviderId: row.extraction_provider_id,
    extractionProviderVersion: row.extraction_provider_version,
    retentionStatus: row.retention_status,
    completedAt: row.completed_at,
    discardedAt: row.discarded_at,
  };
}

export function createSqliteVoiceCaptureSessionRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): VoiceCaptureSessionRepository {
  const repo: VoiceCaptureSessionRepository = {
    async create(input: CreateVoiceCaptureSessionInput): Promise<VoiceCaptureSession> {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'localOnly',
        });
        await db.runAsync(
          `INSERT INTO voice_capture_sessions (
            id, client_id, encounter_id, attachment_id, status, ui_state,
            consent_status, consent_version, language_hint, duration_ms, audio_format_version,
            retention_status,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, NULL, NULL, 'pendingDecision',
            ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            meta.id,
            input.clientId,
            input.encounterId ?? null,
            input.status ?? 'consentPending',
            input.uiState ?? 'idle',
            input.consentStatus ?? 'unknown',
            input.languageHint ?? null,
            meta.created_at,
            meta.updated_at,
            meta.created_by_account_id,
            meta.updated_by_account_id,
            meta.local_version,
            meta.server_version,
            meta.sync_status,
            meta.last_synced_at,
            meta.deleted_at,
          ],
        );
        const created = await repo.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Voice session read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'voiceSession.create');
      }
    },
    async findById(id) {
      try {
        const row = await db.getFirstAsync<Parameters<typeof mapSession>[0]>(
          `SELECT * FROM voice_capture_sessions WHERE id = ? AND is_deleted = 0`,
          [id],
        );
        return row ? mapSession(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'voiceSession.findById');
      }
    },
    async listByClient(clientId) {
      try {
        const rows = await db.getAllAsync<Parameters<typeof mapSession>[0]>(
          `SELECT * FROM voice_capture_sessions
           WHERE client_id = ? AND is_deleted = 0
           ORDER BY created_at DESC`,
          [clientId],
        );
        return rows.map(mapSession);
      } catch (error) {
        throw mapSqliteError(error, 'voiceSession.listByClient');
      }
    },
    async listRecentByAccount(input) {
      try {
        const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
        const includeDiscarded = input.includeDiscarded ? 1 : 0;
        const clientId = input.clientId ?? null;
        const rows = await db.getAllAsync<Parameters<typeof mapSession>[0]>(
          `SELECT * FROM voice_capture_sessions
           WHERE is_deleted = 0
             AND (created_by_account_id = ? OR updated_by_account_id = ?)
             AND (? IS NULL OR client_id = ?)
             AND (? = 1 OR status != 'discarded')
           ORDER BY updated_at DESC
           LIMIT ?`,
          [input.accountId, input.accountId, clientId, clientId, includeDiscarded, limit],
        );
        // Skip corrupt historical rows instead of failing the whole list.
        const sessions: VoiceCaptureSession[] = [];
        for (const row of rows) {
          try {
            sessions.push(mapSession(row));
          } catch {
            continue;
          }
        }
        return sessions;
      } catch (error) {
        throw mapSqliteError(error, 'voiceSession.listRecentByAccount');
      }
    },
    async update(input: UpdateVoiceCaptureSessionInput) {
      try {
        const existing = await repo.findById(input.id);
        if (!existing) {
          throw new RepositoryError('notFound', 'Voice capture session not found');
        }
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE voice_capture_sessions SET
            attachment_id = ?, status = ?, ui_state = ?, consent_status = ?, consent_version = ?,
            language_hint = ?, duration_ms = ?, audio_format_version = ?,
            transcription_provider_id = ?, transcription_provider_version = ?,
            extraction_provider_id = ?, extraction_provider_version = ?,
            retention_status = ?, completed_at = ?, discarded_at = ?,
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [
            input.attachmentId !== undefined
              ? input.attachmentId
              : existing.attachmentId,
            input.status ?? existing.status,
            input.uiState ?? existing.uiState,
            input.consentStatus ?? existing.consentStatus,
            input.consentVersion !== undefined
              ? input.consentVersion
              : existing.consentVersion,
            input.languageHint !== undefined ? input.languageHint : existing.languageHint,
            input.durationMs !== undefined ? input.durationMs : existing.durationMs,
            input.audioFormatVersion !== undefined
              ? input.audioFormatVersion
              : existing.audioFormatVersion,
            input.transcriptionProviderId !== undefined
              ? input.transcriptionProviderId
              : existing.transcriptionProviderId,
            input.transcriptionProviderVersion !== undefined
              ? input.transcriptionProviderVersion
              : existing.transcriptionProviderVersion,
            input.extractionProviderId !== undefined
              ? input.extractionProviderId
              : existing.extractionProviderId,
            input.extractionProviderVersion !== undefined
              ? input.extractionProviderVersion
              : existing.extractionProviderVersion,
            input.retentionStatus ?? existing.retentionStatus,
            input.completedAt !== undefined ? input.completedAt : existing.completedAt,
            input.discardedAt !== undefined ? input.discardedAt : existing.discardedAt,
            now,
            input.accountId ?? null,
            input.id,
          ],
        );
        const updated = await repo.findById(input.id);
        if (!updated) {
          throw new RepositoryError('unknown', 'Voice session update read-back failed');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'voiceSession.update');
      }
    },
  };
  return repo;
}

export function createSqliteVoiceTranscriptRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): VoiceTranscriptRepository {
  const repo: VoiceTranscriptRepository = {
    async create(input: CreateVoiceTranscriptInput): Promise<VoiceTranscript> {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'localOnly',
        });
        await db.runAsync(
          `INSERT INTO voice_transcripts (
            id, voice_capture_session_id, transcript_text, language_code,
            provider_id, provider_version, source, status, is_partial, is_synthetic,
            created_at, confirmed_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            meta.id,
            input.voiceCaptureSessionId,
            input.transcriptText,
            input.languageCode ?? null,
            input.providerId,
            input.providerVersion,
            input.source,
            input.status,
            boolToInt(input.isPartial),
            boolToInt(input.isSynthetic),
            meta.created_at,
            meta.created_by_account_id,
            meta.updated_by_account_id,
            meta.local_version,
            meta.server_version,
            meta.sync_status,
            meta.last_synced_at,
            meta.deleted_at,
          ],
        );
        const created = await repo.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Voice transcript read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'voiceTranscript.create');
      }
    },
    async findById(id) {
      try {
        const row = await db.getFirstAsync<
          MetadataRow & {
            voice_capture_session_id: string;
            transcript_text: string;
            language_code: string | null;
            provider_id: string;
            provider_version: string;
            source: string;
            status: string;
            is_partial: number;
            is_synthetic: number;
            confirmed_at: string | null;
          }
        >(`SELECT * FROM voice_transcripts WHERE id = ? AND is_deleted = 0`, [id]);
        if (
          !row ||
          !isOneOf(row.source, VOICE_TRANSCRIPT_SOURCES) ||
          !isOneOf(row.status, VOICE_TRANSCRIPT_STATUSES)
        ) {
          return null;
        }
        const meta = mapMetadataRow(row);
        return {
          id: meta.id,
          voiceCaptureSessionId: assertEntityId(row.voice_capture_session_id),
          transcriptText: row.transcript_text,
          languageCode: row.language_code,
          providerId: row.provider_id,
          providerVersion: row.provider_version,
          source: row.source,
          status: row.status,
          isPartial: intToBool(row.is_partial),
          isSynthetic: intToBool(row.is_synthetic),
          createdAt: meta.createdAt,
          confirmedAt: row.confirmed_at,
          createdByAccountId: meta.createdByAccountId,
          updatedByAccountId: meta.updatedByAccountId,
          localVersion: meta.localVersion,
          syncStatus: meta.syncStatus,
        };
      } catch (error) {
        throw mapSqliteError(error, 'voiceTranscript.findById');
      }
    },
    async listBySession(sessionId) {
      try {
        const rows = await db.getAllAsync<{ id: string }>(
          `SELECT id FROM voice_transcripts
           WHERE voice_capture_session_id = ? AND is_deleted = 0
           ORDER BY created_at DESC`,
          [sessionId],
        );
        const items: VoiceTranscript[] = [];
        for (const row of rows) {
          const item = await repo.findById(assertEntityId(row.id));
          if (item) {
            items.push(item);
          }
        }
        return items;
      } catch (error) {
        throw mapSqliteError(error, 'voiceTranscript.listBySession');
      }
    },
    async confirm(input) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE voice_transcripts SET
            transcript_text = COALESCE(?, transcript_text),
            status = 'confirmed', confirmed_at = ?,
            updated_by_account_id = ?, local_version = local_version + 1,
            sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [input.transcriptText ?? null, now, input.accountId ?? null, input.id],
        );
        const updated = await repo.findById(input.id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Voice transcript not found');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'voiceTranscript.confirm');
      }
    },
  };
  return repo;
}

export function createSqliteVoiceExtractionRunRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): VoiceExtractionRunRepository {
  const repo: VoiceExtractionRunRepository = {
    async create(input: CreateVoiceExtractionRunInput): Promise<VoiceExtractionRun> {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'localOnly',
        });
        await db.runAsync(
          `INSERT INTO voice_extraction_runs (
            id, voice_capture_session_id, transcript_id, provider_id, provider_version,
            extraction_schema_id, extraction_schema_version, status,
            created_at, completed_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            meta.id,
            input.voiceCaptureSessionId,
            input.transcriptId,
            input.providerId,
            input.providerVersion,
            input.extractionSchemaId,
            input.extractionSchemaVersion,
            input.status,
            meta.created_at,
            input.completedAt ?? null,
            meta.created_by_account_id,
            meta.updated_by_account_id,
            meta.local_version,
            meta.server_version,
            meta.sync_status,
            meta.last_synced_at,
            meta.deleted_at,
          ],
        );
        const created = await repo.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Extraction run read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'voiceExtractionRun.create');
      }
    },
    async findById(id) {
      try {
        const row = await db.getFirstAsync<
          MetadataRow & {
            voice_capture_session_id: string;
            transcript_id: string;
            provider_id: string;
            provider_version: string;
            extraction_schema_id: string;
            extraction_schema_version: number;
            status: string;
            completed_at: string | null;
          }
        >(`SELECT * FROM voice_extraction_runs WHERE id = ? AND is_deleted = 0`, [id]);
        if (!row || !isOneOf(row.status, VOICE_EXTRACTION_RUN_STATUSES)) {
          return null;
        }
        const meta = mapMetadataRow(row);
        return {
          id: meta.id,
          voiceCaptureSessionId: assertEntityId(row.voice_capture_session_id),
          transcriptId: assertEntityId(row.transcript_id),
          providerId: row.provider_id,
          providerVersion: row.provider_version,
          extractionSchemaId: row.extraction_schema_id,
          extractionSchemaVersion: row.extraction_schema_version,
          status: row.status,
          createdAt: meta.createdAt,
          completedAt: row.completed_at,
          createdByAccountId: meta.createdByAccountId,
          localVersion: meta.localVersion,
          syncStatus: meta.syncStatus,
        };
      } catch (error) {
        throw mapSqliteError(error, 'voiceExtractionRun.findById');
      }
    },
    async listBySession(sessionId) {
      try {
        const rows = await db.getAllAsync<{ id: string }>(
          `SELECT id FROM voice_extraction_runs
           WHERE voice_capture_session_id = ? AND is_deleted = 0
           ORDER BY created_at DESC`,
          [sessionId],
        );
        const items: VoiceExtractionRun[] = [];
        for (const row of rows) {
          const item = await repo.findById(assertEntityId(row.id));
          if (item) {
            items.push(item);
          }
        }
        return items;
      } catch (error) {
        throw mapSqliteError(error, 'voiceExtractionRun.listBySession');
      }
    },
  };
  return repo;
}

export function createSqliteVoiceExtractionSuggestionRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): VoiceExtractionSuggestionRepository {
  const repo: VoiceExtractionSuggestionRepository = {
    async createMany(inputs: readonly CreateVoiceSuggestionInput[]) {
      const created: VoiceExtractionSuggestion[] = [];
      for (const input of inputs) {
        created.push(await repo.create(input));
      }
      return created;
    },
    async create(input: CreateVoiceSuggestionInput): Promise<VoiceExtractionSuggestion> {
      try {
        const meta = newMetadataValues({
          id: input.id ?? ids.nextId(),
          now: clock.nowIso(),
          accountId: input.accountId ?? null,
          syncStatus: 'localOnly',
        });
        await db.runAsync(
          `INSERT INTO voice_extraction_suggestions (
            id, extraction_run_id, target_type, target_key, proposed_value_json,
            confirmed_value_json, value_type, source_start, source_end, source_text_hash,
            confidence_category, review_status, reviewed_by_account_id, reviewed_at,
            rejection_reason_code,
            created_at, updated_at, created_by_account_id, updated_by_account_id,
            local_version, server_version, sync_status, last_synced_at, deleted_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'pendingReview', NULL, NULL, NULL,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            meta.id,
            input.extractionRunId,
            input.targetType,
            input.targetKey,
            input.proposedValueJson,
            input.valueType,
            input.sourceStart ?? null,
            input.sourceEnd ?? null,
            input.sourceTextHash ?? null,
            input.confidenceCategory,
            meta.created_at,
            meta.updated_at,
            meta.created_by_account_id,
            meta.updated_by_account_id,
            meta.local_version,
            meta.server_version,
            meta.sync_status,
            meta.last_synced_at,
            meta.deleted_at,
          ],
        );
        const created = await repo.findById(meta.id);
        if (!created) {
          throw new RepositoryError('unknown', 'Suggestion read-back failed');
        }
        return created;
      } catch (error) {
        throw mapSqliteError(error, 'voiceSuggestion.create');
      }
    },
    async findById(id) {
      try {
        const row = await db.getFirstAsync<
          MetadataRow & {
            extraction_run_id: string;
            target_type: string;
            target_key: string;
            proposed_value_json: string;
            confirmed_value_json: string | null;
            value_type: string;
            source_start: number | null;
            source_end: number | null;
            source_text_hash: string | null;
            confidence_category: string;
            review_status: string;
            reviewed_by_account_id: string | null;
            reviewed_at: string | null;
            rejection_reason_code: string | null;
          }
        >(`SELECT * FROM voice_extraction_suggestions WHERE id = ? AND is_deleted = 0`, [id]);
        if (
          !row ||
          !isOneOf(row.target_type, VOICE_ALLOWED_TARGET_TYPES) ||
          !isOneOf(row.value_type, VOICE_SUGGESTION_VALUE_TYPES) ||
          !isOneOf(row.confidence_category, VOICE_CONFIDENCE_CATEGORIES) ||
          !isOneOf(row.review_status, VOICE_SUGGESTION_REVIEW_STATUSES) ||
          (row.rejection_reason_code != null &&
            !isOneOf(row.rejection_reason_code, VOICE_REJECTION_REASON_CODES))
        ) {
          return null;
        }
        const meta = mapMetadata(row);
        return {
          id: meta.id,
          extractionRunId: assertEntityId(row.extraction_run_id),
          targetType: row.target_type,
          targetKey: row.target_key,
          proposedValueJson: row.proposed_value_json,
          confirmedValueJson: row.confirmed_value_json,
          valueType: row.value_type,
          sourceStart: row.source_start,
          sourceEnd: row.source_end,
          sourceTextHash: row.source_text_hash,
          confidenceCategory: row.confidence_category,
          reviewStatus: row.review_status,
          // Dev/auth actor ids are opaque strings (e.g. "dev-dual-…"), not UUID EntityIds.
          // Persist them for audit, but coerce non-UUIDs to null on domain read-back —
          // same pattern as optionalEntityId for created/updated_by metadata.
          reviewedByAccountId: optionalEntityId(row.reviewed_by_account_id),
          reviewedAt: row.reviewed_at,
          rejectionReasonCode: row.rejection_reason_code,
          localVersion: meta.localVersion,
          syncStatus: meta.syncStatus,
        };
      } catch (error) {
        throw mapSqliteError(error, 'voiceSuggestion.findById');
      }
    },
    async listByRun(runId) {
      try {
        const rows = await db.getAllAsync<{ id: string }>(
          `SELECT id FROM voice_extraction_suggestions
           WHERE extraction_run_id = ? AND is_deleted = 0
           ORDER BY created_at ASC`,
          [runId],
        );
        const items: VoiceExtractionSuggestion[] = [];
        for (const row of rows) {
          const item = await repo.findById(assertEntityId(row.id));
          if (item) {
            items.push(item);
          }
        }
        return items;
      } catch (error) {
        throw mapSqliteError(error, 'voiceSuggestion.listByRun');
      }
    },
    async updateReview(input: UpdateVoiceSuggestionReviewInput) {
      try {
        const now = clock.nowIso();
        await db.runAsync(
          `UPDATE voice_extraction_suggestions SET
            review_status = ?, confirmed_value_json = ?,
            reviewed_by_account_id = ?, reviewed_at = ?,
            rejection_reason_code = ?,
            updated_at = ?, updated_by_account_id = ?,
            local_version = local_version + 1, sync_status = 'pendingUpdate'
           WHERE id = ? AND is_deleted = 0`,
          [
            input.reviewStatus,
            input.confirmedValueJson ?? null,
            input.accountId ?? null,
            now,
            input.rejectionReasonCode ?? null,
            now,
            input.accountId ?? null,
            input.id,
          ],
        );
        const updated = await repo.findById(input.id);
        if (!updated) {
          throw new RepositoryError('notFound', 'Suggestion not found');
        }
        return updated;
      } catch (error) {
        throw mapSqliteError(error, 'voiceSuggestion.updateReview');
      }
    },
  };
  return repo;
}

export type { EntityId };
