# Account Provisioning Security (Reach R1)

**Last updated:** 2026-08-03  

## Controls preserved

- Server-authoritative roles  
- Ordinary registration worker-only  
- Argon2id verifiers; passwords never logged or returned  
- Fresh admin token for destructive / provisioning mutations  
- Organisation scope from authenticated actor (client org ignored)  
- Idempotent registration with conflict on key reuse  

## Reach R1 additions

- Profession values restricted to frozen registry  
- `otherProfessionDescription` only for `otherApprovedHealthProfessional`  
- Emergency enablement requires community enablement  
- Profile mutations require worker role on target account  
- Profile updates are online admin API calls — not clinical sync queue  
- Audit events record profession enum and capability booleans only  

## Forbidden in logs / audit / API responses

- Password / temporary password  
- Password verifier / hash  
- Access tokens  
- Unrelated clinical data  
- Future community-request payload details  

## Public surface

R1 does **not** expose public Reach endpoints. Profession and capability values must not appear in public USSD status or notifications.
