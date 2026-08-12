# Animation Asset Audit

**Date:** 2026-08-02  
**Scope:** Inventory only — no animation implementation.

## Splash / logo animation

| Layer / effect | Source found | Classification |
|---|---|---|
| Ghana/shield outline draw | `stitch-exports/.../animated_svg/code.html` CSS `draw` on `.logo-path` | **Web-only CSS** |
| Logo fill fade-in | CSS `fadeInFill` on `.logo-fill` | **Web-only CSS** |
| Amber curve sweep | CSS `sweepIn` on `.amber-curve` | **Web-only CSS** |
| Subtle pulse | CSS `pulse` on `.logo-container` | **Web-only CSS** |
| Vector geometry | Extracted to `assets/brand/logos/northcare-splash-logo.svg` + static SVG | **React Native-ready SVG layers** (geometry) |
| Lottie JSON | Not found | **Missing** |
| Separate mother/child/amber layer files | Only grouped paths inside one SVG | **Written specification + single SVG** |

**Conclusion:** Exact path geometry exists. Motion is **CSS keyframes**, not Lottie and not RN-ready as-is.

**Logo policy (close-out):** Canonical static mark remains the PNG. `northcare-splash-logo.svg` is classified **ANIMATION CANDIDATE — REQUIRES REACT NATIVE REBUILD AND VISUAL APPROVAL**. Do not treat Stitch CSS animation as production-ready.

### Likely later implementation

- React Native SVG for paths/gradient  
- Reanimated / Animated API for draw/fade/sweep/pulse  
- Optional Lottie if a designer exports JSON later  
- Reduced-motion: show final composed logo immediately  

## Other motion candidates

| Animation | Source | Classification |
|---|---|---|
| Voice waveform | Stitch `voice_capture` UI + frontline reference overlay | **Code-based component** / reference raster |
| AI extraction transition | Spec / screens | **Written specification only** |
| Risk reveal | `screening_result` + risk SVGs | **Code-based** using production risk SVGs |
| Referral timeline | `referral_passport` | **Code-based** |
| Save confirmation | Spec | **Written specification only** |
| Sync animation | `sync_centre` | **Code-based** |
| Notification animation | Spec | **Written specification only** |
| Onboarding map build (globe→Ghana→north→nodes) | Offline onboarding PNG is flattened | **Flattened raster image** — reconstruct in code using SVG maps if needed |

## Do not claim

- That web CSS animation is directly React Native-ready  
- That the offline onboarding PNG provides separable animation layers  
- That Lottie exists when it was not found  

## Future packages (evaluate later — do not install now)

- `react-native-svg`  
- `react-native-reanimated`  
- `lottie-react-native` (only if Lottie files appear)
