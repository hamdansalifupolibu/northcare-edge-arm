import type { EntityId } from '../../domain/value-objects/EntityId';
import type { IsoUtcTimestamp } from '../../domain/value-objects/timestamps';

export type AssistantConversationTopicIcon =
  | 'pregnancy'
  | 'child'
  | 'referral'
  | 'nutrition'
  | 'general';

export type AssistantConversationRole = 'user' | 'assistant' | 'system';

export type AssistantConversationSummary = {
  readonly id: EntityId;
  /** Auth/session account identifier (not always a UUID in development). */
  readonly accountId: string;
  readonly title: string;
  readonly topicIcon: AssistantConversationTopicIcon;
  readonly createdAt: IsoUtcTimestamp;
  readonly updatedAt: IsoUtcTimestamp;
};

export type AssistantMessageSourceRecord = {
  readonly id: EntityId;
  readonly messageId: EntityId;
  readonly title: string;
  readonly referenceLabel: string | null;
  readonly articleId: string | null;
  readonly sortOrder: number;
};

export type AssistantMessageRecord = {
  readonly id: EntityId;
  readonly conversationId: EntityId;
  readonly role: AssistantConversationRole;
  readonly content: string;
  readonly createdAt: IsoUtcTimestamp;
  readonly sortOrder: number;
  readonly sources: readonly AssistantMessageSourceRecord[];
};

export type AssistantConversationDetail = {
  readonly conversation: AssistantConversationSummary;
  readonly messages: readonly AssistantMessageRecord[];
};

export type CreateAssistantConversationInput = {
  readonly id?: EntityId;
  readonly accountId: string;
  readonly title: string;
  readonly topicIcon: AssistantConversationTopicIcon;
};

export type AppendAssistantMessageInput = {
  readonly id?: EntityId;
  readonly conversationId: EntityId;
  readonly role: AssistantConversationRole;
  readonly content: string;
  readonly sortOrder: number;
  readonly sources?: readonly {
    readonly id?: EntityId;
    readonly title: string;
    readonly referenceLabel?: string | null;
    readonly articleId?: string | null;
    readonly sortOrder: number;
  }[];
};

export type AssistantConversationRepository = {
  createConversation(input: CreateAssistantConversationInput): Promise<AssistantConversationSummary>;
  listConversations(accountId: string): Promise<readonly AssistantConversationSummary[]>;
  getConversationDetail(conversationId: EntityId): Promise<AssistantConversationDetail | null>;
  touchConversation(conversationId: EntityId): Promise<void>;
  updateConversationTitle(conversationId: EntityId, title: string): Promise<void>;
  appendMessage(input: AppendAssistantMessageInput): Promise<AssistantMessageRecord>;
  deleteAllForAccount(accountId: string): Promise<void>;
  softDeleteConversation(conversationId: EntityId): Promise<void>;
};
