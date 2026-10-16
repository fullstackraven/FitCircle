# FC-001 / FC-002: preserve historical workout and journal records

Started from updated main `15dffdebc99ff5d4cfdab3caf73c878255f1cd20`, the merge of PR #24. This is a separate correction, not an extension of that audit PR. All fixtures and browser profiles are synthetic. No installed app, personal backup, browser storage or Files/iCloud account was accessed.

## Root causes and policy

`useWorkouts` previously ran two write-capable transformations in its initializer:

- The workout migration inferred goals from nearby completion frequencies. One positive numeric log or missing goal history triggered rewriting across workouts, including records with explicit `goalAtTime`. Repetitions do not establish the intended goal; ties and sparse history make that inference especially ambiguous.
- Journal cleanup treated any timestamp containing `T18:00:00` as an estimate, removed the timestamp, and logged journal text. A genuine timestamp and a historical estimate can have exactly the same stored representation, including `.000Z`. Fractional seconds and timezone offsets also matched.

The correction returns the parsed stored document without either transformation. The existing numeric/object workout readers, string/object journal readers, editing operations, daily reset, autosave effect and all storage/backup validators remain intact. No replacement migration, new marker/key, format conversion or timestamp heuristic is introduced. Removing the two transformations also removes their two direct storage-write call sites and journal-text logging; the normal save effect remains.

| Stored input | Before | After |
| --- | --- | --- |
| Mixed numeric count 5 and `{count:8, goalAtTime:20}` | Goal inference could replace the explicit 20 with 5 | Both the numeric value and explicit goal remain unchanged |
| Numeric-only completion history | Converted to objects with guessed historical goals | Original numeric logs remain readable and retain their original representation |
| Modern history with missing/empty/incomplete goal history | Could be rewritten using completion counts | Explicit goals and existing goal history remain unchanged |
| Sparse, zero-count, tied or orphaned history | Heuristic could treat partial counts as goals or rewrite other records | Original counts, IDs, goals and additional fields are retained |
| Genuine `18:00:00.123Z`, `.000Z`, higher precision or offset time | Timestamp discarded when the substring matched | Exact timestamp string and journal text are retained |
| Legacy journal string or old estimated timestamp without provenance | Estimate-shaped timestamp could be removed | Original representation retained; no attempt to decide whether an ambiguous time was genuine |

## Regression-first evidence

Before changing production code, commit `6e5ef0b` introduced 24 independent document fixtures, 48 unit cases and 24 browser cases, and extended the existing regression TypeScript config. On unchanged main, the new unit suite ran with **16 passed / 32 failed**. Two selected real-browser cases (mixed numeric/modern history and a genuine fractional 18:00 timestamp) both failed their preservation assertions. The test-only TypeScript check passed. These are intentional negative controls demonstrating the defects, not failures introduced by the correction.

Fixtures cover complete, omitted, empty and incomplete goal histories; changing authoritative goals; numeric and mixed logs; sparse/leap-day history; zero counts and zero goals; tied frequencies; an unrelated legacy workout; deleted-workout logs; extra entry metadata; empty history; genuine exact/fractional/high-precision/offset journal timestamps; legacy strings and empty entries; old estimated times without stored provenance; and a combined workout/journal document.

Each unit preservation case runs the real hook initializer three times and asserts unchanged records, unchanged stored bytes and zero initializer writes. It also exercises numeric/modern count readers and string/timestamp journal accessors. SSR deliberately does not run React effects: the browser cases provide that coverage.

Each backup case exports version 2, serializes/deserializes it, restores current v2 and older v2 without a manifest, and restores legacy plain objects and raw stored JSON strings. It then initializes the hook and reexports, comparing the exact original workout document, separate legacy logs and unrelated target keys. That is 96 restore variants across 24 fixtures. No backup implementation or format changes were needed.

Each browser case seeds once from Profile (which does not mount useWorkouts), opens Home, reloads, navigates to Calendar (which mounts multiple readers), and reloads again. It waits for mount frames and checks the complete persisted document, legacy logs and unrelated sentinel after every step. It never reseeds on reload. A fixed test clock keeps ordinary daily counter reset separate from historical migration behavior. The browser tests also reject the old journal-text cleanup log message.

## Compatibility and limits

- Legacy numeric logs intentionally retain unknown historical goals. Existing statistics may still use the current workout goal as a display fallback for those numeric records. This PR does not claim to recover the true old goal or change calculation formulas; it prevents saving a guess over the original evidence.
- Estimated timestamps without trustworthy stored provenance are preserved, even if displayed as times. There is no existing provenance flag that safely distinguishes them from genuine times; no flag or new format is added here.
- Data already rewritten by previous releases cannot be reconstructed automatically. Preserve original backups; any recovery from them requires separate verified comparison, not another inference pass.
- Existing JSON autosave can normalize whitespace, and ordinary daily reset still changes today's counter/lastDate. History values and formats remain preserved; byte equality in the initializer test is not a promise that all later user edits/autosaves keep original JSON whitespace.
- Malformed/wrong-shaped JSON initialization (FC-003), cross-tab stale writers (FC-005), pause recovery and other audit findings remain separate. This is not a shared-store redesign or a claim of fully transactional browser storage.
- No navigation, styling, service worker, iOS viewport, dependencies, other hooks, or backup implementation changes. No physical iPhone/WebKit, real keyboard/backgrounding, device eviction or Files/iCloud round trip was performed.

## Separate test-harness cleanup

The timing-sensitive `layout-diagnostics.spec.ts` storage snapshot is tracked independently as [issue #25](https://github.com/fullstackraven/FitCircle/issues/25). It can race asynchronous food initialization during a dynamic import. Do not weaken its read-only assertions or change application initialization to silence it. No harness correction is bundled here.

## Validation

Executed on 2026-10-16 using Node v24.19.0, npm 11.9.0 and system Chromium. The production dist/ was rebuilt before the browser run. The existing PR workflow uses Node 22 and enforces the regression test TypeScript config; that config now includes the new tests and their imported fixtures.

| Command | Exit | Actual result |
| --- | --- | --- |
| `npm run check` | 0 | Application TypeScript passed |
| `npx tsc --noEmit -p tests/tsconfig.regressions.json` | 0 | Existing and new regression test sources type-check |
| `npm run audit:storage` | 0 | 215 call sites, zero errors; two removed initializer write sites explain the decrease from 217 |
| `npm test` | 0 | 104 passed: existing 56 plus 48 historical-integrity cases; zero failed/skipped/todo |
| `npm run build` | 0 | Passed in 11.38s; existing >500kB chunk warning remains |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 0 | 79 passed in 1.2m: existing 55 plus 24 historical-integrity browser cases; no retries needed |
| `git diff --check` | 0 | No whitespace errors |

All 24 browser fixtures passed with actual mount effects, Home/Calendar navigation and two reloads each. The separately tracked diagnostic test also passed this run; its intermittent race is not claimed fixed. The pre-correction negative controls above were run deliberately before production edits. No introduced validation failure remains. A passing Chromium run is not physical iPhone or Safari/PWA verification.

## Rollback and delivery

Open a separate PR for review; do not merge or deploy automatically. Reverting this code correction requires no reverse migration because it writes no new format. A rollback to the old implementation would reintroduce the destructive inference/cleanup, so do not use it as a data-repair procedure. Keep original backups and prefer a forward correction if a regression is discovered.
