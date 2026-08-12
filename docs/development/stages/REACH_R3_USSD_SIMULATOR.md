# Reach Stage R3 — USSD Simulator

**Status:** Complete — awaiting R4 approval  
**Date:** 2026-08-03  
**Depends on:** Reach R0, R1, R2  
**Does not include:** Worker Community Requests Centre (R4), Stage 19

## Purpose

Lightweight browser USSD simulation served by FastAPI static files, calling the real R2 public APIs. Number-driven basic-phone demo. Clearly labelled simulation.

## Location

- Static files: `services/api/static/reach-simulator/` (`index.html`, `reach.css`, `reach.js`)
- Route: `GET /reach-simulator` (+ allowed assets)
- Gate: `NORTHCARE_REACH_DEMO_ENABLED` (development/test only; default false)

## Behaviour

- Frozen main menu options 0–6
- Emergency 112 instruction and simulation wording
- Pregnancy / child / nutrition demonstration placeholders
- CHPS request creation via `POST /v1/reach/requests`
- Status check via `POST /v1/reach/requests/status`
- One-time status PIN in memory only (not URL/storage/console)

## Explicit non-goals

Second React/Node app, telecom/SMS/ambulance, medical chatbot, worker mobile screens, R4, Stage 19, new runtime packages, database migrations.
