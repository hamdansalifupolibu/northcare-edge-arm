import type {
  Measurement,
  NutritionAssessment,
  NutritionGuidanceResolution,
  NutritionReferenceResult,
  SyncQueueItem,
} from '../../../data/domain/entities/entities';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import type { Clock } from '../../../data/domain/value-objects/clock';
import { createSystemClock } from '../../../data/domain/value-objects/clock';
import { assertDateOnly } from '../../../data/domain/value-objects/dateOnly';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import { getAppConfig } from '../../../config/appConfig';
import { mapUserFacingError } from '../../../error/mapUserFacingError';
import type { AppEnvironment } from '../../../types/env';
import type { TransactionRunner } from '../../clients/application/createClientServices';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import {
  getGuidancePackById,
  getReferencePackById,
  getTemplateForPersistedAssessment,
  listApplicableTemplatesForClient,
  listLoadableGuidancePacks,
  listLoadableReferencePacks,
  listAllRegisteredTemplatesForInventory,
  listAllRegisteredReferencePacksForInventory,
  listAllRegisteredGuidancePacksForInventory,
  countApprovedForPilotTemplates,
  countApprovedForPilotReferencePacks,
  countApprovedForPilotGuidancePacks,
} from '../content/registry';
import { NutritionError } from '../domain/errors';
import { NUTRITION_ENGINE_VERSION, type NutritionAssessmentType } from '../domain/statuses';
import type {
  NutritionAssessmentTemplateDefinition,
  NutritionGuidanceResolutionResult,
  NutritionReferenceEvaluationResult,
} from '../domain/types';
import { encodeNutritionAnswerForPersistence, decodePersistedNutritionAnswer } from '../engine/answerCodec';
import {
  evaluateNutritionCompleteness,
  nutritionTemplateAsScreening,
} from '../engine/completenessEvaluator';
import { resolveNutritionGuidance } from '../engine/guidanceResolver';
import { evaluateNutritionReference } from '../engine/referenceEvaluator';
import { evaluateNutritionGrowthIndicators } from '../engine/growth/growthIndicatorEvaluator';
import type { NutritionGrowthEvaluationResult } from '../engine/growth/growthIndicatorEvaluator';
import { evaluateNutritionIycfIndicators } from '../engine/iycf/iycfEvaluator';
import type { NutritionIycfEvaluationResult } from '../engine/iycf/iycfEvaluator';
import {
  parseStoredNutritionIndicators,
  serializeStoredNutritionIndicators,
} from '../engine/storedNutritionIndicators';
import {
  assertTemplateApplicableToClient,
  resolveApplicableTemplates,
  resolveClientAgeContext,
} from '../engine/templateResolver';

export type NutritionDraft = {
  readonly assessment: NutritionAssessment;
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly measurements: readonly Measurement[];
  readonly template: NutritionAssessmentTemplateDefinition;
  readonly progressSectionId: string | null;
};

export type NutritionDetails = {
  readonly assessment: NutritionAssessment;
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly measurements: readonly Measurement[];
  readonly template: NutritionAssessmentTemplateDefinition | null;
  readonly referenceResult: NutritionReferenceResult | null;
  readonly guidanceResolution: NutritionGuidanceResolution | null;
  readonly referenceEvaluation: NutritionReferenceEvaluationResult | null;
  readonly growthEvaluation: NutritionGrowthEvaluationResult | null;
  readonly iycfEvaluation: NutritionIycfEvaluationResult | null;
  readonly guidanceResult: NutritionGuidanceResolutionResult | null;
};

export type StartNutritionResult =
  | { readonly kind: 'started'; readonly draft: NutritionDraft }
  | { readonly kind: 'existingDraft'; readonly draft: NutritionDraft }
  | {
      readonly kind: 'moreInformationRequired';
      readonly message: string;
    }
  | { readonly kind: 'unavailable'; readonly message: string };

async function loadDraft(
  repos: RepositoryContainer,
  assessment: NutritionAssessment,
): Promise<NutritionDraft | null> {
  if (!assessment.templateId || assessment.templateVersion == null) {
    return null;
  }
  const template = getTemplateForPersistedAssessment({
    templateId: assessment.templateId,
    templateVersion: assessment.templateVersion,
  });
  if (!template) {
    return null;
  }
  const persisted = await repos.nutritionAssessments.listAnswers(assessment.id);
  const answers = persisted.map(decodePersistedNutritionAnswer);
  const links = await repos.nutritionAssessments.listMeasurementLinks(assessment.id);
  const clientMeasurements = await repos.measurements.listByClient(assessment.clientId);
  const linkedIds = new Set(links.map((l) => l.measurementId));
  const measurements = clientMeasurements.filter((m) => linkedIds.has(m.id));
  return {
    assessment,
    answers,
    measurements,
    template,
    progressSectionId: assessment.progressSectionId,
  };
}

function todayDateOnly(clock: Clock): string {
  return assertDateOnly(clock.nowIso().slice(0, 10));
}

function auditSafeMetadata(
  metadata: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  // Never include answers, measurements, guidance body, or client identity.
  return metadata;
}

export type NutritionServices = {
  listApplicableTypes(input: {
    readonly clientId: EntityId;
    readonly environment?: AppEnvironment;
  }): Promise<{
    readonly templates: readonly NutritionAssessmentTemplateDefinition[];
    readonly moreInformationRequired: boolean;
  }>;
  startAssessment(input: {
    readonly clientId: EntityId;
    readonly accountId: EntityId;
    readonly assessmentType: NutritionAssessmentType;
    readonly encounterId?: EntityId | null;
    readonly facilityId?: EntityId | null;
    readonly environment?: AppEnvironment;
  }): Promise<StartNutritionResult>;
  getDraft(assessmentId: EntityId): Promise<NutritionDraft | null>;
  saveDraft(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
    readonly progressSectionId?: string | null;
  }): Promise<NutritionDraft>;
  discardDraft(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
    readonly confirmed: boolean;
  }): Promise<NutritionAssessment>;
  recordAnswer(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
    readonly answer: RecordedScreeningAnswer;
  }): Promise<NutritionDraft>;
  recordMeasurement(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
    readonly questionId: string;
    readonly numericValue: number;
    readonly unit: Measurement['unit'];
    readonly measurementType: Measurement['measurementType'];
  }): Promise<NutritionDraft>;
  reviewAssessment(assessmentId: EntityId): Promise<{
    readonly draft: NutritionDraft;
    readonly incompleteRequired: readonly string[];
  } | null>;
  completeAssessment(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
    readonly confirmed: boolean;
    readonly environment?: AppEnvironment;
  }): Promise<{
    readonly details: NutritionDetails;
    readonly syncItems: readonly SyncQueueItem[];
  }>;
  getHistory(clientId: EntityId): Promise<readonly NutritionAssessment[]>;
  listRecentAssessments(limit?: number): Promise<readonly NutritionAssessment[]>;
  getInterpretationCode(assessmentId: EntityId): Promise<string | null>;
  getDetails(assessmentId: EntityId): Promise<NutritionDetails | null>;
  acknowledgeGuidance(input: {
    readonly assessmentId: EntityId;
    readonly resolutionId: EntityId;
    readonly accountId: EntityId;
  }): Promise<NutritionGuidanceResolution>;
  startCorrection(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
  }): Promise<{ readonly assessmentId: EntityId; readonly clientId: EntityId }>;
  correctAssessment(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
    readonly reasonCode: string;
    readonly answers: readonly RecordedScreeningAnswer[];
    readonly environment?: AppEnvironment;
  }): Promise<NutritionDetails>;
  softDeleteAssessment(input: {
    readonly assessmentId: EntityId;
    readonly accountId: EntityId;
    readonly reason: string;
    readonly confirmed: boolean;
  }): Promise<void>;
  getScreeningTemplate(template: NutritionAssessmentTemplateDefinition): ReturnType<
    typeof nutritionTemplateAsScreening
  >;
};

const NUTRITION_ACTION_FALLBACK = 'Unable to complete the nutrition action.';

export function mapNutritionServiceError(error: unknown): string {
  if (error instanceof NutritionError) {
    return error.message;
  }
  if (error instanceof Error) {
    console.error('[Nutrition] Service error:', error.message, error);
  }
  return mapUserFacingError(error, NUTRITION_ACTION_FALLBACK);
}

export function createNutritionServices(
  repos: RepositoryContainer,
  tx: TransactionRunner,
  ids: IdGenerator = getIdGenerator(),
  clock: Clock = createSystemClock(),
): NutritionServices {
  return {
    getScreeningTemplate(template) {
      return nutritionTemplateAsScreening(template);
    },

    async listApplicableTypes({ clientId, environment }) {
      const client = await repos.clients.findById(clientId);
      if (!client || client.isDeleted) {
        throw new NutritionError('notFound', 'Client not found.');
      }
      const resolved = resolveApplicableTemplates({
        client,
        referenceDateOnly: todayDateOnly(clock),
        environment: environment ?? getAppConfig().appEnv,
      });
      return {
        templates: resolved.templates,
        moreInformationRequired: resolved.moreInformationRequired && resolved.templates.length === 0,
      };
    },

    async startAssessment({
      clientId,
      accountId,
      assessmentType,
      encounterId = null,
      facilityId = null,
      environment,
    }) {
      const client = await repos.clients.findById(clientId);
      if (!client || client.isDeleted) {
        throw new NutritionError('notFound', 'Client not found.');
      }
      const env = environment ?? getAppConfig().appEnv;
      const existing = await repos.nutritionAssessments.findDraftByClient(clientId);
      if (existing) {
        const draft = await loadDraft(repos, existing);
        if (draft) {
          return { kind: 'existingDraft', draft };
        }
      }

      const applicable = resolveApplicableTemplates({
        client,
        referenceDateOnly: todayDateOnly(clock),
        assessmentType,
        environment: env,
      });
      if (applicable.moreInformationRequired && applicable.templates.length === 0) {
        return {
          kind: 'moreInformationRequired',
          message: 'More age information is required before starting this nutrition assessment.',
        };
      }
      const template = applicable.templates.find((t) => t.assessmentType === assessmentType);
      if (!template) {
        const anyForCategory = listApplicableTemplatesForClient({
          category: client.category,
          environment: env,
        });
        if (anyForCategory.length === 0) {
          return {
            kind: 'unavailable',
            message: 'Nutrition assessment unavailable. An approved template is not available.',
          };
        }
        return {
          kind: 'unavailable',
          message: 'This nutrition assessment type is not available for this client.',
        };
      }

      assertTemplateApplicableToClient({
        template,
        client,
        referenceDateOnly: todayDateOnly(clock),
      });

      const now = clock.nowIso();
      let created!: NutritionAssessment;
      await tx.withTransaction(async () => {
        created = await repos.nutritionAssessments.create({
          clientId,
          encounterId,
          facilityId,
          assessmentDate: todayDateOnly(clock),
          assessmentType: template.assessmentType,
          templateId: template.templateId,
          templateVersion: template.version,
          startedAt: now,
          status: 'draft',
          engineVersion: NUTRITION_ENGINE_VERSION,
          accountId,
        });
        await repos.auditEvents.record({
          eventType: 'nutrition_assessment_started',
          entityType: 'nutritionAssessment',
          entityId: created.id,
          actorAccountId: accountId,
          result: 'success',
          metadata: auditSafeMetadata({
            templateId: template.templateId,
            templateVersion: template.version,
            assessmentType: template.assessmentType,
          }),
        });
      });

      const draft = await loadDraft(repos, created);
      if (!draft) {
        throw new NutritionError('notFound', 'Nutrition draft could not be loaded.');
      }
      return { kind: 'started', draft };
    },

    async getDraft(assessmentId) {
      const assessment = await repos.nutritionAssessments.findById(assessmentId);
      if (!assessment || assessment.status !== 'draft') {
        return null;
      }
      return loadDraft(repos, assessment);
    },

    async saveDraft({ assessmentId, accountId, progressSectionId }) {
      const assessment = await repos.nutritionAssessments.findById(assessmentId);
      if (!assessment || assessment.status !== 'draft') {
        return null;
      }
      const updated = await repos.nutritionAssessments.update({
        id: assessmentId,
        accountId,
        progressSectionId: progressSectionId ?? assessment.progressSectionId,
      });
      await repos.auditEvents.record({
        eventType: 'nutrition_draft_saved',
        entityType: 'nutritionAssessment',
        entityId: assessmentId,
        actorAccountId: accountId,
        result: 'success',
        metadata: auditSafeMetadata({ templateId: assessment.templateId }),
      });
      const draft = await loadDraft(repos, updated);
      if (!draft) {
        throw new NutritionError('notFound', 'Nutrition draft could not be loaded.');
      }
      return draft;
    },

    async discardDraft({ assessmentId, accountId, confirmed }) {
      if (!confirmed) {
        throw new NutritionError('confirmationRequired', 'Discard requires confirmation.');
      }
      const assessment = await repos.nutritionAssessments.findById(assessmentId);
      if (!assessment || assessment.status !== 'draft') {
        throw new NutritionError('draftRequired', 'Only draft assessments can be discarded.');
      }
      return repos.nutritionAssessments.update({
        id: assessmentId,
        accountId,
        status: 'cancelled',
        discardReason: 'workerDiscarded',
      });
    },

    async recordAnswer({ assessmentId, accountId, answer }) {
      const assessment = await repos.nutritionAssessments.findById(assessmentId);
      if (!assessment || assessment.status !== 'draft') {
        throw new NutritionError('draftRequired', 'Answers can only be recorded on drafts.');
      }
      await repos.nutritionAssessments.saveAnswer(
        encodeNutritionAnswerForPersistence({
          nutritionAssessmentId: assessmentId,
          answer,
          accountId,
        }),
      );
      const updated = await repos.nutritionAssessments.findById(assessmentId);
      const draft = updated ? await loadDraft(repos, updated) : null;
      if (!draft) {
        throw new NutritionError('notFound', 'Nutrition draft could not be loaded.');
      }
      return draft;
    },

    async recordMeasurement({
      assessmentId,
      accountId,
      questionId,
      numericValue,
      unit,
      measurementType,
    }) {
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        throw new NutritionError(
          'invalidMeasurement',
          'Measurement value failed technical validation.',
        );
      }
      const assessment = await repos.nutritionAssessments.findById(assessmentId);
      if (!assessment || assessment.status !== 'draft') {
        throw new NutritionError('draftRequired', 'Measurements can only be recorded on drafts.');
      }
      const measurement = await repos.measurements.create({
        clientId: assessment.clientId,
        encounterId: assessment.encounterId,
        measurementType,
        numericValue,
        unit,
        accountId,
        notes: `nutritionQuestion:${questionId}`,
      });
      await repos.nutritionAssessments.linkMeasurement({
        nutritionAssessmentId: assessmentId,
        measurementId: measurement.id,
        questionKey: questionId,
        accountId,
      });
      await repos.nutritionAssessments.saveAnswer(
        encodeNutritionAnswerForPersistence({
          nutritionAssessmentId: assessmentId,
          answer: {
            questionId,
            state: 'answered',
            value: { kind: 'measurement', value: numericValue, unit },
          },
          accountId,
        }),
      );
      const updated = await repos.nutritionAssessments.findById(assessmentId);
      const draft = updated ? await loadDraft(repos, updated) : null;
      if (!draft) {
        throw new NutritionError('notFound', 'Nutrition draft could not be loaded.');
      }
      return draft;
    },

    async reviewAssessment(assessmentId) {
      const draft = await this.getDraft(assessmentId);
      if (!draft) {
        return null;
      }
      const completeness = evaluateNutritionCompleteness(draft.template, draft.answers);
      return { draft, incompleteRequired: completeness.incompleteRequired };
    },

    async completeAssessment({ assessmentId, accountId, confirmed, environment }) {
      if (!confirmed) {
        throw new NutritionError(
          'confirmationRequired',
          'Worker confirmation is required to complete the nutrition assessment.',
        );
      }
      const draft = await this.getDraft(assessmentId);
      if (!draft) {
        throw new NutritionError('draftRequired', 'Draft assessment required for completion.');
      }
      const completeness = evaluateNutritionCompleteness(draft.template, draft.answers);
      if (completeness.incompleteRequired.length > 0) {
        throw new NutritionError(
          'validation',
          'Required nutrition information is incomplete.',
        );
      }

      const client = await repos.clients.findById(draft.assessment.clientId);
      if (!client) {
        throw new NutritionError('notFound', 'Client not found.');
      }
      const env = environment ?? getAppConfig().appEnv;
      const age = resolveClientAgeContext(client, todayDateOnly(clock));
      const referencePackId = draft.template.referencePackIds[0] ?? null;
      const referencePack = referencePackId
        ? getReferencePackById(referencePackId, undefined, env)
        : null;
      const packLoadable = referencePack != null;
      const referenceEvaluation = evaluateNutritionReference({
        pack: referencePack,
        packLoadable,
        answers: completeness.resolvedAnswers,
        measurements: draft.measurements,
        age,
      });

      const growthEvaluation = evaluateNutritionGrowthIndicators({
        answers: completeness.resolvedAnswers,
        measurements: draft.measurements,
        age,
      });

      const iycfEvaluation = evaluateNutritionIycfIndicators({
        answers: completeness.resolvedAnswers,
        age,
      });

      const guidancePackId = draft.template.guidancePackIds[0] ?? null;
      const guidancePack = guidancePackId
        ? getGuidancePackById(guidancePackId, undefined, env)
        : null;
      const guidanceResult = resolveNutritionGuidance({
        pack: guidancePack,
        packLoadable: guidancePack != null,
        templateId: draft.template.templateId,
        clientCategory: client.category,
        answers: completeness.resolvedAnswers,
        referenceResult: referenceEvaluation,
      });

      const now = clock.nowIso();
      const syncItems: SyncQueueItem[] = [];
      let completed!: NutritionAssessment;
      let referenceRow: NutritionReferenceResult | null = null;
      let guidanceRow: NutritionGuidanceResolution | null = null;

      try {
        await tx.withTransaction(async () => {
        for (const answer of completeness.resolvedAnswers) {
          await repos.nutritionAssessments.saveAnswer(
            encodeNutritionAnswerForPersistence({
              nutritionAssessmentId: assessmentId,
              answer,
              accountId,
            }),
          );
        }

        completed = await repos.nutritionAssessments.update({
          id: assessmentId,
          accountId,
          status: 'completed',
          completedAt: now,
          confirmedByAccountId: accountId,
          confirmedAt: now,
          guidanceContentVersion:
            guidanceResult.guidancePackId && guidanceResult.guidancePackVersion != null
              ? `${guidanceResult.guidancePackId}@${guidanceResult.guidancePackVersion}`
              : null,
          syncStatus: 'pendingUpdate',
        });

        referenceRow = await repos.nutritionAssessments.createReferenceResult({
          nutritionAssessmentId: assessmentId,
          referencePackId: referenceEvaluation.referencePackId ?? 'none',
          referencePackVersion: referenceEvaluation.referencePackVersion ?? 0,
          engineVersion: referenceEvaluation.engineVersion,
          resultStatus: referenceEvaluation.status,
          interpretationCode: referenceEvaluation.interpretationCode,
          derivedValue: referenceEvaluation.derivedValue,
          derivedUnit: referenceEvaluation.derivedUnit,
          missingInformationJson: JSON.stringify(referenceEvaluation.missingInformation),
          inputMeasurementIdsJson: JSON.stringify(referenceEvaluation.inputMeasurementIds),
          explanationId: referenceEvaluation.explanationId,
          growthIndicatorsJson: serializeStoredNutritionIndicators({
            growth: growthEvaluation,
            iycf: iycfEvaluation,
          }),
          calculatedAt: now,
          isDevelopment: referenceEvaluation.isDevelopment,
          accountId,
        });

        guidanceRow = await repos.nutritionAssessments.createGuidanceResolution({
          nutritionAssessmentId: assessmentId,
          guidancePackId: guidanceResult.guidancePackId,
          guidancePackVersion: guidanceResult.guidancePackVersion,
          resolutionStatus: guidanceResult.outcome,
          guidanceIdsJson: JSON.stringify(guidanceResult.guidanceIds),
          resolvedAt: now,
          isDevelopment: guidanceResult.isDevelopment,
          accountId,
        });

        await repos.auditEvents.record({
          eventType: 'nutrition_assessment_completed',
          entityType: 'nutritionAssessment',
          entityId: assessmentId,
          actorAccountId: accountId,
          result: 'success',
          metadata: auditSafeMetadata({
            templateId: draft.template.templateId,
            templateVersion: draft.template.version,
            referenceStatus: referenceEvaluation.status,
            guidanceOutcome: guidanceResult.outcome,
          }),
        });

        await repos.auditEvents.record({
          eventType:
            referenceEvaluation.status === 'referencePackUnavailable' ||
            referenceEvaluation.status === 'referencePackUnapproved'
              ? 'nutrition_reference_pack_unavailable'
              : 'nutrition_reference_result_produced',
          entityType: 'nutritionReferenceResult',
          entityId: referenceRow.id,
          actorAccountId: accountId,
          result: 'success',
          metadata: auditSafeMetadata({
            resultStatus: referenceEvaluation.status,
            referencePackId: referenceEvaluation.referencePackId,
            referencePackVersion: referenceEvaluation.referencePackVersion,
          }),
        });

        await repos.auditEvents.record({
          eventType:
            guidanceResult.outcome === 'guidanceAvailable'
              ? 'nutrition_guidance_resolved'
              : 'nutrition_guidance_unavailable',
          entityType: 'nutritionGuidanceResolution',
          entityId: guidanceRow.id,
          actorAccountId: accountId,
          result: 'success',
          metadata: auditSafeMetadata({
            outcome: guidanceResult.outcome,
            guidancePackId: guidanceResult.guidancePackId,
            guidancePackVersion: guidanceResult.guidancePackVersion,
          }),
        });

        syncItems.push(
          await repos.syncQueue.enqueue({
            entityType: 'nutritionAssessment',
            entityId: assessmentId,
            operation: 'update',
            payloadVersion: 1,
          }),
        );
        syncItems.push(
          await repos.syncQueue.enqueue({
            entityType: 'nutritionReferenceResult',
            entityId: referenceRow.id,
            operation: 'create',
            payloadVersion: 1,
          }),
        );
        syncItems.push(
          await repos.syncQueue.enqueue({
            entityType: 'nutritionGuidanceResolution',
            entityId: guidanceRow.id,
            operation: 'create',
            payloadVersion: 1,
          }),
        );
      });
      } catch (txError) {
        console.error('[Nutrition] completeAssessment transaction FAILED:', txError);
        throw txError;
      }

      return {
        details: {
          assessment: completed,
          answers: completeness.resolvedAnswers,
          measurements: draft.measurements,
          template: draft.template,
          referenceResult: referenceRow,
          guidanceResolution: guidanceRow,
          referenceEvaluation,
          growthEvaluation,
          iycfEvaluation,
          guidanceResult,
        },
        syncItems,
      };
    },

    async getHistory(clientId) {
      return repos.nutritionAssessments.listByClient(clientId);
    },

    async listRecentAssessments(limit = 20) {
      return repos.nutritionAssessments.listRecent(limit);
    },

    async getInterpretationCode(assessmentId) {
      try {
        const results = await repos.nutritionAssessments.listReferenceResults(assessmentId);
        return results[0]?.interpretationCode ?? null;
      } catch {
        return null;
      }
    },

    async getDetails(assessmentId) {
      const assessment = await repos.nutritionAssessments.findById(assessmentId);
      if (!assessment) {
        return null;
      }
      const template =
        assessment.templateId && assessment.templateVersion != null
          ? getTemplateForPersistedAssessment({
              templateId: assessment.templateId,
              templateVersion: assessment.templateVersion,
            })
          : null;
      const answers = (await repos.nutritionAssessments.listAnswers(assessmentId)).map(
        decodePersistedNutritionAnswer,
      );
      const links = await repos.nutritionAssessments.listMeasurementLinks(assessmentId);
      const clientMeasurements = await repos.measurements.listByClient(assessment.clientId);
      const linkedIds = new Set(links.map((l) => l.measurementId));
      const measurements = clientMeasurements.filter((m) => linkedIds.has(m.id));
      const referenceResults =
        await repos.nutritionAssessments.listReferenceResults(assessmentId);
      const guidanceResolutions =
        await repos.nutritionAssessments.listGuidanceResolutions(assessmentId);
      const referenceResult = referenceResults[0] ?? null;
      const guidanceResolution = guidanceResolutions[0] ?? null;

      let referenceEvaluation: NutritionReferenceEvaluationResult | null = null;
      let growthEvaluation: NutritionGrowthEvaluationResult | null = null;
      let iycfEvaluation: NutritionIycfEvaluationResult | null = null;
      let guidanceResult: NutritionGuidanceResolutionResult | null = null;
      if (template && assessment.status === 'completed') {
        const client = await repos.clients.findById(assessment.clientId);
        if (client) {
          const env = getAppConfig().appEnv;
          const referencePack = referenceResult
            ? getReferencePackById(
                referenceResult.referencePackId,
                referenceResult.referencePackVersion,
                env,
              ) ??
              (referenceResult.isDevelopment
                ? getReferencePackById(referenceResult.referencePackId, referenceResult.referencePackVersion, 'development')
                : null)
            : null;
          // For historical display, use persisted statuses rather than re-evaluating silently.
          referenceEvaluation = {
            status: referenceResult?.resultStatus as NutritionReferenceEvaluationResult['status'],
            referencePackId: referenceResult?.referencePackId ?? null,
            referencePackVersion: referenceResult?.referencePackVersion ?? null,
            engineVersion: referenceResult?.engineVersion ?? NUTRITION_ENGINE_VERSION,
            interpretationCode: referenceResult?.interpretationCode ?? null,
            derivedValue: referenceResult?.derivedValue ?? null,
            derivedUnit: (referenceResult?.derivedUnit as NutritionReferenceEvaluationResult['derivedUnit']) ?? null,
            explanationId: referenceResult?.explanationId ?? null,
            missingInformation: referenceResult?.missingInformationJson
              ? (JSON.parse(referenceResult.missingInformationJson) as string[])
              : [],
            inputMeasurementIds: referenceResult?.inputMeasurementIdsJson
              ? (JSON.parse(referenceResult.inputMeasurementIdsJson) as string[])
              : [],
            isDevelopment: referenceResult?.isDevelopment ?? false,
            developmentBanner: referencePack?.developmentBanner ?? null,
          };
          if (referenceResult?.growthIndicatorsJson) {
            try {
              const parsed = parseStoredNutritionIndicators(referenceResult.growthIndicatorsJson);
              growthEvaluation = parsed.growth;
              iycfEvaluation = parsed.iycf;
            } catch {
              growthEvaluation = null;
              iycfEvaluation = null;
            }
          }
          const guidancePack = guidanceResolution?.guidancePackId
            ? getGuidancePackById(
                guidanceResolution.guidancePackId,
                guidanceResolution.guidancePackVersion ?? undefined,
                guidanceResolution.isDevelopment ? 'development' : env,
              )
            : null;
          const cards =
            guidancePack?.cards.filter((c) =>
              (JSON.parse(guidanceResolution?.guidanceIdsJson ?? '[]') as string[]).includes(
                c.guidanceId,
              ),
            ) ?? [];
          guidanceResult = {
            outcome: guidanceResolution?.resolutionStatus as NutritionGuidanceResolutionResult['outcome'],
            guidancePackId: guidanceResolution?.guidancePackId ?? null,
            guidancePackVersion: guidanceResolution?.guidancePackVersion ?? null,
            guidanceIds: JSON.parse(guidanceResolution?.guidanceIdsJson ?? '[]') as string[],
            cards,
            isDevelopment: guidanceResolution?.isDevelopment ?? false,
            developmentBanner: guidancePack?.developmentBanner ?? null,
            missingInformation: [],
          };
        }
      }

      return {
        assessment,
        answers,
        measurements,
        template,
        referenceResult,
        guidanceResolution,
        referenceEvaluation,
        growthEvaluation,
        iycfEvaluation,
        guidanceResult,
      };
    },

    async acknowledgeGuidance({ assessmentId, resolutionId, accountId }) {
      const now = clock.nowIso();
      const updated = await repos.nutritionAssessments.acknowledgeGuidance({
        id: resolutionId,
        accountId,
        acknowledgedAt: now,
      });
      await repos.auditEvents.record({
        eventType: 'nutrition_guidance_acknowledged',
        entityType: 'nutritionGuidanceResolution',
        entityId: resolutionId,
        actorAccountId: accountId,
        result: 'success',
        metadata: auditSafeMetadata({
          assessmentId,
          guidancePackId: updated.guidancePackId,
          guidancePackVersion: updated.guidancePackVersion,
        }),
      });
      return updated;
    },

    async startCorrection({ assessmentId, accountId }) {
      const original = await repos.nutritionAssessments.findById(assessmentId);
      if (!original || original.status !== 'completed') {
        throw new NutritionError('conflict', 'Only completed assessments can be corrected.');
      }
      if (!original.templateId || original.templateVersion == null) {
        throw new NutritionError('validation', 'Original assessment template is missing.');
      }
      const template = getTemplateForPersistedAssessment({
        templateId: original.templateId,
        templateVersion: original.templateVersion,
      });
      if (!template) {
        throw new NutritionError('templateUnavailable', 'Original template is not available.');
      }

      const now = clock.nowIso();
      let correction!: NutritionAssessment;

      await tx.withTransaction(async () => {
        correction = await repos.nutritionAssessments.create({
          clientId: original.clientId,
          encounterId: original.encounterId,
          facilityId: original.facilityId,
          assessmentDate: todayDateOnly(clock),
          assessmentType: original.assessmentType,
          templateId: original.templateId,
          templateVersion: original.templateVersion,
          startedAt: now,
          status: 'draft',
          engineVersion: NUTRITION_ENGINE_VERSION,
          accountId,
        });

        await repos.nutritionAssessments.update({
          id: correction.id,
          accountId,
          supersedesId: original.id,
        });

        const originalAnswers = await repos.nutritionAssessments.listAnswers(assessmentId);
        const originalLinks = await repos.nutritionAssessments.listMeasurementLinks(assessmentId);

        for (const row of originalAnswers) {
          await repos.nutritionAssessments.saveAnswer({
            nutritionAssessmentId: correction.id,
            questionKey: row.questionKey,
            valueType: row.valueType,
            booleanValue: row.booleanValue,
            numberValue: row.numberValue,
            textValue: row.textValue,
            dateValue: row.dateValue,
            optionValue: row.optionValue,
            multipleOptionsJson: row.multipleOptionsJson,
            accountId,
          });
        }

        for (const link of originalLinks) {
          await repos.nutritionAssessments.linkMeasurement({
            nutritionAssessmentId: correction.id,
            measurementId: link.measurementId,
            questionKey: link.questionKey,
            linkRole: link.linkRole,
            accountId,
          });
        }
      });

      return { assessmentId: correction.id, clientId: original.clientId };
    },

    async correctAssessment({
      assessmentId,
      accountId,
      reasonCode,
      answers,
      environment,
    }) {
      const original = await repos.nutritionAssessments.findById(assessmentId);
      if (!original || original.status !== 'completed') {
        throw new NutritionError('conflict', 'Only completed assessments can be corrected.');
      }
      if (!original.templateId || original.templateVersion == null) {
        throw new NutritionError('validation', 'Original assessment template is missing.');
      }
      const template = getTemplateForPersistedAssessment({
        templateId: original.templateId,
        templateVersion: original.templateVersion,
      });
      if (!template) {
        throw new NutritionError('templateUnavailable', 'Original template is not available.');
      }

      const env = environment ?? getAppConfig().appEnv;
      const now = clock.nowIso();
      let correction!: NutritionAssessment;

      await tx.withTransaction(async () => {
        correction = await repos.nutritionAssessments.create({
          clientId: original.clientId,
          encounterId: original.encounterId,
          facilityId: original.facilityId,
          assessmentDate: todayDateOnly(clock),
          assessmentType: original.assessmentType,
          templateId: original.templateId,
          templateVersion: original.templateVersion,
          startedAt: now,
          status: 'draft',
          engineVersion: NUTRITION_ENGINE_VERSION,
          accountId,
        });
        await repos.nutritionAssessments.update({
          id: original.id,
          accountId,
          supersededById: correction.id,
        });
        await repos.nutritionAssessments.update({
          id: correction.id,
          accountId,
          supersedesId: original.id,
        });

        for (const answer of answers) {
          await repos.nutritionAssessments.saveAnswer(
            encodeNutritionAnswerForPersistence({
              nutritionAssessmentId: correction.id,
              answer,
              accountId,
            }),
          );
        }

        await repos.auditEvents.record({
          eventType: 'nutrition_assessment_corrected',
          entityType: 'nutritionAssessment',
          entityId: correction.id,
          actorAccountId: accountId,
          result: 'success',
          metadata: auditSafeMetadata({
            previousAssessmentId: original.id,
            reasonCode,
            templateId: template.templateId,
            templateVersion: template.version,
          }),
        });
        await repos.auditEvents.record({
          eventType: 'nutrition_previous_result_superseded',
          entityType: 'nutritionAssessment',
          entityId: original.id,
          actorAccountId: accountId,
          result: 'success',
          metadata: auditSafeMetadata({
            supersededById: correction.id,
          }),
        });
        await repos.syncQueue.enqueue({
          entityType: 'nutritionAssessment',
          entityId: correction.id,
          operation: 'create',
          payloadVersion: 1,
        });
      });

      // Auto-complete correction with same confirmation semantics using provided answers
      try {
        const completed = await this.completeAssessment({
          assessmentId: correction.id,
          accountId,
          confirmed: true,
          environment: env,
        });
        return completed.details;
      } catch (completeError) {
        console.error('[Nutrition] correctAssessment auto-complete failed:', completeError);
        const fallback = await this.getDetails(correction.id);
        if (fallback) {
          return fallback;
        }
        return {
          assessment: correction,
          answers,
          measurements: [],
          template,
          referenceResult: null,
          guidanceResolution: null,
          referenceEvaluation: null,
          growthEvaluation: null,
          iycfEvaluation: null,
          guidanceResult: null,
        };
      }
    },

    async softDeleteAssessment({ assessmentId, accountId, reason, confirmed }) {
      if (!confirmed) {
        throw new NutritionError(
          'confirmationRequired',
          'Confirmation is required to delete a nutrition assessment.',
        );
      }
      const trimmedReason = reason.trim();
      if (trimmedReason.length < 3) {
        throw new NutritionError('validation', 'A deletion reason is required.');
      }
      const assessment = await repos.nutritionAssessments.findById(assessmentId);
      if (!assessment) {
        throw new NutritionError('notFound', 'Nutrition assessment not found.');
      }
      if (assessment.status !== 'completed') {
        throw new NutritionError('conflict', 'Only completed assessments can be deleted.');
      }
      if (assessment.supersededById) {
        throw new NutritionError(
          'conflict',
          'This assessment was already replaced by a correction.',
        );
      }

      await tx.withTransaction(async () => {
        await repos.nutritionAssessments.softDelete({
          id: assessmentId,
          accountId,
          discardReason: trimmedReason,
        });
        await repos.auditEvents.record({
          eventType: 'nutrition_assessment_deleted',
          entityType: 'nutritionAssessment',
          entityId: assessmentId,
          actorAccountId: accountId,
          result: 'success',
          metadata: auditSafeMetadata({ reasonLength: trimmedReason.length }),
        });
        await repos.syncQueue.enqueue({
          entityType: 'nutritionAssessment',
          entityId: assessmentId,
          operation: 'delete',
          payloadVersion: 1,
        });
      });
    },
  };
}

/** Inventory helpers for development preview — no client data. */
export function getNutritionContentInventory(environment: AppEnvironment = getAppConfig().appEnv) {
  return {
    registeredTemplates: listAllRegisteredTemplatesForInventory(),
    registeredReferencePacks: listAllRegisteredReferencePacksForInventory(),
    registeredGuidancePacks: listAllRegisteredGuidancePacksForInventory(),
    loadableReferencePacks: listLoadableReferencePacks(environment),
    loadableGuidancePacks: listLoadableGuidancePacks(environment),
    pilotTemplateCount: countApprovedForPilotTemplates(),
    pilotReferencePackCount: countApprovedForPilotReferencePacks(),
    pilotGuidancePackCount: countApprovedForPilotGuidancePacks(),
  };
}
