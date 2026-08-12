import * as Crypto from 'expo-crypto';

import type { EntityId } from './EntityId';
import { isEntityId } from './EntityId';

export type IdGenerator = {
  readonly nextId: () => EntityId;
};

function bytesToUuidV4(bytes: Uint8Array): EntityId {
  // Set version (4) and variant (RFC 4122)
  const b = Uint8Array.from(bytes);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Central UUID v4 generator for domain entities.
 * Prefer expo-crypto.randomUUID when available; fall back to getRandomBytesAsync.
 */
export function createIdGenerator(
  randomBytes: (size: number) => Uint8Array = (size) => Crypto.getRandomBytes(size),
): IdGenerator {
  return {
    nextId(): EntityId {
      const maybeRandomUUID = (
        Crypto as { randomUUID?: () => string }
      ).randomUUID;
      if (typeof maybeRandomUUID === 'function') {
        const id = maybeRandomUUID.call(Crypto);
        if (isEntityId(id)) {
          return id;
        }
      }
      return bytesToUuidV4(randomBytes(16));
    },
  };
}

let defaultGenerator: IdGenerator | null = null;

export function getIdGenerator(): IdGenerator {
  if (defaultGenerator === null) {
    defaultGenerator = createIdGenerator();
  }
  return defaultGenerator;
}

/** Test helper — replace the shared generator. */
export function setIdGeneratorForTests(generator: IdGenerator | null): void {
  defaultGenerator = generator;
}
