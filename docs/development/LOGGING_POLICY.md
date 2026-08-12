# Logging Policy

**Purpose:** Privacy-safe logging rules for future mobile and API code.  
**Status:** Active  
**Last reviewed:** 2026-08-02  

## Never log

- Client names  
- Health symptoms  
- Screening answers  
- Referral clinical details  
- Caregiver names  
- Audio content or transcripts of clinical speech  
- Authentication tokens  
- Passwords / PINs  
- Service credentials  
- Full QR payloads  

## May log (minimised)

- Anonymous event / correlation identifiers  
- Operation status (success / fail / retry)  
- Error **category** (not clinical payload)  
- Non-sensitive timing  
- Sanitised sync attempt status  
- Application version  
- Environment name (`development` / `staging` / `production`)  

## Environments

- Production logs must be minimal.  
- Development logs must also use synthetic data only.  
- Prefer structured logs with redaction helpers once implementation begins.
