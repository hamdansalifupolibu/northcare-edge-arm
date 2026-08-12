import type { AssistantMode } from '../domain/modes';
import { buildBoundaryResult } from '../domain/policies';
import type { AnswerabilityOutcome } from '../domain/statuses';
import type { AssistantBoundaryResult } from '../domain/types';

export function buildUnavailableFallback(input: {
  readonly answerId: string;
  readonly mode: AssistantMode;
  readonly answeredAt: string;
  readonly developmentBanner: string | null;
  readonly answerability?: AnswerabilityOutcome;
  readonly relatedTopicIds?: readonly string[];
}): AssistantBoundaryResult {
  return buildBoundaryResult({
    answerId: input.answerId,
    answerability: input.answerability ?? 'contentUnavailable',
    mode: input.mode,
    answeredAt: input.answeredAt,
    developmentBanner: input.developmentBanner,
    relatedTopicIds: input.relatedTopicIds,
  });
}
