from __future__ import annotations

from fastapi import FastAPI

from northcare_api.administration.routes import auth_router
from northcare_api.administration.routes import router as admin_router
from northcare_api.logging import configure_logging
from northcare_api.reach import at_ussd_router as reach_at_ussd_router
from northcare_api.reach import public_router as reach_public_router
from northcare_api.reach import simulator_router as reach_simulator_router
from northcare_api.reach import worker_router as reach_worker_router
from northcare_api.routes import development_auth, devices, health, sync

configure_logging()

app = FastAPI(
    title="NorthCare AI Sync API",
    version="0.18.0",
    description=(
        "NorthCare AI sync, administration, Reach community-request API, "
        "USSD simulator, and Africa's Talking USSD sandbox adapter"
    ),
)

app.include_router(health.router)
app.include_router(development_auth.router)
app.include_router(devices.router)
app.include_router(sync.router)
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(reach_public_router)
app.include_router(reach_worker_router)
app.include_router(reach_simulator_router)
app.include_router(reach_at_ussd_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "northcare-api", "stage": "reach-t1"}
