# Set-based workout tracking

Workout definitions add optional `setsGoal` (default 1). `dailyGoal` remains total reps. New daily logs retain `count` (reps) and `goalAtTime` (rep target), and add `completedSets` and `setsGoalAtTime`. Existing keys and backup version are unchanged.

Each tap records one set. Cumulative reps are `floor(completedSets * goalAtTime / setsGoalAtTime)`. Undo recalculates the previous cumulative total exactly. The hook updates the log and existing workout-count mirror atomically. Progress reads the log, with no separate persisted set counter.

## Compatibility and edits

- Reads never migrate historical logs or fabricate completed sets.
- A positive numeric legacy record or any legacy object remains in rep mode for that day, even after undo to zero. Home explicitly labels this mode.
- An untouched day uses the definition's sets target, defaulting to one for older definitions.
- Set logs retain their original daily rep/set snapshot, including after undo to zero. Editing targets applies to subsequent untouched days.
- An explicit rep-goal edit freezes positive numeric legacy records into rep-only objects under the previous goal. Their reps and completion are preserved. Existing object snapshots remain unchanged.
- Dynamic Overview edits completed sets for set logs and reps for legacy logs. Arbitrary actual reps per set are outside this prescribed-rep model.
- Calendar, monthly/all-time completion, and widget progress recognize set metadata. Rep totals and the corrected monthly denominator remain rep-based and elapsed-calendar-day-based respectively. Recovery fallback recognizes set logs while retaining its legacy counting rules.
- Backup/initialization validation accepts old records and validates paired set metadata and exact credited reps for new records. Unknown metadata is retained.

## Verification

- Application and regression TypeScript checks passed.
- 119 focused unit tests passed across set tracking, historical integrity, initialization, and monthly consistency; the additional recovery fallback test passed separately.
- 17 distinct focused browser tests passed across set interactions, legacy transition, next-day targets, Calendar agreement, Home hold/undo, mobile editors and routine configuration/backup. Initial editor-height and updated-label failures were corrected; affected tests were rerun successfully.
- Two affected appearance tests passed while generating separately named `-sets` references. Original screenshots and zero-tolerance assertions remain intact. Only directly changed workout views and their overlay backgrounds received new references.
- No full local regression suite or production build was run. GitHub Actions owns full production validation. A preliminary browser run selected stale preview assets and was stopped; reported interaction results use the current development app.

## Manual checks / limitations

Confirm native iPhone keyboard and hold interactions in Safari and installed PWA. Cross-page storage synchronization retains the existing hook architecture. The recovery fallback retains legacy behavior for old object logs; this change only adds set-log recognition there. Older application builds do not understand set interaction semantics, so avoid continuing workout entry in an old cached build after adopting sets.

Review images: [workout editor](../../../tests/browser/appearance-phase-two.spec.ts-snapshots/workout-editor-sets-linux.png), [Home](../../../tests/browser/appearance-phase-two.spec.ts-snapshots/home-sets-linux.png), [expanded routines](../../../tests/browser/appearance-phase-two.spec.ts-snapshots/routines-expanded-sets-linux.png).

## Pre-merge audit corrections

Total Reps mutation/input range is restored to 1–9,999; Sets must be an integer from 1 through Total Reps. The modal and hook share validation. Invalid text remains editable, Save/Update is disabled, and compact inline feedback explains the range. Initialization and backup validation are deliberately not narrowed: existing stored records remain accepted.

Historical schedules **cannot be reconstructed reliably**. `Workout` stores only current `scheduledDays` and `routineId`; it has no authoritative creation date. `goalHistory` records rep targets, not schedule membership. Routine `createdAt` dates creation only; `updateRoutine`, `assignWorkoutToRoutine`, and `updateWorkout` overwrite current membership/days without effective-date history. Deletion removes definitions/logs through the existing workflow. Set logs snapshot targets for started workouts, but not the untouched workouts expected that day.

Consequently historical Calendar, monthly/all-time completion, and Dynamic Overview retain their existing activity-based interpretation. Completing one recorded workout can count as a historical completed day even if other workouts are scheduled today. Today's schedules must not be applied retroactively. Recovery semantics, rep totals and consistency denominators are unchanged by this correction.

A separate follow-up PR is recommended: capture a local-date daily obligation snapshot containing all expected workout IDs and their rep/set targets, including untouched workouts and an explicit empty/recovery state. Define snapshot timing, schedule edits, creation/deletion, and recovery interactions; retain immutable/tombstoned IDs. Alternatively store effective-dated schedule and routine membership changes plus creation/deletion history. Only dates with authoritative new snapshots should use stricter completion; older dates must retain legacy behavior. PR #90 introduces none of this data or a historical migration.
