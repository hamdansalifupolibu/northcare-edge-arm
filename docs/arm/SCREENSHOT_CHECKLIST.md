# Edge Lab screenshot checklist (judges)

Open **More → Edge Lab**. Capture in this order:

1. **Results** — published metric tiles (−53.8% / −50.9% / −48%) visible without scrolling past the fold if possible  
2. **Compare** — Published Before → After table  
3. **Experiments** — REJECTED chips + PROMOTED EXP-06  
4. **Story** — phase checklist with ✓  
5. Optional **Export** — evidence pack card  

Android: Power + Volume Down, or:

```text
adb shell screencap -p /sdcard/edge-results.png
adb pull /sdcard/edge-results.png benchmarks/reports/
```
