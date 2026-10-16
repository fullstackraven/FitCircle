# Batch A: honest food saves and backup-compatible writes

Independent base: merged main `fc09b8a` (PRs #24, #26, #27). Cardio PR #28 is separate and unmerged; its tests/code are not included in this branch. The unchanged companion REMAINING_ROADMAP.md tracks actual merged fixes, not proposed ones. No original finding or audit file was deleted or relabelled completed.

## Before → after

`LocalFoodService.saveFoodsToStorage` caught quota/denial exceptions and returned normally. Create/update/delete/restore handlers then returned success, so forms closed or records disappeared despite unchanged storage. The service now propagates write failure to the existing operation catch blocks, which return failure. Failed forms remain open; delete UI only removes a record on actual success. Existing synchronous legacy helpers propagate failure rather than falsely reporting success; their signatures are unchanged, and current UI uses the handled async methods.

The app previously published food notifications to `useToast` without mounting a renderer. One renderer now uses the existing Radix toast primitives and existing dark colors, exposes an accessible dismissal, respects the top safe area and keeps errors visible until dismissed. This is necessary error reporting for FC-004, not a navigation or visual redesign. No dependencies, storage keys/formats, service worker or viewport shell code changes.

Before saving a catalog, validate against the exact existing backup food schema (exported by name, unchanged). This prevents zero/negative serving quantities and non-finite nutrition/derived values from making a newly saved catalog unexportable. Parsed/normalized Zod output is not saved: valid original values and metadata remain intact. This does not claim to correct units, stale derived nutrition or every semantically questionable finite number; FC-012/013 remain separate correctness work.

## Evidence and scope limits

Regression-first commit `bcf2626` adds 10 synthetic unit cases before production edits: 1 passed and 9 failed against the original service. Quota failure cases cover create/update/delete/restore and byte preservation. Validation cases cover zero/negative quantity, Infinity, NaN and optional Infinity. Successful create/update/delete retains compatibility with unchanged backup validation. The pre-fix browser test failed because an unsuccessful edit closed its dialog. After correction the focused browser test passes, including visible failure, exact stored bytes, reload and successful retry.

FC-004's active food catalog operation reporting and the missing notification renderer are addressed in this proposed PR. Existing food initialization parse-fallback/migration risks (FC-003), dated meal writes, external/concurrent stale writers (FC-005), broad input/formula correctness and permanent storage failures are **not fixed here**. Malformed-source recovery requires its own closely related persistence correction; do not count this as all food persistence safety or Phase 1 completion.

Tests used isolated synthetic catalogs only. Actual iPhone Safari/PWA, Files/iCloud saving and genuine device quota/eviction were not tested. Existing backup/restore and offline browser regressions remain the compatibility evidence; simulated Chromium is not a physical-device test.

## Actual full validation

All required checks passed: application TypeScript; regression TypeScript; storage audit (215 sites, zero errors); 161 unit tests; production build (existing chunk-size warning); 110 Chromium browser tests in 1.5m without retries; git diff --check. Node v24.19.0 / npm 11.9.0.

Commands: `npm run check`; `npx tsc --noEmit -p tests/tsconfig.regressions.json`; `npm run audit:storage`; `npm test`; `npm run build`; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`; `git diff --check`. Each exited 0.
