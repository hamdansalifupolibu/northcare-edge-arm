import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';

import {
  REFERRAL_PASSPORT_DEV_KEY_ID,
  REFERRAL_PASSPORT_DEV_PRIVATE_KEY_HEX,
  REFERRAL_PASSPORT_DEV_PUBLIC_KEY_HEX,
  REFERRAL_PASSPORT_SIGNING_ALGORITHM,
} from './developmentPassportKeys';
import {
  getFacilitySealPrivateKeyHex,
  getFacilitySealPublicKeyHex,
  resolveFacilitySealKeyId,
} from './developmentFacilitySealKeys';
import {
  sealPatientPayload,
  tryUnsealPatientPayload,
} from './facilityPassportSeal';
import type { PassportAgeBand, PassportSexCode } from './passportAgeSex';
import {
  assertSignedPassportClaims,
  canonicalPassportClaimsJson,
  isSealedPassportClaims,
  SIGNED_PASSPORT_SCHEMA_VERSION_V2,
  SIGNED_PASSPORT_SCHEMA_VERSION_V3,
  type SignedPassportClaims,
  type SignedPassportClaimsV2,
  type SignedPassportClaimsV3,
} from './signedPassportClaims';

// @noble/ed25519 v2 requires an explicit SHA-512 implementation.
ed.etc.sha512Sync = (...messages: Uint8Array[]): Uint8Array =>
  sha512(ed.etc.concatBytes(...messages));

export const REFERRAL_PASSPORT_URI_PREFIX_V2 = 'northcare://referral-passport/v2/';
export const REFERRAL_PASSPORT_URI_PREFIX_V3 = 'northcare://referral-passport/v3/';

/** Hard fail scannability guard for signed passport URIs. */
export const REFERRAL_PASSPORT_URI_MAX_LENGTH = 1000;

export type SealedPatientUnlock =
  | {
      readonly status: 'unlocked';
      readonly displayName: string;
      readonly facilityKeyId: string;
    }
  | {
      readonly status: 'sealedForDestination';
      readonly message: string;
    }
  | {
      readonly status: 'notPresent';
    };

export type OfflinePassportVerifyResult =
  | {
      readonly ok: true;
      readonly claims: SignedPassportClaims;
      readonly algorithm: typeof REFERRAL_PASSPORT_SIGNING_ALGORITHM;
      readonly keyId: string;
      readonly expired: false;
      readonly sealedPatient: SealedPatientUnlock;
    }
  | {
      readonly ok: false;
      readonly reason:
        | 'empty'
        | 'notSignedPassport'
        | 'malformed'
        | 'badSignature'
        | 'expired'
        | 'unsupportedVersion'
        | 'invalidClaims'
        | 'uriTooLong';
      readonly message: string;
    };

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

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Pure JS base64 (no Node `buffer` module — required for Hermes/Metro). */
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

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return base64ToBytes(padded + '='.repeat(padLength));
}

function uriPrefixForVersion(version: 2 | 3): string {
  return version === 3
    ? REFERRAL_PASSPORT_URI_PREFIX_V3
    : REFERRAL_PASSPORT_URI_PREFIX_V2;
}

export function isSignedPassportUri(raw: string): boolean {
  const trimmed = raw.trim();
  return (
    trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V3) ||
    trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V2)
  );
}

function parseSignedPassportBody(trimmed: string): {
  readonly version: 2 | 3;
  readonly payloadB64: string;
  readonly sigB64: string;
} | null {
  let version: 2 | 3;
  let body: string;
  if (trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V3)) {
    version = 3;
    body = trimmed.slice(REFERRAL_PASSPORT_URI_PREFIX_V3.length);
  } else if (trimmed.startsWith(REFERRAL_PASSPORT_URI_PREFIX_V2)) {
    version = 2;
    body = trimmed.slice(REFERRAL_PASSPORT_URI_PREFIX_V2.length);
  } else {
    return null;
  }
  const dot = body.lastIndexOf('.');
  if (dot <= 0 || dot === body.length - 1) {
    return null;
  }
  return {
    version,
    payloadB64: body.slice(0, dot),
    sigB64: body.slice(dot + 1),
  };
}

/**
 * Sign claims with the development Ed25519 private key.
 * Message = UTF-8 canonical JSON. Signature = 64-byte Ed25519.
 */
export function signPassportClaims(
  claims: SignedPassportClaims,
  privateKeyHex: string = REFERRAL_PASSPORT_DEV_PRIVATE_KEY_HEX,
): { readonly uri: string; readonly signatureBase64Url: string } {
  if (claims.kid !== REFERRAL_PASSPORT_DEV_KEY_ID) {
    throw new Error('unexpected_key_id');
  }
  if (claims.v !== SIGNED_PASSPORT_SCHEMA_VERSION_V2 && claims.v !== SIGNED_PASSPORT_SCHEMA_VERSION_V3) {
    throw new Error('unsupported_version');
  }
  const message = new TextEncoder().encode(canonicalPassportClaimsJson(claims));
  const signature = ed.sign(message, hexToBytes(privateKeyHex));
  const payloadB64 = bytesToBase64Url(message);
  const sigB64 = bytesToBase64Url(signature);
  const uri = `${uriPrefixForVersion(claims.v)}${payloadB64}.${sigB64}`;
  if (uri.length > REFERRAL_PASSPORT_URI_MAX_LENGTH) {
    throw new Error('uri_too_long');
  }
  return {
    uri,
    signatureBase64Url: sigB64,
  };
}

export type IssueSealedPassportInput = {
  readonly base: Omit<SignedPassportClaimsV3, 'v' | 'sealed' | 'sex' | 'ageBand'>;
  readonly displayName: string;
  readonly destinationFacilityKeyId: string;
  readonly sex?: PassportSexCode;
  readonly ageBand?: PassportAgeBand;
  readonly privateKeyHex?: string;
  readonly randomBytes?: (size: number) => Uint8Array;
};

/**
 * Build v3 claims: seal display name to destination facility public key, then Ed25519-sign.
 * Optional sex/ageBand are dropped if URI would exceed the scannability guard.
 */
export function issueSealedSignedPassport(input: IssueSealedPassportInput): {
  readonly uri: string;
  readonly claims: SignedPassportClaimsV3;
  readonly signatureBase64Url: string;
  readonly enrichmentIncluded: boolean;
} {
  const publicKeyHex = getFacilitySealPublicKeyHex(input.destinationFacilityKeyId);
  if (!publicKeyHex) {
    throw new Error('missing_destination_seal_key');
  }

  const sealed = sealPatientPayload(
    { displayName: input.displayName },
    publicKeyHex,
    input.randomBytes ?? ((size) => Crypto.getRandomBytes(size)),
  );

  const withEnrichment: SignedPassportClaimsV3 = {
    ...input.base,
    v: SIGNED_PASSPORT_SCHEMA_VERSION_V3,
    sealed,
    ...(input.sex !== undefined ? { sex: input.sex } : {}),
    ...(input.ageBand !== undefined ? { ageBand: input.ageBand } : {}),
  };

  try {
    const signed = signPassportClaims(withEnrichment, input.privateKeyHex);
    return {
      uri: signed.uri,
      claims: withEnrichment,
      signatureBase64Url: signed.signatureBase64Url,
      enrichmentIncluded:
        input.sex !== undefined || input.ageBand !== undefined,
    };
  } catch (err) {
    if (!(err instanceof Error) || err.message !== 'uri_too_long') {
      throw err;
    }
  }

  const withoutEnrichment: SignedPassportClaimsV3 = {
    ...input.base,
    v: SIGNED_PASSPORT_SCHEMA_VERSION_V3,
    sealed,
  };
  const signed = signPassportClaims(withoutEnrichment, input.privateKeyHex);
  return {
    uri: signed.uri,
    claims: withoutEnrichment,
    signatureBase64Url: signed.signatureBase64Url,
    enrichmentIncluded: false,
  };
}

function unlockSealedPatient(
  claims: SignedPassportClaims,
  assignedFacilityKeyIds: readonly string[] | undefined,
): SealedPatientUnlock {
  if (!isSealedPassportClaims(claims)) {
    return { status: 'notPresent' };
  }
  const candidates =
    assignedFacilityKeyIds?.map((id) => id.trim()).filter(Boolean) ?? [];
  for (const facilityKeyId of candidates) {
    const privateKeyHex = getFacilitySealPrivateKeyHex(facilityKeyId);
    if (!privateKeyHex) continue;
    const payload = tryUnsealPatientPayload(claims.sealed, privateKeyHex);
    if (payload) {
      return {
        status: 'unlocked',
        displayName: payload.displayName,
        facilityKeyId,
      };
    }
  }
  return {
    status: 'sealedForDestination',
    message:
      'Details sealed for receiving facility. Signature is valid — this phone cannot unlock the client name.',
  };
}

/**
 * Offline verification — does not touch SQLite or the network.
 * After signature OK, optionally unlocks sealed display name with assigned facility keys.
 */
export function verifySignedPassportUri(
  raw: string,
  options?: {
    readonly publicKeyHex?: string;
    readonly nowMs?: number;
    /** Facility key ids to try for sealed PII (external codes / session facilityId). */
    readonly assignedFacilityKeyIds?: readonly string[];
  },
): OfflinePassportVerifyResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty', message: 'No passport code provided.' };
  }
  if (trimmed.length > REFERRAL_PASSPORT_URI_MAX_LENGTH) {
    return {
      ok: false,
      reason: 'uriTooLong',
      message: 'This passport code is too long to be a valid NorthCare QR.',
    };
  }
  if (!isSignedPassportUri(trimmed)) {
    return {
      ok: false,
      reason: 'notSignedPassport',
      message: 'This is not an offline-verifiable NorthCare signed passport.',
    };
  }

  const parts = parseSignedPassportBody(trimmed);
  if (!parts) {
    return {
      ok: false,
      reason: 'malformed',
      message: 'This passport code is incomplete or damaged.',
    };
  }

  let message: Uint8Array;
  let signature: Uint8Array;
  try {
    message = base64UrlToBytes(parts.payloadB64);
    signature = base64UrlToBytes(parts.sigB64);
  } catch {
    return {
      ok: false,
      reason: 'malformed',
      message: 'This passport code could not be decoded.',
    };
  }

  if (signature.length !== 64) {
    return {
      ok: false,
      reason: 'malformed',
      message: 'This passport signature is the wrong length.',
    };
  }

  const publicKey = hexToBytes(
    options?.publicKeyHex ?? REFERRAL_PASSPORT_DEV_PUBLIC_KEY_HEX,
  );
  const valid = ed.verify(signature, message, publicKey);
  if (!valid) {
    return {
      ok: false,
      reason: 'badSignature',
      message: 'Invalid signature. This is not a valid NorthCare referral passport.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(message));
  } catch {
    return {
      ok: false,
      reason: 'invalidClaims',
      message: 'Passport contents could not be read.',
    };
  }

  try {
    assertSignedPassportClaims(parsed);
  } catch (err) {
    const code = err instanceof Error ? err.message : 'invalid_claims';
    if (code === 'unsupported_version') {
      return {
        ok: false,
        reason: 'unsupportedVersion',
        message: 'This passport version is not supported on this app build.',
      };
    }
    return {
      ok: false,
      reason: 'invalidClaims',
      message: 'Passport contents failed validation.',
    };
  }

  if (parsed.v !== parts.version) {
    return {
      ok: false,
      reason: 'malformed',
      message: 'Passport version does not match the URI path.',
    };
  }

  const nowMs = options?.nowMs ?? Date.now();
  const expiresMs = Date.parse(parsed.expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs < nowMs) {
    return {
      ok: false,
      reason: 'expired',
      message: 'This referral passport has expired.',
    };
  }

  return {
    ok: true,
    claims: parsed,
    algorithm: REFERRAL_PASSPORT_SIGNING_ALGORITHM,
    keyId: parsed.kid,
    expired: false,
    sealedPatient: unlockSealedPatient(parsed, options?.assignedFacilityKeyIds),
  };
}

/** Helper for callers that have session + optional facility external code. */
export function facilityKeyCandidatesForVerify(input: {
  readonly facilityId?: string | null;
  readonly facilityExternalCode?: string | null;
  readonly facilityIds?: readonly (string | null | undefined)[];
}): string[] {
  const out: string[] = [];
  const push = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (trimmed && !out.includes(trimmed)) {
      out.push(trimmed);
    }
  };
  push(input.facilityId);
  push(input.facilityExternalCode);
  for (const id of input.facilityIds ?? []) {
    push(id);
  }
  const resolved = resolveFacilitySealKeyId(out);
  if (resolved) {
    push(resolved);
  }
  return out;
}

export type { SignedPassportClaimsV2, SignedPassportClaimsV3 };
