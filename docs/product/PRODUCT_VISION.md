# Product Vision

## Product Purpose

**NorthCare AI** is an offline-first, AI-assisted maternal, newborn, child-health and nutrition platform designed mainly for frontline health workers in Northern Ghana.

**Tagline:** Smarter care. Stronger communities.

## Problem Statement

Frontline health workers in Northern Ghana face a combination of structural barriers that make community-level healthcare delivery difficult:

- Weak, intermittent or unavailable internet connectivity
- Distance between health facilities and many households
- Manual recording of client information
- Fragmented follow-up records across visits
- Referrals that are not tracked from community to receiving facility
- Language barriers affecting caregiver communication
- Limited time to complete lengthy assessment forms
- Risk that important danger signs may be missed or recognised late
- Health and nutrition guidance not always immediately accessible
- Caregivers may not receive clear instructions in a familiar language

These gaps can delay early detection, weaken referral completion and reduce the quality of maternal, newborn and child-health care at the community level.

## Target Users

### Primary: Frontline Health Workers

- CHPS workers
- Community health nurses
- Nutrition officers
- Maternal and child-health workers
- Community health volunteers
- Other authorised frontline workers

### Secondary: Administrators

- Facility supervisors
- Programme administrators
- Health-system administrators
- Approved content managers
- System-support staff

## Target Beneficiaries

- Pregnant women
- Postnatal mothers
- Newborns
- Children under five
- Caregivers and families
- Community health programmes
- Receiving health facilities

## Value Proposition

NorthCare AI helps authorised frontline health workers:

1. **Capture** client information efficiently — by voice or guided forms
2. **Structure** spoken descriptions into reviewable clinical fields
3. **Screen** for approved danger-sign patterns using deterministic rules
4. **Explain** why a case requires attention with transparent reasoning
5. **Refer** clients to appropriate facilities with tracked offline referrals
6. **Guide** caregivers with locally relevant nutrition and health information
7. **Communicate** guidance in English and Dagbanli
8. **Save** all work offline and synchronise when connectivity returns
9. **Follow up** on referrals, appointments and outstanding cases

## Core Capabilities

| Capability | Description |
|---|---|
| Client Management | Register, search, view and manage pregnant women, postnatal mothers, newborns and children under five |
| Voice-to-Care | Describe cases naturally by speech; system structures spoken information into reviewable fields |
| Guided Screening | Step-by-step assessments for pregnancy, postnatal, newborn, child and nutrition concerns |
| Explainable Risk Prioritisation | Red/Amber/Green danger-sign classification with transparent reasoning |
| Referral Management | Create, track and complete referrals with offline QR Referral Passport |
| Nutrition Intelligence | Local food diversity assessment, affordable meal guidance, Dagbanli audio counselling |
| Ask NorthCare | Constrained health and nutrition assistant with approved guidance only |
| Offline-First Operation | All core clinical flows function without internet; synchronise when connectivity returns |
| Notifications | Follow-up reminders, overdue referrals, sync status, privacy-safe lock-screen alerts |

## Product Principles

- **Human-centred** — designed around the real workflow of frontline health workers
- **Safe** — deterministic rules for urgent decisions; AI supports but does not replace clinical judgement
- **Practical** — reduces form burden, surfaces guidance, tracks referrals
- **Respectful** — culturally appropriate, non-shaming, dignified imagery and language
- **Trustworthy** — transparent AI reasoning, worker review of all extracted data
- **Calm** — clean interface that does not overwhelm in high-stress clinical situations
- **Locally relevant** — designed for Northern Ghana, CHPS compounds, local foods, Dagbanli language
- **Offline-first** — connectivity is a bonus, not a requirement
- **Professionally designed** — Material 3 inspired, teal/amber brand identity

## Responsible-AI Boundaries

NorthCare AI must NOT:

- Replace professional healthcare judgement
- Diagnose conditions
- Prescribe medication
- Calculate medication dosages
- Fabricate medical guidance or health protocols
- Fabricate Dagbanli medical translations
- Save unreviewed AI extraction as official data
- Treat generative AI output as an emergency decision system
- Hide uncertainty
- Expose private client data in logs or lock-screen notifications

NorthCare AI's safety structure:

1. Deterministic approved danger-sign rules
2. Worker review and confirmation of all AI output
3. Approved local knowledge content
4. Constrained AI support within defined boundaries
5. Clear referral and escalation actions
6. Full auditability
7. Human oversight at every clinical decision point

## Offline-First Principle

The application must continue supporting essential work when internet access is unavailable. This is not an enhancement — it is a core architectural requirement.

Intended offline capabilities:

- Returning-user PIN access
- Local client search and registration
- Visit recording and guided screening
- Rule-based risk prioritisation
- Referral creation with offline QR passport
- Draft saving and resumption
- Stored caregiver guidance and nutrition information
- Stored Dagbanli audio messages
- Local notifications
- Sync-queue creation for deferred upload

Sync status must be clearly visible: Saved locally → Waiting → Syncing → Synced → Failed → Needs review
