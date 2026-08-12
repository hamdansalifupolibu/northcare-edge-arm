# scripts

Utility scripts for repository maintenance (e.g. Stitch download/explore helpers at repo root or here).

## Reach R0

Validate Reach contract artifacts (stdlib only):

```bash
python scripts/validate_reach_r0_artifacts.py
```

## Rules

- Do not print secret values.  
- Prefer reading credentials from gitignored `.env`.  
- Do not use scripts to invent medical content or forge brand assets.
