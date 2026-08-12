import type {
  Encounter,
  Measurement,
  Screening,
  ScreeningAnswer,
  SyncQueueItem,
} from '../../../data/domain/entities/entities';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import {
  isRepositoryError,
  RepositoryError,
} from '../../../data/repositories/errors/RepositoryError';
import type { TransactionRunner } from '../../clients/application/createClientServices';
import {
  getTemplateForPersistedScreening,
  resolveTemplateForNewVisit,
} from '../../screening/content/registry';
import type {
  RecordedScreeningAnswer,
  ScreeningTemplateDefinition,
} from '../../screening/content/types';
import { decodePersistedAnswer, encodeAnswerForPersistence } from '../../screening/engine/answerCodec';
import {
  findIncompleteRequiredQuestions,
  parseProgressSectionId,
  resolveSkippedByCondition,
} from '../../screening/engine/templateEngine';
import { mapCategoryToVisitTypes } from '../domain/visitMapping';

export type VisitDraft = {
  readonly encounter: Encounter;
  readonly screening: Screening;
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly measurements: readonly Measurement[];
  readonly template: ScreeningTemplateDefinition;
  readonly progressSectionId: string | null;
};

export type VisitDetails = {
  readonly encounter: Encounter;
  readonly screening: Screening | null;
  readonly answers: readonly RecordedScreeningAnswer[];
  readonly measurements: readonly Measurement[];
  readonly template: ScreeningTemplateDefinition | null;
};

export type VisitHistoryItem = {
  readonly encounter: Encounter;
  readonly screening: Screening | null;
};

export type StartVisitResult =
  | { readonly kind: 'started'; readonly draft: VisitDraft }
  | { readonly kind: 'existingDraft'; readonly draft: VisitDraft };

export type CompleteScreeningResult = {
  readonly encounter: Encounter;
  readonly screening: Screening;
  readonly syncItems: readonly SyncQueueItem[];
};

export type VisitServices = {
  startVisit(input: {
    readonly clientId: EntityId;
    readonly accountId: EntityId;
    readonly facilityId?: EntityId | null;
  }): Promise<StartVisitResult>;
  getVisitDraft(visitId: EntityId): Promise<VisitDraft | null>;
  saveVisitDraft(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly progressSectionId?: string | null;
  }): Promise<VisitDraft>;
  resumeVisit(visitId: EntityId): Promise<VisitDraft | null>;
  recordScreeningAnswer(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly answer: RecordedScreeningAnswer;
  }): Promise<VisitDraft>;
  recordMeasurement(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly questionId: string;
    readonly numericValue: number;
    readonly unit: Measurement['unit'];
    readonly measurementType: Measurement['measurementType'];
  }): Promise<VisitDraft>;
  reviewScreening(visitId: EntityId): Promise<{
    readonly draft: VisitDraft;
    readonly incompleteRequired: readonly string[];
  } | null>;
  completeScreening(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly confirmed: boolean;
  }): Promise<CompleteScreeningResult>;
  abandonVisit(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
  }): Promise<Encounter>;
  getClientVisitHistory(clientId: EntityId): Promise<readonly VisitHistoryItem[]>;
  getVisitDetails(visitId: EntityId): Promise<VisitDetails | null>;
  correctVisitRecord(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly answer: RecordedScreeningAnswer;
    readonly reasonCode: string;
  }): Promise<VisitDetails>;
};

async function loadDraft(
  repos: RepositoryContainer,
  encounter: Encounter,
): Promise<VisitDraft | null> {
  const screening = await repos.screenings.findByEncounterId(encounter.id);
  if (!screening) {
    return null;
  }
  const template = getTemplateForPersistedScreening({
    screeningType: screening.screeningType,
    schemaVersion: screening.schemaVersion,
  });
  if (!template) {
    return null;
  }
  const persisted = await repos.screenings.listAnswers(screening.id);
  const answers = persisted.map(decodePersistedAnswer);
  const measurements = await repos.measurements.listByEncounter(encounter.id);
  return {
    encounter,
    screening,
    answers,
    measurements,
    template,
    progressSectionId: parseProgressSectionId(encounter.notes),
  };
}

export function createVisitServices(
  repos: RepositoryContainer,
  tx: TransactionRunner,
  ids: IdGenerator = getIdGenerator(),
): VisitServices {
  return {
    async startVisit({ clientId, accountId, facilityId = null }) {
      const client = await repos.clients.findById(clientId);
      if (!client || client.isDeleted) {
        throw new RepositoryError('notFound', 'Client not found');
      }

      const existing = await repos.encounters.findActiveDraftByClient(clientId);
      if (existing) {
        const draft = await loadDraft(repos, existing);
        if (!draft) {
          throw new RepositoryError('dataIntegrity', 'Existing draft is incomplete');
        }
        return { kind: 'existingDraft', draft };
      }

      const { encounterType, screeningType } = mapCategoryToVisitTypes(client.category);
      const template = resolveTemplateForNewVisit({ screeningType });
      // Fall back to any loadable development template when category has no pack yet.
      const resolved = template ?? resolveTemplateForNewVisit({});
      if (!resolved) {
        throw new RepositoryError(
          'validation',
          'No approved screening template is available for new visits',
        );
      }

      let draft: VisitDraft | null = null;
      try {
        await tx.withTransaction(async () => {
          const encounter = await repos.encounters.createDraft({
            id: ids.nextId(),
            clientId,
            encounterType:
              resolved.screeningType === 'antenatal'
                ? 'antenatalVisit'
                : encounterType,
            facilityId: facilityId ?? client.primaryFacilityId,
            workerAccountId: accountId,
            notes: `nc_progress:${resolved.sections[0]?.id ?? 'section-a'}`,
            accountId,
          });
          const screening = await repos.screenings.create({
            id: ids.nextId(),
            encounterId: encounter.id,
            clientId,
            screeningType: resolved.screeningType,
            schemaVersion: resolved.version,
            accountId,
          });
          await repos.auditEvents.record({
            eventType: 'visit_started',
            entityType: 'encounter',
            entityId: encounter.id,
            actorAccountId: accountId,
            result: 'success',
            metadata: {
              templateId: resolved.templateId,
              templateVersion: resolved.version,
              clientCategory: client.category,
            },
          });
          draft = {
            encounter,
            screening,
            answers: [],
            measurements: [],
            template: resolved,
            progressSectionId: resolved.sections[0]?.id ?? null,
          };
        });
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError('transactionFailed', 'Visit could not be started', {
          operation: 'startVisit',
        });
      }

      if (!draft) {
        throw new RepositoryError('unknown', 'Visit start produced no result');
      }
      return { kind: 'started', draft };
    },

    async getVisitDraft(visitId) {
      const encounter = await repos.encounters.findById(visitId);
      if (!encounter) {
        return null;
      }
      if (encounter.status !== 'draft' && encounter.status !== 'inProgress') {
        return null;
      }
      return loadDraft(repos, encounter);
    },

    async saveVisitDraft({ visitId, accountId, progressSectionId = null }) {
      const draft = await this.getVisitDraft(visitId);
      if (!draft) {
        throw new RepositoryError('notFound', 'Visit draft not found');
      }
      const encounter = await repos.encounters.touchDraftSaved({
        id: visitId,
        accountId,
        progressSectionId: progressSectionId ?? draft.progressSectionId,
      });
      await repos.auditEvents.record({
        eventType: 'visit_draft_saved',
        entityType: 'encounter',
        entityId: visitId,
        actorAccountId: accountId,
        result: 'success',
        metadata: {
          progressSectionId: progressSectionId ?? draft.progressSectionId ?? 'none',
        },
      });
      return {
        ...draft,
        encounter,
        progressSectionId: parseProgressSectionId(encounter.notes),
      };
    },

    async resumeVisit(visitId) {
      const draft = await this.getVisitDraft(visitId);
      if (!draft) {
        return null;
      }
      await repos.encounters.markInProgress(visitId, draft.encounter.workerAccountId);
      await repos.screenings.markInProgress(
        draft.screening.id,
        draft.encounter.workerAccountId,
      );
      return this.getVisitDraft(visitId);
    },

    async recordScreeningAnswer({ visitId, accountId, answer }) {
      const draft = await this.getVisitDraft(visitId);
      if (!draft) {
        throw new RepositoryError('notFound', 'Visit draft not found');
      }
      await repos.encounters.markInProgress(visitId, accountId);
      await repos.screenings.markInProgress(draft.screening.id, accountId);
      await repos.screenings.saveAnswer(
        encodeAnswerForPersistence({
          screeningId: draft.screening.id,
          answer,
          accountId,
        }),
      );
      const reloaded = await this.getVisitDraft(visitId);
      if (!reloaded) {
        throw new RepositoryError('unknown', 'Visit draft missing after answer save');
      }
      return reloaded;
    },

    async recordMeasurement({
      visitId,
      accountId,
      questionId,
      numericValue,
      unit,
      measurementType,
    }) {
      const draft = await this.getVisitDraft(visitId);
      if (!draft) {
        throw new RepositoryError('notFound', 'Visit draft not found');
      }
      if (typeof numericValue !== 'number' || Number.isNaN(numericValue)) {
        throw new RepositoryError('validation', 'Measurement requires a numeric value');
      }
      await repos.encounters.markInProgress(visitId, accountId);
      await repos.screenings.markInProgress(draft.screening.id, accountId);
      await repos.measurements.create({
        clientId: draft.encounter.clientId,
        encounterId: visitId,
        screeningId: draft.screening.id,
        measurementType,
        numericValue,
        unit,
        accountId,
        notes: `question:${questionId}`,
      });
      await repos.screenings.saveAnswer(
        encodeAnswerForPersistence({
          screeningId: draft.screening.id,
          answer: {
            questionId,
            state: 'answered',
            value: { kind: 'measurement', value: numericValue, unit },
          },
          accountId,
        }),
      );
      const reloaded = await this.getVisitDraft(visitId);
      if (!reloaded) {
        throw new RepositoryError('unknown', 'Visit draft missing after measurement save');
      }
      return reloaded;
    },

    async reviewScreening(visitId) {
      const draft = await this.getVisitDraft(visitId);
      if (!draft) {
        return null;
      }
      const withSkipped = resolveSkippedByCondition(draft.template, draft.answers);
      const incomplete = findIncompleteRequiredQuestions(draft.template, withSkipped);
      return {
        draft: { ...draft, answers: withSkipped },
        incompleteRequired: incomplete.map((question) => question.id),
      };
    },

    async completeScreening({ visitId, accountId, confirmed }) {
      if (!confirmed) {
        throw new RepositoryError('validation', 'Explicit confirmation is required');
      }
      const review = await this.reviewScreening(visitId);
      if (!review) {
        throw new RepositoryError('notFound', 'Visit draft not found');
      }
      if (review.incompleteRequired.length > 0) {
        throw new RepositoryError('validation', 'Required screening items are incomplete', {
          fieldHint: review.incompleteRequired[0] ?? 'screening',
        });
      }

      let result: CompleteScreeningResult | null = null;
      try {
        await tx.withTransaction(async () => {
          // Persist skipped-by-condition markers before completion.
          for (const answer of review.draft.answers) {
            if (answer.state === 'skippedByCondition') {
              await repos.screenings.saveAnswer(
                encodeAnswerForPersistence({
                  screeningId: review.draft.screening.id,
                  answer,
                  accountId,
                }),
              );
            }
          }

          const screening = await repos.screenings.complete(
            review.draft.screening.id,
            accountId,
          );
          const encounter = await repos.encounters.complete(visitId, accountId);
          await repos.auditEvents.record({
            eventType: 'screening_completed',
            entityType: 'encounter',
            entityId: visitId,
            actorAccountId: accountId,
            result: 'success',
            metadata: {
              screeningId: screening.id,
              templateId: review.draft.template.templateId,
              templateVersion: review.draft.template.version,
            },
          });

          const syncItems: SyncQueueItem[] = [];
          syncItems.push(
            await repos.syncQueue.enqueue({
              entityType: 'encounter',
              entityId: encounter.id,
              operation: 'create',
            }),
          );
          syncItems.push(
            await repos.syncQueue.enqueue({
              entityType: 'screening',
              entityId: screening.id,
              operation: 'create',
            }),
          );

          result = { encounter, screening, syncItems };
        });
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError(
          'transactionFailed',
          'Screening completion could not be saved',
          { operation: 'completeScreening' },
        );
      }

      if (!result) {
        throw new RepositoryError('unknown', 'Screening completion produced no result');
      }
      return result;
    },

    async abandonVisit({ visitId, accountId }) {
      let encounter: Encounter | null = null;
      try {
        await tx.withTransaction(async () => {
          const existing = await repos.encounters.findById(visitId);
          if (!existing) {
            throw new RepositoryError('notFound', 'Visit not found');
          }
          const screening = await repos.screenings.findByEncounterId(visitId);
          if (screening && screening.status !== 'completed') {
            await repos.screenings.cancel(screening.id, accountId);
          }
          encounter = await repos.encounters.cancel(visitId, accountId);
          await repos.auditEvents.record({
            eventType: 'visit_abandoned',
            entityType: 'encounter',
            entityId: visitId,
            actorAccountId: accountId,
            result: 'success',
            metadata: { previousStatus: existing.status },
          });
        });
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError('transactionFailed', 'Visit could not be abandoned', {
          operation: 'abandonVisit',
        });
      }
      if (!encounter) {
        throw new RepositoryError('unknown', 'Abandon visit produced no result');
      }
      return encounter;
    },

    async getClientVisitHistory(clientId) {
      const encounters = await repos.encounters.listByClient(clientId);
      const items: VisitHistoryItem[] = [];
      for (const encounter of encounters) {
        const screening = await repos.screenings.findByEncounterId(encounter.id);
        items.push({ encounter, screening });
      }
      return items;
    },

    async getVisitDetails(visitId) {
      const encounter = await repos.encounters.findById(visitId);
      if (!encounter) {
        return null;
      }
      const screening = await repos.screenings.findByEncounterId(visitId);
      const answers = screening
        ? (await repos.screenings.listAnswers(screening.id)).map(decodePersistedAnswer)
        : [];
      const measurements = await repos.measurements.listByEncounter(visitId);
      const template = screening
        ? getTemplateForPersistedScreening({
            screeningType: screening.screeningType,
            schemaVersion: screening.schemaVersion,
          })
        : null;
      return { encounter, screening, answers, measurements, template };
    },

    async correctVisitRecord({ visitId, accountId, answer, reasonCode }) {
      const details = await this.getVisitDetails(visitId);
      if (!details?.screening) {
        throw new RepositoryError('notFound', 'Visit screening not found');
      }
      if (details.encounter.status !== 'completed') {
        throw new RepositoryError(
          'conflict',
          'Corrections apply to completed visits; use draft save for open visits',
        );
      }
      if (!reasonCode.trim()) {
        throw new RepositoryError('validation', 'Correction reason is required');
      }

      const previous = details.answers.find((item) => item.questionId === answer.questionId);
      try {
        await tx.withTransaction(async () => {
          await repos.screenings.saveAnswer(
            encodeAnswerForPersistence({
              screeningId: details.screening!.id,
              answer,
              accountId,
            }),
          );
          await repos.auditEvents.record({
            eventType: 'visit_answer_corrected',
            entityType: 'encounter',
            entityId: visitId,
            actorAccountId: accountId,
            result: 'success',
            metadata: {
              questionId: answer.questionId,
              reasonCode: reasonCode.trim().slice(0, 80),
              previousState: previous?.state ?? 'missing',
              newState: answer.state,
            },
          });
        });
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError('transactionFailed', 'Visit correction could not be saved', {
          operation: 'correctVisitRecord',
        });
      }

      const updated = await this.getVisitDetails(visitId);
      if (!updated) {
        throw new RepositoryError('unknown', 'Visit missing after correction');
      }
      return updated;
    },
  };
}

/** Exported for tests that need persisted answer row typing. */
export type { ScreeningAnswer };
