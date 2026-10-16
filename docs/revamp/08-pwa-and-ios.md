# PWA, offline and iOS

The reviewed Pages base is /FitCircle/: Vite, Wouter, navigation, manifest start/scope/id, generated worker resources, Settings redirects and404 recovery retain this prefix. Build outputs dist/. No backend/auth/database service is required. Workflow tests/builds main before Pages upload/deploy; pull requests run the storage/type/unit checks in their own workflow. This audit PR does not merge or trigger a main deployment.

Worker cache names derive from build contents. Install precaches static resources; activation cleans only FitCircle-owned static caches. Offline app navigation has an SPA fallback, with explicit exact-document diagnostic navigation. Updates use readiness/controller checks and safe reload fallback; failed preparation leaves data intact. Settings Force Refresh is not a storage-reset mechanism. Backup startup recovery precedes React mount. Existing unit/browser tests exercise waiting/failed/offline update states, cache fallback, deep routes and failure recovery. No user records are stored in these static caches.

The current architecture uses CSS resting bounds, main as scrollport, opaque non-scrolling header/safe-area sibling, fixed independent transparent dock wrapper and measured end clearance. visualViewport dimensions govern overlays/genuine keyboard occlusion, not an idle global screen-height compensation. Normal changes do not remount the app. Reference-counted locks preserve nested overlays; dialogs have bounded internal bodies, static editor forms suppress initial input focus, close targets remain44px+. Preserve these improvements.

## Evidence classes

- **Confirmed application behavior:** current Chromium geometry reaches its exposed viewport; final Logs/Routines items clear measured dock; sidebar/calculator close and scroll locks are tested. Invalid date route triggers recovery (FC-016).
- **Historical user-reported physical evidence:** standard-status synthetic install reached the physical bottom; centered rounded dock was accepted. Existing docs record installation metadata potentially retained by iOS. These are prior observations, not fresh verification by this audit.
- **Unverified current-device behavior:** iPhone16 installed production app, compositor/system region, browser chrome, actual keyboard and home indicator, rotation/cold launch, suspension, Files/iCloud permissions and storage eviction. Chromium safe-area injection and visualViewport overrides do not simulate native WebKit.

No speculative CSS, safe-area, dock, manifest or worker edits are included. Diagnostic pages intentionally have separate install identities but share origin: they are not storage-security sandboxes; their scripts avoid fitness storage. The public geometry tool activates only after explicit Version taps and cleans its overlays/listeners. Historical before/after screenshots are reference artifacts, not fresh measurements.

Before any later viewport or worker PR: capture affected installed-instance version and geometry, reproduce exact symptom, isolate one correction, retain storage/worker rollback, run current suite, then perform physical Safari and Home Screen keyboard/rotation/background/overlay checks without uninstalling or clearing data. Never treat screen.height minus innerHeight as permission to draw into system-owned pixels.
