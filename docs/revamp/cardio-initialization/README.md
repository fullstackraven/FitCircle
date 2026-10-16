# FC-003: Cardio initialization safety

Base: main `fc09b8a`, after merged PRs #24, #26 and #27. This is the cardio portion of expedited Batch A, not completion of FC-003 across all stores. Original audit findings remain unchanged; see ../REMAINING_ROADMAP.md for merged dispositions and deferred work.

## Confirmed failure and change

The original hook started with defaults, then loaded in an effect, wrote migration output and independently autosaved its initial defaults before loaded state committed. Parse failures selected defaults; denied reads also fell through to autosave. Incomplete objects could crash readers without a recovery screen. Merely mounting valid data could also rewrite weekly goals, caches and formatting.

Regression-first commit `a0b13d8` adds synthetic fixtures before production changes: 40 unit tests ran against unchanged cardio code (2 passed, 38 failed). Two pre-fix browser checks failed on malformed preservation/recovery and valid-document initialization normalization. No installed-PWA records or personal backup files were accessed.

The hook now reads and validates synchronously before any state/effect commits. Initialization performs no writes. Existing missing storage can create an in-memory default, but malformed, incomplete or unavailable data raises a typed error. Autosave only follows later edits/date rollover. A narrowly typed boundary offers exact original strings in a legacy raw-string recovery JSON, retry and the existing Settings restore route. The download uses PR #27's reviewed delayed cleanup and request-only wording; it cannot confirm a Files save.

Weekly goals still use the same rounded daily display/calculations, but the original goal/metadata is retained on unrelated edits. Modern logs, zero sessions, custom types and unknown metadata are preserved. Legacy numeric-string values are converted only in a runtime projection; source aliases are never deleted or rewritten. Timestamp-only entries derive their historical local date, not today's date. Date-only legacy entries have no invented current time. Ambiguous missing dates/timestamps or malformed values block loading rather than being filtered out or converted to zero.

## Persistence inventory

| Key | Readers/initialization | Writers |
| --- | --- | --- |
| `fitcircle_cardio_data` | `useCardio`, used by Cardio page; dormant `CardioWidget` also calls hook. Legacy `goals-utils.ts` has read-only cardio calculations outside the current entry graph. | `useCardio` autosave after edits/date rollover; backup restore/recovery and explicitly confirmed Settings erase. No initialization/migration write remains. |
| `fitcircle_cardio`, `cardioLogs`, `cardio_entries`, `cardio` | Ordered legacy fallback only if primary key is truly absent. Arrays and entries wrappers supported; earlier empty arrays permit later aliases. Invalid earlier aliases block rather than falling through. | Backup restore/recovery or confirmed erase only; hook never writes/removes aliases. |
| `fitcircle_goal_cardio` | Read/validated when the loaded record lacks `goalUserSet`; existing primary goal has precedence. Separate goal is usable when legacy source lacks one. | Explicit `updateGoal` compatibility write, backup restore/recovery or confirmed erase. |

Registry, backup validators, storage keys, serialized schemas and restore replacement semantics are unchanged. A primary record wins over old aliases, even if unreadable: the hook does not silently fall back to a different history. Recovery snapshots include successfully read relevant strings, not a complete backup of every origin key; unreadable bytes cannot be downloaded.

## Backup compatibility and limitations

- Legacy object/raw-string and v2 backup validation remains unchanged. Incomplete accepted primary backups can still import, but cardio initialization then blocks with explicit “cardio tracking has not resumed” wording. Recovery download and another verified restore remain available.
- First editing an alias-based legacy record saves the existing canonical daily-log format to the primary key, retaining the alias unchanged. Raw legacy `entries` are not copied into the canonical record, because numeric-string legacy entries may violate its existing backup validator. Sessions/metadata remain in daily logs, and the full original entries remain in the alias. Export/restore of this edited state is covered by an actual browser round trip.
- Mixed primary modern/legacy records are not guessed/merged: modern daily logs drive the view, and original `entries` remain unchanged. Pre-existing primary entries that violate the existing backup schema can still prevent full export; initialization does not silently repair them or loosen validation. Keep the raw recovery copy before manual repair.
- Valid-state quota failures still use existing console reporting: this PR establishes that failed writes retain the previous stored string, not successful saving of pending edits. FC-004 and broader write-error UX remain separate.
- Independent concurrent hook snapshots remain FC-005; this does not add a shared store or multi-tab synchronization. Dormant widgets are not mounted by current Home, so saved widget settings alone must not be reported as an active mounted consumer.
- Persistent browser denial/eviction and save completion remain platform limits. Physical iPhone Safari/PWA, Files/iCloud saving, suspension and midnight/locale behavior need manual verification with disposable synthetic profiles. Chromium is not physical-device verification.

## Validation

The focused post-fix run passed all 40 unit tests and 37 browser cases. Early browser harness assumptions were corrected: edit controls apply to today's sessions (freeze the synthetic clock), restores must finish navigation before another navigation starts, and dormant widget settings do not mount widgets. The extra legacy first-edit/export test exposed an incompatible raw-entry projection; canonical save now passes that round trip without changing aliases.

Full-suite results are recorded below after execution. Diagnostic issue #25 is not changed or suppressed. No service-worker, viewport, design, dependency or unrelated feature changes are included. This work must be reviewed before merge/deployment.

Actual full revalidation (Node v24.19.0 / npm 11.9.0): Application TypeScript and regression TypeScript passed; storage audit: 211 sites, zero errors; all 191 unit tests passed; production build passed (existing chunk-size warning); all 146 Chromium browser tests passed in 1.8m without retries; git diff --check passed.
Commands: `npm run check`; `npx tsc --noEmit -p tests/tsconfig.regressions.json`; `npm run audit:storage`; `npm test`; `npm run build`; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`; `git diff --check`. All exited 0.
