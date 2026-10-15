# Separate iPhone status-bar presentation experiment

## Why this test exists

On iPhone 16 / iOS 26.6.2 (23G90), the user measured screen height 874,
inner/dvh/visual height 812, shell/main/dock bottom 812, stable at idle. They
confirmed the cyan DOM boundary coincides with the top of the visible 62px strip.
This supports investigating installed-app presentation rather than another dock
position or viewport compensation. The withdrawn PR #16 does not fix these bounds.

This experiment changes no production FitCircle status-bar metadata or layout.
It supplies two synthetic pages with distinct manifest identities and scopes:

- **FC Standard** omits `apple-mobile-web-app-status-bar-style`.
- **FC Control** retains `black-translucent`, as production FitCircle does.

Both otherwise use the same viewport-fit=cover, navy theme, CSS-sized shell,
scrolling cards, fixed dock, safe-area protection, reporting and interaction code.
Labels and installation identities necessarily differ. Neither page imports the
fitness application, reads/writes localStorage or IndexedDB, registers a worker,
restores backups, uploads data, or changes the existing installation. Distinct
manifest identities are **not a browser-storage security boundary**; these pages
avoid those APIs entirely. Reports may include device/browser information; users
choose whether to copy and share them.

## How to try it after this PR is deployed

1. Keep the existing FitCircle app installed. Open it online to allow its normal
   service-worker update, then close it.
2. In Safari, open:
   https://fullstackraven.github.io/FitCircle/viewport-test/index.html
3. Open **Standard status bar test**. Share → Add to Home Screen; keep Open as Web
   App enabled if Safari offers that switch. Launch the new **FC Standard** icon.
4. Look at the cyan line at the bottom. Does it reach the physical bottom of the
   screen, or is there still an empty strip below it? Tap the bottom control,
   scroll the last card above the dock, open/dismiss the keyboard, rotate and
   return to portrait, and cold-launch once more.
5. Tap **Copy report** and send it with that visual observation. The report is
   generated locally; copying does not upload it. If clipboard permission fails,
   the report remains selectable on the page.
6. Repeat with **Current status bar test**, installed as **FC Control**, for a
   fresh-install comparison using the existing presentation metadata.

Opening these pages in a Safari tab is insufficient to verify installation-time
presentation. If a test link opens the fitness dashboard instead, the previous
worker may still be controlling navigation. Let the normal update complete and
reopen Safari. Do not clear site data or remove the real FitCircle installation.

The new worker routes only `/FitCircle/viewport-test/` navigations to their exact
cached test documents. The SPA fallback for ordinary fitness routes is unchanged.
Tests are precached with the existing build, so no second worker is needed.

## Acceptance and interpretation

A successful candidate must reach the intended physical bottom and leave the dock
controls tappable, with safe areas respected after keyboard dismissal, rotation
and relaunch. Header/status-bar visibility must also remain usable.

**Do not require screen.height === innerHeight.** Standard presentation may reserve
the status bar *above* the web viewport. A smaller viewport is legitimate if its
bottom aligns with the physical screen. Coordinate values alone cannot distinguish
that from a displaced system-controlled strip; the physical observation matters.

- Standard reaches bottom, control does not: candidate presentation workaround;
  repeat on the affected device before proposing a production metadata change.
- Both retain a strip: metadata omission does not solve the tested case.
- Both reach bottom: original installed-host configuration/state may differ;
  do not conclude omission fixed the original app.
- Standard breaks header/keyboard/safe areas: do not promote the candidate.

Do not remove/reinstall the real app as part of this test. Any later change to
production presentation needs a separate review of installation-time behavior
and data preservation; passing this experiment does not move existing records to
a new installation or establish how iOS updates an existing app's metadata.

## Automated validation limits

Playwright checks variant metadata/manifest identities, exact-document navigation
under the production root worker, storage-API traps, unchanged origin storage and
IndexedDB database lists, scroll clearance, rotation-sized changes, bottom target
interaction, reporting and clipboard fallback. These use Chromium. They do not
simulate the iOS host or claim physical iPhone verification.

## First standard-presentation result and real-dock follow-up

The user launched **FC Standard** on the affected iPhone and confirmed its cyan
line reaches the physical bottom. Its report shows standalone=true, omitted
status style, screen=874, inner/visual/shell/main/dock=812, header padding=12px,
dock bottom padding=34px and four successful bottom-control taps. This supports
standard presentation as a candidate: the 62px difference can be occupied by the
status bar above the page. It does not prove how an existing FitCircle installation
would adopt the new metadata. A fresh FC Control comparison and keyboard/rotation/
cold-launch acceptance are still pending.

The user also thought the placeholder dock's bottom looked slightly clipped.
The cyan marker paints over the bottom 3px, including the border. The follow-up
adds **Hide cyan boundary** and replaces the placeholder with the real five-tab
FitCircle dock. The application and test share the pure `DockNavigation`
presentation component; the build renders it to static HTML for the test, copies
production `glass.css`, and supplies the same JetBrains Mono regular font. No
fitness React runtime, router or data module is imported by the test page.
Production route handling and subpage hiding remain in `BottomNavigation`.

After the follow-up is merged/deployed, allow the existing FitCircle worker to
update online, close and reopen **FC Standard**, then check:

1. The report says `"testRevision": "real-dock-v2"`. A different report means an
   older test document is still open; close/reopen after the normal update.
2. Hide the cyan boundary. Check that the rounded border, all five icons, and
   all labels remain visible, with clearance from the home indicator.
3. Tap each tab. These only change the synthetic selection/status, never open
   fitness pages. Scroll the final test card above the dock.
4. Repeat keyboard dismissal, portrait/landscape return and cold launch.
5. Copy the report and note whether the dock or controls still look clipped.

No reinstall of FC Standard is required for this HTML/style update because its
manifest identity and presentation metadata are unchanged. Do not remove the real
FitCircle installation. Tests must be served from `npm run build` output (for
example, `npm run preview`): dock HTML, CSS and font are generated into `dist/`
before the worker precache is generated.

The browser regression compares production and synthetic nav geometry, font,
SVG markup and label positions at 402×812 with a simulated 34px bottom inset.
Expected nav height is 96px, each target is 48px high, and controls finish above
the safe area. Chromium equivalence is not a physical clipping verification.

## Rounded, slimmer test capsule (v3)

The user confirms the real-icon test reaches the bottom, but its lower outline
still looks clipped in their screenshot with the cyan marker visible. The next
candidate changes only the synthetic test's shape, not production FitCircle:

- Full pill rounding instead of 24px corners.
- A 4px visual gap below the border; the fixed wrapper remains at bottom:0.
- Less top padding and bottom padding reduced by that same 4px gap. The gap counts
  toward, rather than adds to, the home-indicator clearance.
- Cyan boundary hidden by default, with the existing toggle available.

With a 34px inset, the visible capsule is 84px tall instead of 96px. Its bottom is
4px above the viewport edge. All production icons, fonts, 48px targets, and their
vertical positions remain unchanged in that configuration. The measured wrapper
includes the gap for last-card scroll clearance. No screen-height compensation,
production metadata change, storage access, or fitness feature change is made.

After deployment, close/reopen FC Standard after the normal online worker update;
confirm `"testRevision": "rounded-dock-v3"`. Inspect the outline with the cyan line
hidden, tap all five tabs, and check final-card reachability. Physical acceptance
of this new shape remains pending; Chromium tests verify the intended geometry
and unchanged safe controls, not native clipping behavior.

## Center the approved test shape's controls (v4)

The user reports the v3 dock itself is fine and asks to center its icons. The test
now divides its existing combined top/bottom padding equally, centering each
icon-and-label group vertically. Shape, width, 4px bottom gap, 84px height at the
reported 34px inset, font, icons and 48px targets are unchanged. With that inset,
padding is 17px above and below the row; controls move down 13px (bottom 790), while
the capsule bottom remains 808 in an 812px viewport. The report revision is
`centered-dock-v4`.

This is still test-only. Centering in the unchanged capsule reduces the controls'
clearance from the screen edge from 35px to 22px, placing part of each target in
the reported bottom safe inset. It does not preserve v3's full safe-area exclusion.
The affected iPhone must confirm labels remain clear of the home indicator and
all five buttons respond reliably before any production adoption. If they do not,
full safe exclusion will require revisiting the capsule height or position.
