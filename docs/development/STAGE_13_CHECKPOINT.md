# Stage 13 Checkpoint — Ask NorthCare Constrained Offline Assistant

**Stage:** 13 — Ask NorthCare Constrained Offline Assistant  
**Status:** COMPLETE — READY FOR STAGE 14 APPROVAL  
**Scope approved:** Yes (Stage 12 complete; Stage 13 approved)

## Environment preflight

| Check | Result |
|---|---|
| Metro / port 8081 | Free |
| Package manager | npm |
| `@tybys/wasm-util` | Not present (`npm ls` empty) |
| `react` | 19.2.3 |
| `react-dom` | Not installed in mobile runtime |
| `react-native` | 0.86.2 |
| Existing assistant/chatbot code | None before Stage 13 |
| SQLite FTS5 | Not used / not verified — TypeScript inverted index chosen |

## Dependency-health result

Updated `docs/development/DEPENDENCY_HEALTH.md`. **Zero new packages.**

## Assistant architecture

Feature root: `apps/mobile/src/features/assistant/` with `application/`, `domain/`, `content/`, `retrieval/`, `response/`, `providers/`, `components/`, `screens/`, `session/`, `__tests__/`.

Screens never execute SQL, call remote AI, or pass client records to the assistant.

## Assistant modes

`CURATED_RETRIEVAL` | `CONSTRAINED_GENERATION` (interface only / unavailable) | `DEVELOPMENT_SIMULATION` (dev-gated) | `UNAVAILABLE` (production with 0 pilot packs).

## Worker routes

`/(worker)/ask` (+ topics, answer, sources, article/[articleId], unavailable, urgent). Entry: worker home **Ask NorthCare**. Dev preview: `/(development)/ask-northcare-preview`.

## Scope-disclosure / privacy-reminder result

Visible on home. Privacy precheck for phone/email-like patterns; acknowledgement required before continue.

## Patient-context policy

`docs/safety/ASSISTANT_PATIENT_CONTEXT_POLICY.md` — **PATIENT-SPECIFIC ASSISTANCE DEFERRED**. No hidden client context.

## Knowledge-storage decision

Bundled TypeScript knowledge packs (reviewable). Not AsyncStorage. SQLite migration **007** for feedback/content-issue metadata only. Documented in `ASSISTANT_KNOWLEDGE_STORAGE.md`.

## Knowledge-pack registry / production gate

Production loads only `APPROVED_FOR_PILOT`. **Approved pilot knowledge packs: 0.** Development pack: `synthetic-dev-ask-northcare-v1` (`APPROVED_FOR_DEVELOPMENT`), clearly labelled.

## Local-search decision

TypeScript inverted index + deterministic ranking. `SEARCH_INDEX_VERSION=1`. Coverage threshold score 50 / token ratio 0.4. Documented in `ASSISTANT_LOCAL_RETRIEVAL.md`.

## Intent / boundaries

Typed intents; uncertain → unsupported. Patient-specific, diagnosis, treatment, medication, dosage, urgent boundaries implemented. No invented emergency numbers; no RED priority from keywords.

## Retrieval / composition

Deterministic retrieval-only composer; citations required; no invented clinical wording. Article screen read-only.

## Generative-provider interface

`ConstrainedAssistantProvider` exists; production unavailable; no general model fallback. Development simulation production-gated.

## On-device-model status

`LOCAL_ASSISTANT_MODEL_EVALUATION.md` — **MODEL INTEGRATION DEFERRED — DEVICE AND SAFETY BENCHMARK REQUIRED**.

## Conversation / privacy

In-memory unlocked session only; cleared on lock / inactivity lock / logout / change account. Raw questions not logged, audited, queued, or persisted by default. Routes use stable IDs only.

## Feedback / content issues

Local helpful / notHelpful / reportContentIssue. Wording: “Feedback saved on this device”. Optional notes truncated; not logged.

## Schema migration

Migration **007** — `assistant_feedback`, `assistant_content_issues`. Schema version **7**.

## Packages installed

**None.**

## Commands run

```text
netstat (8081 free)
npm ls @tybys/wasm-util
npm ls react react-dom react-native
npx tsc --noEmit
npm run lint
npm test
npx expo-doctor
adb devices
```

## Results

| Check | Result |
|---|---|
| Type-check | Pass |
| Lint | Pass (0 errors) |
| Tests | **71 suites / 284 tests pass** (assistant 8/32) |
| Expo Doctor | **20/20 passed** |
| Android emulator | `emulator-5554` **offline** — not claimed |
| Physical device | Pending |

## Stitch screens covered

Documented in `docs/design/STAGE_13_STITCH_ALIGNMENT.md` (UX reference only).

## Known limitations

- 0 pilot knowledge packs — production Ask NorthCare unavailable for answers
- No real LLM / on-device model
- No Dagbanli answers
- Android visual validation pending (emulator offline)
- Content clinical review outstanding

## Outstanding content-review / model-evaluation work

- Pilot-approved knowledge packs with reviewed sources
- Generative provider clinical/hallucination/refusal evaluations (future)
- On-device model device/safety benchmark (deferred)

## Git status

No Stage 13 commit created (awaiting approval).

## Recommended Stage 14 scope

**STAGE 14 — BACKEND, SYNCHRONISATION AND CONFLICT RESOLUTION** — do not start without approval.

## Approval required

Yes — stop here.

---

STAGE 13 COMPLETE — READY FOR STAGE 14 APPROVAL
