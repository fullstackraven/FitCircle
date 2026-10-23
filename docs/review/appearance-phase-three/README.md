# Appearance Phase 3 review

Based on current main `173aadc`, after Phase 2 PR #73 merged on 2026-10-23. This PR converts nutrition, calculator and measurement presentation for the existing development Light/Dark/System preview. Production remains Dark-only. No public selector or later-phase work.

## Scope and files

| Group | Changed files |
| --- | --- |
| Pages | `client/src/pages/food-tracker.tsx`, `food-database.tsx`, `fitness-calculator.tsx`, `measurements.tsx` |
| Nested nutrition UI | `client/src/components/nutrition/DailyNutritionSummary.tsx`, `MealDiary.tsx`, `NutritionDetails.tsx`, `NutritionProgressBar.tsx`, `FoodEntryForm.tsx`, `BarcodeEntry.tsx`, `BarcodeScanner.tsx` |
| Central presentation roles | `client/src/styles/appearance.css`, `tailwind.config.ts` |
| Coverage and evidence | `tests/browser/appearance-phase-three.spec.ts`, its new snapshot directory, `tests/fixtures/appearance-nutrition.ts`, `appearance-contrast.ts`, `tests/tsconfig.regressions.json`, this review directory |

Food Tracker includes daily summaries, meals, entries, search/recent selection, custom-food forms, database editing from search, scanned-product entry, errors, notifications and inline Nutrition Details. Food Database includes filters, records, actions, pagination and editor. Both calculator entry points share the same themed page component. Measurements includes existing entry fields, historical charts and errors.

**Repository findings:** Weekly Nutrition is absent. Measurements currently has no tooltip, grid, legend, reference-line or historical-edit-dialog component; axes explicitly disable axis/tick lines. No new chart interactions or editing capabilities were invented. The chart screenshot captures the existing hover state without a tooltip. Its established horizontal carousel geometry and scaling remain intact.

## Semantic architecture

Reused Phase 2 surface, canvas, supporting/muted/strong text, control-border, selected/action, feature-accent and material roles. New roles are centralized:

- `neutral-*` preserves the distinct legacy gray-family RGB values in custom-food/entry forms; Light maps these roles into the established white/pale-slate palette.
- `nutrition-track`, `nutrition-green`, `nutrition-blue`, `nutrition-amber` separate tracks from category fills. Dark retains original slate700/green400/blue400/amber400; Light uses slate200/green700/blue600/amber700.
- `feature-rose`, soft blue/red text, blue/red hover tint and soft warning roles preserve previously distinct Dark colors while providing readable Light variants.
- `--bmi-*` and `--chart-series` preserve category/series identities and exact Dark colors, with darker Light strokes. Axis text uses existing muted foreground.

Scoped Light CSS supplies a visible inset boundary for the native serving-unit select and accessible borders/text/tints for calculator objectives and the scan action tile. Calculator objective buttons expose their existing selected state through `aria-pressed`; selection and persistence logic are unchanged. No layout, dimensions, viewport guards or shared component implementations changed.

## Dark preservation and screenshots

Captured original Dark evidence on merged Phase 2 before application styling edits. New Dark screenshot assertions require zero differing pixels; original Phase 1 and Phase 2 baselines are untouched. Each row links to 390 × 844 screenshots.

| View | Original Dark | Phase 3 Dark | Phase 3 Light |
| --- | --- | --- | --- |
| Food Tracker | [Original](before/food-tracker.png) | [Dark](dark/food-tracker.png) | [Light](light/food-tracker.png) |
| Nutrition Details | [Original](before/nutrition-details.png) | [Dark](dark/nutrition-details.png) | [Light](light/nutrition-details.png) |
| Food Search | [Original](before/food-search.png) | [Dark](dark/food-search.png) | [Light](light/food-search.png) |
| Food Entry Editor | [Original](before/food-entry-editor.png) | [Dark](dark/food-entry-editor.png) | [Light](light/food-entry-editor.png) |
| Custom Food Create | [Original](before/custom-food-create.png) | [Dark](dark/custom-food-create.png) | [Light](light/custom-food-create.png) |
| Barcode | [Original](before/barcode.png) | [Dark](dark/barcode.png) | [Light](light/barcode.png) |
| Barcode Error | [Original](before/barcode-error.png) | [Dark](dark/barcode-error.png) | [Light](light/barcode-error.png) |
| Food Database | [Original](before/food-database.png) | [Dark](dark/food-database.png) | [Light](light/food-database.png) |
| Custom Food Editor | [Original](before/custom-food-editor.png) | [Dark](dark/custom-food-editor.png) | [Light](light/custom-food-editor.png) |
| Fitness Calculator | [Original](before/fitness-calculator.png) | [Dark](dark/fitness-calculator.png) | [Light](light/fitness-calculator.png) |
| Calculator Bmi | [Original](before/calculator-bmi.png) | [Dark](dark/calculator-bmi.png) | [Light](light/calculator-bmi.png) |
| Calculator Modal | [Original](before/calculator-modal.png) | [Dark](dark/calculator-modal.png) | [Light](light/calculator-modal.png) |
| Measurements | [Original](before/measurements.png) | [Dark](dark/measurements.png) | [Light](light/measurements.png) |
| Measurement Chart | [Original](before/measurement-chart.png) | [Dark](dark/measurement-chart.png) | [Light](light/measurement-chart.png) |

No intentional Dark appearance changes. Light-only adjustments reduce glow/contrast problems through existing materials and use darker accent text/strokes, preserving nutrient category meanings.

## Nutrition and data protection

No nutrition/reference, serving, barcode-lookup, food-service, calculator formula, measurement-selector, persistence, storage registry or backup module changed. No new records, keys, schema, migrations or dependencies. Calculator category changes in source affect only its returned presentation color; category thresholds and calculations are unchanged.

Tests verify known-zero sodium remains distinct from missing vitamin C, partial disclosure/completeness remains intact, fiber and total-sugar references/calculations retain their values, empty days retain empty bars, and over-target bars retain capped visual fills with uncapped numbers. Search/add/edit serving totals, custom-food persistence, local barcode selection without internet and original historical bytes are checked in both appearances. Existing nutrition, backup and historical-integrity regressions remain enabled.

Appearance resolution, preference persistence, backup formats, service worker, manifest and startup metadata are unchanged. Home, Routines, Reminders, Logs and Profile implementations are untouched; their original Dark screenshots and Light/System tests remain in the full suite.

## Contrast and remaining explicit colors

Per-view Light computed-text findings are stored beside screenshots as `*-contrast.json`. Tests target 4.5:1 normal and 3:1 large text, including composited ancestor backgrounds. Nutrition fill/track pairs are checked at ≥3:1 in both appearances. Chart ticks use readable muted text; Light series blue600 is distinct on pale slate. Inputs retain the established Light control boundary and contained focus styles.

Representative Light roles: white-on-blue600 ≈5.17:1, green700-on-white ≈5.02:1, slate600-on-slate100 ≈6.92:1. These checks approximate translucent compositing, not a full WCAG certification; manual native-control, blur, assistive-technology and interaction-state review remains necessary. Existing Dark contrast exceptions are preserved rather than redesigned.

Intentional explicit colors remain: blue action-button fills (same recognizable fill with white text in both themes), green barcode/action fills with dark text, scan-tile green tint, warning accent borders, and dynamic calculator goal fill classes retained for the Dark baseline. New scoped Light objective styling supplies stronger borders/readable text. The barcode video surface deliberately stays `slate-950`; actual camera imagery is not recolored. No persisted colors or data-series identifiers change.

## Validation

- `npm run check`: passed.
- `npx tsc -p tests/tsconfig.regressions.json`: passed.
- `npm test`: 294 passed, zero failures.
- `npm run audit:storage`: 160 call sites, zero errors.
- `npm run build`: passed.
- Focused Phase 3 appearance suite: 16 passed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test --workers=2`: **303 passed**, zero failures, including all 16 new Phase 3 tests, unchanged Phase 1/2 Dark baselines, existing Light/System coverage, production gating and existing fitness/nutrition/backup regressions.

## Physical iPhone checks and boundaries

Chromium tests use 390 × 844, a 320px viewport, synthetic keyboard viewport shrink and fixed synthetic dates/data. Physical iPhone Safari and installed-PWA verification is outstanding:

1. Check notch/status-bar, fixed header, dock clearance, natural scrolling and text scaling.
2. Search/select food and scroll all entry/custom-food fields with the keyboard open; confirm contained focus, select menus, save controls and close button remain reachable.
3. Exercise full-page and embedded calculator fields, selections, results and modal scrolling.
4. Inspect measurement axes, points and the existing horizontal chart carousel; compare chart hover behavior with current production.
5. Test camera permissions, preview, cancellation/background cleanup and manual barcode fallback on real hardware. Automated permission rejection/offline-cache tests do not verify iPhone camera compatibility or a live external API request.
6. Check VoiceOver labels, partial-data disclosure and native form controls in both preview appearances, including reduced-transparency/high-contrast preferences.

No Phase 4 work, public appearance controls, PWA launch-color work, merge or deployment is included.
