# Mandatory validation and advisory visual review

FitCircle releases are gated by application behavior and data safety, not exact-pixel image equality. This policy resolves the release-blocking aspect of [issue #105](https://github.com/fullstackraven/FitCircle/issues/105); it does not claim the renderer variation itself is fixed.

## Required release gate

The existing `prepare`, four `browser` shards, and aggregate `build` gate remain mandatory. They retain TypeScript, unit tests, storage audit, backup/restore tests, functional browser assertions, accessibility/contrast, responsive layout, overflow/containment, safe areas, dock access, Light/Dark/System appearance, and PWA behavior. The independent storage/backup and PR release-classification checks also remain unchanged.

`build` still requires successful `prepare` and every browser shard. `deploy` still requires `build`, an eligible main push, and a publishable release plan. `record_release` still requires successful deployment. The exact built artifact is tested and deployed once. No production publication happens for a PR or manual validation run.

No mandatory job has `continue-on-error`. No browser spec is skipped. Semantic computed-color JSON snapshots remain mandatory; only screenshot *image* equality moves to advisory review.

## Screenshot capture and comparison

The same seven browser specs still navigate, exercise controls, validate behavior and capture their screenshots:

- `appearance-baseline.spec.ts`
- `appearance-phase-two.spec.ts`
- `appearance-phase-three.spec.ts`
- `appearance-phase-four.spec.ts`
- `calculator-route.spec.ts`
- `dynamic-overview.spec.ts`
- `home-workout-cards.spec.ts`

Only their `toHaveScreenshot` calls become `captureVisual`. This helper writes the current PNG plus a small comparison manifest into the test's output directory and attaches the PNG. It preserves the existing reference path and comparison options. Existing non-image assertions continue executing in the mandatory job even when the image differs. The Energy capture additionally verifies the seeded level, saved state, slider and calculated history before capture; no delay or warm-up is used.

Every browser shard uploads `browser-test-results-N`, including on success. These artifacts retain current images, manifests, and any functional failure traces.

The separate **Advisory screenshot review** job downloads those artifacts and runs `npm run test:visual`. It only compares image files; it launches no browser, exercises no application behavior, and contains no functional/data-integrity assertions. This image-only job has `continue-on-error: true`, and neither `build`, `deploy`, nor `record_release` depends on it. Its failures therefore cannot veto publication.

The advisory runner preserves the original comparison thresholds, including exact `threshold: 0` / `maxDiffPixels: 0` where specified. It never automatically updates references. There are no masks, pixel normalization, broad baseline replacements, or weakened functional assertions.

## Reviewing results

Open the Actions run and download **advisory-visual-review**. Extract it, then open `visual-review-report/index.html` or run `npx playwright show-report visual-review-report`. The report includes reference, received, and diff images for mismatches. Current screenshots are also available in each `browser-test-results-N` artifact. Artifacts are retained for seven days. Capture/setup errors remain visible; missing captures make the advisory runner fail rather than silently pass.

Locally:

```sh
# Run mandatory browser checks and collect images.
FONTCONFIG_FILE="$PWD/tests/fixtures/screenshot-fonts.conf" npm run test:e2e
# Review comparisons separately; a nonzero exit here is advisory.
npm run test:visual
npx playwright show-report visual-review-report
```

Use the pinned browser from `.github/workflows/pages.yml` and the shared font configuration for comparable references. Local Debian Chromium is not assumed identical to CI's Chrome-for-Testing on Ubuntu. A reviewer should still investigate meaningful visual differences before approving a UI change. Intentional reference updates should remain narrow and reviewed separately.

## Issue #105 evidence

Original production run `40766290538` never reached deployment. Its Energy image differs at 25 raw RGBA edge pixels. The strict comparator's three red pixels, using zero-based coordinates, are:

| Pixel | Expected RGBA | Received RGBA |
| --- | --- | --- |
| (34, 468) | 67, 80, 99, 255 | 66, 80, 100, 255 |
| (33, 474) | 68, 83, 102, 255 | 69, 82, 102, 255 |
| (33, 475) | 68, 83, 102, 255 | 69, 82, 102, 255 |

These are on the Undo button's curved outline. The remaining raw differences are antialias-classified pixels on that outline and the slider endpoints. Text, gauge SVG, layout and seeded Energy values match. CI pins Chrome-for-Testing 154.0.8037.57 on Ubuntu 24.04, 390×844, DPR 1, en-US, America/New_York, using `screenshot-fonts.conf`; local references used Debian Chromium of the same version string. A pinned version string alone did not establish repeatability. Readiness checks alone also did not eliminate the edge variation. No production CSS, renderer flags or screenshot references are changed in this correction.
