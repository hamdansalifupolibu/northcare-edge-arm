# Device runbook — S20 Ultra session (Phase 3+)

**Status:** Ready to execute when the phone is connected  
**Do not invent numbers before this session**

This is the only gate that still requires hardware. Edge Lab UI, preflight, harness, experiments, and docs are already in place.

## Before you connect

- [ ] Development build of `com.northcareai.app` installed  
- [ ] Whisper `ggml-tiny.en.bin` provisioned on device (promoted production model; base.en still useful for baseline A/B)  
- [ ] Qwen `qwen2.5-0.5b-instruct-q4_k_m.gguf` provisioned on device  
- [ ] Synthetic English M4A ready (no PHI)  
- [ ] USB debugging authorised (`SM-G988B`) optional if using on-device import  
- [ ] Phone cooled; battery mid/high; airplane mode for offline evidence  

## Fast path (recommended)

1. Launch app (diagnostics / non-production).  
2. Open **More → Edge Lab** (or `/(development)/edge-lab`).  
3. Tap **Refresh preflight** — fix any ✕ blocking items.  
4. Tap **Import synthetic fixture (M4A)** and pick your synthetic recording  
   (saved as `edge-lab-fixture-v1.m4a` under app documents).  
5. Preflight fixture row should turn ✓.  
6. Tap **Run benchmark** — watch the running banner for stage progress.  
7. On success, tap **Pin last successful run as baseline**.  
8. Open **Compare / Timeline / Export** — share JSON into `benchmarks/raw/` on the host.  
9. Capture logcat: filter `EDGE_LAB_EVIDENCE`.  
10. Choose **one** experiment from the catalog that targets the measured bottleneck.

## Optional adb fixture push

```text
adb shell mkdir -p /data/data/com.northcareai.app/files/edge-lab-fixtures
adb push edge-lab-fixture-v1.m4a /data/local/tmp/edge-lab-fixture-v1.m4a
adb shell run-as com.northcareai.app cp /data/local/tmp/edge-lab-fixture-v1.m4a files/edge-lab-fixtures/edge-lab-fixture-v1.m4a
```

## Optional auto-run trigger

```text
adb shell run-as com.northcareai.app touch files/edge-lab-auto-run.trigger
adb logcat -s ReactNativeJS:V | findstr EDGE_LAB_EVIDENCE
```

## Quality measurement (same session or immediate follow-up)

Fill `benchmarks/fixtures/edge-lab-fixture-v1.expected.json` goldens.  
Score baseline and candidates on the same fixture.  
Feed scores into the quality gate (0–100). No acceptance without quality.

## After baseline exists

| Next | Rule |
|---|---|
| Phase 4 | Primary bottleneck from Overview bars / export |
| Phase 5 | Change **one** lab variable |
| Phase 6–7 | Re-measure + quality gate accept/reject |
| Phase 8 | Next bottleneck if time remains |

## Out of scope for the first device plug-in

- Public GitHub push  
- Production Voice-to-Care config promotion  
- Live telecom / real patient audio  
