# AGENTS.md — Permanent rules for NorthCare AI

**Audience:** Cursor, Antigravity, and other coding agents.  
**Last reviewed:** 2026-08-02  

Read this file before modifying the repository. Also read `PROJECT_STATUS.md`, `docs/development/IMPLEMENTATION_HANDOFF.md`, and the current stage file under `docs/development/stages/`.

---

## PROJECT IDENTITY

- Product name: **NorthCare AI** (never North Care AI / NorthCareAI / NorthCare Al / NorthCare A1).  
- Tagline: **Smarter care. Stronger communities.**  
- Android-first **React Native + Expo + TypeScript** application.  
- **Not** a web application (no Next.js / React web / Tailwind website as the product).  
- Primary context: **Northern Ghana**.  
- Primary user: authorised **frontline health worker**.  
- Stitch project ID: `749026157623860355`.  
- Canonical logo (interim): `assets/brand/logos/northcare-logo-symbol-primary.png`.

---

## STAGE DISCIPLINE

- Read the current stage specification before editing.  
- Do **not** implement outside the approved stage.  
- Stop after completing the current stage.  
- Report all files changed.  
- Do not perform unrelated refactoring.  
- Do not proceed automatically to another stage.  
- After Stage 2 begins, keep the repository runnable at every checkpoint.  
- Produce `docs/development/IMPLEMENTATION_CHECKPOINT_TEMPLATE.md` report and wait for approval.

---

## DESIGN RULES

- Follow approved Stitch screen identities and route relationships.  
- Use approved design tokens; no hardcoded brand colours in new UI.  
- Prefer reusable components.  
- Do not forge the logo or invent partner/UNICEF/GHS logos.  
- Do not embed dynamic UI text inside images.  
- Do not implement screenshots as screens.  
- Stitch HTML is a visual reference — not production RN code.  
- Preserve Android safe areas and 48dp touch targets.  
- Follow accessibility basics (`accessibilityLabel`, contrast, reduced motion where relevant).  
- Keep offline and sync wording consistent with product docs.

---

## HEALTH AND AI SAFETY

- Do not diagnose.  
- Do not prescribe medication.  
- Do not calculate medication dosage.  
- Do not invent medical protocols or nutrition guidance.  
- Do not fabricate Dagbanli translations or final medical audio.  
- Do not save AI-extracted information without explicit worker confirmation.  
- Do not use a generative model as the primary danger-sign engine.  
- Deterministic approved safety rules override chatbot output.  
- State uncertainty honestly.  
- Provide a manual fallback for AI and voice features.

---

## PRIVACY AND SECURITY

- Do not use real patient data — synthetic fixtures only.  
- Do not log health information, credentials, tokens, PINs, or full QR payloads.  
- Do not commit secrets (`.env`, service accounts, API keys).  
- Do not expose health information before authentication.  
- Keep lock-screen notifications privacy-safe.  
- Use SecureStore for credentials and security material (when implemented).  
- Require confirmation before destructive actions.  
- Never print secret values in reports or prompts.

---

## TECHNICAL RULES

- TypeScript strict mode for the mobile application.  
- Prefer Expo-compatible APIs unless a development-build decision is documented.  
- Verify packages against the chosen Expo SDK docs before installation.  
- Avoid abandoned dependencies.  
- UI components must **not** access SQLite directly — use repositories.  
- Business logic must not be buried only in screens.  
- Health rules must be versioned and unit tested.  
- Local-first writes must not depend on immediate network success.  
- Update tests and documentation with each stage.  
- Never silently ignore errors.  
- Respect repository boundaries: `apps/`, `services/`, `packages/`, `assets/`, `docs/`.

---

## SOURCE OF TRUTH

Follow `docs/development/SOURCE_OF_TRUTH.md`.

Priority sketch: product/safety docs → approved Stitch finals → tokens/assets/manifests → stage spec → implementation → archives.
