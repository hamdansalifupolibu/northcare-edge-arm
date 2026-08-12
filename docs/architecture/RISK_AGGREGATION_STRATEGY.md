# Risk Aggregation Strategy

## Strategy ID

`highestApprovedPriorityWins` · version `1`

Declared by each rule pack (`aggregationStrategy` + `aggregationStrategyVersion`).

## Behaviour (v1)

1. Priority order: **red > amber > green**  
2. Completeness-policy **blocking** missing information → **undetermined** (never GREEN)  
3. Any rule `invalidInput` / `error` → **undetermined** (not coerced to `notMatched`)  
4. No matched rules → **undetermined** (GREEN is never the default)  
5. GREEN only when an explicit green rule matched **and** completeness policy allows it  
6. Matched factors retained and sorted by `order` then `ruleId`

Rule-local missing inputs (other rules’ required fields) are recorded for explainability but do not block a higher already-matched priority. Completeness-policy keys remain blocking.
