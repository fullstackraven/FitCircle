# Targeted Display appearance refresh workaround

Only the modern Display appearance selector invokes the new handler. It compares the current preference, uses the existing controller to save/apply synchronously, and reloads the current URL after success. A component ref prevents duplicate refresh requests while navigation is pending. No mount effect or global synchronization callback reloads the page.

The existing `/FitCircle/display` clean URL is reloaded directly. The unchanged Pages `404.html` redirect and `restorePagesRoute` recover this path through the real entry point. No route marker, new storage key, service-worker change or fallback modification is needed.

Production changes are confined to `settings.tsx`: one handler/ref and the modern selector callback. The selector markup/styles, legacy appearance handler, manual `forceRefresh`/`refreshApp` path, appearance controller, metadata, manifest, safe-area CSS, fitness data and backups are unchanged.

## Focused verification

- Application TypeScript and production build: pass.
- Regression-test TypeScript: pass.
- Four focused browser cases: pass. Counted one navigation for each changed Light/Dark/System preference, confirmed persistence and Display return, verified no navigation for an already-selected option or failed storage save, and verified OS preference changes do not reload.
- The fallback case serves the actual repository `404.html` after the appearance-triggered reload and verifies restoration to `/FitCircle/display`. Service workers are blocked only in this test to exercise the network fallback rather than a cached navigation.
- Existing root-paint and metadata assertions remain; tests selecting appearance now await the intentional navigation. The former "without reload" expectation is updated to the newly requested behavior.

This is a workaround based on successful manual-refresh behavior. Desktop Chromium checks cannot establish that native iPhone status-bar behavior is fixed. Physical iPhone PWA verification will be performed separately after approval and deployment.

No CI monitoring, merge or deployment. Classification: `release:patch`.
