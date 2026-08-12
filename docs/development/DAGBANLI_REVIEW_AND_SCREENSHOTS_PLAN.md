# Dagbanli review, screenshots, and repo showcase — plan

**Updated:** 2026-08-10 (Batch 1 applied + screenshot gallery shipped)  
**Status:** Phase A ✅ · Phase B **in progress** (26/115 review items applied) · Phase C ✅ curated gallery + archive index

---

## 1. Reviewer progress

**Reviewer:** Salma Abubakar (handwritten corrections on PDF sections 3–4, photographed 2026-08-10)

| Batch | Sections | Items corrected | Applied to app |
|-------|----------|-----------------|----------------|
| **1 (done)** | Clients + Nutrition (partial) | 26 | ✅ `dg.ts`, `dgNutritionStrings.ts` |
| **2 (next)** | Nutrition remainder + Voice | TBD | Pending |
| **3** | Referrals + Assistant | TBD | Pending |
| **4** | Auth & security | TBD | Pending |

Track every line in [`DAGBANLI_REVIEW_CORRECTIONS.md`](./DAGBANLI_REVIEW_CORRECTIONS.md).

`DG_TRANSLATION_STATUS` in `apps/mobile/src/i18n/dg.ts` is now **`PARTIALLY_REVIEWED`**. Disclaimer modal and home banner **stay on** until status becomes `REVIEWED`.

---

## 2. Translation policy

### Use reviewer Dagbanli when provided
Salma’s handwritten corrections take priority over machine-drafted strings.

### Keep English / abbreviations when reviewer leaves blank or notes difficulty
| Category | Examples |
|----------|----------|
| Clinical acronyms | SAM, MAM, **MUAC** (item 78 left unchanged) |
| Product names | NorthCare AI, Voice-to-Care |
| Technical UI | QR, PIN, PDF, AI, offline |
| No natural equivalent | *assessment*, *referral*, *transcript* — English term OK until reviewer suggests phrase |

### Reviewer choices with two options
| Item | Options | App choice | Notes |
|------|---------|------------|-------|
| 59 Start visit | Piligi kaabu / kpɛbu | `Piligi kaabu` | Confirm with reviewer |
| 60 Client profile | Bari Gbanŋ / O nahiŋbaŋ | `O nahiŋbaŋ` | Alt available if preferred |

### Never
- Invent clinical Dagbanli protocols  
- Runtime cloud translation in the field app  

---

## 3. In-app UX (implemented)

| Feature | Purpose |
|---------|---------|
| **Disclaimer modal** | Before switching EN → Dagbanli; optional “Do not show again” |
| **Review banner** | On worker/admin home while Dagbanli active and not fully reviewed |
| **`useRequestLanguage()`** | All language switches route through disclaimer gate |

---

## 4. Screenshot showcase (repo visitors)

**Folder:** [`docs/screenshots/`](../screenshots/)

When you add PNG/WebP files:

1. Follow naming in [`docs/screenshots/README.md`](../screenshots/README.md)  
2. Synthetic demo data only  
3. Engineering updates root [`README.md`](../../README.md) gallery  

**Recommended hero set:** onboarding, worker home, voice, nutrition summary, referral QR, admin registration, Dagbanli toggle side-by-side.

---

## 5. Remaining work

### Phase B — Translation (ongoing)

- [x] Batch 1: 26 client + nutrition strings  
- [ ] Send Salma sections 5–8 again for handwriting OR typed corrections  
- [ ] Batch 2: pending items 41–58, 61–63, 65–76, etc.  
- [ ] Final sign-off → `DG_TRANSLATION_STATUS.status = 'REVIEWED'`

### Phase C — Screenshots

- [x] Full archive under root `screenshots/`  
- [x] Curated `screenshots/showcase/` (14 hero images)  
- [x] Root README product gallery + link to full archive  
- [x] `screenshots/README.md` folder index  

---

## 6. File map

| Review section | Code files |
|----------------|------------|
| Clients (3) | `apps/mobile/src/i18n/dg.ts` → `clients.*` |
| Nutrition (4) | `apps/mobile/src/features/nutrition/i18n/dgNutritionStrings.ts` |
| Voice (5) | `dgVoiceStrings.ts` |
| Referrals (6) | `dgReferralStrings.ts` |
| Assistant (7) | `dgAssistantStrings.ts` |
| Auth (8) | `dg.ts` → `auth.*` |

---

## 7. How to test Batch 1

1. Reload app → switch to **Dagbanli** (disclaimer appears).  
2. **Clients** list: search label, empty state, register button.  
3. **Register client**: category pregnant/newborn, identity/age headings, consent labels.  
4. **Client profile**: title, start visit, caregiver label.  
5. **Nutrition**: history title, measurements (Timsim, Waɣilim, Buɣisibu), adequate filter, view guidance.
