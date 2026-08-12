/**
 * Maps unknown errors to calm, worker-safe copy.
 * Technical/system messages are never shown to end users.
 */
export function looksLikeSystemError(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return (
    /ReferenceError|TypeError|SyntaxError|RangeError|Unhandled/i.test(trimmed) ||
    /Property '[^']+' doesn't exist/i.test(trimmed) ||
    /undefined is not|is not a function|Cannot read propert/i.test(trimmed) ||
    /ECONNREFUSED|ETIMEDOUT|Network request failed/i.test(trimmed) ||
    /\bHTTP \d{3}\b/i.test(trimmed) ||
    /sqlite|SQLITE_/i.test(trimmed) ||
    /\b[a-z][\w.]*\.[\w]+ failed\b/i.test(trimmed) ||
    /componentStack|stack trace/i.test(trimmed)
  );
}

export function mapUserFacingError(error: unknown, fallback: string): string {
  if (typeof error === 'string') {
    return looksLikeSystemError(error) ? fallback : error;
  }
  if (error instanceof Error) {
    const message = error.message.trim();
    if (!message || looksLikeSystemError(message)) {
      return fallback;
    }
    if (message.length > 240) {
      return fallback;
    }
    return message;
  }
  return fallback;
}
