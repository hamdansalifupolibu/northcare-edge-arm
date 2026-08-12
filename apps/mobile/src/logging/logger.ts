import type { AppEnvironment } from '../types/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogMeta = Readonly<Record<string, unknown>>;

type LoggerOptions = {
  readonly environment: AppEnvironment;
  readonly sink?: (level: LogLevel, message: string, meta?: LogMeta) => void;
};

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|api[_-]?key|authorization|auth|bearer|cookie|session|credential|private|client[_-]?id|nhis|phone|email|dob|birth|diagnosis|health|medical|patient|pin|otp|screening|symptom|measurement|referral|caregiver|transcript|qr|audio|filename|file[_-]?uri|uri|excerpt|payload|extraction)/i;

const REDACTED = '[REDACTED]';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Sanitize metadata for privacy-safe logging.
 * Removes or redacts keys that may contain secrets, auth, or health/PII.
 */
export function sanitizeMeta(meta: LogMeta | undefined): LogMeta | undefined {
  if (meta === undefined) {
    return undefined;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = REDACTED;
      continue;
    }

    if (typeof value === 'string' && value.length > 500) {
      result[key] = `${value.slice(0, 100)}…[truncated]`;
      continue;
    }

    if (isPlainObject(value)) {
      result[key] = sanitizeMeta(value) ?? {};
      continue;
    }

    if (Array.isArray(value)) {
      // Avoid blind deep serialisation of arbitrary arrays
      result[key] = `[array:${value.length}]`;
      continue;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      result[key] = value;
      continue;
    }

    result[key] = `[${typeof value}]`;
  }

  return result;
}

function defaultSink(level: LogLevel, message: string, meta?: LogMeta): void {
  const payload = meta === undefined ? message : `${message} ${JSON.stringify(meta)}`;
  switch (level) {
    case 'debug':
      console.debug(payload);
      break;
    case 'info':
      console.info(payload);
      break;
    case 'warn':
      console.warn(payload);
      break;
    case 'error':
      console.error(payload);
      break;
    default: {
      const _exhaustive: never = level;
      console.log(String(_exhaustive));
    }
  }
}

export type Logger = {
  debug: (message: string, meta?: LogMeta) => void;
  info: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  error: (message: string, meta?: LogMeta) => void;
};

/**
 * Lightweight privacy-safe logger foundation.
 * Console output is used behind this abstraction in Stage 2.
 * Production logging remains minimal.
 */
export function createLogger(options: LoggerOptions): Logger {
  const sink = options.sink ?? defaultSink;
  const allowDebug = options.environment === 'development';
  const allowInfo = options.environment !== 'production';

  const write = (level: LogLevel, message: string, meta?: LogMeta): void => {
    if (level === 'debug' && !allowDebug) {
      return;
    }
    if (level === 'info' && !allowInfo) {
      return;
    }

    const safeMessage = typeof message === 'string' ? message : String(message);
    sink(level, safeMessage, sanitizeMeta(meta));
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
}
