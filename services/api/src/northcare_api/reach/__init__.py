"""NorthCare Reach — community request backend, routing, USSD simulator, and AT adapter."""

from __future__ import annotations

from northcare_api.reach.routes_public import router as public_router
from northcare_api.reach.routes_simulator import router as simulator_router
from northcare_api.reach.routes_worker import router as worker_router
from northcare_api.reach.ussd_at.routes import router as at_ussd_router

__all__ = ["public_router", "simulator_router", "worker_router", "at_ussd_router"]
