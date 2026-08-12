/**
 * In-memory holder for a deep-link opaque token after auth gate.
 * Cleared after successful resolve/use or on logout.
 * Never log the token.
 */
let pendingToken: string | null = null;

export function setPendingPassportToken(token: string): void {
  pendingToken = token;
}

export function consumePendingPassportToken(): string | null {
  const value = pendingToken;
  pendingToken = null;
  return value;
}

export function peekPendingPassportToken(): string | null {
  return pendingToken;
}

export function clearPendingPassportToken(): void {
  pendingToken = null;
}
