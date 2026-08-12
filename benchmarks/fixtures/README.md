# Edge Lab synthetic fixtures

Synthetic audio only. Never place real patient recordings here or on the device documents path used by Edge Lab.

## Canonical fixture

| Field | Value |
|---|---|
| Fixture id | `edge-lab-fixture-v1` |
| Filename | `edge-lab-fixture-v1.m4a` |
| On-device path (preferred) | app documents `/edge-lab-fixtures/edge-lab-fixture-v1.m4a` |
| On-device path (alternate) | app documents `/edge-lab-fixture-v1.m4a` |

The harness looks for those locations only. It does **not** read `voice-captures/`.

## Preparing a fixture (Phase 3 on S20 Ultra)

### Preferred: in-app import

1. Record or copy a short **synthetic** English field-note style M4A (no real names / PHI).
2. On device: **More → Edge Lab → Import synthetic fixture (M4A)**.
3. Refresh preflight — fixture row should be ✓.

### Alternate: adb push

1. Record or copy a short **synthetic** English field-note style M4A (no real names / PHI).
2. Rename to `edge-lab-fixture-v1.m4a`.
3. Push into the app sandbox, for example:

```text
adb shell mkdir -p /data/data/com.northcareai.app/files/edge-lab-fixtures
adb push edge-lab-fixture-v1.m4a /data/local/tmp/edge-lab-fixture-v1.m4a
adb shell run-as com.northcareai.app cp /data/local/tmp/edge-lab-fixture-v1.m4a files/edge-lab-fixtures/edge-lab-fixture-v1.m4a
```

(Exact `run-as` paths may vary; use the app’s documents directory.)

Optional host starting point in this workspace (informal, not yet canonicalized):

- `audio recording to test the whisper.m4a` at repo root

Copy/rename before treating it as `edge-lab-fixture-v1`.

## Auto-run trigger (optional)

```text
adb shell run-as com.northcareai.app touch files/edge-lab-auto-run.trigger
```

Then launch the app (non-production). Capture:

```text
adb logcat -s ReactNativeJS:V | findstr EDGE_LAB_EVIDENCE
```
