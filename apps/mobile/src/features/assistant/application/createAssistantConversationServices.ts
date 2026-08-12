import { getAppConfig } from '../../../config/appConfig';
import type { RepositoryContainer } from '../../../data/repositories/contracts/types';
import type {
  AssistantConversationDetail,
  AssistantConversationSummary,
  AssistantMessageRecord,
  AssistantMessageSourceRecord,
} from '../../../data/repositories/contracts/assistantConversationTypes';
import type { EntityId } from '../../../data/domain/value-objects/EntityId';
import type { IdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { getIdGenerator } from '../../../data/domain/value-objects/idGenerator';
import { getArticleById, listLoadableKnowledgePacks } from '../content/registry';
import {
  deriveConversationTitle,
  inferConversationTopicIcon,
} from '../domain/conversationPresentation';
import { buildSearchIndex } from '../retrieval/indexBuilder';
import { normaliseAssistantQuery } from '../retrieval/normalisation';
import { searchKnowledgeIndex } from '../retrieval/search';
import { mapArticleCitations } from '../response/sourceMapper';

export type AssistantConversationServices = {
  readonly listConversations: (accountId: string) => Promise<readonly AssistantConversationSummary[]>;
  readonly getConversation: (conversationId: EntityId) => Promise<AssistantConversationDetail | null>;
  readonly createConversation: (input: {
    readonly accountId: string;
    readonly firstMessage: string;
  }) => Promise<AssistantConversationSummary>;
  readonly appendMessage: (input: {
    readonly conversationId: EntityId;
    readonly role: 'user' | 'assistant' | 'system';
    readonly content: string;
    readonly sortOrder: number;
    readonly questionForSources?: string;
  }) => Promise<AssistantMessageRecord>;
  readonly updateConversationTitle: (input: {
    readonly conversationId: EntityId;
    readonly firstUserMessage: string;
  }) => Promise<void>;
  readonly deleteConversation: (conversationId: EntityId) => Promise<void>;
  readonly clearAllConversations: (accountId: string) => Promise<void>;
};

type SourceDraft = {
  readonly title: string;
  readonly referenceLabel: string | null;
  readonly articleId: string | null;
  readonly sortOrder: number;
};

function buildSourcesForQuestion(question: string): readonly SourceDraft[] {
  const environment = getAppConfig().appEnv;
  const packs = listLoadableKnowledgePacks(environment);
  if (packs.length === 0) {
    return [];
  }
  const index = buildSearchIndex(packs);
  const search = searchKnowledgeIndex({
    index,
    normalisedQuery: normaliseAssistantQuery(question),
    language: 'en',
    selectedTopicId: null,
  });
  const articleIds = search.ranked.slice(0, 2).map((match) => match.articleId);
  const sources: SourceDraft[] = [];

  articleIds.forEach((articleId, index) => {
    const article = getArticleById(articleId);
    if (!article) {
      return;
    }
    const pack = packs.find((item) => item.packId === article.packId);
    if (!pack) {
      return;
    }
    const citations = mapArticleCitations({
      article,
      knowledgePackId: pack.packId,
      knowledgePackVersion: pack.version,
    });
    const primary = citations[0];
    sources.push({
      title: article.shortTitle || article.title,
      referenceLabel: primary?.title ?? primary?.issuingOrganisation ?? null,
      articleId: article.articleId,
      sortOrder: index,
    });
  });

  return sources;
}

export function createAssistantConversationServices(
  repos: RepositoryContainer,
  options: { readonly ids?: IdGenerator } = {},
): AssistantConversationServices {
  const ids = options.ids ?? getIdGenerator();

  return {
    listConversations(accountId) {
      return repos.assistantConversations.listConversations(accountId);
    },

    getConversation(conversationId) {
      return repos.assistantConversations.getConversationDetail(conversationId);
    },

    async createConversation(input) {
      const title = deriveConversationTitle(input.firstMessage);
      const topicIcon = inferConversationTopicIcon(input.firstMessage);
      return repos.assistantConversations.createConversation({
        accountId: input.accountId,
        title,
        topicIcon,
      });
    },

    async appendMessage(input) {
      const sources =
        input.role === 'assistant' && input.questionForSources
          ? buildSourcesForQuestion(input.questionForSources).map((source) => ({
              title: source.title,
              referenceLabel: source.referenceLabel,
              articleId: source.articleId,
              sortOrder: source.sortOrder,
            }))
          : [];

      return repos.assistantConversations.appendMessage({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        sortOrder: input.sortOrder,
        sources,
      });
    },

    clearAllConversations(accountId) {
      return repos.assistantConversations.deleteAllForAccount(accountId);
    },

    updateConversationTitle(input) {
      const title = deriveConversationTitle(input.firstUserMessage);
      return repos.assistantConversations.updateConversationTitle(input.conversationId, title);
    },

    deleteConversation(conversationId) {
      return repos.assistantConversations.softDeleteConversation(conversationId);
    },
  };
}

export type { AssistantMessageSourceRecord };
