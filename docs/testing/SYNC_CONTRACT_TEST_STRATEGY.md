# Sync Contract Test Strategy

## Sources of truth

- `implementation/sync-protocol-v1.json`
- `implementation/sync-entity-registry.json`
- `implementation/sync-error-catalogue.json`
- `implementation/openapi.json` (regenerated from FastAPI)

## Pytest

`tests/contract/test_protocol_contract.py` asserts:

- protocolVersion = 1 across artefacts
- push/pull endpoints and operation vocabulary
- critical error codes + retryable flags
- entity conflict classes present
- OpenAPI contains health + sync paths
- mutating `protocolVersion` fails the drift assertion

## Command

```powershell
cd services/api
.\.venv\Scripts\python.exe -m pytest tests/contract -ra
```

## Regeneration

```powershell
cd services/api
$env:PYTHONPATH="src"
.\.venv\Scripts\python.exe -c "import json; from pathlib import Path; from northcare_api.main import app; Path('../../implementation/openapi.json').resolve().write_text(json.dumps(app.openapi(), indent=2, sort_keys=True)+chr(10), encoding='utf-8')"
```

OpenAPI may list `/v1/development/auth/token`; production runtime returns **404** when `NORTHCARE_ENV` is not `development`/`test`.
