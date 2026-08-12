# Reach R2 Test Strategy

## Scope

PostgreSQL-backed FastAPI tests under `services/api/tests/` covering:

- Request creation and validation  
- Reference / PIN generation and public status lookup  
- Deterministic routing matrix behaviour  
- Worker authorisation and lifecycle transitions  
- Migration `0005`  
- Security gate fail-closed behaviour  
- Failure injection / rollback  

## Commands

```bash
cd services/api
$env:PYTHONPATH="src"
$env:NORTHCARE_ENV="test"
.\.venv\Scripts\python.exe -m pytest -q
```

Enable Reach inside individual tests via `tests/helpers_reach.py` (`enable_reach_demo`). Default suite environment keeps the gate false.

## Privacy in tests

Do not print status PINs, password verifiers, access tokens, or contact numbers in assertions or logs. Assert formats and presence without dumping secrets.
