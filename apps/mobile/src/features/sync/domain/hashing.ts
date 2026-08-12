import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

function canonicalise(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalise(record[key])}`).join(',')}}`;
}

/** Stable hash for idempotency. Payloads are never logged. */
export function canonicalJsonSha256(value: unknown): string {
  return bytesToHex(sha256(utf8ToBytes(canonicalise(value))));
}

export { canonicalise as canonicalJson };
