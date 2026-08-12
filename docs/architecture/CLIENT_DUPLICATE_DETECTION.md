# Client Duplicate Detection

**Status:** LOCAL MVP RULES — REQUIRE PILOT REVIEW  
**Stage:** 7  

## Purpose

Conservative, explainable possible-match detection during registration.  
No automatic merge. No AI. No unexplained fuzzy scores.

## Signals

- Normalised full name
- Exact date of birth
- Approximate age + unit
- Normalised phone digits (length ≥ 7)
- Normalised community
- Existing local reference code

## Strength

**Strong** when:

- Same local reference code, or
- Same full name plus DOB / phone / approximate age, or
- Same full name plus community with at least two matching reasons

Otherwise overlapping reasons are **partial**.

## Worker actions

- Review existing client
- Continue with new registration (explicit confirmation required for strong matches)
- Return and correct information

## Presentation

Heading: “Similar client records were found.”  
Show plain-language reasons. Never declare two people the same automatically.
