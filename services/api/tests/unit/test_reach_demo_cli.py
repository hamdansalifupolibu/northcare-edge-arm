"""Unit tests for Reach demo reset/seed CLI environment guards."""

from __future__ import annotations

import pytest

from northcare_api.cli import reset_reach_demo, seed_reach_demo
from northcare_api.cli.demo_env import refuse_non_development
from northcare_api.config import Settings


def test_refuse_staging_and_production() -> None:
    assert refuse_non_development(Settings(NORTHCARE_ENV="staging")) == 2
    assert refuse_non_development(Settings(NORTHCARE_ENV="production")) == 2
    assert refuse_non_development(Settings(NORTHCARE_ENV="test")) == 2
    assert refuse_non_development(Settings(NORTHCARE_ENV="development")) is None


@pytest.mark.asyncio
async def test_reset_refuses_non_development(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NORTHCARE_ENV", "staging")
    from northcare_api.config import get_settings

    get_settings.cache_clear()
    # Settings validator may raise before CLI; either refusal path is acceptable.
    try:
        code = await reset_reach_demo.reset_demo(yes=True)
        assert code == 2
    except ValueError:
        pass
    finally:
        monkeypatch.setenv("NORTHCARE_ENV", "test")
        get_settings.cache_clear()


@pytest.mark.asyncio
async def test_seed_refuses_when_reach_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NORTHCARE_ENV", "development")
    monkeypatch.setenv("NORTHCARE_REACH_DEMO_ENABLED", "false")
    from northcare_api.config import get_settings

    get_settings.cache_clear()
    code = await seed_reach_demo.seed_demo(yes=True, reset_first=False, show_pins=False)
    assert code == 2
    monkeypatch.setenv("NORTHCARE_ENV", "test")
    get_settings.cache_clear()
