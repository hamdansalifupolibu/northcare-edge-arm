# Administrator clinical access boundary

## Rule

Holding the `admin` role does **not** grant clinical-record access. Clinical access requires the `worker` role **and** an active Worker workspace.

## Administration workspace must not

- Open Clients, Visits, screenings, measurements, priority factors
- Read referral reasons, nutrition answers, voice transcripts/recordings
- Read reminder notes or patient-specific records
- Call clinical record endpoints as an administrator shortcut

## Worker workspace must not

- Manage accounts, register workers, reset access, or revoke devices
- Open Administration account-management routes

## Dual-role development accounts

A development account may hold both roles. The operator must explicitly select a workspace. Deep links cannot bypass workspace guards. Switching workspace clears unsafe navigation history.

## Sync note

Server sync authorisation may still treat admin-bearing accounts as organisation-scoped for Stage 14 conflict/sync tooling. Mobile UI clinical browsing remains workspace-gated and must not surface patient charts from Administration.
