# NorthCare Reach — Synthetic Demo Reset

**Last updated:** 2026-08-03  
**Stage:** R6  

## Purpose

Clear synthetic Reach demonstration community requests so a judge walkthrough can be repeated safely.

## Command

```powershell
cd services\api
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "src"
python -m northcare_api.cli.reset_reach_demo
```

Non-interactive:

```powershell
python -m northcare_api.cli.reset_reach_demo --yes
```

## Behaviour

- Runs only when `NORTHCARE_ENV=development`  
- Refuses `staging` and `production`  
- Requires interactive `YES` unless `--yes`  
- Deletes only `community_requests` rows for the demo organisation/facility with channel `ussdSimulator`  
- Preserves accounts, roles, professional profiles, clinical sync records, and unrelated audit data  
- Prints safe counts only — never contact numbers or status PINs  

## What is not provided

- No public HTTP reset endpoint  
- No password reset  
- No deletion of the development dual-role account  

## Companion seed (optional)

```powershell
python -m northcare_api.cli.seed_reach_demo --yes --reset
```

Seed creates a small synthetic set (child health, pregnancy/newborn, nutrition, emergency, handled, unassigned). Raw PINs are never stored in source. Use `--show-pins` only for a one-time operator console display.

## Alternative

If preferred, skip seed and create all demonstration requests live through `/reach-simulator`.
