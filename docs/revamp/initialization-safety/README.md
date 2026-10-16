# FC-003, first domain: validated workout initialization

Base: updated main `453e6fa` after PR #26 merged. See [the complete initialization/writer audit](AUDIT.md) for every persistence-owning hook/service and page-owned fallback writer. **This PR protects workout-tracker-data only; it does not claim to complete FC-003 across all domains.** Other domains need independent reviewable PRs with their own legacy/malformed fixtures. FC-004, FC-005 and diagnostic issue #25 remain separate.

## Before and after

Previously, useWorkouts treated bad/empty JSON as a fresh empty document, then its mount effect saved those defaults over the original stored string. Valid JSON with unexpected/nested-invalid/incomplete shapes was not validated and could be reserialized or crash a reader. A failed storage read had only generic startup recovery.

Now the hook reads once and validates before returning initialized state. A storage read failure, invalid JSON or runtime-incomplete/invalid document throws a typed error **before the hook's effects or its caller's render can commit**. No fallback state is returned for existing bad data; therefore autosave cannot run with a replacement empty document. Only getItem returning null (an actually absent key) initializes defaults.

The new boundary catches only this workout initialization error. It leaves other application errors on their existing recovery path. On failure it explains why the view was stopped, offers an original-data recovery download when the source could be read, provides explicit retry, and links to the existing Settings restore flow. It adds no reset/delete action. Normal valid navigation/layout and all existing workout actions are untouched.

The raw download uses the already-supported legacy raw-string JSON representation `{ "workout-tracker-data": "original stored string" }`. JSON escaping preserves whitespace, incomplete source JSON and Unicode faithfully when decoded. The download is labelled as a recovery copy, not a validated complete backup; invalid inner data is deliberately still rejected by the existing importer. No record contents are inserted into the screen or custom error messages. Error data stays in memory, never a new storage key. If browser storage cannot be read, the original download is disabled rather than fabricated.

Settings remains reachable without initializing useWorkouts. A malformed source still blocks Complete Backup export as before; it is never silently omitted. The user can preserve its raw recovery copy and explicitly choose a verified JSON backup through the existing confirmation/validation/rollback flow. Reload after restoration initializes the real restored document. No automatic restore occurs.

## Validation and data compatibility

The backup schema's workout definition is exported and referenced by the existing schema table without changing its definition or acceptance behavior. The runtime reader reuses that schema and additionally requires dailyLogs, journalEntries and routines containers and a string lastDate when supplied. Those collections are required by runtime readers; their absence is not evidence that replacing them with empty collections is safe. Older partial backups remain accepted by the unchanged importer, but may reach recovery if their workout document lacks runtime-required collections. Keep the original file and repair/restore a complete document deliberately, rather than automatically filling missing records.

The runtime reader returns the original parsed value, not normalized validator output. Numeric/object logs, exact goalAtTime values, goal histories, string/object journals, fractional/estimated timestamps, unknown metadata, and legacy array workout containers remain unchanged. No storage key, serialized format, backup version, migration, formula, dependency or service-worker behavior changes. The prior FC-001/002 protections remain covered.

## Regression-first evidence

Commit `508a9b5` introduced malformed-data tests before production edits. On unchanged main, 46 new unit cases ran with **25 passed / 21 failed** (20 malformed/incomplete cases plus denied-read handling were not safely blocked). Selected browser cases for truncated JSON and JSON null both failed: one exposed the automatic overwrite; the other lacked the recovery UI. This intentional negative control distinguishes existing failures from introduced regressions.

Fixtures include truncated JSON, empty/whitespace existing strings, null, primitives, arrays, empty/partial containers, absent required collections, invalid nested workout/log/journal records and an invalid lastDate type. Each unit failure case repeats three times and requires the original source string in the typed error. Existing 24 historical fixtures are accepted without initializer writes; an extra array-container case protects legacy acceptance. Missing storage is separately tested as a valid fresh initialization.

Browser tests seed once from Profile and assert exact source-string preservation on Home and Calendar, across reloads, and after downloading the raw recovery copy. They ensure no workout editing controls appear over fallback state. Additional cases exercise verified backup restoration, denied read plus explicit retry, quota failures with a valid existing document across reloads, and valid legacy array containers. All data and browser contexts are synthetic; no installed profile or personal backup is used.

## Remaining limitations

- Other domains remain unsafe until their scoped follow-up PRs; the audit marks each path open. In particular food singleton initialization can still run on unrelated routes. This PR does not claim to freeze every origin key when a workout read fails.
- Existing valid-state autosave quota errors still follow the hook's existing console-error behavior. The tests verify they leave original persisted workout bytes intact; they do not implement food-save reporting (FC-004), pending-edit recovery or a new transaction system.
- External edits/corruption after successful initialization and concurrent writers remain FC-005. This guard is not a revision/conflict detector or shared-store redesign.
- Device eviction, permanent storage denial, actual Files/iCloud workflows and physical iPhone/WebKit are not verified. Startup failure before the workout reader (for example access to the restore journal denied globally) remains the existing startup recovery path.
- Raw recovery downloads require manual care and are sensitive. No automatic repair, deletion, inferred historical data or new cloud service is introduced. Oversized/import-resource limits remain FC-031.
- Diagnostic test issue #25 remains untouched. Normal screen styling, navigation, viewport/keyboard logic and static cache/update implementation are not modified.

## Execution results

Executed on 2026-10-16 with Node v24.19.0, npm 11.9.0 and system Chromium, using a fresh production build before the full browser run:

| Command | Exit | Actual result |
| --- | --- | --- |
| `npm run check` | 0 | Application TypeScript passed |
| `npx tsc --noEmit -p tests/tsconfig.regressions.json` | 0 | Existing and new test/fixture sources passed; existing PR CI enforces this command |
| `npm run audit:storage` | 0 | 215 call sites; zero audit errors; no exemptions or registry changes |
| `npm test` | 0 | 151 passed: previous 104 plus 47 new initialization cases; none failed/skipped/todo |
| `npm run build` | 0 | Passed in 9.77s; existing >500kB chunk warning remains |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 0 | 103 passed in 1.4m: previous 79 plus 24 new browser cases; no retries |
| `git diff --check` | 0 | No whitespace errors |

The initial targeted recovery suite also passed all 24 browser cases before the complete run. Pre-correction negative controls are recorded above; no post-correction validation failure remains. Diagnostic issue #25 passed this run and is not claimed fixed. Existing historical preservation, backup/rollback, offline/update, viewport/overlay, routine, food and navigation checks all remain in the full suites. Browser results are Chromium only, not physical iOS/PWA verification.

## Rollback

No reverse data migration is necessary: no new stored format or key is written. Reverting the guard reintroduces the old fallback-overwrite risk and must not be treated as data recovery. Preserve raw copies/verified backups and prefer a forward correction. Open a separate PR for review only; do not merge or deploy automatically.


## Final recovery-safety review amendment — 2026-10-16

Reviewed PR head `d80e4d8` and amended only the recovery component, its browser regressions and this report. No importer, storage schema/key/format, other domain, styling, worker or viewport code changes. No merge or deployment.

### Download handoff and truthful status

The prior component removed the anchor and revoked its blob URL synchronously after click, then claimed the file was downloaded. Browsers can consume the blob after that call returns, and a web page cannot confirm completion of an iOS Files save. The recovery path now initiates the anchor click synchronously within the user gesture, retains the non-tab-focusable anchor and URL for 60 seconds, then removes/revokes them together. Cleanup is time-bounded even if click throws. No unmount cleanup revokes the URL prematurely. Navigating away may end the document and its resources; the delay is a best-effort handoff accommodation, not proof of OS save completion.

Status now says **Download requested**, explains Share → Save to Files if a preview opens, and asks the user to verify the saved file before restoring. Synchronous initiation failure reports failure and retains stored data. No message claims the browser or OS completed a save. The existing recovery JSON representation is unchanged.

Repository review found no shared proven download utility. Settings has similar immediate-revocation local code, so copying that pattern would not resolve this concern. The separate Complete Backup exporter is not modified by this focused amendment.

New Chromium regression tests intercept revocation and use a simulated clock to verify that the recovery URL/anchor survive the click and are cleaned after the delay. They check request-only messaging and blocked initiation without storage changes. Existing tests still read actual downloaded files and compare the exact decoded stored string. This is not a Safari/WebKit or physical installed-iOS test. Actual iOS preview/Files/Share behavior remains manual acceptance work in a disposable synthetic-data test environment; do not corrupt a real installed app to test it.

### Accepted incomplete backups through the full restore workflow

Added end-to-end cases for legacy object values, legacy raw stored strings and version 2 without a manifest. Each imports an otherwise accepted document with real synthetic workouts, authoritative historical goalAtTime and fractional journal timestamps, but no routines collection. The existing confirmation is shown; after acceptance the exact partial document is stored and remains byte-identical through blocked initialization/reload and recovery download. Missing routines are never silently filled; workout, log and journal records are not inferred or discarded. Unrelated origin data and a separate legacy workout-log key remain unchanged.

The recovery explanation now explicitly says **workout tracking has not resumed** if the screen returns after an older import. Settings does not display an import-success message before this blocked state. The user can download the original imported document, return to Settings, and explicitly restore a complete verified backup; the tests confirm normal workout rendering resumes only after that complete restore. A cancellation case verifies the original complete document is untouched when the user declines a partial import.

Compatibility does not mean merging partial workout collections into the previous document: existing confirmed restore semantics still replace matching keys. The confirmation states that matching items will be replaced. This amendment does not change that behavior or promise recovery of records omitted from a user-confirmed replacement; it prevents subsequent initialization from erasing or inventing data in the imported document.

### Actual revalidation

Before the component amendment, the two focused negative controls failed on immediate revocation and missing explicit blocked-operation wording. After amendment all six focused cases passed in 6.1s. Full checks were then rerun against the rebuilt production app (Node v24.19.0, npm 11.9.0, system Chromium):

| Command | Exit | Actual result |
| --- | --- | --- |
| `npm run check` | 0 | Application TypeScript passed |
| `npx tsc --noEmit -p tests/tsconfig.regressions.json` | 0 | Regression TypeScript passed |
| `npm run audit:storage` | 0 | 215 call sites, zero errors |
| `npm test` | 0 | All 151 passed; no failures/skips/todo |
| `npm run build` | 0 | Passed in 10.75s; existing chunk-size warning remains |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 0 | All 109 passed in 1.5m, no retries (previous 103 + 6 focused cases) |
| `git diff --check` | 0 | No whitespace errors |

No post-amendment validation failures remain. Physical iOS Safari/PWA, real Files saving and WebKit engine verification are not claimed. FC-004/005 and diagnostic issue #25 remain separate.

After PR #27 is merged, the next independent FC-003 candidate is cardio initialization: its load/migration and autosave effects can write defaults before loaded state commits, and malformed reads can also fall back to defaults. Start from then-current main with regression tests covering primary/legacy formats and load/save ordering before editing that domain. No cardio changes are included here.
