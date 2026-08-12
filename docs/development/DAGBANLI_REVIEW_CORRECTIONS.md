# Dagbanli review corrections — apply list

**Source:** Reviewer handwritten corrections (Salma Abubakar) on PDF sections 3–4, captured 2026-08-10  
**Rule:** Apply **only** rows where the reviewer wrote a correction. Blank rows keep current app text.

---

## Status summary

| Section | Items | Reviewer completed | Applied to app |
|---------|-------|-------------------|----------------|
| 3. Clients | 36–60 | 18 | 18 |
| 4. Nutrition | 61–90 | 8 | 8 |
| 5. Voice-to-Care | 91–110 | 0 | 0 |
| 6. Referrals | 111–125 | 0 | 0 |
| 7. Ask NorthCare | 126–137 | 0 | 0 |
| 8. Sign-in & security | 138–150 | 0 | 0 |

**Overall:** 26 strings applied (Batch 1). Disclaimer and review banner remain active until full sign-off.

---

## Applied — Section 3: Clients

| # | English | Reviewer correction | String key(s) | Applied |
|---|---------|---------------------|---------------|---------|
| 36 | Register client | Yuli sabi doya | `clients.register`, `clients.emptyAction`, `clients.registration.title` | ✅ 2026-08-10 |
| 37 | Search clients | Niriba bobu | `clients.searchLabel` | ✅ |
| 38 | Search by name | Yuuli bobu | `clients.searchPlaceholder` (prefix) | ✅ |
| 39 | No clients yet | Niriba na ka ni | `clients.emptyHeading` | ✅ |
| 40 | Pregnant | Paɣa'puu lana | `clients.categories.pregnant` | ✅ |
| 42 | Newborn | Bilieɣu | `clients.categories.newborn` | ✅ |
| 46 | Guardian | Talahi nira | `clients.relationships.guardian` | ✅ |
| 47 | Grandparent | Ninkura | `clients.relationships.grandparent` | ✅ |
| 48 | Caregiver | Ɛin kuna | `clients.profile.caregiver`, `clients.registration.caregiver*` | ✅ |
| 50 | Born [date] | Doɣim dabsili | `clients.age.bornOn` | ✅ |
| 51 | Consent recorded | A saɣti sabiya | `clients.consent.recorded` | ✅ |
| 52 | Consent declined | A saɣti zaɣsigu | `clients.consent.declined` | ✅ |
| 54 | Client identity | Ninvuɣ so din nye o | `clients.registration.identityHeading` | ✅ |
| 55 | Age or date of birth | Yuma bee doɣim dabsili | `clients.registration.ageHeading` | ✅ |
| 59 | Start visit | Piligi kaabu *(reviewer: Piling kaabu/kpɛbu)* | `clients.profile.startVisit`, `visits.*` | ✅ |
| 60 | Client profile | O nahiŋbaŋ *(alt: Bari Gbanŋ)* | `clients.profile.title` | ✅ |

### Pending — Section 3 (no correction written)

| # | English | Current kept |
|---|---------|--------------|
| 41 | Postnatal | Pogba kpeei |
| 43 | Child under five | Bia yuma anuu taha |
| 44 | Mother | Ma |
| 45 | Father | Ba |
| 49 | Age not recorded | Yuma bi sabi |
| 53 | Who are you registering? | Ŋuni a tiri sabi? |
| 56 | Review before saving | Nyɛ ka a sabi |
| 57 | Client saved | Nira sabi |
| 58 | View client profile | Nyɛ nira profile |

---

## Applied — Section 4: Nutrition

| # | English | Reviewer correction | String key(s) | Applied |
|---|---------|---------------------|---------------|---------|
| 64 | Nutrition history | Dibu lahibali tarihi | `nutrition.historyTitle`, `backToHistory` | ✅ |
| 67 | View guidance | Nyɛ soŋsim | `nutrition.summaryViewGuidance` | ✅ |
| 77 | Adequate (short) | Yɛltɔɣa jiya *(reviewer: yeltoɣa jiya)* | `classificationAdequateShort`, filters/stats | ✅ |
| 78 | MUAC | MUAC | *(unchanged — reviewer left blank)* | — |
| 79 | Weight | Timsim | `measurementWeight` | ✅ |
| 80 | Height/Length | Waɣilim | `measurementHeight` | ✅ |
| 81 | Measurements | Buɣisibu | `measurementsSection` | ✅ |
| 86 | Infant feeding | Bilieɣu dibu lahabali | `assessmentTypes.infantFeeding` | ✅ |
| 88 | Previous section | Sabi shɛli din gari | `sectionBack` | ✅ |

### Pending — Section 4 (no correction written)

Items 61–63, 65–66, 68, 69–76, 82–85, 87, 89–90 — keep current text; many still mix English (`assessment`, `guidance`).

---

## English-keep list (confirmed by reviewer instructions)

Keep unless reviewer later supplies Dagbanli:

- NorthCare AI, Voice-to-Care, SAM, MAM, **MUAC**, QR, PIN, PDF, AI  
- Mixed terms where no natural equivalent: *assessment*, *referral*, *transcript*, *offline*

---

## Next batch (when reviewer continues)

1. Voice-to-Care (91–110)  
2. Referrals (111–125)  
3. Ask NorthCare (126–137)  
4. Sign-in & security (138–150)  
5. Revisit pending client/nutrition rows above

After each batch: update this file → `dg.ts` / feature `dg*.ts` → `DG_TRANSLATION_STATUS`.
