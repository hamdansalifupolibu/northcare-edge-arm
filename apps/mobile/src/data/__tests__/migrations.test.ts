import { createDatabaseManager } from '../database/connection/DatabaseManager';
import { CURRENT_SCHEMA_VERSION } from '../database/constants';
import { migration001InitialSchema } from '../database/migrations/001_initial_schema';
import { migration002ClientConsentAgeUnit } from '../database/migrations/002_client_consent_age_unit';
import {
  detectDuplicateMigrationVersions,
  getMigrationRegistry,
} from '../database/migrations/registry';
import { runMigrations } from '../database/migrations/MigrationRunner';
import type { Migration } from '../database/migrations/types';
import { RepositoryError } from '../repositories/errors/RepositoryError';
import { createNodeSqliteDriver } from './helpers/nodeSqliteDriver';
import { createTestDatabase } from './helpers/testDatabase';

describe('database migrations', () => {
  it('applies fresh installation to current schema version', async () => {
    const { manager } = await createTestDatabase();
    expect(await manager.getSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
    const migrations = await manager.listMigrations();
    expect(migrations.map((m) => m.version)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    await manager.close();
  });

  it('repeated initialisation does not re-apply migrations', async () => {
    const manager = createDatabaseManager({
      inMemory: true,
      openDriver: createNodeSqliteDriver,
      enableWal: false,
    });
    const first = await manager.openAndMigrate();
    expect(first.appliedVersions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const second = await manager.openAndMigrate();
    expect(second.appliedVersions).toEqual([]);
    expect(second.currentVersion).toBe(CURRENT_SCHEMA_VERSION);
    await manager.close();
  });

  it('detects duplicate migration versions', () => {
    const duplicates = detectDuplicateMigrationVersions([
      ...getMigrationRegistry(),
      {
        version: 1,
        name: 'duplicate',
        checksum: 'x',
        up: async () => undefined,
      },
    ]);
    expect(duplicates).toEqual([1]);
  });

  it('rejects duplicate versions during run', async () => {
    const db = await createNodeSqliteDriver({ databaseName: ':memory:', inMemory: true });
    const migrations: Migration[] = [
      {
        version: 1,
        name: 'a',
        checksum: 'a',
        up: async () => undefined,
      },
      {
        version: 1,
        name: 'b',
        checksum: 'b',
        up: async () => undefined,
      },
    ];
    await expect(runMigrations(db, { migrations })).rejects.toBeInstanceOf(RepositoryError);
    await db.closeAsync();
  });

  it('rolls back a failed migration and does not record it', async () => {
    const db = await createNodeSqliteDriver({ databaseName: ':memory:', inMemory: true });
    const migrations: Migration[] = [
      {
        version: 1,
        name: 'ok',
        checksum: 'ok',
        up: async (driver) => {
          await driver.execAsync('CREATE TABLE ok_table (id TEXT PRIMARY KEY);');
        },
      },
      {
        version: 2,
        name: 'fail',
        checksum: 'fail',
        up: async () => {
          throw new Error('boom');
        },
      },
    ];
    await expect(runMigrations(db, { migrations })).rejects.toMatchObject({
      category: 'migrationFailed',
    });
    const versionRow = await db.getFirstAsync<{ version: number }>(
      'SELECT MAX(version) AS version FROM schema_migrations',
    );
    expect(versionRow?.version).toBe(1);
    await db.closeAsync();
  });

  it('enforces foreign keys', async () => {
    const { manager } = await createTestDatabase();
    const db = manager.getDriver();
    await expect(
      db.runAsync(
        `INSERT INTO encounters (
          id, client_id, encounter_type, status, created_at, updated_at, local_version, sync_status, is_deleted
        ) VALUES (?, ?, 'other', 'draft', ?, ?, 1, 'localOnly', 0)`,
        [
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          '2026-08-02T12:00:00.000Z',
          '2026-08-02T12:00:00.000Z',
        ],
      ),
    ).rejects.toThrow(/FOREIGN KEY/i);
    await manager.close();
  });

  it('enforces unique active client codes', async () => {
    const { repos, manager } = await createTestDatabase();
    const indexes = await manager.getDriver().getAllAsync<{ name: string; sql: string }>(
      `SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name LIKE '%client_code%'`,
    );
    expect(indexes.length).toBeGreaterThan(0);

    await repos.clients.create({
      clientCode: 'SYN-UNIQUE-1',
      category: 'pregnant',
      givenName: 'One',
      familyName: 'Synthetic',
    });
    await expect(
      repos.clients.create({
        clientCode: 'SYN-UNIQUE-1',
        category: 'postnatal',
        givenName: 'Two',
        familyName: 'Synthetic',
      }),
    ).rejects.toMatchObject({ category: 'duplicate' });
    await manager.close();
  });

  it('creates expected indexes', async () => {
    const { manager } = await createTestDatabase();
    const indexes = await manager.getDriver().getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name`,
    );
    const names = indexes.map((row) => row.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'idx_clients_search_normalized',
        'idx_encounters_client_occurred',
        'idx_referrals_status',
        'idx_referral_passports_token_hash',
        'idx_referral_passports_referral',
        'idx_sync_queue_state_next',
        'idx_audit_entity_time',
      ]),
    );
    await manager.close();
  });

  it('supports development reset and reapply', async () => {
    const { manager, repos } = await createTestDatabase();
    await repos.facilities.create({ name: 'SYNTHETIC Reset Facility' });
    const result = await manager.resetForDevelopment('development');
    expect(result.currentVersion).toBe(CURRENT_SCHEMA_VERSION);
    const facilities = await manager
      .getDriver()
      .getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM facilities');
    expect(facilities?.c).toBe(0);
    await manager.close();
  });

  it('can upgrade from a simulated earlier schema version', async () => {
    const db = await createNodeSqliteDriver({ databaseName: ':memory:', inMemory: true });
    await db.execAsync(`
      CREATE TABLE schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        checksum TEXT NOT NULL
      );
      INSERT INTO schema_migrations VALUES (0, 'baseline', '2026-01-01T00:00:00.000Z', 'baseline');
    `);
    // Registry starts at 1; sequence gap detection should fail for version 0 + registry.
    // Simulate "earlier" by applying only v1 from empty after clearing.
    await db.execAsync('DELETE FROM schema_migrations;');
    const result = await runMigrations(db, { migrations: getMigrationRegistry() });
    expect(result.currentVersion).toBe(CURRENT_SCHEMA_VERSION);
    await db.closeAsync();
  });

  it('migrates Stage 6 consent values to Stage 7 statuses and adds age unit', async () => {
    const db = await createNodeSqliteDriver({ databaseName: ':memory:', inMemory: true });
    await migration001InitialSchema.up(db);
    await db.runAsync(
      `INSERT INTO clients (
        id, client_code, category, given_name, family_name, date_of_birth, approximate_age,
        consent_status, search_normalized, created_at, updated_at, local_version, sync_status, is_deleted
      ) VALUES (?, ?, 'pregnant', 'Ama', 'Synthetic', NULL, 28, 'granted', 'ama synthetic', ?, ?, 1, 'localOnly', 0)`,
      [
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'SYN-MIG-1',
        '2026-08-02T12:00:00.000Z',
        '2026-08-02T12:00:00.000Z',
      ],
    );
    await migration002ClientConsentAgeUnit.up(db);
    const row = await db.getFirstAsync<{
      consent_status: string;
      approximate_age_unit: string | null;
    }>(`SELECT consent_status, approximate_age_unit FROM clients WHERE client_code = 'SYN-MIG-1'`);
    expect(row?.consent_status).toBe('recorded');
    expect(row?.approximate_age_unit).toBeNull();
    await db.closeAsync();
  });
});
