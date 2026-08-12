# Rate Limiting and Abuse Boundary (Stage 18)

**Updated:** 2026-08-02  
**Status:** **Boundary documented — not production rate-limited**

## Current state

- No dedicated rate-limit middleware or gateway is implemented in `services/api`.
- Abuse resistance today relies on:
  - Authentication required for sensitive routes
  - Development auth disabled outside development/test
  - Parameterised SQL
  - Payload validation via Pydantic
  - Cursor signing (does not grant authorisation by itself)

## Explicit non-claims

- Not claiming DDoS protection
- Not claiming OWASP automated-abuse certification
- Local demo/API is trusted-network oriented

## Required before production pilot

- Edge or application rate limits on auth and admin mutation routes
- Alerting on repeated auth failures
- Optional CAPTCHA / lockout policy for public surfaces (none today; public registration absent)
