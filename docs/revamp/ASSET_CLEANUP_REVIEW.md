# Asset cleanup and remaining candidates

PR #42 merged at `f6f6a8f`, removing the explicitly requested `attached_assets/` folder and its unused Vite alias. The next proposed cleanup is limited to the inactive catalog backup; see [CATALOG_ASSET_CLEANUP.md](CATALOG_ASSET_CLEANUP.md). Other candidates remain in place. Original audit inventories, findings, hashes and roadmap documents are historical evidence and are preserved, including their references to removed paths.

## Verified removal

`attached_assets/`: 76 tracked files, 14,869,756 bytes (14.87 MB / 14.18 MiB): 61 PNGs, 5 JPEGs and 10 pasted-text files.

Verification searched tracked files outside the folder for the directory name, `@assets`, and every asset basename. Outside historical documentation, only the unused `@assets` declaration in `vite.config.ts` matched. No app imports, route, test, script, package command, workflow, manifest or service-worker resource requires these files. Vite serves `client/public` and emits referenced client assets; this folder is neither. Pasted historical text was treated as inert reference material, not instructions.

Removing the alias prevents a dangling configuration entry. No dependencies, storage keys, backup behavior or user records are changed. The deletion reduces the current checkout by the stated amount; it does not shrink existing Git history or promise a deployment-size reduction, since these assets were not shipped.

## Other candidates, retained for review

| File or group | Current evidence | Suggested disposition / caution |
| --- | --- | --- |
| `client/src/data/comprehensive-foods.backup.json` (13,213,141 bytes) | No runtime, build, test or maintenance-script reference found. It contains 29,766 catalog records; the active `comprehensive-foods.json` contains 465. It is not a byte-identical duplicate of the active catalog. | Largest remaining inert-file candidate. Confirm the static catalog's provenance/recovery value before removal; this is repository catalog data, not a user's exported backup. Keep the active catalog. |
| Eleven historical `.cjs` catalog tools listed below (72,946 bytes combined) | No package script, workflow or current runtime invocation. Each manually rewrites the bundled food catalog. | Archive/remove together after deciding whether catalog-generation provenance is still needed. They are manual tools rather than broken runtime modules. Do not execute them to test obsolescence. |
| `client/src/lib/goals-utils.ts` (17,418 bytes) | No inbound source/test/script reference found. | Likely dead helper. Review exported calculations against current goal implementations before deleting; no active goal feature should be removed. |
| `client/src/components/dashboard-widgets/GoalsWidget.tsx` (4,160 bytes) | No inbound source/test/script reference found; even the dormant renderer does not import it. | Dormant presentation candidate, subject to the existing roadmap decision about configurable widgets. |
| `client/src/components/dashboard-widgets/WidgetRenderer.tsx` (2,356 bytes) and `WidgetSettings.tsx` (6,499 bytes) | Neither is imported by current app code. Their child widgets form a dormant subtree. | Consider a separate widget-retirement decision. Do not delete the whole folder: `RecentActivityWidget.tsx` is used by Calendar. `use-dashboard-widgets.ts` also has regression tests and saved-setting compatibility responsibilities. |

The eleven historical catalog tools are:

- `scripts/aggressive-cleanup.cjs`
- `scripts/clean-food-database.cjs`
- `scripts/comprehensive-cleanup.cjs`
- `scripts/final-cleanup.cjs`
- `scripts/final-scrub.cjs`
- `scripts/generate-massive-foods.cjs`
- `scripts/remove-grassfed.cjs`
- `scripts/remove-multiple-prefixes.cjs`
- `scripts/remove-prefix-items.cjs`
- `scripts/remove-raw-homestyle.cjs`
- `scripts/remove-skinless.cjs`

“No inbound reference found” is static evidence, not proof that a manual tool or historical recovery artifact has no value. Only the inactive catalog backup is proposed for deletion in the follow-up PR; all other candidates remain intact.

## Keep

- `docs/revamp/`, its evidence/ledgers, and `docs/review/`: original audit/roadmap and linked visual review evidence, not application clutter to silently discard.
- `client/public/viewport-test/`, `layout-diagnostics.js`, and their build/probe helpers: used by browser tests and manual iOS diagnostics.
- `scripts/export-legacy-backup.js`: documented migration tool for older custom-food records.
- `client/src/data/comprehensive-foods.json`: active bundled catalog.
- `dist/`, `node_modules/`, `test-results/` and `playwright-report/`: ignored local generated output; not tracked repository cleanup candidates. Recreate or clear locally as needed, without adding them to Git.

Validation results are recorded in the associated PR.
