# Stage 7 Stitch Alignment

**Stage:** 7  
**Stitch project:** `749026157623860355`  

## Method

Stitch screens were inspected as **UX reference only**. HTML was not converted to React Native. Implementation uses the Stage 3 design system + Expo Router.

## Covered journeys

| Journey | Alignment notes |
|---|---|
| Client directory / list | Search, category filters, empty/loading/error/no-results, list item with privacy avatar |
| Register client type | Category selection cards as primary actions |
| Registration steps | Multi-step flow with textual “Step X of Y” progress (not colour-only) |
| Consent | Explicit consent status step |
| Duplicate warning | “Similar client records were found” + reasons + continue confirmation |
| Client profile | Identity, category, age honesty, facility, caregiver, local sync wording |
| Archive confirmation | Explicit destructive confirm copy |
| Edit / history | Profile actions; history from sanitised audit only |

## Intentional differences

- No fake visits/screenings/referrals counters.
- Sync wording never claims cloud sync.
- Registration is a wizard screen with steps (not a 1:1 Stitch HTML port).
- Growth charts and clinical widgets remain out of scope.
