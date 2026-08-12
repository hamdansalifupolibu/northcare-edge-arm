# Risk Rule Model

Rules are typed TypeScript objects — not executable strings.

## Rule pack fields

`rulePackId`, `version`, `engineCompatibilityVersion`, `status`, applicable template IDs/versions, client categories, visit types, `aggregationStrategy`, `completenessPolicy`, `explanationVersion`, `sourceReferences`, `clinicalReview`, `rules[]`.

## Rule fields

`ruleId`, `title`, `priority` (red|amber|green), `order`, `enabled`, typed `condition`, `requiredInputs`, versioned `explanation`, `workerActionText`, `sourceReferences`, review dates.

## Statuses

`DRAFT` · `CLINICAL_REVIEW_REQUIRED` · `APPROVED_FOR_DEVELOPMENT` · `APPROVED_FOR_PILOT` · `RETIRED`

Ordinary evaluation never loads DRAFT / CLINICAL_REVIEW_REQUIRED. Production: `APPROVED_FOR_PILOT` only.

## Operators

Logical: `all`, `any`, `not`  
Equality: `equals`, `notEquals`, `in`, `notIn`  
Presence: `exists`, `isMissing`, `answerStateIs`  
Numeric: `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `between`, `outsideRange`  
Context: `clientCategoryIs`, `visitTypeIs`, `ageInRange`, `screeningTemplateIs`, `templateVersionIs`

Unsupported operators fail pack validation. Unknown / notAssessed / declined / unanswered are never coerced to No/false.
