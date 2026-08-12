# Test Strategy

## Principles

- Testing grows with the product; do not defer all tests to Stage 19.  
- Safety-critical logic (risk rules, auth gates, sync idempotency) gets automated tests first.  
- UI may use component tests; clinical rules use pure unit tests with no UI dependency.  
- Offline behaviour must be testable without a live network.  

## Test types

| Type | Purpose | Typical tools (proposed — confirm in S1/S2) |
|---|---|---|
| Typecheck | Strict TS contracts | `tsc --noEmit` |
| Lint/format | Consistency | ESLint + Prettier |
| Unit | Pure logic (rules, validators, mappers) | Jest / Vitest |
| Component | Presentational behaviour | RNTL |
| Repository/DB | SQLite migrations, CRUD, soft delete | Jest + Expo SQLite test harness |
| Navigation | Route guards, deep links | RNTL / integration |
| Integration | Vertical slice workflows | Jest + repo/service layer |
| Offline | Airplane-mode / NetInfo mocked | Integration + manual emulator |
| Sync/conflict | Queue, retry, version merge | Unit + integration |
| Notification | Scheduling, privacy copy | Unit + manual |
| Security | No PII in logs; SecureStore usage | Review checklist + unit where possible |
| Accessibility | Labels, targets, contrast | Manual + eslint-plugin-react-native-a11y if adopted |
| Emulator E2E | Demo path smoke | Maestro / Detox (decide later) |
| Device | S20 Ultra validation | Manual checklist |
| Demo E2E | Full judge script | Manual + scripted seed reset |

## Mandatory tests by stage

| Stage | Mandatory |
|---|---|
| S0 | Document review only |
| S1 | Lint/format smoke; ignore secrets CI check if feasible |
| S2 | Typecheck; app launches (manual emulator) |
| S3 | Token snapshot/unit; component smoke for Button/RiskCard |
| S4 | Navigation smoke (first-time vs returning) |
| S5 | Migration on empty DB; repository CRUD; seed load |
| S6 | PIN verify unit; route guard; offline unlock manual |
| S7 | Client create/search repository tests; offline register manual |
| S8 | Draft save/resume; form validation unit |
| S9 | **Full rule-engine unit suite** (red/amber/green, missing data, precedence) |
| S10 | Referral state machine unit; QR payload size/privacy checks |
| S11 | “Cannot persist without confirm” unit; recorder permission denied UI manual |
| S12 | Diversity calculation unit; placeholder content flags |
| S13 | Emergency override unit; refusal cases (diagnose/prescribe) |
| S14 | Queue idempotency; conflict strategy unit; sync centre manual |
| S15 | Lock-screen copy privacy unit; deep-link routing |
| S16 | RBAC: admin cannot fetch patient chart by default |
| S17 | Visual checklist (manual); reduced-motion |
| S18 | Secret scan; logging scrubber tests |
| S19 | Full demo path on emulator + device checklist |

## Offline testing protocol

1. Seed synthetic data online once (or from bundled seed).  
2. Enable airplane mode.  
3. Execute P0 journey through referral + QR.  
4. Confirm pending sync indicators.  
5. Disable airplane mode.  
6. Trigger sync; confirm status transitions.  

## Safety testing protocol (S9+)

- Golden fixtures for danger-sign inputs → expected priority + explanation codes  
- Never allow LLM output to change risk level without going through rule engine  
- Extraction review must require explicit confirm before repository write  

## What is not required early

- Full Detox suite before S8  
- Load/performance benchmarking before S18  
- iOS test matrix (P3)
