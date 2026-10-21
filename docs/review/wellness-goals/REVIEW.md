# Wellness goal calculation corrections

Proposed changes for review, based on the pre-edit [audit](AUDIT.md). No migration or historical reset is part of this correction.

## Before / after calculation table

| Surface | Before | After |
| --- | --- | --- |
| Daily cardio circle / widget / Goals | Inconsistent readers and cached totals | Today's valid sessions ÷ selected daily target |
| Weekly cardio circle / widget / Goals | Weekly goal rounded into a daily goal during loading; main circle always used today | Valid sessions Sunday through today ÷ original weekly target, once; 75/150 = 50% |
| Weekly cardio summary | Rolling elapsed-time week; target multiplied by 7, including an already-weekly target | Local Sunday calendar week; weekly target unchanged. Only a saved **daily** target is multiplied by 7 for the separately labelled weekly plan |
| Cardio goal preview | All-time average against current goal | Current selected day/week numerator against edited target |
| Hydration main / goal preview / Goals | Stale currentDayOz; historical edits/deletes changed today's cache | Sum today's valid entry amounts; old cached counters do not determine progress |
| Meditation main / goal preview / Goals | Daily page vs seven-day legacy-only shared reader; defaults 20 vs 10; mixed dialog numerator/percentage | Sum today's valid sessions for modern dailyLogs, legacy array or legacy object; one daily goal source and default 20 |
| Fasting main / Goals | Completed logs treated as current fast; main goal denominator was maximum display hours | Explicit **Completed Today** achievement, attributed to end date, against fastingHours; 16/16 = 100%. Active-fast state is absent, never inferred |
| Fasting goal dialog | Calendar-day mean labelled average fast duration | All-time mean per valid completed fast, clearly labelled historical |
| Fasting consistency | Mixed all-time duration averages used as current achievement | Last ten local calendar days: days with at least one completed fast meeting the current duration goal ÷ 10. One qualifying day = 10% |
| Recent hydration/meditation analytics | Ten calendar-day calculations labelled logs/per-log averages | Explicit ten-calendar-day totals, calendar-day mean and labelled retrospective shortfall; inactive days included |
| Cardio recent analytics | Weekly total under a “Last 10 Logs” heading, beside a ten-day average | Weekly total and shortfall labelled this calendar week; separate ten-day calendar average |
| Historical analytics | Mixed labels and DST-sensitive elapsed-day denominator | Separate disclosure with all-time calendar-day and logged-day averages; validated dates/values, inactive calendar days and calendar ordinals |
| Shared Goals and wellness score | Duplicate cache/seven-day/all-time math and a duplicate weight alias in widget average | Same four-domain selectors as feature hooks; current goal periods and completed-today fasting labels; duplicate alias excluded |
| Invalid inputs | NaN/Infinity, false zero-target completion or negative ratios possible | Finite positive targets, invalid records excluded from calculations, 0–100% display guards, no zero-target achievement |

The fasting duration heat bars retain the existing **display maximum** only as a labelled visual duration scale. Goal achievement circles and shared percentages use the configured duration goal, independently.

## Shared sources and periods

- Local phone calendar days; weeks start Sunday. Future dates are excluded. No rolling elapsed 168-hour window or UTC parsing of date-only keys.
- Goal precedence per field: unified goal → legacy goal → embedded hydration goal → existing domain default. A present invalid numeric goal produces no achievement; unreadable unified goals do not silently become successful defaults.
- Cardio reads the existing canonical record and legacy aliases/goal through the established safe initializer. Its actual selected type/period/target drives the overview. Old separate unified cardio-weekly fields remain preserved for compatibility, rather than competing with the selected feature goal.
- Canonical daily records take precedence over legacy snapshots when both are present; original records remain untouched. Explicit legacy date strings are projected into local date keys only in memory.
- Defaults: hydration 64 oz/day, meditation 20 min/day, fasting 16 hours/fast, existing cardio default 21 min/day. Existing saved goals are not rewritten to defaults.
- Completed fasts are attributed once, on their end date; stored valid durations remain authoritative. Recent consistency is evaluated against the current configured goal; no historical achievement fields are invented.
- There is no existing persisted active-fast workflow. This PR does not create one: it explicitly separates the absence of active fasting from completed-today achievement and historical performance.
- Weight/body-fat and workout consistency formulas are outside this four-domain correction; their existing selectors are reused rather than duplicating or migrating their records.

## Preservation and compatibility

Rendering, initialization, midnight rollover, focus and goal-progress computation do not save normalized/default history. Legacy hydration metadata/IDs and meditation arrays/date strings are not migrated on mount. The same records survive repeated opening/reloading unchanged, including stale cached counters: current totals are derived views.

Explicit record edits update the selected record, retain unrelated entries/metadata, and recalculate the relevant day's cache. Historical edits/deletes do not change today's actual record totals. The small shared writer is restricted to the three registered hydration/meditation/fasting keys; it checks original bytes, performs a single-record write before updating React state, and reports read/write failures.

Goal edits preserve unknown goal fields and use the existing validated backup transaction for unified/legacy goal fields. They do not rewrite activity history to synchronize embedded caches.

No storage keys, JSON backup version, destructive migration, dependencies, service worker, navigation or safe-area layout change. Backup validation gains a narrow legacy meditation-object branch (**logs array**, without canonical dailyLogs). This format was already read by the app but previously depended on mount-time migration to become exportable. It now round-trips exact raw bytes without migration. An invalid canonical dailyLogs field is not hidden by that legacy branch.

Malformed/unreadable records remain unchanged and show an error, rather than being autosaved as empty data. Unrecognized malformed legacy shapes still need a verified backup or separate recovery work; no automatic repairs are attempted. A transient write failure may require reload before retrying.

## Validation

- Application TypeScript: passed (npm run check).
- Regression-test TypeScript: passed (tests/tsconfig.regressions.json).
- Unit/regression suite: **265 passed, 0 failed**.
- Storage audit: **161 call sites, 0 errors**; inventory regenerated.
- Production build: passed; existing bundle-size/Browserslist warnings remain.
- Complete browser suite: **210 passed** before the final nested-validation and read-only history-view refinements.
- Final focused wellness browser suite: **12 passed** after those refinements.
- git diff --check: passed.

Tests use isolated synthetic data only. Coverage includes fixed dates, current-day and week boundaries, midnight, DST, over-one-year inactivity, modern/legacy storage, invalid values, historical edits/deletes, goal changes, completed fasts crossing midnight, shared-hook agreement, failed writes, and complete JSON backup round trips.

Physical iPhone Safari/PWA testing was not performed. Manual checks remain: local-zone changes while suspended, wake across midnight, goal-dialog reachability with the iOS keyboard, and actual Files backup download/restore. The existing diagnostic timing cleanup stays separate.
