# Risk Assessment Versioning

## Engine version

`RISK_ENGINE_VERSION` is persisted on every assessment. Bump when condition, aggregation, unit-conversion, missing-input, or explanation-construction semantics change.

## Rule pack version

Persisted as `rulePackId` + `rulePackVersion` (and legacy `rule_set_version` string `packId@version`). Historical assessments keep their original pack/template versions.

## Supersession

Recalculation creates a **new** assessment with `supersedesRiskAssessmentId`. Previous rows remain with `is_current = 0` and status `superseded`. Current operational priority is the `is_current = 1` row only.
