import { getAppConfig } from '../../../config/appConfig';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import type { AssistantFeedbackRecord } from '../../../data/repositories/contracts/assistantTypes';
import type { Clock } from '../../../data/domain/value-objects/clock';
import { createSystemClock } from '../../../data/domain/value-objects/clock';
import { isEntityId } from '../../../data/domain/value-objects/EntityId';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { createLogger } from '../../../logging/logger';
import type { AppEnvironment } from '../../../types/env';
import {
  countApprovedForDevelopmentKnowledgePacks,
  countApprovedForPilotKnowledgePacks,
  getArticleById,
  getPackForArticle,
  listApprovedTopics,
  listLoadableKnowledgePacks,
  listRegisteredKnowledgePacks,
} from '../content/registry';
import { classifyAssistantIntent } from '../domain/intents';
import { buildBoundaryResult, intentToAnswerability } from '../domain/policies';
import { runPrivacyPrecheck } from '../domain/privacy';
import type { AssistantMode } from '../domain/modes';
import type {
  ContentIssueCategory,
  FeedbackCategory,
} from '../domain/statuses';
import type {
  AssistantAskResult,
  AssistantAvailability,
  KnowledgeArticleDefinition,
  KnowledgeTopicDefinition,
} from '../domain/types';
import { DEVELOPMENT_SIMULATION_BANNER } from '../providers/development/developmentSimulationProvider';
import { futureConstrainedGenerativeProvider } from '../providers/futureGenerative/constrainedAssistantProvider';
import { resolveAssistantMode } from '../providers/retrievalOnly/retrievalOnlyProvider';
import { buildSearchIndex } from '../retrieval/indexBuilder';
import {
  MAX_ASSISTANT_QUESTION_LENGTH,
  normaliseAssistantQuery,
} from '../retrieval/normalisation';
import { searchKnowledgeIndex } from '../retrieval/search';
import { composeRetrievalOnlyAnswer } from '../response/composer';
import { buildUnavailableFallback } from '../response/fallback';
import {
  clearAssistantConversation,
  storeAssistantResult,
} from '../session/assistantConversationStore';

const logger = createLogger({ environment: getAppConfig().appEnv });

export type AssistantServices = {
  readonly getAvailability: () => AssistantAvailability;
  readonly listTopics: () => readonly KnowledgeTopicDefinition[];
  readonly ask: (input: {
    readonly question: string;
    readonly selectedTopicId?: string | null;
    readonly accountId?: string | null;
    readonly acknowledgePrivacyWarning?: boolean;
  }) => Promise<AssistantAskResult>;
  readonly getArticle: (articleId: string) => KnowledgeArticleDefinition | null;
  readonly recordFeedback: (input: {
    readonly articleId: string;
    readonly knowledgePackId: string;
    readonly knowledgePackVersion: number;
    readonly answerMode: AssistantMode;
    readonly feedbackCategory: FeedbackCategory;
    readonly contentIssueCategory?: ContentIssueCategory | null;
    readonly optionalNote?: string | null;
    readonly accountId?: string | null;
  }) => Promise<AssistantFeedbackRecord>;
  readonly clearConversation: () => void;
  readonly inventorySnapshot: () => {
    readonly pilotPackCount: number;
    readonly developmentPackCount: number;
    readonly registeredPackCount: number;
    readonly generativeProviderAvailable: boolean;
  };
};

function auditSafeMetadata(
  metadata: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return metadata;
}

function safeAccountId(accountId: string | null | undefined): string | null {
  return accountId && isEntityId(accountId) ? accountId : null;
}

export function createAssistantServices(
  repos: RepositoryContainer,
  options: {
    readonly environment?: AppEnvironment;
    readonly ids?: IdGenerator;
    readonly clock?: Clock;
  } = {},
): AssistantServices {
  const environment = options.environment ?? getAppConfig().appEnv;
  const ids = options.ids ?? getIdGenerator();
  const clock = options.clock ?? createSystemClock();

  const getAvailability = (): AssistantAvailability => {
    const mode = resolveAssistantMode(environment);
    const packs = listLoadableKnowledgePacks(environment);
    const topics = listApprovedTopics(environment);
    if (mode === 'UNAVAILABLE' || packs.length === 0) {
      return {
        mode: 'UNAVAILABLE',
        contentAvailable: false,
        topicCount: 0,
        packCount: 0,
        developmentOnly: false,
        message:
          'Approved Ask NorthCare reference content is not available on this device yet.',
      };
    }
    return {
      mode,
      contentAvailable: true,
      topicCount: topics.length,
      packCount: packs.length,
      developmentOnly: packs.every((p) => p.status === 'APPROVED_FOR_DEVELOPMENT'),
      message: null,
    };
  };

  return {
    getAvailability,

    listTopics() {
      return listApprovedTopics(environment);
    },

    async ask(input) {
      const availability = getAvailability();
      const answerId = ids.nextId();
      const answeredAt = clock.nowIso();
      const developmentBanner =
        availability.developmentOnly || environment !== 'production'
          ? DEVELOPMENT_SIMULATION_BANNER
          : null;

      void repos.auditEvents
        .record({
          eventType: 'assistant.opened_or_asked',
          entityType: 'assistant',
          entityId: null,
          actorAccountId: safeAccountId(input.accountId),
          result: 'started',
          metadata: auditSafeMetadata({
            mode: availability.mode,
            packCount: availability.packCount,
          }),
        })
        .catch(() => undefined);

      if (!availability.contentAvailable || availability.mode === 'UNAVAILABLE') {
        const result: AssistantAskResult = {
          kind: 'unavailable',
          answerId,
          message:
            'Ask NorthCare could not find approved information for this question on this device.',
        };
        storeAssistantResult(result);
        await repos.auditEvents.record({
          eventType: 'assistant.knowledge_pack_unavailable',
          entityType: 'assistant',
          entityId: null,
          actorAccountId: safeAccountId(input.accountId),
          result: 'unavailable',
          metadata: auditSafeMetadata({ mode: 'UNAVAILABLE' }),
        });
        return result;
      }

      const trimmed = input.question.trim();
      if (!trimmed || trimmed.length > MAX_ASSISTANT_QUESTION_LENGTH) {
        const boundary = buildUnavailableFallback({
          answerId,
          mode: availability.mode,
          answeredAt,
          developmentBanner,
          answerability: 'unsupportedTopic',
        });
        const result: AssistantAskResult = { kind: 'boundary', boundary };
        storeAssistantResult(result);
        return result;
      }

      const privacy = runPrivacyPrecheck(trimmed);
      if (privacy.flagged && !input.acknowledgePrivacyWarning) {
        const result: AssistantAskResult = {
          kind: 'privacyReviewRequired',
          answerId,
          message: privacy.message ?? 'Remove identifying details before asking.',
        };
        storeAssistantResult(result);
        return result;
      }

      const normalised = normaliseAssistantQuery(trimmed);
      const intent = classifyAssistantIntent({
        normalisedQuestion: normalised,
        selectedTopicId: input.selectedTopicId,
        privacyFlagged: privacy.flagged && !input.acknowledgePrivacyWarning,
      });

      const boundaryOutcome = intentToAnswerability(intent);
      if (
        boundaryOutcome &&
        boundaryOutcome !== 'unsupportedTopic' &&
        intent !== 'approvedKnowledgeQuestion' &&
        intent !== 'appHelpQuestion' &&
        intent !== 'workflowNavigationQuestion'
      ) {
        const boundary = buildBoundaryResult({
          answerId,
          answerability: boundaryOutcome,
          mode: availability.mode,
          answeredAt,
          developmentBanner,
          relatedTopicIds: listApprovedTopics(environment).map((t) => t.topicId).slice(0, 3),
        });
        const result: AssistantAskResult = { kind: 'boundary', boundary };
        storeAssistantResult(result);
        await repos.auditEvents.record({
          eventType: `assistant.boundary.${boundaryOutcome}`,
          entityType: 'assistant',
          entityId: null,
          actorAccountId: safeAccountId(input.accountId),
          result: 'boundary',
          metadata: auditSafeMetadata({
            answerability: boundaryOutcome,
            mode: availability.mode,
          }),
        });
        logger.info('assistant.boundary', {
          answerability: boundaryOutcome,
          mode: availability.mode,
        });
        return result;
      }

      const packs = listLoadableKnowledgePacks(environment);
      const index = buildSearchIndex(packs);
      const search = searchKnowledgeIndex({
        index,
        normalisedQuery: normalised,
        language: 'en',
        selectedTopicId: input.selectedTopicId,
      });

      logger.info('assistant.retrieval', {
        mode: availability.mode,
        indexVersion: search.indexVersion,
        candidateCount: search.candidateCount,
        answerability: search.coverage.answerability,
      });

      if (
        search.coverage.answerability !== 'answerAvailable' &&
        search.coverage.answerability !== 'multipleRelevantSources'
      ) {
        const boundary = buildUnavailableFallback({
          answerId,
          mode: availability.mode,
          answeredAt,
          developmentBanner,
          answerability: search.coverage.answerability,
          relatedTopicIds: listApprovedTopics(environment).map((t) => t.topicId).slice(0, 4),
        });
        const result: AssistantAskResult = { kind: 'boundary', boundary };
        storeAssistantResult(result);
        await repos.auditEvents.record({
          eventType: 'assistant.unsupported_question_boundary',
          entityType: 'assistant',
          entityId: null,
          actorAccountId: safeAccountId(input.accountId),
          result: 'unsupported',
          metadata: auditSafeMetadata({
            answerability: search.coverage.answerability,
            mode: availability.mode,
            candidateCount: search.candidateCount,
          }),
        });
        return result;
      }

      const answer = composeRetrievalOnlyAnswer({
        answerId,
        selected: search.coverage.selected,
        answerability: search.coverage.answerability,
        mode: availability.mode,
        answeredAt,
        language: 'en',
        developmentBanner,
      });

      if (!answer) {
        const boundary = buildUnavailableFallback({
          answerId,
          mode: availability.mode,
          answeredAt,
          developmentBanner,
          answerability: 'insufficientCoverage',
        });
        const result: AssistantAskResult = { kind: 'boundary', boundary };
        storeAssistantResult(result);
        return result;
      }

      const result: AssistantAskResult = { kind: 'answer', answer };
      storeAssistantResult(result);
        await repos.auditEvents.record({
          eventType: 'assistant.approved_answer_shown',
          entityType: 'assistant_article',
          entityId: null,
          actorAccountId: safeAccountId(input.accountId),
          result: 'answered',
          metadata: auditSafeMetadata({
            knowledgePackId: answer.knowledgePackId,
            knowledgePackVersion: answer.knowledgePackVersion,
            articleId: answer.articleIds[0] ?? '',
            answerability: answer.answerability,
            mode: answer.mode,
          }),
        });
      return result;
    },

    getArticle(articleId) {
      return getArticleById(articleId, environment);
    },

    async recordFeedback(input) {
      const optionalNote =
        input.optionalNote && input.optionalNote.length > 280
          ? input.optionalNote.slice(0, 280)
          : (input.optionalNote ?? null);

      const record = await repos.assistantFeedback.create({
        articleId: input.articleId,
        knowledgePackId: input.knowledgePackId,
        knowledgePackVersion: input.knowledgePackVersion,
        answerMode: input.answerMode,
        feedbackCategory: input.feedbackCategory,
        contentIssueCategory: input.contentIssueCategory ?? null,
        optionalNote,
        createdByAccountId: safeAccountId(input.accountId),
      });

      await repos.syncQueue.enqueue({
        entityType: 'assistant_feedback',
        entityId: record.id,
        operation: 'create',
      });

      await repos.auditEvents.record({
        eventType:
          input.feedbackCategory === 'reportContentIssue'
            ? 'assistant.content_issue_recorded'
            : 'assistant.feedback_recorded',
        entityType: 'assistant_feedback',
        entityId: record.id,
        actorAccountId: safeAccountId(input.accountId),
        result: 'saved',
        metadata: auditSafeMetadata({
          feedbackCategory: input.feedbackCategory,
          contentIssueCategory: input.contentIssueCategory ?? '',
          knowledgePackId: input.knowledgePackId,
          knowledgePackVersion: input.knowledgePackVersion,
          articleId: input.articleId,
          mode: input.answerMode,
        }),
      });

      return record;
    },

    clearConversation() {
      clearAssistantConversation();
    },

    inventorySnapshot() {
      return {
        pilotPackCount: countApprovedForPilotKnowledgePacks(),
        developmentPackCount: countApprovedForDevelopmentKnowledgePacks(),
        registeredPackCount: listRegisteredKnowledgePacks().length,
        generativeProviderAvailable: futureConstrainedGenerativeProvider.available,
      };
    },
  };
}

export function resolveArticlePackMeta(articleId: string): {
  readonly packId: string;
  readonly packVersion: number;
} | null {
  const pack = getPackForArticle(articleId);
  if (!pack) {
    return null;
  }
  return { packId: pack.knowledgePackId, packVersion: pack.version };
}
