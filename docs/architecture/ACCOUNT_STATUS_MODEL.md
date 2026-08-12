# Account status model

Controlled statuses:

| Status | Meaning |
|---|---|
| `pendingProvisioning` | Account reserved; identity not yet provisioned |
| `pendingFirstLogin` | Identity provisioned; password change required |
| `active` | Normal authenticated use permitted (subject to roles) |
| `inactive` | Remote authentication and admin/sync access denied |
| `provisioningFailed` | Identity provisioning failed; retry via explicit workflow |

## Ordinary transitions

- `pendingProvisioning` → `pendingFirstLogin`
- `pendingFirstLogin` → `active` (after password change)
- `active` → `inactive` (deactivate)
- `inactive` → `active` (reactivate with valid facility)
- `provisioningFailed` → `pendingProvisioning` (explicit retry)

## Forbidden ordinary transitions

- `inactive` → `pendingFirstLogin`
- `active` → `pendingProvisioning`

Account mutations use `account_version` optimistic concurrency. Stale versions return `accountVersionConflict`.
