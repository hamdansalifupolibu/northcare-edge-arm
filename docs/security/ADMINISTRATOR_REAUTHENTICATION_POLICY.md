# Administrator reauthentication policy

## Purpose

Sensitive administration mutations require sufficiently fresh remote authorisation. The local PIN unlocks the device session; it does not prove current server roles.

## Fresh token window

| Setting | Value |
|---|---|
| Maximum acceptable access-token age for sensitive admin writes | 15 minutes (`iat` claim) |
| Local unlock required | Yes — session must be unlocked |
| Clinical sync queue used for admin writes | No |

## Sensitive operations

- Register worker
- Change facility
- Deactivate / reactivate account
- Initiate access reset
- Revoke device

## Behaviour

| Condition | Result |
|---|---|
| Token missing / invalid | `administratorAuthenticationRequired` |
| Token older than fresh window | `administratorReauthenticationRequired` |
| Admin role absent / revoked | `administratorRoleRequired` / forbidden |
| Account inactive | Access denied |
| Device revoked | Protected backend requests rejected when the device next contacts the API |
| Offline | `Administration requires a secure connection` — no local admin mutation queue |

## After backgrounding / account switch / role revocation

- Re-validate session roles when connectivity is available before sensitive actions.
- Clear remote tokens after current-device revocation acknowledgement.
- Do not rely on cached mobile roles as authoritative after server changes.
