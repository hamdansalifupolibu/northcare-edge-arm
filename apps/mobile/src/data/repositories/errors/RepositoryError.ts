export type RepositoryErrorCategory =
  | 'notFound'
  | 'duplicate'
  | 'validation'
  | 'constraint'
  | 'storageUnavailable'
  | 'migrationFailed'
  | 'transactionFailed'
  | 'dataIntegrity'
  | 'conflict'
  | 'unknown';

export type RepositoryErrorMeta = Readonly<Record<string, string | number | boolean | null>>;

export class RepositoryError extends Error {
  readonly category: RepositoryErrorCategory;
  readonly meta: RepositoryErrorMeta;

  constructor(
    category: RepositoryErrorCategory,
    message: string,
    meta: RepositoryErrorMeta = {},
  ) {
    super(message);
    this.name = 'RepositoryError';
    this.category = category;
    this.meta = meta;
  }
}

export function isRepositoryError(error: unknown): error is RepositoryError {
  return error instanceof RepositoryError;
}
