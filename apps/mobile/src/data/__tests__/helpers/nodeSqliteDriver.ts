/**
 * Node.js SQLite driver for Jest contract/migration tests.
 * Uses node:sqlite (experimental). Never import from production app code.
 */

import { DatabaseSync } from 'node:sqlite';

import type {
  OpenSqliteDriverOptions,
  SqliteDriver,
  SqlRunResult,
} from '../../database/connection/SqliteDriver';

function normalizeDriverError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const record = error as { message?: unknown; code?: unknown; errstr?: unknown };
    const message = String(record.message ?? record.errstr ?? 'SQLite driver error');
    const normalized = new Error(message);
    if (record.code != null) {
      (normalized as Error & { code?: string }).code = String(record.code);
    }
    if (record.errstr != null) {
      (normalized as Error & { errstr?: string }).errstr = String(record.errstr);
    }
    return normalized;
  }
  return new Error(String(error));
}

export async function createNodeSqliteDriver(
  options: OpenSqliteDriverOptions = { databaseName: ':memory:', inMemory: true },
): Promise<SqliteDriver> {
  const path = options.inMemory ? ':memory:' : options.databaseName;
  const db = new DatabaseSync(path);

  return {
    name: `node-sqlite:${path}`,
    async execAsync(sql: string): Promise<void> {
      try {
        db.exec(sql);
      } catch (error) {
        throw normalizeDriverError(error);
      }
    },
    async runAsync(sql: string, params: readonly unknown[] = []): Promise<SqlRunResult> {
      try {
        const statement = db.prepare(sql);
        const result = statement.run(...params);
        return {
          changes: Number(result.changes ?? 0),
          lastInsertRowId: Number(result.lastInsertRowid ?? 0),
        };
      } catch (error) {
        throw normalizeDriverError(error);
      }
    },
    async getAllAsync<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
      try {
        const statement = db.prepare(sql);
        return statement.all(...params) as T[];
      } catch (error) {
        throw normalizeDriverError(error);
      }
    },
    async getFirstAsync<T>(
      sql: string,
      params: readonly unknown[] = [],
    ): Promise<T | null> {
      try {
        const statement = db.prepare(sql);
        const row = statement.get(...params) as T | undefined;
        return row ?? null;
      } catch (error) {
        throw normalizeDriverError(error);
      }
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw normalizeDriverError(error);
      }
    },
    async closeAsync(): Promise<void> {
      db.close();
    },
  };
}
