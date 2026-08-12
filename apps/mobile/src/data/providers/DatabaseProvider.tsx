import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getAppConfig } from '../../config/appConfig';
import { createLogger } from '../../logging/logger';
import {
  createDatabaseManager,
  type DatabaseManager,
} from '../database/connection/DatabaseManager';
import { getSharedDatabaseManager } from '../database/connection/sharedDatabaseManager';
import { CURRENT_SCHEMA_VERSION, isDatabaseResetAllowed } from '../database/constants';
import type { AppliedMigration } from '../database/migrations/MigrationRunner';
import { runRepositorySelfCheck, type SelfCheckResult } from '../diagnostics/selfCheck';
import {
  seedSyntheticDatabase,
  type SyntheticSeedResult,
} from '../fixtures/syntheticSeed';
import type { SqliteDriver } from '../database/connection/SqliteDriver';
import type { RepositoryContainer } from '../repositories/contracts/types';
import { createSqliteRepositories } from '../repositories/sqlite/createSqliteRepositories';
import { isRepositoryError } from '../repositories/errors/RepositoryError';
import type { DatabaseReadiness } from './databaseReadiness';

type DatabaseContextValue = {
  readonly readiness: DatabaseReadiness;
  readonly schemaVersion: number | null;
  readonly appliedMigrations: readonly AppliedMigration[];
  readonly errorMessage: string | null;
  readonly repositories: RepositoryContainer | null;
  readonly getDriver: () => SqliteDriver | null;
  readonly retry: () => Promise<void>;
  readonly seedSynthetic: () => Promise<SyntheticSeedResult>;
  readonly resetDatabase: () => Promise<void>;
  readonly runSelfCheck: () => Promise<SelfCheckResult>;
  readonly getTableNames: () => Promise<string[]>;
  readonly getSyntheticCounts: () => Promise<Record<string, number>>;
  readonly runInTransaction: (task: () => Promise<void>) => Promise<void>;
  readonly countPendingSyncItems: () => Promise<number>;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

const logger = createLogger({ environment: getAppConfig().appEnv });
const DATABASE_INIT_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function DatabaseProvider({
  children,
  managerFactory = getSharedDatabaseManager,
}: {
  readonly children: ReactNode;
  readonly managerFactory?: typeof createDatabaseManager;
}) {
  const [manager] = useState<DatabaseManager>(() => managerFactory());
  const [readiness, setReadiness] = useState<DatabaseReadiness>('idle');
  const [schemaVersion, setSchemaVersion] = useState<number | null>(null);
  const [appliedMigrations, setAppliedMigrations] = useState<AppliedMigration[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<RepositoryContainer | null>(null);
  const initGenerationRef = useRef(0);

  const initialise = useCallback(async () => {
    const generation = ++initGenerationRef.current;
    setReadiness('opening');
    setErrorMessage(null);
    try {
      setReadiness('migrating');
      const result = await withTimeout(
        manager.openAndMigrate(),
        DATABASE_INIT_TIMEOUT_MS,
        'Local database initialisation',
      );
      if (generation !== initGenerationRef.current) {
        return;
      }
      const repos = createSqliteRepositories(manager.getDriver());
      const migrations = await manager.listMigrations();
      if (generation !== initGenerationRef.current) {
        return;
      }
      setRepositories(repos);
      setSchemaVersion(result.currentVersion);
      setAppliedMigrations(migrations);
      setReadiness('ready');
      logger.info('Local database ready', {
        schemaVersion: result.currentVersion,
        migrationsApplied: result.appliedVersions.length,
      });
    } catch (error) {
      if (generation !== initGenerationRef.current) {
        return;
      }
      const category = isRepositoryError(error) ? error.category : 'unknown';
      const reason =
        error instanceof Error ? error.message.slice(0, 200) : 'unknown database error';
      logger.error('Local database initialisation failed', { category, reason });
      setRepositories(null);
      setSchemaVersion(null);
      setAppliedMigrations([]);
      setErrorMessage('Local storage could not be prepared.');
      setReadiness('failed');
    }
  }, [manager]);

  useEffect(() => {
    void initialise();
    return () => {
      initGenerationRef.current += 1;
    };
  }, [initialise]);

  const seedSynthetic = useCallback(async () => {
    if (!repositories) {
      throw new Error('Database is not ready');
    }
    if (getAppConfig().appEnv === 'production') {
      throw new Error('Synthetic seed is not available in production');
    }
    return seedSyntheticDatabase(repositories);
  }, [repositories]);

  const resetDatabase = useCallback(async () => {
    const env = getAppConfig().appEnv;
    if (!isDatabaseResetAllowed(env)) {
      throw new Error('Database reset is not available in this environment');
    }
    setReadiness('opening');
    await manager.resetForDevelopment(env);
    const repos = createSqliteRepositories(manager.getDriver());
    const migrations = await manager.listMigrations();
    const version = await manager.getSchemaVersion();
    setRepositories(repos);
    setAppliedMigrations(migrations);
    setSchemaVersion(version);
    setErrorMessage(null);
    setReadiness('ready');
    logger.info('Development database reset complete', {
      schemaVersion: version ?? CURRENT_SCHEMA_VERSION,
    });
  }, [manager]);

  const runSelfCheck = useCallback(async () => {
    if (!repositories) {
      throw new Error('Database is not ready');
    }
    return runRepositorySelfCheck(repositories);
  }, [repositories]);

  const getTableNames = useCallback(async () => {
    const db = manager.getDriver();
    const rows = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC`,
    );
    return rows.map((row) => row.name);
  }, [manager]);

  const getSyntheticCounts = useCallback(async () => {
    const db = manager.getDriver();
    const tables = [
      'facilities',
      'clients',
      'caregivers',
      'encounters',
      'screenings',
      'referrals',
      'sync_queue_items',
      'audit_events',
    ] as const;
    const counts: Record<string, number> = {};
    for (const table of tables) {
      const row = await db.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) AS c FROM ${table}`,
      );
      counts[table] = row?.c ?? 0;
    }
    return counts;
  }, [manager]);

  const runInTransaction = useCallback(
    async (task: () => Promise<void>) => {
      await manager.withTransaction(task);
    },
    [manager],
  );

  const countPendingSyncItems = useCallback(async () => {
    if (!repositories) {
      return 0;
    }
    const pending = await repositories.syncQueue.listByState('pending');
    return pending.length;
  }, [repositories]);

  const getDriver = useCallback((): SqliteDriver | null => {
    if (readiness !== 'ready') {
      return null;
    }
    try {
      return manager.getDriver();
    } catch {
      return null;
    }
  }, [manager, readiness]);

  const value = useMemo(
    (): DatabaseContextValue => ({
      readiness,
      schemaVersion,
      appliedMigrations,
      errorMessage,
      repositories,
      getDriver,
      retry: initialise,
      seedSynthetic,
      resetDatabase,
      runSelfCheck,
      getTableNames,
      getSyntheticCounts,
      runInTransaction,
      countPendingSyncItems,
    }),
    [
      appliedMigrations,
      countPendingSyncItems,
      errorMessage,
      getDriver,
      getSyntheticCounts,
      getTableNames,
      initialise,
      readiness,
      repositories,
      resetDatabase,
      runInTransaction,
      runSelfCheck,
      schemaVersion,
      seedSynthetic,
    ],
  );

  return (
    <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (ctx === null) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return ctx;
}

/** Optional hook when provider may be absent in older tests. */
export function useDatabaseOptional(): DatabaseContextValue | null {
  return useContext(DatabaseContext);
}
