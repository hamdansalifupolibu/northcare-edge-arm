import type { Attachment, SyncQueueItem } from '../../../data/domain/entities/entities';
import type { ConsentStatus } from '../../../data/domain/enums/domainEnums';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import { isRepositoryError } from '../../../data/repositories/errors/RepositoryError';
import type { TransactionRunner } from '../../clients/application/createClientServices';
import { getAppConfig } from '../../../config/appConfig';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import { createLogger, sanitizeMeta } from '../../../logging/logger';
import { createExpoVoiceFileSystemGateway } from '../audio/expoFileSystemGateway';
import {
  createVoiceFileManager,
  type VoiceFileManager,
} from '../audio/fileManager';
import {
  assertRecordingAllowedByConsent,
  createVoiceRecordingConsent,
  type VoiceRecordingConsentDecision,
} from '../domain/consent';
import {
  VOICE_ATTACHMENT_OWNER_TYPE,
  VOICE_AUDIO_MIME_TYPE,
} from '../domain/constants';
import { isVoiceError, VoiceError } from '../domain/errors';
import { assertAllowedExtractionTarget } from '../domain/policies';
import type { StructuredExtractionSuggestionDraft } from '../domain/providers';
import type { VoiceRecordingListEntry } from '../domain/voiceRecordingSummary';
import type {
  VoiceCaptureSession,
  VoiceExtractionRun,
  VoiceExtractionSuggestion,
  VoiceRetentionStatus,
  VoiceTranscript,
} from '../domain/types';
import { selectExtractionProvider } from '../providers/extraction/selectExtractionProvider';
import {
  getExtractionSchema,
  requireDefaultExtractionSchema,
} from '../providers/extraction/schemas/registry';
import { selectTranscriptionProvider } from '../providers/transcription/selectTranscriptionProvider';
import {
  createManualTranscriptMarker,
  MANUAL_TRANSCRIPT_PROVIDER_ID,
} from '../providers/transcription/ManualTranscriptPath';
import { buildTranscriptSnippet } from '../domain/voiceRecordingNavigation';

const log = createLogger({ environment: getAppConfig().appEnv });

const MANUAL_TRANSCRIPT_MIN_LENGTH = 3;
const MANUAL_TRANSCRIPT_MAX_LENGTH = 8000;

export type VoiceSessionBundle = {
  readonly session: VoiceCaptureSession;
  readonly attachment: Attachment | null;
  readonly transcripts: readonly VoiceTranscript[];
  readonly extractionRuns: readonly {
    readonly run: VoiceExtractionRun;
    readonly suggestions: readonly VoiceExtractionSuggestion[];
  }[];
};

export type SecureInterruptResult = {
  readonly stopRecording: boolean;
  readonly stopPlayback: boolean;
  readonly hideSensitiveContent: boolean;
};

export type VoiceServices = {
  startSession(input: {
    readonly clientId: EntityId;
    readonly encounterId?: EntityId | null;
    readonly accountId: EntityId;
    readonly languageHint?: string | null;
  }): Promise<VoiceCaptureSession>;
  recordConsent(input: {
    readonly sessionId: EntityId;
    readonly status: VoiceRecordingConsentDecision;
    readonly accountId: EntityId;
  }): Promise<VoiceCaptureSession>;
  saveRecording(input: {
    readonly sessionId: EntityId;
    readonly tempUri: string;
    readonly durationMs: number | null;
    readonly accountId: EntityId;
  }): Promise<{ readonly session: VoiceCaptureSession; readonly attachment: Attachment }>;
  requestTranscription(input: {
    readonly sessionId: EntityId;
    readonly accountId: EntityId;
  }): Promise<VoiceTranscript>;
  saveManualTranscript(input: {
    readonly sessionId: EntityId;
    readonly transcriptText: string;
    readonly accountId: EntityId;
    readonly languageCode?: string | null;
  }): Promise<VoiceTranscript>;
  confirmTranscript(input: {
    readonly transcriptId: EntityId;
    readonly accountId: EntityId;
    readonly transcriptText?: string | null;
  }): Promise<VoiceTranscript>;
  requestExtraction(input: {
    readonly sessionId: EntityId;
    readonly transcriptId: EntityId;
    readonly accountId: EntityId;
    readonly schemaId?: string;
  }): Promise<{
    readonly run: VoiceExtractionRun;
    readonly suggestions: readonly VoiceExtractionSuggestion[];
  }>;
  reviewSuggestion(input: {
    readonly suggestionId: EntityId;
    readonly accountId: EntityId;
    readonly action: 'accept' | 'edit' | 'reject';
    readonly editedValue?: unknown;
    readonly rejectionReasonCode?: VoiceExtractionSuggestion['rejectionReasonCode'];
  }): Promise<VoiceExtractionSuggestion>;
  applyConfirmedSuggestions(input: {
    readonly sessionId: EntityId;
    readonly extractionRunId: EntityId;
    readonly accountId: EntityId;
    readonly workerConfirmed: boolean;
    readonly sessionUnlocked: boolean;
  }): Promise<{ readonly session: VoiceCaptureSession; readonly appliedCount: number }>;
  quickApplyExtraction(input: {
    readonly sessionId: EntityId;
    readonly accountId: EntityId;
    readonly suggestions: readonly VoiceExtractionSuggestion[];
    readonly sessionUnlocked: boolean;
    readonly extractedFieldsJson?: string;
  }): Promise<{ readonly appliedCount: number; readonly encounterId: EntityId | null }>;
  setRetentionDecision(input: {
    readonly sessionId: EntityId;
    readonly retentionStatus: Extract<VoiceRetentionStatus, 'retained' | 'pendingDecision'>;
    readonly accountId: EntityId;
  }): Promise<VoiceCaptureSession>;
  deleteAudio(input: {
    readonly sessionId: EntityId;
    readonly accountId: EntityId;
    readonly confirmed: boolean;
  }): Promise<VoiceCaptureSession>;
  discardSession(input: {
    readonly sessionId: EntityId;
    readonly accountId: EntityId;
  }): Promise<VoiceCaptureSession>;
  getSessionBundle(sessionId: EntityId): Promise<VoiceSessionBundle | null>;
  listRecordings(input: {
    readonly accountId: EntityId;
    readonly clientId?: EntityId | null;
    readonly includeDiscarded?: boolean;
    readonly limit?: number;
  }): Promise<readonly VoiceRecordingListEntry[]>;
  handleSecureInterrupt(input: {
    readonly reason: 'lock' | 'background';
    readonly sessionLocked: boolean;
  }): SecureInterruptResult;
};

function voiceAuditMeta(
  meta: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const allowedKeys = new Set([
    'sessionId',
    'attachmentId',
    'trnEntityId',
    'extractionRunId',
    'suggestionId',
    'providerId',
    'providerVersion',
    'acceptedCount',
    'editedCount',
    'rejectedCount',
    'appliedCount',
    'outcome',
    'retentionStatus',
    'consentStatus',
    'source',
    'schemaId',
    'schemaVersion',
    'reason',
  ]);
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (allowedKeys.has(key)) {
      filtered[key] = value;
    }
  }
  return sanitizeMeta(filtered) ?? {};
}

async function enqueueVoiceSync(
  repos: RepositoryContainer,
  input: {
    readonly entityType: string;
    readonly entityId: EntityId;
    readonly operation: 'create' | 'update' | 'delete' | 'uploadAttachment';
  },
): Promise<SyncQueueItem | null> {
  try {
    return await repos.syncQueue.enqueue(input);
  } catch (enqueueError) {
    if (isRepositoryError(enqueueError) && enqueueError.category === 'duplicate') {
      return null;
    }
    throw enqueueError;
  }
}

function parseJsonValue(json: string): unknown {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    throw new VoiceError('validationFailed', 'The stored value could not be read.');
  }
}

function serialiseValue(value: unknown): string {
  return JSON.stringify(value);
}

function assertManualTranscriptLength(text: string): void {
  const trimmed = text.trim();
  if (trimmed.length < MANUAL_TRANSCRIPT_MIN_LENGTH) {
    throw new VoiceError(
      'manualTranscriptRequired',
      'Enter a manual transcript with at least a few characters.',
    );
  }
  if (trimmed.length > MANUAL_TRANSCRIPT_MAX_LENGTH) {
    throw new VoiceError(
      'validationFailed',
      'The manual transcript is too long for this device.',
    );
  }
}

function resolveConfirmedValue(suggestion: VoiceExtractionSuggestion): unknown {
  if (suggestion.reviewStatus === 'rejected' || suggestion.reviewStatus === 'pendingReview') {
    throw new VoiceError(
      'suggestionNotReviewed',
      'Only accepted or edited suggestions can be applied.',
    );
  }
  const raw =
    suggestion.confirmedValueJson ?? suggestion.proposedValueJson;
  return parseJsonValue(raw);
}

export function createVoiceServices(
  repos: RepositoryContainer,
  tx: TransactionRunner,
  options?: { readonly fileManager?: VoiceFileManager },
): VoiceServices {
  const ids = getIdGenerator();
  const fileManager =
    options?.fileManager ??
    createVoiceFileManager(createExpoVoiceFileSystemGateway());

  async function loadBundle(sessionId: EntityId): Promise<VoiceSessionBundle | null> {
    const session = await repos.voiceCaptureSessions.findById(sessionId);
    if (!session) {
      return null;
    }
    const attachment = session.attachmentId
      ? await repos.attachments.findById(session.attachmentId)
      : null;
    const transcripts = await repos.voiceTranscripts.listBySession(sessionId);
    const runs = await repos.voiceExtractionRuns.listBySession(sessionId);
    const extractionRuns = await Promise.all(
      runs.map(async (run) => ({
        run,
        suggestions: await repos.voiceExtractionSuggestions.listByRun(run.id),
      })),
    );
    return { session, attachment, transcripts, extractionRuns };
  }

  async function requireSession(sessionId: EntityId): Promise<VoiceCaptureSession> {
    const session = await repos.voiceCaptureSessions.findById(sessionId);
    if (!session) {
      throw new VoiceError('sessionNotFound', 'Voice capture session not found.');
    }
    if (session.status === 'discarded') {
      throw new VoiceError('sessionNotFound', 'This voice capture session was discarded.');
    }
    return session;
  }

  async function resolveOpenEncounterForVoice(
    session: VoiceCaptureSession,
    accountId: EntityId,
  ): Promise<EntityId> {
    if (session.encounterId) {
      const existing = await repos.encounters.findById(session.encounterId);
      if (
        existing &&
        !existing.isDeleted &&
        (existing.status === 'draft' || existing.status === 'inProgress')
      ) {
        return existing.id;
      }
    }

    const activeDraft = await repos.encounters.findActiveDraftByClient(session.clientId);
    if (activeDraft) {
      return activeDraft.id;
    }

    const client = await repos.clients.findById(session.clientId);
    if (!client) {
      throw new VoiceError('notAuthorised', 'Client not found on this device.');
    }

    const encounter = await repos.encounters.createDraft({
      clientId: session.clientId,
      encounterType: 'other',
      facilityId: client.primaryFacilityId,
      workerAccountId: accountId,
      notes: 'Auto-created from Voice-to-Care confirmed extraction',
      accountId,
    });
    return encounter.id;
  }

  function voiceFieldNoteText(targetKey: string, value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    let rendered: string;
    if (typeof value === 'object') {
      const obj = value as {
        numericValue?: number;
        unit?: string;
        value?: string;
      };
      if (typeof obj.numericValue === 'number') {
        rendered = `${obj.numericValue}${obj.unit ? ` ${obj.unit}` : ''}`.trim();
      } else if (typeof obj.value === 'string') {
        rendered = obj.value.trim();
      } else {
        try {
          rendered = JSON.stringify(value);
        } catch {
          return null;
        }
      }
    } else {
      rendered = String(value).trim();
    }
    if (!rendered || rendered.toLowerCase() === 'null' || rendered.toLowerCase() === 'undefined') {
      return null;
    }
    if (rendered === '[object Object]') {
      return null;
    }
    const noteText = `[${targetKey}] ${rendered}`.trim();
    return noteText.length > 0 ? noteText : null;
  }

  async function appendVoiceFieldNote(input: {
    readonly encounterId: EntityId;
    readonly targetKey: string;
    readonly value: unknown;
    readonly accountId: EntityId;
  }): Promise<boolean> {
    const noteText = voiceFieldNoteText(input.targetKey, input.value);
    if (!noteText) {
      return false;
    }
    await repos.encounters.appendControlledVisitNote({
      id: input.encounterId,
      noteText,
      accountId: input.accountId,
    });
    return true;
  }

  return {
    async startSession(input) {
      const client = await repos.clients.findById(input.clientId);
      if (!client) {
        throw new VoiceError('notAuthorised', 'Client not found on this device.');
      }
      if (input.encounterId) {
        const encounter = await repos.encounters.findById(input.encounterId);
        if (!encounter || encounter.clientId !== input.clientId) {
          throw new VoiceError('notAuthorised', 'Visit context does not match this client.');
        }
      }
      const session = await repos.voiceCaptureSessions.create({
        clientId: input.clientId,
        encounterId: input.encounterId ?? null,
        status: 'consentPending',
        uiState: 'idle',
        consentStatus: 'unknown',
        languageHint: input.languageHint ?? null,
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_capture_started',
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: session.id,
          outcome: 'started',
        }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        operation: 'create',
      });
      log.info('voice_session_started', voiceAuditMeta({ sessionId: session.id }));
      return session;
    },

    async recordConsent(input) {
      const session = await requireSession(input.sessionId);
      const consent = createVoiceRecordingConsent({
        status: input.status,
        decidedAt: new Date().toISOString(),
        decidedByAccountId: input.accountId,
      });
      const nextUiState =
        consent.status === 'recorded' || consent.status === 'deferred' ? 'ready' : 'idle';
      const updated = await repos.voiceCaptureSessions.update({
        id: session.id,
        consentStatus: consent.status as ConsentStatus,
        consentVersion: consent.consentVersion,
        status:
          consent.status === 'declined'
            ? 'reviewRequired'
            : consent.status === 'recorded' || consent.status === 'deferred'
              ? 'readyToRecord'
              : session.status,
        uiState: nextUiState,
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_recording_consent_recorded',
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: session.id,
          consentStatus: consent.status,
        }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        operation: 'update',
      });
      return updated;
    },

    async saveRecording(input) {
      const session = await requireSession(input.sessionId);
      assertRecordingAllowedByConsent(session.consentStatus);

      const managed = await fileManager.promoteTempRecording({
        tempUri: input.tempUri,
        durationMs: input.durationMs,
      });

      const attachmentId = ids.nextId();
      let attachment!: Attachment;
      let updatedSession!: VoiceCaptureSession;

      await tx.withTransaction(async () => {
        attachment = await repos.attachments.create({
          id: attachmentId,
          ownerType: VOICE_ATTACHMENT_OWNER_TYPE,
          ownerId: session.id,
          fileUri: managed.managedUri,
          mimeType: managed.mimeType,
          fileSize: managed.fileSize,
          checksum: managed.checksum,
          durationMs: managed.durationMs,
          audioFormatVersion: managed.audioFormatVersion,
          originalFilename: managed.filename,
          accountId: input.accountId,
        });
        updatedSession = await repos.voiceCaptureSessions.update({
          id: session.id,
          attachmentId: attachment.id,
          status: 'recorded',
          uiState: 'recorded',
          durationMs: managed.durationMs,
          audioFormatVersion: managed.audioFormatVersion,
          accountId: input.accountId,
        });
        await repos.auditEvents.record({
          eventType: 'voice_capture_stopped',
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          actorAccountId: input.accountId,
          result: 'success',
          metadata: voiceAuditMeta({
            sessionId: session.id,
            attachmentId: attachment.id,
            outcome: 'saved',
          }),
        });
        await enqueueVoiceSync(repos, {
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          operation: 'update',
        });
        await enqueueVoiceSync(repos, {
          entityType: 'attachment',
          entityId: attachment.id,
          operation: 'uploadAttachment',
        });
      });

      log.info(
        'voice_recording_saved',
        voiceAuditMeta({
          sessionId: session.id,
          attachmentId: attachment!.id,
        }),
      );
      return { session: updatedSession!, attachment: attachment! };
    },

    async requestTranscription(input) {
      const session = await requireSession(input.sessionId);
      if (!session.attachmentId) {
        throw new VoiceError('recordingFailed', 'Save a recording before requesting transcription.');
      }
      const attachment = await repos.attachments.findById(session.attachmentId);
      if (!attachment) {
        throw new VoiceError('recordingFailed', 'Recording attachment not found.');
      }

      const environment = getAppConfig().appEnv;
      const provider = selectTranscriptionProvider(environment, session.languageHint);
      const result = await provider.transcribe({
        captureSessionId: session.id,
        audioUri: attachment.fileUri,
        mimeType: attachment.mimeType ?? VOICE_AUDIO_MIME_TYPE,
        durationMs: session.durationMs,
        languageHint: session.languageHint,
        providerConfigVersion: provider.version,
      });

      if (result.status !== 'completed') {
        await repos.auditEvents.record({
          eventType: 'voice_transcription_unavailable',
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          actorAccountId: input.accountId,
          result: 'failure',
          metadata: voiceAuditMeta({
            sessionId: session.id,
            providerId: provider.id,
            providerVersion: provider.version,
            outcome: result.status,
          }),
        });
        throw new VoiceError(
          'providerUnavailable',
          'Automatic transcription is not available in this build.',
        );
      }

      const transcript = await repos.voiceTranscripts.create({
        voiceCaptureSessionId: session.id,
        transcriptText: result.transcriptText,
        languageCode: result.detectedLanguage,
        providerId: result.providerId,
        providerVersion: result.providerVersion,
        source: result.isSynthetic ? 'developmentSimulation' : 'provider',
        status: 'readyForReview',
        isPartial: result.isPartial,
        isSynthetic: result.isSynthetic,
        accountId: input.accountId,
      });

      await repos.voiceCaptureSessions.update({
        id: session.id,
        status: 'transcriptReady',
        uiState: 'transcriptReady',
        transcriptionProviderId: result.providerId,
        transcriptionProviderVersion: result.providerVersion,
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_transcript_created',
        entityType: 'voiceTranscript',
        entityId: transcript.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: session.id,
          trnEntityId: transcript.id,
          providerId: result.providerId,
          providerVersion: result.providerVersion,
          source: result.isSynthetic ? 'developmentSimulation' : 'provider',
        }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceTranscript',
        entityId: transcript.id,
        operation: 'create',
      });
      return transcript;
    },

    async saveManualTranscript(input) {
      const session = await requireSession(input.sessionId);
      assertManualTranscriptLength(input.transcriptText);
      const marker = createManualTranscriptMarker();
      const transcript = await repos.voiceTranscripts.create({
        voiceCaptureSessionId: session.id,
        transcriptText: input.transcriptText.trim(),
        languageCode: input.languageCode ?? null,
        providerId: marker.providerId,
        providerVersion: marker.providerVersion,
        source: 'manual',
        status: 'readyForReview',
        isPartial: false,
        isSynthetic: false,
        accountId: input.accountId,
      });
      await repos.voiceCaptureSessions.update({
        id: session.id,
        status: 'transcriptReady',
        uiState: 'transcriptReady',
        transcriptionProviderId: MANUAL_TRANSCRIPT_PROVIDER_ID,
        transcriptionProviderVersion: marker.providerVersion,
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_transcript_created',
        entityType: 'voiceTranscript',
        entityId: transcript.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: session.id,
          trnEntityId: transcript.id,
          providerId: marker.providerId,
          source: 'manual',
        }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceTranscript',
        entityId: transcript.id,
        operation: 'create',
      });
      return transcript;
    },

    async confirmTranscript(input) {
      const existing = await repos.voiceTranscripts.findById(input.transcriptId);
      if (!existing) {
        throw new VoiceError('transcriptRequired', 'Transcript not found.');
      }
      if (input.transcriptText != null) {
        assertManualTranscriptLength(input.transcriptText);
      }
      const confirmed = await repos.voiceTranscripts.confirm({
        id: input.transcriptId,
        transcriptText: input.transcriptText?.trim() ?? null,
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_transcript_confirmed',
        entityType: 'voiceTranscript',
        entityId: confirmed.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: existing.voiceCaptureSessionId,
          trnEntityId: confirmed.id,
        }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceTranscript',
        entityId: confirmed.id,
        operation: 'update',
      });
      return confirmed;
    },

    async requestExtraction(input) {
      const session = await requireSession(input.sessionId);
      const transcript = await repos.voiceTranscripts.findById(input.transcriptId);
      if (!transcript || transcript.voiceCaptureSessionId !== session.id) {
        throw new VoiceError('transcriptRequired', 'Confirmed transcript required for extraction.');
      }
      if (transcript.status !== 'confirmed') {
        throw new VoiceError(
          'transcriptRequired',
          'Confirm the transcript before requesting extraction.',
        );
      }

      const environment = getAppConfig().appEnv;
      const schema = input.schemaId
        ? getExtractionSchema(input.schemaId, environment)
        : requireDefaultExtractionSchema(environment);
      if (!schema) {
        throw new VoiceError(
          'schemaUnavailable',
          'No approved voice extraction schema is available.',
        );
      }

      const provider = selectExtractionProvider(environment);
      const result = await provider.extract({
        captureSessionId: session.id,
        transcriptId: transcript.id,
        confirmedTranscript: transcript.transcriptText,
        schema,
        clientCategory: null,
        visitType: null,
        screeningTemplateId: null,
        screeningTemplateVersion: null,
        languageCode: transcript.languageCode,
        providerConfigVersion: provider.version,
      });

      if (result.status !== 'completed') {
        await repos.auditEvents.record({
          eventType: 'voice_extraction_unavailable',
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          actorAccountId: input.accountId,
          result: 'failure',
          metadata: voiceAuditMeta({
            sessionId: session.id,
            providerId: provider.id,
            outcome: result.status,
          }),
        });
        throw new VoiceError(
          'providerUnavailable',
          'Automatic extraction is not available in this build.',
        );
      }

      if (result.suggestions.length === 0) {
        await repos.auditEvents.record({
          eventType: 'voice_extraction_unavailable',
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          actorAccountId: input.accountId,
          result: 'failure',
          metadata: voiceAuditMeta({
            sessionId: session.id,
            providerId: provider.id,
            outcome: 'empty',
          }),
        });
        throw new VoiceError(
          'validationFailed',
          'No fields could be extracted from this transcript. Edit the transcript and try again.',
        );
      }

      const run = await repos.voiceExtractionRuns.create({
        voiceCaptureSessionId: session.id,
        transcriptId: transcript.id,
        providerId: result.providerId,
        providerVersion: result.providerVersion,
        extractionSchemaId: schema.schemaId,
        extractionSchemaVersion: schema.version,
        status: 'completed',
        completedAt: new Date().toISOString(),
        accountId: input.accountId,
      });

      const suggestionInputs = result.suggestions.map(
        (draft: StructuredExtractionSuggestionDraft) => {
          assertAllowedExtractionTarget(draft.targetType, draft.targetKey);
          return {
            extractionRunId: run.id,
            targetType: draft.targetType,
            targetKey: draft.targetKey,
            proposedValueJson: serialiseValue(draft.proposedValue),
            valueType: draft.valueType,
            sourceStart: draft.sourceStart,
            sourceEnd: draft.sourceEnd,
            confidenceCategory: draft.confidenceCategory,
            accountId: input.accountId,
          };
        },
      );
      const suggestions = await repos.voiceExtractionSuggestions.createMany(suggestionInputs);

      await repos.voiceCaptureSessions.update({
        id: session.id,
        status: 'reviewRequired',
        uiState: 'reviewRequired',
        extractionProviderId: result.providerId,
        extractionProviderVersion: result.providerVersion,
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_extraction_requested',
        entityType: 'voiceExtractionRun',
        entityId: run.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: session.id,
          extractionRunId: run.id,
          providerId: result.providerId,
          schemaId: schema.schemaId,
          schemaVersion: schema.version,
          acceptedCount: suggestions.length,
        }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceExtractionRun',
        entityId: run.id,
        operation: 'create',
      });
      return { run, suggestions };
    },

    async reviewSuggestion(input) {
      const suggestion = await repos.voiceExtractionSuggestions.findById(input.suggestionId);
      if (!suggestion) {
        throw new VoiceError('suggestionNotReviewed', 'Suggestion not found.');
      }
      assertAllowedExtractionTarget(suggestion.targetType, suggestion.targetKey);

      if (input.action === 'accept') {
        return repos.voiceExtractionSuggestions.updateReview({
          id: suggestion.id,
          reviewStatus: 'accepted',
          confirmedValueJson: suggestion.proposedValueJson,
          accountId: input.accountId,
        });
      }

      if (input.action === 'edit') {
        if (input.editedValue === undefined) {
          throw new VoiceError('validationFailed', 'Provide an edited value.');
        }
        if (
          suggestion.valueType === 'boolean' &&
          (input.editedValue === false || input.editedValue === 'No' || input.editedValue === 'no')
        ) {
          const proposed = parseJsonValue(suggestion.proposedValueJson);
          if (proposed === null) {
            throw new VoiceError(
              'validationFailed',
              'Missing speech must not become No. Leave uncertain answers unset.',
            );
          }
        }
        return repos.voiceExtractionSuggestions.updateReview({
          id: suggestion.id,
          reviewStatus: 'edited',
          confirmedValueJson: serialiseValue(input.editedValue),
          accountId: input.accountId,
        });
      }

      return repos.voiceExtractionSuggestions.updateReview({
        id: suggestion.id,
        reviewStatus: 'rejected',
        confirmedValueJson: null,
        rejectionReasonCode: input.rejectionReasonCode ?? 'other',
        accountId: input.accountId,
      });
    },

    async applyConfirmedSuggestions(input) {
      if (!input.workerConfirmed) {
        throw new VoiceError(
          'suggestionNotReviewed',
          'Worker confirmation is required before applying suggestions.',
        );
      }
      if (!input.sessionUnlocked) {
        throw new VoiceError('sessionLocked', 'Unlock the app before applying voice suggestions.');
      }

      const session = await requireSession(input.sessionId);
      const run = await repos.voiceExtractionRuns.findById(input.extractionRunId);
      if (!run || run.voiceCaptureSessionId !== session.id) {
        throw new VoiceError('suggestionNotReviewed', 'Extraction run not found.');
      }

      const suggestions = await repos.voiceExtractionSuggestions.listByRun(run.id);
      const applicable = suggestions.filter(
        (s) => s.reviewStatus === 'accepted' || s.reviewStatus === 'edited',
      );
      const pending = suggestions.filter((s) => s.reviewStatus === 'pendingReview');
      if (pending.length > 0) {
        throw new VoiceError(
          'suggestionNotReviewed',
          'Review every suggestion individually before applying.',
        );
      }

      let appliedCount = 0;
      let updatedSession!: VoiceCaptureSession;

      await tx.withTransaction(async () => {
        const encounterId = await resolveOpenEncounterForVoice(session, input.accountId);

        for (const suggestion of applicable) {
          assertAllowedExtractionTarget(suggestion.targetType, suggestion.targetKey);
          const value = resolveConfirmedValue(suggestion);

          if (suggestion.targetType === 'screeningDraftAnswer') {
            const screening = await repos.screenings.findByEncounterId(encounterId);
            if (!screening) {
              continue;
            }
            if (suggestion.valueType === 'boolean') {
              if (value === null || value === undefined) {
                continue;
              }
              await repos.screenings.saveAnswer({
                screeningId: screening.id,
                questionKey: suggestion.targetKey,
                valueType: 'boolean',
                booleanValue: value === true,
                accountId: input.accountId,
              });
            } else if (suggestion.valueType === 'text' || suggestion.valueType === 'note') {
              await repos.screenings.saveAnswer({
                screeningId: screening.id,
                questionKey: suggestion.targetKey,
                valueType: 'text',
                textValue: String(value),
                accountId: input.accountId,
              });
            }
          } else if (suggestion.targetType === 'measurementDraft') {
            const measurement =
              typeof value === 'object' && value !== null
                ? (value as {
                    numericValue?: number;
                    unit?: string;
                    measurementType?: string;
                  })
                : null;
            if (!measurement?.numericValue) {
              if (
                !(await appendVoiceFieldNote({
                  encounterId,
                  targetKey: suggestion.targetKey,
                  value,
                  accountId: input.accountId,
                }))
              ) {
                continue;
              }
            } else {
              await repos.measurements.create({
                clientId: session.clientId,
                encounterId,
                measurementType: (measurement.measurementType as 'temperature') ?? 'temperature',
                numericValue: measurement.numericValue,
                unit: (measurement.unit as 'celsius') ?? 'celsius',
                accountId: input.accountId,
              });
            }
          } else if (
            suggestion.targetType === 'controlledVisitNote' ||
            suggestion.targetType === 'encounterContext'
          ) {
            if (
              !(await appendVoiceFieldNote({
                encounterId,
                targetKey: suggestion.targetKey,
                value,
                accountId: input.accountId,
              }))
            ) {
              continue;
            }
          } else if (suggestion.targetType === 'followUpDraft') {
            continue;
          }

          appliedCount += 1;
        }

        if (session.attachmentId) {
          const attachment = await repos.attachments.findById(session.attachmentId);
          if (attachment) {
            try {
              await fileManager.deleteManagedFile(attachment.fileUri);
            } catch {
              // Best-effort cleanup
            }
            await repos.attachments.softDelete(attachment.id, input.accountId);
          }
        }

        updatedSession = await repos.voiceCaptureSessions.update({
          id: session.id,
          attachmentId: null,
          retentionStatus: 'deleted',
          status: 'confirmed',
          uiState: 'confirmed',
          completedAt: new Date().toISOString(),
          accountId: input.accountId,
        });

        const rejectedCount = suggestions.filter((s) => s.reviewStatus === 'rejected').length;
        const editedCount = suggestions.filter((s) => s.reviewStatus === 'edited').length;
        await repos.auditEvents.record({
          eventType: 'voice_suggestions_applied',
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          actorAccountId: input.accountId,
          result: 'success',
          metadata: voiceAuditMeta({
            sessionId: session.id,
            extractionRunId: run.id,
            appliedCount,
            acceptedCount: applicable.length,
            editedCount,
            rejectedCount,
          }),
        });
        await enqueueVoiceSync(repos, {
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          operation: 'update',
        });
      });

      return { session: updatedSession!, appliedCount };
    },

    async quickApplyExtraction(input) {
      if (!input.sessionUnlocked) {
        throw new VoiceError('sessionLocked', 'Unlock the app before applying voice suggestions.');
      }
      if (input.suggestions.length === 0) {
        throw new VoiceError(
          'validationFailed',
          'Nothing could be saved from the reviewed fields. Try editing a field and save again.',
        );
      }
      const session = await requireSession(input.sessionId);
      console.info('[quickApply] Session loaded', {
        sessionId: session.id,
        clientId: session.clientId,
        encounterId: session.encounterId,
        suggestionCount: input.suggestions.length,
      });
      let appliedCount = 0;
      let encounterId = session.encounterId;
      let firstWriteError: unknown = null;

      await tx.withTransaction(async () => {
        encounterId = await resolveOpenEncounterForVoice(session, input.accountId);

        for (const suggestion of input.suggestions) {
          const tag = `[quickApply ${suggestion.targetKey}]`;
          try {
            assertAllowedExtractionTarget(suggestion.targetType, suggestion.targetKey);
          } catch (e) {
            console.warn(tag, 'Skipped: target not allowed', e);
            continue;
          }

          const rawJson = suggestion.confirmedValueJson ?? suggestion.proposedValueJson;
          if (!rawJson) {
            console.info(tag, 'Skipped: empty value json');
            continue;
          }
          let value: unknown;
          try {
            value = JSON.parse(rawJson) as unknown;
          } catch (e) {
            // Edited plain text may already be stored as a JSON string; keep raw text.
            value = rawJson;
            console.warn(tag, 'JSON parse failed; treating as plain text', e);
          }
          if (value === null || value === undefined) {
            console.info(tag, 'Skipped: null value');
            continue;
          }

          console.info(tag, 'Applying', {
            targetType: suggestion.targetType,
            valuePreview: String(value).slice(0, 60),
          });

          try {
            if (suggestion.targetType === 'measurementDraft') {
              const measurement =
                typeof value === 'object' && value !== null
                  ? (value as {
                      numericValue?: number;
                      unit?: string;
                      measurementType?: string;
                    })
                  : null;
              if (!measurement?.numericValue) {
                if (
                  !(await appendVoiceFieldNote({
                    encounterId,
                    targetKey: suggestion.targetKey,
                    value,
                    accountId: input.accountId,
                  }))
                ) {
                  continue;
                }
              } else {
                const label = suggestion.targetKey === 'weight' ? 'Weight' : 'Temperature';
                const display = `${measurement.numericValue} ${measurement.unit ?? ''}`.trim();
                await repos.encounters.appendControlledVisitNote({
                  id: encounterId,
                  noteText: `[${label}] ${display}`,
                  accountId: input.accountId,
                });
              }
            } else if (
              suggestion.targetType === 'controlledVisitNote' ||
              suggestion.targetType === 'encounterContext'
            ) {
              if (
                !(await appendVoiceFieldNote({
                  encounterId,
                  targetKey: suggestion.targetKey,
                  value,
                  accountId: input.accountId,
                }))
              ) {
                continue;
              }
            } else if (suggestion.targetType === 'screeningDraftAnswer') {
              const screening = await repos.screenings.findByEncounterId(encounterId);
              if (!screening) {
                // No screening draft yet — keep the answer as a visit note instead of dropping it.
                if (
                  !(await appendVoiceFieldNote({
                    encounterId,
                    targetKey: suggestion.targetKey,
                    value,
                    accountId: input.accountId,
                  }))
                ) {
                  continue;
                }
              } else if (suggestion.valueType === 'boolean') {
                if (value === null || value === undefined) continue;
                await repos.screenings.saveAnswer({
                  screeningId: screening.id,
                  questionKey: suggestion.targetKey,
                  valueType: 'boolean',
                  booleanValue: value === true,
                  accountId: input.accountId,
                });
              } else {
                await repos.screenings.saveAnswer({
                  screeningId: screening.id,
                  questionKey: suggestion.targetKey,
                  valueType: 'text',
                  textValue: String(value),
                  accountId: input.accountId,
                });
              }
            } else if (suggestion.targetType === 'followUpDraft') {
              if (
                !(await appendVoiceFieldNote({
                  encounterId,
                  targetKey: suggestion.targetKey,
                  value,
                  accountId: input.accountId,
                }))
              ) {
                continue;
              }
            } else {
              continue;
            }
            appliedCount += 1;
          } catch (writeErr) {
            console.error(tag, 'Write FAILED', writeErr);
            firstWriteError ??= writeErr;
          }
        }

        if (appliedCount === 0) {
          // Throw after loop but still inside the transaction so writes roll back cleanly.
          // DatabaseManager preserves VoiceError so the UI can show this message.
          if (firstWriteError) {
            throw firstWriteError;
          }
          throw new VoiceError(
            'validationFailed',
            'Nothing could be saved from the reviewed fields. Try editing a field and save again.',
          );
        }

        await repos.voiceCaptureSessions.update({
          id: session.id,
          status: 'confirmed',
          uiState: 'confirmed',
          completedAt: new Date().toISOString(),
          accountId: input.accountId,
        });

        await repos.auditEvents.record({
          eventType: 'voice_suggestions_applied',
          entityType: 'voiceCaptureSession',
          entityId: session.id,
          actorAccountId: input.accountId,
          result: 'success',
          metadata: voiceAuditMeta({
            sessionId: session.id,
            appliedCount,
          }),
        });
      });

      return { appliedCount, encounterId };
    },

    async setRetentionDecision(input) {
      const session = await requireSession(input.sessionId);
      const updated = await repos.voiceCaptureSessions.update({
        id: session.id,
        retentionStatus: input.retentionStatus,
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType:
          input.retentionStatus === 'retained'
            ? 'voice_recording_retained'
            : 'voice_retention_decision_recorded',
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: session.id,
          retentionStatus: input.retentionStatus,
        }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        operation: 'update',
      });
      return updated;
    },

    async deleteAudio(input) {
      if (!input.confirmed) {
        throw new VoiceError(
          'deletionConfirmationRequired',
          'Confirm audio deletion before continuing.',
        );
      }
      const session = await requireSession(input.sessionId);
      if (!session.attachmentId) {
        return session;
      }
      const attachment = await repos.attachments.findById(session.attachmentId);
      if (attachment) {
        await fileManager.deleteManagedFile(attachment.fileUri);
        await repos.attachments.softDelete(attachment.id, input.accountId);
      }
      const updated = await repos.voiceCaptureSessions.update({
        id: session.id,
        attachmentId: null,
        retentionStatus: 'deleted',
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_recording_deleted',
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({
          sessionId: session.id,
          attachmentId: session.attachmentId,
        }),
      });
      if (session.attachmentId) {
        await enqueueVoiceSync(repos, {
          entityType: 'attachment',
          entityId: session.attachmentId,
          operation: 'delete',
        });
      }
      await enqueueVoiceSync(repos, {
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        operation: 'update',
      });
      return updated;
    },

    async discardSession(input) {
      const session = await requireSession(input.sessionId);
      if (session.attachmentId) {
        const attachment = await repos.attachments.findById(session.attachmentId);
        if (attachment) {
          try {
            await fileManager.deleteManagedFile(attachment.fileUri);
          } catch {
            // Best-effort cleanup for discarded sessions.
          }
          await repos.attachments.softDelete(attachment.id, input.accountId);
        }
      }
      const updated = await repos.voiceCaptureSessions.update({
        id: session.id,
        status: 'discarded',
        uiState: 'discarded',
        discardedAt: new Date().toISOString(),
        accountId: input.accountId,
      });
      await repos.auditEvents.record({
        eventType: 'voice_capture_discarded',
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        actorAccountId: input.accountId,
        result: 'success',
        metadata: voiceAuditMeta({ sessionId: session.id }),
      });
      await enqueueVoiceSync(repos, {
        entityType: 'voiceCaptureSession',
        entityId: session.id,
        operation: 'update',
      });
      return updated;
    },

    async getSessionBundle(sessionId) {
      return loadBundle(sessionId);
    },

    async listRecordings(input) {
      const sessions = await repos.voiceCaptureSessions.listRecentByAccount({
        accountId: input.accountId,
        clientId: input.clientId ?? null,
        includeDiscarded: input.includeDiscarded ?? false,
        limit: input.limit ?? 50,
      });

      const entries: VoiceRecordingListEntry[] = [];
      for (const session of sessions) {
        try {
          const client = await repos.clients.findById(session.clientId);
          const displayName = client
            ? client.preferredName?.trim() ||
              `${client.givenName} ${client.familyName}`.trim()
            : 'Client';
          let transcriptSnippet: string | null = null;
          let reviewableFieldCount = 0;
          try {
            const transcripts = await repos.voiceTranscripts.listBySession(session.id);
            transcriptSnippet = buildTranscriptSnippet(transcripts[0]?.transcriptText);
          } catch {
            transcriptSnippet = null;
          }
          try {
            const extractionRuns = await repos.voiceExtractionRuns.listBySession(session.id);
            const latestRun = extractionRuns[0] ?? null;
            if (latestRun) {
              const latestSuggestions = await repos.voiceExtractionSuggestions.listByRun(
                latestRun.id,
              );
              reviewableFieldCount = latestSuggestions.length;
            }
          } catch {
            reviewableFieldCount = 0;
          }
          entries.push({
            sessionId: session.id,
            clientId: session.clientId,
            clientName: displayName,
            encounterId: session.encounterId,
            status: session.status,
            durationMs: session.durationMs,
            languageHint: session.languageHint,
            transcriptSnippet,
            hasAudio: session.attachmentId != null,
            reviewableFieldCount,
            updatedAt: session.updatedAt,
            createdAt: session.createdAt,
          });
        } catch (sessionError) {
          console.warn('[listRecordings] Skipped unreadable session', sessionError);
        }
      }

      return entries;
    },

    handleSecureInterrupt(input) {
      const hideSensitiveContent = input.sessionLocked;
      const stopRecording = input.reason === 'lock' || input.reason === 'background';
      const stopPlayback = input.reason === 'lock' || input.reason === 'background';
      return { stopRecording, stopPlayback, hideSensitiveContent };
    },
  };
}

export function mapVoiceServiceError(error: unknown): string {
  if (isVoiceError(error)) {
    return error.sanitisedMessage;
  }
  if (isRepositoryError(error)) {
    if (error.category === 'notFound') {
      return 'Voice capture session not found.';
    }
    if (
      error.category === 'conflict' ||
      error.category === 'validation' ||
      error.category === 'constraint'
    ) {
      return mapUserFacingError(error, 'Something went wrong while saving voice information. Please try again.');
    }
    if (error.category === 'transactionFailed') {
      const prefix = 'Transaction failed: ';
      if (error.message.startsWith(prefix)) {
        return mapUserFacingError(
          new Error(error.message.slice(prefix.length)),
          'Could not save voice information on this device. Please try again.',
        );
      }
      return 'Could not save voice information on this device. Please try again.';
    }
    return 'Something went wrong while saving voice information. Please try again.';
  }
  return mapUserFacingError(error, 'Something went wrong. Please try again.');
}
