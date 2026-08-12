# Risk Engine Test Strategy

| Suite | Focus |
|---|---|
| `rulePackValidation.test.ts` | Pack integrity, production gate, checksum |
| `conditionEvaluation.test.ts` | All supported operators + unit conversion |
| `missingInformation.test.ts` | Unknown≠No; no accidental GREEN |
| `aggregation.test.ts` | Precedence, determinism, stable order |
| `riskPersistence.test.ts` | Save, supersede, mandatory rollback |
| `riskSecurity.test.ts` | Auth gates, privacy logs, no override |
| `riskUi.test.tsx` | Labels/icons/states without colour-only meaning |

Performance timings from Jest are **non-device** only.
