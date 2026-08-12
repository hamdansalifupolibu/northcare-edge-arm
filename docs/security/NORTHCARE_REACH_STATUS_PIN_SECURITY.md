# NorthCare Reach — Status PIN Security (R2)

## Design

- Six-digit numeric PIN, cryptographically random, leading zeroes preserved  
- Shown **once** in the public create response  
- Stored only as an **Argon2id** verifier (`status_pin_hash`)  
- Never returned to worker APIs, audits, or logs  

## Entropy honesty

A six-digit PIN has limited entropy. It depends on:

1. Development-only Reach gate (`NORTHCARE_REACH_DEMO_ENABLED`)  
2. Persistent failed-lookup counting and temporary lockout on the request row  
3. Generic public errors that do not reveal whether the reference or PIN was wrong  

This is suitable for a **hackathon demonstration**, not a production public telecom deployment.

## Separation

Status-PIN verification is separate from:

- Account password verification  
- Local worker PIN  
- Referral QR token verification  
