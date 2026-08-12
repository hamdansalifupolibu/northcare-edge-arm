import * as SQLite from 'expo-sqlite';
import type { SQLiteBindValue } from 'expo-sqlite';

import type { OpenSqliteDriverOptions, SqliteDriver, SqlRunResult } from './SqliteDriver';

function asBindValues(params: readonly unknown[]): SQLiteBindValue[] {
  return params as SQLiteBindValue[];
}

/**
 * Expo SQLite async API driver (SDK 57 — not deprecated WebSQL).
 */
export async function createExpoSqliteDriver(
  options: OpenSqliteDriverOptions,
): Promise<SqliteDriver> {
  const databaseName = options.inMemory ? ':memory:' : options.databaseName;
  const db = await SQLite.openDatabaseAsync(databaseName);

  return {
    name: `expo-sqlite:${databaseName}`,
    async execAsync(sql: string): Promise<void> {
      await db.execAsync(sql);
    },
    async runAsync(sql: string, params: readonly unknown[] = []): Promise<SqlRunResult> {
      const result = await db.runAsync(sql, ...asBindValues(params));
      return {
        changes: result.changes,
        lastInsertRowId: result.lastInsertRowId,
      };
    },
    async getAllAsync<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
      return db.getAllAsync<T>(sql, ...asBindValues(params));
    },
    async getFirstAsync<T>(
      sql: string,
      params: readonly unknown[] = [],
    ): Promise<T | null> {
      const row = await db.getFirstAsync<T>(sql, ...asBindValues(params));
      return row ?? null;
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      await db.withTransactionAsync(task);
    },
    async closeAsync(): Promise<void> {
      await db.closeAsync();
    },
  };
}
