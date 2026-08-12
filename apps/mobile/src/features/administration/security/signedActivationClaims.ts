export const SIGNED_ACTIVATION_SCHEMA_VERSION = 1 as const;

export type SignedActivationClaimsV1 = {
  readonly v: typeof SIGNED_ACTIVATION_SCHEMA_VERSION;
  readonly kid: string;
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
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly nonce: string;
};

const CLAIM_KEYS: readonly (keyof SignedActivationClaimsV1)[] = [
  'v',
  'kid',
  'enrollmentId',
  'displayName',
  'email',
  'professionCode',
  'professionLabel',
  'otherProfessionDescription',
  'facilityId',
  'facilityName',
  'organisationId',
  'communityRequestsEnabled',
  'emergencyRequestsEnabled',
  'adminAccountId',
  'adminDisplayName',
  'issuedAt',
  'expiresAt',
  'nonce',
] as const;

export function canonicalActivationClaimsJson(claims: SignedActivationClaimsV1): string {
  const ordered: Record<string, unknown> = {};
  for (const key of CLAIM_KEYS) {
    ordered[key] = claims[key];
  }
  return JSON.stringify(ordered);
}

export function assertSignedActivationClaims(value: unknown): asserts value is SignedActivationClaimsV1 {
  if (typeof value !== 'object' || value === null) {
    throw new Error('invalid_claims');
  }
  const record = value as Record<string, unknown>;
  if (record.v !== SIGNED_ACTIVATION_SCHEMA_VERSION) {
    throw new Error('unsupported_version');
  }
  for (const key of CLAIM_KEYS) {
    if (record[key] === undefined) {
      throw new Error('invalid_claims');
    }
  }
  if (typeof record.enrollmentId !== 'string' || record.enrollmentId.length < 8) {
    throw new Error('invalid_claims');
  }
  if (typeof record.email !== 'string' || !record.email.includes('@')) {
    throw new Error('invalid_claims');
  }
  if (typeof record.communityRequestsEnabled !== 'boolean') {
    throw new Error('invalid_claims');
  }
  if (typeof record.emergencyRequestsEnabled !== 'boolean') {
    throw new Error('invalid_claims');
  }
}
