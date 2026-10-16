# Independent modernization roadmap

Do not proceed beyond A until it is reviewed. No automatic merge or deployment. Priorities: preserve data first, confirmed correctness next, security/reliability, measured performance, then maintenance/cleanup. Each row is a PR boundary; grouped settings work explicitly splits into sub-PRs. All require check, storage audit, unit, build and browser results in their PR description. No numerical estimates substitute for fixture work.

## A — Audit and initial regression safeguards

- Findings: FC-006
- Scope / before→after: One copied-array selector; docs/ledger plus unit/browser safeguards; no visible order/data change
- Expected files: hooks/use-dashboard-widgets.ts; tests/dashboard-and-dates.test.ts; tests/browser/persistence-regressions.spec.ts; tests/tsconfig.regressions.json; docs/revamp
- Complexity / regression risk: Small
- Tests / dependencies: No prerequisite; executed check/storage/build pass,56 unit +55 Chromium tests pass; new tests type-check; details in 10
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert this PR; no data rollback
- iOS impact: No viewport/worker changes

## B1 — Historical migration emergency-sized correction

- Findings: FC-001/002
- Scope / before→after: Preserve authoritative goals and genuine timestamps; avoid sensitive logging
- Expected files: hooks/use-workouts.ts; synthetic legacy fixtures/tests
- Complexity / regression risk: Medium/High
- Tests / dependencies: Legacy fixtures first; compare all before/after fields
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert code; keep original exported backups; never reverse-migrate by guessing
- iOS impact: Startup behavior only; device reload/backup check

## B2 — Reject failed initialization without overwrites

- Findings: FC-003
- Scope / before→after: Keep malformed bytes recoverable; stop autosave after failure
- Expected files: storage-utils.ts; one owning hook/service per PR; tests
- Complexity / regression risk: High
- Tests / dependencies: Per-domain malformed/quota tests, no broad store rewrite
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert code; originals stay untouched
- iOS impact: Verify recovery UX in installed PWA

## B3 — Honest food save failures

- Findings: FC-004/029
- Scope / before→after: Propagate persistence errors and validate edits against backup contract
- Expected files: local-food-service.ts; food forms; tests
- Complexity / regression risk: Medium
- Tests / dependencies: Quota/denial, successful edits, export after create
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert; no schema/key changes
- iOS impact: Actual quota/Files behavior manual

## B4 — Isolated settings correctness

- Findings: FC-009/010/011/016
- Scope / before→after: Separate sub-PR per grouped goal, meditation draft, calculator source, invalid route
- Expected files: use-goals.ts; fasting/meditation/calculator/overview pages; tests
- Complexity / regression risk: Small/Medium
- Tests / dependencies: Fixed fixtures; unchanged formulas and deep links
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert each independent sub-PR
- iOS impact: Keyboard/draft check

## C — State/persistence reliability

- Findings: FC-005/008/014/018/019
- Scope / before→after: One domain writer/subscription and explicit pause/date compatibility policy
- Expected files: Selected hooks/services; compatibility tests
- Complexity / regression risk: High
- Tests / dependencies: Depends on B characterization; two tabs, restore while mounted
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert adapter without data migration; export before rollout
- iOS impact: Suspend/relaunch + midnight validation

## D — Shared utility consolidation

- Findings: FC-007/012/013
- Scope / before→after: Correct proven DST first, then consolidate equivalent calculations only
- Expected files: date-utils.ts; calculation helpers; consumers/tests
- Complexity / regression risk: Medium/High
- Tests / dependencies: DST/calendar/unit/formula reference matrix
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert code; never rewrite historical logs
- iOS impact: Cross-engine date behavior check

## E — Components, hooks and accessibility

- Findings: FC-017/020/021/022/024
- Scope / before→after: Named controls/toast renderer; incremental meal/sidebar extraction; decide widget integration
- Expected files: Shared components and one page per PR
- Complexity / regression risk: Medium
- Tests / dependencies: Feature matrix, keyboard/touch, all widget schema fixtures
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert isolated extraction; saved settings remain
- iOS impact: Real keyboard/audio/overlay review

## F — Dependency/tooling modernization

- Findings: FC-025/027
- Scope / before→after: One compatible chain per PR, semantic color token fix separately
- Expected files: package.json/lock/config; focused style tests
- Complexity / regression risk: Medium
- Tests / dependencies: Advisory triage, exact lock diff, full suite; Node22 CI
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert lock/manifest pair
- iOS impact: Bundle/runtime compatibility

## G — Proven dead code/assets

- Findings: cleanup candidates, FC-026
- Scope / before→after: Only validated removals; maintainer confirms license separately
- Expected files: Specific approved paths from 05
- Complexity / regression risk: Small/Medium
- Tests / dependencies: Reference + manual-entry + compatibility review and build
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert removal; retain recoverable provenance
- iOS impact: Preserve diagnostics until accepted replacement

## H — Measured performance

- Findings: FC-015/023/028
- Scope / before→after: Index/history parsing, polling and lazy routes only with equivalence
- Expected files: One hotspot per PR; benchmark/behavior tests
- Complexity / regression risk: Medium
- Tests / dependencies: Stable cold/warm measurements, search order, offline lazy chunk recovery
- Data compatibility: retain keys, backups and historical records; any necessary format extension requires its own compatibility proposal and old-format fixtures.
- Rollback: Revert optimization; no stored-format changes
- iOS impact: Physical iPhone scroll/background profiling
