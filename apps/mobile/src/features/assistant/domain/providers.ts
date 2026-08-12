import type { AssistantMode } from './modes';
import type { AnswerCitation, ComposedAssistantAnswer, RichTextBlock } from './types';

/**
 * Future generative provider interface only.
 * Production must not activate without approved model/runtime/prompt/evaluation.
 */
export type ConstrainedAssistantProviderInput = {
  readonly normalisedGeneralQuestion: string;
  readonly approvedRetrievedBlocks: readonly RichTextBlock[];
  readonly allowedAnswerSchemaVersion: number;
  readonly knowledgePackId: string;
  readonly knowledgePackVersion: number;
  readonly language: string;
  readonly providerPolicyVersion: number;
};

export type ConstrainedAssistantProviderOutput = {
  readonly heading: string;
  readonly blocks: readonly RichTextBlock[];
  readonly citations: readonly AnswerCitation[];
  readonly safetyNote: string | null;
};

export type ConstrainedAssistantProvider = {
  readonly providerId: string;
  readonly mode: AssistantMode;
  readonly available: boolean;
  generateGroundedAnswer(
    input: ConstrainedAssistantProviderInput,
  ): Promise<ConstrainedAssistantProviderOutput>;
};

export type RetrievalOnlyProviderResult = {
  readonly mode: 'CURATED_RETRIEVAL' | 'DEVELOPMENT_SIMULATION' | 'UNAVAILABLE';
  readonly answer: ComposedAssistantAnswer | null;
};
