# Benchmarks (NorthCare Edge)

Local evidence store for Arm optimization runs.

```text
benchmarks/
  baseline/   # Reviewed baseline summaries (Phase 3+)
  optimized/  # Reviewed accepted-config summaries (later)
  raw/        # Untouched device JSON dumps
  reports/    # Human-readable reports / exports
```

## Rules

- No invented numbers
- Synthetic fixtures only
- No transcripts, audio blobs, tokens, PINs, or health identifiers in committed artifacts
- Prefer committing **summaries** after review; keep bulky raw dumps out of git if they are large (use `.gitignore` later if needed)

Phase 1 leaves these directories empty except for this README and placeholders.
