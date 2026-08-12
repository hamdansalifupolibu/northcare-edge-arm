# Stage 18 — Change Register

**Updated:** 2026-08-02  
Classify every Stage 18 code change.

| ID | Classification | Path(s) | Risk addressed | Previous | New | Tests | Migration | Backward compatible | Android validation |
|---|---|---|---|---|---|---|---|---|---|
| C18-01 | Accessibility fix | `AppTextInput.tsx`, `FormErrorText.tsx`, `FormHelperText.tsx` | Form errors not associated for assistive tech | Error text rendered without stable nativeID / hint association | Error/helper `nativeID` + `accessibilityHint` carries error/helper text | stage18AccessibilityComponents | No | Yes | Partial (component tests) |
| C18-02 | Test-only change | `stage18AccessibilityComponents.test.tsx` | A11y regression | Absent | Shared component a11y contracts | Self | No | Yes | N/A |
| C18-03 | Test-only change | `stage18ProductionConfig.test.ts`, `routeAccess.test.ts` | Production/deep-link gates | Partial | Expanded fail-closed cases | Self | No | Yes | N/A |
| C18-04 | Test-only change | `services/api/tests/security/test_production_configuration.py` | Production auth gate documentation | Partial | Explicit production/staging/dev matrix | Self | No | Yes | N/A |
| C18-05 | Reliability fix | `provision_development_account.py` | Mypy uncertainty on credential update path | Implicit non-null | `assert credential is not None` | existing provision unit test | No | Yes | N/A |
| C18-06 | Reliability fix | `synthetic_dev_data.py` | Mypy list cast | Untyped roles list | `cast(list[AccountRole], …)` | seed/integration | No | Yes | N/A |
| C18-07 | Tooling change | `test_administration.py`, `test_provision_development_account.py` | Ruff F841/RUF100 | Unused var / noqa | Clean lint | existing | No | Yes | N/A |
| C18-08 | Tooling change | `scripts/stage18_secret_scan.py`, inventory scripts | Secret scan / inventories | Manual | Safe scanners | manual run | No | Yes | N/A |
| C18-09 | Documentation correction | Multiple `docs/**`, inventories, PROJECT_STATUS | Accuracy | Stage 17 deferrals | Stage 18 evidence docs | review | No | Yes | Documented |
| C18-10 | Tooling change | `apps/mobile/android/**` (prebuild), `package.json` scripts | Dev build attempt | No native project | Expo prebuild android + run scripts | build attempt | No | Yes | See ANDROID_DEVELOPMENT_BUILD |
| C18-11 | Tooling change | `apps/mobile/jest.config.js` | Parallel auth-session flake under load | Default workers | `maxWorkers: '50%'` | full suite | No | Yes | N/A |

No clinical business-rule changes. No crypto parameter changes. No new runtime packages.
