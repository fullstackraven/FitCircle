# Display and Account Data modernization

Focused presentation change in `settings.tsx` and page-scoped `dashboard-settings.css`. Existing header, navigation, dock, safe areas and scroll ownership remain intact.

Display follows the supplied reference: visual theme swatches with selected check/border, compact grouped Home rows, and an outlined Refresh FitCircle action. Radios use the existing controller. Visibility switches expose `role=switch` and `aria-checked=!hidePreference`; clicks still write the same existing hide fields. Opening these pages does not invert or migrate saved preferences. Fixed preview swatch colors intentionally depict Light/Dark independently of the active theme. All other surfaces use existing semantic tokens.

Account Data groups local-storage guidance, export/restore, and a restrained destructive section. Export, restore, validation, confirmation, refresh and erase handlers are unchanged. The existing two-step erase confirmation and native restore confirmation remain. No storage/schema/backup/service-worker/routing changes. Accurate guidance states there is no automatic cloud backup. Status messages remain next to the relevant actions with polite live announcements.

## Review images

After screenshots use the available system Chromium; the pinned CI browser download returned 403. These are review artifacts, not replacements for existing visual baselines.

| Page | Dark 390px | Light 390px | Narrow 320px |
|---|---|---|---|
| Display | [Top](display-dark-390.png), [Updates](display-dark-390-bottom.png) | [Light](display-light-390.png) | [Dark](display-dark-320.png), [Light](display-light-320.png) |
| Account Data | [Top](account-data-dark-390.png), [Data Management](account-data-dark-390-bottom.png) | [Light](account-data-light-390.png) | [Dark](account-data-dark-320.png), [Light](account-data-light-320.png) |

Previous review images are preserved: [Display before](../dashboard-settings-revamp/dark-390/display.png), [Account Data before](../dashboard-settings-revamp/dark-390/account-data.png). These are previously captured artifacts rather than new captures of this PR's base.

## Validation

- `npm run check` and regression TypeScript: passed.
- Focused storage/backup units: 43 passed; storage audit: 164 call sites, zero errors.
- Production build: passed.
- Existing Account Data export, invalid/cancelled/successful restore, and erase-confirmation cancellation test: passed.
- Existing visibility/appearance persistence and offline refresh tests: passed.
- New visibility test verifies previously saved mixed hide values, no mount rewrite, keyboard toggle, and reload persistence: passed.
- New Light/Dark/System mobile tests at 390×844 and 320×844: passed; no horizontal overflow, unchanged workout data, final controls clear the dock, and System responds to device appearance changes. Light text contrast checks passed.
- Existing real service-worker update/Force Refresh and offline update browser checks: passed.
- Full browser suite and screenshot regression baselines are left to GitHub Actions. Existing assertions were updated only for intentional names/switch semantics; none removed or weakened.

## Version and manual review

PR97 was merged; the verified published baseline on main is **2.11.1** (`257f0ba`, GitHub Release published 2026-10-28T00:30:41Z). This PR uses exactly `release:minor`; **2.12.0** is the expected next version if no release intervenes, not an already published version. No application version is hardcoded here. The existing workflow embeds the calculated version and records the release only after successful Pages deployment.

Physical iPhone checks remain: Safari and installed-PWA safe areas; scrolling to Refresh and Erase; VoiceOver radios/switches; file selection and backup download to Files; restore/cancel; existing confirmations; refresh with real device connectivity. No physical-device test is claimed.
