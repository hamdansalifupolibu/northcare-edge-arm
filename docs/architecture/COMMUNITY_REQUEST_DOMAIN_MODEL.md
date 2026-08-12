# Community Request — Domain Model (R0 Freeze)

**Status:** Frozen by Reach Stage R0; **implemented in R2**  
**Last updated:** 2026-08-03  
**Machine-readable:** `implementation/community-request-schema-draft.json`, `implementation/community-request-statuses.json`

## Entity: CommunityRequest

| Field | Notes |
|---|---|
| `id` | Stable identifier |
| `referenceCode` | Public lookup key; human-readable; not derived from phone, client ID, or DOB; not sequential where enumeration is easy |
| `statusPinHash` | Secure hash/verifier of six-digit PIN; never store plaintext PIN |
| `channel` | MVP: `ussdSimulator` only |
| `category` | Controlled enum (see below) |
| `requestType` | Controlled pathway enum (not clinical severity) |
| `contactNumber` | Callback number; synthetic in demos |
| `communityOrLandmark` | Free text landmark / community / town |
| `preferredLanguage` | MVP interface English; may record preference for assistance |
| `consentToContact` | Required for request creation paths that contact the user |
| `consentToShareLocation` | Required when sharing community/landmark for urgent review |
| `facilityId` | Demo facility `fac-dev-001` |
| `assignedWorkerId` | Nullable until assigned |
| `status` | Controlled status enum |
| `createdAt` | Timestamp |
| `updatedAt` | Timestamp |
| `version` | Concurrency / optimistic version |

## Categories (frozen)

`pregnancyNewborn` · `childHealth` · `nutrition` · `generalChps` · `referralFollowUp` · `emergency`

Reject arbitrary strings.

## Request types (frozen)

`routine` · `urgentContact` · `emergencyAssistance`

These describe the requested pathway. They are **not** medical diagnoses or clinical severity classifications. Do not use mild / moderate / severe / critical as public or automated medical classifications.

## Statuses (frozen)

`received` · `assigned` · `acknowledged` · `contactAttempted` · `escalated` · `handled` · `cancelled`

**Do not add:** `ambulanceDispatched`, `clinicallyVerified`, `diagnosed`, `treatmentStarted`, `careCompleted`.

## Valid transitions (conceptual)

Primary path:

```text
received → assigned → acknowledged → contactAttempted → handled
```

Alternative:

```text
acknowledged → escalated → contactAttempted → handled
```

Cancellation may occur from: `received`, `assigned`, `acknowledged`.  

Terminal for MVP: `handled`, `cancelled`.  

`handled` does **not** mean clinical care was completed.

## Explicitly excluded from the model

Detailed symptoms · diagnosis · medication · national ID · date of birth · full residential address · clinical assessment · risk score · audio · transcript · GPS coordinates · telecom metadata · device fingerprint.

## Public lookup

Requires **both** `referenceCode` and status PIN. PIN shown once at creation; never logged; never included in worker API responses; never returned after initial creation. Stronger verification may be required before real telecom deployment.

## Client linkage

A USSD / Reach request must **not** automatically create or link a NorthCare client. R4 provides optional **Start client lookup** navigation only — no auto-create or auto-link.
