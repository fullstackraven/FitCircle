# Routines 2.0

Routines configure training. Home performs and logs it. No programs, equipment brands, recommendations, automatic periodization, or logging controls are bundled into the planner.

## Data and identity

`workout-tracker-data` remains the sole workout document. Reusable definitions keep their IDs, colors, standalone weekday schedules and optional equipment, notes, weight in pounds and rest in seconds. New definitions carry a prescription (`targetType`, `sets`, `perSet`); `dailyGoal` remains its computed total and `setsGoal` its set count for existing readers. Duration targets and totals use **seconds**, never repetitions. Zero external weight is valid; arbitrary resistance levels belong in notes.

Each routine stores ordered `placements`: stable placement ID, exercise ID, prescription, optional pounds/rest. Removing or moving a placement changes only that routine. Weekdays belong to the routine, so changing them does not rewrite definitions. A definition can be reused in multiple routines; the same definition appears at most once within a routine. Unassigned definitions retain their standalone schedules and are available through Add Exercise within routines.

Home deliberately has **one daily logging identity per reusable definition**, not one per placement. Scheduled routines are ordered by creation timestamp and then ID; the first placement for a shared definition supplies the daily prescription. Every contributing routine name is shown. Other placements retain their independent planned targets, but do not create extra circles or receive independent completion credit. Use separate definitions if two genuinely separate bouts must be logged independently on the same day.

The first daily action snapshots the goal, set count, target unit, name, color and routine names. Later schedule, prescription and variation changes do not replace that snapshot; the new prescription applies to future unlogged days. Undo and historical editing use the snapshot. Duration circles credit a completed set of prescribed seconds with each tap; they do not measure elapsed time or auto-run the Home timer. The separate workout session and timer controls are unchanged.

Variations are optional manually selected names with placement-keyed target/rest overrides. Missing overrides use base placement settings. Renaming, switching or deleting a variation never changes activity. Weight/color/name remain definition or base-placement settings; rep ranges and automatic periodization are intentionally omitted.

## Legacy migration and durability

Migration is a pure, idempotent read projection. For each routine lacking `placements`, include all definitions whose standalone weekdays overlap the routine weekdays; an empty/missing exercise schedule means daily. Sort by exercise ID and use `legacy:<routine ID>:<exercise ID>` placement IDs. An existing placements array, including an empty one, is authoritative. This matches the previous Routines overlap presentation rather than interpreting the dormant `routineId` field as membership.

Definitions, colors, weights, journals, dates and daily logs are not changed by this migration. Accepted legacy array definition containers become an ID-keyed map; duplicate IDs cause safe recovery rather than overwriting definitions. Unassigned exercises remain available. The complete projected document is written only by the next successful explicit mutation (or the existing midnight count reset). Reads never write partially migrated data. The shared store validates the entire next document and performs one localStorage write; failed writes leave the durable original and visible draft intact.

For evenly divisible legacy targets, `sets × perSet` equals the old total. Uneven totals retain an explicit `legacyTotal`, shown as a legacy split: 20 reps / 3 sets still credits 6, 7 and 7 reps, totaling exactly 20. No stored log is rounded. Changing sets or per-set targets explicitly replaces that split. On a definition target edit, unsnapshotted numeric legacy logs are wrapped with their previous goal and repetition unit so later edits cannot reinterpret them; recorded amounts stay exact.

Backup validation accepts legacy and planned forms, archived definitions, placement order, optional details, variations and typed snapshots. Existing backup/import/export formats and keys are unchanged. Exported raw records remain byte-exact; migration occurs when restored data is read, and is durably committed atomically with a subsequent mutation.

## Deletion and historical consumers

- Remove placement: only the routine draft changes; Save commits it. Definitions and logs stay intact.
- Delete routine: confirmation required; shared definitions and all history stay intact.
- Delete definition: confirmation required; remove active placements and archive the definition under `archivedWorkouts`. Keep daily logs. Archived exercises do not appear as Home circles or exercise choices.
- Historical activity edits remain separate operations. This planner does not delete historical activity.

Home, Calendar, Dynamic Overview and Recent Activity use the shared projection/progress helpers. Calendar and all-time/monthly/individual statistics exclude typed seconds from repetition totals. Current-day statistics include already-recorded activity even when its definition is archived or its schedule changes. Duration remains visible separately in historical detail, Recent Activity and workout statistics. Recovery completion uses set/goal snapshots. Journal consumers keep their existing shared-store behavior. Profile training summaries use the shared statistics calculation. Legacy untyped logs always mean repetitions, even if a definition later becomes duration based. Metadata already destroyed by an older version cannot be recovered; any unmatched raw log entries remain untouched.

## Verification and limits

Focused coverage lives in `routine-planning.test.ts`, `routines-v2.spec.ts` and the existing workout, initialization, backup, routing and configuration regressions. It exercises overlap migration/idempotence, uneven totals, reuse and deterministic daily identity, manual variations, archival, separate units, old/new backup round trips, routed draft handoffs, Home sets/undo and mobile layouts. Physical iPhone behavior is not inferred from browser viewport checks.

Saving a new reusable definition is an explicit independent Save Exercise operation. If its parent routine draft is later canceled, the definition remains available through Add Exercise; the uncommitted placement is discarded. No training data is silently deleted to undo an explicitly saved definition.

## Routine controls

The FitCircle header is shared with Home. Add Exercise expands an inline selector for existing definitions or creating a new one. Pencil actions inside that selector edit reusable definitions; tapping an assigned row edits its routine-specific targets. Notes, variations and exercise detail fields are directly visible, without native disclosure triangles.

Drag only the six-dot handle to reorder within a routine; touch/pointer capture suppresses ordinary scrolling during the gesture, with controlled edge scrolling for long lists. The raised row and insertion line show the pending move. Release commits; Escape or pointer cancellation discards it. Focus a handle and press Arrow Up/Down for keyboard reordering, announced by a live region. Main-card moves save immediately through the existing validated routine operation. Editor moves remain a draft until Save Routine; Cancel keeps the stored order unchanged.
