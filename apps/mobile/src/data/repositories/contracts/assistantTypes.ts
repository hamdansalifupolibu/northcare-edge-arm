import type { EntityId } from '../../domain/value-objects/EntityId';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';

export type AssistantFeedbackCategory = 'helpful' | 'notHelpful' | 'reportContentIssue';

export type AssistantContentIssueCategory =
  | 'unclear'
  | 'outdated'
  | 'sourceMissing'
  | 'doesNotAnswerQuestion'
  | 'potentiallyUnsafe'
  | 'translationIssue'
  | 'other';

export type AssistantFeedbackRecord = {
  readonly id: EntityId;
  readonly articleId: string;
  readonly knowledgePackId: string;
  readonly knowledgePackVersion: number;
  readonly answerMode: string;
  readonly feedbackCategory: AssistantFeedbackCategory;
  readonly contentIssueCategory: AssistantContentIssueCategory | null;
  readonly optionalNote: string | null;
  readonly createdByAccountId: EntityId | null;
  readonly createdAt: IsoUtcTimestamp;
  readonly syncStatus: 'localOnly' | 'pending';
  readonly localVersion: number;
};

export type CreateAssistantFeedbackInput = {
  readonly id?: EntityId;
  readonly articleId: string;
  readonly knowledgePackId: string;
  readonly knowledgePackVersion: number;
  readonly answerMode: string;
  readonly feedbackCategory: AssistantFeedbackCategory;
  readonly contentIssueCategory?: AssistantContentIssueCategory | null;
  readonly optionalNote?: string | null;
  readonly createdByAccountId?: EntityId | null;
};

export type AssistantFeedbackRepository = {
  create(input: CreateAssistantFeedbackInput): Promise<AssistantFeedbackRecord>;
  findById(id: EntityId): Promise<AssistantFeedbackRecord | null>;
  listByArticle(articleId: string): Promise<readonly AssistantFeedbackRecord[]>;
};
