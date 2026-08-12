# NorthCare Reach — Simulator Design (R3)

**Status:** Implemented with Reach Stage R3  
**Last updated:** 2026-08-03

## Intent

Believable basic-phone USSD demonstration — not a modern smartphone app.

## Visual structure

- Brand chrome outside the USSD screen (NorthCare name, tagline, teal tokens from `implementation/design-tokens.json`)
- Always-visible simulation banners
- Phone-shaped container with monochrome USSD text area
- Numeric response field, Send / Back / Restart

## USSD content rules

- Plain text and numbered options
- One response field
- Short confirmations
- Demonstration information labelled as unapproved placeholders

## Assets

- Plain HTML / CSS / JS only
- Canonical logo optional; do not forge or redraw partner logos
- No external scripts or analytics

## Inventory

See `implementation/reach-simulator-inventory.json`. Not an Expo screen.
