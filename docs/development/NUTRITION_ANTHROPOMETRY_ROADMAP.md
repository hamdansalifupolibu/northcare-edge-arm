# Nutrition anthropometry — clinical scope roadmap

**Updated:** 2026-08-08  
**Source:** Medical student colleague review (community / paediatric nutrition)  
**Status:** Phase 0–2 implemented (MUAC + oedema + WHO z-scores) · Phase 3 polish planned  
**Product rule:** Deterministic WHO/GHS rules only — no AI classification. All new indicators require unit tests + clinical review before pilot.

---

## What the colleague described (summary)

| Indicator | Purpose | Classification rule (typical) |
|-----------|---------|----------------------------|
| **Weight, age** | Basic anthropometry | Required inputs |
| **Length** (<2 years, recumbent) vs **Height** (≥2 years, standing) | Correct measurement method | Age determines which to use |
| **MUAC** (6–59 months) | Acute malnutrition (community) | &lt;11.5 SAM · 11.5–&lt;12.5 MAM · ≥12.5 not acute |
| **Bilateral pitting oedema** | SAM sign | SAM **regardless of MUAC** |
| **Weight-for-age (WFA)** | Underweight | Z-score &lt; −2 SD |
| **Length/height-for-age (L/HFA)** | Stunting | Z-score &lt; −2 SD |
| **Weight-for-length/height (WFL/H)** | Wasting | Z-score &lt; −2 SD |
| **BMI-for-age** | Body size vs age/sex | Z-score thresholds (age-dependent) |

---

## What NorthCare implements today (Phase 0) ✅

| Colleague item | In app? | Where |
|----------------|---------|--------|
| Weight | ✅ | `weight_kg` measurement |
| Age | ✅ | Client DOB / approximate age + `child_age_months` question |
| Height or length | ⚠️ Partial | Single optional `height_cm` field; help text says length &lt;24 mo, height ≥24 mo — **not split by age in UI** |
| MUAC 6–59 mo thresholds | ✅ | Reference rules match colleague thresholds |
| Bilateral pitting oedema → SAM | ✅ | Highest-priority rule before MUAC |
| WFA / L-HFA / WFL/H / BMI Z-scores | ❌ | Documented limitation — no WHO lookup tables in engine |
| Multiple simultaneous classifications | ❌ | Engine returns **one** acute classification (SAM/MAM/adequate) from MUAC+oedema |
| Visible wasting (clinical sign) | ✅ | Optional yes/no question — **not wired to Z-score rules** |

**Files:**  
`apps/mobile/src/features/nutrition/content/assessments/syntheticDevChildNutritionTemplate.ts`  
`apps/mobile/src/features/nutrition/content/references/syntheticDevNutritionReferencePack.ts`

This matches **WHO community CMAM screening** (MUAC + oedema) — the standard approach for **frontline community health workers** when full growth charts are not practical.

---

## Gap analysis — why Z-scores are not trivial

Z-score indicators (WFA, L/HFA, WFL/H, BMI-for-age) require:

1. **WHO Child Growth Standards** (or GHS-adopted tables) — sex-specific, age-specific lookup or LMS parameters  
2. **Engine extension** — today `referenceEvaluator` supports thresholds and yes/no only, not Z-score computation  
3. **Multiple results on summary screen** — acute (MUAC/oedema/WFH) vs chronic (stunting/underweight) may all apply  
4. **Clinical review** — new interpretation codes and guidance packs must be approved, not invented  

Estimated effort:

| Phase | Scope | Effort | Hackathon-critical? |
|-------|--------|--------|------------------------|
| **1 — UX & copy** | Age-based length vs height labels; 6–59 MUAC eligibility hint; colleague wording in help text | Small (1–2 h) | **Yes** — improves demo credibility |
| **2 — WFL/H wasting** | WHO WFH/WFL Z-score table + one new rule path | Medium (1–2 days) | Optional — facility-level supplement |
| **3 — Full growth chart** | WFA, L/HFA, BMI-for-age + multi-indicator summary UI | Large (1–2 weeks) | Post-hackathon / pilot |

---

## Recommended phased plan

### Phase 1 — Quick wins (before demo) 🎯

**Goal:** Reflect colleague advice in UX without new clinical engine.

- [ ] If age &lt; 24 months → label field **“Recumbent length (cm)”**; if ≥ 24 months → **“Standing height (cm)”**  
- [ ] Show banner when child outside **6–59 months**: “MUAC thresholds apply to children 6–59 months only”  
- [ ] Pull age from client profile when available; pre-fill `child_age_months`  
- [ ] Summary screen: list **measurements captured** separately from **acute classification** (SAM/MAM/adequate)  
- [ ] Add “Indicators not calculated” note: WFA, stunting, wasting Z-scores — planned Phase 2/3  
- [ ] Optional: ask colleague to review help text strings (no new rules)

**Does not change classification logic** — still MUAC + oedema.

### Phase 2 — Weight-for-length/height (wasting Z-score)

**Goal:** Add WFL/H when weight + length/height + sex + age available.

- [ ] Bundle approved WHO WFL/H lookup data (offline JSON, versioned)  
- [ ] Extend `referenceEvaluator` with `zScoreBelow` condition type  
- [ ] New interpretation codes: `wastingModerate`, `wastingSevere` (per WHO −2 / −3 SD — **verify with GHS**)  
- [ ] Rule priority: oedema → MUAC SAM → WFH SAM → MUAC MAM → WFH MAM → …  
- [ ] Unit tests with published WHO worked examples  
- [ ] Guidance pack updates (referral vs counselling)

### Phase 3 — Full anthropometric panel

**Goal:** Align with facility-style assessment.

- [ ] WFA (underweight), L/HFA (stunting), BMI-for-age  
- [ ] Summary UI: **Acute malnutrition** card + **Growth status** card (stunting/underweight/wasting)  
- [ ] Age rules: which indicators apply per age band  
- [ ] GHS clinical review checkpoint before `APPROVED_FOR_PILOT`

---

## Hackathon presentation — honest framing

**What we show now:**

> “Community screening using WHO MUAC and bilateral oedema — the method CHWs use in the field when growth charts aren’t available.”

**What we say is planned:**

> “Weight-for-age, height-for-age, and weight-for-height Z-scores are on the roadmap with bundled WHO tables — our medical adviser confirmed the measurement protocol; the engine supports Phase 2/3 expansion.”

**Do not claim** full growth-chart classification until Phase 2/3 is implemented and reviewed.

---

## Related docs

- [`DAGBANLI_INTEGRATION.md`](DAGBANLI_INTEGRATION.md) — offline Dagbanli UI; WAXAL speech deferred  
- [`../safety/NUTRITION_CONTENT_GOVERNANCE.md`](../safety/NUTRITION_CONTENT_GOVERNANCE.md) — approval workflow  
- Root [`README.md`](../../README.md) — demo flow and planned work
