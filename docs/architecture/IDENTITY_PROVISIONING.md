# Identity provisioning

## Provider boundary

`IdentityProvisioningProvider` isolates account identity operations from UI and admin orchestration.

| Implementation | Environments | Behaviour |
|---|---|---|
| `DevelopmentIdentityProvisioningProvider` | development, test | Argon2id verifiers in `development_credentials`; temporary passwords; first-login change |
| `FirebaseIdentityProvisioningProvider` | future production | Boundary only — inactive without Firebase Admin configuration |
| `UnavailableIdentityProvisioningProvider` | fail-closed default | Rejects provisioning and reset |

## Operations

- `createWorkerIdentity`
- `disableIdentity` / `enableIdentity`
- `initiatePasswordReset`
- `requirePasswordChange`
- `changePassword` (first-login / authenticated change)

## Production fail-closed

When no approved production provider is configured:

- Do not use the development credential store
- Do not generate fake temporary passwords
- Do not claim invitations were sent
- Show: “Worker identity provisioning is unavailable in this environment”

## Saga (worker registration)

1. Validate administrator + fresh token  
2. Validate organisation/facility (server-side)  
3. Normalise email; reject duplicates  
4. Create pending account  
5. Provision identity provider  
6. Assign worker role + facility  
7. Mark `pendingFirstLogin`  
8. Write sanitised audit events  
9. Return safe result (no password/verifier)

On provider failure: mark `provisioningFailed`, audit failure, do not activate. On DB completion failure after provider success: do not claim success; preserve reconciliation metadata (no password material).
