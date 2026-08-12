# NorthCare Edge — media pack (judges)

**Video (OneDrive, anyone with the link can view):**  
https://1drv.ms/v/c/a6e600124ed58265/IQBUCYZsUx9NRqeHDfu7wqReAX8g8ULShqJiiKOHG-2q_Kc  

**Note for viewers:** When a live benchmark is running, please be patient — Whisper + Qwen on-device can take ~20–55 seconds depending on model and device temperature. The UI shows stage progress; results appear when the run completes.

Curated stills live in `benchmarks/reports/` (copied from your `NorthCare Edge screenshots/` + product showcase).

---

## REJECTED experiments — is that normal?

**Yes — and it is a strength.**

Judges should see:

| Verdict | Meaning |
|---|---|
| **REJECTED** | We tried a change (e.g. more threads). It failed the ≥5% speed gate or made things worse. We kept the old setting. |
| **SHIPPED** | Smaller Whisper (`tiny.en`) passed latency + fixture quality and is live in Voice-to-Care. |

“3 rejected · 1 promoted” proves discipline: we did **not** ship vanity tweaks.

**Ignore for the homepage:** on Compare, if **Live gate: rejected** appears with **0.0%** improvement, that usually means the pinned baseline and last run are the **same run** (or no real candidate delta). That is **not** an experiment rejection. Prefer the **Published Before → After** block for judges.

---

## Gallery — what to show (priority order)

### Tier A — put in README + Devpost (must)

| File | Why |
|---|---|
| `edge-lab/01-results-live-optimized.jpg` | Best hero: published −53.8% **and** live ~27s run (dynamic proof) |
| `edge-lab/04-compare-published-before-after.jpg` | Clean Before→After + quality 100→100 (crop/blur the red “Live gate: rejected” if it confuses) |
| `edge-lab/06-experiments-rejected-honest.jpg` | Honesty / scientific method |
| `edge-lab/07-experiments-shipped.jpg` | Winner experiment (if page 2 shows EXP-06) |
| `product/11-voice-to-care-confirm.jpg` | Real product: worker confirms AI — offline Voice-to-Care |
| `product/12-offline-referral-qr.jpg` | **Hammer:** signed offline QR passport — works without cloud |
| `product/13-ask-northcare-on-device.jpg` | Chat with visible **On-device** badge |

### Tier B — support (README gallery or appendix)

| File | Why |
|---|---|
| `edge-lab/02-results-after-rerun-pinned.jpg` | Shows UI updates after another run (dynamic) — note live bars can vary with heat/model |
| `edge-lab/08-story-phases.jpg` | Freeze→measure→promote story |
| `product/14-onboarding-offline-qr.jpg` | Offline QR story in onboarding |
| `product/15-worker-home.jpg` | App is a full field tool, not only a bench |

### Tier C — optional / skip on homepage

| File | Why skip or demote |
|---|---|
| `edge-lab/10-export.jpg` | Useful but low wow |
| Compare “Live gate: rejected” emphasis | Confusing next to published SHIPPED win |
| Extra Results page 2 / Story page 2 | Redundant if Tier A is tight |

---

## How to display (README layout)

```text
1. Hero line: One Arm phone. Two local models. Zero cloud inference.
2. Story (3–4 sentences): Northern Ghana · offline care · Voice-to-Care + QR
3. Results table (−53.8% / −50.9% / −47.5% / quality 100)
4. Image row: Results live | Compare published | Experiments honest
5. Product wow row: Voice-to-Care confirm | Offline QR | Ask NorthCare (On-device)
6. Video embed/link + patience note
7. Reproduce + licence
```

**Offline hammer (repeat once, clearly):**

> Speech, extraction, Ask NorthCare, and referral QR verification are designed to run **on the Arm device**. Clinical work does **not** wait on the cloud.

---

## Suggested public GitHub repo name

**Primary (recommended):** `northcare-edge`

Alternates if taken:

- `northcare-edge-arm`
- `NorthCare-Edge`

Use a clean name without “AI Edge” / “UNICEF” / “hackathon” in the repo slug.

---

## PAT note (security)

When you create the repo and a classic PAT:

- Prefer **fine-scoped** `repo` access, expire it after push  
- **Do not paste the PAT into the chat** if you can avoid it — use Git Credential Manager / `gh auth login` / env var locally  
- If you must share for agent push, revoke the token immediately after

Next after you create `northcare-edge`: tell me the GitHub URL (owner/name) and licence choice (MIT or Apache-2.0). Then we rewrite README + push the curated pack.
