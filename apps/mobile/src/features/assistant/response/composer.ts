import {
  RESPONSE_COMPOSER_VERSION,
  RETRIEVAL_ENGINE_VERSION,
  SEARCH_INDEX_VERSION,
  type AssistantMode,
} from '../domain/modes';
import type { AnswerabilityOutcome } from '../domain/statuses';
import type { ComposedAssistantAnswer, KnowledgeArticleDefinition } from '../domain/types';
import type { RankedCandidate } from '../retrieval/ranking';
import { mapArticleCitations } from './sourceMapper';

/**
 * Retrieval-only composer: approved cards/sections only.
 * Does not invent transitions, facts, or clinical conclusions.
 */
export function composeRetrievalOnlyAnswer(input: {
  readonly answerId: string;
  readonly selected: readonly RankedCandidate[];
  readonly answerability: Extract<
    AnswerabilityOutcome,
    'answerAvailable' | 'multipleRelevantSources'
  >;
  readonly mode: AssistantMode;
  readonly answeredAt: string;
  readonly language: string;
  readonly developmentBanner: string | null;
}): ComposedAssistantAnswer | null {
  if (input.selected.length === 0) {
    return null;
  }

  const primary = input.selected[0]!.article.article;
  if (primary.approvedAnswer.length === 0) {
    return null;
  }
  if (primary.isClinical && primary.sourceReferences.length === 0) {
    return null;
  }

  const articles = input.selected.map((c) => c.article.article);
  const citations = articles.flatMap((article, index) =>
    mapArticleCitations({
      article,
      knowledgePackId: input.selected[index]!.article.packId,
      knowledgePackVersion: input.selected[index]!.article.packVersion,
    }),
  );

  const blocks =
    input.answerability === 'multipleRelevantSources'
      ? composeMultiSourceBlocks(articles)
      : primary.approvedAnswer;

  const pack = input.selected[0]!.article;

  return {
    answerId: input.answerId,
    heading: primary.title,
    summary: primary.summary,
    blocks,
    safetyNote: primary.safetyNote,
    citations,
    relatedArticleIds: primary.relatedArticleIds,
    relatedTopicIds: [primary.topicId],
    workflowLinks: primary.workflowLinks,
    knowledgePackId: pack.packId,
    knowledgePackVersion: pack.packVersion,
    articleIds: articles.map((a) => a.articleId),
    articleVersions: articles.map((a) => a.version),
    retrievalEngineVersion: RETRIEVAL_ENGINE_VERSION,
    responseComposerVersion: RESPONSE_COMPOSER_VERSION,
    searchIndexVersion: SEARCH_INDEX_VERSION,
    language: input.language,
    mode: input.mode,
    answerability: input.answerability,
    answeredAt: input.answeredAt,
    developmentBanner: input.developmentBanner,
  };
}

function composeMultiSourceBlocks(
  articles: readonly KnowledgeArticleDefinition[],
): ComposedAssistantAnswer['blocks'] {
  const blocks: ComposedAssistantAnswer['blocks'][number][] = [];
  for (const article of articles) {
    blocks.push({ kind: 'heading', text: article.title });
    for (const block of article.approvedAnswer) {
      blocks.push(block);
    }
  }
  return blocks;
}
