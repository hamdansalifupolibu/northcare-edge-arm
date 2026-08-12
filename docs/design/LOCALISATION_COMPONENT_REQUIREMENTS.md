# Localisation Component Requirements

**Stage:** 3  
**Last reviewed:** 2026-08-02  

## Scope

Stage 3 does **not** ship translations. Components must still be localisation-ready for English today and Dagbanli later.

## Do

- Prefer flexible layouts (`flex`, wrapping text, multi-line titles)
- Allow multiline button labels where needed (`AppText` inside buttons wraps naturally)
- Keep cards and chips expandable for longer strings
- Keep copy as real text components — not baked into images
- Use synthetic English labels only in the development preview

## Do not

- Fabricate Dagbanli strings
- Assume labels stay short (especially status chips and risk titles)
- Embed dynamic UI text inside PNGs/SVGs
- Clip text with fixed heights without scrolling alternatives

## Future hook points

- Replace hard-coded English in screens with a message catalogue (later stage)
- Keep design-system props as `string` so callers can pass translated values
- Risk and sync copy modules (`RISK_COPY`, `SYNC_COPY`) are centralised for later catalogue mapping
