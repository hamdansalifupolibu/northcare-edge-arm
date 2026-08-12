# Git Workflow

**Purpose:** Branching, commits, and tags for hackathon + later development.  
**Status:** Active  
**Last reviewed:** 2026-08-02  

## Selected strategy

**Simple stage / feature branches merging to `main`.**

A long-lived `develop` branch is **optional** and omitted by default to reduce overhead for a small hackathon team. Revisit after competition if parallel tracks increase.

## Branches

| Branch | Purpose |
|---|---|
| `main` | Stable reviewed state; never knowingly broken; competition checkpoints |
| `stage/01-repository-foundation` | Stage-scoped work |
| `stage/02-expo-foundation` | Next stage when approved |
| `feature/...` | Cross-cutting features after shell exists |
| `fix/...` | Bug fixes |

## Commit convention

```text
type(scope): description
```

Types: `feat` · `fix` · `docs` · `test` · `refactor` · `chore` · `build` · `ci` · `perf` · `security`

Examples:

- `docs(project): establish repository foundation`  
- `chore(repo): add environment and Git safety rules`  
- `feat(clients): add offline client registration`  
- `fix(sync): prevent duplicate referral upload`  
- `test(rules): cover red-priority precedence`

## Tags

- `v0.1-foundation`  
- `v0.2-mobile-shell`  
- `v0.3-offline-client-flow`  
- `v0.4-competition-mvp`  

## Commits from agents

Do **not** create Git commits unless the user explicitly authorises them.

## Repository layout note

This project folder may live inside a parent Git repository. Confirm where `git` root is before committing. Prefer a dedicated remote for NorthCare AI when ready.
