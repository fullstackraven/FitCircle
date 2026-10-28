# PWA update discovery after consecutive deployments

## Investigation

- PR #101 merged as `15dcb8a61d150d7fe7c59f18cf916768fdb94a9c`; production workflow 40689352375 succeeded, publishing v2.14.0.
- PR #102 merged as `e63e1e3599d2630c706ba6293a45d007c69b8b82`; production workflow 40689401281 succeeded, publishing v2.15.0. This source contains both modernized pages.
- Pages deployment 7385776693 reports success for the latter source. Its release points to that full commit.
- Routing imports the modernized Recovery page directly. There is no separate Recovery bundle or missing merge to repair.
- The installed client's actual version cannot be inspected from this workspace. Direct HTTP access to Pages is blocked by the workspace proxy. Deployment/API/source evidence supports an older loaded PWA build as the likely explanation; this is not proof of the device's cache state.

An already loaded app can retain v2.14.0 JavaScript after v2.15.0 deploys. The existing worker installs and claims a new cache, but claiming does not replace code already executing in the page. Internal navigation continues using that code. Previously registration only ran at page load; resuming an existing installed window did not explicitly check for updates, and no notice indicated when updated code was ready.

## Focused correction

- Check for updates on visible foreground return and online reconnection; deduplicate overlapping checks and tolerate network failures.
- Observe installation/controller changes and already waiting workers. First-time installation is not advertised as an application update.
- Show a compact, theme-aware update notice linking to the existing Display refresh control. Warn users to save work first. Never navigate/reload automatically.
- Reuse the existing explicit refresh implementation; do not change service-worker cache rules, fitness storage, backups, or release calculation.

## Existing installed builds

This client-side correction itself needs to be loaded once. For the already published Recovery redesign, open **Display → Refresh FitCircle** while online, then check About for **2.15.0 or later**. If that version is loaded and the old Recovery layout persists, collect the displayed build SHA and device screenshot: the cached-build explanation would need further investigation.

## Validation

- `npm test`: 373 passed, including six update lifecycle regressions.
- `npm run check` and regression TypeScript checks passed.
- `npm run build` passed.
- `npm run audit:storage`: 164 call sites, zero errors.
- Focused browser tests exercise registration/controller-change integration using a simulated browser service-worker container, preserve unsaved Energy selection and localStorage, and reach the existing refresh control in Light/Dark mode. These are not physical iPhone tests.

No merge or production deployment is performed by this corrective PR.
