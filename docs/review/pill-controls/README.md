# iOS capsule buttons and search fields

This is a presentation-only completion of FitCircle's existing Account Data/Supplements pill standard. It does not replace the application's colors, surfaces, navigation or feature identities.

## Implementation

- `--radius-pill: 9999px` / `.fc-pill` supply explicit opt-in capsule geometry. The shared Button, dropdown and collapsible primitives adopt it; one-off action classes and native buttons use the same token rather than broad global button selectors.
- The final icon-only pass covers shared `Button size="icon"` as well as native actions. Small Food action gaps compensate for the larger circular targets so protected tiles keep their positions. Applicable native icon actions use `.fc-icon-button`; existing larger circular tools, compact schedule selectors and landscape editor sizing remain intact.
- Period/filter/Calculator/Dynamic Overview groups use rounded outer containers and capsule segments. Existing selection logic and keyboard handlers remain unchanged.
- Food Database and Add Food use `Input variant="search"`; Journal reuses its existing group with shared capsule/focus styling. Other fields retain their original geometry and behavior.
- Native dropdowns, dialogs, confirmation footers, recovery/error actions and static phone-diagnostic actions were included. The bottom dock is unchanged.

The [complete inventory](INVENTORY.md) and [machine-readable before/after declarations](inventory.json) cover conditional JSX as well as initial pages. `npm run audit:controls` rejects unexplained action geometry and conflicting partial-radius utilities. Its regression is part of the normal unit suite.

## Protected actions

**Scan Barcode** and **Custom Food** in Add Food remain byte-identical JSX. Their 24px corners, colors, dimensions, padding, icons, typography and placement are preserved. All eight combinations (two buttons × Light/Dark × 320/390px) retain identical measured rectangles and appearance properties. [Before](before/protected-controls.json) / [after](after/protected-controls.json). No other Food Tracker action is excluded.

Switches, checkboxes, theme radio previews, sliders, calendar cells, progress visuals, text-only links, reading/editing surfaces and full feature/profile navigation cards are explicitly distinguished from action-button surfaces. The inventory documents each exception. No blanket Food Tracker exemption was introduced.

## Before / after examples

Synthetic fixtures only; 390×844 unless stated. The 320px versions are also included in the corresponding directories. These are review images, not release-blocking pixel baselines.

| Pattern | Before | After |
| --- | --- | --- |
| Routines actions · Dark | [Before](before/dark-390/routines.png) | [After](after/dark-390/routines.png) |
| Workout editor · Dark | [Before](before/dark-390/workout-editor.png) | [After](after/dark-390/workout-editor.png) |
| Calculator segments/actions · Light | [Before](before/light-390/calculator.png) | [After](after/light-390/calculator.png) |
| Food search + protected tiles · Light, 320px | [Before](before/light-320/food-search.png) | [After](after/light-320/food-search.png) |
| Supplements management · Dark | [Before](before/dark-390/supplements.png) | [After](after/dark-390/supplements.png) |
| Journal search · Light | [Before](before/light-390/journal-search.png) | [After](after/light-390/journal-search.png) |
| Account Data reference · Dark | [Before](before/dark-390/account-data.png) | [After](after/dark-390/account-data.png) |
| Protected Barcode tile · Dark | [Before](before/dark-390/barcode.png) | [After](after/dark-390/barcode.png) |
| Protected Custom Food tile · Light | [Before](before/light-390/custom-food.png) | [After](after/light-390/custom-food.png) |

## Validation and boundaries

- Application and regression TypeScript checks pass.
- Unit suite: **380 passed**. This includes imported-control coverage, protected JSX hashes, storage/backup and the existing advisory-visual policy regressions.
- Storage audit: **164 call sites, zero errors**. Production build passes.
- Focused route/search/conditional-state geometry tests cover 320/390/1280px, Light/Dark and System, including saved-data preservation. The full local browser run passed **528/528** before the final icon-size pass; affected controls were then rechecked with focused tests. Final-revision CI results are recorded in the PR.
- Existing functional assertions remain mandatory. Pixel comparisons remain in the separate advisory job, with their original references/tolerances; no baseline was broadly regenerated to hide changes. The intentional capsule differences remain visible in its HTML report.
- No event handlers, fitness calculations, storage/backup formats, routing destinations, service-worker/update logic or release workflow were changed. The startup/phone-diagnostic edits are CSS only.
- Tests use Linux Chromium and simulated iPhone viewports/keyboard/safe areas. Physical iPhone/PWA testing was unavailable; no real-device testing is claimed.

The current published release when implementation began was **v2.16.0**. Classification is **release:patch** for cosmetic consistency of existing controls. **v2.16.1 is provisional**, contingent on actual intervening releases and successful normal deployment; no application version was manually changed. No merge or deployment is part of this PR.
