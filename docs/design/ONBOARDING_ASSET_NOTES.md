# Onboarding Asset Notes

**Updated:** 2026-08-02 (close-out)

## Screen 1 — Maternal & child care

| Item | Value |
|---|---|
| Preferred file | `assets/images/onboarding/onboarding-maternal-child-care.webp` |
| Also retained | `…/onboarding-maternal-child-care.png` |
| Size | 941×1672 (~9:16) |
| Format | WEBP verified |
| Classification | PRODUCTION CANDIDATE |
| Text-safe area | Dark-teal lower band (bottom avg ~rgb 9,43,47) |
| RN heading | Care begins close to home |
| Alt text | A mother holding her baby while receiving support in a community-health setting. |

## Screen 2 — Frontline workers

| Item | Value |
|---|---|
| Reference WebP | `assets/source-references/onboarding-frontline-worker-reference-only.webp` |
| Also retained | PNG reference under `source-references/` / `source-originals/` |
| Classification | REFERENCE ONLY |
| Problem | Embedded chips + waveform |
| Desired production file | `assets/images/onboarding/onboarding-frontline-worker.webp` |

**CLEAN FRONTLINE-WORKER IMAGE STILL REQUIRES MANUAL PREPARATION** (later stage; does not block foundation).

### Stage 4 temporary visual decision

Implemented a **code-based temporary hero** (`FrontlineWorkerHero`) using approved surface colours, an abstract “HW” mark, and non-clinical workflow cards.

- Did **not** copy the reference WebP into `assets/images/onboarding/`
- Did **not** overlay additional chips on the embedded reference chips
- Runtime mobile copies for screens 1 and 3: `apps/mobile/assets/images/onboarding/*.webp`


## Screen 3 — Offline reliability

| Item | Value |
|---|---|
| Preferred file | `assets/images/onboarding/onboarding-offline-connectivity.webp` |
| Also retained | PNG counterpart |
| Size | 941×1672 |
| Classification | PRODUCTION CANDIDATE FOR STATIC ONBOARDING ART |
| RN heading | Reliable—even without internet |

### Geographic caution

Artistic only. Use `assets/maps/ghana/*.svg` for geographic references. Do not treat onboarding art as authoritative boundaries or routes.
