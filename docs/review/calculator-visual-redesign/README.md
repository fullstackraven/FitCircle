# Fitness Calculator reference redesign

The four supplied dark mockups guide the shared header, continuous text-only Calories/Goal/BMI/Macros selector, panel proportions, typography, dividers and restrained accents. Light/System reuse the existing semantic palette and controller.

- **Calories:** left-aligned green target, compact summary, activity selector and outlined direction controls. The existing weekly-rate selector remains available for Lose/Gain, although absent from the reference image.
- **Goal:** saved target headline, current weight, editable target and full-width save. Existing progress/status feedback remains below it. Explanations reflect actual behavior: current measurements drive formulas; the saved goal tracks weight progress.
- **BMI:** orange gauge, existing category/range, height and weight alongside, screening explanation below. At widths below 360px, the gauge stacks above fields. Measurement fields are read-only with an existing Measurements edit link, avoiding a competing data source. Existing BMI category names remain unchanged.
- **Macros:** orange/coral/blue summary cards with allocation indicators, derived Total Calories and aligned percentage inputs. Existing validation and calculations are unchanged.

The centralized dock visibility list now includes `/fitness-calculator`; unrelated destinations retain their dock. No formula, persistent key, schema, backup, dependency or appearance-controller changes.

## Validation

- `npm run check`: passed.
- `npx tsc --noEmit -p tests/tsconfig.regressions.json`: passed.
- 17 focused browser tests passed using current-source Vite servers and pinned Chromium/font configuration: calculator route/tab state, draft preservation, saved values, goal direction/saves/errors, measurement updates, nutrition integration, 320px Light/Dark layout, simulated keyboard, Back/Forward, direct-route fallback, dock visibility and shared calculator inputs.
- Four new exact-comparison visual references were captured, one per redesigned view; original images and zero-tolerance assertions remain unchanged.
- One unintentionally included existing offline-history test timed out at `navigator.serviceWorker.ready`: the local Vite development server does not supply the production service worker. No assertion was removed or changed; production verification remains for CI. An initial run against stale `dist` was stopped and is not counted as validation of the new code.
- No local build, full regression suite, unrelated appearance audit or screenshot gallery was run. Full CI remains pending.

Commands (with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` and existing `FONTCONFIG_FILE`):

```sh
npx playwright test tests/browser/calculator-route.spec.ts tests/browser/measurement-nutrition-integration.spec.ts tests/browser/nutrition.spec.ts --grep 'calculator|measurement updates|cross-tab weight|malformed measurements|missing measurements|Measurements has' --workers=2 --update-snapshots
# 14 passed; 1 offline-history timeout described above. Only four newly named visual references created.
npx playwright test tests/browser/appearance-phase-three.spec.ts tests/browser/material-adoption.spec.ts --grep 'calculator objectives|glass controls' --workers=2
# 3 passed.
```

[Calories](../../../tests/browser/calculator-route.spec.ts-snapshots/calculator-reference-calories-linux.png) · [Goal](../../../tests/browser/calculator-route.spec.ts-snapshots/calculator-reference-goal-linux.png) · [BMI](../../../tests/browser/calculator-route.spec.ts-snapshots/calculator-reference-bmi-linux.png) · [Macros](../../../tests/browser/calculator-route.spec.ts-snapshots/calculator-reference-macros-linux.png)

Manual review still needed on physical iPhone Safari and installed PWA: keyboard-open field/Save access, larger text sizes, safe areas, Back gesture, and System appearance changes. No physical-device testing is claimed.
