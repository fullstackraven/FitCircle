# Regression safeguards and validation

Baseline required checks passed: TypeScript,217-site storage audit, 48 unit tests, production build, 52 Chromium browser tests. Existing tests already cover backup malformed/quota/interruption failure paths, full-source synthetic round trips, routine/editor forms, reminders completion/reload, Pages routes, offline/update failure, scroll bounds and overlays. Passing them does not certify untested fitness math or storage concurrency.

Batch A adds widget selector purity/order/visibility protection, local/legacy date parsing and empty-aggregate fixtures, and modern historical-workout read protection. Browser additions cover profile persistence, dated food-history UI/reload, and hydration midnight reset retaining prior-day logs. All use synthetic records and isolated contexts; no installed profile/real backup access. Validation counts and exact final commands are recorded below after execution. A negative-control run of the selector test must fail on the original in-place sort before applying the one-line correction.

## Next safety-net work before related fixes

| Area | Required behavior and failure cases | Execution priority |
| --- | --- | --- |
| Workout migration | Numeric-only/mixed/object goals, tied inference, missing history, journal18:00 metadata, repeated mount; original bytes preserved | Before FC-001/002 fixes |
| Initialization | Malformed/raw null/wrong shapes on each autosaving store; no fallback writes; visible recovery | Before FC-003 |
| Food writes | Persistent quota/security denial; create/edit/delete/restore show failure and retain form; backup accepts all UI-created values | Before FC-004/029 |
| Multi-writer state | Two tabs and same-page hook consumers, rapid sequential actions, restore while mounted | Before FC-005/shared store |
| Goals | Multi-field save/reload, legacy synchronization, meditation typing, calculator current/legacy age | Before FC-009/010/011 |
| Dates and formulas | Fixed clock/timezone matrix, DST, leap, historical goal/schedule, serving units, BMR/macro presets | Before calculation consolidation |
| Timers | Pause/reload/resume/stop; delayed callbacks; midnight and background suspension | Before FC-008/023 |
| Wellness CRUD | All entries: create/edit/delete/history/daily reset, measurements historical scalar semantics, supplements unit variants, reminders reorder | Before component extraction |
| Widgets | Mount all types, preserve dormant data, toggle/reorder/reset; Calendar recent activity stays active | Before configurable UI integration |
| Accessibility | Semantic calendar cells, named reminders/settings, keyboard focus and touch menus | Separate focused PR |
| PWA | Actual iPhone Safari and existing Home Screen instance; real keyboard, rotation, relaunch, offline, Files/iCloud save/select/restore | Required manual acceptance for related changes |

Existing browser tests are functional assertions with geometry checks; historical screenshots are not current pixel-baseline tests. Do not introduce fragile snapshot assertions for dates/quotes. No ESLint/dead-code dependency was installed; TypeScript optional unused diagnostics and the import graph give reviewable candidates without breaking the baseline. npm audit exits1 because of pre-existing advisories; no blanket dependency upgrade.

## Final execution

Executed after batch A on 2026-10-16:

| Command | Exit | Actual result |
| --- | --- | --- |
| `npm run check` | 0 | TypeScript passes |
| `npm run audit:storage` | 0 | 217 call sites, zero errors |
| `npm test` | 0 | 56 passed, zero failed/skipped/todo (baseline48 +8) |
| `npm run build` | 0 | dist/ built; existing >500kB chunk warning, App885.97kB /235.17kB gzip |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 0 | 55 passed in 51.7s (baseline52 +3) |
| `npx tsc --noEmit -p tests/tsconfig.regressions.json` | 0 | New unit/browser test sources type-check separately from the app config |
| `git diff --check` | 0 | No whitespace errors |

Raw required-check output: [check](evidence/final-check.log), [storage](evidence/final-storage.log), [unit](evidence/final-unit.log), [build](evidence/final-build.log), [browser](evidence/final-browser.log). No required-check regression remains. The browser runner uses the production build served by the existing preview process on 4173; its filesystem dist was rebuilt before the full run. No deployment occurred.

Negative control: `npx tsx --test tests/dashboard-and-dates.test.ts` on the original selector exited1 with7 passed/1 failed, failing the no-mutation assertion. After the copied-array change all8 pass. The initial exploratory browser test looked for an entry inside a collapsed Breakfast section; opening that section corrected the test harness and all3 new browser cases pass. No food implementation change was made. An optional temporary test-tsconfig first failed to resolve vite/client from /tmp; the committed repository-relative config above passes. These authoring checks are separate from baseline/regressions.

Audit probes: synthetic initializer migration/journal/widget/DST, food quota, and isolated Chromium goal/invalid-route probes were actually executed; captured JSON is in evidence/. `npx tsx docs/revamp/evidence/reproduce-initialization.ts` reproduces the initializer/date probe in memory. The capture is from audited main; its widget mutation differs after the fix. The SSR modern-history test deliberately excludes the known mixed-migration/18:00 failure cases; it does not certify the unsafe migration.

Ledger validation compared all277 path names and SHA256 hashes against git at the recorded baseline and checked every declared full-source range. The new PR's docs/tests/config and one-line source correction were reviewed separately; they are not miscounted as files present at baseline. No physical iOS/WebKit, real keyboard/background suspension, real quota/eviction or Files/iCloud verification is claimed.
