# Phase 3 regression report

## Passing validation

- `npm run check`: passed.
- `npx tsc --noEmit -p tests/tsconfig.regressions.json`: passed.
- `npm test`: **374 passed**, zero failed.
- `npm run audit:storage`: **164 call sites**, zero errors.
- `npm run build`: passed.
- Complete route matrix: **33 routes × Light/Dark × 320/390px**; document/scroll-surface bounds, shared-header geometry, back targets/alignment, visible icon-action names and text contrast pass.
- Existing form/keyboard assertions expanded across both widths/themes. Existing System-mode, viewport/safe-area, navigation, tracking, initialization, historical data, storage, backup/restore and PWA checks remain intact.
- Full local browser run: **515 passed, two failed** out of 517. Those two newly added overlay diagnostics were corrected; the affected rerun then passed **21/21**. No assertions were removed.
- Strict local visual verification without update mode: **73 passed, one failed**. The remaining one-pixel Supplements failure and subsequent isolated three-pixel Energy difference are unresolved rendering evidence, documented separately.
- CI at implementation commit `5bc2495`: prepare, storage/backup coverage, release classification and browser shards 2–4 passed. Shard 1 had **138 passes and one strict Energy screenshot failure**. The aggregate gate correctly failed. No deployment/release recording ran.

## Corrected application/presentation defects

The first full run identified a landscape overflow introduced by larger default actions; compact editors now explicitly preserve their established short-viewport geometry. Expanded 320px checks exposed the Hydration picker/amount overflow, which was corrected without changing handlers. The audit also corrected accessible icon names, supplement-label association, toast dismiss visibility/size and insufficient text/action contrast. Existing functional and data assertions remain in place.

## Unresolved test blocker

See [the bounded repeatability report](RENDERING_BLOCKER.md). Software rendering did not establish repeatability for settled Supplements edges, so no renderer/configuration change or reference update from that attempt is retained. The cause is not conclusively attributed to GPU hardware. No further investigation is included in this PR.

## Limits

Linux Chromium and simulated iPhone dimensions/safe areas/keyboard occlusion were used. No physical iPhone/PWA test is claimed. The workspace cannot download the CI reference Chrome binary. A failing required screenshot check remains a merge blocker unless separately resolved or explicitly handled by the owner; this PR is a reviewable implementation, not a claim of all-green CI.

No hooks, calculations, data keys/schemas, backups, release automation, service-worker/update code or navigation destinations were modified. No personal-data migration or dependency was added.
