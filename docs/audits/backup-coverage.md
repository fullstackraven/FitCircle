# Backup coverage and developer guide

FitCircle keeps its existing localStorage architecture and manual Settings → Download Complete Backup → save JSON to iCloud Drive workflow. No automatic cloud upload, account, database migration, new startup replacement or service-worker change is introduced by this audit. This PR does not access anyone's installed PWA records.

## Coverage

See [the inventory](persistent-storage-inventory.md) for every exact key, dynamic pattern, store, source file and inclusion/exclusion rationale. The registry in `client/src/lib/storage-registry.ts` is the shared boundary for both the current exporter and static coverage tests. Existing backup inclusion semantics remain unchanged.

All registered fitness records, settings, legacy recoverable data, both dated food-history patterns, current custom foods, and legacy `FitCircleCustomFoods/foods` records are included. Quote-selection state and old migration/backup metadata remain included for compatibility. Temporary reminder/navigation state, restore transaction journals, static offline caches and unrelated origin data are excluded. A currently pending recovery journal blocks export; recover through the existing startup path first.

No active source was missing from the pre-audit exporter. Previously downloaded version 2 backups remain accepted; legacy plain JSON is still accepted. This audit does not prove the contents of any particular past download. Old backups cannot attest to omitted sources because they lack a manifest; absent keys in those files remain legitimate partial legacy restores. Keep original files until records have been verified.

The exporter now fails rather than returning a file when a recognized value is malformed, disappears, cannot be read, or the IndexedDB read fails/blocks. Settings displays the failure reason using the existing status area; download occurs only after validation. Optional version 2 `manifest` metadata lists localStorage source identifiers and the legacy food-store record count. Restore checks the manifest before any writes. It is not a checksum, signature, or cross-tab transactional snapshot: same-length concurrent edits can still produce mixed-time data. Avoid editing in another tab during export. No personal record contents are duplicated in the manifest, but source identifiers/date-based keys are metadata; treat the whole backup as sensitive.

## Registering a persistent feature

1. Add an exact source or narrowly defined pattern to `storageSources`, with mechanism, owning feature, classification, inclusion decision and a specific rationale. Do not register a whole prefix such as `fitcircle_*`. A deliberate exclusion needs a documented reason; persistent user records normally belong in backup.
2. For structured localStorage data, add a validator to `backup.ts`; new JSON keys without a validator fail closed. Scalar entries preserve exact strings. Numeric and dated sources require corresponding validation. For a new database/store or mechanism, implement explicit export and validated restore support as well as registration; adding its name alone does not implement backup.
3. Add realistic independent fixture values in `tests/fixtures/complete-storage.ts` for every included key and representative dynamic pattern. Test validation failures and exact round trips. Document intentional normalization.
4. Run the commands below, refresh the inventory table, and review the diff. Never exempt an entire source file from analysis.

`npm test` executes the TypeScript AST audit so CI catches new unregistered storage operations. A pull-request workflow runs the same checks before merge; the existing Pages workflow also runs them on main before deployment. It follows imported constants, aliases, finite maps, template literals and string concatenation; discovers direct local/session storage, typed IndexedDB databases/stores, caches, helper calls, property access and inline HTML scripts. Unresolved dynamic keys fail unless an exact reviewed generic loop is declared in `scripts/lib/storage-boundaries.ts`. Its operation count must stay correct. Unknown filesystem/database APIs, unreviewed common persistence packages, escaped/destructured Storage methods and `clear()` fail for review. Negative tests introduce an unknown key/database/store and demonstrate failure; registering the synthetic feature explicitly demonstrates success.

This is a maintainable static guard, not a general JavaScript theorem prover. Reflection, arbitrary aliases through untyped objects, computed wrapper dispatch, new third-party persistence APIs or generated code need explicit analyzer support and code review. Do not use a boundary exemption to hide a new feature key. The full fixture also requires each included localStorage registration to have a tested value. New IndexedDB registrations need a matching exporter/restore test: the current runtime implementation supports only the documented legacy food store.

## Local verification

```bash
npm ci
npm run audit:storage
npm run audit:storage -- --json
npm run audit:storage -- --write-inventory
npm run check
npm test
npm run build
npm run test:e2e
```

Playwright uses Chromium. On a system with an existing Chromium binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; otherwise install the project's browser with `npx playwright install chromium`.

Use isolated synthetic test profiles. The complete feature fixture covers workouts/history/routines/journals, reminders, profile, goals/calculator, all wellness records, dated meals, custom/legacy foods and layout/preferences. Exported JSON is serialized/deserialized, validated, then applied to a separate in-memory target with unrelated keys; comparisons preserve IDs, dates, strings and nested values. Existing rollback, quota and interrupted-recovery tests remain in place.

To verify a real exported file, keep its original untouched. Validate with `prepareRestore(JSON.parse(text))` without applying it; inspect failures first. Only restore into a separate disposable browser profile/origin after making a backup of that target. Verify counts and representative records in the UI. Never clear a real installed app just to test restore. Missing values in a legacy file cannot be reconstructed by validation.

## Compatibility limitations

Legacy IndexedDB foods are merged into the current localStorage array. Current IDs win collisions; legacy-only IDs merge even if they are stale records previously deleted from the current array (there is no legacy deletion tombstone). Re-serialization/order and migration flag normalization are existing intentional exceptions to byte-for-byte restore. The synthetic fixture covers this merge; no deletion policy or migration was changed here.

No physical iPhone testing is performed by automated Chromium tests. Actual installed iOS PWA storage permissions/eviction, device quota, Files/iCloud saving and selecting a JSON file, app suspension during restore, and UI record verification require device testing. Browser storage remains origin- and profile-specific; it does not transfer from Replit or between devices automatically. Download daily backups as before, keep originals, and verify restored data before discarding any file.

## Feature checklist

- [ ] Identify every persistent mechanism and dynamic key construction.
- [ ] Register each source and justify any exclusion.
- [ ] Implement explicit collection and validated restore for new mechanisms.
- [ ] Add realistic fixtures, exact comparisons, and failure tests.
- [ ] Run audit, type checking, unit tests, build and browser tests.
- [ ] Refresh inventory and document migrations/compatibility limits.
- [ ] Verify sensitive-data handling and the manual backup workflow without touching real user data.
