import type { RiskPriority } from '../../../data/domain/enums/domainEnums';
import type { PassportAgeBand, PassportSexCode } from './passportAgeSex';

/** Legacy signature-only schema (still verifiable). */
export const SIGNED_PASSPORT_SCHEMA_VERSION_V2 = 2 as const;

/** Current issuance: Ed25519 + destination-sealed display name. */
export const SIGNED_PASSPORT_SCHEMA_VERSION_V3 = 3 as const;

/** Active schema for newly issued passports. */
export const SIGNED_PASSPORT_SCHEMA_VERSION = SIGNED_PASSPORT_SCHEMA_VERSION_V3;

/**
 * Public portable claims — never include phone, notes, vitals, screening, or clear full name.
 * v3 adds `sealed` (destination-only display name) and optional short enrichment.
 * Field order in `canonicalPassportClaimsJson` is stable for signatures.
 */
export type SignedPassportClaimsV2 = {
  readonly v: typeof SIGNED_PASSPORT_SCHEMA_VERSION_V2;
  readonly kid: string;
  readonly ref: string;
  readonly srcId: string;
  readonly srcName: string;
  readonly dstId: string;
  readonly dstName: string;
  readonly reasonCode: string;
  readonly reasonLabel: string;
  readonly priority: RiskPriority | 'undetermined';
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly issuerId: string;
};

export type SignedPassportClaimsV3 = {
  readonly v: typeof SIGNED_PASSPORT_SCHEMA_VERSION_V3;
  readonly kid: string;
  readonly ref: string;
  readonly srcId: string;
  readonly srcName: string;
  readonly dstId: string;
  readonly dstName: string;
  readonly reasonCode: string;
  readonly reasonLabel: string;
  readonly priority: RiskPriority | 'undetermined';
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly issuerId: string;
  /** base64url(X25519-sealed JSON { displayName }) for destination facility only. */
  readonly sealed: string;
  readonly sex?: PassportSexCode;
  readonly ageBand?: PassportAgeBand;
};

export type SignedPassportClaims = SignedPassportClaimsV2 | SignedPassportClaimsV3;

const CORE_CLAIM_KEYS: readonly (keyof SignedPassportClaimsV2)[] = [
  'v',
  'kid',
  'ref',
  'srcId',
  'srcName',
  'dstId',
  'dstName',
  'reasonCode',
  'reasonLabel',
  'priority',
  'createdAt',
  'expiresAt',
  'issuerId',
] as const;

function assertPriority(priority: unknown): asserts priority is RiskPriority | 'undetermined' {
  if (
    priority !== 'red' &&
    priority !== 'amber' &&
    priority !== 'green' &&
    priority !== 'undetermined'
  ) {
    throw new Error('invalid_priority');
  }
}

function assertCoreStringFields(c: Record<string, unknown>): void {
  for (const key of [
    'srcId',
    'srcName',
    'dstId',
    'dstName',
    'reasonCode',
    'reasonLabel',
    'createdAt',
    'expiresAt',
    'issuerId',
  ] as const) {
    if (typeof c[key] !== 'string' || (c[key] as string).length === 0) {
      throw new Error(`invalid_${key}`);
    }
  }
}

function isPassportSex(value: unknown): value is PassportSexCode {
  return value === 'F' || value === 'M' || value === 'U';
}

function isPassportAgeBand(value: unknown): value is PassportAgeBand {
  return (
    value === '0-28d' ||
    value === '1-11m' ||
    value === '1-4y' ||
    value === '5-14y' ||
    value === '15-49y' ||
    value === '50p' ||
    value === 'U'
  );
}

/** Deterministic JSON used as the signed message (UTF-8). */
export function canonicalPassportClaimsJson(claims: SignedPassportClaims): string {
  const ordered: Record<string, string | number> = {};
  for (const key of CORE_CLAIM_KEYS) {
    ordered[key] = claims[key];
  }
  if (claims.v === SIGNED_PASSPORT_SCHEMA_VERSION_V3) {
    ordered.sealed = claims.sealed;
    if (claims.sex !== undefined) {
      ordered.sex = claims.sex;
    }
    if (claims.ageBand !== undefined) {
      ordered.ageBand = claims.ageBand;
    }
  }
  return JSON.stringify(ordered);
}

export function isSealedPassportClaims(
  claims: SignedPassportClaims,
): claims is SignedPassportClaimsV3 {
  return claims.v === SIGNED_PASSPORT_SCHEMA_VERSION_V3;
}

export function assertSignedPassportClaims(
  value: unknown,
): asserts value is SignedPassportClaims {
  if (!value || typeof value !== 'object') {
    throw new Error('invalid_claims');
  }
  const c = value as Record<string, unknown>;
  for (const key of CORE_CLAIM_KEYS) {
    if (!(key in c)) {
      throw new Error(`missing_${key}`);
    }
  }
  if (
    c.v !== SIGNED_PASSPORT_SCHEMA_VERSION_V2 &&
    c.v !== SIGNED_PASSPORT_SCHEMA_VERSION_V3
  ) {
    throw new Error('unsupported_version');
  }
  if (typeof c.kid !== 'string' || c.kid.length < 4) {
    throw new Error('invalid_kid');
  }
  if (typeof c.ref !== 'string' || c.ref.length < 4) {
    throw new Error('invalid_ref');
  }
  assertCoreStringFields(c);
  assertPriority(c.priority);

  if (c.v === SIGNED_PASSPORT_SCHEMA_VERSION_V3) {
    if (typeof c.sealed !== 'string' || c.sealed.length < 16) {
      throw new Error('invalid_sealed');
    }
    if (c.sex !== undefined && !isPassportSex(c.sex)) {
      throw new Error('invalid_sex');
    }
    if (c.ageBand !== undefined && !isPassportAgeBand(c.ageBand)) {
      throw new Error('invalid_ageBand');
    }
  }
}
