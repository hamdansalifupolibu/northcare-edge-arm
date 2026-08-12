# Cursor Implementation Rules (Human-Readable)

These rules should be mirrored into `.cursor/rules/northcare-project.mdc` **after Stage 1 approval** (do not create the rule file until the repository rules structure is approved).

## Always

1. Read root `AGENTS.md` before modifying the repository (once it exists).  
2. Read the approved stage specification for the current stage.  
3. Implement **only** the approved stage scope.  
4. Stop after the stage and produce the checkpoint report.  
5. Prefer Expo SDK **versioned docs** for the installed SDK (currently 57 in `northcare-app`).  
6. Keep the app Android-first: React Native + Expo + TypeScript.  
7. Use design tokens; do not hardcode brand colours.  
8. Follow approved route map and data model once published.  
9. Access data through repositories — **never** SQLite directly from UI components.  
10. Preserve offline-first behaviour for core clinical flows.  
11. Add or update tests required by `TEST_STRATEGY.md` for the stage.  
12. Report unresolved issues honestly.  

## Never

1. Do not create a React/Next/Tailwind **website** as the product.  
2. Do not treat Stitch HTML exports as the runtime app.  
3. Do not forge or redraw the NorthCare AI logo.  
4. Do not invent UNICEF / Ghana Health Service logos or endorsements.  
5. Do not invent medical guidance, protocols, dosages, or final Dagbanli medical translations.  
6. Do not diagnose or prescribe.  
7. Do not let AI-extracted fields become official records without worker confirmation.  
8. Do not use an LLM as the primary danger-sign engine.  
9. Do not expose secrets, commit `.env`, or log patient data.  
10. Do not use real patient data — synthetic only.  
11. Do not silently make major technical decisions listed in `TECHNICAL_DECISIONS_REQUIRED.md`.  
12. Do not auto-continue to the next stage without approval.  
13. Do not perform unrelated refactors during a focused stage.  

## Stage change permissions

Each implementation prompt must state:

- Files/directories permitted to change  
- Files forbidden to change  
- Packages allowed to install (if any)  
- Acceptance criteria  

## Safety hierarchy (implementation order reminder)

1. Deterministic approved danger-sign rules  
2. Worker review  
3. Approved content sources  
4. Constrained AI  
5. Clear referral actions  
6. Auditability  
7. Human oversight  

## Product spelling

Always: **NorthCare AI**  
Never: North Care AI, NorthCareAI, NorthCare A1, NorthCare Al, NorthCareBridge AI, NorthCare Ghana
