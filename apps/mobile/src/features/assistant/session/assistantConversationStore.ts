import type {
  AssistantAskResult,
  AssistantAvailability,
  ComposedAssistantAnswer,
  AssistantBoundaryResult,
} from '../domain/types';

type ConversationState = {
  draftQuestion: string;
  selectedTopicId: string | null;
  lastResult: AssistantAskResult | null;
  resultsById: Map<string, AssistantAskResult>;
};

let state: ConversationState = createEmptyState();

function createEmptyState(): ConversationState {
  return {
    draftQuestion: '',
    selectedTopicId: null,
    lastResult: null,
    resultsById: new Map(),
  };
}

/** Cleared on lock, logout, and change account. Never persisted. */
export function clearAssistantConversation(): void {
  state = createEmptyState();
}

export function setAssistantDraftQuestion(question: string): void {
  state.draftQuestion = question;
}

export function getAssistantDraftQuestion(): string {
  return state.draftQuestion;
}

export function setAssistantSelectedTopicId(topicId: string | null): void {
  state.selectedTopicId = topicId;
}

export function getAssistantSelectedTopicId(): string | null {
  return state.selectedTopicId;
}

export function storeAssistantResult(result: AssistantAskResult): void {
  const answerId =
    result.kind === 'answer'
      ? result.answer.answerId
      : result.kind === 'boundary'
        ? result.boundary.answerId
        : result.answerId;
  state.resultsById.set(answerId, result);
  state.lastResult = result;
  // Clear draft after processing — raw question not retained by default.
  state.draftQuestion = '';
}

export function getAssistantResult(answerId: string): AssistantAskResult | null {
  return state.resultsById.get(answerId) ?? null;
}

export function getLastAssistantResult(): AssistantAskResult | null {
  return state.lastResult;
}

export function getStoredAnswer(answerId: string): ComposedAssistantAnswer | null {
  const result = getAssistantResult(answerId);
  return result?.kind === 'answer' ? result.answer : null;
}

export function getStoredBoundary(answerId: string): AssistantBoundaryResult | null {
  const result = getAssistantResult(answerId);
  return result?.kind === 'boundary' ? result.boundary : null;
}

let cachedAvailability: AssistantAvailability | null = null;

export function cacheAssistantAvailability(availability: AssistantAvailability): void {
  cachedAvailability = availability;
}

export function getCachedAssistantAvailability(): AssistantAvailability | null {
  return cachedAvailability;
}
