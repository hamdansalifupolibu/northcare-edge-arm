/**
 * Thin SQL driver abstraction.
 * Production uses Expo SQLite; tests may use Node's built-in SQLite.
 * Screens must never receive this interface.
 */

export type SqlRunResult = {
  readonly changes: number;
  readonly lastInsertRowId: number;
};

export type SqliteDriver = {
  readonly name: string;
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: readonly unknown[]): Promise<SqlRunResult>;
  getAllAsync<T>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
};

export type OpenSqliteDriverOptions = {
  readonly databaseName: string;
  /** When true, open an in-memory database (tests). */
  readonly inMemory?: boolean;
};
