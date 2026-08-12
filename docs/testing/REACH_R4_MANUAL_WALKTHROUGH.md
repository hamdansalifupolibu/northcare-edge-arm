# Reach R4 — Manual Walkthrough

**Last updated:** 2026-08-03  
**Device target:** Android (Expo Go or development build)

## Flow A — Happy path

1. Enable Reach demo gate; start API + Postgres  
2. Submit synthetic request via R3 simulator  
3. Launch NorthCare AI; sign in with development dual-role account  
4. Enter Worker workspace  
5. Open Community Requests  
6. Confirm list loads (no mock data; no contact numbers on cards)  
7. Open detail; confirm contact + consent visible; no PIN  
8. Acknowledge → contact attempt → mark handled  
9. Switch filter to Handled; confirm request appears  
10. Check public status in simulator (generic label only)

## Flow B — Workspace denial

1. From Worker home, switch to Administration  
2. Confirm Community Requests routes redirect away  
3. Return to Worker workspace; feature available again

## Flow C — Offline

1. Disable network  
2. Open or refresh Community Requests  
3. Confirm connectivity-required messaging  
4. Confirm mutations are not offered as “saved locally”

## Flow D — Concurrent acknowledgement (optional)

1. Two eligible workers; one acknowledges first  
2. Second sees “no longer available” / conflict messaging after refresh

## Android blocker note

If `expo run:android` remains blocked by Windows path length / `ANDROID_HOME`, record the exact blocker and rely on automated + API evidence. Physical-device validation stays pending.
