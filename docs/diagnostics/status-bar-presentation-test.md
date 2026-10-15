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
