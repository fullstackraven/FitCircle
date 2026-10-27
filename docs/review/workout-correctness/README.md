# Root causes (before implementation)

1. `useWorkouts` allocates independent React state per mount and each mount writes its entire snapshot in an effect. Same-document consumers do not subscribe to one another. A stale workout widget or Journal consumer can overwrite a newer routine edit or daily log.
2. `workoutProgress` prefers daily `setsGoalAtTime` and `goalAtTime`. This deliberately freezes a started day's targets, so changing Pushups from one to two sets updates the definition but leaves today's ring at one. Untouched workouts do not have this snapshot, explaining the difference between workouts.
3. Mutation rejection/persistence failures are not returned to workout callers. The modal closes unconditionally after calling its callback.
4. Daily rollover has a separate interval per consumer and resets count mirrors using stale closures.
5. Historical expected-workout lists cannot be reconstructed: current schedules/membership overwrite earlier values. Do not apply current schedules retroactively.

Corrective plan: one synchronous external store with subscriptions and commit-before-notification persistence; atomic reducer-style updates; explicit confirmation when replacing a started day's targets, retaining already credited reps separately from the new prescribed sets; consistent completion helpers and focused multi-consumer tests. No historical migration.

## Implemented architecture and policy

`workout-store.ts` owns one cached document and synchronous commits. `useSyncExternalStore` subscriptions update every mounted consumer. Each action reads the authoritative current document, applies its functional update, persists successfully, then publishes. Failed writes leave the prior state visible and return failure. Initial reads do not write. Storage events additionally reconcile other tabs; they are not the same-document synchronization mechanism. Journal actions use the same commit path. Cross-tab simultaneous writes remain a localStorage platform limitation; this PR serializes same-document consumers.

Changing a started day's targets asks: keep the credited reps and restart sets at the new target? Cancel retains the form and prior data. Confirm preserves the prior rep total as optional `carriedReps`, resets today's completed sets to zero, and sets today's new targets. Each new set adds its cumulative allocation to that retained total. Undo reverses only sets performed after this confirmation; retained reps are not silently removed. Untouched targets update immediately without confirmation. Subsequent dates start normally without a carried balance. Historical dates are not retargeted. A day's recorded reps can therefore exceed its new prescribed target; this is intentional retained volume, not false set completion.

`count = carriedReps + floor(completedSets * goalAtTime / setsGoalAtTime)` for confirmed retargeted records. Existing logs omit `carriedReps` and retain their previous formula. Initialization and backup validation accept the optional nonnegative integer offset and validate exact totals. JSON backup version and storage keys are unchanged. Old backups remain valid; downgrading to older application validators after creating carried-rep records is not supported without an explicit recovery plan.

Additional corrections: workout saves now return durable success before closing; rejected/cancelled saves keep drafts. Home reports failed tap/undo saves. Dynamic Overview refreshes only its workout section on shared document changes, without clearing journal/supplement drafts. Rollover uses an authoritative-date guard, a midnight timer and resume check, so duplicate mounted consumers cannot reset fresh progress.

## Coverage and validation

The audit traced definitions/schedules in Home and Routines, circle interactions, Calendar completion, Dynamic Overview edits, all-time/monthly statistics, Recent Activity rep aggregation, workout widgets, recovery fallback, independent duration records, initialization and full JSON backup. Existing historical schedule limitations and corrected monthly denominators remain unchanged. Duration data uses its existing separate storage path.

- Application and regression TypeScript checks passed.
- 75 focused unit checks passed across shared state, set allocation, monthly consistency and initialization; the new carried-rep backup round-trip passed separately.
- 10 existing focused set/routine integration tests and 3 new browser regressions passed. New regressions cover two simultaneously mounted subscribed consumers with interleaved definition/tap/journal writes, rejected storage writes retaining editor drafts, and completed one-set Pushups changing to two sets with cancellation/confirmation.
- Test-harness issues (a stale preview server and dynamic module/fixture placement) were corrected before the reported passes. No assertions or screenshot tolerances were weakened.
- No full local suite, production build, screenshot gallery or deployment was run. GitHub Actions owns full CI.

Remaining manual checks: native iPhone confirmation wording, keyboard/footer accessibility, app background/resume over midnight, and concurrent tabs. Historical expected-workout lists still cannot be reconstructed; that requires the separately proposed forward-looking daily schedule snapshot feature.
