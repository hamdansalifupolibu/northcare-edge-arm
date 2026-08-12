import type { IndexedArticle } from './indexBuilder';
import { tokenize } from './tokenizer';

export type RankedCandidate = {
  readonly articleId: string;
  readonly score: number;
  readonly matchKind: 'exactQuestion' | 'title' | 'keyword' | 'alternativePhrase' | 'topic';
  readonly article: IndexedArticle;
};

/**
 * Deterministic ranking with stable tie-break on articleId.
 * Scores are discrete integers — not shown to workers.
 */
export function rankCandidates(input: {
  readonly normalisedQuery: string;
  readonly selectedTopicId?: string | null;
  readonly candidates: readonly IndexedArticle[];
}): readonly RankedCandidate[] {
  const queryTokens = tokenize(input.normalisedQuery);
  const ranked: RankedCandidate[] = [];

  for (const article of input.candidates) {
    let score = 0;
    let matchKind: RankedCandidate['matchKind'] = 'keyword';

    if (article.questionPatterns.includes(input.normalisedQuery)) {
      score = 1000;
      matchKind = 'exactQuestion';
    } else {
      const titleHits = countHits(queryTokens, article.titleTokens);
      const keywordHits = countHits(queryTokens, article.keywordTokens);
      const phraseHits = countHits(queryTokens, article.phraseTokens);
      score = titleHits * 40 + keywordHits * 25 + phraseHits * 30;
      if (titleHits > 0) {
        matchKind = 'title';
      } else if (phraseHits > 0) {
        matchKind = 'alternativePhrase';
      } else {
        matchKind = 'keyword';
      }
      if (input.selectedTopicId && article.topicId === input.selectedTopicId) {
        score += 15;
        if (score < 40) {
          matchKind = 'topic';
        }
      }
    }

    if (score > 0) {
      ranked.push({
        articleId: article.articleId,
        score,
        matchKind,
        article,
      });
    }
  }

  return ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.articleId.localeCompare(b.articleId);
  });
}

function countHits(queryTokens: readonly string[], target: readonly string[]): number {
  const targetSet = new Set(target);
  let hits = 0;
  for (const token of queryTokens) {
    if (targetSet.has(token)) {
      hits += 1;
    }
  }
  return hits;
}
