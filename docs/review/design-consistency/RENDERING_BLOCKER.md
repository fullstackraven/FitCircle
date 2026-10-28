# Unresolved strict-screenshot blocker

The application-wide presentation implementation is ready for review. Required CI is **not green**. This document separates the remaining test-rendering blocker from the corrected application presentation defects.

## Current failing check

Production-validation workflow [40751418817](https://github.com/fullstackraven/FitCircle/actions/runs/40751418817), source `5bc24955030c001f4ec078dbf55cf6c7c1347dae`:

- `browser (1/4)` has 138 passing cases and one failure.
- Failing case: `tests/browser/appearance-phase-four.spec.ts:19`, **dark: remaining routes, goals and nested editors preserve visual baseline**.
- Failing reference: `energy-level.png`, three comparator-visible pixels.
- The other three browser shards, prepare, backup coverage, and release classification pass. The aggregate build gate correctly fails; deploy and release recording are skipped.

The strict local visual run had 73 passes and one one-pixel Supplements reference failure. An isolated rerun then encountered the three-pixel Energy reference difference. These results are not represented as passing runs.

## Bounded software-rendering attempt

Per the owner's explicit limit, one final controlled repeatability attempt was made **without changing any reference images**:

- Installed Chromium **154.0.8037.57**, Debian 13; same executable for every sample.
- Test-only launch arguments: `--disable-gpu`, `--disable-gpu-rasterization`, `--force-color-profile=srgb`.
- Same unchanged built artifact: `index.html` SHA-256 `79a8ceb0fbd0e14a1d8411476f8d8aa2186afae5d6515b007f21b35e8c82770c`.
- Repository font configuration, 390×844 viewport, DPR 1, en-US, America/New_York, fixed test clock and the existing synthetic Wellness fixture.
- Three independent browser launches; three captures per screen per launch: 18 actual PNGs in total.

Initial images can precede the existing hooks populating the selected value/list. These expected loading transitions are **not** classified as raster instability. The third image per launch shows the seeded loaded data and is used for the settled comparison:

| Settled screen | Independent samples | Unique RGBA hashes | Difference from first settled sample |
| --- | --- | --- | --- |
| Energy | 3 | 1 | None |
| Supplements | 3 | 2 | 10 RGBA pixels, maximum channel difference 1; bounds x=16–18, y=104–111 |

All other pixels in the settled Supplements images are identical. This is evidence of unresolved exact-rendering variation, not a changed supplement selection, quantity, log or layout. It does **not** prove a specific GPU-driver cause: the variation persists with GPU rasterization disabled. The software setting therefore does not meet the repeatability prerequisite and is **not adopted**.

The [machine report](rendering-evidence/report.json) includes hashes, capture order, complete comparisons, environment details and filenames. Representative settled images:

- [Energy launch 1](rendering-evidence/energy-level-0-2.png) / [launch 2](rendering-evidence/energy-level-1-2.png).
- [Supplements launch 1](rendering-evidence/supplements-page-0-2.png) / [launch 2](rendering-evidence/supplements-page-1-2.png).

## Integrity and stopping boundary

The original Playwright launch configuration, assertions, `threshold: 0` and `maxDiffPixels: 0` remain intact. No test is skipped, no screenshot region is masked, and no diagnostic pixel patch, warm-up capture, normalization step or renderer experiment is retained in test code. Intentional UI references committed before this bounded attempt are retained for review; there is no blanket reference replacement to hide the blocker.

Application rendering, tracking, personal data, backups, service workers and deployment infrastructure are unchanged by this investigation. **Investigation stops here** as instructed. PR #104 remains unmerged and undeployed; it is not claimed fully validated or merge-ready while this required check fails.

## Proposed separate follow-up

Create a small visual-test reproducibility follow-up with the same unchanged fixture/build and explicit loaded-record readiness. Pin one exact browser/font/environment artifact across capture and CI, compare consecutive settled images across fresh contexts, and isolate the remaining paint/compositing difference. Require repeatable RGBA output before generating references. Retain the current assertions and zero-difference policy. This is a test-environment/synchronization task, not another application redesign or a reason to alter fitness data.
