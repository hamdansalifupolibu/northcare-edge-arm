# NorthCare Reach — Worker Accessibility (R4)

**Last updated:** 2026-08-03  

## Controls

- Community Requests heading via `ScreenTitle`
- Filter chips expose selected state (`accessibilityState.selected` + label)
- List rows are single navigable items with category, status, landmark, emergency text
- Contact number labelled only on detail
- Consent yes/no announced as text
- Status uses text label + `StatusChip` (never colour alone)
- Action buttons have clear labels; confirmations use system `Alert`
- Loading / error states use `LoadingState` / `AppStateView`
- Touch targets follow design-system 48dp minimum
- Font scaling remains enabled
- No flashing or continuous emergency animation (reduced-motion safe by omission)

## Privacy

List accessibility labels must not announce contact numbers.
