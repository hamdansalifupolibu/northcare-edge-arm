import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { blake2b } from '@noble/hashes/blake2.js';
import * as Crypto from 'expo-crypto';

/**
 * NorthCare facility-sealed PII blob (destination-only offline unlock).
 *
 * Construction (X25519 sealed-box equivalent):
 * 1. Ephemeral X25519 keypair
 * 2. shared = X25519(eph_sk, recipient_pk)
 * 3. key = BLAKE2b-256(shared)
 * 4. nonce = 24 random bytes
 * 5. ct = XChaCha20-Poly1305(key, nonce, plaintext)
 * 6. sealed = eph_pk (32) || nonce (24) || ct
 *
 * Not a single global AES key — recipient public key is per facility.
 */

export type SealedPatientPayload = {
  readonly displayName: string;
};

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('invalid_hex');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += BASE64_ALPHABET[(triple >> 18) & 63];
    out += BASE64_ALPHABET[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] : '=';
  }
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  const outputLength = Math.floor((cleaned.length * 3) / 4) - padding;
  const out = new Uint8Array(outputLength);
  let outIndex = 0;
  const decodeChar = (ch: string): number => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) return code - 65;
    if (code >= 97 && code <= 122) return code - 71;
    if (code >= 48 && code <= 57) return code + 4;
    if (ch === '+') return 62;
    if (ch === '/') return 63;
    return 0;
  };
  for (let i = 0; i < cleaned.length; i += 4) {
    const c1 = decodeChar(cleaned[i]!);
    const c2 = decodeChar(cleaned[i + 1]!);
    const c3 = decodeChar(cleaned[i + 2] ?? 'A');
    const c4 = decodeChar(cleaned[i + 3] ?? 'A');
    const triple = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;
    if (outIndex < outputLength) out[outIndex++] = (triple >> 16) & 255;
    if (outIndex < outputLength) out[outIndex++] = (triple >> 8) & 255;
    if (outIndex < outputLength) out[outIndex++] = triple & 255;
  }
  return out;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return base64ToBytes(padded + '='.repeat(padLength));
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function deriveSealKey(sharedSecret: Uint8Array): Uint8Array {
  return blake2b(sharedSecret, { dkLen: 32 });
}

/** Canonical JSON for sealed payload — display name only (stable key order). */
export function canonicalSealedPatientJson(payload: SealedPatientPayload): string {
  const displayName = payload.displayName.trim();
  if (!displayName) {
    throw new Error('empty_display_name');
  }
  return JSON.stringify({ displayName });
}

export function sealPatientPayload(
  payload: SealedPatientPayload,
  recipientPublicKeyHex: string,
  randomBytes: (size: number) => Uint8Array = (size) => Crypto.getRandomBytes(size),
): string {
  const plaintext = new TextEncoder().encode(canonicalSealedPatientJson(payload));
  const recipientPk = hexToBytes(recipientPublicKeyHex);
  if (recipientPk.length !== 32) {
    throw new Error('invalid_recipient_public_key');
  }

  const ephSk = randomBytes(32);
  const ephPk = x25519.getPublicKey(ephSk);
  const shared = x25519.getSharedSecret(ephSk, recipientPk);
  const key = deriveSealKey(shared);
  const nonce = randomBytes(24);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(plaintext);
  return bytesToBase64Url(concatBytes(ephPk, nonce, ciphertext));
}

export function tryUnsealPatientPayload(
  sealedBase64Url: string,
  recipientPrivateKeyHex: string,
): SealedPatientPayload | null {
  try {
    const sealed = base64UrlToBytes(sealedBase64Url);
    if (sealed.length < 32 + 24 + 16) {
      return null;
    }
    const ephPk = sealed.slice(0, 32);
    const nonce = sealed.slice(32, 56);
    const ciphertext = sealed.slice(56);
    const recipientSk = hexToBytes(recipientPrivateKeyHex);
    if (recipientSk.length !== 32) {
      return null;
    }
    const shared = x25519.getSharedSecret(recipientSk, ephPk);
    const key = deriveSealKey(shared);
    const plaintext = xchacha20poly1305(key, nonce).decrypt(ciphertext);
    const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const displayName = (parsed as { displayName?: unknown }).displayName;
    if (typeof displayName !== 'string' || !displayName.trim()) {
      return null;
    }
    return { displayName: displayName.trim() };
  } catch {
    return null;
  }
}

/**
 * Try private keys for candidate facility ids until one unlocks the sealed blob.
 */
export function tryUnsealWithFacilityKeys(
  sealedBase64Url: string,
  privateKeyHexByFacilityId: ReadonlyMap<string, string> | {
    getPrivateKeyHex(facilityKeyId: string): string | null;
  },
  facilityKeyIds: readonly string[],
): { readonly facilityKeyId: string; readonly payload: SealedPatientPayload } | null {
  for (const facilityKeyId of facilityKeyIds) {
    const id = facilityKeyId.trim();
    if (!id) continue;
    const privateKeyHex =
      typeof (privateKeyHexByFacilityId as Map<string, string>).get === 'function'
        ? (privateKeyHexByFacilityId as Map<string, string>).get(id) ?? null
        : (
            privateKeyHexByFacilityId as {
              getPrivateKeyHex(facilityKeyId: string): string | null;
            }
          ).getPrivateKeyHex(id);
    if (!privateKeyHex) continue;
    const payload = tryUnsealPatientPayload(sealedBase64Url, privateKeyHex);
    if (payload) {
      return { facilityKeyId: id, payload };
    }
  }
  return null;
}
