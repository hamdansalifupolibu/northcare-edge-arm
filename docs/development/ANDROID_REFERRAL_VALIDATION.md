# Android Referral Validation

**Stage:** 10  
**Date:** 2026-08-02

## Device status

```
adb devices
emulator-5554   offline
```

## Result

Android emulator was **offline**. No on-device walkthrough was executed for Stage 10.

## Pending physical / emulator checks

- Camera permission grant / deny / permanent deny for QR scan
- Physical QR render + scan round-trip on one device
- Deep link `northcare://referral-passport/v1/{token}` after auth
- Safe-area / 48dp targets on referral screens

Do **not** treat Stage 10 as Android UI-approved until these are completed.
