import type { Clock } from '../../domain/value-objects/clock';
import { assertEntityId } from '../../domain/value-objects/EntityId';
import type { IdGenerator } from '../../domain/value-objects/idGenerator';
import { assertIsoUtcTimestamp } from '../../domain/value-objects/timestamps';
import type { SqliteDriver } from '../../database/connection/SqliteDriver';
import type {
  AssistantFeedbackRecord,
  AssistantFeedbackRepository,
  CreateAssistantFeedbackInput,
} from '../contracts/assistantTypes';
import { mapSqliteError } from '../errors/mapSqliteError';
import { RepositoryError } from '../errors/RepositoryError';

type FeedbackRow = {
  id: string;
  article_id: string;
  knowledge_pack_id: string;
  knowledge_pack_version: number;
  answer_mode: string;
  feedback_category: string;
  content_issue_category: string | null;
  optional_note: string | null;
  created_by_account_id: string | null;
  created_at: string;
  sync_status: string;
  local_version: number;
};

function mapFeedback(row: FeedbackRow): AssistantFeedbackRecord {
  if (
    row.feedback_category !== 'helpful' &&
    row.feedback_category !== 'notHelpful' &&
    row.feedback_category !== 'reportContentIssue'
  ) {
    throw new RepositoryError('dataIntegrity', 'Invalid feedback category');
  }
  if (row.sync_status !== 'localOnly' && row.sync_status !== 'pending') {
    throw new RepositoryError('dataIntegrity', 'Invalid feedback sync status');
  }
  return {
    id: assertEntityId(row.id),
    articleId: row.article_id,
    knowledgePackId: row.knowledge_pack_id,
    knowledgePackVersion: row.knowledge_pack_version,
    answerMode: row.answer_mode,
    feedbackCategory: row.feedback_category,
    contentIssueCategory: row.content_issue_category as AssistantFeedbackRecord['contentIssueCategory'],
    optionalNote: row.optional_note,
    createdByAccountId: row.created_by_account_id
      ? assertEntityId(row.created_by_account_id)
      : null,
    createdAt: assertIsoUtcTimestamp(row.created_at),
    syncStatus: row.sync_status,
    localVersion: row.local_version,
  };
}

export function createSqliteAssistantFeedbackRepository(
  db: SqliteDriver,
  ids: IdGenerator,
  clock: Clock,
): AssistantFeedbackRepository {
  return {
    async create(input: CreateAssistantFeedbackInput): Promise<AssistantFeedbackRecord> {
      try {
        const id = input.id ?? ids.nextId();
        const createdAt = clock.nowIso();
        const syncStatus =
          input.feedbackCategory === 'reportContentIssue' ? 'pending' : 'localOnly';
        await db.runAsync(
          `INSERT INTO assistant_feedback (
            id, article_id, knowledge_pack_id, knowledge_pack_version, answer_mode,
            feedback_category, content_issue_category, optional_note,
            created_by_account_id, created_at, sync_status, local_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            id,
            input.articleId,
            input.knowledgePackId,
            input.knowledgePackVersion,
            input.answerMode,
            input.feedbackCategory,
            input.contentIssueCategory ?? null,
            input.optionalNote ?? null,
            input.createdByAccountId ?? null,
            createdAt,
            syncStatus,
          ],
        );
        const row = await db.getFirstAsync<FeedbackRow>(
          `SELECT * FROM assistant_feedback WHERE id = ?`,
          [id],
        );
        if (!row) {
          throw new RepositoryError('notFound', 'Feedback not found after insert');
        }
        return mapFeedback(row);
      } catch (error) {
        throw mapSqliteError(error, 'assistantFeedback.create');
      }
    },

    async findById(id) {
      try {
        const row = await db.getFirstAsync<FeedbackRow>(
          `SELECT * FROM assistant_feedback WHERE id = ? AND is_deleted = 0`,
          [id],
        );
        return row ? mapFeedback(row) : null;
      } catch (error) {
        throw mapSqliteError(error, 'assistantFeedback.findById');
      }
    },

    async listByArticle(articleId) {
      try {
        const rows = await db.getAllAsync<FeedbackRow>(
          `SELECT * FROM assistant_feedback
           WHERE article_id = ? AND is_deleted = 0
           ORDER BY created_at DESC`,
          [articleId],
        );
        return rows.map(mapFeedback);
      } catch (error) {
        throw mapSqliteError(error, 'assistantFeedback.listByArticle');
      }
    },
  };
}
