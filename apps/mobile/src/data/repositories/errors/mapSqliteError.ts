import { RepositoryError } from './RepositoryError';

function collectErrorText(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const record = error as {
      message?: unknown;
      code?: unknown;
      errstr?: unknown;
      errcode?: unknown;
    };
    return [record.message, record.code, record.errstr, record.errcode]
      .filter((part) => part !== undefined && part !== null && String(part).length > 0)
      .map(String)
      .join(' ');
  }
  return 'Unknown storage error';
}

/**
 * Map low-level SQLite / driver errors to typed repository errors.
 * Never include SQL parameter values or clinical payloads.
 */
export function mapSqliteError(error: unknown, operation: string): RepositoryError {
  if (error instanceof RepositoryError) {
    return error;
  }

  const message = collectErrorText(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('unique') ||
    lower.includes('constraint_unique') ||
    lower.includes('2067')
  ) {
    return new RepositoryError('duplicate', `${operation} violated a unique constraint`, {
      operation,
    });
  }

  if (
    lower.includes('foreign key') ||
    lower.includes('constraint_foreignkey') ||
    lower.includes('787')
  ) {
    return new RepositoryError('constraint', `${operation} violated a foreign key`, {
      operation,
    });
  }

  if (
    lower.includes('check constraint') ||
    lower.includes('constraint failed') ||
    lower.includes('constraint_check')
  ) {
    return new RepositoryError('constraint', `${operation} violated a database constraint`, {
      operation,
    });
  }

  if (lower.includes('no such table') || lower.includes('unable to open')) {
    return new RepositoryError('storageUnavailable', `${operation} storage unavailable`, {
      operation,
    });
  }

  return new RepositoryError('unknown', `${operation} failed`, {
    operation,
    causeCategory: message.slice(0, 80),
  });
}
