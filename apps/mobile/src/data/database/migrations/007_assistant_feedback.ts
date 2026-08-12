import type { Migration } from './types';

/**
 * Stage 13: local assistant feedback + content-issue tables.
 * Knowledge packs remain bundled TypeScript assets (not imported here).
 * No unrestricted chat-history tables. No raw question columns.
 */
const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS assistant_feedback (
  id TEXT PRIMARY KEY NOT NULL,
  article_id TEXT NOT NULL,
  knowledge_pack_id TEXT NOT NULL,
  knowledge_pack_version INTEGER NOT NULL CHECK (knowledge_pack_version >= 1),
  answer_mode TEXT NOT NULL,
  feedback_category TEXT NOT NULL CHECK (
    feedback_category IN ('helpful', 'notHelpful', 'reportContentIssue')
  ),
  content_issue_category TEXT CHECK (
    content_issue_category IS NULL OR content_issue_category IN (
      'unclear', 'outdated', 'sourceMissing', 'doesNotAnswerQuestion',
      'potentiallyUnsafe', 'translationIssue', 'other'
    )
  ),
  optional_note TEXT,
  created_by_account_id TEXT,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'localOnly',
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_assistant_feedback_article
  ON assistant_feedback(article_id);

CREATE INDEX IF NOT EXISTS idx_assistant_feedback_pack
  ON assistant_feedback(knowledge_pack_id, knowledge_pack_version);

CREATE TABLE IF NOT EXISTS assistant_content_issues (
  id TEXT PRIMARY KEY NOT NULL,
  article_id TEXT NOT NULL,
  knowledge_pack_id TEXT NOT NULL,
  knowledge_pack_version INTEGER NOT NULL CHECK (knowledge_pack_version >= 1),
  issue_category TEXT NOT NULL CHECK (
    issue_category IN (
      'unclear', 'outdated', 'sourceMissing', 'doesNotAnswerQuestion',
      'potentiallyUnsafe', 'translationIssue', 'other'
    )
  ),
  optional_note TEXT,
  created_by_account_id TEXT,
  created_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  local_version INTEGER NOT NULL DEFAULT 1 CHECK (local_version >= 1),
  server_version INTEGER,
  last_synced_at TEXT,
  deleted_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_assistant_content_issues_article
  ON assistant_content_issues(article_id);
`;

export const migration007AssistantFeedback: Migration = {
  version: 7,
  name: 'assistant_feedback',
  checksum: 'stage13-assistant-feedback-v1',
  async up(db) {
    await db.execAsync(MIGRATION_SQL);
  },
};
