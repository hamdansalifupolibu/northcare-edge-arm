# Risk Input Contract

Immutable structured input built by `buildRiskEngineInput` — engines never receive SQLite handles or repositories.

## Included

- IDs: evaluation, client, encounter, screening  
- Context: client category, visit type, screening template id/version  
- Age: date-only DOB and/or approximate age with precision (`exact` | `approximate`)  
- Answers with provenance (no free-text clinical inference)  
- Measurements with original unit; conversion preserves original  
- Completion state + worker confirmation flag  

## Excluded

Password, PIN, tokens, full client name, phone, caregiver name, free-text notes (unless a future approved pack explicitly requires a controlled field).

## Provenance kinds

`screeningAnswer` · `measurement` · `clientCategory` · `dateOnlyField` · `visitContext` · `workerConfirmation` · `derivedAge` · `rulePackConfiguration`

Derived age records derivation type, source fields, and derivation version. Approximate age is never silently converted into a DOB.
