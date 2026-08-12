import {
  CURRENT_SCHEMA_VERSION,
  DATABASE_NAME,
  isDatabaseResetAllowed,
} from '../constants';
import {
  getCurrentSchemaVersion,
  listAppliedMigrations,
  runMigrations,
  type AppliedMigration,
  type MigrationRunnerResult,
} from '../migrations/MigrationRunner';
import type { Clock } from '../../domain/value-objects/clock';
import { createSystemClock } from '../../domain/value-objects/clock';
import { RepositoryError } from '../../repositories/errors/RepositoryError';
import { createExpoSqliteDriver } from './ExpoSqliteDriver';
import type { OpenSqliteDriverOptions, SqliteDriver } from './SqliteDriver';

export type DatabaseManagerOptions = {
  readonly databaseName?: string;
  readonly inMemory?: boolean;
  readonly clock?: Clock;
  readonly openDriver?: (options: OpenSqliteDriverOptions) => Promise<SqliteDriver>;
  readonly enableWal?: boolean;
};

export type DatabaseManager = {
  readonly openAndMigrate: () => Promise<MigrationRunnerResult>;
  readonly getDriver: () => SqliteDriver;
  readonly isOpen: () => boolean;
  readonly getSchemaVersion: () => Promise<number>;
  readonly listMigrations: () => Promise<AppliedMigration[]>;
  readonly withTransaction: (task: () => Promise<void>) => Promise<void>;
  readonly close: () => Promise<void>;
  readonly resetForDevelopment: (appEnv: string) => Promise<MigrationRunnerResult>;
};

/**
 * Single controlled connection manager.
 * Screens must never receive the raw driver.
 */
export function createDatabaseManager(
  options: DatabaseManagerOptions = {},
): DatabaseManager {
  const databaseName = options.databaseName ?? DATABASE_NAME;
  const clock = options.clock ?? createSystemClock();
  const openDriver = options.openDriver ?? createExpoSqliteDriver;
  const enableWal = options.enableWal ?? true;

  let driver: SqliteDriver | null = null;
  let opening: Promise<MigrationRunnerResult> | null = null;
  let closing: Promise<void> | null = null;

  async function waitForClose(): Promise<void> {
    if (closing) {
      await closing;
    }
  }

  async function configurePragmas(db: SqliteDriver): Promise<void> {
    await db.execAsync('PRAGMA foreign_keys = ON;');
    if (enableWal && !options.inMemory) {
      // WAL improves concurrency; skipped for in-memory test DBs.
      await db.execAsync('PRAGMA journal_mode = WAL;');
    }
  }

  async function openAndMigrate(): Promise<MigrationRunnerResult> {
    await waitForClose();
    if (driver) {
      const version = await getCurrentSchemaVersion(driver);
      return { appliedVersions: [], currentVersion: version };
    }
    if (opening) {
      return opening;
    }

    opening = (async () => {
      try {
        const db = await openDriver({
          databaseName,
          inMemory: options.inMemory,
        });
        await configurePragmas(db);
        const result = await runMigrations(db, { clock });
        if (result.currentVersion !== CURRENT_SCHEMA_VERSION) {
          throw new RepositoryError(
            'migrationFailed',
            `Expected schema version ${CURRENT_SCHEMA_VERSION}, got ${result.currentVersion}`,
          );
        }
        driver = db;
        return result;
      } finally {
        opening = null;
      }
    })();

    return opening;
  }

  function getDriver(): SqliteDriver {
    if (!driver) {
      throw new RepositoryError('storageUnavailable', 'Database is not open');
    }
    return driver;
  }

  return {
    openAndMigrate,
    getDriver,
    isOpen: () => driver !== null,
    getSchemaVersion: async () => getCurrentSchemaVersion(getDriver()),
    listMigrations: async () => listAppliedMigrations(getDriver()),
    withTransaction: async (task) => {
      try {
        await getDriver().withTransactionAsync(task);
      } catch (error) {
        if (error instanceof RepositoryError) {
          throw error;
        }
        // Preserve typed application/domain errors thrown inside the transaction
        // (e.g. VoiceError). Masking them as a generic transaction failure hides
        // actionable save/validation messages from the UI.
        if (
          error instanceof Error &&
          error.name !== 'Error' &&
          !error.name.toLowerCase().includes('sqlite')
        ) {
          throw error;
        }
        throw new RepositoryError(
          'transactionFailed',
          error instanceof Error && error.message
            ? `Transaction failed: ${error.message.slice(0, 160)}`
            : 'Transaction failed',
        );
      }
    },
    close: async () => {
      if (closing) {
        return closing;
      }
      closing = (async () => {
        if (opening) {
          try {
            await opening;
          } catch {
            // Opening failed — nothing to close yet.
          }
        }
        if (driver) {
          await driver.closeAsync();
          driver = null;
        }
      })();
      try {
        await closing;
      } finally {
        closing = null;
      }
    },
    resetForDevelopment: async (appEnv: string) => {
      if (!isDatabaseResetAllowed(appEnv)) {
        throw new RepositoryError(
          'storageUnavailable',
          'Database reset is not available in this environment',
        );
      }
      if (driver) {
        await driver.closeAsync();
        driver = null;
      }
      // Re-open with a fresh in-memory or file DB. File DBs require delete —
      // Expo path: reopen after close; for tests inMemory always starts empty.
      if (!options.inMemory) {
        // Drop all user tables by recreating via deleteDatabaseAsync when Expo.
        try {
          const SQLite = await import('expo-sqlite');
          if (typeof SQLite.deleteDatabaseAsync === 'function') {
            await SQLite.deleteDatabaseAsync(databaseName);
          }
        } catch {
          // Node/test drivers ignore Expo delete.
        }
      }
      return openAndMigrate();
    },
  };
}
