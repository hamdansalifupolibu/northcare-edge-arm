# User Roles and Journeys

## Frontline Health Worker

### Responsibilities

- Register new clients (pregnant women, postnatal mothers, newborns, children under five)
- Record visits and conduct health assessments
- Capture symptoms and concerns by voice or guided questions
- Record measurements (weight, blood pressure, temperature, MUAC)
- Provide approved health and nutrition guidance
- Create referrals to appropriate facilities
- Track referral status and follow-up completion
- Communicate guidance to caregivers in English or Dagbanli
- Review locally stored records
- Synchronise records when connectivity returns

### Typical Daily Workflow

1. Unlock workspace with 6-digit PIN (offline)
2. Review urgent follow-ups and overdue referrals on dashboard
3. Travel to community or receive clients at CHPS compound
4. Register new clients or search existing ones
5. Start a new visit — speak the case or use guided questions
6. Review AI-extracted information and confirm accuracy
7. Complete guided screening for relevant assessment
8. Review risk prioritisation result and explanation
9. Create referral if required — generate QR Referral Passport
10. Provide caregiver guidance (English or Dagbanli)
11. Save all records locally
12. Synchronise when internet connectivity becomes available

---

## Administrator

### Responsibilities

- Create and manage worker accounts
- Assign workers to facilities
- Activate and deactivate accounts
- Reset worker passwords
- Manage registered facilities
- Review referral activity across the district
- Monitor synchronisation health
- Manage approved guidance content
- Review system audit activity
- Access aggregated reports (not individual patient records by default)

### Access Boundaries

- Administrators should NOT automatically receive unrestricted access to individual patient information
- Access is role-based and limited to operational needs
- Individual client data requires explicit authorisation

---

## Caregiver Interaction Points

Caregivers (mothers, fathers, guardians, family members) are not direct application users but interact with NorthCare AI through:

- Receiving verbal health and nutrition guidance from the health worker
- Hearing Dagbanli audio guidance played by the worker
- Receiving a QR Referral Passport to present at the receiving facility
- Receiving follow-up visit notifications through the worker
- Understanding the risk explanation shared by the worker

All caregiver-facing content must be:
- Understandable and clear
- Respectful and non-shaming
- Culturally appropriate for Northern Ghana
- Available in English and Dagbanli

---

## Main Worker Journey

```
App Launch
  → Splash Screen (animated, offline-status messages)
  → [First-time] Onboarding (3 slides: Care, Workers, Offline)
  → [First-time] Workspace Selection (Worker / Admin)
  → [First-time] Login (credentials + biometric option)
  → [First-time] Create PIN
  → [First-time] Privacy Consent
  → [First-time] Permissions (Notifications, Microphone)
  → [First-time] Preparing Workspace (download offline assets)
  → [First-time] Setup Complete
  → [Returning] PIN Unlock
  → Worker Dashboard
    → Search / Browse clients
    → Register new client OR select existing
    → Start new visit
      → Voice Capture OR Guided Questions
      → [Voice] Review extracted information → Confirm
      → Guided screening (ANC / PNC / Newborn / Nutrition)
      → Risk result (Red / Amber / Green with explanation)
      → [If needed] Create referral → QR Referral Passport
      → [If needed] Provide caregiver guidance
    → Save locally
    → Sync when online
```

## Main Referral Journey

```
Referral Created (by health worker)
  → Receiving facility selected
  → Urgency and reason recorded
  → Transport availability noted
  → Caregiver informed
  → QR Referral Passport generated (offline)
  → Journey started
  → Facility reached
  → Patient received (scanned QR or confirmed)
  → Referral completed
  → Follow-up scheduled if needed

Possible statuses:
  Created → Caregiver Informed → Journey Started → Facility Reached
  → Patient Received → Completed

Edge cases:
  → Overdue (not arrived within expected timeframe)
  → Incomplete (patient did not reach facility)
  → Follow-up required
```

## Main Nutrition Journey

```
Select client → Nutrition assessment
  → Record child age, breastfeeding status, complementary feeding
  → Record meals per day, available local foods
  → Record household affordability, seasonal availability
  → Food diversity assessment (visual ring chart)
  → Local meal guidance with locally relevant foods
  → Preparation guidance
  → Dagbanli audio guidance (play for caregiver)
  → Schedule nutrition follow-up
  → Save locally
```

## Main Administrator Journey

```
Login → Admin Dashboard
  → View aggregated referral trends and KPIs
  → Review facility health and connectivity status
  → Manage workers
    → Create new worker account
    → Assign to facility
    → Review worker activity and sync freshness
    → Activate / deactivate accounts
  → Review referral oversight
    → Track overdue referrals across facilities
  → Review sync health
    → Identify facilities with stale data
  → Manage approved content
```
