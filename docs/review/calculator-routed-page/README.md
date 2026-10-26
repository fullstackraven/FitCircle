# Routed Fitness Calculator

## Change

The existing `/fitness-calculator` route now replaces Food Tracker's calculator dialog. The original calculator icon navigates there through Wouter. A normal page heading and Back arrow replace the overlay, close X and internal modal scroller. The existing application shell, dock, safe areas and scroll ownership are unchanged.

Four accessible tabs show Calorie Tracker (the opening default), Goal Weight, BMI Calculator or Macro Calculator. All panels stay mounted, with only the selected panel exposed, so changing tabs does not reset drafts or calculator state. Arrow keys, Home and End select tabs without route changes. The four-column selector wraps labels inside each cell at narrow widths.

The originating route is marked in the existing browser history entry, not a new storage key. Back consumes that navigation entry; browser Back/Forward work normally. A directly opened URL has an in-app Food Tracker fallback. Existing Profile and Measurements links remain available in their applicable sections.

## Preservation

No changes to BMR/BMI/calorie/macro formulas, weekly rates, target publishing, goals persistence, food records, backup formats or schemas. Existing saved settings and central Light/Dark/System appearance remain in use. A draft-only correction prevents unrelated target-publication refreshes from replacing goal-weight input when the persisted goal has not changed. Actual saved-goal changes still refresh it.

The calculator retains its previous contained input-focus treatment through calculator-scoped CSS. Macro card padding/gaps adapt to narrow screens; calculations and precision are unchanged. Save errors are visible regardless of selected tab.

## Tests and visual evidence

Validation used current-source Vite development servers on ports 4173 and 4184, not a local production build. Full production validation is left to GitHub Actions as requested.

Passed:

- `npm run check`
- `npx tsc --noEmit -p tests/tsconfig.regressions.json`
- Focused new route tests: origin Back/Forward; default tab on reopening; unsaved goal draft retention while macros change; saved macro retention; goal saving; untouched profile/measurement bytes; 320px Light/Dark layout; keyboard tab selection; reduced-height scrolling; direct-route fallback and Measurements link.
- All seven existing measurement/calculator integration tests, including cross-tab updates, malformed records, failed goal saves and goal direction.
- Both existing nutrition calculator tests, including diary target integration, invalid splits and failed target writes.
- Existing material control/persisted-calculator-input test.
- Both Dark/Light calculator objectives/select/validation/simulated-keyboard tests.
- Adapted shared-modal containment/focus tests (glass, profile field, viewport and scroll-boundary coverage).
- Two new exact-comparison Dark screenshot references captured with pinned Chromium and the existing screenshot fonts. Original screenshot files and comparison tolerances are untouched.

The successful focused coverage totals 23 distinct tests. Initial attempts exposed a goal draft reset (fixed), obsolete modal selectors (updated), one accidental test-edit insertion (reverted), and the routed form inheriting the old exterior focus outline (fixed with scoped contained styling). Passing tests were not repeatedly rerun; failed cases were rerun after corrections.

Commands used (with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; screenshot/appearance runs also use `FONTCONFIG_FILE=tests/fixtures/screenshot-fonts.conf`):

```sh
npx playwright test tests/browser/calculator-route.spec.ts tests/browser/measurement-nutrition-integration.spec.ts tests/browser/nutrition.spec.ts tests/browser/material-adoption.spec.ts --grep 'calculator|measurement updates|cross-tab weight|malformed measurements|missing measurements|Measurements has' --workers=2
npx playwright test tests/browser/calculator-route.spec.ts tests/browser/material-adoption.spec.ts --grep 'calculator icon|glass controls|Dark visual references' --update-snapshots --workers=2
npx playwright test tests/browser/appearance-phase-three.spec.ts tests/browser/viewport.spec.ts tests/browser/scroll-boundaries.spec.ts tests/browser/glass.spec.ts tests/browser/modal-fields.spec.ts --grep 'calculator objectives|profile editor stays bounded|dialogs, rotation|standalone|glass dialog|profile editor|sidebar profile' --workers=2
npx playwright test tests/browser/appearance-phase-three.spec.ts tests/browser/scroll-boundaries.spec.ts --grep 'calculator objectives|normal viewport changes' --workers=2
npx playwright test tests/browser/appearance-phase-three.spec.ts --grep 'calculator objectives' --workers=2
```

The snapshot update command created only the two new route references; no old baseline was regenerated. The old stacked-page/modal screenshot scenes are superseded by dedicated routed-page screenshots. Shared modal-only assertions now exercise the existing Profile editor; calculator behavior itself is covered as a page rather than pretending it remains a dialog. All unrelated assertions remain.

- [Calorie tab](../../../tests/browser/calculator-route.spec.ts-snapshots/calculator-routed-calories-linux.png)
- [BMI tab](../../../tests/browser/calculator-route.spec.ts-snapshots/calculator-routed-bmi-linux.png)

No full local unit suite, browser suite, build, unrelated appearance audit or screenshot gallery was run. Complete CI and production/offline verification remain pending.

## Manual iPhone checks

- Safari and installed PWA: open from Food Tracker; Back gesture, header Back, refresh and reopen.
- All tabs at small widths and larger accessibility text sizes in Light, Dark and System.
- Keyboard open: enter goal weight and macro percentages; scroll to Save/results and return to tabs without clipping.
- Confirm saved targets appear on Food Tracker after returning; existing Measurements/Profile links remain usable.

No physical-device testing is claimed. Reverting this PR restores the modal without storage migration or data cleanup.
