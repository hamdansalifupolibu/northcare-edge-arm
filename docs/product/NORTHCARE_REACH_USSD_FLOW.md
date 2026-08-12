# NorthCare Reach — USSD Flow Freeze

**Status:** Frozen by Reach Stage R0; R3 simulator implements the frozen menus; R6 demo packaging uses the same flows; **Ask NorthCare (menu 7)** added as a hackathon FAQ-only extension (2026-08-04)  
**Last updated:** 2026-08-04  
**Machine-readable:** `implementation/reach-ussd-flow.json`

## Simulation banner

Every session screen must make clear:

- NorthCare Reach USSD simulation  
- Live telecom integration pending  

**R3:** Implemented in `services/api/static/reach-simulator/` and served at gated `GET /reach-simulator`. Also show “Synthetic demonstration data only”.

**AT sandbox (T1):** Africa's Talking callbacks use the same menu numbers; screens may say “AT sandbox - not a live Ghana shortcode”. Live shortcode remains unavailable.

## Main menu

```text
NORTHCARE REACH

0. Emergency help now
1. Pregnancy and newborn care
2. Child health
3. Nutrition
4. Request a CHPS worker
5. Check a request or follow-up
6. Language
7. Ask NorthCare
```

## Option 0 — Emergency help

```text
EMERGENCY HELP

If someone is in immediate danger, call 112 now.

1. End and call 112
2. Send location for urgent human review
3. Request an urgent CHPS callback
9. Back
```

| Choice | Behaviour |
|---|---|
| 1 | Instruct user to end session and dial 112. Does **not** claim NorthCare placed the call. Does **not** create a request. |
| 2 | Collect person-needing-help category, community/town/landmark, contact number, consent to share contact and location. Creates request `category=emergency`, `requestType=emergencyAssistance`. |
| 3 | Collect community/landmark, contact number, consent to contact. Creates request `category=emergency`, `requestType=urgentContact`. |

**Confirmation (options 2 and 3):**

```text
Emergency coordination simulation

Request received

If someone is in immediate danger, call 112 now.
```

Forbidden wording: ambulance dispatched/called; emergency medically confirmed; severe/major/moderate emergency; any medical grading by the user.

## Option 1 — Pregnancy and newborn

```text
PREGNANCY & NEWBORN CARE

1. Care during pregnancy
2. Labour and warning signs
3. Care after delivery
4. Newborn care
5. Breastfeeding
6. Request a CHPS worker
0. Emergency help
9. Back
```

- Options 1–5: short development placeholder content, labelled **unapproved demonstration content**. No diagnosis, medication, dosage, or chatbot.  
- Option 6: request with `category=pregnancyNewborn` (typically `requestType=routine`).  

## Option 2 — Child health

```text
CHILD HEALTH

1. Fever
2. Diarrhoea or vomiting
3. Cough or breathing concern
4. Poor feeding or weakness
5. Immunisation and routine care
6. Request a CHPS worker
0. Emergency help
9. Back
```

- Options 1–5: labelled demonstration placeholders only. No symptom classification, medicine, dosage, or risk score.  
- Option 6: `category=childHealth`.  

## Option 3 — Nutrition

```text
NUTRITION SUPPORT

1. Pregnant woman
2. Breastfeeding mother
3. Baby under 6 months
4. Child 6 to 24 months
5. Child 2 to 5 years
6. Request nutrition support
0. Emergency help
9. Back
```

- Options 1–5: demonstration content only. No malnutrition classification, anthropometry, or treatment recommendation.  
- Option 6: `category=nutrition`.  

## Option 4 — Request a CHPS worker

1. Reason → maps to category: pregnancy/newborn → `pregnancyNewborn`; child health → `childHealth`; nutrition → `nutrition`; referral/follow-up → `referralFollowUp`; other → `generalChps`  
2. Community, town or nearest landmark  
3. Callback phone number  
4. Consent to share contact and location with an authorised health worker  
5. Return privacy-safe reference code, private six-digit status PIN (shown once), generic confirmation, and 112 reminder  

Does **not** automatically create a NorthCare client record. Default `requestType=routine` unless flow specifies otherwise.

## Option 5 — Check request or follow-up

**Input:** reference code + six-digit status PIN  

**Allowed generic public states:** Request received; Waiting for review; Health worker acknowledged; Contact attempt recorded; Escalated for further support; Request handled; Request cancelled  

**Must not expose:** category, pregnancy/child/nutrition concern, emergency description, contact number, community, worker name, facility, clinical notes, priority, referral information  

PIN stored only as secure hash/verifier in future implementation. Rate limiting and abuse protection are required before public deployment (documented for R2+).

## Option 6 — Language

```text
1. English
2. Dagbanli — planned
3. Hausa — planned
4. Dagaare — planned
5. Request language assistance
9. Back
```

**MVP decision:** English is the only implemented interface language. Do not fabricate translations or use automatic AI translation for public health information.

## Option 7 — Ask NorthCare (FAQ-only information support)

**Honesty / clinical boundary:** This is **approved community information support**, not clinical advice, not a diagnosis engine, and **not** generative medical AI on USSD. Worker-side Ask NorthCare (on-device model in the mobile app) is a separate surface and is **not** invoked from USSD.

```text
ASK NORTHCARE
Information support - not clinical advice

1. What is NorthCare Reach?
2. How do I request a CHPS visit?
3. How does my status PIN work?
4. CHPS or clinic hours
5. Emergency - call 112
6. Request worker follow-up
Or type a short community question
0. Emergency help
9. Back
```

| Choice / input | Behaviour |
|---|---|
| 1–4 | Show short approved FAQ answer + disclaimer (not a diagnosis; emergencies call 112; for care talk to a health worker). Option to start worker follow-up (`generalChps` / `routine`) via the existing location → phone → consent create flow. |
| 5 | Emergency escalation copy: instruct dialling 112; does not claim NorthCare placed the call; optional urgent CHPS callback or routine follow-up. |
| 6 | Starts existing CHPS request create flow (`category=generalChps`, `requestType=routine`). Does **not** auto-create from the question alone. |
| Free text | Keyword match against the approved FAQ pack only. No LLM. On no match: offer worker follow-up / emergency / back. |
| 0 | Emergency help menu |
| 9 | Back |

**Must not:** diagnose symptoms, prescribe, calculate dosage, invent protocols or Dagbanli, call an on-device or cloud LLM as the answer engine, auto-create clients or referrals from a USSD question, or log free-text health content / PINs / full tokens.

**USSD constraint:** Prefer short CON/END screens suitable for ~10s callbacks. FAQ-first is intentional for reliability.

## Navigation conventions

Where the session design permits: `0` = Emergency help; `9` = Back. Session reset must be available in the simulator.
