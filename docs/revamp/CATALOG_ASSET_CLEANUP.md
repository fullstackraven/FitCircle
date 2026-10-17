# Inactive catalog asset cleanup

## Prior merge verified

PR #42 is merged at `f6f6a8f`, and its source branch was deleted. Its diff contains only historical attachment deletions, removal of the unused Vite alias, and cleanup documentation. There are no changes under application source/public assets, scripts, tests, dependencies, storage or service-worker code.

## Proposed next PR

Remove only `client/src/data/comprehensive-foods.backup.json` (13,213,141 bytes, 29,766 static catalog records). This is an unused repository asset, not an installed user's JSON backup or browser records. No code, dependency or serialized storage format is changed.

The active food service explicitly imports `client/src/data/comprehensive-foods.json`, which retains its original 465 records and exact bytes. The removed asset is a different historical catalog, not a duplicate. No source, test, package/CI command, build step or maintenance script reads it; the historical `.cjs` tools target the active filename instead. No dynamic source-data glob loads it.

Its historical contents remain recoverable from Git, without keeping the inactive file in each checkout:

```bash
git show f6f6a8f:client/src/data/comprehensive-foods.backup.json > /tmp/fitcircle-historical-catalog.json
```

Original SHA-256: `cf24adfb709e5c0f5df0bc5da121eb8762887f8f153fb364ba9ae5c851f82ca9`.

## Functional parity evidence

Built updated main with the inactive file present, recorded SHA-256 for all 56 production files, deleted it, and rebuilt. All 56 output files have identical names and bytes, including JavaScript, CSS, fonts, icons, manifest, diagnostics, entry HTML and service worker. The active catalog's SHA-256 also remains unchanged.

This reduces checkout clutter by 13.21 MB. It does not reduce the shipped app (the file was never bundled), rewrite Git history, or delete users' custom foods, meals or exported backups.

Retain the eleven historical catalog tools, goal helper, dormant widget subtree, active Calendar widget, migration tools and audit/roadmap evidence pending their separate reviews. No scripts that rewrite catalog data were run.

Actual validation results are recorded in the associated PR. Physical iPhone testing was not performed; production-byte equality and isolated Chromium workflows provide the relevant automated evidence for this asset-only change.
