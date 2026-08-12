# Administration provisioning saga

Worker registration spans PostgreSQL and an identity provider that cannot share one ACID transaction.

## Happy path

1. Validate administrator (role, org, fresh token)  
2. Validate facility in organisation  
3. Normalise email; enforce uniqueness  
4. Create account `pendingProvisioning`  
5. Call `IdentityProvisioningProvider.createWorkerIdentity`  
6. Assign `worker` role; set facility  
7. Mark `pendingFirstLogin` + `first_login_required`  
8. Persist idempotency key + sanitised audit events  
9. Return safe registration result  

## Compensation

| Failure | Action |
|---|---|
| Provider fails after pending account | Mark `provisioningFailed`; audit `identityProvisioningFailed`; do not activate |
| Duplicate email | Reject; do not create second identity |
| Idempotent retry (same key + same body) | Return original safe result |
| Idempotent key reused with different body | `idempotencyKeyConflict` |
| DB fails after provider success | Do not claim success; keep identity reference for reconciliation |

Passwords and verifiers never appear in API responses, audit metadata, or logs.
