# Git Root Decision

**Date:** 2026-08-02  
**Stage:** 2  
**Status:** Decision recorded — user approval required before Git surgery

## Current observation

| Item | Value |
|---|---|
| Detected Git root | `C:/Users/Gebruiker/OneDrive/Desktop/Hon. Salifu Dandaawa` |
| NorthCare project folder | `.../Hon. Salifu Dandaawa/NorthCare AI Project` |
| Nested Git repo inside NorthCare | **No** |

The parent repository already contains an unrelated Node/Hostinger-style application (`app.js`, `database.js`, `mp_tracker.db`, `public/`, deployment files, etc.).

`NorthCare AI Project/` currently appears largely as an **untracked** tree under that parent repository.

## Assessment

| Question | Answer |
|---|---|
| Does the parent repo intentionally contain NorthCare AI? | Unclear / unlikely — sibling content is a separate product |
| Are unrelated sibling folders tracked? | Yes — hostinger/tracker project files at parent root |
| Would a dedicated NorthCare AI repository be safer? | **Yes** |
| Would creating a nested repository cause confusion? | Mild risk if parent also tracks the same files — avoid dual tracking |

## Preferred outcome

Make `NorthCare AI Project` a **dedicated Git repository root** before the first NorthCare AI commit, provided the user confirms the parent repository was not intentionally meant to own NorthCare.

Do **not**:

- Delete the parent repository
- Run destructive Git commands without approval
- Commit Stage 2 changes without explicit approval

## Recommended commands (require explicit user approval)

Run these only after the user approves:

```powershell
cd "C:\Users\Gebruiker\OneDrive\Desktop\Hon. Salifu Dandaawa\NorthCare AI Project"

# 1) Ensure NorthCare is not accidentally tracked by the parent later
#    (optional) add to parent .gitignore from the parent repo:
#    NorthCare AI Project/

# 2) Initialise a dedicated repository
git init

# 3) Confirm .env is ignored
git status
# .env must NOT appear as a staged/addable secret

# 4) First commit only when the user asks to commit
```

If the parent repository must continue to own everything, document that explicitly instead and keep committing from the parent root with a carefully scoped path. That arrangement is **not recommended**.

## Stage 2 action taken

- Documented the situation.
- Did **not** initialise a nested repository.
- Did **not** create commits.
