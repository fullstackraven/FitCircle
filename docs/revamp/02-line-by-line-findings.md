# Line-by-line source findings

Audited main `0ab26bf20e7c47e9e8068d22a36a1a9070cece63`. Ranges refer to that snapshot. Review coverage is in [audit-ledger.json](audit-ledger.json), including files without findings. Confirmed describes source or synthetic evidence; it does not imply physical-device verification. No Critical finding was established. Findings not explicitly addressed by batch A remain open.

## FC-001 — High — Migration overwrites authoritative historical goals

- Location: `client/src/hooks/use-workouts.ts:112–205`
- Status / confidence: Confirmed / High
- Evidence: Synthetic initializer fixture: goalAtTime 20 becomes 5 when a numeric entry and missing goalHistory trigger inference; evidence/synthetic-initialization-and-dst.json. All entries are rewritten, not just numeric legacy records.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Historical completion percentages and goals can change on opening a screen.
- Proposed solution: Separate minimal fix: retain explicit goalAtTime; define an evidence-backed policy for genuinely unknown legacy goals. Do not disable migration wholesale.
- Regression risk: High
- Required tests: Mixed numeric/object logs; explicit goals; ties; missing/deleted workouts; multiple mounts; before/after backups.

## FC-002 — High — Timestamp cleanup removes genuine timestamps and logs journal text

- Location: `client/src/hooks/use-workouts.ts:68–104`
- Status / confidence: Confirmed / High
- Evidence: includes(T18:00:00) accepts genuine timestamps with any fractional seconds; synthetic .123Z becomes a plain string. Console logs first 50 characters of the journal.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Loss of journal time metadata and unnecessary private text in logs.
- Proposed solution: Require actual migration provenance; preserve ambiguous timestamps; remove text logging in a separate patch.
- Regression risk: High
- Required tests: Genuine 18:00 timestamps, known estimated fixtures, strings, missing timestamps, repeated mount.

## FC-003 — High — Malformed stored JSON can be replaced by default state

- Location: `client/src/hooks/use-workouts.ts:51–64`
- Status / confidence: Confirmed / High
- Evidence: safeParseJSON returns fallback without an error marker; the hook subsequently persists that fallback (lines 215–222). Similar autosave patterns occur in hydration, meditation, reminders and dated food loading/saving. Food migration also treats malformed existing food JSON as an empty database.
- Reproduction: In a disposable context seed workout-tracker-data with malformed JSON, mount Home, and compare bytes after effects; inspect source fallback/save path. This failure mode is source-confirmed, not a real-user experiment.
- User impact: Opening a feature can overwrite recoverable raw bytes after parse failure; wrong-shaped valid JSON can instead crash.
- Proposed solution: Validate without replacing source bytes; suppress autosave after failed initialization, present recovery/export of raw data. Audit each writer independently.
- Regression risk: High
- Required tests: Malformed JSON, null and wrong shapes; reload; raw bytes preserved; quota denial; recovery UI.

## FC-004 — High — Food saves report success after storage quota failure

- Location: `client/src/lib/local-food-service.ts:190–196`
- Status / confidence: Confirmed / High
- Evidence: Synthetic setItem throws QuotaExceededError: addCustomFood returns success:true but stored foods remain []; evidence/synthetic-food-quota.json. Save helper swallows the exception.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: New or edited foods can appear saved although they are lost on reload.
- Proposed solution: Propagate failed writes to callers and visible error state; retain form contents. No key or schema changes.
- Regression risk: Medium
- Required tests: Create/edit/delete/restore food with throwing storage; unchanged original bytes and failed response.

## FC-005 — High — Independent hook snapshots can overwrite newer whole-store state

- Location: `client/src/hooks/use-workouts.ts:215–222`
- Status / confidence: Probable / High
- Evidence: Whole workout document autosaved from hook-local React state; no shared store or storage-event subscription. Calendar mounts useWorkouts and RecentActivityWidget mounts another instance. Across tabs each edits a stale snapshot.
- Reproduction: Open two disposable tabs before any edits; create a workout in each in turn and inspect the shared document. The stale-write path is confirmed by source; an automated concurrent UI reproduction remains to add.
- User impact: Concurrent edits can lose workouts, routines, logs or journal updates.
- Proposed solution: First characterize two writers, then centralize one writer/subscription with stale revision protection; retain serialized formats.
- Regression risk: High
- Required tests: Two tabs, two mounted consumers, rapid edits, restore while open, closed/reopened instance.

## FC-006 — Medium — Available-widget selector sorts React state in place

- Location: `client/src/hooks/use-dashboard-widgets.ts:147–149`
- Status / confidence: Confirmed / High
- Evidence: Synthetic render observes widget state order changing from later,first to first,later merely by reading selector. Enabled selector already filters before sorting.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Hidden mutation can affect render ordering and default/reset array reuse. Current Home does not mount the configurable renderer.
- Proposed solution: Sort a shallow array copy; preserve the position comparator and ties. This is the only application correction in batch A.
- Regression risk: Low
- Required tests: Unsorted input, stable equal positions, repeated reads, enabled visibility, untouched stored bytes.

## FC-007 — Medium — Inclusive calendar-day count overcounts fall DST

- Location: `client/src/lib/date-utils.ts:182–188`
- Status / confidence: Confirmed / High
- Evidence: America/New_York: 2026-11-01 to 2026-11-02 returns 3 rather than 2 because 25 hours are rounded up. Workout day denominators separately floor elapsed days at use-workouts.ts:641 and :758.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: All-time averages and consistency denominators can be wrong across DST.
- Proposed solution: Separate calculation PR: compare calendar date indices, retain local-day interpretation and historical formats.
- Regression risk: High
- Required tests: US/Europe/Australia transitions, leap/year boundaries, same day, reverse/invalid ranges.

## FC-008 — Medium — Paused workout cannot reliably resume after reload

- Location: `client/src/hooks/use-workout-duration.ts:132–162`
- Status / confidence: Confirmed / High
- Evidence: Persisted isPaused survives but pauseStartTime is memory-only and resume early-returns when it is null. stopSession also subtracts accumulated pausedTime, excluding an ongoing pause.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Paused sessions can become stuck or duration can include pause time.
- Proposed solution: Define a backwards-compatible pause recovery policy with explicit fixtures before changing persisted semantics.
- Regression risk: High
- Required tests: Pause, reload, resume, stop while paused, suspension, midnight, old currentSession shapes.

## FC-009 — Medium — Sequential goal writes overwrite one another

- Location: `client/src/hooks/use-goals.ts:75–108`
- Status / confidence: Confirmed / High
- Evidence: Fasting saves fastingHours then maxFastingHours; updateGoal spreads closed-over goals for each. Browser probe saving 18/26 leaves unified fastingHours=16, max=26, legacy fasting=18.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Different screens display different fasting targets after a save.
- Proposed solution: Use an atomic multi-goal operation or functional state update with coherent persistence; preserve legacy synchronization.
- Regression risk: Medium
- Required tests: Save two fields, reopen/reload, legacy and unified values, other goal edits.

## FC-010 — Medium — Unstable goal callback resets typed input

- Location: `client/src/pages/meditation.tsx:48–85`
- Status / confidence: Confirmed / High
- Evidence: Effect depends on newly created getDailyGoal; typing triggers rerender and effect resets input. Browser probe fills 35 and reads 20.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Cannot reliably enter a different meditation goal.
- Proposed solution: Stable callback or initialize draft only when opening/saved goal changes; retain draft on unrelated renders.
- Regression risk: Low
- Required tests: Type multi-digit goal, focus/blur, open/close, save/reload, unrelated render.

## FC-011 — Medium — Calculator ignores current Profile age

- Location: `client/src/pages/fitness-calculator.tsx:53–87`
- Status / confidence: Confirmed / High
- Evidence: Calculator reads fitcircle_profile.age, while Profile writes fitcircle_age at profile.tsx:35–37. Calculator defaults to age 25.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: BMR/calorie targets can use the wrong age; formulas themselves need not change.
- Proposed solution: Read current key with documented legacy fallback and subscribe to appropriate changes.
- Regression risk: Medium
- Required tests: Age 37 vs fallback25, legacy profile, missing/invalid age, measurement input, unchanged BMR formula.

## FC-012 — Medium — Per-100g derivation assumes all quantities are grams

- Location: `client/src/lib/local-food-service.ts:343–357`
- Status / confidence: Probable / High
- Evidence: Uses 100 / input.quantity regardless of unit; cup, ounce, piece and serving have no mass conversion. Historical generator also scales quantities without a density model.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Derived nutrition metadata can be misleading. Active meal calculations mainly use base serving values; not every displayed total is proven wrong.
- Proposed solution: Define serving/mass semantics with reference fixtures; preserve existing foods until reviewed.
- Regression risk: High
- Required tests: g/oz/cup/piece/serving/ml fixtures and round-trip legacy foods.

## FC-013 — Medium — Food edits can retain stale derived nutrition

- Location: `client/src/lib/local-food-service.ts:398–417`
- Status / confidence: Confirmed / High
- Evidence: Recomputes nutritionPer100g only for truthy input.quantity different from 100; returning a previously 50g food to 100g retains old derived values.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Stored base and derived values disagree; consumers of derived values can disagree.
- Proposed solution: Recompute or explicitly remove stale derivation according to validated unit semantics.
- Regression risk: Medium
- Required tests: 50g→100g; macro-only edits; no-quantity edits; restore compatibility.

## FC-014 — Medium — Historical edits write an additional food key for today

- Location: `client/src/pages/food-tracker.tsx:590–610`
- Status / confidence: Probable / High
- Evidence: Additional fitcircle_food_tracker + getTodayString writer uses today, while primary effect writes selectedDate; analogous edit writer later in handler.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Legacy dated key may contain a copy of a different day; backups preserve that ambiguity.
- Proposed solution: Separate compatibility PR: characterize both dated formats and date-switch effects before correcting writer date.
- Regression risk: High
- Required tests: Yesterday/today additions and edits, midnight, both key formats, backup round trips.

## FC-015 — Medium — Recent-food enumeration includes the food catalog

- Location: `client/src/pages/food-tracker.tsx:306–342`
- Status / confidence: Confirmed / High
- Evidence: Broad fitcircle_food_ prefix matches fitcircle_food_database, which is an array. Each change reparses catalog/history.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Recent list can include never-logged catalog foods and unnecessary synchronous work.
- Proposed solution: Match dated-food registry patterns; characterize ordering/unique-entry rules.
- Regression risk: Medium
- Required tests: Catalog-only origin, both dated patterns, malformed metadata, measured search/history performance.

## FC-016 — Medium — Invalid date route crashes the view

- Location: `client/src/pages/dynamic-overview.tsx:235–242`
- Status / confidence: Confirmed / High
- Evidence: Browser /dynamic-overview/not-a-date raises Invalid time value and removes main; safe startup recovery offers reload rather than rendering an invalid-date page.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Invalid deep links interrupt use and reload repeats the invalid route.
- Proposed solution: Validate route parameters and offer a safe navigation fallback; add scoped error boundary later.
- Regression risk: Low
- Required tests: Malformed dates, impossible dates, leap day, Pages 404 recovery, valid historical views.

## FC-017 — Medium — Toast notifications are never rendered by the app

- Location: `client/src/pages/food-tracker.tsx:13–14`
- Status / confidence: Confirmed / High
- Evidence: useToast is used by food flows; shared toast module exports primitives, but no mounted provider/viewport or mapped toast renderer appears in App/main/pages.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Food operation success/failure messages may be invisible.
- Proposed solution: Mount a single accessible renderer with existing UI tokens; verify errors remain visible independently of toast expiry.
- Regression risk: Medium
- Required tests: Create/edit failure, quota, dismissal, keyboard/screen reader, overlay stacking.

## FC-018 — Medium — Recovery fallback ignores modern object log entries

- Location: `client/src/hooks/use-recovery.ts:56–80`
- Status / confidence: Confirmed / High
- Evidence: Compares dayLog[id] > 0 and count < goal directly when entries are objects. Explicit zero completed days also falls through because of truthiness.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Workout totals/recovery percentage can be wrong in fallback consumers.
- Proposed solution: Reuse historical count/goal interpretation while distinguishing undefined from zero.
- Regression risk: Medium
- Required tests: Numeric and object logs; explicit 0; deleted workouts; authoritative historical goals.

## FC-019 — Medium — Saved tile orders omit newly added features

- Location: `client/src/pages/wellness.tsx:106–118`
- Status / confidence: Probable / Medium
- Evidence: Saved IDs map to defaults and filter unknown IDs without appending missing defaults.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: An older partial saved layout can leave supported tiles inaccessible through Logs.
- Proposed solution: Define compatible completion of saved order, retaining user ordering; do not blindly reset layouts.
- Regression risk: Medium
- Required tests: Partial/empty/unknown layouts, duplicates, all current IDs, restore/reload.

## FC-020 — Low — Goals and Recent Activity renderer cases remain placeholders

- Location: `client/src/components/dashboard-widgets/WidgetRenderer.tsx:47–52`
- Status / confidence: Confirmed / High
- Evidence: Concrete components exist but renderer returns text. Renderer/settings are outside current main entry graph; RecentActivityWidget itself is actively used by Calendar.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Dormant customization cannot be promoted as complete; deleting components would discard intended capability.
- Proposed solution: Retain all implementations; decide integration only after goal-schema and parity fixtures.
- Regression risk: High
- Required tests: Mount each type; ensure Calendar recent activity stays functional; compare goal algorithms.

## FC-021 — Medium — Interactive calendar cells lack keyboard semantics

- Location: `client/src/pages/calendar-new.tsx:570–595`
- Status / confidence: Confirmed / High
- Evidence: Calendar day actions are clickable divs; sidebar profile/Settings also use click-only divs in multiple pages.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Keyboard users cannot reliably activate these controls.
- Proposed solution: Use semantic buttons with accessible names and current visual styles in an isolated accessibility PR.
- Regression risk: Medium
- Required tests: Tab/Enter/Space, focus outline, screen-reader labels, existing touch interactions.

## FC-022 — Low — Reminder icon controls and hover menu need accessible names and touch review

- Location: `client/src/pages/reminders.tsx:200–225`
- Status / confidence: Probable / Medium
- Evidence: Several action buttons rely on icon/hover presentation. Existing E2E selects some by button index, evidencing missing stable accessible identity.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Discoverability and assistive interaction are weak.
- Proposed solution: Explicit names/states and touch-visible menu affordance without changing design.
- Regression risk: Low
- Required tests: Accessible-role queries, touch menu, keyboard completion/reordering/deletion.

## FC-023 — Medium — Countdown relies on interval callbacks rather than elapsed time

- Location: `client/src/pages/meditation.tsx:88–103`
- Status / confidence: Probable / High
- Evidence: Meditation subtracts one second per callback; use-timer.ts has equivalent callback counting. Browser suspension throttles timers; active meditation timer is not persisted.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Displayed elapsed/remaining time may drift after backgrounding; navigation can discard the active countdown.
- Proposed solution: Define intended background behavior; wall-clock timing and lifecycle handling in a timer-only PR.
- Regression risk: Medium
- Required tests: Suspended/late callbacks, route navigation, pause/resume, physical iOS audio/backgrounding.

## FC-024 — Low — Audio contexts are created without explicit close

- Location: `client/src/pages/meditation.tsx:114–200`
- Status / confidence: Needs Verification / Medium
- Evidence: Start/audio gong paths construct AudioContext; no corresponding close found.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Repeated sessions may retain browser audio resources.
- Proposed solution: Reuse a controlled context and close/dispose on lifecycle boundaries after audio behavior testing.
- Regression risk: Medium
- Required tests: Repeated sessions, denied autoplay, suspension, route unmount, actual iOS audio.

## FC-025 — Medium — Known dependency advisories require scoped triage

- Location: `package.json:17–54`
- Status / confidence: Confirmed / High
- Evidence: npm audit reports 37 affected package nodes (21 high/13 moderate/3 low), no critical. --omit=dev reports24 nodes: includes CSS build tooling pulled via production-listed tailwindcss-animate. These are not 37 demonstrated exploits.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Toolchain input exposure and transitive lodash advisory exposure require updates with compatibility evidence.
- Proposed solution: Upgrade related chains separately; distinguish shipped JS from production-install classification.
- Regression risk: Medium
- Required tests: Lockfile diff, check/unit/build/E2E, bundle inspection, development-server network exposure.

## FC-026 — Low — README references an absent license file

- Location: `README.md:137–139`
- Status / confidence: Confirmed / High
- Evidence: README states MIT and see LICENSE; package says MIT but no LICENSE is tracked.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Contributors cannot find the referenced license text.
- Proposed solution: Maintainer confirms copyright/license text and adds the intended file.
- Regression risk: Low
- Required tests: README link check and repository license detection.

## FC-027 — Low — Semantic color tokens are raw HSL channels

- Location: `tailwind.config.ts:14–62`
- Status / confidence: Probable / High
- Evidence: Several configured colors use var(--token) while index.css variables are HSL channel triples, requiring hsl(...) to be CSS colors. Many active screens use explicit slate/colors, so extent needs computed-style checks.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Some default semantic component colors may fail to resolve.
- Proposed solution: Isolated token correction only after computed-style coverage and screenshot review.
- Regression risk: Medium
- Required tests: Default/primary/destructive/foreground computed colors, disabled states, dark mode.

## FC-028 — Low — Built search index is not consumed by searchProducts

- Location: `client/src/lib/local-food-service.ts:199–219`
- Status / confidence: Confirmed / High
- Evidence: Index built at initialization/each mutation; searchProducts rereads whole JSON then filters/sorts directly (lines 226–285).
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: Extra allocation and repeated parsing; catalog currently465 records, historical backup29766.
- Proposed solution: Measure before optimizing; use/rebuild one coherent index or remove only after tests establish equivalent search ranking.
- Regression risk: Medium
- Required tests: Cold/warm query timings, prefix/ranking, custom edits/deletions, large synthetic catalog.

## FC-029 — Medium — Food input validation permits invalid serving/nutrition values

- Location: `client/src/lib/local-food-service.ts:307–325`
- Status / confidence: Probable / High
- Evidence: Service checks required fields/NaN but does not enforce finite positive serving quantity for all inputs. UI numeric parsing also permits some negative values. Backup food validator requires positive quantity.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: A record accepted by editing may later block a complete backup.
- Proposed solution: Align feature validation with existing backup constraints, retain invalid original bytes for correction.
- Regression risk: Medium
- Required tests: Negative/zero quantity, Infinity/NaN, negative macros, blank optional nutrients, export after create.

## FC-030 — Medium — Restore rollback has a residual failure boundary

- Location: `client/src/lib/backup.ts:113–146`
- Status / confidence: Needs Verification / Medium
- Evidence: Rollback uses browser storage and a journal; if both target writes and rollback writes fail permanently, recovery remains pending. Tests cover controlled quota/interruption but browser storage is not a transactional database.
- Reproduction: Use the isolated synthetic fixture described in the evidence; never run against an installed user profile.
- User impact: A device-level persistent storage failure can prevent immediate recovery; cannot promise absolute atomicity under browser eviction/crash.
- Proposed solution: Retain existing journal and fail-closed recovery; add persistent denial tests and explicit recovery guidance before any persistence redesign.
- Regression risk: High
- Required tests: Persistent denied storage, repeated startup recovery, failed journal write, partial rollback, physical termination.

## FC-031 — Low — Backup import has no size or resource bound

- File: client/src/pages/settings.tsx
- Line start: 69
- Line end: 94
- Evidence: FileReader.readAsText reads the selected file in full, then synchronous JSON.parse and structural validation run with no file.size/depth preflight limit.
- Reproduction: In an isolated profile choose a very large synthetic JSON file; measure responsiveness without applying the plan. Not executed with a device-scale oversized file in this audit.
- User impact: Accidental large files can consume memory or freeze the UI before an error; this is local file input, not a demonstrated remote exploit.
- Proposed solution: Add a documented reasonable byte limit and safe validation resource strategy without excluding realistic complete/legacy food backups.
- Regression risk: Medium
- Tests required: Large valid legacy/current backup fixtures, oversized rejection before read/write, malformed deep nesting, visible failure with original storage unchanged.
- Confidence: High
- Status: Probable
