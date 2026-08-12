# Component Library

**Stage:** 3  
**Location:** `apps/mobile/src/design-system/`  
**Public export:** `apps/mobile/src/design-system/index.ts`  
**Inventory:** `implementation/component-inventory.json`  

## Rules

- Typed, focused APIs — no `any`, no raw brand hex props
- No SQLite / network / health-rule logic inside components
- Accessible by default (labels, 48dp targets, non-colour status cues)
- Support font scaling and longer translated text
- Preview: `DesignSystemPreviewScreen` (development only)

## Foundation

| Component | Purpose | Key props |
|---|---|---|
| `AppText` | Semantic typography | `variant`, `color`, `align` |
| `AppScreen` | Safe-area screen shell | `padded`, `keyboardAware`, `background` |
| `ScrollableAppScreen` | Scroll + keyboard shell | `bottomClearance` |
| `ScreenSection` | Titled content block | `title`, `description` |
| `ContentStack` | Vertical gap stack | `gap` |
| `Divider` | Hairline separator | `spacingSize` |

## Brand

| Component | Purpose | Notes |
|---|---|---|
| `NorthCareLogo` | Canonical PNG logo | `symbol` / `stacked`; no unapproved SVG |
| `HeroImage` | Hero media wrapper | Rounded; requires accessibility label unless decorative |
| `AppImage` | General image wrapper | Decorative mode supported |

## Actions

| Component | Variants / states |
|---|---|
| `AppButton` | primary / secondary / tertiary / destructive; disabled; loading; sizes standard/compact |
| `IconButton` | 48dp icon control; requires `accessibilityLabel` |

## Forms

`AppTextInput`, `SearchInput`, `FormLabel`, `FormHelperText`, `FormErrorText`, `CheckboxField`.

Errors use text + alert semantics — not red borders alone.

## Surfaces and headers

`AppCard`, `PressableCard`, `AppHeader`, `ScreenTitle`, `SectionHeader`, `BackButton` (callback only — no router).

## Status and risk (visual)

`StatusChip`, `CountBadge`, `RiskIcon`, `RiskBadge`, `RiskSummaryCard`.

Risk components are **visual only**. Approved labels: RED / AMBER / GREEN PRIORITY. No calculation.

## Offline / sync (presentation)

`ConnectivityBanner`, `SyncStatusIndicator`, `OfflineNotice`, `LocalSaveConfirmation`.

Props-driven wording from `SYNC_COPY`. No network detection or sync queue.

## States

`AppActivityIndicator`, `LoadingState`, `AppStateView` (empty / error / offline / permissionDenied / noResults / unavailable / success).

## Development

`DesignSystemPreviewScreen` — labelled Development Preview; gated by `diagnosticsEnabled` (non-production). No fake clinical data.

## Usage example

```tsx
import { AppButton, AppText, RiskSummaryCard } from '../design-system';

<AppText variant="title">Clients</AppText>
<AppButton label="Register client" onPress={onRegister} />
<RiskSummaryCard level="amber" />
```

## Known limitations

- No full form engine / validation library
- Icon family uses lightweight glyphs; Material Symbols font not bundled yet
- Back button does not integrate React Navigation (Stage 4)
- Offline components do not observe connectivity
