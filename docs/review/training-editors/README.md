# Workout and Routine bottom sheets

Implements the approved **New Workout**, **Edit Workout**, and **New Routine** designs, with Edit Routine reusing the Routine layout. This is limited to the two editor components, their DaySelector sheet variant and one scoped stylesheet.

- Bottom-aligned, content-sized sheets with a drag indicator, large left-aligned titles/subtitles and circular close controls.
- Full-width name fields; a compact native color selector; editable, centered Weight / Total Reps / Sets cards.
- Shared circular Sunday–Saturday controls with full accessible day names, Clear and the existing presets. Routine selected-day count is dynamic; zero-day validation remains unchanged.
- Full-width primary action, quiet Cancel, and a separate Delete Workout row when the caller supports deletion.
- The existing Dialog portal, scroll lock, fixed header/footer, internal body scroller and visual-viewport/safe-area handling remain in charge. No navigation, persistence or tracking implementation changes.

## Representative screenshots

390×844, synthetic data. No screenshot comparison campaign or baseline regeneration.

| Approved design | Screenshot |
| --- | --- |
| New Workout | [Dark](new-workout-dark.png) |
| Edit Workout | [Dark](edit-workout-dark.png) |
| New Routine | [Dark](new-routine-dark.png) · [Light](new-routine-light.png) |

## Essential validation

- Application TypeScript: pass.
- Regression TypeScript: pass.
- Production build: pass.
- One focused browser spec, **2/2 cases**, verifies Add/Edit Workout and Add/Edit Routine in Dark/Light at 390px, defaults/prefill, editable inputs, 28px numeric presentation, color/presets/day selection, explicit save, Cancel, delete confirmation rejection/acceptance, zero-day Routine validation, saved data and simulated keyboard containment. Only that focused spec was run locally; broader regression coverage is left to CI.
- Related existing test locators follow the intentional new copy and full day names. Editor containment assertions now verify internal scrolling, field reachability and anchored headers/footers instead of requiring the former compact form to never scroll. No functional/data assertions were removed.

## Preserved behavior and limits

All save/update/delete handlers, input types/defaults/validation, color options and scheduling callbacks remain unchanged. Routine deletion was not supported inside the existing editor, so it remains on the routine card with its existing confirmation. Workout delete confirmation remains caller-owned. New blank forms retain their disabled primary action until the existing validation is satisfied, even where the mockup depicts an enabled action with placeholder text.

The drag handle is an indicator; no new drag-to-dismiss gesture engine was added. Physical iPhone testing was unavailable; keyboard/safe-area behavior was checked in the browser. Barcode/Custom Food, other pages, storage/backup, service workers and release infrastructure are untouched. Pixel comparisons remain advisory. No merge or deployment performed.
