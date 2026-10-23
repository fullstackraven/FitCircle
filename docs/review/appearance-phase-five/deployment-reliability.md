# PR #76 deployment failure and correction

## Failure

The merged release (`da350a0`) failed in `npm run test:e2e` in
[Pages run 40021344573](https://github.com/fullstackraven/FitCircle/actions/runs/40021344573).
TypeScript, unit tests, and the production build passed. Pages artifact upload
and deployment were skipped, leaving the previously deployed application intact.

The original runner's log download is inaccessible from this environment (HTTP
403). The same merged application was therefore tested in the PR workflow with
GitHub annotations enabled. Two completed runs reproduced the same four failures:

- `appearance-baseline.spec.ts`: Home reference, 778 differing pixels.
- `appearance-phase-two.spec.ts`: Home reference, 778 differing pixels.
- `appearance-phase-three.spec.ts`: Food Tracker reference, 7,870 differing pixels.
- `appearance-phase-four.spec.ts`: Cardio reference, 7,598 differing pixels.

[Reproduction run](https://github.com/fullstackraven/FitCircle/actions/runs/40024223851)
finished with **343 passed, 4 failed**. These were exact screenshot comparisons;
barcode, backup, production appearance, and other functional tests passed.
A second reproduction produced the same result:
[40025004409](https://github.com/fullstackraven/FitCircle/actions/runs/40025004409).
This reproduces the deployment blocker; it cannot recover the unavailable original
log or prove that the original run had no additional intermittent failures.

## Cause and controlled comparison

The image references were captured with Debian Chromium **154.0.8037.57**.
CI instead downloaded Playwright's Chromium **156.0.8078.4** headless shell and
used a moving `ubuntu-latest` image. The environments also differed in Fontconfig
text-rendering defaults. Exact screenshot checks are sensitive to both.

Inspecting pixel differences localized Home's changes to metric-font glyphs:
the wordmark, workout count, and goal number. Surrounding geometry, surfaces,
and controls matched. Using Chrome for Testing 154 fixed the Home comparison;
Food Tracker still differed because of text rasterization. Applying the reference
Fontconfig settings (grayscale, slight hinting) then passed the entire original
Phase 1 Dark reference test on Ubuntu 24.04:
[controlled verification](https://github.com/fullstackraven/FitCircle/actions/runs/40027709364).

Disabling LCD text with a browser flag was also tested, changed the references'
rendering, and was discarded. No original images or assertion tolerances changed.
The temporary diagnostic workflow has been removed.

## Correction

- Pin the build runner to Ubuntu 24.04 rather than a moving OS image.
- Use the official Chrome for Testing **154.0.8037.57** executable for browser
  regression checks, matching the reference browser version.
- Explicitly use reference Fontconfig settings from
  `tests/fixtures/screenshot-fonts.conf`. Existing system font discovery remains
  enabled; this does not install or ship a replacement application font.
- Match the reference launcher's GPU rasterization setting.
- Explicitly use two workers; no retries, timeout increases, test exclusions,
  screenshot regeneration, or assertion relaxation.
- Run the same Pages build/browser checks on pull requests. PR runs cannot upload
  a Pages release artifact or execute the deployment job.
- Add GitHub test annotations and retain failure traces/results for seven days.
  PR checks have separate concurrency groups from main deployments.

The pinned browser is a test dependency, not a browser shipped to users. Future
browser/runner upgrades should include a deliberate visual comparison and review;
a dependency update must not silently change the rendering environment.

## Validation and scope

Local checks completed successfully: `npm run check`,
`npx tsc -p tests/tsconfig.regressions.json`, `npm test` (298 tests),
`npm run audit:storage`, and `npm run build`.
The original Dark reference test also passes locally with the test Fontconfig file.

Full local verification command:

```sh
FONTCONFIG_FILE="$PWD/tests/fixtures/screenshot-fonts.conf" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
npm run test:e2e -- --workers=2
```

Final full-suite results and links to the matching GitHub checks are recorded in
[PR #77](https://github.com/fullstackraven/FitCircle/pull/77). The required browser
check runs on the actual GitHub runner before merge.

An initial local full run passed 346 tests and timed out once in the existing
legacy service-worker update fixture (`update.spec.ts:76`). Its six-test suite
passed on rerun; completed CI reproductions passed it as well. This separate
intermittent result is disclosed rather than attributed to the screenshot defect.

Only CI configuration, test rendering configuration, and this review document
change. Application code, appearance behavior, fitness calculations, storage,
backup formats, service-worker code, and original screenshot baselines remain
unchanged. There is no merge or deployment from this investigation PR.
