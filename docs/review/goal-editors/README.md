# Four Wellness goal editors

Implements the supplied Cardio, Fasting, Meditation and Hydration goal mockups using one shared, scoped `GoalEditor` presentation: rounded sheet, drag indicator, left-aligned heading/subtitle, circular Close, compact ring beside the summary, tinted numeric inputs with unit suffixes, dividers, green pill Save and quiet Cancel.

Existing percentage expressions, finite/clamped ring display, input values/types/focus handlers, validation and save functions remain in the four pages. Cardio's Daily/Weekly and Minutes/Miles controls invoke the existing goal updates. Their existing immediate persistence behavior is retained. Fasting goal hours and maximum heat-bar hours remain separate. No example values are hardcoded.

Only goal-modal sections and their direct shared presentation changed. Other page content, storage, backups, feature calculations, navigation, PWA behavior and unrelated buttons are untouched. `WellnessGoalSheet` adds an optional class for this scoped treatment while preserving the existing viewport overlay, safe-area bounds, focus containment and scroll lock. The drag handle is decorative, with no new gesture system.

## Essential verification

Application and regression TypeScript and production build pass. One focused browser spec passes **2/2 cases**, exercising all four editors in Light/Dark at 390×844: open/save/reopen/Close/Cancel, Cardio selectors, separate Fasting maximum, input typography, opaque sheet surface, no horizontal overflow, reachable Save actions and System appearance changes. Physical iPhone testing was unavailable. No broad audit, exhaustive screenshot tests or CI monitoring performed.

Representative captures use synthetic data and are advisory only:

- Cardio: [Light](cardio-light.png) · [Dark](cardio-dark.png)
- Hydration: [Light](hydration-light.png) · [Dark](hydration-dark.png)

The older hydration regression uses the new visible Save Goal label; its data assertions are preserved. Broader regression checks are left to normal CI. Classification: `release:patch`. No merge or deployment.

## Presentation-regression alignment

The existing ring assertion now expects the new semantic progress-track token. Hydration's exact computed-material snapshot inspects the visible `.goal-editor` card, tinted `.goal-editor-input-row` and editable `.goal-editor-input`, instead of treating the intentionally transparent portal shell as the sheet material. No pixel tolerances or functional/data assertions changed.

The three previously failing browser cases pass locally (Dark baseline plus Light/Dark wellness editing and historical-data cases); regression TypeScript passes. No application or CI workflow change was required. New GitHub checks run asynchronously after push.
