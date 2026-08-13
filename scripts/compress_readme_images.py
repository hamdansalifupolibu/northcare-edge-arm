"""Compress README-linked JPEGs for more reliable GitHub rendering."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PATHS = [
    ROOT / "benchmarks/reports/edge-lab/01-results-live-optimized.jpg",
    ROOT / "benchmarks/reports/edge-lab/04-compare-published-before-after.jpg",
    ROOT / "benchmarks/reports/edge-lab/06-experiments-rejected-honest.jpg",
    ROOT / "benchmarks/reports/edge-lab/08-story-phases.jpg",
    ROOT / "benchmarks/reports/product/11-voice-to-care-confirm.jpg",
    ROOT / "benchmarks/reports/product/12-offline-referral-qr.jpg",
    ROOT / "benchmarks/reports/product/13-ask-northcare-on-device.jpg",
    ROOT / "benchmarks/reports/product/15-worker-home.jpg",
]
MAX_W = 900
QUALITY = 72


def main() -> None:
    total_before = 0
    total_after = 0
    for path in PATHS:
        if not path.exists():
            print(f"MISSING: {path}")
            continue
        before = path.stat().st_size
        total_before += before
        img = Image.open(path).convert("RGB")
        width, height = img.size
        if width > MAX_W:
            new_h = int(height * (MAX_W / width))
            img = img.resize((MAX_W, new_h), Image.Resampling.LANCZOS)
        tmp = path.with_suffix(".tmp.jpg")
        img.save(tmp, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        after = tmp.stat().st_size
        if after < before or width > MAX_W:
            tmp.replace(path)
            used = after
        else:
            tmp.unlink(missing_ok=True)
            used = before
        total_after += used
        print(f"{path.relative_to(ROOT)}: {before // 1024}KB -> {used // 1024}KB ({img.size[0]}x{img.size[1]})")
    print(f"TOTAL: {total_before // 1024}KB -> {total_after // 1024}KB")


if __name__ == "__main__":
    main()
