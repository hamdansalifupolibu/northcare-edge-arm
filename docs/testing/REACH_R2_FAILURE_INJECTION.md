# Reach R2 Failure Injection

Injected failures verified in `tests/integration/test_reach_failure_injection.py`:

| Injection | Expected |
|---|---|
| Demo facility resolution failure | No request row; safe error |
| Reference collision on first generate | Retry; unique reference allocated |
| Audit persistence failure during create | Transaction rolled back; no orphan request |

Additional lifecycle coverage asserts concurrent claim rejection and optimistic version conflicts without false success after rollback.
