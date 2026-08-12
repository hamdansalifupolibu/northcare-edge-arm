# Stage 18 — Control Traceability

**Updated:** 2026-08-02

| Control theme | Threat IDs | Docs | Tests / evidence |
|---|---|---|---|
| Auth fail-closed | T02, T09 | AUTH docs, production config | createRemoteAuthProvider, developmentAuth, API gates |
| Authorisation matrix | T03, T04 | API_AUTHORISATION_MATRIX | authz + admin security tests |
| Secure storage | T01 | LOCAL_STORAGE_AUDIT | secureSession, pinVerifier |
| QR untrusted input | T05 | QR security architecture | qrPassportParser tests |
| Notification privacy | T06 | NOTIFICATION_PRIVACY | reminder privacy tests |
| Deep-link fail-closed | T07 | deepLinks.ts | routeAccess / stage18ProductionConfig |
| Logging redaction | T08 | LOGGING review | logger tests, RedactingFilter |
| Dependency hygiene | T10 | DEPENDENCY audit | inventories, npm audit |
| Accessibility semantics | — | docs/accessibility/* | stage18AccessibilityComponents |
| Error resilience | — | MOBILE_RESILIENCE_BOUNDARY | AppErrorBoundary, failure injection doc |

Inventories: `implementation/security-control-inventory.json`, `implementation/accessibility-control-inventory.json`.
