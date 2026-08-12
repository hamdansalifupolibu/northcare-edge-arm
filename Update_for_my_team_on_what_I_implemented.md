# NorthCare AI — Project Update for the Team

**Date:** August 7, 2026  
**From:** Salifu Dandaawa  
**For:** Team member (200L Medical/UDS Student)

---

## What is NorthCare AI?

NorthCare AI is an Android mobile app built for **frontline community health workers in Northern Ghana**. It helps them document patient visits, screen children for malnutrition, and get reviewed clinical guidance — all **offline-first** on their phone.

Our tagline: **Smarter care. Stronger communities.**

---

## What Has Been Implemented So Far

### 1. Voice-to-Care (Speech-to-Text + AI Extraction)

**What it does:** A health worker records a voice note during a home visit. The app transcribes it using an on-device Whisper AI model, then a second AI (Qwen) extracts structured patient data from the transcript.

**How it works:**
- Worker taps "Voice-to-Care" → selects or registers a patient → records audio
- The Whisper base.en model (running entirely on the phone, no internet needed) transcribes the recording
- Worker reviews/edits the transcript and confirms
- Qwen AI extracts: patient name, baby name, age, reason for visit, symptoms, temperature, weight, urgency level, actions taken
- Results are saved and displayed as "Recording 1", "Recording 2", etc. with date/time

**Key decisions:**
- Using `base.en` Whisper model (more accurate than tiny, takes ~30s but worth it)
- Audio is converted from M4A to WAV format before transcription (fixes hallucination issues)
- All AI runs on-device — no internet required for transcription or extraction
- Post-processing filters remove generic placeholder values from AI output

---

### 2. Nutrition Assessment System (WHO-based MUAC Screening)

**What it does:** Screen children aged 6–59 months for acute malnutrition using WHO/UNICEF community guidelines. The app classifies children as SAM, MAM, or Normal and provides reviewed guidance for the health worker.

**How it works:**
- Worker taps "Nutrition Assessment" → sees recent assessments history → taps "New Assessment"
- Selects a registered patient
- Fills in: age, sex, weight, MUAC (mid-upper arm circumference), height (optional), bilateral oedema check, feeding questions
- App automatically classifies using **deterministic WHO rules** (not AI):
  - **SAM** (Severe Acute Malnutrition): MUAC < 11.5 cm OR bilateral oedema present
  - **MAM** (Moderate Acute Malnutrition): MUAC 11.5–12.5 cm
  - **Normal**: MUAC ≥ 12.5 cm
- Shows color-coded results (red/amber/green) with:
  - Worker action steps (what to do)
  - Caregiver-facing text (what to tell the mother/caregiver)
  - Follow-up instructions

**Key decisions:**
- Classification uses **approved WHO/GHS rules only** — no AI guessing
- MUAC is the primary screening tool (as per WHO community CMAM guidelines)
- Guidance text is based on WHO CMAM Guidelines and Ghana IYCF Counselling Card
- All data stored locally on device (offline-first)
- Assessment history is preserved so workers can track patients over time
- **Edit functionality:** If a mistake was made, you can tap "Edit" on the results page to go back into the form with all values pre-filled, make corrections, and re-submit
- **Guidance cards** are color-coded (red for SAM/urgent, amber for MAM/moderate, green for normal) with clear worker actions and caregiver-facing text

---

### 3. NorthCare AI Chatbot (Offline)

**What it does:** A Qwen-powered offline chatbot that health workers can ask general health questions to. It runs entirely on the phone.

**Important limitations:** It does NOT diagnose, prescribe, or calculate dosages. It's a general assistant, not a clinical decision tool.

---

### 4. Client Registration & Management

- Register patients with: name, date of birth, sex, community, category (child under 5, newborn, pregnant, postnatal)
- Client profiles store all associated voice recordings and nutrition assessments
- Search and filter clients

---

### 5. Referral System

- Create referrals to health facilities
- QR code-based referral passports for verification
- Track referral status

---

## Nutrition IYCF Discussion — Response to Your Clinical Input (August 2026)

Hi — thank you for the detailed conversation on infant and young child feeding (IYCF). Your points align well with WHO community guidance. Below is what NorthCare AI **already had**, what we **took from your suggestions**, what we **implemented for the hackathon**, and what stays **out of scope for now**.

### What NorthCare AI already had (before this update)

- **Layer A — Acute malnutrition (community screening):** MUAC + bilateral oedema → deterministic SAM / MAM / Normal classification (WHO CMAM-style rules, not AI).
- **Anthropometry:** Weight, MUAC, optional height/length; measurements stored offline.
- **WHO growth z-scores:** Weight-for-age, length/height-for-age, weight-for-length/height, BMI — **display panel only**; they do not override MUAC-based acute classification.
- **Basic feeding capture:** Breastfeeding yes/no, complementary feeding started, meals per day, feeding difficulties (free text).
- **Reviewed guidance cards:** Worker actions + caregiver-facing counselling text after classification.
- **Offline-first:** All assessments saved on device; synthetic demo data only until GHS review.

### What we accepted from your discussion

| Your suggestion | Our decision |
|-----------------|--------------|
| Age should determine which questions appear (e.g. 14-month path vs infant path) | **Accepted** — age-gated sections in the form |
| Breastfeeding → EBF under 6 months → complementary feeding from 6 months | **Accepted** — separate EBF block for &lt;6 months |
| MDD: ≥5 of 8 food groups **yesterday** (WHO 6–23 month standard) | **Accepted** — checklist + automatic score |
| MMF separate from MDD (e.g. 14 mo breastfed needs ≥3 meals/day) | **Accepted** — auto-scored from age + BF + meals/day |
| MDD can pass but MMF fail → child not adequately fed | **Accepted** — "Minimum acceptable diet" summary when both needed |
| Same food 3×/day ≠ real diversity | **Accepted** as **counselling flag**, not a replacement for WHO MDD |
| Structured feeding difficulties checklist | **Accepted** — multi-select concerns |
| Full clinical exam (A–I) at every visit | **Refined** — too broad for CHPS hackathon; acute red flags only via existing SAM/MUAC path for now |
| Foods to limit / therapeutic protocols | **Deferred** — counselling content needs GHS review |

### What we implemented now (hackathon scope)

1. **Age-gated IYCF sections** — under-6 EBF; 6+ complementary feeding + meals; MDD checklist for 6–59 months.
2. **MDD 8-group checklist** ("yesterday") with Northern Ghana food examples in help text.
3. **MMF auto-scoring** — WHO thresholds: breastfed 6–8 mo ≥2 meals; breastfed 9–23 mo ≥3; non-breastfed 6–23 mo ≥4.
4. **Minimum acceptable diet** panel on results (MDD ✓ + MMF ✓ for 6–23 months).
5. **Counselling flags** — same-food-yesterday question; feeding difficulty checklist.
6. **Results UI** — new "Feeding practices (IYCF indicators)" panel on summary and details screens, alongside existing MUAC classification.

### Hackathon scope — what this is *not*

- **Not a hospital admission tool** — built for **CHPS / community health workers**, not full inpatient examination.
- **Not AI diagnosis** — all IYCF scoring is **deterministic rules**; the chatbot does not interpret feeding answers.
- **Not GHS-approved pilot content yet** — wording and thresholds are development/synthetic; **GHS clinical review required** before real deployment.
- **Not replacing Layer A** — a child can be MAM/SAM on MUAC even if MDD passes; both layers inform counselling.
- **Not in this sprint:** full A–I physical exam module, maternal nutrition template expansion, z-scores driving SAM/MAM, AI feeding interpretation, Dagbanli clinical translations (UI i18n is separate).

### How to demo the new feeding layer

1. Nutrition Assessment → New Assessment → child **12–18 months**.
2. Enter age in months, measurements, then complete **Dietary Diversity** (tick ≥5 of 8 groups from yesterday).
3. Set meals/day to **1** while breastfed → complete assessment.
4. On results: MUAC classification (Layer A) **and** IYCF panel showing MDD met but MMF not met → "Not adequately fed" counselling note.

---

## What's Next: Dagbanli Language Integration

We're planning to add Dagbanli (Dagbani) language support:
- Language switch on the homepage (English ↔ Dagbanli)
- Translate fixed UI text (buttons, questions, guidance)
- Potentially test Dagbanli speech recognition using GhanaNLP resources

---

## How to Demo the App

### Voice-to-Care Demo:
1. Open app → tap "Voice-to-Care"
2. Tap "Quick Start" → Record a voice note (speak as if documenting a home visit)
3. Stop recording → wait ~30s for transcription
4. Review transcript → Confirm
5. Wait for AI extraction (~10-15s)
6. See extracted patient data displayed

### Nutrition Assessment Demo:
1. Open app → tap "Nutrition Assessment"
2. You'll see a landing page with "New Assessment" button and any previous assessments listed
3. Tap "New Assessment" → select a registered patient
4. Fill in: sex (tap Male/Female), weight (e.g. 8.5), MUAC (e.g. 12.0 for MAM or 10.5 for SAM)
5. Answer oedema question (Yes/No) and feeding questions
6. Confirm acknowledgement → Review → Complete
7. See the **Assessment Details** page with classification (color-coded), measurements, and all responses
8. Tap "View guidance" for detailed action cards with worker instructions and caregiver text
9. If you made a mistake, tap "Edit" at the top-right → form reopens with all data pre-filled → fix and re-complete

### Sample data for nutrition demo:
- **SAM case:** MUAC = 10.5 cm, or bilateral oedema = Yes
- **MAM case:** MUAC = 12.0 cm, oedema = No
- **Normal case:** MUAC = 13.5 cm, oedema = No

---

## Tech Stack (for reference)

- **Framework:** React Native + Expo (TypeScript)
- **Platform:** Android-first
- **Database:** SQLite (on-device, offline-first)
- **Speech-to-Text:** Whisper base.en (on-device)
- **AI Extraction:** Qwen 0.5B (on-device)
- **Clinical Rules:** Deterministic WHO/GHS algorithms (no AI)

---

## Important Notes for Presentation

- The app works **completely offline** — no WiFi needed during demo
- All AI models run on the phone itself
- Nutrition classification uses **approved WHO rules**, not AI guessing
- The app does NOT diagnose or prescribe — it screens and guides
- Data shown is synthetic (for development/demo purposes)
- Final clinical wording needs GHS (Ghana Health Service) review before real deployment
