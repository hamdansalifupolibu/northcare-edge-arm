import type { Clock } from '../../domain/value-objects/clock';
import type { EntityId } from '../../domain/value-objects/EntityId';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import { assertIsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  AppendAssistantMessageInput,
  AssistantConversationDetail,
  AssistantConversationRepository,
  AssistantConversationSummary,
  AssistantConversationTopicIcon,
  AssistantMessageRecord,
  AssistantMessageSourceRecord,
  CreateAssistantConversationInput,
} from '../contracts/assistantConversationTypes';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';

type ConversationRow = {
  id: string;
  account_id: string;
  title: string;
  topic_icon: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  sort_order: number;
};

type SourceRow = {
  id: string;
  message_id: string;
  title: string;
  reference_label: string | null;
  article_id: string | null;
  sort_order: number;
};

const TOPIC_ICONS = new Set<AssistantConversationTopicIcon>([
  'pregnancy',
  'child',
  'referral',
  'nutrition',
  'general',
]);

function mapTopicIcon(value: string): AssistantConversationTopicIcon {
  if (TOPIC_ICONS.has(value as AssistantConversationTopicIcon)) {
    return value as AssistantConversationTopicIcon;
  }
  throw new RepositoryError('dataIntegrity', 'Invalid assistant conversation topic icon');
}

function mapConversation(row: ConversationRow): AssistantConversationSummary {
  return {
    id: assertEntityId(row.id),
    accountId: row.account_id,
    title: row.title,
    topicIcon: mapTopicIcon(row.topic_icon),
    createdAt: assertIsoUtcTimestamp(row.created_at),
    updatedAt: assertIsoUtcTimestamp(row.updated_at),
  };
}

function mapSource(row: SourceRow): AssistantMessageSourceRecord {
  return {
    id: assertEntityId(row.id),
    messageId: assertEntityId(row.message_id),
    title: row.title,
    referenceLabel: row.reference_label,
    articleId: row.article_id,
    sortOrder: row.sort_order,
  };
}

function mapMessage(
  row: MessageRow,
  sources: readonly AssistantMessageSourceRecord[],
): AssistantMessageRecord {
  if (row.role !== 'user' && row.role !== 'assistant' && row.role !== 'system') {
    throw new RepositoryError('dataIntegrity', 'Invalid assistant message role');
  }
  return {
    id: assertEntityId(row.id),
    conversationId: assertEntityId(row.conversation_id),
    role: row.role,
    content: row.content,
    createdAt: assertIsoUtcTimestamp(row.created_at),
    sortOrder: row.sort_order,
    sources,
  };
}

export function createSqliteAssistantConversationRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): AssistantConversationRepository {
  return {
    async createConversation(input: CreateAssistantConversationInput): Promise<AssistantConversationSummary> {
      try {
        const id = input.id ?? ids.nextId();
        const now = clock.nowIso();
        await db.runAsync(
          `INSERT INTO assistant_conversations (
            id, account_id, title, topic_icon, created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [id, input.accountId, input.title, input.topicIcon, now, now],
        );
        return {
          id,
          accountId: input.accountId,
          title: input.title,
          topicIcon: input.topicIcon,
          createdAt: now,
          updatedAt: now,
        };
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.createConversation');
      }
    },

    async listConversations(accountId: string): Promise<readonly AssistantConversationSummary[]> {
      try {
        const rows = await db.getAllAsync<ConversationRow>(
          `SELECT id, account_id, title, topic_icon, created_at, updated_at
           FROM assistant_conversations
           WHERE account_id = ? AND is_deleted = 0
           ORDER BY updated_at DESC`,
          [accountId],
        );
        return (rows ?? []).map(mapConversation);
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.listConversations');
      }
    },

    async getConversationDetail(conversationId: EntityId): Promise<AssistantConversationDetail | null> {
      try {
        const conversationRow = await db.getFirstAsync<ConversationRow>(
          `SELECT id, account_id, title, topic_icon, created_at, updated_at
           FROM assistant_conversations
           WHERE id = ? AND is_deleted = 0`,
          [conversationId],
        );
        if (!conversationRow) {
          return null;
        }
        const messageRows = await db.getAllAsync<MessageRow>(
          `SELECT id, conversation_id, role, content, created_at, sort_order
           FROM assistant_messages
           WHERE conversation_id = ?
           ORDER BY sort_order ASC`,
          [conversationId],
        );
        const messageIds = messageRows.map((row) => row.id);
        const sourceRows =
          messageIds.length === 0
            ? []
            : await db.getAllAsync<SourceRow>(
                `SELECT id, message_id, title, reference_label, article_id, sort_order
                 FROM assistant_message_sources
                 WHERE message_id IN (${messageIds.map(() => '?').join(', ')})
                 ORDER BY sort_order ASC`,
                messageIds,
              );
        const sourcesByMessage = new Map<string, AssistantMessageSourceRecord[]>();
        for (const source of sourceRows) {
          const bucket = sourcesByMessage.get(source.message_id) ?? [];
          bucket.push(mapSource(source));
          sourcesByMessage.set(source.message_id, bucket);
        }
        return {
          conversation: mapConversation(conversationRow),
          messages: messageRows.map((row) =>
            mapMessage(row, sourcesByMessage.get(row.id) ?? []),
          ),
        };
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.getConversationDetail');
      }
    },

    async touchConversation(conversationId: EntityId): Promise<void> {
      try {
        await db.runAsync(`UPDATE assistant_conversations SET updated_at = ? WHERE id = ?`, [
          clock.nowIso(),
          conversationId,
        ]);
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.touchConversation');
      }
    },

    async updateConversationTitle(conversationId: EntityId, title: string): Promise<void> {
      try {
        await db.runAsync(
          `UPDATE assistant_conversations SET title = ?, updated_at = ? WHERE id = ? AND is_deleted = 0`,
          [title, clock.nowIso(), conversationId],
        );
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.updateConversationTitle');
      }
    },

    async appendMessage(input: AppendAssistantMessageInput): Promise<AssistantMessageRecord> {
      try {
        const id = input.id ?? ids.nextId();
        const createdAt = clock.nowIso();
        await db.runAsync(
          `INSERT INTO assistant_messages (
            id, conversation_id, role, content, created_at, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, input.conversationId, input.role, input.content, createdAt, input.sortOrder],
        );
        const sources: AssistantMessageSourceRecord[] = [];
        for (const source of input.sources ?? []) {
          const sourceId = source.id ?? ids.nextId();
          await db.runAsync(
            `INSERT INTO assistant_message_sources (
              id, message_id, title, reference_label, article_id, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              sourceId,
              id,
              source.title,
              source.referenceLabel ?? null,
              source.articleId ?? null,
              source.sortOrder,
            ],
          );
          sources.push({
            id: sourceId,
            messageId: id,
            title: source.title,
            referenceLabel: source.referenceLabel ?? null,
            articleId: source.articleId ?? null,
            sortOrder: source.sortOrder,
          });
        }
        await db.runAsync(`UPDATE assistant_conversations SET updated_at = ? WHERE id = ?`, [
          createdAt,
          input.conversationId,
        ]);
        return {
          id,
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          createdAt,
          sortOrder: input.sortOrder,
          sources,
        };
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.appendMessage');
      }
    },

    async deleteAllForAccount(accountId: string): Promise<void> {
      try {
        const conversations = await db.getAllAsync<{ id: string }>(
          `SELECT id FROM assistant_conversations WHERE account_id = ?`,
          [accountId],
        );
        for (const conversation of conversations) {
          const messages = await db.getAllAsync<{ id: string }>(
            `SELECT id FROM assistant_messages WHERE conversation_id = ?`,
            [conversation.id],
          );
          for (const message of messages) {
            await db.runAsync(`DELETE FROM assistant_message_sources WHERE message_id = ?`, [
              message.id,
            ]);
          }
          await db.runAsync(`DELETE FROM assistant_messages WHERE conversation_id = ?`, [
            conversation.id,
          ]);
        }
        await db.runAsync(`DELETE FROM assistant_conversations WHERE account_id = ?`, [accountId]);
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.deleteAllForAccount');
      }
    },

    async softDeleteConversation(conversationId: EntityId): Promise<void> {
      try {
        await db.runAsync(
          `UPDATE assistant_conversations SET is_deleted = 1, updated_at = ? WHERE id = ?`,
          [clock.nowIso(), conversationId],
        );
      } catch (error) {
        throw mapSqliteError(error, 'assistantConversations.softDeleteConversation');
      }
    },
  };
}
