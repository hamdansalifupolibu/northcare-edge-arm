import type { AnswerabilityOutcome } from '../domain/statuses';
import type { AssistantSearchIndex, IndexedArticle } from './indexBuilder';
import { evaluateCoverage, type CoverageResult } from './coverage';
import { rankCandidates, type RankedCandidate } from './ranking';
import { tokenize } from './tokenizer';

export type RetrievalSearchResult = {
  readonly coverage: CoverageResult;
  readonly ranked: readonly RankedCandidate[];
  readonly candidateCount: number;
  readonly indexVersion: number;
};

/**
 * Deterministic local inverted-index search.
 * No network, embeddings, or vector DB.
 */
export function searchKnowledgeIndex(input: {
  readonly index: AssistantSearchIndex;
  readonly normalisedQuery: string;
  readonly language: string;
  readonly selectedTopicId?: string | null;
}): RetrievalSearchResult {
  const languageFiltered = input.index.articles.filter(
    (article) => article.language === input.language,
  );

  if (languageFiltered.length === 0) {
    return {
      coverage: { answerability: 'unsupportedTopic', selected: [] },
      ranked: [],
      candidateCount: 0,
      indexVersion: input.index.indexVersion,
    };
  }

  const topicScoped = input.selectedTopicId
    ? languageFiltered.filter((a) => a.topicId === input.selectedTopicId)
    : languageFiltered;

  const queryTokens = tokenize(input.normalisedQuery);
  const candidateIds = new Set<string>();
  for (const token of queryTokens) {
    for (const articleId of input.index.inverted.get(token) ?? []) {
      candidateIds.add(articleId);
    }
  }
  for (const article of topicScoped) {
    if (article.questionPatterns.includes(input.normalisedQuery)) {
      candidateIds.add(article.articleId);
    }
  }

  const candidates: IndexedArticle[] = topicScoped.filter((a) =>
    candidateIds.has(a.articleId),
  );

  const ranked = rankCandidates({
    normalisedQuery: input.normalisedQuery,
    selectedTopicId: input.selectedTopicId,
    candidates: candidates.length > 0 ? candidates : topicScoped,
  });

  const coverage = evaluateCoverage({
    normalisedQuery: input.normalisedQuery,
    ranked,
  });

  return {
    coverage,
    ranked,
    candidateCount: ranked.length,
    indexVersion: input.index.indexVersion,
  };
}

export function answerabilityFromCoverage(
  coverage: CoverageResult,
): AnswerabilityOutcome {
  return coverage.answerability;
}
