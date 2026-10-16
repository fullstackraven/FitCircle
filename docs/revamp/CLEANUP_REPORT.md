# Final cleanup handoff

Scope changed at the user's request on 2026-10-16: finish the current food-save work, perform one general cleanup PR, then stop implementation. This is completion of that cleanup scope, **not** a claim that all Phase 1 safety work or the original modernization roadmap is complete. No automatic merge/deployment.

## Verified merged and proposed work

Main baseline is `fc09b8a`. PR #24 (audit safeguards/FC-006), #26 (FC-001/002 historical goals and timestamps), and #27 (workout FC-003 preservation/recovery) are merged. The finished cardio safety and food-save corrections from PRs #28 and #29 are consolidated into this final review PR with cleanup. Those earlier PRs are superseded; the corrections are not yet merged-main outcomes. Their standalone validation and limitations remain recorded in their respective reports, with combined results below. Original audit findings and roadmap are retained unchanged; REMAINING_ROADMAP.md records the merged-state disposition.

## Cleanup performed

- Removed five modules with no callers, route, script, package entry or manual runtime entry: `FloatingRemindersButton.tsx`, `loading-skeleton.tsx`, `ui/separator.tsx`, `use-focus.ts`, `use-mobile.tsx`. Current Reminders, navigation, responsive styles and UI components remain active.
- Removed the sole unused direct dependency `@radix-ui/react-separator`. The lock diff removes only that dependency/package entry; no version upgrades. Frozen-lock `npm ci` verifies installation.
- Removed the private food search-index map, builder and rebuild calls. Search already reads/scans the catalog and keeps the same scoring, order and limits. `getSearchKey` remains used by search. New synthetic tests pass both before and after removal, including custom create/edit/delete and backup validation. This is a proposed resolution of FC-028 by deleting redundant work, not a new search implementation or a measured performance claim.
- Removed routine food progress/search logs and catalog/name dumps. Error logging remains. No stored catalog records or persistence write semantics changed.
- Removed four SHA-256-identical duplicate review images, updating live Markdown links to the retained originals. The nine deleted modules/images total 136,091 bytes of working-tree content, excluding dependency/code-line savings. Git history still contains earlier files; no historical repository-size reduction is claimed.

Duplicate mapping (removed → retained):

- `review/stage2/logs-before.png` → `review/stage1/logs-after.png`
- `review/stage3/before/calculator.png` → `review/stage2/calculator-after.png`
- `review/stage3/before/logs.png` → `review/stage2/logs-after.png`
- `review/stage3/before/reminders.png` → `review/stage3/after/reminders.png`

Original audit inventories/hash reports remain baseline evidence and intentionally retain historical filenames. Current review-document image links are checked separately.

## Intentionally retained

The cleanup removes no working feature, styling, navigation, storage key/format, migration reader, backup flow, service worker, dependency chain with active users, or actual user records. Finished safety corrections add only their documented recovery/error views. Retained the historical food catalog/generation tools because their provenance/recovery role is not proven obsolete; dormant widget implementations/settings; active Calendar recent activity; layout diagnostic/manual test pages; legacy backup/custom-food tools; original findings, roadmap and audit artifacts. Removing these merely to reduce file count would risk discarding functionality or evidence.

## Remaining risks and next improvement

Confirmed high-severity FC-003 overwrite paths remain outside the merged workout correction (and proposed cardio correction), particularly wellness initialization and food initialization/dated records. FC-005 stale writers remain an essential investigation. The included food-save correction addresses catalog save reporting but does not fix all food persistence. Cleanup does not resolve those risks, and a clean build is not proof that data loss is impossible.

The best next improvement after reviewing this final PR is protecting remaining automatic initialization writers, beginning with hydration/meditation and the food initialization paths already identified in the existing audit. Broader refactoring, architecture changes, dormant feature decisions and optional optimization stay deferred. Implementation stops at this handoff rather than expanding the project again.

Physical iPhone Safari/PWA, actual Files/iCloud save completion, OS quota/eviction and suspend/resume behavior have not been verified here. Automated Chromium results are not real-device verification.

## Validation

The final combined branch was validated after resolving both regression-config merge conflicts. Node v24.19.0 / npm 11.9.0.

| Check | Actual result |
| --- | --- |
| `npm ci --cache /tmp/fitcircle-npm-cache` | Passed, frozen lock; 282 packages installed |
| `npm run check` | Passed |
| `npx tsc --noEmit -p tests/tsconfig.regressions.json` | Passed, including all cardio/food/search regressions |
| `npm run audit:storage` | 211 call sites, zero errors |
| `npm test` | 203 passed, zero failed/skipped/todo |
| `npm run build` | Passed in 12.41s; existing chunk-size warning remains |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 147 passed in 1.8m, no retries |
| `git diff --check` | Passed |
| Edited review-image links / dependency manifest-lock check | Passed |

The initial default-cache install failed because the sandbox's default npm cache path was unavailable; a writable `/tmp` cache resolved it. The checks initially unable to start after that failed install were all rerun successfully after installation. No checksum/TLS verification was bypassed. The full browser suite includes existing navigation, offline/PWA update, backup/restore and viewport coverage, plus the completed recovery/save regressions. No physical-device verification is claimed.

