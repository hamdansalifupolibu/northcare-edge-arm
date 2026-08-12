import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';

import {
  WORKER_ACTIVATION_DEV_KEY_ID,
  WORKER_ACTIVATION_DEV_PRIVATE_KEY_HEX,
  WORKER_ACTIVATION_DEV_PUBLIC_KEY_HEX,
  WORKER_ACTIVATION_SIGNING_ALGORITHM,
} from './developmentProvisioningKeys';
import {
  assertSignedActivationClaims,
  canonicalActivationClaimsJson,
  SIGNED_ACTIVATION_SCHEMA_VERSION,
  type SignedActivationClaimsV1,
} from './signedActivationClaims';

ed.etc.sha512Sync = (...messages: Uint8Array[]): Uint8Array =>
  sha512(ed.etc.concatBytes(...messages));

export const WORKER_ACTIVATION_URI_PREFIX = 'northcare://worker-activation/v1/';
export const WORKER_ACTIVATION_URI_MAX_LENGTH = 1200;
export const WORKER_ACTIVATION_TTL_MS = 30 * 60 * 1000;

export type OfflineActivationVerifyResult =
  | {
      readonly ok: true;
      readonly claims: SignedActivationClaimsV1;
      readonly algorithm: typeof WORKER_ACTIVATION_SIGNING_ALGORITHM;
      readonly keyId: string;
    }
  | {
      readonly ok: false;
      readonly reason:
        | 'empty'
        | 'notActivationQr'
        | 'malformed'
        | 'badSignature'
        | 'expired'
        | 'unsupportedVersion'
        | 'invalidClaims'
        | 'uriTooLong'
        | 'nonceConsumed';
      readonly message: string;
    };

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function hexToBytes(hex: string): Uint8Array {
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

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return base64ToBytes(padded + '='.repeat(padLength));
}

export function isWorkerActivationUri(raw: string): boolean {
  return raw.trim().startsWith(WORKER_ACTIVATION_URI_PREFIX);
}

export function createActivationNonce(): string {
  return Crypto.randomUUID().replace(/-/g, '');
}

export function signActivationClaims(
  claims: SignedActivationClaimsV1,
  privateKeyHex: string = WORKER_ACTIVATION_DEV_PRIVATE_KEY_HEX,
): { readonly uri: string } {
  if (claims.kid !== WORKER_ACTIVATION_DEV_KEY_ID) {
    throw new Error('unexpected_key_id');
  }
  if (claims.v !== SIGNED_ACTIVATION_SCHEMA_VERSION) {
    throw new Error('unsupported_version');
  }
  const message = new TextEncoder().encode(canonicalActivationClaimsJson(claims));
  const signature = ed.sign(message, hexToBytes(privateKeyHex));
  const uri = `${WORKER_ACTIVATION_URI_PREFIX}${bytesToBase64Url(message)}.${bytesToBase64Url(signature)}`;
  if (uri.length > WORKER_ACTIVATION_URI_MAX_LENGTH) {
    throw new Error('uri_too_long');
  }
  return { uri };
}

export function verifyWorkerActivationUri(
  raw: string,
  options?: {
    readonly publicKeyHex?: string;
    readonly nowMs?: number;
    readonly isNonceConsumed?: (nonce: string) => boolean;
  },
): OfflineActivationVerifyResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty', message: 'No activation code provided.' };
  }
  if (trimmed.length > WORKER_ACTIVATION_URI_MAX_LENGTH) {
    return {
      ok: false,
      reason: 'uriTooLong',
      message: 'This activation code is too long to be valid.',
    };
  }
  if (!isWorkerActivationUri(trimmed)) {
    return {
      ok: false,
      reason: 'notActivationQr',
      message: 'This is not a NorthCare worker activation code.',
    };
  }

  const body = trimmed.slice(WORKER_ACTIVATION_URI_PREFIX.length);
  const dot = body.lastIndexOf('.');
  if (dot <= 0 || dot === body.length - 1) {
    return { ok: false, reason: 'malformed', message: 'Activation code is incomplete.' };
  }

  let message: Uint8Array;
  let signature: Uint8Array;
  try {
    message = base64UrlToBytes(body.slice(0, dot));
    signature = base64UrlToBytes(body.slice(dot + 1));
  } catch {
    return { ok: false, reason: 'malformed', message: 'Activation code could not be decoded.' };
  }

  if (signature.length !== 64) {
    return { ok: false, reason: 'malformed', message: 'Activation signature is invalid.' };
  }

  const publicKey = hexToBytes(
    options?.publicKeyHex ?? WORKER_ACTIVATION_DEV_PUBLIC_KEY_HEX,
  );
  if (!ed.verify(signature, message, publicKey)) {
    return {
      ok: false,
      reason: 'badSignature',
      message: 'Invalid signature. This activation was not issued by NorthCare AI.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(message));
  } catch {
    return { ok: false, reason: 'invalidClaims', message: 'Activation contents unreadable.' };
  }

  try {
    assertSignedActivationClaims(parsed);
  } catch (err) {
    const code = err instanceof Error ? err.message : 'invalid_claims';
    if (code === 'unsupported_version') {
      return {
        ok: false,
        reason: 'unsupportedVersion',
        message: 'This activation version is not supported.',
      };
    }
    return { ok: false, reason: 'invalidClaims', message: 'Activation contents failed validation.' };
  }

  const nowMs = options?.nowMs ?? Date.now();
  const expiresMs = Date.parse(parsed.expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs < nowMs) {
    return { ok: false, reason: 'expired', message: 'This activation code has expired.' };
  }

  if (options?.isNonceConsumed?.(parsed.nonce)) {
    return {
      ok: false,
      reason: 'nonceConsumed',
      message: 'This activation code has already been used.',
    };
  }

  return {
    ok: true,
    claims: parsed,
    algorithm: WORKER_ACTIVATION_SIGNING_ALGORITHM,
    keyId: parsed.kid,
  };
}

export type IssueOfflineActivationInput = {
  readonly enrollmentId: string;
  readonly displayName: string;
  readonly email: string;
  readonly professionCode: string;
  readonly professionLabel: string;
  readonly otherProfessionDescription: string | null;
  readonly facilityId: string;
  readonly facilityName: string;
  readonly organisationId: string;
  readonly communityRequestsEnabled: boolean;
  readonly emergencyRequestsEnabled: boolean;
  readonly adminAccountId: string;
  readonly adminDisplayName: string;
  readonly nowMs?: number;
  readonly nonce?: string;
};

export function issueOfflineActivationPass(
  input: IssueOfflineActivationInput,
): { readonly uri: string; readonly claims: SignedActivationClaimsV1; readonly nonce: string } {
  const nowMs = input.nowMs ?? Date.now();
  const nonce = input.nonce ?? createActivationNonce();
  const claims: SignedActivationClaimsV1 = {
    v: SIGNED_ACTIVATION_SCHEMA_VERSION,
    kid: WORKER_ACTIVATION_DEV_KEY_ID,
    enrollmentId: input.enrollmentId,
    displayName: input.displayName.trim(),
    email: input.email.trim().toLowerCase(),
    professionCode: input.professionCode,
    professionLabel: input.professionLabel,
    otherProfessionDescription: input.otherProfessionDescription,
    facilityId: input.facilityId,
    facilityName: input.facilityName,
    organisationId: input.organisationId,
    communityRequestsEnabled: input.communityRequestsEnabled,
    emergencyRequestsEnabled: input.emergencyRequestsEnabled,
    adminAccountId: input.adminAccountId,
    adminDisplayName: input.adminDisplayName,
    issuedAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + WORKER_ACTIVATION_TTL_MS).toISOString(),
    nonce,
  };
  const { uri } = signActivationClaims(claims);
  return { uri, claims, nonce };
}
