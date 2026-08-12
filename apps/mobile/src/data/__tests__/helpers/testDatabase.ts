import { createDatabaseManager } from '../../database/connection/DatabaseManager';
import type { DatabaseManager } from '../../database/connection/DatabaseManager';
import { createFixedClock } from '../../domain/value-objects/clock';
import { createIdGenerator } from '../../domain/value-objects/idGenerator';
import { createSqliteRepositories } from '../../repositories/sqlite/createSqliteRepositories';
import type { RepositoryContainer } from '../../repositories/contracts/types';
import { createNodeSqliteDriver } from './nodeSqliteDriver';

export async function createTestDatabase(options?: {
  readonly fixedIso?: string;
}): Promise<{
  readonly manager: DatabaseManager;
  readonly repos: RepositoryContainer;
}> {
  const clock = createFixedClock(new Date(options?.fixedIso ?? '2026-08-02T12:00:00.000Z'));
  const ids = createIdGenerator();
  const manager = createDatabaseManager({
    inMemory: true,
    clock,
    openDriver: createNodeSqliteDriver,
    enableWal: false,
  });
  await manager.openAndMigrate();
  const repos = createSqliteRepositories(manager.getDriver(), { ids, clock });
  return { manager, repos };
}
