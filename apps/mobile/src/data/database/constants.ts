/**
 * Central SQLite constants — do not scatter database names.
 */

export const DATABASE_NAME = 'northcare.db';

/** Current schema version after applying all registered migrations. */
export const CURRENT_SCHEMA_VERSION = 12;

export const SCHEMA_MIGRATIONS_TABLE = 'schema_migrations';

/** Development reset is never available outside development/test. */
export function isDatabaseResetAllowed(appEnv: string): boolean {
  return appEnv === 'development' || appEnv === 'test';
}
