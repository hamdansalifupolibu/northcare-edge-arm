# Security Policy

**Last reviewed:** 2026-08-02  
**Status:** Active draft — replace contact placeholder before public release.

## Reporting a vulnerability

Do **not** file sensitive security details in public GitHub issues.

Please report privately to the project maintainers using the contact channel designated by the project owner:

> **Contact placeholder:** `[SECURITY_CONTACT_TO_BE_ADDED_BEFORE_PUBLIC_RELEASE]`

Include:

- Description of the issue  
- Impact assessment  
- Reproduction steps (without real patient data)  
- Suggested remediation if known  

We aim to acknowledge responsible reports promptly.

## Credentials and secrets

- Never commit `.env`, API keys, tokens, or Firebase/Google service-account JSON.  
- Rotate any key that may have been exposed.  
- `EXPO_PUBLIC_*` values are client-bundled — never put private secrets there.  
- See `docs/development/ENVIRONMENT_AND_SECRETS.md`.

## Client / patient data

- No real patient data in development, fixtures, screenshots, or commits.  
- Use synthetic data only.  
- Do not log symptoms, screening answers, names, audio, or full QR payloads.  
- Do not expose health information before authentication.  
- Lock-screen notifications must remain privacy-safe.

## Application security expectations (future implementation)

- Secure storage for credentials / PIN verifiers  
- Role-based access controls  
- Server-side authentication verification for sync/admin APIs  
- Minimised production logging  
- Dependency updates and vulnerability scanning as the stack lands  
- Careful handling of audio recordings and QR Referral Passport payloads  
- Lost-device considerations: local PIN, session timeout, remote revoke when backend exists  

## Responsible disclosure

Please allow reasonable time for remediation before public disclosure. Do not exploit vulnerabilities beyond what is needed to demonstrate the issue.
