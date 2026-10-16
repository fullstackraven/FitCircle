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

## PR #24 CI amendment review and revalidation — 2026-10-16

Reviewed the application diff, both new regression test files, their TypeScript configuration and the existing PR validation workflow against PR head `bad6259a2e2cbb291971a791f18d774eeae4866f`. The workflow ran the application type check and unit tests but did not enforce the separate regression-test type check. Added `npx tsc --noEmit -p tests/tsconfig.regressions.json` immediately after `npm run check` in `.github/workflows/storage-audit.yml`. It is a normal failing-on-error step in the existing Node 22 PR job, with no path filters or continue-on-error exemption.

This amendment changes only that workflow and this report. Production source, test implementations, storage, migrations, dependencies, service worker and iOS layout remain untouched. The baseline audit ledger continues to describe its original commit; it is not regenerated for this CI amendment.

Revalidation used Node v24.19.0, npm 11.9.0 and system Chromium `/usr/bin/chromium`, with a freshly rebuilt production preview:

| Command | Exit | Actual amendment result |
| --- | --- | --- |
| `npm run check` | 0 | Application TypeScript passed |
| `npx tsc --noEmit -p tests/tsconfig.regressions.json` | 0 | Regression test TypeScript passed; now enforced in PR CI |
| `npm run audit:storage` | 0 | 217 call sites, zero audit errors |
| `npm test` | 0 | 56 passed; zero failed, skipped or todo |
| `npm run build` | 0 | Passed in 11.29s; existing chunk warning remains; App bundle unchanged at `App-uegoNRCg.js`, 885.97kB /235.17kB gzip |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` (first amendment run) | 1 | 54 passed, one diagnostic snapshot failure in 55.8s; details below |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/browser/layout-diagnostics.spec.ts --grep 'read-only probe reports' --repeat-each=3` | 0 | All three repetitions passed in 2.8s |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` (complete rerun, no retries configured) | 0 | All 55 passed in 53.8s |
| `git diff --check` | 0 | No whitespace errors |

The first browser run exposed a timing-sensitive existing test: `layout-diagnostics.spec.ts:36` compared a pre-capture storage snapshot of `{}` with a post-capture snapshot containing the food database and migration flag. The test awaits a dynamic diagnostic import between snapshots; asynchronous application food initialization can finish during that interval. Shell bottom (844) and scroll position (240) stayed unchanged. This is evidence of test setup racing initialization, not proof that the diagnostic wrote storage. No diagnostic/test/application changes were made to hide the failure. The isolated repetitions and full rerun passed; the timing risk remains documented for a separate test-harness follow-up. The original evidence/final-*.log files above remain the earlier batch A captures, not replacement evidence for this rerun.

No physical iPhone Safari/PWA, actual keyboard/backgrounding, device storage or Files/iCloud verification was performed. No merge or deployment is authorized by this amendment.

After this PR is approved, the next independent PR must address **FC-001 and FC-002 together**, with extensive synthetic legacy-data regression fixtures before changing migration behavior. Cover numeric-only, mixed and modern logs; populated/missing goal histories; sparse/tied/zero counts; explicit historical goalAtTime values; repeated mounts/reloads; genuine 18:00 timestamps including fractional seconds; legacy string journals and known estimated timestamps. Assert that authoritative historical goals and genuine journal timestamps remain unchanged, preserve ambiguous original data, and test persistence/backup round trips so silent alteration cannot pass unnoticed. Do not begin that implementation within PR #24.
