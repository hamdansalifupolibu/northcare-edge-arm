# Stage 5 — Stitch Alignment

**Last updated:** 2026-08-02  
**Visual Android check:** Pending (`emulator-5554` offline)  
**Stitch project:** `749026157623860355`

| Screen ID | Route | Stitch intent | Match notes | Intentional differences |
|---|---|---|---|---|
| AUTH-WRK-01 | `/(auth)/worker-login` | Worker login | Brand, heading, identifier + password, forgot password, change workspace | Design-system forms; Stitch-aligned identifier hint; no clinical stats |
| AUTH-ADM-01 | `/(auth)/admin-login` | Administrator login | Same product chrome; admin heading | Shared `LoginScreen` component |
| AUTH-REC-01 | `/(auth)/password-recovery` | Password recovery | Identifier + generic confirmation | No account-existence messaging |
| AUTH-PWD-01 | `/(auth)/password-change` | First-time password change | Current/new/confirm + requirements | Provider policy text centralised in i18n |
| AUTH-FAC-01 | `/(auth)/facility-confirmation` | Facility confirmation | Facility name/type/region/role | No facility picker |
| AUTH-PIN-01 | `/(auth)/create-pin` | Create PIN | Six-digit masked entry | RN `PinEntry` (not HTML keypad screenshot) |
| AUTH-PIN-02 | `/(auth)/confirm-pin` | Confirm PIN | Match confirmation | Same component |
| AUTH-BIO-01 | `/(auth)/biometric-setup` | Fingerprint setup | Optional enable/skip copy | Strong biometric preference on Android |
| AUTH-UNL-01 | `/(auth)/unlock` | Returning unlock | Name/facility (privacy-safe), PIN, biometric button | No client counts/alerts |
| AUTH-LCK-01 | `/(auth)/temporarily-locked` | Temporary lockout | Calm lock messaging | AppStateView pattern |
| AUTH-INA-01 | `/(auth)/account-inactive` | Account inactive | Contact administrator | No clinical leakage |
| AUTH-EXP-01 | `/(auth)/session-expired` | Session expired | Re-authenticate | Offline entitlement expiry |
| AUTH-OUT-01 | `/(auth)/logout-confirm` | Logout confirmation | Confirm sign-out | Clarifies future clinical records not deleted here |
| — | `/(auth)/setup-complete` | Setup complete | Continue into shell | Simple success state |

### Accessibility improvements vs Stitch HTML

- 48dp touch targets
- Password show/hide announcements (not password content)
- PIN progress announced without digit values
- Centralised strings for longer future translations
- Non-colour error text

### Temporary development-only elements

- Synthetic account shortcut labelling (“Development only”) where shown
- Design-system preview remains development-gated

Pixel-perfect alignment is **not** claimed without Android visual validation.
