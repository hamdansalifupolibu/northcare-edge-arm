import type { Migration } from './types';

/**
 * Local on-device Ask NorthCare conversation history (per worker account).
 * Stored locally for offline access; not synced as unrestricted chat export.
 */
const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  title TEXT NOT NULL,
  topic_icon TEXT NOT NULL CHECK (
    topic_icon IN ('pregnancy', 'child', 'referral', 'nutrition', 'general')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_account
  ON assistant_conversations(account_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation
  ON assistant_messages(conversation_id, sort_order);

CREATE TABLE IF NOT EXISTS assistant_message_sources (
  id TEXT PRIMARY KEY NOT NULL,
  message_id TEXT NOT NULL,
  title TEXT NOT NULL,
  reference_label TEXT,
  article_id TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_assistant_message_sources_message
  ON assistant_message_sources(message_id, sort_order);
`;

export const migration012AssistantConversations: Migration = {
  version: 12,
  name: 'assistant_conversations',
  checksum: 'assistant-conversations-v1',
  async up(db) {
    await db.execAsync(MIGRATION_SQL);
  },
};
