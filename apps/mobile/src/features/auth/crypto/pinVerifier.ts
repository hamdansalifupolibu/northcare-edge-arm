import { getAppConfig } from '../../../config/appConfig';
import { scrypt } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import * as Crypto from 'expo-crypto';

/**
 * Versioned PIN verifier using scrypt (@noble/hashes).
 * Raw PIN is never stored. Parameters chosen for mobile usability.
 *
 * N=2^15, r=8, p=1 ≈ interactive cost on modern phones without freezing low-end devices.
 * `verifyPin` / `createPinVerifier` run scrypt synchronously on the JS thread
 * (typically a few hundred ms). Callers must show busy UI and yield a frame first
 * so the indicator can paint. Do not casually lower production params.
 */
export const PIN_KDF_VERSION = 1;

export type PinVerifierRecord = {
  readonly kdf: 'scrypt';
  readonly version: typeof PIN_KDF_VERSION;
  readonly N: number;
  readonly r: number;
  readonly p: number;
  readonly dkLen: number;
  readonly saltHex: string;
  readonly verifierHex: string;
  readonly createdAt: string;
};

export const DEFAULT_SCRYPT_PARAMS = {
  N: 2 ** 15,
  r: 8,
  p: 1,
  dkLen: 32,
} as const;

/** Faster hashing for development demos — production builds keep DEFAULT_SCRYPT_PARAMS. */
export const DEVELOPMENT_DEMO_SCRYPT_PARAMS = {
  N: 2 ** 12,
  r: 8,
  p: 1,
  dkLen: 32,
} as const;

export function scryptParamsForEnvironment(): typeof DEFAULT_SCRYPT_PARAMS {
  return getAppConfig().appEnv === 'development'
    ? DEVELOPMENT_DEMO_SCRYPT_PARAMS
    : DEFAULT_SCRYPT_PARAMS;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createRandomSaltHex(byteLength = 16): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return bytesToHex(bytes);
}

export async function createPinVerifier(
  pin: string,
  params: typeof DEFAULT_SCRYPT_PARAMS = scryptParamsForEnvironment(),
): Promise<PinVerifierRecord> {
  const saltHex = await createRandomSaltHex(16);
  const salt = hexToBytes(saltHex);
  const derived = scrypt(pin, salt, {
    N: params.N,
    r: params.r,
    p: params.p,
    dkLen: params.dkLen,
  });
  return {
    kdf: 'scrypt',
    version: PIN_KDF_VERSION,
    N: params.N,
    r: params.r,
    p: params.p,
    dkLen: params.dkLen,
    saltHex,
    verifierHex: bytesToHex(derived),
    createdAt: new Date().toISOString(),
  };
}

export function verifyPin(pin: string, record: PinVerifierRecord): boolean {
  if (record.kdf !== 'scrypt' || record.version !== PIN_KDF_VERSION) {
    return false;
  }
  const salt = hexToBytes(record.saltHex);
  const derived = scrypt(pin, salt, {
    N: record.N,
    r: record.r,
    p: record.p,
    dkLen: record.dkLen,
  });
  return timingSafeEqualHex(bytesToHex(derived), record.verifierHex);
}

/** Synchronous helper for unit tests with injected salt. */
export function createPinVerifierWithSalt(
  pin: string,
  saltHex: string,
  params: typeof DEFAULT_SCRYPT_PARAMS = DEFAULT_SCRYPT_PARAMS,
): PinVerifierRecord {
  const salt = hexToBytes(saltHex);
  const derived = scrypt(pin, salt, {
    N: params.N,
    r: params.r,
    p: params.p,
    dkLen: params.dkLen,
  });
  return {
    kdf: 'scrypt',
    version: PIN_KDF_VERSION,
    N: params.N,
    r: params.r,
    p: params.p,
    dkLen: params.dkLen,
    saltHex,
    verifierHex: bytesToHex(derived),
    createdAt: new Date().toISOString(),
  };
}
