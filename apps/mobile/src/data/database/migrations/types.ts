import type { SqliteDriver } from '../connection/SqliteDriver';

export type Migration = {
  readonly version: number;
  readonly name: string;
  readonly checksum: string;
  readonly up: (db: SqliteDriver) => Promise<void>;
};
