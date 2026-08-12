# QR Referral Passport Security

**Stage:** 10 (+ offline-verifiable upgrade 2026-08-04)

## Two passport formats

### v1 — Opaque local lookup (Stage 10)

URI form:

`northcare://referral-passport/v1/{opaqueToken}`

The opaque token is generated with `expo-crypto` (~128-bit entropy), URL-safe encoded. SQLite stores **SHA-256 token hash** only. Resolve works **only on devices that already have the passport hash**.

### v2 — Ed25519 signed offline passport (legacy hackathon format)

URI form:

`northcare://referral-passport/v2/{base64url(canonicalJson)}.{base64url(signature)}`

Supports signature verification offline using embedded public keys, but contains no client identity details.

### v3 — Ed25519 signed + X25519 sealed offline passport (current format)

URI form:

`northcare://referral-passport/v3/{base64url(canonicalJson)}.{base64url(signature)}`

| Item | Detail |
|---|---|
| Signature Algorithm | **Ed25519** (`@noble/curves/ed25519` + SHA-512) |
| Encryption Algorithm | **X25519 Sealed-Box** equivalent: Ephemeral-recipient ECDH shared secret + BLAKE2b-256 key derivation + XChaCha20-Poly1305 payload encryption. |
| Message | Canonical UTF-8 JSON of claims containing core details, a base64url-encoded sealed name blob, and optional safe short metadata. |
| Signature | 64-byte Ed25519 signature over canonical UTF-8 JSON claims, base64url encoded. |
| Name Sealing | The client's display name is encrypted exclusively for the receiving facility's X25519 public key. Only a phone loaded with the target facility's private key can decrypt it. |
| Verify | Verification occurs completely offline. Signature integrity is checked first. If valid, the app attempts to unseal the client name using the current worker's facility keys. |

Primary caregiver QR now uses **v3**. v2 remains verifiable for backward compatibility. v1 remains as `localLookupUri` for same-device hash lookup.

## Claims allowed in v2/v3

*   **v**: Schema version (`2` or `3`)
*   **kid**: Key identifier for the signature verification key
*   **ref**: Referral reference code (visible)
*   **srcId / srcName**: Origin facility identifier and name
*   **dstId / dstName**: Destination facility identifier and name
*   **reasonCode / reasonLabel**: Reason category code and short label
*   **priority**: Risk priority band (`red` / `amber` / `green` / `undetermined`)
*   **createdAt / expiresAt**: Issuance timestamp and validity window (UTC ISO strings)
*   **issuerId**: Opaque identifier of the issuing health worker
*   **sealed** (v3 only): Base64url-encoded X25519 ciphertext containing the client's `displayName`
*   **sex** (v3 only, optional): Short patient gender code (`F`, `M`, or `U`)
*   **ageBand** (v3 only, optional): Patient age classification band (e.g. `0-28d`, `1-11m`, `1-4y`, etc.)

## Must never appear in QR / signed claims in cleartext

Client full name (except when encrypted via v3 destination seal), phone numbers, vitals, screening answers, voice transcripts, or free-text worker clinical notes.

**Printable paper PDF slip (caregiver):** may include the client **display name** in cleartext for physical facility handoff. It must not include contact numbers, vitals, screening answers, or free-text clinical notes. The QR code payload on the slip remains cryptographically sealed.

## Development key warning

Hackathon builds embed a development Ed25519 keypair (`developmentPassportKeys.ts`).  
This proves offline verify for judges. **Rotate and remove the private key from the client before any pilot.** Prefer HSM / server-side issue for production.

## Bearer / authenticity risks

- v1: anyone with the token URI may attempt local resolution on a device that holds the hash.  
- v2: signature proves a NorthCare build with the matching key issued the package; demo keys are not a national PKI.  
- Neither format is blockchain.  
- Scan/verify alone does **not** change referral status.

## Operational controls

- Revoke / reissue rotates the active local opaque passport.  
- Provisional expiry (30 days) for development.  
- Never log raw token, hash, private key, or full QR content.  
- Deep-link tokens are held transiently in memory and cleared after use or logout.
