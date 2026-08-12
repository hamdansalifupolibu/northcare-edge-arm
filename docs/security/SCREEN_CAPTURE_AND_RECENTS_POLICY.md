# Screen Capture and Recents Policy (Stage 18)

**Updated:** 2026-08-02  
**Status:** Policy documented; native FLAG_SECURE not universally applied

## Policy

1. Clinical and authentication screens are treated as sensitive.
2. Screenshots in documentation must use synthetic data only.
3. Android recent-apps thumbnails may reveal UI chrome — avoid capturing PHI in demos.
4. Native `FLAG_SECURE` / equivalent is **not claimed implemented** across all sensitive screens in Stage 18.

## Current implementation honesty

- No global FLAG_SECURE wrapper was added in Stage 18 (avoid incomplete native claims without development-build confirmation).
- Demo guidance: use synthetic fixtures; lock device when unattended.

## Future pilot control

- Apply FLAG_SECURE on auth, unlock, client profile, screening, referral passport, voice review, and admin temporary-password screens in a development build, with opt-out only for approved accessibility screenshot workflows.
