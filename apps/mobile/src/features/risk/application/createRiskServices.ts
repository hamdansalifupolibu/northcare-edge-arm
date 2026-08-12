import type {
  RiskAssessment,
  RiskFactor,
  SyncQueueItem,
} from '../../../data/domain/entities/entities';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import {
  isRepositoryError,
  RepositoryError,
} from '../../../data/repositories/errors/RepositoryError';
import type { TransactionRunner } from '../../clients/application/createClientServices';
import { getTemplateForPersistedScreening } from '../../screening/content/registry';
import type { RecordedScreeningAnswer } from '../../screening/content/types';
import { decodePersistedAnswer } from '../../screening/engine/answerCodec';
import { requireRulePackForScreening } from '../content/registry';
import { isRiskEngineError, RiskEngineError } from '../domain/errors';
import type { MissingInformationRecord } from '../domain/input';
import type { RiskEvaluationOutcome } from '../domain/results';
import { evaluateRisk } from '../engine/evaluator';
import { buildRiskEngineInput } from '../engine/inputResolver';
import { getAppConfig } from '../../../config/appConfig';
import { createLogger } from '../../../logging/logger';

const log = createLogger({ environment: getAppConfig().appEnv });

export type EvaluatedRiskResult =
  | {
      readonly uiState: 'resultReady';
      readonly outcome: RiskEvaluationOutcome;
      readonly sanitisedMessage: null;
    }
  | {
      readonly uiState: 'rulePackUnavailable' | 'inputIncomplete' | 'evaluationFailed';
      readonly outcome: null;
      readonly sanitisedMessage: string;
    };

export type SavedRiskResult = {
  readonly assessment: RiskAssessment;
  readonly factors: readonly RiskFactor[];
  readonly syncItems: readonly SyncQueueItem[];
};

export type RiskHistoryItem = {
  readonly assessment: RiskAssessment;
  readonly factors: readonly RiskFactor[];
};

export type RiskServices = {
  evaluateForVisit(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly environment?: 'development' | 'staging' | 'production';
  }): Promise<EvaluatedRiskResult>;
  saveAcknowledgedResult(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly outcome: RiskEvaluationOutcome;
    readonly acknowledged: boolean;
    readonly supersedesRiskAssessmentId?: EntityId | null;
    readonly recalculationReason?: string | null;
  }): Promise<SavedRiskResult>;
  getCurrentForVisit(visitId: EntityId): Promise<RiskHistoryItem | null>;
  getHistoryForVisit(visitId: EntityId): Promise<readonly RiskHistoryItem[]>;
  recalculateForVisit(input: {
    readonly visitId: EntityId;
    readonly accountId: EntityId;
    readonly reason: string;
    readonly acknowledged: boolean;
    readonly environment?: 'development' | 'staging' | 'production';
  }): Promise<SavedRiskResult>;
};

export function createRiskServices(
  repos: RepositoryContainer,
  tx: TransactionRunner,
): RiskServices {
  const ids = getIdGenerator();

  async function loadVisitContext(visitId: EntityId) {
    const encounter = await repos.encounters.findById(visitId);
    if (!encounter) {
      throw new RepositoryError('notFound', 'Visit not found');
    }
    const screening = await repos.screenings.findByEncounterId(visitId);
    if (!screening) {
      throw new RepositoryError('notFound', 'Screening not found');
    }
    const client = await repos.clients.findById(encounter.clientId);
    if (!client) {
      throw new RepositoryError('notFound', 'Client not found');
    }
    const template = getTemplateForPersistedScreening({
      screeningType: screening.screeningType,
      schemaVersion: screening.schemaVersion,
    });
    if (!template) {
      throw new RiskEngineError(
        'incompatibleTemplate',
        'Screening template for this visit is unavailable',
      );
    }
    const persistedAnswers = await repos.screenings.listAnswers(screening.id);
    const answers: RecordedScreeningAnswer[] = persistedAnswers.map(decodePersistedAnswer);
    const measurements = await repos.measurements.listByEncounter(visitId);
    return { encounter, screening, client, template, answers, measurements };
  }

  return {
    async evaluateForVisit({ visitId, accountId, environment }) {
      void accountId;
      try {
        await repos.auditEvents.record({
          eventType: 'priority_evaluation_requested',
          entityType: 'encounter',
          entityId: visitId,
          actorAccountId: accountId,
          result: 'success',
          metadata: { enginePhase: 'requested' },
        });

        const ctx = await loadVisitContext(visitId);
        if (ctx.screening.status !== 'completed') {
          return {
            outcome: null,
            uiState: 'inputIncomplete',
            sanitisedMessage: 'Screening must be completed before priority assessment',
          };
        }

        let pack;
        try {
          pack = requireRulePackForScreening({
            screeningTemplateId: ctx.template.templateId,
            screeningTemplateVersion: ctx.template.version,
            environment,
          });
        } catch (error) {
          if (isRiskEngineError(error) && error.code === 'rulePackUnavailable') {
            await repos.auditEvents.record({
              eventType: 'priority_evaluation_unavailable',
              entityType: 'encounter',
              entityId: visitId,
              actorAccountId: accountId,
              result: 'blocked',
              metadata: {
                reason: 'rulePackUnavailable',
                templateId: ctx.template.templateId,
              },
            });
            log.info('rule_pack_unavailable', {
              engineVersion: 1,
              templateId: ctx.template.templateId,
            });
            return {
              outcome: null,
              uiState: 'rulePackUnavailable',
              sanitisedMessage:
                'An approved priority-assessment rule set is not available for this screening.',
            };
          }
          throw error;
        }

        const existing = await repos.riskAssessments.findCurrentByScreeningId(
          ctx.screening.id,
        );
        const referenceDateOnly = (ctx.encounter.occurredAt ?? new Date().toISOString()).slice(
          0,
          10,
        );
        const engineInput = buildRiskEngineInput({
          evaluationId: ids.nextId(),
          client: ctx.client,
          encounterId: ctx.encounter.id,
          visitType: ctx.encounter.encounterType,
          screeningId: ctx.screening.id,
          screeningType: ctx.screening.screeningType,
          screeningTemplateId: ctx.template.templateId,
          screeningTemplateVersion: ctx.template.version,
          answers: ctx.answers,
          measurements: ctx.measurements,
          completionState: 'completed',
          workerConfirmation: true,
          existingRiskAssessmentId: existing?.id ?? null,
          referenceDateOnly,
          applicableRulePackId: pack.rulePackId,
          applicableRulePackVersion: pack.version,
        });

        const started = Date.now();
        const outcome = evaluateRisk(engineInput, pack);
        const durationMs = Date.now() - started;
        log.info('priority_evaluated', {
          engineVersion: outcome.engineVersion,
          rulePackId: outcome.rulePackId,
          rulePackVersion: outcome.rulePackVersion,
          durationMs,
          ruleCount: pack.rules.length,
          matchedRuleCount: outcome.matchedFactors.length,
          missingInputCount: outcome.missingInformation.length,
          priority: outcome.priority,
        });

        await repos.auditEvents.record({
          eventType: 'priority_result_produced',
          entityType: 'screening',
          entityId: ctx.screening.id,
          actorAccountId: accountId,
          result: 'success',
          metadata: {
            priority: outcome.priority,
            rulePackId: outcome.rulePackId,
            rulePackVersion: outcome.rulePackVersion,
            matchedRuleCount: outcome.matchedFactors.length,
          },
        });

        return {
          outcome,
          uiState: 'resultReady',
          sanitisedMessage: null,
        };
      } catch (error) {
        if (isRiskEngineError(error) && error.code === 'screeningIncomplete') {
          return {
            outcome: null,
            uiState: 'inputIncomplete',
            sanitisedMessage: error.sanitisedMessage,
          };
        }
        log.warn('priority_evaluation_failed', {
          category: isRiskEngineError(error) ? error.code : 'unknown',
        });
        return {
          outcome: null,
          uiState: 'evaluationFailed',
          sanitisedMessage: 'Priority assessment could not be completed',
        };
      }
    },

    async saveAcknowledgedResult({
      visitId,
      accountId,
      outcome,
      acknowledged,
      supersedesRiskAssessmentId,
      recalculationReason,
    }) {
      if (!acknowledged) {
        throw new RepositoryError('validation', 'Worker acknowledgement is required');
      }

      const ctx = await loadVisitContext(visitId);
      let saved: SavedRiskResult | null = null;

      try {
        await tx.withTransaction(async () => {
          if (supersedesRiskAssessmentId) {
            await repos.riskAssessments.markSuperseded({
              id: supersedesRiskAssessmentId,
              accountId,
            });
          } else {
            const current = await repos.riskAssessments.findCurrentByScreeningId(
              ctx.screening.id,
            );
            if (current) {
              await repos.riskAssessments.markSuperseded({
                id: current.id,
                accountId,
              });
            }
          }

          const created = await repos.riskAssessments.createWithFactors({
            clientId: ctx.client.id,
            encounterId: ctx.encounter.id,
            screeningId: ctx.screening.id,
            priority: outcome.priority,
            ruleSetVersion: `${outcome.rulePackId}@${outcome.rulePackVersion}`,
            explanationSummary: outcome.explanationSummary,
            explanationDetail: outcome.explanationDetail,
            missingInformation: serializeMissing(outcome.missingInformation),
            evaluationStatus: 'acknowledged',
            engineVersion: outcome.engineVersion,
            rulePackId: outcome.rulePackId,
            rulePackVersion: outcome.rulePackVersion,
            screeningTemplateId: outcome.screeningTemplateId,
            screeningTemplateVersion: outcome.screeningTemplateVersion,
            explanationVersion: outcome.explanationVersion,
            inputDigest: outcome.inputDigest,
            supersedesRiskAssessmentId: supersedesRiskAssessmentId ?? null,
            recalculationReason: recalculationReason ?? null,
            isCurrent: true,
            undeterminedReasonCategory: outcome.undeterminedReasonCategory,
            developmentBanner: outcome.developmentBanner,
            aggregationStrategy: outcome.aggregationStrategy,
            aggregationStrategyVersion: outcome.aggregationStrategyVersion,
            factors: outcome.matchedFactors.map((factor, index) => ({
              factorCode: factor.factorCode,
              factorLabel: factor.factorLabel,
              sourceQuestionKey: factor.sourceQuestionKey,
              severity: factor.priority,
              ruleVersion: factor.ruleVersion,
              ruleId: factor.ruleId,
              priority: factor.priority,
              explanationId: factor.explanationId,
              sortOrder: factor.order || index,
              sourceMeasurementId: factor.sourceMeasurementId,
            })),
            accountId,
            alreadyInTransaction: true,
          });

          const assessment = await repos.riskAssessments.acknowledge({
            id: created.assessment.id,
            accountId,
          });

          await repos.auditEvents.record({
            eventType: 'priority_assessment_saved',
            entityType: 'risk_assessment',
            entityId: assessment.id,
            actorAccountId: accountId,
            result: 'success',
            metadata: {
              screeningId: ctx.screening.id,
              priority: assessment.priority,
              rulePackId: outcome.rulePackId,
              rulePackVersion: outcome.rulePackVersion,
              supersededId: supersedesRiskAssessmentId ?? null,
            },
          });

          await repos.auditEvents.record({
            eventType: 'priority_result_acknowledged',
            entityType: 'risk_assessment',
            entityId: assessment.id,
            actorAccountId: accountId,
            result: 'success',
            metadata: {
              priority: assessment.priority,
            },
          });

          if (supersedesRiskAssessmentId) {
            await repos.auditEvents.record({
              eventType: 'priority_assessment_superseded',
              entityType: 'risk_assessment',
              entityId: supersedesRiskAssessmentId,
              actorAccountId: accountId,
              result: 'success',
              metadata: {
                replacementId: assessment.id,
                reason: recalculationReason ?? 'recalculation',
              },
            });
          }

          const syncItems: SyncQueueItem[] = [
            await repos.syncQueue.enqueue({
              entityType: 'risk_assessment',
              entityId: assessment.id,
              operation: 'create',
            }),
          ];
          if (supersedesRiskAssessmentId) {
            syncItems.push(
              await repos.syncQueue.enqueue({
                entityType: 'risk_assessment',
                entityId: supersedesRiskAssessmentId,
                operation: 'update',
              }),
            );
          }

          saved = {
            assessment,
            factors: created.factors,
            syncItems,
          };
        });
      } catch (error) {
        if (isRepositoryError(error)) {
          throw error;
        }
        throw new RepositoryError(
          'transactionFailed',
          'Priority assessment could not be saved',
          { operation: 'saveAcknowledgedResult' },
        );
      }

      if (!saved) {
        throw new RepositoryError('unknown', 'Priority assessment save produced no result');
      }
      return saved;
    },

    async getCurrentForVisit(visitId) {
      const assessment = await repos.riskAssessments.findCurrentByEncounterId(visitId);
      if (!assessment) {
        return null;
      }
      const factors = await repos.riskAssessments.listFactors(assessment.id);
      return { assessment, factors };
    },

    async getHistoryForVisit(visitId) {
      const encounter = await repos.encounters.findById(visitId);
      if (!encounter) {
        return [];
      }
      const screening = await repos.screenings.findByEncounterId(visitId);
      if (!screening) {
        return [];
      }
      const assessments = await repos.riskAssessments.listByScreeningId(screening.id);
      const items: RiskHistoryItem[] = [];
      for (const assessment of assessments) {
        items.push({
          assessment,
          factors: await repos.riskAssessments.listFactors(assessment.id),
        });
      }
      return items;
    },

    async recalculateForVisit({
      visitId,
      accountId,
      reason,
      acknowledged,
      environment,
    }) {
      await repos.auditEvents.record({
        eventType: 'priority_recalculation_requested',
        entityType: 'encounter',
        entityId: visitId,
        actorAccountId: accountId,
        result: 'success',
        metadata: { reasonCode: reason },
      });

      const evaluation = await this.evaluateForVisit({
        visitId,
        accountId,
        environment,
      });
      if (evaluation.uiState !== 'resultReady' || !evaluation.outcome) {
        throw new RiskEngineError(
          'evaluationFailed',
          evaluation.sanitisedMessage ?? 'Priority recalculation failed',
        );
      }
      const current = await repos.riskAssessments.findCurrentByEncounterId(visitId);
      return this.saveAcknowledgedResult({
        visitId,
        accountId,
        outcome: evaluation.outcome,
        acknowledged,
        supersedesRiskAssessmentId: current?.id ?? null,
        recalculationReason: reason,
      });
    },
  };
}

function serializeMissing(items: readonly MissingInformationRecord[]): string {
  return JSON.stringify(
    items.map((item) => ({
      questionKey: item.questionKey,
      reason: item.reason,
      blocking: item.blocking,
      workerFacingLabel: item.workerFacingLabel,
      requiredByRuleIds: item.requiredByRuleIds,
    })),
  );
}
