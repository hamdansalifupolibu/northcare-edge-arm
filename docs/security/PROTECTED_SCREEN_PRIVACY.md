# Protected Screen Privacy

**Stage:** 7  

## Client screens

Client list, registration, profile, edit, history, and archive routes live under `app/(worker)/` and inherit worker authentication guards.

| State | Behaviour |
|---|---|
| Signed out | Redirect to worker login |
| Locked | Redirect to unlock |
| Administrator | Denied worker client routes |
| Authenticated worker | Allowed |

## Display rules

- Routes use client UUIDs, never names or phones in the path.
- List items omit phone and medical details by default.
- Privacy-safe avatar uses initials only.
- Duplicate review minimises identifiers (initials + local code + reasons).
- History shows sanitised audit events only.

## Logging

Do not log client names, phone numbers, search text, or health details. Logger redaction patterns cover phone/health/caregiver keys.

## Lock / recents

When the session locks, protected worker layouts redirect away from client content. Screenshot / recents hardening remains platform-dependent and should be re-validated on device.
