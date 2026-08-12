"""Development-only NorthCare Reach USSD simulator static routes."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response

from northcare_api.config import Settings, get_settings
from northcare_api.reach.errors import ReachError
from northcare_api.reach.service import require_reach_enabled

router = APIRouter(tags=["reach-simulator"])

_STATIC_DIR = Path(__file__).resolve().parents[3] / "static" / "reach-simulator"

_ALLOWED_FILES: dict[str, tuple[str, str]] = {
    "index.html": ("index.html", "text/html; charset=utf-8"),
    "reach.css": ("reach.css", "text/css; charset=utf-8"),
    "reach.js": ("reach.js", "application/javascript; charset=utf-8"),
}

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    "Content-Security-Policy": (
        "default-src 'none'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "base-uri 'none'; "
        "form-action 'none'; "
        "frame-ancestors 'none'"
    ),
}


def _require_simulator(settings: Settings = Depends(get_settings)) -> Settings:
    try:
        require_reach_enabled(settings)
    except ReachError as exc:
        raise HTTPException(status_code=exc.http_status, detail={"code": exc.code}) from exc
    return settings


def _file_response(name: str) -> FileResponse:
    meta = _ALLOWED_FILES.get(name)
    if meta is None:
        raise HTTPException(status_code=404, detail={"code": "notFound"})
    filename, media_type = meta
    static_root = _STATIC_DIR.resolve()
    path = (static_root / filename).resolve()
    try:
        path.relative_to(static_root)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail={"code": "notFound"}) from exc
    if not path.is_file():
        raise HTTPException(status_code=404, detail={"code": "notFound"})
    response = FileResponse(
        path=path,
        media_type=media_type,
        filename=None,
    )
    for key, value in _SECURITY_HEADERS.items():
        response.headers[key] = value
    return response


@router.get("/reach-simulator", include_in_schema=True)
@router.get("/reach-simulator/", include_in_schema=False)
async def reach_simulator_index(_: Settings = Depends(_require_simulator)) -> FileResponse:
    return _file_response("index.html")


@router.get("/reach-simulator/{asset_name}")
async def reach_simulator_asset(
    asset_name: str,
    _: Settings = Depends(_require_simulator),
) -> Response:
    if asset_name not in _ALLOWED_FILES:
        raise HTTPException(status_code=404, detail={"code": "notFound"})
    return _file_response(asset_name)
