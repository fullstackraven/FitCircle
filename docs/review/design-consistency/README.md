# Visual consistency review

- [Approved presentation standard](../../DESIGN_SYSTEM.md)
- [Application-wide audit and exceptions](AUDIT.md)
- [Imported presentation-source inventory](source-inventory.json)
- [Regression results](VALIDATION.md)
- [Unresolved strict-screenshot blocker and bounded evidence](RENDERING_BLOCKER.md)
- Baseline: main `2350d60` (v2.15.1); no version is hardcoded by this change.

## Representative comparisons

Each link opens an actual Chromium screenshot of the same seeded state. The full route matrix checks 33 routes × two themes × two widths; the before/after image set illustrates the major patterns rather than claiming these eight pages are the entire audit.

| Pattern/page | Dark 390 before → after | Light 390 before → after |
| --- | --- | --- |
| Home / retained workout cards and dock | [Before](before/dark-390/home.png) → [After](after/dark-390/home.png) | [Before](before/light-390/home.png) → [After](after/light-390/home.png) |
| Nutrition header / action columns | [Before](before/dark-390/food-tracker.png) → [After](after/dark-390/food-tracker.png) | [Before](before/light-390/food-tracker.png) → [After](after/light-390/food-tracker.png) |
| Shared Wellness tracking shell | [Before](before/dark-390/hydration.png) → [After](after/dark-390/hydration.png) | [Before](before/light-390/hydration.png) → [After](after/light-390/hydration.png) |
| Energy / sections, periods and metrics | [Before](before/dark-390/energy-level.png) → [After](after/dark-390/energy-level.png) | [Before](before/light-390/energy-level.png) → [After](after/light-390/energy-level.png) |
| Recovery / metrics, history and empty states | [Before](before/dark-390/recovery.png) → [After](after/dark-390/recovery.png) | [Before](before/light-390/recovery.png) → [After](after/light-390/recovery.png) |
| Display / settings sections | [Before](before/dark-390/display.png) → [After](after/dark-390/display.png) | [Before](before/light-390/display.png) → [After](after/light-390/display.png) |
| Measurements / header and information cards | [Before](before/dark-390/measurements.png) → [After](after/dark-390/measurements.png) | [Before](before/light-390/measurements.png) → [After](after/light-390/measurements.png) |
| About / Dashboard detail header | [Before](before/dark-390/about.png) → [After](after/dark-390/about.png) | [Before](before/light-390/about.png) → [After](after/light-390/about.png) |

Equivalent 320px captures are in `before/dark-320`, `before/light-320`, `after/dark-320`, and `after/light-320`. The browser route-layout JSON attachments record the bounds/overflow findings for every route, not only photographed examples.

## Behavior and data boundary

Presentation components do not import tracking hooks or storage modules. Changes to pages pass through their existing handlers. No hooks, data schemas, storage keys, import/export implementation, release workflow, service worker, update code, dock geometry, or viewport controller are changed. Native destructive/discard confirmations remain native. Shared contained focus and overlay scroll-lock rules remain intact.

## Validation

The initial main-branch matrix found no document/scroll-surface horizontal overflow at 320/390px. The post-consolidation matrix also passes all four combinations. Existing strict screenshot comparisons are retained, with reference updates restricted to intentional presentation changes.

The first full browser run identified an unintended landscape scrollbar in the compact workout editor after increasing default action heights. The correction explicitly retains its established short-viewport title/action geometry; the original containment assertions remain unchanged.

Final command results and CI status are recorded in VALIDATION.md and the PR. A strict screenshot blocker remains; all-green validation is not claimed. Validation uses Linux Chromium, simulated iPhone viewport/safe-area/keyboard conditions, and the repository's font configuration. Physical iPhone/PWA testing is unavailable; no real-device testing is claimed. Workspace networking blocks the CI Chrome-for-Testing download; local screenshot rendering uses installed Chromium 154.0.8037.57. CI remains responsible for exact comparison with its reference browser.
