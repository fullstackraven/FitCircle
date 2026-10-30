# Nutrition display precision

`formatNutritionDisplay` is a small, read-only formatter using the built-in Intl number formatter: calories have zero fractional digits; carbs/protein/fat have at most one. Conventional rounding is used and trailing zeros disappear. Missing, nonnumeric, negative and non-finite values return `Unknown`; numeric strings are not silently coerced into known nutrition. Confirmed zero remains `0`.

Applied only to rendered values in CompactFoodCard (Recent, Most Frequent and food search), the Add/Edit Entry summaries, meal entries and the daily macro summary/targets. Editable input values, serving-size text, scaling/conversion code, totals, save payloads, Open Food Facts normalization, database records and backups are untouched. No CSS, classes, layout or theme changes.

## Focused validation

- Application and regression TypeScript: pass.
- Production build: pass.
- Formatter tests: **3/3 pass**, including all supplied decimal examples, rounding ties, zero, unknown/invalid values and unchanged source entries/serving-adjusted totals.
- Focused browser checks: **2/2 pass**, Light/Dark, covering existing saved foods in Recent/Most Frequent/search, unchanged storage while browsing and two-serving logging. Saved raw nutrition remains exactly `113.3980925`, `25.9998`, `5.9976`, `1.9992`; the existing record and food database remain unchanged.

No screenshot suite, unrelated audit or physical iPhone verification. Classification: `release:patch`. No merge/deployment; CI runs asynchronously after push and is not monitored.
