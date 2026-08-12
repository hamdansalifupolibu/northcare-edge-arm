import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import * as Crypto from 'expo-crypto';

import { REFERRAL_PASSPORT_TOKEN_BYTES } from '../domain/constants';

const URL_SAFE_BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Secure random opaque token (~128-bit entropy), URL-safe (no padding).
 * Uses expo-crypto — never Math.random().
 */
export function generateOpaquePassportToken(
  randomBytes: (size: number) => Uint8Array = (size) => Crypto.getRandomBytes(size),
): string {
  const bytes = randomBytes(REFERRAL_PASSPORT_TOKEN_BYTES);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    // Map each byte into 64-char alphabet (slight bias acceptable for opaque bearer token).
    out += URL_SAFE_BASE64[bytes[i]! & 63]!;
  }
  return out;
}

/** SHA-256 hex digest of the raw token for local lookup. Never log token or hash. */
export function hashPassportToken(rawToken: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(rawToken)));
}
