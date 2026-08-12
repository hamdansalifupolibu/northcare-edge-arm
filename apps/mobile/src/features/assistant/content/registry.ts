import { getAppConfig } from '../../../config/appConfig';
import type { AppEnvironment } from '../../../types/env';
import { AssistantError } from '../domain/errors';
import type { KnowledgeContentStatus } from '../domain/statuses';
import type {
  KnowledgeArticleDefinition,
  KnowledgePackDefinition,
  KnowledgeTopicDefinition,
} from '../domain/types';
import { SYNTHETIC_DEV_ASK_NORTHCARE_PACK } from './packs/syntheticDevAskNorthCarePack';
import { validateKnowledgePack } from './validation/validatePack';

const ALL_PACKS: readonly KnowledgePackDefinition[] = [SYNTHETIC_DEV_ASK_NORTHCARE_PACK];

function allowedStatusesForEnvironment(
  environment: AppEnvironment,
): readonly KnowledgeContentStatus[] {
  if (environment === 'production') {
    return ['APPROVED_FOR_PILOT'];
  }
  return ['APPROVED_FOR_DEVELOPMENT', 'APPROVED_FOR_PILOT'];
}

export function listRegisteredKnowledgePacks(): readonly KnowledgePackDefinition[] {
  return ALL_PACKS;
}

export function listLoadableKnowledgePacks(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly KnowledgePackDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  const loadable: KnowledgePackDefinition[] = [];
  for (const pack of ALL_PACKS) {
    if (!allowed.has(pack.status)) {
      continue;
    }
    const validation = validateKnowledgePack(pack);
    if (!validation.ok) {
      continue;
    }
    loadable.push(pack);
  }
  return loadable;
}

export function requireValidatedLoadablePacks(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly KnowledgePackDefinition[] {
  const allowed = new Set(allowedStatusesForEnvironment(environment));
  const loadable: KnowledgePackDefinition[] = [];
  for (const pack of ALL_PACKS) {
    if (!allowed.has(pack.status)) {
      continue;
    }
    const validation = validateKnowledgePack(pack);
    if (!validation.ok) {
      throw new AssistantError(
        'packRejected',
        `Knowledge pack rejected: ${validation.errors.join(', ')}`,
      );
    }
    loadable.push(pack);
  }
  return loadable;
}

export function getKnowledgePackById(
  knowledgePackId: string,
  version?: number,
  environment: AppEnvironment = getAppConfig().appEnv,
): KnowledgePackDefinition | null {
  return (
    listLoadableKnowledgePacks(environment).find(
      (pack) =>
        pack.knowledgePackId === knowledgePackId &&
        (version == null || pack.version === version),
    ) ?? null
  );
}

export function listApprovedTopics(
  environment: AppEnvironment = getAppConfig().appEnv,
): readonly KnowledgeTopicDefinition[] {
  const topics = listLoadableKnowledgePacks(environment).flatMap((pack) =>
    pack.topics.filter((topic) => {
      const allowed = new Set(allowedStatusesForEnvironment(environment));
      return allowed.has(topic.status) && topic.status !== 'RETIRED';
    }),
  );
  return [...topics].sort((a, b) => a.order - b.order || a.topicId.localeCompare(b.topicId));
}

export function getArticleById(
  articleId: string,
  environment: AppEnvironment = getAppConfig().appEnv,
): KnowledgeArticleDefinition | null {
  for (const pack of listLoadableKnowledgePacks(environment)) {
    const article = pack.articles.find((item) => item.articleId === articleId);
    if (article) {
      return article;
    }
  }
  // Retired articles may still be opened by stable ID for "no longer active" state.
  for (const pack of ALL_PACKS) {
    const article = pack.articles.find((item) => item.articleId === articleId);
    if (article) {
      return article;
    }
  }
  return null;
}

export function getPackForArticle(
  articleId: string,
): KnowledgePackDefinition | null {
  return ALL_PACKS.find((pack) => pack.articles.some((a) => a.articleId === articleId)) ?? null;
}

export function countApprovedForPilotKnowledgePacks(): number {
  return ALL_PACKS.filter((pack) => pack.status === 'APPROVED_FOR_PILOT').length;
}

export function countApprovedForDevelopmentKnowledgePacks(): number {
  return ALL_PACKS.filter((pack) => pack.status === 'APPROVED_FOR_DEVELOPMENT').length;
}
