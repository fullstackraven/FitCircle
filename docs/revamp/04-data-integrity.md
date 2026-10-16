# Data integrity and storage

The existing registry and AST analyzer remain authoritative: 80 source registrations, 75 included localStorage keys/patterns, one included legacy IndexedDB store, four deliberate exclusions. Baseline `npm run audit:storage` identified 217 call sites and zero errors. A registered pattern represents many possible dated records. [Existing inventory](../audits/persistent-storage-inventory.md) traces writers; [backup guide](../audits/backup-coverage.md) describes boundary exceptions. No storage key, format, migration, backup behavior or erase action changes in this batch.

## Workout migration: FC-001/002

The initializer calls migration before effects. It triggers on positive numeric history or workouts without populated goalHistory. It orders ISO date keys and infers a goal from completion counts, including a frequency heuristic; therefore it can be deterministic for a fixed valid input without being historically correct. Equal-frequency inference cannot establish what a user originally intended. It shallow-copies the outer document and rewrites all matching log entries, including objects that already contain an authoritative goalAtTime. The synthetic fixture shows a saved goal of 20 replaced with 5. Values stabilize on the second mount in that fixture, but migration writes again because absent goalHistory is never populated. **Representation stability for one fixture is not general migration idempotency, and repeated writes are proven.**

The journal cleanup identifies estimates by a substring, not provenance; genuine `18:00:00.123Z` becomes a plain string and text is printed to console. Original backups must remain untouched. A separate minimal correction needs old numeric-only, mixed, modern, sparse, deleted-workout, zero-count, tied-frequency and goal-change fixtures. Retain authoritative values and ambiguous originals. Do not remove migration or introduce a new version marker without review.

## Writers and failure paths

| Source | Writers / concern | Required safeguard |
| --- | --- | --- |
| workout-tracker-data | Independent useWorkouts instances; calendar and recent activity mount separately; stale full-document saves | Two-consumer and two-tab characterization, shared subscription, conflict policy (FC-005) |
| fitcircle_goals and legacy goal keys | useGoals, feature-specific screens, compatibility utilities | Atomic grouped updates and fixture parity (FC-009) |
| hydration / meditation / reminders | Hook initializer fallback followed by autosave | Keep malformed original bytes and suppress fallback writes (FC-003) |
| current food database | LocalFoodService mutations and backup restore | Propagate quota failures; reject invalid edits visibly (FC-004/029) |
| dated meals | Primary selected-date effects plus legacy today writer | Characterize both patterns and date transitions (FC-014) |
| measurements | History document plus individual compatibility scalars | Historical edits must not silently choose the wrong latest scalar; explicit fixtures before consolidation |
| widget/tile layout | Hook/local page state and restore | Retain ordering, hidden/dormant preferences, missing/new feature policy |

Storage events are not a complete concurrency solution: browser events do not normally fire in the writing document, and several hooks manually dispatch only selected keys. An AST-registered writer is not proof that its read-modify-write operation is safe. Export checks enumeration length but does not provide a cross-tab snapshot; same-count concurrent edits remain a documented limitation. Browser storage denial/eviction is distinct from app deletion.

## Food migration and IndexedDB

LocalFoodService waits on readIndexedFoods before first migration. Existing localStorage IDs win against legacy IndexedDB; absent current database also seeds the bundled 465 foods minus deleted IDs. Existing empty databases intentionally remain empty. Migration keeps IndexedDB intact. A missing migration flag plus malformed current database can replace recoverable bytes. A failed first database write is caught and readiness resolves, so callers cannot infer success from ready alone.

Backup restores merge legacy-only custom foods into the current database; current IDs win collisions, but a legacy-only stale food can reappear because there is no tombstone for every past custom deletion. Preserve this known compatibility rule until a separately reviewed policy exists. `getAllFoods()` does not await readiness; async search does. Do not delete the database to simplify migration.

## Backup safety assessment

`prepareRestore` validates all recognized incoming values and creates a plan before writes. `applyRestore` snapshots only affected recognized keys, writes a rollback journal, applies, rolls back on failure and retains recovery information if rollback cannot finish. Startup invokes recovery before React reads feature stores. Unknown keys are ignored; unrelated origin keys are retained. Included current foods plus legacy custom foods and both dated meal patterns have synthetic round-trip coverage. Modern optional manifest metadata checks source/count consistency; it is not a signature, content hash, provenance guarantee or cross-tab transaction. Legacy partial backups intentionally cannot prove completeness.

Existing tests cover malformed containers, rejected nested values, quota errors, interrupted recovery, source read failure, legacy/current collisions and unrelated-key preservation. They cannot establish atomicity under permanent browser failure, device eviction, process termination, or a user's real iCloud file. Keep the manual Settings → Download Complete Backup → Files/iCloud workflow. Physical export/save/select/restore and representative record verification remain manual. No personal backup or browser profile was opened for these probes.
