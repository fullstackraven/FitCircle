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
