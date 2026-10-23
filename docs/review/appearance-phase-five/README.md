# Appearance Phase 5 — public activation and release review

Baseline: main `862789ab1ed7afbdaa328989450a790e9d2a54c5`, merged Phase 4 PR #75. Phase 5 is implemented on a dedicated branch. **This PR does not merge or deploy itself.** Public activation happens only when the reviewed changes are merged and the existing Pages workflow deploys them.

## Final architecture

- `client/src/lib/appearance.ts` remains the only running appearance controller. The production Dark-only gate and `allowPreview` option are removed; production and development use identical preference resolution.
- `main.tsx` still calls `recoverInterruptedRestore()` before controller initialization, route recovery, PWA registration and the dynamic App import. `initializeAppearance()` creates one application controller; Settings subscribes to its stable snapshot with `useSyncExternalStore`. Importing appearance validation from the backup module has no browser/storage side effects.
- Settings adds one compact Appearance fieldset after the existing sections, preserving their order and the original initial-view snapshots. Native, labelled radio controls expose Light/Dark/System and native arrow-key navigation. Changes apply immediately without Save or reload. Checked state represents the **preference**, not the resolved OS appearance. Failed writes retain the previous choice and expose an accessible error.
- The root `data-appearance`, inline `color-scheme` and document `theme-color` update together. Existing semantic CSS, portals, SVGs, charts, header and dock respond without remounting pages. No app-shell, viewport, safe-area, modal or keyboard geometry changes.

| Stored value | OS Light | OS Dark | Writes merely from opening/launching |
| --- | --- | --- | --- |
| Missing or invalid | Dark | Dark | None; invalid bytes remain untouched |
| `dark` | Dark | Dark | None |
| `light` | Light | Light | None |
| `system` | Light | Dark | None; stored value remains `system` |

Missing/throwing media-query support falls back to Dark for System; explicit Light still works. The controller subscribes once to the media query, supports the older `addListener` API, and reconciles on `pageshow`, focus and visible `visibilitychange`. Cleanup removes every listener. Explicit preferences ignore OS change events. Snapshot deduplication avoids unrelated React rerenders.

## Early bootstrap and recovery ordering

`client/index.html` contains a small synchronous classic script in a marked critical head fragment, after the theme-color meta and before visible body content. It safely reads the existing preference, applies the exact decision table above, sets the root attribute/color scheme/theme-color, and uses a tiny critical palette for the document and launch placeholder. It does not write storage, install listeners, import modules or recover fitness data.

This small decision table and the two metadata/background colors are deliberately duplicated rather than loading the controller (and a network module graph) before first paint. Unit tests execute the actual inline script in a VM and compare it with the controller across valid/invalid/missing preferences, both OS appearances and missing media support. The colors match the existing `#0f172a` Dark / `#f8fafc` Light app backgrounds. Full CSS retains the established foregrounds. The build also copies this exact fragment into the Pages redirect document before hashing/pre-caching it; there is no independently maintained redirect bootstrap. This fixes its otherwise unthemed redirect surface. The actual redirect/base-path algorithm is unchanged.

If an interrupted-restore journal is present, the bootstrap **only peeks at its previous appearance entry**, if supplied. It never writes/replays/deletes that journal or interprets fitness fields. A malformed/unreadable journal falls back safely for the placeholder; the existing recovery still decides whether application startup can continue. The authoritative rollback then runs in its original position, and the controller rereads recovered storage before App can render. Tests verify the early hint, recovered preference and every observed application frame agree. Blocked storage still uses the existing startup/recovery screen; this phase does not bypass recovery to force the application open.

Cold production tests hold the entry module and verify the correct palette/placeholder before React, then sample application frames after release. Other tests abort application assets to exercise every preference/OS combination, missing storage/media APIs and the existing GitHub Pages 404 route recovery. These establish **web-content** startup behavior in Chromium, not OS launch-screen or status-bar control.

## PWA metadata, native controls and offline behavior

The existing document theme-color is synchronized to the effective appearance. The root CSS color scheme also covers compatible native controls/scrollbars. A narrow Dark pseudo-element rule preserves the original date/time picker and numeric spinner glyphs; native picker panels can still inherit the root scheme. These legacy glyph contrast exceptions are preserved rather than redesigning controls or changing old screenshots.

**Unchanged:** manifest name/ID/scope/start URL/display/icons, static Dark manifest launch colors, Apple capable/title metadata, base path `/FitCircle/`, Vite deployment, service-worker source and Pages workflow. No dynamic manifest, status-bar hack, viewport rewrite, new dependency or caching framework.

`scripts/build-pwa.mjs` has one narrowly scoped appearance addition: copying the marked entry-head fragment into the generated redirect HTML. After that, its existing hashing/pre-cache strategy includes the new HTML and assets as a complete build. Its atomic installation and retained older assets still protect open tabs. The bootstrap is inline in cached HTML, so it needs no network request. Tests exercise controlled offline refresh, all three selections, live System changes and a fresh offline browser client. Existing barcode offline-cache and Force Refresh tests remain enabled. Real installed-iPhone relaunch and post-deployment CDN/worker update timing require manual checks below.

### Platform research and limits

Documentation was checked through the MDN source/compatibility repositories because direct Apple/MDN website requests returned HTTP 403 in this environment:

- [MDN theme-color reference](https://github.com/mdn/content/blob/main/files/en-us/web/html/reference/elements/meta/name/theme-color/index.md): theme-color is a **suggestion** to the browser UI.
- [Current theme-color compatibility data](https://github.com/mdn/browser-compat-data/blob/main/html/elements/meta.json): Safari support starts at 15; **from Safari 26, the theme color is only used for installed web apps**. Ordinary Safari tab chrome must not be promised to follow the in-app preference. Browser/version differences also apply outside iOS.
- [MDN color-scheme](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/properties/color-scheme/index.md): native form controls, scrollbars and canvas colors can respond, but application content still needs its own themed styles.
- [MDN manifest background_color](https://github.com/mdn/content/blob/main/files/en-us/web/progressive_web_apps/manifest/reference/background_color/index.md): this is an initial/background/splash hint, not a runtime preference store.

The installed manifest and OS launch/app-switcher snapshots cannot read FitCircle localStorage before the web view runs. A native launch surface may therefore remain Dark or show a cached snapshot even with Light saved. Status-bar glyph selection and OS chrome remain Safari/iOS decisions. Suspended/terminated apps cannot run appearance listeners; reconciliation happens when web execution resumes. No claim is made that every iOS native popup follows the preference. The existing safe-area layout and Apple configuration remain intact. Physical-device checks are required; no physical iPhone testing was performed.

## Persistence and backup compatibility

No storage key, schema, migration or backup version was added or changed. `fitcircle_appearance` remains a registered raw `dark`/`light`/`system` string in the existing full-app v2 backup.

Automated coverage verifies all three choices export/restore, manifest keys match, absent preferences remain absent, old backups preserve an existing preference, malformed optional appearance is disclosed/omitted during export without touching its original bytes, and invalid restore values are rejected before writes. Invalid fitness records still fail validation rather than being hidden. Settings backup tests restore all three values through the **existing navigation/reload flow**, then verify appearance and domain bytes. No separate appearance backup mechanism exists.

Switching appearance does not change routines, workouts, diary records, targets/calculations, measurements, wellness histories, journals, reminders or profile values. Tests preserve exact domain bytes and exercise an open food editor and a running/paused meditation timer while another tab changes appearance. Only the intentional preference key changes.

## Production route and visual coverage

The existing Phase 2–4 review suites can now run against the static production preview with `APPEARANCE_PRODUCTION_REVIEW=1`. This changes **test destinations/artifact paths only**; no app debug override or development preview is needed. The default suites retain development coverage. Former production Dark-only assertions were replaced with explicit production Dark/Light/System assertions, not removed.

All original golden PNGs and JSON color baselines remain unchanged, with the same exact/zero-pixel comparisons. The previously documented Phase 4 404 exception remains the only intentionally different legacy Dark view. New Settings controls have their own screenshots, while the existing initial Settings view remains unchanged.

| Route | Production Dark | Production Light |
| --- | --- | --- |
| `/` | [Screenshot](production/dark/home.png) | [Screenshot](production/light/home.png) |
| `/calendar` | [Screenshot](production/dark/calendar.png) | [Screenshot](production/light/calendar.png) |
| `/routines` | [Screenshot](production/dark/routines-collapsed.png) | [Screenshot](production/light/routines-collapsed.png) |
| `/reminders` | [Screenshot](production/dark/reminders.png) | [Screenshot](production/light/reminders.png) |
| `/wellness` | [Screenshot](production/dark/logs.png) | [Screenshot](production/light/logs.png) |
| `/profile` | [Screenshot](production/dark/profile.png) | [Screenshot](production/light/profile.png) |
| `/food-tracker` | [Screenshot](production/dark/food-tracker.png) | [Screenshot](production/light/food-tracker.png) |
| `/food-database` | [Screenshot](production/dark/food-database.png) | [Screenshot](production/light/food-database.png) |
| `/fitness-calculator` | [Screenshot](production/dark/fitness-calculator.png) | [Screenshot](production/light/fitness-calculator.png) |
| `/measurements` | [Screenshot](production/dark/measurements.png) | [Screenshot](production/light/measurements.png) |
| `/cardio` | [Screenshot](production/dark/cardio.png) | [Screenshot](production/light/cardio.png) |
| `/fasting` | [Screenshot](production/dark/fasting.png) | [Screenshot](production/light/fasting.png) |
| `/meditation` | [Screenshot](production/dark/meditation.png) | [Screenshot](production/light/meditation.png) |
| `/hydration` | [Screenshot](production/dark/hydration.png) | [Screenshot](production/light/hydration.png) |
| `/workout-statistics` | [Screenshot](production/dark/workout-statistics.png) | [Screenshot](production/light/workout-statistics.png) |
| `/daily-journal` | [Screenshot](production/dark/daily-journal.png) | [Screenshot](production/light/daily-journal.png) |
| `/journal-log` | [Screenshot](production/dark/journal-log.png) | [Screenshot](production/light/journal-log.png) |
| `/energy-level` | [Screenshot](production/dark/energy-level.png) | [Screenshot](production/light/energy-level.png) |
| `/supplements-page` | [Screenshot](production/dark/supplements-page.png) | [Screenshot](production/light/supplements-page.png) |
| `/recovery` | [Screenshot](production/dark/recovery.png) | [Screenshot](production/light/recovery.png) |
| `/dynamic-overview/:date` | [Screenshot](production/dark/dynamic-overview-2026-10-19.png) | [Screenshot](production/light/dynamic-overview-2026-10-19.png) |
| `/settings` | [Screenshot](production/dark/settings.png) | [Screenshot](production/light/settings.png) |
| `/restore-custom-foods` | [Screenshot](production/dark/restore-custom-foods.png) | [Screenshot](production/light/restore-custom-foods.png) |
| `404 fallback` | [Screenshot](production/dark/synthetic-not-found.png) | [Screenshot](production/light/synthetic-not-found.png) |

The review includes sidebar/dock, routine/workout/profile editors, nutrition details and incomplete data, food search/entry/custom-food/barcode interfaces, calculator page/modal, measurement charts, wellness goal/log dialogs, timers, journal/supplement editors and both data-recovery boundaries. Screenshots use synthetic records, 390 × 844; public Settings is also captured at 320 × 844. Keyboard coverage uses simulated viewport shrink, not a photograph of an iPhone keyboard.

### Public selector

| Preference | 390 × 844 | 320 × 844 |
| --- | --- | --- |
| Dark | [Screenshot](settings-dark-390.png) | [Screenshot](settings-dark-320.png) |
| Light | [Screenshot](settings-light-390.png) | [Screenshot](settings-light-320.png) |
| System (Light OS) | [Screenshot](settings-system-390.png) | [Screenshot](settings-system-320.png) |

Pre-entry-module examples: [Light](startup-light.png), [System](startup-system.png). Selected System remains System when the OS changes; the resolved surfaces may become Dark.

### Accessibility and review limits

The public fieldset/legend, labels, radio checked state, native arrow keys, focus indicator and error announcement are tested. New selector and production Light review views pass computed visible-text contrast thresholds (4.5:1 normal / 3:1 large); per-view reports are beside the screenshots. Existing legacy Dark contrast exceptions, including native glyphs, remain. Blur/gradient composition is approximate in the helper; this is not full WCAG certification. VoiceOver, native popups, focus visibility and graphical contrast need the physical review below.

## Validation

| Command | Result |
| --- | --- |
| `npm run check` | Passed |
| `npx tsc -p tests/tsconfig.regressions.json` | Passed |
| `npm test` | 298 passed |
| `npm run audit:storage` | 162 storage call sites, 0 errors |
| `npm run build` | Passed (existing Browserslist and chunk-size advisories) |
| `APPEARANCE_PRODUCTION_REVIEW=1 npx playwright test tests/browser/appearance-phase-two.spec.ts tests/browser/appearance-phase-three.spec.ts tests/browser/appearance-phase-four.spec.ts tests/browser/appearance-phase-five.spec.ts --workers=2` | 70 passed (1.2m), production Dark/Light review and public integration |
| `npm run test:e2e -- --workers=2` | 347 passed (5.2m), two workers |

Browser commands use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` in this environment. Production preview is served under `/FitCircle/` at port 4173; the normal full suite also preserves development appearance coverage at 4184. Production review captured 108 page/dialog images and 54 passing Light contrast reports, plus the new Settings and pre-entry startup images. These are synthetic Chromium artifacts, not physical-device results.

Diagnostic runs initially found native scheme differences in date/time/spinner glyphs and the new section affecting the backdrop below the initial Settings view. Narrow compatibility rules and the section placement corrected these without regenerating old baselines. A new 404 test initially opened the redirect document directly; it was corrected to serve the real 404 response at a missing route, matching Pages behavior. Inspection also identified and fixed the redirect document's unthemed startup surface via the shared build fragment. One full run was intentionally interrupted after the known native-glyph mismatch; it is **not** a passing validation result. Final completed results are reported above. No retries, timeouts, assertions or screenshot tolerances were relaxed. The Phase 4 barcode fixture reliability corrections are retained.

## Physical iPhone checklist (manual, not performed)

Run each applicable item in both **Safari** and the **installed Home Screen PWA**, using test records and a saved backup:

- Launch with missing preference (Dark), explicit Dark, explicit Light and System; compare web content with the expected OS appearance.
- Change iPhone appearance while FitCircle is open with System selected; verify surfaces, metadata where supported, charts and portals. Verify explicit Light/Dark stay fixed.
- Background the app, change device appearance, resume; terminate/reopen and repeat. Distinguish native launch/app-switcher snapshots from web content.
- Launch offline with each saved preference, refresh and change preferences; ensure records remain available. Reconnect before checking for updates.
- Open food, routine/workout, profile and wellness forms with the keyboard; inspect scroll access, nested editors, focus and close/save controls. Check larger text, portrait and landscape.
- Inspect header/status-bar safe areas, bottom dock clearance and content behind overlays. Check VoiceOver group/checked-state announcements and touch targets.
- Open the barcode camera interface; verify permissions, intentionally dark preview, manual fallback and saved-product offline lookup.
- Download a complete JSON backup to Files; confirm the file exists outside browser storage. Restore a synthetic backup and check the chosen appearance and records.
- Use Force Refresh App online; confirm appearance and records persist. Verify its existing offline/error handling.
- After the reviewed GitHub Pages deployment, verify the new selector/HTML, installed-PWA worker update, deep links and offline refresh without deleting storage or reinstalling.

## Deployment checklist — requires review/authorization

1. Open the **existing** FitCircle installation before rollout.
2. Download a **complete JSON backup**, save it outside browser storage (for example Files), and confirm the file exists. Keep it until post-deployment checks are complete.
3. Review this PR, automated results, screenshots and physical iPhone findings. Merge/deploy only through the existing reviewed GitHub Pages process. This work does not trigger that production deployment.
4. Let the existing worker update install the complete new build; use the existing online Force Refresh App if needed. Do not clear localStorage/IndexedDB, unregister workers or reinstall the PWA as a routine deployment step.
5. Verify routines, workout history, reminders, nutrition, measurements, wellness and profile records remain present, then test preference changes, reload, offline use and the Settings backup.
6. Retain the external backup and record any platform-specific limitations. Do not import over real data merely to test appearance.

## Rollback

If release verification identifies a blocker, create a reviewed revert of Phase 5 back to the merged Phase 4 baseline (`862789a`) and build/deploy it through the existing static Pages workflow. Do not force-push history, clear records or automatically restore an old user backup.

The previous controller already validates `dark`/`light`/`system` and intentionally applies Dark-only in production; previously saved Light/System values remain valid and are retained in their existing key/backups. Thus the earlier build can operate safely with Phase 5 preferences present. The unchanged versioned worker mechanism can install the rollback HTML/assets as a complete build; use the existing online update flow. Preserve all localStorage/IndexedDB and external backups. Check records and offline behavior again after rollback.

## File inventory and unresolved issues

- `client/index.html`: critical palette, early read-only bootstrap, themed startup placeholder.
- `client/public/404.html`, `scripts/build-pwa.mjs`: consume that same critical head in generated Pages redirect HTML; no redirect or service-worker caching-strategy change.
- `client/src/lib/appearance.ts`: public resolution, root/native/metadata application, resumption and singleton access.
- `client/src/main.tsx`: initialize the shared controller after existing recovery; remove environment gate.
- `client/src/pages/settings.tsx`: public native radio fieldset and controller subscription.
- `client/src/styles/appearance.css`: current architecture comments and narrowly scoped legacy native-glyph compatibility.
- `tests/appearance.test.ts`: production/early-bootstrap parity, recovery, unsupported APIs and lifecycle checks; existing backup regressions retained.
- `tests/browser/appearance.spec.ts`, Phase 2–4 suites: replace gated assertions with real public production coverage; support production review evidence without rewriting old snapshots.
- `tests/browser/appearance-phase-five.spec.ts`: public controls, metadata, startup/frame timing, failures, backups, cross-tab editor/timer continuity and offline/reopen checks.
- `tests/tsconfig.regressions.json`: include the Phase 5 browser suite.
- This document and its screenshots/contrast reports.

No unresolved application-code blocker was found in the completed automated validation. Native launch/chrome behavior, actual installed-iPhone lifecycle/camera/Files handling and post-deployment worker/CDN behavior remain manual release checks. The page route matrix covers application-owned routes; standalone viewport-test installations remain intentionally fixed-appearance developer/platform diagnostics, as documented in Phase 4.
