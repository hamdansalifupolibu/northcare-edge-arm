import { SCHEMA_MIGRATIONS_TABLE } from '../constants';
import type { SqliteDriver } from '../connection/SqliteDriver';
import type { Clock } from '../../domain/value-objects/clock';
import { createSystemClock } from '../../domain/value-objects/clock';
import { RepositoryError } from '../../repositories/errors/RepositoryError';
import { detectDuplicateMigrationVersions, getMigrationRegistry } from './registry';
import type { Migration } from './types';

export type AppliedMigration = {
  readonly version: number;
  readonly name: string;
  readonly appliedAt: string;
  readonly checksum: string;
};

export type MigrationRunnerResult = {
  readonly appliedVersions: readonly number[];
  readonly currentVersion: number;
};

async function ensureMigrationsTable(db: SqliteDriver): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRATIONS_TABLE} (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL,
      checksum TEXT NOT NULL
    );
  `);
}

export async function listAppliedMigrations(db: SqliteDriver): Promise<AppliedMigration[]> {
  await ensureMigrationsTable(db);
  return db.getAllAsync<AppliedMigration>(
    `SELECT version, name, applied_at AS appliedAt, checksum
     FROM ${SCHEMA_MIGRATIONS_TABLE}
     ORDER BY version ASC`,
  );
}

export async function getCurrentSchemaVersion(db: SqliteDriver): Promise<number> {
  const applied = await listAppliedMigrations(db);
  if (applied.length === 0) {
    return 0;
  }
  return applied[applied.length - 1]!.version;
}

export async function runMigrations(
  db: SqliteDriver,
  options: {
    readonly migrations?: readonly Migration[];
    readonly clock?: Clock;
  } = {},
): Promise<MigrationRunnerResult> {
  const migrations = [...(options.migrations ?? getMigrationRegistry())].sort(
    (a, b) => a.version - b.version,
  );
  const clock = options.clock ?? createSystemClock();

  const duplicates = detectDuplicateMigrationVersions(migrations);
  if (duplicates.length > 0) {
    throw new RepositoryError(
      'migrationFailed',
      `Duplicate migration versions: ${duplicates.join(', ')}`,
    );
  }

  for (let i = 0; i < migrations.length; i += 1) {
    const expected = i + 1;
    if (migrations[i]!.version !== expected) {
      throw new RepositoryError(
        'migrationFailed',
        `Migration sequence gap: expected version ${expected}, found ${migrations[i]!.version}`,
      );
    }
  }

  await ensureMigrationsTable(db);
  const applied = await listAppliedMigrations(db);
  const appliedVersions = new Set(applied.map((row) => row.version));
  const newlyApplied: number[] = [];

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    try {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.runAsync(
          `INSERT INTO ${SCHEMA_MIGRATIONS_TABLE} (version, name, applied_at, checksum)
           VALUES (?, ?, ?, ?)`,
          [migration.version, migration.name, clock.nowIso(), migration.checksum],
        );
      });
      newlyApplied.push(migration.version);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      throw new RepositoryError(
        'migrationFailed',
        `Migration ${migration.version} (${migration.name}) failed`,
        { causeCategory: message.slice(0, 120) },
      );
    }
  }

  return {
    appliedVersions: newlyApplied,
    currentVersion: await getCurrentSchemaVersion(db),
  };
}
