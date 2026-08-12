import type { AnswerabilityOutcome } from '../domain/statuses';
import type { RankedCandidate } from './ranking';
import { tokenize } from './tokenizer';

/** Minimum discrete score required for a confident answer. Weak matches fail closed. */
export const COVERAGE_SCORE_THRESHOLD = 50;

/** Minimum fraction of query tokens that must hit for non-exact matches. */
export const COVERAGE_TOKEN_RATIO = 0.4;

export type CoverageResult =
  | {
      readonly answerability: 'answerAvailable' | 'multipleRelevantSources';
      readonly selected: readonly RankedCandidate[];
    }
  | {
      readonly answerability: Extract<
        AnswerabilityOutcome,
        'insufficientCoverage' | 'unsupportedTopic'
      >;
      readonly selected: readonly [];
    };

export function evaluateCoverage(input: {
  readonly normalisedQuery: string;
  readonly ranked: readonly RankedCandidate[];
}): CoverageResult {
  if (input.ranked.length === 0) {
    return { answerability: 'unsupportedTopic', selected: [] };
  }

  const top = input.ranked[0];
  if (!top) {
    return { answerability: 'unsupportedTopic', selected: [] };
  }

  if (top.matchKind === 'exactQuestion') {
    const exactPeers = input.ranked.filter((c) => c.matchKind === 'exactQuestion');
    if (exactPeers.length > 1) {
      return { answerability: 'multipleRelevantSources', selected: exactPeers.slice(0, 3) };
    }
    return { answerability: 'answerAvailable', selected: [top] };
  }

  const queryTokens = tokenize(input.normalisedQuery);
  const covered = queryTokens.filter((token) =>
    [...top.article.titleTokens, ...top.article.keywordTokens, ...top.article.phraseTokens].includes(
      token,
    ),
  );
  const ratio = queryTokens.length === 0 ? 0 : covered.length / queryTokens.length;

  if (top.score < COVERAGE_SCORE_THRESHOLD || ratio < COVERAGE_TOKEN_RATIO) {
    return { answerability: 'insufficientCoverage', selected: [] };
  }

  const strong = input.ranked.filter(
    (c) => c.score >= COVERAGE_SCORE_THRESHOLD && c.score >= top.score - 10,
  );
  if (strong.length > 1) {
    return { answerability: 'multipleRelevantSources', selected: strong.slice(0, 3) };
  }
  return { answerability: 'answerAvailable', selected: [top] };
}
