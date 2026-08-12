/**
 * Development-only per-facility X25519 key material for sealed referral PII.
 *
 * IMPORTANT:
 * - Embedded private keys are acceptable ONLY for hackathon / development builds.
 * - There is NO single global AES key — each demo facility has its own X25519 keypair.
 * - Referring devices encrypt display name TO the destination facility public key.
 * - Receiving devices open the blob with that facility’s private key only.
 * - Rotate and remove private keys from the client before any pilot.
 * - Pilot: prefer SecureStore / HSM-backed per-facility keys, never bundle secrets.
 */

export const REFERRAL_PASSPORT_SEAL_ALGORITHM = 'X25519-XChaCha20-Poly1305' as const;

/** Stable key directory version for docs / rotation notes. */
export const REFERRAL_PASSPORT_SEAL_KEY_SET_ID = 'dev-hackathon-2026-facility-x25519';

export type FacilitySealKeyPair = {
  readonly facilityKeyId: string;
  readonly name: string;
  /** 32-byte X25519 private key (hex). DEVELOPMENT / DEMO ONLY. */
  readonly privateKeyHex: string;
  /** Matching 32-byte X25519 public key (hex). */
  readonly publicKeyHex: string;
};

/**
 * Demo facility seal keys, keyed by stable facility codes
 * (auth `facilityId` / SQLite `externalCode`).
 */
export const DEVELOPMENT_FACILITY_SEAL_KEYS: readonly FacilitySealKeyPair[] = [
  {
    facilityKeyId: 'fac-dev-001',
    name: 'Demo CHPS Compound',
    privateKeyHex:
      '72710d4c9d668f54abe7843ea6ab69d393d0b94493543194276e093f216b7518',
    publicKeyHex:
      '60debda2696826d2e648617b3d57dd1136348d4b62a9069fc4b160aa7ce3b46e',
  },
  {
    facilityKeyId: 'fac-dev-hq',
    name: 'Demo District Health Office',
    privateKeyHex:
      '60034e4e429b819e8fb5ea9bbdc26db49cd247be573bad1858d26b9f37c420b5',
    publicKeyHex:
      '7b86d5e57cbe161271ea75a1893f7f1991406911cf7528dca3fc63684dcca015',
  },
  {
    facilityKeyId: 'GH-TTH',
    name: 'Tamale Teaching Hospital',
    privateKeyHex:
      'd886fb332c68d84cf7f7286aa6c5d70ed14b249746bd742b72c933d9e1ec09a8',
    publicKeyHex:
      '2d615624582c10eaf0d1e38943eb34040e935ac496cda4cf76ad10b175f56415',
  },
  {
    facilityKeyId: 'GH-TMH',
    name: 'Tamale Central Hospital',
    privateKeyHex:
      '8c231e154765ce8970d5b997c5696720ae2f17e176f71f945f1237bc2c00dd4f',
    publicKeyHex:
      'd8d88bca3a1c4c0ffe0c5c01cc717b9e1a4993392c920731889abf0f642fe85d',
  },
  {
    facilityKeyId: 'GH-KBTH',
    name: 'Korle Bu Teaching Hospital',
    privateKeyHex:
      'f28bcef46f236b3186cf0b5b4f171277c854403cdbd738ebe6f63f8980b61793',
    publicKeyHex:
      'cf1b2cbe0cfcd426e74db94a6a72e9dbee5c18cd4dfc2d58574ebc7df3136c63',
  },
  {
    facilityKeyId: 'GH-TCHPS-DEMO',
    name: 'SYNTHETIC Tamale CHPS Compound',
    privateKeyHex:
      'b635330b48e977d1599d42da733f9d31b4b91004ce933e38b93b2d450a282b3e',
    publicKeyHex:
      '41659d1e3c293cdf30463243c5e43a3d59b102dbff27fcf4926ca1f254b17d21',
  },
  {
    facilityKeyId: 'SYNTHETIC-DEST',
    name: 'SYNTHETIC Destination Hospital (tests)',
    privateKeyHex:
      'f141f7d74690ee840c56f1540d4c1c57b956bfe25f46771d06246cf5efc3af74',
    publicKeyHex:
      '95713e654af780928d9e5d8cdbcaa1d93f1af9d7fb67c2e36df2ef796376d45f',
  },
] as const;

const byId = new Map(
  DEVELOPMENT_FACILITY_SEAL_KEYS.map((entry) => [entry.facilityKeyId, entry]),
);

export function getFacilitySealKeyPair(
  facilityKeyId: string | null | undefined,
): FacilitySealKeyPair | null {
  const id = facilityKeyId?.trim();
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function getFacilitySealPublicKeyHex(
  facilityKeyId: string | null | undefined,
): string | null {
  return getFacilitySealKeyPair(facilityKeyId)?.publicKeyHex ?? null;
}

export function getFacilitySealPrivateKeyHex(
  facilityKeyId: string | null | undefined,
): string | null {
  return getFacilitySealKeyPair(facilityKeyId)?.privateKeyHex ?? null;
}

/**
 * Resolve the first known seal key id from candidates
 * (session facilityId, SQLite externalCode, entity id).
 */
export function resolveFacilitySealKeyId(
  candidates: readonly (string | null | undefined)[],
): string | null {
  for (const candidate of candidates) {
    const id = candidate?.trim();
    if (id && byId.has(id)) {
      return id;
    }
  }
  return null;
}
