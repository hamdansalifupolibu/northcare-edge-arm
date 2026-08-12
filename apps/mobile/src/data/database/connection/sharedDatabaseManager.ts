import {
  createDatabaseManager,
  type DatabaseManager,
} from './DatabaseManager';

/**
 * Process-wide SQLite manager. Survives React Fast Refresh remounts so we do not
 * close/reopen the native database on every hot reload.
 */
let sharedManager: DatabaseManager | null = null;

export function getSharedDatabaseManager(): DatabaseManager {
  sharedManager ??= createDatabaseManager();
  return sharedManager;
}

/** Test helper — resets the singleton between Jest cases. */
export function resetSharedDatabaseManagerForTests(): void {
  sharedManager = null;
}
