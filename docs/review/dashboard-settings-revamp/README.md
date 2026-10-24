# Dashboard and settings navigation review

## Baseline and scope

Started from merged main `8d2022e` (PR #77), including Phase 5's production
Light/Dark/System controller and corrected CI rendering environment. No theme
manager, appearance bootstrap, PWA geometry, service-worker behavior, data schema,
persistence key, or fitness calculation changes.

### Existing component inventory

- Five dock pages (`home`, `calendar-new`, `routines`, `wellness`, `reminders`)
  each owned an existing Radix Sheet and local open/close state. They retain both.
- `SidebarProfileCard` already selected training history without mounting a writer;
  it now also reads the existing fitness profile for a name/objective excerpt.
- `settings.tsx` owned backup, restore, erase, Force Refresh, Controls, and Appearance.
- `AppHeader`, `App.tsx`, Sheet scroll locking, `useIOSViewportGuard`, and the dock
  already own header/viewport/scroll geometry. New pages reuse these mechanisms.
- `VersionLabel` had an unrelated hardcoded `2.1.0`; package metadata is `1.0.0`.
  The footer now uses package version; About also shows the actual build commit.

## Navigation

The shared `DashboardMenu` is rendered inside each original side sheet. Primary
entries are My Fitness Profile, Account Data, Display, Share, and About, in order.
Profile editing, personal goals, training overview, measurements, and workout
statistics remain on the original Profile page. No profile fields are duplicated
or newly persisted. Its name/objective preview uses existing selectors.

| Route | Content | Back destination |
|---|---|---|
| `/profile` | Existing profile and editors | Originating dock/dashboard |
| `/account-data` | Complete Data Backup, Danger Zone | Originating dock/dashboard, otherwise Home |
| `/display` | App Updates, Controls, Appearance | Originating dock/dashboard, otherwise Home |
| `/share` | Canonical link, copy/share, local QR | Originating dock/dashboard, otherwise Home |
| `/about` | Terms, Privacy, Licenses, Version | Originating dock/dashboard, otherwise Home |
| `/about/terms` | Terms of Service | About |
| `/about/privacy` | Privacy Policy | About |
| `/about/licenses` | Generated third-party notices | About |
| `/settings` | Existing combined compatibility screen | Existing Home default, or explicit dashboard origin |

Keeping the combined legacy entry avoids guessing whether a bookmark was intended
for backup, refresh, or appearance. It shares the same implementation; the new
menu does not link to it. Existing Settings tests still exercise compatibility.
Profile and blocked-workout/cardio recovery links now point to Account Data.
`from=dashboard` and an allowlisted `returnTo` preserve dashboard reopening on the
originating dock page. Legal pages carry the context through About. Existing Pages
404 route recovery is unchanged and tested with the new nested route.

## Reused services and data safety

`SettingsPage` accepts a presentation section (`legacy`, `account`, or `display`).
The existing `exportSnapshot`, `importSnapshot`, `handleFileChange`, `forceRefresh`,
and `eraseAllData` implementations are unchanged. Account Data renders only the
existing backup and danger sections; Display renders only updates, controls, and
appearance. Display now renders the existing status messages in its own live area.

`createBackup`, `prepareRestore`, `applyRestore`, `isAppKey`, IndexedDB compatibility,
restore recovery, manifests, and validation are untouched. The appearance selector
uses the same singleton controller and raw preference key. Controls use the same
hook and immediate persistence. No default preferences are written by navigation.

The erase action still removes recognized localStorage records only. It does not
clear legacy IndexedDB or service-worker caches. This limitation is disclosed in
Privacy rather than changing erasure scope. Tests use synthetic browser contexts.

## Share

Canonical URL: **https://fullstackraven.github.io/FitCircle/**. Copy, Web Share,
the visible link, and QR use this same constant, never the current route/origin.
The existing ZXing dependency supplies its QR encoder; no dependency was added.
Black modules on white, four-module quiet zones, and a textual link provide a
stable, accessible QR in both themes. Tests decode actual SVG screenshots at
390px and 320px and independently decode the generated module matrix.

Clipboard errors are reported without claiming success; legacy copy is checked
for its return value. Web Share is shown only where supported, awaited, and
cancellation is silent. Sharing sends only the public URL/title/description.
Offline refresh, copy, QR, and offline license loading are covered.

## Legal and privacy audit

Repository inspection found the external product lookup in
`client/src/lib/barcode-lookup.ts`: Open Food Facts receives barcode and app
identification query fields, plus ordinary network metadata. Camera frames are
decoded locally; the application does not implement image upload for scanning.
Nutrition reference/source links lead to NIH, FDA, dietary guidance, and Open Food
Facts. Fonts and application assets are bundled locally. No application analytics
SDK, advertising integration, cookie tracking, account backend, or cloud fitness
storage was found. GitHub Pages hosting can still process request metadata/logs;
the policy does not promise exclusive on-device processing.

Privacy describes localStorage, legacy IndexedDB, JSON files, caches, camera
permissions, external links, deletion limitations, browser storage loss, and user
sharing. The support link uses the actual repository's enabled GitHub issue
tracker; public submissions are distinct from FitCircle's local records. No
private email, business entity, address, or jurisdiction was invented.

Terms describe responsibilities, informational estimates, medical limitations,
no guaranteed outcomes, backup responsibility, third-party content, availability,
and liability subject to applicable law. Both documents are dated October 24, 2026.
**Owner review remains required** for legal/operator identity, legally appropriate
contact details, regional requirements, and the final legal wording. The project
also declares MIT in package metadata but has no root copyright/license notice;
the owner should finalize its own notice rather than having one invented here.

## Licenses and version

`scripts/third-party-licenses.ts` walks actual Vite output module origins and
collects installed package versions, declared licenses, and verbatim license/
notice files. Vendored Victory/D3 notices and the JetBrains Mono SIL OFL are retained.
Vite's generated browser preload helpers are distributed code, so their package
notice is included; development-server/test tooling is not otherwise shipped.
The current production build emits **77 entries** to `third-party-licenses.json`.
The normal precache automatically includes that static file; no server is needed.

Some npm packages omit license files. `scripts/license-notices/` contains actual
upstream notices, pinned source/blob provenance, and exact package-version mappings.
No license text is synthesized. Wouter and Victory notices use matching release
refs; shared Radix notices use the upstream release commit. The published
react-remove-scroll-bar gitHead is unavailable upstream, so its declared MIT
license is accompanied by the actual repository notice, with that limitation
recorded. Unknown missing notices fail the build. Review mappings on upgrades.
Development preview uses the production dependency closure (a superset of bundled
packages); production uses the actual output inventory. Pure inventory tests check
reproducibility, notices, font license, and exclusion of development-only tools.

Vite embeds `package.json.version` and `git rev-parse --short=8 HEAD` at build time.
There is no version lookup request. About therefore identifies the checked-out
build; production builds should run from the normal clean Git checkout. No arbitrary
version bump was made. GitHub's merge build can have a different commit identifier
from a local screenshot, as expected.

## Appearance, visual evidence, and accessibility

All new surfaces/text use existing semantic tokens; the QR intentionally retains
black/white contrast. New destination headers use `AppHeader` so Back stays visible
while legal and license content scroll in the existing `.app-content` owner.
No shell geometry or keyboard/safe-area implementation changes.

| View | Dark 390 | Light 390 | Dark 320 | Light 320 |
|---|---|---|---|---|
| dashboard | [View](dark-390/dashboard.png) | [View](light-390/dashboard.png) | [View](dark-320/dashboard.png) | [View](light-320/dashboard.png) |
| account-data | [View](dark-390/account-data.png) | [View](light-390/account-data.png) | [View](dark-320/account-data.png) | [View](light-320/account-data.png) |
| display | [View](dark-390/display.png) | [View](light-390/display.png) | [View](dark-320/display.png) | [View](light-320/display.png) |
| share | [View](dark-390/share.png) | [View](light-390/share.png) | [View](dark-320/share.png) | [View](light-320/share.png) |
| about | [View](dark-390/about.png) | [View](light-390/about.png) | [View](dark-320/about.png) | [View](light-320/about.png) |
| about-terms | [View](dark-390/about-terms.png) | [View](light-390/about-terms.png) | [View](dark-320/about-terms.png) | [View](light-320/about-terms.png) |
| about-privacy | [View](dark-390/about-privacy.png) | [View](light-390/about-privacy.png) | [View](dark-320/about-privacy.png) | [View](light-320/about-privacy.png) |
| about-licenses | [View](dark-390/about-licenses.png) | [View](light-390/about-licenses.png) | [View](dark-320/about-licenses.png) | [View](light-320/about-licenses.png) |

Light text-contrast readings accompany page screenshots in each Light directory.
Tests target 4.5:1 normal text and 3:1 large text, check horizontal containment,
scroll long content, and verify last controls remain above the dock. QR contrast
is intentionally black/white. Legacy Dark dim-label exceptions are retained.
Native keyboard/VoiceOver rendering still requires device review.

Original Phase 1–5 image files are preserved. Three intentional navigation changes
have separately named references rather than overwriting their originals:

- [Original dashboard](../../../tests/browser/appearance-phase-two.spec.ts-snapshots/sidebar-linux.png)
  → [New dashboard](../../../tests/browser/appearance-phase-two.spec.ts-snapshots/sidebar-revamp-linux.png).
- [Original cardio recovery](../../../tests/browser/appearance-phase-four.spec.ts-snapshots/cardio-recovery-linux.png)
  → [Account Data link](../../../tests/browser/appearance-phase-four.spec.ts-snapshots/cardio-recovery-account-data-linux.png).
- [Original workout recovery](../../../tests/browser/appearance-phase-four.spec.ts-snapshots/workout-recovery-linux.png)
  → [Account Data link](../../../tests/browser/appearance-phase-four.spec.ts-snapshots/workout-recovery-account-data-linux.png).

Every other screenshot assertion retains its original image, zero threshold, and
zero allowed differing pixels. Existing navigation tests now expect the authorized
Account Data label and metadata-derived version; assertions are retained.

## Validation

- TypeScript application check and regression check pass.
- Unit tests: 300 pass, including QR and license inventory regressions.
- Storage audit: 162 call sites, zero errors; no new persistent keys.
- Production build passes and includes generated notices.
- Initial core appearance/new-navigation run: 25 pass.
- Broader navigation/viewport/diagnostics/recovery run: 42 pass.
- Final full-suite command and outcome are recorded in the PR description/checks.

```sh
npm run check
npx tsc -p tests/tsconfig.regressions.json
npm test
npm run audit:storage
npm run build
FONTCONFIG_FILE="$PWD/tests/fixtures/screenshot-fonts.conf" \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
npm run test:e2e -- --workers=2
```

The browser override uses the reference Chromium 154 available in this workspace;
GitHub uses PR #77's pinned reference browser/font configuration. No retries,
threshold relaxation, timeout inflation, or skipped existing tests were added.

## Manual iPhone review

Not performed on a physical device. Verify Safari and the installed Home Screen PWA:

- Open/close each dock page's dashboard; confirm close remains reachable and the
  background is locked. Return from each destination to the correct dashboard.
- Review Light, Dark, and System, including an OS appearance change/background resume.
- Scroll Terms, Privacy, and expanded licenses; confirm fixed Back, status-bar safe
  area, large text, and bottom-dock clearance in portrait and landscape.
- Test profile editing with the keyboard and return to the summary.
- Scan the QR with a second device; exercise native share/cancel and clipboard
  permission failure, online and offline.
- Download a complete backup to Files, verify it exists, and restore only synthetic
  data in a separate test profile. Check native confirmation and file picker.
- Confirm Force Refresh and ordinary PWA update behavior without clearing storage
  or reinstalling the app. Never use real user records for erase testing.

No merge or deployment is performed by this PR.
