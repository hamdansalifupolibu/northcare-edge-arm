# Stage 18 — Text Scaling Validation

**Updated:** 2026-08-02

## Policy

- `AppText` defaults `allowFontScaling={true}`
- No global font-scaling disable introduced in Stage 18
- Touch targets remain `layout.minTouchTarget` (48dp)

## Evidence

- Automated: `stage18AccessibilityComponents` asserts `allowFontScaling` default true
- Manual: large-text sampling **partial** on emulator — not every screen photographed at 200%

## Residual

- Dense Administration lists may clip at extreme scales — document during Stage 19 device pass
- Do not fix by disabling font scaling
