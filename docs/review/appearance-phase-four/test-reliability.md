# PR #75 final browser-test reliability review

## Investigation

The barcode application, `barcode-lookup.ts`, Food Tracker, service-worker generator, scroll-lock provider and both affected original tests are unchanged between merged Phase 3 (`770815c`) and Phase 4 (`a1b0b96`). `docs/review/modal-fields/README.md` already records the automatic-cache test failing with “Failed to fetch” before Phase 4, then passing independently.

### Barcode lookup and automatic caching

All three external-lookup scenarios already use test-local `context.route()` responses for Open Food Facts. They do **not** intentionally use the live nutrition service. Diagnostic listeners recorded synthetic HTTP 200 JSON responses with Playwright-generated CORS headers; no missing CORS header was observed. The original symptom alone does not establish an unmocked live request.

The production worker is intentionally retained: the scan/cache test verifies a real service-worker-controlled offline reload. Each test gets a fresh browser context and local fixtures; storage overrides in the quota-failure case belong to that context. There is no shared IndexedDB fixture or worker-wide database. API mocks are context-local, and the worker returns without `respondWith()` for cross-origin requests. There was no evidence of cross-test storage contamination or a nutrition/application regression. Parallel workers are not a sufficient explanation: the earlier PR review also recorded the lookup failing in a serial full run. Worker scheduling can expose asynchronous setup races, but changing worker count or retries is not the correction.

A confirmed lifecycle race exists in the original setup: seeding navigates from Profile to Food Tracker while the production worker is installing/claiming clients. `navigator.serviceWorker.ready` can resolve for an active registration while the current document remains uncontrolled. In a 40-case unmodified-setup stress run, 3 scan/cache cases failed the existing worker-controller assertion; 37 passed. A preliminary 20-case run similarly returned 19 passed / 1 controller failure. Waiting for the active registration and reloading into its scope before lookup produced 16/16 passing diagnostic cases.

The narrow correction waits for worker readiness, reloads into a controlled document, asserts control and waits for the dashboard before installing the existing API fixture. It applies only to the three mocked external-lookup scenarios. Each now also checks the received HTTP status and exact synthetic product name. This makes the intended test-local response explicit and keeps worker installation/claiming out of lookup and offline-transition timing. The real offline reload, nutrient/caching assertions and quota/retry semantics remain intact.

**Diagnostic boundary:** the earlier “Failed to fetch” events did not have network traces. That exact error was not reproduced with diagnostic listeners in this investigation. The confirmed controller race and its correction must not be presented as proof of the precise Chromium/network event behind every previous error. Repeated final-suite outcomes are reported below separately.

### Barcode screenshot / background scroll

The failing image differs only in the page behind the panel; the barcode panel matches. Tracing `.app-content` showed a bottom position of 250px and an intermittent position of 204px after dialog transitions. Outgoing Radix panels can remain during close animations and restore focus after the next panel appears. A test-local attempt to normalize scroll **before** opening the next panel was insufficient: a stress run still returned 9 failures / 31 passes, including the same background difference in Food Search.

The correction waits for outgoing closed panels to unmount and one open panel to remain, then explicitly establishes the original baseline's bottom-of-page scene for Food Search and Barcode. The actual page and whole-screen screenshot assertions remain unchanged (zero pixel tolerance, no masks, no baseline regeneration). New assertions verify that the established background position remains unchanged through the Barcode capture and invalid-input interaction. Existing dedicated modal scroll/keyboard tests remain enabled.

### Additional appearance check found during repetition

The 40-case combined final-fixture stress run passed all 30 barcode cases and all 10 barcode screenshot checkpoints. One complete Phase 3 visual case failed later at Measurements (39/40 complete cases passed): the SVG line was hovered while Recharts' JavaScript animation was growing. Playwright scrolled the horizontal chart carousel to a different position as a result. Waiting for all three fixture data-point dots (rendered after animation completes) stabilized the line but did not reproduce the original carousel framing: all 6 diagnostic repetitions differed. The final fixture waits for those dots, preserves the hover interaction, and explicitly sets the original 390px baseline's 77px horizontal carousel offset. This defines the existing visual scene without changing the chart, suppressing pixels or replacing a baseline. It uses rendered-state assertions, not a sleep or timeout increase.

### Phase 3 comparison

An isolated source archive of merged Phase 3 was built with the same installed dependencies and Chromium, using separate preview/development ports 4175/4186. The original two barcode cases passed 20/20 (10 repetitions, two workers). This does not prove the old tests were universally stable; the earlier committed failure report and new lifecycle reproduction establish the narrower limitation. Production barcode/networking code has not been changed to make a browser test pass.

### Diagnostic commands

The temporary diagnostic listeners only recorded failed requests, response/CORS headers and browser console errors; they were removed from the final tests.

- Original setup: `npx playwright test tests/browser/nutrition.spec.ts --grep 'scans open Add Entry|automatic scan caching failure' --repeat-each=10 --workers=2 --trace=retain-on-failure`: 19 passed / 1 controller failure (32.6s).
- Controlled-document experiment: the same command with `--repeat-each=8`: 16 passed (24.6s).
- Original setup stress: the same command with `--repeat-each=20`: 37 passed / 3 controller failures (58.8s).
- Phase 3 source archive: `git archive 770815c` extracted outside the working tree; `npm run build`, then the original two-case command with `--repeat-each=10`, on alternate server ports: 20 passed (34.7s). No Phase 3 source or golden baseline in this PR was replaced.
- Screenshot diagnosis: `npx playwright test tests/browser/appearance-phase-three.spec.ts --grep 'dark: nutrition, calculator and measurements visual' --repeat-each=4 --workers=2`: 4 passed with tracing of the original scroll setup; later combined runs exposed why logging/isolated passes alone were insufficient.

## Scope

Only `tests/browser/nutrition.spec.ts`, `tests/browser/appearance-phase-three.spec.ts` and this review documentation change in the reliability correction. No retry setting, timeout, worker count, assertion tolerance, baseline image, application code, cache schema, calculation, production network behavior or service-worker behavior is changed. Phase 4 application changes remain presentation-only; production's existing Dark-only gate and absence of a public appearance selector are retained.

## Final commands and results

All browser commands use the existing configuration and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` (Chromium 154.0.8037.57 on Debian, Node v24.19.0). Each Playwright invocation runs sequentially; two workers execute within that invocation.

| Command | Result |
| --- | --- |
| `npm run check` | Passed |
| `npx tsc -p tests/tsconfig.regressions.json` | Passed |
| `npm test` | 294 passed |
| `npm run audit:storage` | 160 storage call sites, 0 errors |
| `npm run build` | Passed; build assets byte-identical to the existing Phase 4 build |
| `npx playwright test tests/browser/nutrition.spec.ts tests/browser/appearance-phase-three.spec.ts --grep 'scans open Add Entry\|automatic scan caching failure\|missing core barcode\|dark: nutrition, calculator and measurements visual' --repeat-each=10 --workers=2` | 39 passed / 1 later Measurements screenshot failure (1.5m); all 30 barcode cases and 10 barcode screenshot checkpoints passed; subsequent chart correction passed 4/4 |
| `npx playwright test tests/browser/nutrition.spec.ts --workers=2` | 21 passed (26.6s) |
| `npx playwright test tests/browser/appearance*.spec.ts --workers=2` | 54 passed (1.4m) |
| `npm run test:e2e -- --workers=2` — first full run | 318 passed (5.0m) |
| `npm run test:e2e -- --workers=2` — second consecutive full run | 318 passed (4.9m) |

The final-fixture stress run passed all 30 barcode cases and all 10 barcode screenshot checkpoints; its one later chart failure is documented above. After the chart fixture correction, `npx playwright test tests/browser/appearance-phase-three.spec.ts --grep 'dark: nutrition, calculator and measurements visual' --repeat-each=4 --workers=2` passed 4/4 (26.6s).

Original Phase 1–3 golden screenshots are preserved. Review-image outputs produced by existing tests are restored rather than committed as new baselines. Physical iPhone Safari/PWA validation remains manual; Chromium repetition cannot prove the absence of every future intermittent failure.

Both final full runs passed consecutively without retries. These results support the corrected setup's observed reliability; they do not retroactively prove the low-level cause of the earlier untraced network errors. Production gate, backup/data-integrity, original appearance and offline-cache tests passed in both runs.
