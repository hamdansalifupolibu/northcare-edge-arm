# Stage 13 Stitch Alignment

**Stage:** 13  
**Date:** 2026-08-02

## Role of Stitch

Google Stitch project `749026157623860355` is a **UX / visual reference only**.

- Do not convert Stitch HTML into a website.
- Do not implement screenshots as production screens.
- Do not embed dynamic UI text inside images.
- Production UI uses Expo Router + design-system components + theme tokens.

## Routes implemented

| Route | Screen |
|---|---|
| `/(worker)/ask` | Ask NorthCare home |
| `/(worker)/ask/topics` | Topics list |
| `/(worker)/ask/answer` | Answer / multi-source / boundary result |
| `/(worker)/ask/sources` | Source details for last answer |
| `/(worker)/ask/article/[articleId]` | Article detail |
| `/(worker)/ask/unavailable` | Content / assistant unavailable |
| `/(worker)/ask/urgent` | Urgent boundary |
| `/(development)/ask-northcare-preview` | Development content inventory preview |

Entry: worker home opens `/(worker)/ask`.

## Alignment notes

- Scope card, privacy notice, processing (“Searching approved information”), answer cards, sources list, development banners, and unavailable/urgent states follow Stitch intent with RN components.
- Touch targets and safe areas follow Android design rules (48dp, safe areas).
- No forged partner logos.

## Related

- `implementation/route-map.json` (update when maintained)
- `docs/architecture/ROUTE_ARCHITECTURE.md`
