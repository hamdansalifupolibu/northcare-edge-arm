# PIN Security Design

**Stage:** 5  
**Last updated:** 2026-08-02  

## Requirements met

- Exactly six numeric digits
- Raw PIN never stored, logged, or placed in AsyncStorage
- Random per-device salt (16 bytes via `expo-crypto`)
- Versioned KDF parameters stored with the verifier
- Timing-safe hex comparison
- Migration path via `version` field

## KDF selection

| Option | Verdict |
|---|---|
| Plain SHA-256 / Base64 | Rejected (too weak / not a KDF) |
| PBKDF2 | Acceptable fallback |
| Argon2 (native) | Not adopted — no verified Expo SDK 57-native package chosen this stage |
| **scrypt via `@noble/hashes`** | **Selected** |

### Why `@noble/hashes`

- Actively maintained audited pure-JS cryptography
- Works in React Native / Expo without custom native modules
- MIT licence
- Explicit scrypt export (`@noble/hashes/scrypt.js`)
- Deterministic unit tests with injected salts

## Versioned parameters (v1)

| Parameter | Value |
|---|---|
| `kdf` | `scrypt` |
| `version` | `1` (`PIN_KDF_VERSION`) |
| `N` | `2^15` (32768) |
| `r` | `8` |
| `p` | `1` |
| `dkLen` | `32` |
| salt | 16 random bytes (hex-encoded) |

Implementation: `apps/mobile/src/features/auth/crypto/pinVerifier.ts`

## Benchmark (host Node, 2026-08-02)

Environment: Windows (`win32`), Node in `apps/mobile`, 3 runs of verify/create-equivalent scrypt with the v1 parameters.

| Metric | Result |
|---|---|
| Average | **~355 ms** per derivation |
| Total (3 runs) | ~1064 ms |

Interpretation: interactive cost suitable for unlock on modern phones in host Node measurements only.

### Production approval follow-up (Stage 6 note)

These scrypt parameters are **not** fully production-approved yet. Before production approval, benchmark the same parameters on:

1. Android emulator
2. Samsung Galaxy S20 Ultra
3. A lower-spec Android reference device where practical

Until those device benchmarks exist, treat the ~355 ms Node result as a host-only signal. If physical devices freeze or exceed UX budgets, reduce `N` in a **new versioned** parameter set and migrate.

## Attempt protection

Governed by `DEVELOPMENT_OFFLINE_ACCESS_POLICY`:

- Max failed attempts: 5 (provisional)
- Temporary lockout: 30s (provisional demo usability)
- Successful unlock resets failure count
- Lockout metadata never includes the PIN
- Local clinical data is never wiped on PIN failure (clinical SQLite arrives in Stage 6+; PIN failure still must not wipe it)

## Non-goals

- Reversible PIN storage
- Hardcoded encryption keys
- Custom cryptographic constructions
- Final production lockout durations (require security approval)
