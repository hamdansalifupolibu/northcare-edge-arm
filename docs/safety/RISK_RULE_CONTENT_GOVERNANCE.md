# Risk Rule Content Governance

Rule packs are clinical content. Status gates:

| Status | New evaluation |
|---|---|
| DRAFT | Never |
| CLINICAL_REVIEW_REQUIRED | Never |
| APPROVED_FOR_DEVELOPMENT | Development/staging only |
| APPROVED_FOR_PILOT | Production allowed |
| RETIRED | Not for new evaluation |

Do not invent reviewers, review dates, source sections, or approvals. Use `null` until real review exists.

Inventory: `implementation/risk-rule-pack-inventory.json`  
Sources: `implementation/clinical-source-registry.json`
