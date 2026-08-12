/** Stage 10+ referral / QR passport constants. */

export const REFERRAL_PASSPORT_PAYLOAD_VERSION = 1;

/** Signed offline-verifiable passport schema (QR URI v2 — signature only). */
export const REFERRAL_PASSPORT_SIGNED_PAYLOAD_VERSION_V2 = 2;

/** Signed + destination-sealed display name (QR URI v3 — current issuance). */
export const REFERRAL_PASSPORT_SIGNED_PAYLOAD_VERSION = 3;

/** Opaque token entropy — 16 bytes = 128 bits. */
export const REFERRAL_PASSPORT_TOKEN_BYTES = 16;

/**
 * Provisional local expiry for development / demo.
 * PROVISIONAL — REVIEW BEFORE PILOT DEPLOYMENT
 */
export const REFERRAL_PASSPORT_DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

/** Hard fail if signed passport URI exceeds this length (scannability). */
export const REFERRAL_PASSPORT_URI_MAX_LENGTH = 1000;

export const REFERRAL_PASSPORT_URI_PREFIX = 'northcare://referral-passport/v1/';
export const REFERRAL_PASSPORT_URI_PREFIX_V2 = 'northcare://referral-passport/v2/';
export const REFERRAL_PASSPORT_URI_PREFIX_V3 = 'northcare://referral-passport/v3/';
