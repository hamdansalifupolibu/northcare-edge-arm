# Checkpoint — Reach USSD Ask NorthCare (FAQ-only hackathon slice)

**Stage / slice:** Reach USSD Ask NorthCare (menu 7)  
**Status:** Implemented — awaiting review  
**Scope approved:** User selected **build_now** (hackathon); Stage 19 remains paused  

## What was implemented

- Main menu option **7) Ask NorthCare** on Africa's Talking sandbox session engine and browser Reach simulator.
- **FAQ-only** answer pipeline from an approved English static pack (what Reach is, how to request CHPS, status PIN, hours variability, emergency dial 112).
- Free-text → keyword match against the same pack; no match → offer worker follow-up / emergency / back.
- Every FAQ answer screen includes a short clinical-boundary disclaimer.
- Worker handoff uses existing create flow (`generalChps` + `routine`) after location / phone / consent — **never** auto-created from the question alone.
- **No LLM** on USSD (on-device Qwen / Stage 13 assistant is worker-mobile only and was not wired here).

## Clinical boundary (honesty)

| Claim | Truth |
|---|---|
| Diagnoses conditions | **No** |
| Prescribes / dosage | **No** |
| Generative chatbot on USSD | **No** — approved FAQ templates only |
| Primary danger-sign engine | **No** — emergency copy routes to 112 / existing emergency flows |
| Auto client or referral from USSD question | **No** |
| Live Ghana shortcode | **No** — sandbox / simulator only |
| Label | Information support / not clinical advice |

## Files created

- `services/api/src/northcare_api/reach/ussd_at/ask_faq.py`
- `services/api/tests/unit/test_reach_ussd_ask_northcare.py`
- `docs/development/REACH_USSD_ASK_NORTHCARE_CHECKPOINT.md`

## Files modified

- `services/api/src/northcare_api/reach/ussd_at/menus.py`
- `services/api/src/northcare_api/reach/ussd_at/session_store.py`
- `services/api/static/reach-simulator/reach.js`
- `implementation/reach-ussd-flow.json`
- `docs/product/NORTHCARE_REACH_USSD_FLOW.md`
- `docs/development/NORTHCARE_REACH_FUTURE_EXPANSION.md`
- `docs/demo/NORTHCARE_REACH_LIMITATIONS.md`
- `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md`
- `PROJECT_STATUS.md`

## Files deleted

- None

## Commands run

```text
python -m pytest tests/unit/test_reach_ussd_ask_northcare.py tests/unit/test_reach_at_ussd_adapter.py -q
# 25 passed
```

## Packages installed

- None

## Results

| Check | Result |
|---|---|
| Type-check | N/A (Python FAQ/menus slice) |
| Lint | Not separately run |
| Tests | **25 passed** (`test_reach_ussd_ask_northcare` + `test_reach_at_ussd_adapter`) |
| Android emulator | Not required for this slice |
| Live shortcode | Not enabled |

## Stitch screens covered

- None (USSD / simulator text only)

## Offline behaviour

- USSD Ask NorthCare is online community channel (AT sandbox or hosted API + browser simulator).
- Does not depend on phone-side offline LLM.
- Worker create/status still uses existing Reach public APIs when handoff is chosen.

## Accessibility review

- Simulator keeps SR live announcements for Ask NorthCare entry and emergency copy.
- FAQ answers kept short for USSD display limits.

## Security and privacy review

- Secrets committed? **No**
- Real patient data? **No**
- Free-text health content / PINs / full tokens not logged by AT adapter (segment count only, unchanged policy)
- No live shortcode enabled

## Known limitations

- FAQ pack is a small approved community set — not a clinical knowledge base.
- Free-text matching is keyword-based; many clinical-sounding questions correctly fall through to “no matching approved answer” + worker handoff.
- FAQ copy is duplicated in Python (AT) and JS (browser simulator) for this slice.
- English only.

## Outstanding tasks

- Human review of FAQ wording before any non-demo use.
- Optional later stage: expand approved FAQ pack or add a rate-limited server assistant under a new stage — do **not** start Stage 19 from this slice.

## Unexpected changes

- None beyond menu 7 + docs honesty updates.

## Ready for approval?

Yes — FAQ-only Ask NorthCare on USSD (menu 7) for hackathon demo via AT sandbox and/or browser simulator. Stage 19 remains paused.
