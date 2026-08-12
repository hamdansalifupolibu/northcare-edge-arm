#!/usr/bin/env python3
"""Seed SYNTHETIC DEVELOPMENT DATA only. Explicit command required."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from northcare_api.database import SessionLocal
from northcare_api.seed.synthetic_dev_data import seed_synthetic


async def main() -> None:
    async with SessionLocal() as session:
        await seed_synthetic(session)
    print("Seeded synthetic development facilities and accounts.")


if __name__ == "__main__":
    asyncio.run(main())
