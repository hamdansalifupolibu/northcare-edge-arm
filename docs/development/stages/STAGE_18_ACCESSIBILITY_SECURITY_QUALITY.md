# STAGE 18 — Accessibility, Security and Quality Hardening

**Status:** Implemented — awaiting checkpoint approval  
**Prerequisites:** Stage 17 complete and Stage 18 approved  
**Next stage:** Stage 19 — End-to-End Testing, Demonstration and Release Preparation (**do not start**)

## Purpose

Evidence-based hardening of accessibility, security, privacy, resilience, tests, and release-quality documentation before Stage 19 testing. This stage improves confidence for demo and future pilot work — **not** production certification.

## Included

- Threat model, data-flow / trust boundaries, data classification update
- Secret scan, dependency / supply-chain audit, local-storage audit
- Auth, multi-role, API authorisation, transport, rate-limit boundary docs
- QR, notification, deep-link, logging, privacy, screen-capture, clipboard policies
- Migration, error-boundary, failure-injection, low-storage, lifecycle review
- Full accessibility audit method + TalkBack attempt + related validations
- Performance baseline honesty, coverage audits, static analysis
- Mobile/backend security tests, a11y component tests, production-configuration tests
- Android development-build attempt and hardening walkthrough honesty
- Cryptography claims register; resilience and backup/restore boundaries
- Inventories and Stage 18 quality documentation

## Excluded

- New clinical workflows, risk/nutrition/referral/AI/ASR rules or packs
- New roles, public registration, remote push, production Firebase, cloud deploy
- WCAG / OWASP / legal / medical / regulatory certification claims
- Patient-facing app, complete release submission
- Stage 19 E2E testing / demonstration / release preparation

## Key paths

| Area | Path |
|---|---|
| Threat model | `docs/security/NORTHCARE_THREAT_MODEL.md` |
| Secret scan | `docs/security/STAGE_18_SECRET_SCAN.md` |
| Accessibility audit | `docs/accessibility/STAGE_18_ACCESSIBILITY_AUDIT.md` |
| Change register | `docs/quality/STAGE_18_CHANGE_REGISTER.md` |
| Checkpoint | `docs/development/STAGE_18_CHECKPOINT.md` |
| Android build | `docs/development/ANDROID_DEVELOPMENT_BUILD.md` |

## Packages

Prefer **zero** new runtime packages. Dev-only tooling only if necessary and documented. No analytics / session-recording / root-detection SDKs.

## Exit

Checkpoint approved → ready for Stage 19 approval (do not auto-start Stage 19).
