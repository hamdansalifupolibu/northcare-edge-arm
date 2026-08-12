# NorthCare AI — Forms & UI Design (Client Module Redesign)

**Last updated:** 2026-08-08  
**Scope:** Worker client flows in `apps/mobile` — registration, list, profile, edit, delete  
**Design source:** Approved mockups + existing design tokens (`colors`, `radii`, `spacing`, `NorthCareLogo`)

---

## Design principles

- **Android-first** React Native; 48dp minimum touch targets.
- **Brand teal** (`#0F766E` / `#115E59`) for primary actions; soft pastels for quick-action cards.
- **Offline-first copy** — local save wording; no fake “synced” states on lists.
- **No sync noise on lists** — hide routine “Waiting for connection” chips; only show actionable sync states when needed.
- **Shared shells** — logo header, connectivity pill, theme toggle, security footer banner.
- **Reusable form controls** — sex chips, age unit chips, select cards, `FormLabel` required asterisks.
- **Keyboard-safe** — `KeyboardAvoidingView`, footer hides security banner while keyboard open on registration/edit shells.

---

## Global worker chrome

| Element | Component | Notes |
|--------|-----------|--------|
| Bottom nav | `WorkerBottomNav` | Home · Clients · Assessments · Referrals · More |
| Nav visibility | `workerNav.ts` | Shown on home, clients list, **client profile**, nutrition/referrals/more roots |
| Nav clearance | `WORKER_BOTTOM_NAV_CLEARANCE` (72) | Scroll padding on tab-root screens |
| Theme toggle | `WorkerThemeToggle` | Sun/moon pill in header |
| Connectivity | `useConnectivity` + status pill | Online/offline with dot; offline wifi-slash icon |

---

## Client registration (8 steps + success)

**Orchestrator:** `ClientRegisterScreen.tsx`  
**Shell:** `ClientRegisterShell.tsx`

### Shell layout
1. Back + theme toggle row  
2. Stacked NorthCare logo  
3. Title + subtitle  
4. Step label + segmented progress bar (8 segments)  
5. Step body (scroll)  
6. Fixed footer: security banner + Back + Continue  

### Shared form UI (`ClientRegisterSharedUi.tsx`)
| Component | Use |
|-----------|-----|
| `RegisterStepHeading` | Section title + instruction |
| `RegisterSelectCard` | Category, age mode, consent, region, duplicates confirm |
| `RegisterSexSelector` | Mandatory Female/Male chips with gold check |
| `RegisterUnitChipRow` | Days / Weeks / Months / Years (equal-width chips) |
| `RegisterFieldLabel` | Wraps `FormLabel` with optional `required` |
| `RegisterFormError` | Field-level errors |

### Steps
| Step | Component | Key fields |
|------|-----------|------------|
| 1 Category | `ClientRegisterCategoryStep` | Pregnant, Postnatal, Newborn, Child under five (cards + icons) |
| 2 Identity | `ClientRegisterFlowSteps` | Given/family/preferred name; **sex required**; pregnancy fields if relevant |
| 3 Age | Flow steps | Exact DOB / approximate + unit / unknown |
| 4 Caregiver | Flow steps | Optional caregiver contact |
| 5 Location | Flow steps | Community, district, region select cards, phone |
| 6 Consent | Flow steps | Consent status cards |
| 7 Duplicates | Flow steps | Neutral heading; separate empty vs found states |
| 8 Review | `ClientRegisterReviewStep` | Identity card, detail rows, per-section Edit |
| Success | `ClientRegisterSuccessScreen` | Shield hero, client card, offline banner, actions |

### Validation
- Sex mandatory (`clientSex.ts`, `validation.ts`)
- Tests: `clientValidation.test.ts`, `clientServices.test.ts`

---

## Clients list

**Screen:** `ClientListScreen.tsx`

### Header (`ClientListScreenHeader.tsx`)
- Back → worker home  
- Centered stacked logo  
- Offline/online pill  
- Title **Clients** + subtitle *Manage and view client records*  
- Register shortcut (user-plus icon)

### Actions & filters
- Full-width **Register client** button (leading user-plus icon)  
- Search field with magnifier (`ClientListSearchField.tsx`) — *Search by name, ID or location*  
- Horizontal filter chips: All + category pills (filled teal when selected)

### List rows (`ClientListItem.tsx`)
- Rounded **card** per client (not flat list divider)  
- Teal initials avatar  
- Name · ID · category  
- Age + location with calendar/map icons  
- Chevron right  
- **No** routine sync status chips

### Modes preserved
- Voice assign / nutrition patient selection (alternate titles)

---

## Client profile

**Screen:** `ClientProfileScreen.tsx`  
**Components:** `ClientProfileComponents.tsx`, `ClientProfileIcons.tsx`

### Top bar (`ClientProfileTopBar`)
- Back → clients list  
- Logo · offline pill · theme toggle  

### Identity card
- Dark teal avatar (initials)  
- Name (teal), category · sex  
- Edit pencil (top-right)  
- Badges: ID, age (yellow), consent (green)  
- Location + facility rows with icons  

### Actions
- **Start visit** — full-width teal `AuthSetupActionButton` + stethoscope  
- **Quick care actions** — 2×2 grid, horizontal cards (icon circle · title · description · chevron)  
  - Nutrition (yellow), Voice (purple), Referrals (lavender), Reminder (teal)

### Two-column section
- **Client details** — rows with mini icons (community, region, facility, phone, consent, caregiver)  
- **Recent care** — empty state or visit list + **View full history**  
- **Security banner** — *Your data stays secure*  

### Bottom nav
- Visible on profile (`workerNav` — `clients/[clientId]`)

### Terminology
- **Delete client** (soft delete; UI says delete, internal route still `/archive`)

---

## Edit client

**Screen:** `ClientEditScreen.tsx`  
**Shell:** `ClientEditShell.tsx`

### Shell layout (matches registration/profile)
- `ClientProfileTopBar` (back → profile)  
- Title **Edit client** + subtitle  
- Read-only meta card: reference code, category, facility (locked)  
- Form sections using shared register UI patterns  
- Footer: security banner + Cancel + **Save changes**  
- `KeyboardAvoidingView` + keyboard inset handling  

### Editable sections
1. **Identity** — names, sex selector, pregnancy fields if category applies  
2. **Age** — select cards for mode; DOB or approximate + unit chips  
3. **Location** — community, district, region select cards  
4. **Phone** — not available checkbox + optional number  
5. **Consent** — select cards  
6. **Notes** — optional text  

### Non-editable on this screen
- Client category (from registration)  
- Facility (worker account)  
- Caregiver (deferred — note shown)

### Errors & edge cases
- Stale record banner + reload  
- Consent change confirmation alert  
- Field validation via `validateEditClientDraft`

---

## Delete client

**Screen:** `ClientArchiveScreen.tsx` (route `/archive`)  
**Copy:** Delete this client? / Delete client / Client deleted on this device.

---

## Icon inventory (client module)

| File | Purpose |
|------|---------|
| `ClientListIcons.tsx` | List/search/nav icons |
| `ClientProfileIcons.tsx` | Profile, quick actions, detail rows |
| `ClientRegisterCategoryIcons.tsx` | Registration category cards |

---

## i18n keys (English highlights)

| Area | Keys |
|------|------|
| List | `clients.title`, `clients.subtitle`, `clients.searchPlaceholder` |
| Profile | `clients.profile.quickActions.*`, `clients.profile.detailsTitle`, `clients.profile.recentCareTitle` |
| Register | `clients.registration.*`, `clients.fields.sexOptions` |
| Edit | `clients.edit.*` |
| Delete | `clients.archive.*` (UI strings say “delete”) |
| Sync (hidden on list) | `clients.syncStatus.*` |

Dagbani mirror: `src/i18n/dg.ts`

---

## File map (implementation)

```
apps/mobile/src/features/clients/
├── components/
│   ├── ClientRegisterShell.tsx
│   ├── ClientRegisterSharedUi.tsx
│   ├── ClientRegisterCategoryStep.tsx
│   ├── ClientRegisterFlowSteps.tsx
│   ├── ClientRegisterReviewStep.tsx
│   ├── ClientRegisterSuccessScreen.tsx
│   ├── ClientListScreenHeader.tsx
│   ├── ClientListSearchField.tsx
│   ├── ClientListItem.tsx
│   ├── ClientListIcons.tsx
│   ├── ClientProfileComponents.tsx
│   ├── ClientProfileIcons.tsx
│   ├── ClientEditShell.tsx
│   └── PrivacyAvatar.tsx
├── screens/
│   ├── ClientRegisterScreen.tsx
│   ├── ClientListScreen.tsx
│   ├── ClientProfileScreen.tsx
│   ├── ClientEditScreen.tsx
│   └── ClientArchiveScreen.tsx
└── domain/
    ├── syncPresentation.ts
    ├── agePresentation.ts
    └── locationOptions.ts
```

---

## Bugs fixed during redesign

| Issue | Fix |
|-------|-----|
| `Property 't' doesn't exist` on client screens | Added `useTranslation()` in profile, history, archive, edit |
| “Waiting for connection” on list/profile | Removed/hidden routine sync chips |
| Age unit chips collapsed | `RegisterUnitChipRow` equal flex chips |
| Step 7 duplicate copy | Separate empty vs found headings |
| Sex shown as `sex*` | `FormLabel required` on sex selector |
| Keyboard covering fields | `ClientRegisterShell` keyboard avoiding + inset |
| Quick actions overlapping details | Fixed card widths + grid spacing on profile |

---

## Testing notes

- Run registration flow all 8 steps + success  
- Clients list search/filter/card tap  
- Profile quick actions + start visit  
- Edit save + stale reload + consent confirm  
- Delete client returns to list  
- Bottom nav on home, clients list, client profile  

---

## Voice-to-Care (aligned with this design system)

**Status:** Homepage + shared shell updated 2026-08-09 to match client-module patterns.

### Design alignment
- Brand teal primary actions and teal icon circles on cards  
- Rounded **cards** for client context and **View recordings** (not flat divider rows)  
- 48dp minimum touch targets  
- Offline-first copy (“On-device”, “saved on this device”)  
- Shared shell: `VoiceToCareShell` — back · title · right-aligned **On-device** chip  

### Homepage (`VoiceQuickStartScreen` / `VoiceEntryScreen`)
| Element | Notes |
|---------|--------|
| Header | Title + **On-device** chip only (shield icon removed) |
| Client / note context card | Initials avatar + change affordance |
| Language selector | Card-style control |
| **View recordings** | In-body teal card (`VoiceViewRecordingsCard`) — primary access to the recordings hub |
| Orb + primary CTA | Record / Finish recording in footer |

### Other Voice screens (consistent chrome)
- Transcript / Results / Recordings list use the same shell + On-device chip  
- Results: editable field cards, urgency card, Save / Record another / Discard  
- Recordings list: card rows with status chips (Saved / Transcript ready / Ready to review)  

### Key components
| File | Role |
|------|------|
| `VoiceToCareShell.tsx` | Shared light/dark layout |
| `VoiceViewRecordingsCard.tsx` | Homepage recordings entry |
| `VoiceTranscriptReviewUI.tsx` | Client card, editor, header On-device chip |
| `VoiceResultsReviewUI.tsx` | Results field / urgency cards |
| `VoiceRecordingListItem.tsx` | Recordings hub rows |

---

## Out of scope (not redesigned here)

- Visit and nutrition sub-flows (separate feature UI)  
- Admin provisioning screens  
- Server sync implementation  
