"""Generate Stage 18 dependency inventories (names/versions only; no secrets)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    mobile_pkg = json.loads((ROOT / "apps/mobile/package.json").read_text(encoding="utf-8"))
    mobile = {
        "version": 1,
        "updated": str(date.today()),
        "stage": 18,
        "package_manager": "npm",
        "lockfile": "apps/mobile/package-lock.json",
        "runtime_dependencies": mobile_pkg.get("dependencies", {}),
        "dev_dependencies": mobile_pkg.get("devDependencies", {}),
        "notes": [
            "Prefer zero new runtime packages in Stage 18",
            "Expo SDK ~57; React and React Native not upgraded",
            "No analytics, session-recording, or root-detection SDKs",
        ],
    }
    (ROOT / "implementation/mobile-dependency-inventory.json").write_text(
        json.dumps(mobile, indent=2) + "\n",
        encoding="utf-8",
    )

    # Parse pyproject roughly
    pyproject = (ROOT / "services/api/pyproject.toml").read_text(encoding="utf-8")
    runtime: list[str] = []
    optional_dev: list[str] = []
    section = None
    for line in pyproject.splitlines():
        if line.strip().startswith("dependencies"):
            section = "runtime"
            continue
        if "optional-dependencies" in line or line.strip().startswith("[project.optional"):
            section = "optional"
            continue
        if line.startswith("[") and "project" not in line:
            section = None
            continue
        if section and line.strip().startswith('"'):
            dep = line.strip().strip(",").strip('"')
            if section == "runtime":
                runtime.append(dep)
            else:
                optional_dev.append(dep)

    api = {
        "version": 1,
        "updated": str(date.today()),
        "stage": 18,
        "package_manager": "pip",
        "project": "services/api/pyproject.toml",
        "runtime_dependencies": runtime,
        "dev_optional_dependencies": optional_dev,
        "notes": [
            "No new runtime packages added in Stage 18",
            "Docker Compose unavailable on this workstation; host Postgres used",
        ],
    }
    (ROOT / "implementation/api-dependency-inventory.json").write_text(
        json.dumps(api, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Wrote mobile and api dependency inventories")


if __name__ == "__main__":
    main()
