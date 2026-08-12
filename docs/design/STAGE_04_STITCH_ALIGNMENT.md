# Stage 4 — Stitch Alignment

**Last updated:** 2026-08-02  
**Visual Android check:** Pending (`emulator-5554` offline)

| Screen | Route | Stitch intent | Match notes | Intentional differences |
|---|---|---|---|---|
| Splash | `/(entry)/splash` | Brand entry | Logo, teal/pale background, product name | Simplified RN Animated entrance; no CSS path animation |
| ONB-01 | `/(entry)/onboarding/care-close-to-home` | Care close to home | Approved heading + maternal WebP | Design-system typography/spacing |
| ONB-02 | `/(entry)/onboarding/frontline-workers` | Frontline workers | Approved heading | Temporary code hero (no clean photo); reference WebP unused |
| ONB-03 | `/(entry)/onboarding/reliable-offline` | Offline reliability | Approved heading + offline WebP | Explicit “not active sync” footnote |
| Workspace | `/(entry)/workspace-selection` | Choose workspace | Worker / Administrator cards | Scope note that workflows are future |
| Worker entry | `/(entry)/worker-entry` | Auth boundary | Calm message | No fake login |
| Admin entry | `/(entry)/admin-entry` | Auth boundary | Calm message | No fake login |

Accessibility improvements over Stitch HTML: page indicator text, scalable text, 48dp targets, reduced-motion splash.
